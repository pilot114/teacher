package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

// Attempt — одна попытка теста. Questions — снимок вопросов с ответами ученика и эталоном (см. grade):
// он хранится как есть, чтобы разбор не зависел от правок банка тестов. Наружу снимок уходит через redact.
type Attempt struct {
	Number     int             `json:"number"`
	Score      int             `json:"score"`
	Total      int             `json:"total"`
	Pass       int             `json:"pass"`
	Passed     bool            `json:"passed"`
	Violation  string          `json:"violation"`
	Seconds    int             `json:"seconds"`
	Questions  json.RawMessage `json:"questions,omitempty"`
	FinishedAt string          `json:"finishedAt,omitempty"`
}

// HistoryItem — строка ленты. Для попытки к ней приложен итог, но без снимка вопросов.
type HistoryItem struct {
	ID      int64    `json:"id"`
	Type    string   `json:"type"`
	Target  string   `json:"target"`
	At      string   `json:"at"`
	Attempt *Attempt `json:"attempt,omitempty"`
}

// что фронт вправе записать в ленту сам; попытки попадают туда только вместе с результатом теста
const (
	eventTheory   = "theory"
	eventPractice = "practice"
	eventTest     = "test"
	eventAttempt  = "attempt"
)

const (
	maxAttemptSeconds = 24 * 60 * 60
	historyPageSize   = 50
	historyPageMax    = 200
)

func (s *Store) addEvent(userID int64, kind, target string) error {
	_, err := s.db.Exec(
		`INSERT INTO events (user_id, type, target, at) VALUES (?, ?, ?, ?)`,
		userID, kind, target, time.Now().UTC().Format(time.RFC3339),
	)

	return err
}

// addAttempt сохраняет попытку и отмечает её в ленте. Повторная отправка той же попытки
// (кнопка «Сохранить ещё раз») ничего не дублирует: номер попытки по теме уникален.
func addAttempt(tx *sql.Tx, userID int64, key string, attempt Attempt, now string) error {
	res, err := tx.Exec(
		`INSERT INTO attempts (user_id, key, number, score, total, pass, passed, violation, seconds, questions, finished_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (user_id, key, number) DO NOTHING`,
		userID, key, attempt.Number, attempt.Score, attempt.Total, attempt.Pass, attempt.Passed,
		attempt.Violation, attempt.Seconds, string(attempt.Questions), now,
	)
	if err != nil {
		return err
	}

	if count, _ := res.RowsAffected(); count == 0 {
		return nil
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}

	_, err = tx.Exec(
		`INSERT INTO events (user_id, type, target, attempt_id, at) VALUES (?, ?, ?, ?, ?)`,
		userID, eventAttempt, key, id, now,
	)

	return err
}

