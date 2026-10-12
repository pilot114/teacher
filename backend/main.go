package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
)

func main() {
	log.SetFlags(log.LstdFlags)

	// без аргументов поднимаем сервер, с "user" — управляем учётками из консоли
	if len(os.Args) > 1 && os.Args[1] == "user" {
		os.Exit(runUserCommand(os.Args[2:]))
	}

	if err := serve(); err != nil {
		log.Fatal(err)
	}
}

func serve() error {
	store, err := openStore(env("DB_PATH", "teacher.db"))
	if err != nil {
		return err
	}
	defer store.Close()

	secret, err := readSecret(store)
	if err != nil {
		return err
	}

	bank, err := loadBank()
	if err != nil {
		return fmt.Errorf("банк тестов: %w", err)
	}
	log.Printf("банк тестов: %d", len(bank))

	origins := splitList(env("ALLOW_ORIGIN", "localhost,https://pilot114.github.io"))
	ttl := time.Duration(envInt("SESSION_DAYS", 30)) * 24 * time.Hour

	address := ":" + env("PORT", "8090")
	server := &http.Server{
		Addr:              address,
		Handler:           newServer(store, secret, ttl, origins, bank).routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("слушаю %s, база %s, разрешённые источники: %s", address, env("DB_PATH", "teacher.db"), strings.Join(origins, ", "))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	<-stop
	log.Print("останавливаюсь")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return server.Shutdown(ctx)
}

func readSecret(store *Store) ([]byte, error) {
	if value := os.Getenv("JWT_SECRET"); value != "" {
		return []byte(value), nil
	}

	log.Print("JWT_SECRET не задан — беру ключ из базы")

	return store.secret()
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(os.Getenv(key))
	if err != nil || value <= 0 {
		return fallback
	}

	return value
}

func splitList(value string) []string {
	items := []string{}
	for _, item := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			items = append(items, trimmed)
		}
	}

	return items
}
