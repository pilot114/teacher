package main

import (
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type server struct {
	store   *Store
	secret  []byte
	ttl     time.Duration
	origins []string
	logins  *loginLimiter
	judge   *judge
	bank    Bank
	// попытки одного ученика обрабатываем по очереди
	attemptLocks *userLocks
}

func newServer(store *Store, secret []byte, ttl time.Duration, origins []string, bank Bank) *server {
	return &server{
		store:        store,
		secret:       secret,
		ttl:          ttl,
		origins:      origins,
		logins:       newLoginLimiter(),
		judge:        newJudge(),
		bank:         bank,
		attemptLocks: newUserLocks(),
	}
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/login", s.handleLogin)
	mux.Handle("GET /api/me", s.authorized(s.handleMe))
	mux.Handle("GET /api/progress", s.authorized(s.handleProgress))
	mux.Handle("GET /api/tests", s.authorized(s.handleTests))
	mux.Handle("GET /api/tests/item", s.authorized(s.handleTest))
	mux.Handle("POST /api/tests/start", s.authorized(s.handleStartAttempt))
	mux.Handle("POST /api/tests/attempt", s.authorized(s.handleSubmitAttempt))
	mux.Handle("GET /api/history", s.authorized(s.handleHistory))
	mux.Handle("POST /api/history/event", s.authorized(s.handleAddEvent))
	mux.Handle("GET /api/history/attempts", s.authorized(s.handleAttempts))

	return s.cors(mux)
}

// cors: фронт лежит на другом домене (GitHub Pages), поэтому без заголовков браузер запросы не выпустит.
func (s *server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if s.allowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *server) allowed(origin string) bool {
	if origin == "" {
		return false
	}

	for _, item := range s.origins {
		if item == "*" || item == origin {
			return true
		}

		// "localhost" в списке разрешает любой локальный порт: у dev-сервера он плавает
		if item == "localhost" && isLocalhost(origin) {
			return true
		}
	}

	return false
}

func isLocalhost(origin string) bool {
	host, ok := strings.CutPrefix(origin, "http://")
	if !ok {
		return false
	}

	name, _, _ := strings.Cut(host, ":")

	return name == "localhost" || name == "127.0.0.1"
}

// authorized пускает дальше только с живым токеном в заголовке Authorization.
func (s *server) authorized(next func(http.ResponseWriter, *http.Request, User)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		token, found := strings.CutPrefix(header, "Bearer ")
		if !found {
			writeError(w, http.StatusUnauthorized, "нужна авторизация")
			return
		}

		parsed, err := parseToken(s.secret, strings.TrimSpace(token))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "сессия истекла, войдите заново")
			return
		}

		// учётку могли удалить, пока токен ещё жив
		user, err := s.store.userByID(parsed.Sub)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "сессия истекла, войдите заново")
			return
		}

		next(w, r, user)
	})
}

func (s *server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	if err := readJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "не разобрал запрос")
		return
	}

	body.Login = strings.TrimSpace(body.Login)
	if body.Login == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "логин и пароль обязательны")
		return
	}

	if !s.logins.allow(clientIP(r)) {
		writeError(w, http.StatusTooManyRequests, "слишком много попыток, подождите немного")
		return
	}

	user, hash, err := s.store.userByLogin(body.Login)
	if err != nil || !checkPassword(hash, body.Password) {
		if err != nil && !errors.Is(err, errNoUser) {
			log.Printf("вход %q: %v", body.Login, err)
		}

		s.logins.fail(clientIP(r))
		writeError(w, http.StatusUnauthorized, "неверный логин или пароль")
		return
	}

	s.logins.reset(clientIP(r))

	token, expires, err := issueToken(s.secret, user, s.ttl)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не смог выдать токен")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"token":     token,
		"expiresAt": expires.UTC().Format(time.RFC3339),
		"user":      user,
	})
}

func (s *server) handleMe(w http.ResponseWriter, r *http.Request, user User) {
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *server) handleProgress(w http.ResponseWriter, r *http.Request, user User) {
	records, err := s.store.progress(user.ID)
	if err != nil {
		log.Printf("чтение прогресса %d: %v", user.ID, err)
		writeError(w, http.StatusInternalServerError, "не смог прочитать прогресс")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"records": records})
}

// ключ — "класс/предмет|тема", как его собирает фронт в testKey()
func validKey(key string) bool {
	if len(key) == 0 || len(key) > 300 {
		return false
	}

	subject, topic, found := strings.Cut(key, "|")

	return found && subject != "" && topic != ""
}

// мегабайта хватает на весь прогресс за год; больше принимать незачем
func readJSON(w http.ResponseWriter, r *http.Request, target any) error {
	return json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("ответ: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func clientIP(r *http.Request) string {
	// за реверс-прокси реальный адрес приезжает заголовком
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		return strings.TrimSpace(strings.Split(forwarded, ",")[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
}

// loginLimiter гасит перебор пароля: после десяти промахов с адреса вход закрыт на четверть часа.
type loginLimiter struct {
	mu       sync.Mutex
	attempts map[string]*attempt
}

type attempt struct {
	count int
	until time.Time
}

const (
	maxLoginFailures = 10
	loginLockout     = 15 * time.Minute
)

func newLoginLimiter() *loginLimiter {
	return &loginLimiter{attempts: map[string]*attempt{}}
}

func (l *loginLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	current, ok := l.attempts[ip]
	if !ok {
		return true
	}

	if time.Now().After(current.until) {
		delete(l.attempts, ip)
		return true
	}

	return current.count < maxLoginFailures
}

func (l *loginLimiter) fail(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	current, ok := l.attempts[ip]
	if !ok || time.Now().After(current.until) {
		current = &attempt{}
		l.attempts[ip] = current
	}

	current.count++
	current.until = time.Now().Add(loginLockout)
}

func (l *loginLimiter) reset(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	delete(l.attempts, ip)
}
