package main

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strings"
)

const userUsage = `Управление учётками:
  teacher-api user list
  teacher-api user add <логин> [имя]
  teacher-api user password <логин>
  teacher-api user delete <логин>

Пароль спрашивается в консоли или берётся из переменной PASSWORD.`

func runUserCommand(args []string) int {
	if len(args) == 0 {
		fmt.Println(userUsage)
		return 1
	}

	store, err := openStore(env("DB_PATH", "teacher.db"))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer store.Close()

	switch args[0] {
	case "list":
		return listUsers(store)
	case "add":
		return addUser(store, args[1:])
	case "password":
		return changePassword(store, args[1:])
	case "delete":
		return deleteUser(store, args[1:])
	default:
		fmt.Println(userUsage)
		return 1
	}
}

func listUsers(store *Store) int {
	users, err := store.listUsers()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	if len(users) == 0 {
		fmt.Println("учёток пока нет")
		return 0
	}

	for _, user := range users {
		fmt.Printf("%d\t%s\t%s\n", user.ID, user.Login, user.Name)
	}

	return 0
}

func addUser(store *Store, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "нужен логин")
		return 1
	}

	login := strings.TrimSpace(args[0])
	name := strings.Join(args[1:], " ")
	if name == "" {
		name = login
	}

	password, err := askPassword()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	hash, err := hashPassword(password)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	user, err := store.createUser(login, name, hash)
	if err != nil {
		fmt.Fprintln(os.Stderr, "не смог завести учётку: ", err)
		return 1
	}

	fmt.Printf("создан пользователь %s (id %d)\n", user.Login, user.ID)

	return 0
}

func changePassword(store *Store, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "нужен логин")
		return 1
	}

	password, err := askPassword()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	hash, err := hashPassword(password)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	if err := store.setPassword(strings.TrimSpace(args[0]), hash); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	fmt.Println("пароль изменён")

	return 0
}

func deleteUser(store *Store, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "нужен логин")
		return 1
	}

	if err := store.deleteUser(strings.TrimSpace(args[0])); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}

	fmt.Println("учётка удалена вместе с её прогрессом")

	return 0
}

// пароль берём из окружения (удобно для скриптов) или спрашиваем в консоли
func askPassword() (string, error) {
	if value := os.Getenv("PASSWORD"); value != "" {
		return value, nil
	}

	fmt.Print("Пароль: ")
	reader := bufio.NewReader(os.Stdin)
	line, err := reader.ReadString('\n')
	if err != nil && line == "" {
		return "", err
	}

	password := strings.TrimSpace(line)
	if len(password) < 6 {
		return "", errors.New("пароль короче шести символов")
	}

	return password, nil
}
