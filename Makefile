.PHONY: logs down up rebuild restart shell help
.DEFAULT_GOAL := help

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

logs: ## Ver logs do container app
	docker logs -f app

down: ## Derrubar os containers
	docker compose down

up: ## Subir os containers
	docker compose up -d

restart: ## Reiniciar os containers
	docker compose restart

rebuild: ## Rebuild e subir os containers
	docker compose up -d --build
