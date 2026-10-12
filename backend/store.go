package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

// Record — результат ученика по одному тесту; те же поля, что и на фронте.
type Record struct {
	Attempts int  `json:"attempts"`
	Best     int  `json:"best"`
	Total    int  `json:"total"`
	Passed   bool `json:"passed"`
}

type User struct {
	ID    int64  `json:"id"`
	Login string `json:"login"`
	Name  string `json:"name"`
}

var errNoUser = errors.New("пользователь не найден")

type Store struct {
	db *sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    login         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key        TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    best       INTEGER NOT NULL DEFAULT 0,
    total      INTEGER NOT NULL DEFAULT 0,
    passed     INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
);

-- попытки тестов: итог и снимок вопросов с ответами ученика
CREATE TABLE IF NOT EXISTS attempts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key         TEXT NOT NULL,
    number      INTEGER NOT NULL,
    score       INTEGER NOT NULL,
    total       INTEGER NOT NULL,
    pass        INTEGER NOT NULL,
    passed      INTEGER NOT NULL,
    violation   TEXT NOT NULL DEFAULT '',
    seconds     INTEGER NOT NULL DEFAULT 0,
    questions   TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    UNIQUE (user_id, key, number)
);

-- начатые и ещё не сданные попытки: ученик видел вопросы, ответов пока нет
CREATE TABLE IF NOT EXISTS open_attempts (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key        TEXT NOT NULL,
    number     INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
);

-- лента истории: что ученик открывал и когда сдавал попытки
CREATE TABLE IF NOT EXISTS events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    target     TEXT NOT NULL,
    attempt_id INTEGER REFERENCES attempts(id) ON DELETE CASCADE,
    at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS events_by_user ON events (user_id, id);
`

func openStore(path string) (*Store, error) {
	// пишем редко, но пусть параллельные вкладки не ловят "database is locked"
	db, err := sql.Open("sqlite", path+"?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, err
	}

	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("схема: %w", err)
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

// secret отдаёт ключ подписи токенов: заданный в окружении или сгенерированный один раз и сохранённый.
// Так сессии переживают перезапуск даже без JWT_SECRET в конфиге.
func (s *Store) secret() ([]byte, error) {
	var stored string
	err := s.db.QueryRow(`SELECT value FROM settings WHERE key = 'jwt_secret'`).Scan(&stored)
	if err == nil {
		return base64.StdEncoding.DecodeString(stored)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return nil, err
	}

	value := base64.StdEncoding.EncodeToString(secret)
	if _, err := s.db.Exec(`INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)`, value); err != nil {
		return nil, err
	}

	return secret, nil
}

func (s *Store) createUser(login, name, hash string) (User, error) {
	res, err := s.db.Exec(
		`INSERT INTO users (login, name, password_hash, created_at) VALUES (?, ?, ?, ?)`,
		login, name, hash, time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		return User{}, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return User{}, err
	}

	return User{ID: id, Login: login, Name: name}, nil
}

func (s *Store) setPassword(login, hash string) error {
	res, err := s.db.Exec(`UPDATE users SET password_hash = ? WHERE login = ?`, hash, login)
	if err != nil {
		return err
	}

	if count, _ := res.RowsAffected(); count == 0 {
		return errNoUser
	}

	return nil
}

func (s *Store) deleteUser(login string) error {
	res, err := s.db.Exec(`DELETE FROM users WHERE login = ?`, login)
	if err != nil {
		return err
	}

	if count, _ := res.RowsAffected(); count == 0 {
		return errNoUser
	}

	return nil
}

func (s *Store) listUsers() ([]User, error) {
	rows, err := s.db.Query(`SELECT id, login, name FROM users ORDER BY login`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Login, &user.Name); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

// userByLogin отдаёт пользователя вместе с хешем пароля — только для проверки входа.
func (s *Store) userByLogin(login string) (User, string, error) {
	var user User
	var hash string

	err := s.db.QueryRow(`SELECT id, login, name, password_hash FROM users WHERE login = ?`, login).
		Scan(&user.ID, &user.Login, &user.Name, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, "", errNoUser
	}

	return user, hash, err
}

func (s *Store) userByID(id int64) (User, error) {
	var user User

	err := s.db.QueryRow(`SELECT id, login, name FROM users WHERE id = ?`, id).
		Scan(&user.ID, &user.Login, &user.Name)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, errNoUser
	}

	return user, err
}

func (s *Store) progress(userID int64) (map[string]Record, error) {
	rows, err := s.db.Query(`SELECT key, attempts, best, total, passed FROM progress WHERE user_id = ?`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := map[string]Record{}
	for rows.Next() {
		var key string
		var record Record
		if err := rows.Scan(&key, &record.Attempts, &record.Best, &record.Total, &record.Passed); err != nil {
			return nil, err
		}
		records[key] = record
	}

	return records, rows.Err()
}

// record отдаёт итог по одной теме; темы без результата — пустой итог.
func (s *Store) record(userID int64, key string) (Record, error) {
	var record Record

	err := s.db.QueryRow(`SELECT attempts, best, total, passed FROM progress WHERE user_id = ? AND key = ?`, userID, key).
		Scan(&record.Attempts, &record.Best, &record.Total, &record.Passed)
	if errors.Is(err, sql.ErrNoRows) {
		return Record{}, nil
	}

	return record, err
}

func writeProgress(tx *sql.Tx, userID int64, key string, record Record, now string) error {
	_, err := tx.Exec(
		`INSERT INTO progress (user_id, key, attempts, best, total, passed, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (user_id, key) DO UPDATE SET
		     attempts = excluded.attempts,
		     best = excluded.best,
		     total = excluded.total,
		     passed = excluded.passed,
		     updated_at = excluded.updated_at`,
		userID, key, record.Attempts, record.Best, record.Total, record.Passed, now,
	)

	return err
}

// startAttempt засчитывает попытку в итоге и помечает её начатой — одной транзакцией.
func (s *Store) startAttempt(userID int64, key string, record Record, number int) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now().UTC().Format(time.RFC3339)

	if err := writeProgress(tx, userID, key, record, now); err != nil {
		return err
	}

	_, err = tx.Exec(
		`INSERT INTO open_attempts (user_id, key, number, started_at) VALUES (?, ?, ?, ?)
		 ON CONFLICT (user_id, key) DO UPDATE SET number = excluded.number, started_at = excluded.started_at`,
		userID, key, number, now,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// openAttempt — начатая и не сданная попытка по теме, если она есть.
func (s *Store) openAttempt(userID int64, key string) (int, time.Time, bool, error) {
	var number int
	var started string

	err := s.db.QueryRow(`SELECT number, started_at FROM open_attempts WHERE user_id = ? AND key = ?`, userID, key).
		Scan(&number, &started)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, time.Time{}, false, nil
	}
	if err != nil {
		return 0, time.Time{}, false, err
	}

	at, err := time.Parse(time.RFC3339, started)
	if err != nil {
		at = time.Now()
	}

	return number, at, true, nil
}

// saveRecord пишет итог по тесту и попытку, которая к нему привела, и снимает с неё отметку «начата» —
// одной транзакцией, чтобы счётчик попыток и их история не разъезжались.
func (s *Store) saveRecord(userID int64, key string, record Record, attempt *Attempt) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now().UTC().Format(time.RFC3339)

	if err := writeProgress(tx, userID, key, record, now); err != nil {
		return err
	}

	if err := addAttempt(tx, userID, key, *attempt, now); err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM open_attempts WHERE user_id = ? AND key = ? AND number = ?`, userID, key, attempt.Number)
	if err != nil {
		return err
	}

	return tx.Commit()
}
