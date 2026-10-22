# teacher: программы для домашнего обучения
# Цели одинаковые во всех проектах ~/projects — см. make help.
.DEFAULT_GOAL := help

.PHONY: help
help: ## эта справка
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-12s %s\n", $$1, $$2}'

.PHONY: install
install: ## зависимости всех частей
	cd math && npm ci
	cd topics && npm ci
	cd letters && npm ci
	cd backend && go mod download

.PHONY: dev
dev: ## topics на :5173 (бэкенд: cd backend && DB_PATH=… go run .)
	cd topics && npm run dev

.PHONY: build
build: ## topics → docs/ (GitHub Pages), math, бэкенд
	cd topics && npm run build
	cd math && npm run build
	cd backend && go build -o teacher-api .

.PHONY: audit
audit: ## уязвимости
	cd math && npm audit
	cd topics && npm audit
	cd letters && npm audit
	cd backend && go run golang.org/x/vuln/cmd/govulncheck@latest ./...

.PHONY: outdated
outdated: ## устаревшие зависимости
	cd math && npm outdated || true
	cd topics && npm outdated || true
	cd letters && npm outdated || true
	cd backend && go list -m -u all | grep '\[' || true
