package main

import (
	"path/filepath"
	"testing"
)

// после сброса счётчика попытки снова даются, а номера в истории продолжаются, а не начинаются с 1
func TestResetFailed(t *testing.T) {
	store, err := openStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	user, err := store.createUser("kid", "Kid", "hash")
	if err != nil {
		t.Fatal(err)
	}

	const failed, passed = "seven/math|failed", "seven/math|passed"
	for number := 1; number <= maxAttempts; number++ {
		attempt := Attempt{Number: number, Total: 7, Questions: []byte("[]")}
		if err := store.saveRecord(user.ID, failed, Record{Attempts: number, Total: 7}, &attempt); err != nil {
			t.Fatal(err)
		}
	}
	attempt := Attempt{Number: 1, Total: 7, Passed: true, Questions: []byte("[]")}
	if err := store.saveRecord(user.ID, passed, Record{Attempts: 1, Total: 7, Passed: true}, &attempt); err != nil {
		t.Fatal(err)
	}

	keys, err := store.resetFailed("kid")
	if err != nil || len(keys) != 1 || keys[0] != failed {
		t.Fatalf("resetFailed = %v, %v", keys, err)
	}

	record, _ := store.record(user.ID, failed)
	if record.Attempts != 0 || closed(record) {
		t.Fatalf("после сброса %+v", record)
	}

	if number, err := store.nextAttempt(user.ID, failed); err != nil || number != maxAttempts+1 {
		t.Fatalf("nextAttempt = %d, %v", number, err)
	}

	if _, err := store.resetFailed("nobody"); err != errNoUser {
		t.Fatalf("неизвестный логин: %v", err)
	}
}
