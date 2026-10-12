package main

import (
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Попытка теста целиком идёт через сервер:
//   - GET  /api/tests/item — заголовок теста и итог ученика; вопросов нет, пока тест не закрыт;
//   - POST /api/tests/start — попытка засчитывается сразу, ученик получает вопросы без ответов;
//   - POST /api/tests/attempt — ответы проверяет сервер, разбор отдаёт только по закрытому тесту.
// Начатая и не сданная попытка (закрыли вкладку, оборвалась связь) при следующем открытии теста
// закрывается как сорванная: иначе вопросы можно было бы смотреть сколько угодно раз.

const abandonedReason = "тест закрыли или перезагрузили страницу до проверки"

type testSummary struct {
	Title   string `json:"title"`
	TitleRu string `json:"titleRu,omitempty"`
	Count   int    `json:"count"`
}

type testView struct {
	testSummary
	Questions []QuestionView `json:"questions,omitempty"`
}

func summary(test *Test) testSummary {
	return testSummary{Title: test.Title, TitleRu: test.TitleRu, Count: len(test.Questions)}
}

// userLocks выстраивает запросы одного ученика к попыткам в очередь: начать попытку дважды
// или сдать её одновременно из двух вкладок не выйдет.
type userLocks struct {
	mu    sync.Mutex
	locks map[int64]*sync.Mutex
}

func newUserLocks() *userLocks {
	return &userLocks{locks: map[int64]*sync.Mutex{}}
}

func (l *userLocks) lock(userID int64) func() {
	l.mu.Lock()
	lock, ok := l.locks[userID]
	if !ok {
		lock = &sync.Mutex{}
		l.locks[userID] = lock
	}
	l.mu.Unlock()

	lock.Lock()

	return lock.Unlock
}

// handleTests — оглавление банка для класса: по нему фронт решает, у каких тем есть тест, и берёт русские названия
func (s *server) handleTests(w http.ResponseWriter, r *http.Request, user User) {
	grade := r.URL.Query().Get("grade")
	if grade == "" {
		writeError(w, http.StatusBadRequest, "не указан класс")
		return
	}

	tests := map[string]testSummary{}
	for key, test := range s.bank {
		if strings.HasPrefix(key, grade+"/") {
			tests[key] = summary(test)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"tests": tests})
}

func (s *server) handleTest(w http.ResponseWriter, r *http.Request, user User) {
	key := r.URL.Query().Get("key")
	test, ok := s.bank[key]
	if !ok {
		writeError(w, http.StatusNotFound, "теста по этой теме нет")
		return
	}

	defer s.attemptLocks.lock(user.ID)()

	if err := s.abandon(user.ID, key, test); err != nil {
		log.Printf("закрытие брошенной попытки %d %q: %v", user.ID, key, err)
		writeError(w, http.StatusInternalServerError, "не смог открыть тест")
		return
	}

	record, err := s.store.record(user.ID, key)
	if err != nil {
		log.Printf("чтение прогресса %d %q: %v", user.ID, key, err)
		writeError(w, http.StatusInternalServerError, "не смог открыть тест")
		return
	}

	view := testView{testSummary: summary(test)}
	if closed(record) {
		view.Questions = test.view(true)
	}

	writeJSON(w, http.StatusOK, map[string]any{"test": view, "record": record})
}

func (s *server) handleStartAttempt(w http.ResponseWriter, r *http.Request, user User) {
	var body struct {
		Key string `json:"key"`
	}

	if err := readJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "не разобрал запрос")
		return
	}

	test, ok := s.bank[body.Key]
	if !ok {
		writeError(w, http.StatusNotFound, "теста по этой теме нет")
		return
	}

	defer s.attemptLocks.lock(user.ID)()

	if err := s.abandon(user.ID, body.Key, test); err != nil {
		log.Printf("закрытие брошенной попытки %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог начать попытку")
		return
	}

	record, err := s.store.record(user.ID, body.Key)
	if err != nil {
		log.Printf("чтение прогресса %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог начать попытку")
		return
	}

	if closed(record) {
		writeError(w, http.StatusConflict, "попытки по этому тесту закончились")
		return
	}

	// попытка засчитывается, как только ученик увидел вопросы
	number := record.Attempts + 1
	record.Attempts = number
	record.Total = len(test.Questions)

	if err := s.store.startAttempt(user.ID, body.Key, record, number); err != nil {
		log.Printf("начало попытки %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог начать попытку")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"number":    number,
		"questions": test.view(false),
		"record":    record,
	})
}

