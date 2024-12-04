#!/bin/bash

for dir in go/*/; do
  NAME=$(basename "$dir")
  cd "$dir" || exit
  go mod init "$NAME"
  GOOS=js GOARCH=wasm go build -ldflags "-s -w" -o "$NAME.wasm"
  mv "$NAME.wasm" ../../../../public/go
  cd - > /dev/null || exit
done