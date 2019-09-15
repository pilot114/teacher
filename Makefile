help:
	@echo ""
	@echo "usage: make COMMAND"
	@echo ""
	@echo "Commands:"
	@echo " enter"
	@echo " build_linux"
	@echo " build_win"
	@echo " build_android"
	@echo " build_extension"

enter:
	@docker run -it -u workspace -v $(PWD):/app -w /app pilot114/any-vue zsh

# others run in container
build_linux:
	@npm run build:linux

build_win:
	@npm run build:win32

build_android:
	@cordova build android

build_extension:
	@echo 'TODO'