// history отдаёт ленту от новых к старым: записи с id меньше before, не больше limit штук.
// types сужает ленту до событий этих типов; пустой список — все события.
func (s *Store) history(userID, before int64, limit int, types []string) ([]HistoryItem, bool, error) {
	filter := ""
	args := []any{userID, before}
	if len(types) > 0 {
		filter = " AND e.type IN (?" + strings.Repeat(", ?", len(types)-1) + ")"
		for _, kind := range types {
			args = append(args, kind)
		}
	}
	args = append(args, limit+1)

	rows, err := s.db.Query(
		`SELECT e.id, e.type, e.target, e.at,
		        a.number, a.score, a.total, a.pass, a.passed, a.violation, a.seconds
		 FROM events e
		 LEFT JOIN attempts a ON a.id = e.attempt_id
		 WHERE e.user_id = ? AND e.id < ?`+filter+`
		 ORDER BY e.id DESC
		 LIMIT ?`,
		args...,
	)
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()

	items := []HistoryItem{}
	for rows.Next() {
		var item HistoryItem
		var number, score, total, pass, seconds sql.NullInt64
		var passed sql.NullBool
		var violation sql.NullString

		err := rows.Scan(&item.ID, &item.Type, &item.Target, &item.At,
			&number, &score, &total, &pass, &passed, &violation, &seconds)
		if err != nil {
			return nil, false, err
		}

		if number.Valid {
			item.Attempt = &Attempt{
				Number:    int(number.Int64),
				Score:     int(score.Int64),
				Total:     int(total.Int64),
				Pass:      int(pass.Int64),
				Passed:    passed.Bool,
				Violation: violation.String,
				Seconds:   int(seconds.Int64),
			}
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, false, err
	}

	// лишняя строка значит, что за этой страницей есть ещё
	more := len(items) > limit
	if more {
		items = items[:limit]
	}

	return items, more, nil
}

// attempt ищет уже сохранённую попытку по её номеру.
func (s *Store) attempt(userID int64, key string, number int) (Attempt, bool, error) {
	var attempt Attempt
	var questions string

	err := s.db.QueryRow(
		`SELECT number, score, total, pass, passed, violation, seconds, questions, finished_at
		 FROM attempts
		 WHERE user_id = ? AND key = ? AND number = ?`,
		userID, key, number,
	).Scan(&attempt.Number, &attempt.Score, &attempt.Total, &attempt.Pass, &attempt.Passed,
		&attempt.Violation, &attempt.Seconds, &questions, &attempt.FinishedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Attempt{}, false, nil
	}
	if err != nil {
		return Attempt{}, false, err
	}

	attempt.Questions = json.RawMessage(questions)

	return attempt, true, nil
}

// attempts отдаёт все попытки одного теста по порядку, вместе со снимками вопросов.
func (s *Store) attempts(userID int64, key string) ([]Attempt, error) {
	rows, err := s.db.Query(
		`SELECT number, score, total, pass, passed, violation, seconds, questions, finished_at
		 FROM attempts
		 WHERE user_id = ? AND key = ?
		 ORDER BY number`,
		userID, key,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	attempts := []Attempt{}
	for rows.Next() {
		var attempt Attempt
		var questions string

		err := rows.Scan(&attempt.Number, &attempt.Score, &attempt.Total, &attempt.Pass, &attempt.Passed,
			&attempt.Violation, &attempt.Seconds, &questions, &attempt.FinishedAt)
		if err != nil {
			return nil, err
		}

		attempt.Questions = json.RawMessage(questions)
		attempts = append(attempts, attempt)
	}

	return attempts, rows.Err()
}

func (s *server) handleAddEvent(w http.ResponseWriter, r *http.Request, user User) {
	var body struct {
		Type   string `json:"type"`
		Target string `json:"target"`
	}

	if err := readJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "не разобрал запрос")
		return
	}

	if !validEvent(body.Type, body.Target) {
		writeError(w, http.StatusBadRequest, "неверное событие")
		return
	}

	if err := s.store.addEvent(user.ID, body.Type, body.Target); err != nil {
		log.Printf("событие %d %s %q: %v", user.ID, body.Type, body.Target, err)
		writeError(w, http.StatusInternalServerError, "не смог записать событие")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *server) handleHistory(w http.ResponseWriter, r *http.Request, user User) {
	before, err := strconv.ParseInt(r.URL.Query().Get("before"), 10, 64)
	if err != nil || before <= 0 {
		before = 1<<63 - 1
	}

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = historyPageSize
	}
	limit = min(limit, historyPageMax)

	types := []string{}
	for _, kind := range splitList(r.URL.Query().Get("type")) {
		if !knownEvent(kind) {
			writeError(w, http.StatusBadRequest, "неизвестный тип события: "+kind)
			return
		}
		types = append(types, kind)
	}

	items, more, err := s.store.history(user.ID, before, limit, types)
	if err != nil {
		log.Printf("чтение истории %d: %v", user.ID, err)
		writeError(w, http.StatusInternalServerError, "не смог прочитать историю")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": items, "more": more})
}

func (s *server) handleAttempts(w http.ResponseWriter, r *http.Request, user User) {
	key := r.URL.Query().Get("key")
	if !validKey(key) {
		writeError(w, http.StatusBadRequest, "неверный ключ темы")
		return
	}

	attempts, err := s.store.attempts(user.ID, key)
	if err != nil {
		log.Printf("чтение попыток %d %q: %v", user.ID, key, err)
		writeError(w, http.StatusInternalServerError, "не смог прочитать попытки")
		return
	}

	record, err := s.store.record(user.ID, key)
	if err != nil {
		log.Printf("чтение прогресса %d %q: %v", user.ID, key, err)
		writeError(w, http.StatusInternalServerError, "не смог прочитать попытки")
		return
	}

	// правильные ответы в разборе — только когда тест закрыт, как и в самом тесте
	for index := range attempts {
		attempts[index].Questions = redact(attempts[index].Questions, closed(record))
	}

	writeJSON(w, http.StatusOK, map[string]any{"attempts": attempts})
}

func knownEvent(kind string) bool {
	return kind == eventTheory || kind == eventPractice || kind == eventTest || kind == eventAttempt
}

func validEvent(kind, target string) bool {
	switch kind {
	case eventTheory, eventTest:
		return validKey(target)
	case eventPractice:
		return target != "" && utf8.RuneCountInString(target) <= 100
	default:
		return false
	}
}
