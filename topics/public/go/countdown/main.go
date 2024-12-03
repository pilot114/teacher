package main

import (
	"fmt"
	"time"
)

func daysUntil(targetDate string) int {
	target, _ := time.Parse("2006-01-02", targetDate)
	today := time.Now()
	return int(target.Sub(today).Hours() / 24)
}

func main() {
	fmt.Println(daysUntil("2024-12-31")) // Пример: количество дней до 31 декабря 2024
}