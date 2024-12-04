package main

import (
	"os"
)

func main() {
	for _, arg := range os.Args {
		os.Stdout.WriteString("arg: " + arg + "\n")
	}

	for _, env := range os.Environ() {
		os.Stdout.WriteString("env: " + env + "\n")
	}

	buf := make([]byte, 1024)
    n, _ := os.Stdin.Read(buf)
    if n > 0 {
        os.Stdout.WriteString("from stdin: ")
        os.Stdout.Write(buf[:n])
        os.Stdout.WriteString("\n")
    }

    os.Stdout.WriteString("stdout message!\n")
    os.Stderr.WriteString("stderr message!\n")

	code := 0
	if len(os.Args) > 1 {
		code = 42
	}
	os.Exit(code)
}
