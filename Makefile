# Makefile for AIDevelo.ai Docker Operations
.PHONY: help build build-opt test security clean deploy monitor

# Variables
IMAGE_NAME := aidevelo
REGISTRY := ghcr.io
ORG := $(shell git config --get remote.origin.url | sed 's/.*[\/:]\([^\/]*\)\/\([^.]*\).*/\1/')
REPO := $(shell git config --get remote.origin.url | sed 's/.*[\/:]\([^\/]*\)\/\([^.]*\).*/\2/')
TAG := latest
COMPOSE_FILE := docker-compose.yml
COMPOSE_PROD := docker-compose.prod.yml
COMPOSE_TEST := docker-compose.test.yml

# Colors for output
COLOR_RESET := \033[0m
COLOR_BOLD := \033[1m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_BLUE := \033[34m

##@ General

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(COLOR_BOLD)Usage:$(COLOR_RESET)\n  make $(COLOR_BLUE)<target>$(COLOR_RESET)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(COLOR_BLUE)%-15s$(COLOR_RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(COLOR_BOLD)%s$(COLOR_RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Build

build: ## Build Docker image
	@echo "$(COLOR_GREEN)Building Docker image...$(COLOR_RESET)"
	docker build -t $(IMAGE_NAME):$(TAG) .

build-opt: ## Build optimized Docker image
	@echo "$(COLOR_GREEN)Building optimized Docker image...$(COLOR_RESET)"
	docker build -f Dockerfile.optimized -t $(IMAGE_NAME):optimized .

build-no-cache: ## Build without cache
	@echo "$(COLOR_GREEN)Building Docker image without cache...$(COLOR_RESET)"
	docker build --no-cache -t $(IMAGE_NAME):$(TAG) .

build-multi: ## Build multi-platform image
	@echo "$(COLOR_GREEN)Building multi-platform image...$(COLOR_RESET)"
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE_NAME):$(TAG) .

##@ Docker Run

run: ## Run container in development mode
	@echo "$(COLOR_GREEN)Starting container...$(COLOR_RESET)"
	docker run -d -p 5000:5000 --name $(IMAGE_NAME) $(IMAGE_NAME):$(TAG)

run-it: ## Run container interactively
	@echo "$(COLOR_GREEN)Starting interactive container...$(COLOR_RESET)"
	docker run -it --rm -p 5000:5000 $(IMAGE_NAME):$(TAG)

shell: ## Open shell in running container
	@echo "$(COLOR_GREEN)Opening shell...$(COLOR_RESET)"
	docker exec -it $(IMAGE_NAME) sh

stop: ## Stop running container
	@echo "$(COLOR_YELLOW)Stopping container...$(COLOR_RESET)"
	docker stop $(IMAGE_NAME) || true
	docker rm $(IMAGE_NAME) || true

##@ Docker Compose

up: ## Start all services
	@echo "$(COLOR_GREEN)Starting all services...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) up -d

up-prod: ## Start production stack
	@echo "$(COLOR_GREEN)Starting production stack...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_PROD) up -d

down: ## Stop all services
	@echo "$(COLOR_YELLOW)Stopping all services...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) down

down-v: ## Stop all services and remove volumes
	@echo "$(COLOR_YELLOW)Stopping services and removing volumes...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) down -v

logs: ## View logs
	docker compose -f $(COMPOSE_FILE) logs -f

ps: ## List running services
	docker compose -f $(COMPOSE_FILE) ps

restart: ## Restart all services
	@echo "$(COLOR_YELLOW)Restarting services...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) restart

##@ Testing

test: ## Run all tests
	@echo "$(COLOR_GREEN)Running tests...$(COLOR_RESET)"
	npm run test

test-docker: ## Run tests in Docker
	@echo "$(COLOR_GREEN)Running tests in Docker...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_TEST) up --abort-on-container-exit
	docker compose -f $(COMPOSE_TEST) down -v

test-e2e: ## Run E2E tests
	@echo "$(COLOR_GREEN)Running E2E tests...$(COLOR_RESET)"
	npm run test:e2e

test-integration: ## Run integration tests
	@echo "$(COLOR_GREEN)Running integration tests...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_TEST) up -d postgres redis minio qdrant
	sleep 10
	npm run test:integration
	docker compose -f $(COMPOSE_TEST) down -v

##@ Security

security-scan: ## Run security scan on image
	@echo "$(COLOR_GREEN)Running security scan...$(COLOR_RESET)"
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(IMAGE_NAME):$(TAG)

security-scan-ci: ## Run security scan for CI
	@echo "$(COLOR_GREEN)Running security scan for CI...$(COLOR_RESET)"
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image --severity HIGH,CRITICAL $(IMAGE_NAME):$(TAG)

lint-dockerfile: ## Lint Dockerfile
	@echo "$(COLOR_GREEN)Linting Dockerfile...$(COLOR_RESET)"
	docker run --rm -i hadolint/hadolint < Dockerfile

lint-dockerfile-opt: ## Lint optimized Dockerfile
	@echo "$(COLOR_GREEN)Linting optimized Dockerfile...$(COLOR_RESET)"
	docker run --rm -i hadolint/hadolint < Dockerfile.optimized

image-lint: ## Lint Docker image
	@echo "$(COLOR_GREEN)Linting Docker image...$(COLOR_RESET)"
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		goodwithtech/dockle $(IMAGE_NAME):$(TAG)

##@ Analysis

inspect: ## Inspect image layers
	@echo "$(COLOR_GREEN)Inspecting image layers...$(COLOR_RESET)"
	docker history $(IMAGE_NAME):$(TAG)

dive: ## Dive into image layers (interactive)
	@echo "$(COLOR_GREEN)Analyzing image with dive...$(COLOR_RESET)"
	docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
		wagoodman/dive:latest $(IMAGE_NAME):$(TAG)

size: ## Show image size
	@echo "$(COLOR_GREEN)Image size:$(COLOR_RESET)"
	@docker images $(IMAGE_NAME):$(TAG) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

stats: ## Show container stats
	docker stats --no-stream

##@ Registry

login: ## Login to GHCR
	@echo "$(COLOR_GREEN)Logging in to GHCR...$(COLOR_RESET)"
	@echo $(GITHUB_TOKEN) | docker login $(REGISTRY) -u $(GITHUB_ACTOR) --password-stdin

tag: ## Tag image for registry
	@echo "$(COLOR_GREEN)Tagging image...$(COLOR_RESET)"
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(ORG)/$(REPO):$(TAG)

push: tag ## Push image to registry
	@echo "$(COLOR_GREEN)Pushing image to registry...$(COLOR_RESET)"
	docker push $(REGISTRY)/$(ORG)/$(REPO):$(TAG)

pull: ## Pull image from registry
	@echo "$(COLOR_GREEN)Pulling image from registry...$(COLOR_RESET)"
	docker pull $(REGISTRY)/$(ORG)/$(REPO):$(TAG)

##@ Cleanup

clean: ## Clean up containers and images
	@echo "$(COLOR_YELLOW)Cleaning up...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

clean-all: ## Remove all Docker resources
	@echo "$(COLOR_YELLOW)Removing all Docker resources...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) down -v
	docker system prune -a --volumes -f

clean-cache: ## Clean build cache
	@echo "$(COLOR_YELLOW)Cleaning build cache...$(COLOR_RESET)"
	docker buildx prune -f

##@ Database

db-migrate: ## Run database migrations
	@echo "$(COLOR_GREEN)Running migrations...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) exec aidevelo npm run migrate

db-backup: ## Backup database
	@echo "$(COLOR_GREEN)Backing up database...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) exec postgres pg_dump -U postgres aidevelo > backup_$$(date +%Y%m%d_%H%M%S).sql

db-restore: ## Restore database (requires BACKUP_FILE variable)
	@echo "$(COLOR_GREEN)Restoring database from $(BACKUP_FILE)...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) exec -T postgres psql -U postgres aidevelo < $(BACKUP_FILE)

##@ Monitoring

monitor: ## Start monitoring stack
	@echo "$(COLOR_GREEN)Starting monitoring stack...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_PROD) up -d prometheus grafana

monitor-down: ## Stop monitoring stack
	@echo "$(COLOR_YELLOW)Stopping monitoring stack...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_PROD) stop prometheus grafana

health: ## Check container health
	@echo "$(COLOR_GREEN)Checking container health...$(COLOR_RESET)"
	@docker inspect --format='{{.State.Health.Status}}' $(IMAGE_NAME) || echo "No health check configured"

##@ Development

dev: ## Start development environment
	@echo "$(COLOR_GREEN)Starting development environment...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) up -d postgres redis minio qdrant
	npm run dev

dev-full: ## Start full development stack
	@echo "$(COLOR_GREEN)Starting full development stack...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) up -d

watch: ## Watch and rebuild on changes
	@echo "$(COLOR_GREEN)Watching for changes...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_FILE) up --build

##@ CI/CD

ci-build: ## Build for CI
	@echo "$(COLOR_GREEN)Building for CI...$(COLOR_RESET)"
	DOCKER_BUILDKIT=1 docker build --cache-from $(IMAGE_NAME):latest -t $(IMAGE_NAME):$(TAG) .

ci-test: ci-build ## Run CI tests
	@echo "$(COLOR_GREEN)Running CI tests...$(COLOR_RESET)"
	docker compose -f $(COMPOSE_TEST) up --abort-on-container-exit
	docker compose -f $(COMPOSE_TEST) down -v

ci-security: ## Run CI security checks
	@echo "$(COLOR_GREEN)Running security checks...$(COLOR_RESET)"
	$(MAKE) lint-dockerfile
	$(MAKE) security-scan-ci

##@ Information

version: ## Show versions
	@echo "$(COLOR_BOLD)Versions:$(COLOR_RESET)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker compose version)"
	@echo "Node: $$(node --version)"
	@echo "NPM: $$(npm --version)"

env: ## Show environment info
	@echo "$(COLOR_BOLD)Environment:$(COLOR_RESET)"
	@echo "IMAGE_NAME: $(IMAGE_NAME)"
	@echo "TAG: $(TAG)"
	@echo "REGISTRY: $(REGISTRY)"
	@echo "ORG: $(ORG)"
	@echo "REPO: $(REPO)"

.DEFAULT_GOAL := help
