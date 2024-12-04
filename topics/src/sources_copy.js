const sources = {
    php: {
        'hello_world': `<?php
echo "hello world!";`,
        'calculator': `<?php
function calculator($a, $b, $operation) {
    switch ($operation) {
        case '+': return $a + $b;
        case '-': return $a - $b;
        case '*': return $a * $b;
        case '/': return $b != 0 ? $a / $b : 'Деление на ноль';
        default: return 'Неизвестная операция';
    }
}

echo calculator(10, 5, '+');`,
        'is_even': `<?php
function isEven($number) {
    return $number % 2 == 0 ? "Чётное" : "Нечётное";
}

echo isEven(7);`,
        'password': `<?php
function generatePassword($length = 8) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $password;
}

echo generatePassword(12);`,
        'countdown': `<?php
function daysUntil($date) {
    $target = strtotime($date);
    $today = strtotime(date('Y-m-d'));
    return ceil(($target - $today) / 86400);
}

echo daysUntil('2024-12-31');`,
    },
    python: {
        'hello_world': 'print("Hello, World!")',
        'calculator': `def calculator(a, b, operation):
    if operation == '+':
        return a + b
    elif operation == '-':
        return a - b
    elif operation == '*':
        return a * b
    elif operation == '/':
        return a / b if b != 0 else 'Деление на ноль'
    else:
        return 'Неизвестная операция'

print(calculator(10, 5, '+'))`,
        'is_even': `def is_even(number):
    return "Чётное" if number % 2 == 0 else "Нечётное"

print(is_even(7))`,
        'password': `import random
import string

def generate_password(length=8):
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choice(chars) for _ in range(length))

print(generate_password(12))`,
        'countdown': `from datetime import datetime

def days_until(target_date):
    target = datetime.strptime(target_date, '%Y-%m-%d')
    today = datetime.today()
    return (target - today).days

print(days_until('2024-12-31'))`,
    },
    go: {
        'hello_world': `package main
import "fmt"
func main() {
    fmt.Println("hello world")
}`,
        'calculator': `package main

import (
\t"fmt"
)

func calculator(a float64, b float64, operation string) string {
\tswitch operation {
\tcase "+":
\t\treturn fmt.Sprintf("%.2f", a+b)
\tcase "-":
\t\treturn fmt.Sprintf("%.2f", a-b)
\tcase "*":
\t\treturn fmt.Sprintf("%.2f", a*b)
\tcase "/":
\t\tif b != 0 {
\t\t\treturn fmt.Sprintf("%.2f", a/b)
\t\t}
\t\treturn "Деление на ноль"
\tdefault:
\t\treturn "Неизвестная операция"
\t}
}

func main() {
\tfmt.Println(calculator(10, 5, "+")) // Пример: 10 + 5 = 15
}`,
        'is_even': `package main

import (
\t"fmt"
)

func isEven(number int) string {
\tif number%2 == 0 {
\t\treturn "Чётное"
\t}
\treturn "Нечётное"
}

func main() {
\tfmt.Println(isEven(7)) // Пример: "Нечётное"
}`,
        'password': `package main

import (
\t"crypto/rand"
\t"fmt"
\t"math/big"
)

func generatePassword(length int) string {
\tconst chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
\tpassword := make([]byte, length)
\tfor i := range password {
\t\tnum, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
\t\tpassword[i] = chars[num.Int64()]
\t}
\treturn string(password)
}

func main() {
\tfmt.Println(generatePassword(12)) // Пример: случайный пароль длиной 12 символов
}`,
        'countdown': `package main

import (
\t"fmt"
\t"time"
)

func daysUntil(targetDate string) int {
\ttarget, _ := time.Parse("2006-01-02", targetDate)
\ttoday := time.Now()
\treturn int(target.Sub(today).Hours() / 24)
}

func main() {
\tfmt.Println(daysUntil("2024-12-31")) // Пример: количество дней до 31 декабря 2024
}`,
        'check_io': `package main

import (
\t"os"
)

func main() {
\tfor _, arg := range os.Args {
\t\tos.Stdout.WriteString("arg: " + arg + "\\n")
\t}

\tfor _, env := range os.Environ() {
\t\tos.Stdout.WriteString("env: " + env + "\\n")
\t}

\tbuf := make([]byte, 1024)
    n, _ := os.Stdin.Read(buf)
    if n > 0 {
        os.Stdout.WriteString("from stdin: ")
        os.Stdout.Write(buf[:n])
        os.Stdout.WriteString("\\n")
    }

    os.Stdout.WriteString("stdout message!\\n")
    os.Stderr.WriteString("stderr message!\\n")

\tcode := 0
\tif len(os.Args) > 1 {
\t\tcode = 42
\t}
\tos.Exit(code)
}

`,
    },
}

export { sources };