func (s *server) handleSubmitAttempt(w http.ResponseWriter, r *http.Request, user User) {
	// violation — чем сорвана попытка (ушёл со вкладки, вышел из полноэкранного режима); пусто — сдана как есть
	var body struct {
		Key       string `json:"key"`
		Number    int    `json:"number"`
		Answers   []any  `json:"answers"`
		Violation string `json:"violation"`
	}

	if err := readJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "не разобрал запрос")
		return
	}

	test, ok := s.bank[body.Key]
	if !ok {
		writeError(w, http.StatusNotFound, "теста по этой теме нет")
		return
	}

	defer s.attemptLocks.lock(user.ID)()

	// Попытку уже сохранили («Сохранить ещё раз» после оборвавшегося ответа) — отдаём записанное
	// и арбитра второй раз не зовём: его решение могло бы выйти другим.
	stored, found, err := s.store.attempt(user.ID, body.Key, body.Number)
	if err != nil {
		log.Printf("чтение попытки %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог сохранить результат")
		return
	}

	if found {
		s.writeAttempt(w, user.ID, body.Key, stored)
		return
	}

	number, started, open, err := s.store.openAttempt(user.ID, body.Key)
	if err != nil {
		log.Printf("чтение начатой попытки %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог сохранить результат")
		return
	}

	if !open || number != body.Number {
		writeError(w, http.StatusConflict, "эта попытка уже закрыта — откройте тест заново")
		return
	}

	record, err := s.store.record(user.ID, body.Key)
	if err != nil {
		log.Printf("чтение прогресса %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог сохранить результат")
		return
	}

	attempt := grade(body.Key, test, body.Answers, firstRunes(strings.TrimSpace(body.Violation), 300))
	attempt.Number = number
	attempt.Seconds = secondsSince(started)

	record.Total = attempt.Total
	record.Best = max(record.Best, attempt.Score)
	record.Passed = record.Passed || attempt.Passed

	// ответы сорванной попытки не проверялись вовсе — и арбитру там делать нечего
	if attempt.Violation == "" {
		s.judge.review(user.ID, body.Key, &attempt, &record)
	}

	if err := s.store.saveRecord(user.ID, body.Key, record, &attempt); err != nil {
		log.Printf("запись попытки %d %q: %v", user.ID, body.Key, err)
		writeError(w, http.StatusInternalServerError, "не смог сохранить результат")
		return
	}

	s.writeAttempt(w, user.ID, body.Key, attempt)
}

// writeAttempt отдаёт итог попытки; правильные ответы в нём — только если тест теперь закрыт
func (s *server) writeAttempt(w http.ResponseWriter, userID int64, key string, attempt Attempt) {
	record, err := s.store.record(userID, key)
	if err != nil {
		log.Printf("чтение прогресса %d %q: %v", userID, key, err)
		writeError(w, http.StatusInternalServerError, "не смог прочитать результат")
		return
	}

	attempt.Questions = redact(attempt.Questions, closed(record))

	writeJSON(w, http.StatusOK, map[string]any{"record": record, "attempt": attempt})
}

// abandon закрывает начатую и не сданную попытку как сорванную: ответы до сервера не дошли, засчитано 0
func (s *server) abandon(userID int64, key string, test *Test) error {
	number, started, open, err := s.store.openAttempt(userID, key)
	if err != nil || !open {
		return err
	}

	record, err := s.store.record(userID, key)
	if err != nil {
		return err
	}

	attempt := grade(key, test, nil, abandonedReason)
	attempt.Number = number
	attempt.Seconds = secondsSince(started)

	return s.store.saveRecord(userID, key, record, &attempt)
}

// вкладку с тестом могли забыть открытой на ночь — длительность ограничиваем сутками
func secondsSince(started time.Time) int {
	return min(max(int(time.Since(started).Seconds()), 0), maxAttemptSeconds)
}
