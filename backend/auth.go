package main

import (
	"crypto/hmac"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Пароль храним как pbkdf2$sha256$<итераций>$<соль>$<хеш> — всё из стандартной библиотеки, без cgo.
const (
	hashIterations = 600000
	hashLength     = 32
	saltLength     = 16
)

var errBadToken = errors.New("токен недействителен")

func hashPassword(password string) (string, error) {
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	key, err := pbkdf2.Key(sha256.New, password, salt, hashIterations, hashLength)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("pbkdf2$sha256$%d$%s$%s", hashIterations,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key)), nil
}

func checkPassword(hash, password string) bool {
	parts := strings.Split(hash, "$")
	if len(parts) != 5 || parts[0] != "pbkdf2" || parts[1] != "sha256" {
		return false
	}

	iterations, err := strconv.Atoi(parts[2])
	if err != nil {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}

	expected, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	key, err := pbkdf2.Key(sha256.New, password, salt, iterations, len(expected))
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(key, expected) == 1
}

// claims — полезная нагрузка JWT. Своя, чтобы обойтись без внешних зависимостей.
type claims struct {
	Sub   int64  `json:"sub"`
	Login string `json:"login"`
	Iat   int64  `json:"iat"`
	Exp   int64  `json:"exp"`
}

func issueToken(secret []byte, user User, ttl time.Duration) (string, time.Time, error) {
	expires := time.Now().Add(ttl)

	header, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		return "", time.Time{}, err
	}

	payload, err := json.Marshal(claims{
		Sub:   user.ID,
		Login: user.Login,
		Iat:   time.Now().Unix(),
		Exp:   expires.Unix(),
	})
	if err != nil {
		return "", time.Time{}, err
	}

	body := encodeSegment(header) + "." + encodeSegment(payload)

	return body + "." + encodeSegment(sign(secret, body)), expires, nil
}

func parseToken(secret []byte, token string) (claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return claims{}, errBadToken
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return claims{}, errBadToken
	}

	if !hmac.Equal(signature, sign(secret, parts[0]+"."+parts[1])) {
		return claims{}, errBadToken
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return claims{}, errBadToken
	}

	var parsed claims
	if err := json.Unmarshal(payload, &parsed); err != nil {
		return claims{}, errBadToken
	}

	if parsed.Exp <= time.Now().Unix() {
		return claims{}, errBadToken
	}

	return parsed, nil
}

func sign(secret []byte, body string) []byte {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(body))

	return mac.Sum(nil)
}

func encodeSegment(value []byte) string {
	return base64.RawURLEncoding.EncodeToString(value)
}
