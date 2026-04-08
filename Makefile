SHELL := /bin/bash

PROJECT_NAME := risc
ROOT_DIR := $(CURDIR)
BACKEND_DIR := $(ROOT_DIR)/backend
FRONTEND_DIR := $(ROOT_DIR)/frontend
RUN_DIR := $(ROOT_DIR)/.run

BACKEND_PORT ?= 8080
FRONTEND_PORT ?= 5173

BACKEND_PID_FILE := $(RUN_DIR)/backend.pid

.PHONY: help backend-install frontend-install install backend-dev frontend-dev backend-start backend-stop dev-up clean

help:
	@echo "Available targets:"
	@echo "  make install       - install frontend dependencies"
	@echo "  make backend-dev   - run Spring Boot backend in foreground"
	@echo "  make frontend-dev  - run Vite frontend in foreground"
	@echo "  make dev-up        - start backend first, then frontend"
	@echo "  make backend-stop  - stop background backend started by dev-up"
	@echo "  make clean         - remove local runtime files"

backend-install:
	@echo "Backend uses Maven wrapper-free setup; ensure mvn and JDK 21 are installed."

frontend-install:
	cd $(FRONTEND_DIR) && npm install

install: backend-install frontend-install

backend-dev:
	cd $(BACKEND_DIR) && mvn -Dspring-boot.run.fork=false spring-boot:run

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev -- --host 0.0.0.0 --port $(FRONTEND_PORT)

backend-start:
	@mkdir -p $(RUN_DIR)
	@if [ -f "$(BACKEND_PID_FILE)" ] && kill -0 "$$(cat "$(BACKEND_PID_FILE)")" 2>/dev/null; then \
		echo "Backend already running with PID $$(cat "$(BACKEND_PID_FILE)")"; \
	else \
		cd $(BACKEND_DIR) && nohup mvn -Dspring-boot.run.fork=false spring-boot:run > "$(RUN_DIR)/backend.log" 2>&1 & echo $$! > "$(BACKEND_PID_FILE)"; \
		echo "Backend started with PID $$(cat "$(BACKEND_PID_FILE)")"; \
	fi

backend-stop:
	@if [ -f "$(BACKEND_PID_FILE)" ] && kill -0 "$$(cat "$(BACKEND_PID_FILE)")" 2>/dev/null; then \
		kill "$$(cat "$(BACKEND_PID_FILE)")"; \
		rm -f "$(BACKEND_PID_FILE)"; \
		echo "Backend stopped"; \
	else \
		rm -f "$(BACKEND_PID_FILE)"; \
		echo "Backend is not running"; \
	fi

dev-up: backend-start
	@echo "Waiting for backend health endpoint on port $(BACKEND_PORT)..."
	@until curl -fsS "http://127.0.0.1:$(BACKEND_PORT)/api/health" >/dev/null 2>&1; do sleep 2; done
	@echo "Backend is ready; starting frontend."
	cd $(FRONTEND_DIR) && npm run dev -- --host 0.0.0.0 --port $(FRONTEND_PORT)

clean: backend-stop
	rm -rf $(RUN_DIR)
