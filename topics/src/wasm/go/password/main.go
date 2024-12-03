package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func generatePassword(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
	password := make([]byte, length)
	for i := range password {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		password[i] = chars[num.Int64()]
	}
	return string(password)
}

func main() {
	fmt.Println(generatePassword(12)) // Пример: случайный пароль длиной 12 символов
}