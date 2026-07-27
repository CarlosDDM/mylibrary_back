.PHONY: logs down up up-dev test-e2e db-reset rebuild restart shell help
.DEFAULT_GOAL := help

COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

help: ## Mostra os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

logs: ## Ver logs do container app
	docker logs -f app

down: ## Derrubar os containers
	docker compose down

up: ## Subir os containers
	docker compose up -d

up-dev: ## Subir os containers em modo desenvolvimento (watch + devDependencies)
	$(COMPOSE_DEV) up -d --build

test-e2e: ## Rodar os testes e2e dentro do container app
	$(COMPOSE_DEV) exec app npm run test:e2e

# Os testes e2e não limpam o que criam — nomeUnico() evita colisão, então o
# banco só acumula. Este alvo existe para zerar quando incomodar, em vez de
# pagar o custo de um truncate em toda execução.
#
# O flush do Redis não é opcional: o seed gera UUIDs novos para status, medias
# e languages, e o GET /options fica cacheado por 7 dias. Sem limpar o cache,
# a aplicação continua servindo os ids antigos, que já não existem no banco.
db-reset: ## Zera o banco e o cache de desenvolvimento e roda o seed novamente
	@echo "==> Dropando o schema..."
	@$(COMPOSE_DEV) exec -T app npm run typeorm -- schema:drop
	@echo "==> Recriando as tabelas a partir das entities..."
	@$(COMPOSE_DEV) exec -T app npm run typeorm -- schema:sync
	@echo "==> Limpando cache e sessões..."
	@docker compose exec -T redis-cache redis-cli FLUSHALL
	@docker compose exec -T redis-session redis-cli FLUSHALL
	@echo "==> Rodando o seed..."
	@$(COMPOSE_DEV) exec -T app npm run seed

restart: ## Reiniciar os containers
	docker compose restart

rebuild: ## Rebuild e subir os containers
	docker compose up -d --build
