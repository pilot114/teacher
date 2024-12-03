package main

import (
	"fmt"
)

func isEven(number int) string {
	if number%2 == 0 {
		return "Чётное"
	}
	return "Нечётное"
}

func main() {
	fmt.Println(isEven(7)) // Пример: "Нечётное"
}