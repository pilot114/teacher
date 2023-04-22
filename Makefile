build_image:
	@docker build -t teacher .

enter:
	@docker run -it -v $(PWD):/app -w /app teacher sh