package main

import (
	"fmt"
)

func calculator(a float64, b float64, operation string) string {
	switch operation {
	case "+":
		return fmt.Sprintf("%.2f", a+b)
	case "-":
		return fmt.Sprintf("%.2f", a-b)
	case "*":
		return fmt.Sprintf("%.2f", a*b)
	case "/":
		if b != 0 {
			return fmt.Sprintf("%.2f", a/b)
		}
		return "Деление на ноль"
	default:
		return "Неизвестная операция"
	}
}

func main() {
	fmt.Println(calculator(10, 5, "+")) // Пример: 10 + 5 = 15
}