---
title: Streamlining Local Development with Docker Compose
slug: docker-compose-development-en
description: Master Docker Compose for local development environments with practical examples covering multi-service setups, volume management, and development workflows.
summary: Learn how to use **Docker Compose** to create reproducible development environments, manage multi-service applications, and streamline your local development workflow.
keywords: [docker, docker compose, devops, containers, local development]
media: https://media.giphy.com/media/6AFldi5xJQYIo/giphy.gif
tags:
- DevOps
- Docker
- Development
- Tutorial
draft: true
---

## Introduction

"It works on my machine" is a phrase that has haunted developers for decades. Docker Compose elegantly solves this problem by defining your entire development environment as code. With a single `docker-compose.yml` file, every team member can spin up an identical environment in seconds.

This guide covers practical Docker Compose patterns for local development, from simple single-service setups to complex multi-container applications.

## Basic Docker Compose Structure

A typical `docker-compose.yml` for a web application:

{{< highlight yaml >}}
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
{{< / highlight >}}

## Development Dockerfile Best Practices

Create a separate `Dockerfile.dev` optimized for development:

{{< highlight dockerfile >}}
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Development command with hot reload
CMD ["npm", "run", "dev"]
{{< / highlight >}}

> **Pro tip:** Use `.dockerignore` to exclude `node_modules`, `.git`, and other unnecessary files from the build context.

## Volume Mounting Strategies

Understanding volume mounts is crucial for development:

{{< highlight yaml >}}
services:
  app:
    volumes:
      # Bind mount - sync local files to container
      - .:/app

      # Anonymous volume - preserve container's node_modules
      - /app/node_modules

      # Named volume - persist data across restarts
      - app_cache:/app/.cache
{{< / highlight >}}

### Volume Types Comparison

| Type | Syntax | Use Case | Persists |
|------|--------|----------|----------|
| Bind Mount | `./src:/app/src` | Live code editing | N/A (host files) |
| Anonymous | `/app/node_modules` | Isolate dependencies | No |
| Named | `data:/var/data` | Database storage | Yes |

## Multi-Environment Configuration

Use override files for environment-specific settings:

{{< highlight yaml >}}
# docker-compose.yml (base configuration)
version: '3.8'
services:
  app:
    image: myapp:latest
    environment:
      - NODE_ENV=production
{{< / highlight >}}

{{< highlight yaml >}}
# docker-compose.override.yml (auto-loaded in development)
version: '3.8'
services:
  app:
    build: .
    volumes:
      - .:/app
    environment:
      - NODE_ENV=development
      - DEBUG=true
{{< / highlight >}}

## Health Checks

Ensure services are ready before dependent services start:

{{< highlight yaml >}}
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    depends_on:
      db:
        condition: service_healthy
{{< / highlight >}}

## Debugging Containers

Add debugging capabilities to your development setup:

{{< highlight yaml >}}
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugger port
    command: node --inspect=0.0.0.0:9229 src/index.js
{{< / highlight >}}

## Useful Development Scripts

Create a `Makefile` for common operations:

{{< highlight makefile >}}
.PHONY: up down logs shell db-shell reset

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

shell:
	docker-compose exec app sh

db-shell:
	docker-compose exec db psql -U user -d myapp

reset:
	docker-compose down -v
	docker-compose up -d
{{< / highlight >}}

## Networking Between Services

Services communicate using their service name as hostname:

{{< highlight javascript >}}
// In your Node.js app
const dbConfig = {
  host: 'db',        // Service name from docker-compose.yml
  port: 5432,
  database: 'myapp',
  user: 'user',
  password: 'pass'
};

const redisConfig = {
  host: 'redis',     // Service name
  port: 6379
};
{{< / highlight >}}

## Hot Reload Configuration

Ensure hot reload works properly in containers:

{{< highlight yaml >}}
services:
  app:
    volumes:
      - .:/app
    environment:
      - CHOKIDAR_USEPOLLING=true  # For webpack/vite in Docker
      - WATCHPACK_POLLING=true    # Alternative for some bundlers
{{< / highlight >}}

## Managing Secrets in Development

Never commit real secrets. Use environment files:

{{< highlight yaml >}}
services:
  app:
    env_file:
      - .env.development
    environment:
      - SECRET_KEY=${SECRET_KEY}  # From .env file
{{< / highlight >}}

Create a `.env.development.example` to document required variables:

{{< highlight bash >}}
# .env.development.example
DATABASE_URL=postgres://user:pass@db:5432/myapp
REDIS_URL=redis://redis:6379
SECRET_KEY=your-secret-key-here
{{< / highlight >}}

## Performance Optimization

Speed up your Docker development experience:

{{< highlight yaml >}}
services:
  app:
    build:
      context: .
      cache_from:
        - myapp:dev-cache
    volumes:
      # Use delegated for better performance on macOS
      - .:/app:delegated
{{< / highlight >}}

## Common Issues and Solutions

### Container won't start
Check logs with `docker-compose logs <service>` and verify your Dockerfile builds correctly.

### File changes not detected
Ensure polling is enabled for file watchers, especially on macOS and Windows.

### Port already in use
Change the host port mapping: `"3001:3000"` instead of `"3000:3000"`.

### Out of disk space
Run `docker system prune -a` to clean up unused images and containers.

## Conclusion

Docker Compose transforms local development by providing consistent, reproducible environments. Key practices to remember:

- Use separate Dockerfiles for development and production
- Leverage volume mounts for live code editing
- Implement health checks for reliable service startup
- Create helper scripts for common operations
- Keep secrets out of version control

With these patterns, you'll eliminate environment-related bugs and onboard new team members faster than ever.
