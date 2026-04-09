---
title: Building RESTful APIs with Go and Chi Router
slug: building-rest-apis-with-go-en
description: Learn how to build production-ready RESTful APIs using Go and the Chi router, covering routing, middleware, error handling, and best practices.
summary: A comprehensive guide to building **scalable REST APIs** with Go and Chi router, including middleware patterns, structured error handling, and testing strategies.
keywords: [go, golang, rest api, chi router, backend development]
media: https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif
tags:
- Development
- Backend
- Go
- Tutorial
- REST API
draft: true
---

## Introduction

Go has become one of the most popular languages for building backend services, and for good reason. Its simplicity, excellent concurrency support, and blazing-fast compilation make it ideal for building RESTful APIs. In this guide, we'll explore how to build a production-ready API using Go and the Chi router.

Chi is a lightweight, idiomatic router for Go that's built on the standard `net/http` package. Unlike heavier frameworks, Chi embraces Go's philosophy of simplicity while providing powerful routing and middleware capabilities.

## Setting Up the Project

Let's start by initializing a new Go module and installing Chi:

{{< highlight bash >}}
mkdir go-api && cd go-api
go mod init github.com/yourusername/go-api
go get -u github.com/go-chi/chi/v5
go get -u github.com/go-chi/chi/v5/middleware
{{< / highlight >}}

## Basic Router Setup

Here's how to set up a basic Chi router with common middleware:

{{< highlight go >}}
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // Middleware stack
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(60 * time.Second))

    // Routes
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Welcome to the API"))
    })

    r.Route("/api/v1", func(r chi.Router) {
        r.Mount("/users", userRoutes())
        r.Mount("/posts", postRoutes())
    })

    log.Println("Server starting on :8080")
    http.ListenAndServe(":8080", r)
}
{{< / highlight >}}

## Structuring Your Handlers

A clean handler structure is essential for maintainability. Here's a pattern that works well:

{{< highlight go >}}
type UserHandler struct {
    userService UserService
    logger      *log.Logger
}

func NewUserHandler(us UserService, l *log.Logger) *UserHandler {
    return &UserHandler{
        userService: us,
        logger:      l,
    }
}

func (h *UserHandler) Routes() chi.Router {
    r := chi.NewRouter()

    r.Get("/", h.ListUsers)
    r.Post("/", h.CreateUser)
    r.Route("/{userID}", func(r chi.Router) {
        r.Use(h.UserCtx)
        r.Get("/", h.GetUser)
        r.Put("/", h.UpdateUser)
        r.Delete("/", h.DeleteUser)
    })

    return r
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
    users, err := h.userService.List(r.Context())
    if err != nil {
        h.respondError(w, r, err)
        return
    }
    h.respondJSON(w, r, http.StatusOK, users)
}
{{< / highlight >}}

## Custom Middleware

Creating custom middleware in Chi is straightforward:

{{< highlight go >}}
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        // Validate token and extract user
        user, err := validateToken(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Add user to context
        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
{{< / highlight >}}

## Error Handling

Consistent error handling improves API usability:

{{< highlight go >}}
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func (h *Handler) respondError(w http.ResponseWriter, r *http.Request, err error) {
    var apiErr *APIError

    switch {
    case errors.Is(err, ErrNotFound):
        apiErr = &APIError{Code: 404, Message: "Resource not found"}
    case errors.Is(err, ErrValidation):
        apiErr = &APIError{Code: 400, Message: "Validation failed", Details: err.Error()}
    default:
        apiErr = &APIError{Code: 500, Message: "Internal server error"}
        h.logger.Printf("Unexpected error: %v", err)
    }

    h.respondJSON(w, r, apiErr.Code, apiErr)
}
{{< / highlight >}}

## Request Validation

Use a validation library for cleaner input handling:

{{< highlight go >}}
type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Name     string `json:"name" validate:"required,min=2,max=100"`
    Password string `json:"password" validate:"required,min=8"`
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.respondError(w, r, ErrInvalidJSON)
        return
    }

    if err := h.validator.Struct(req); err != nil {
        h.respondError(w, r, fmt.Errorf("%w: %v", ErrValidation, err))
        return
    }

    user, err := h.userService.Create(r.Context(), req)
    if err != nil {
        h.respondError(w, r, err)
        return
    }

    h.respondJSON(w, r, http.StatusCreated, user)
}
{{< / highlight >}}

## Middleware Comparison

| Middleware | Purpose | When to Use |
|------------|---------|-------------|
| RequestID | Adds unique ID to each request | Always - essential for tracing |
| Logger | Logs request details | Development and production |
| Recoverer | Recovers from panics | Always - prevents crashes |
| Timeout | Sets request timeout | Production - prevents hanging |
| RealIP | Extracts real client IP | Behind load balancer/proxy |
| Compress | Gzip compression | Large response payloads |

## Testing Your API

Chi makes testing easy since it's built on `net/http`:

{{< highlight go >}}
func TestGetUser(t *testing.T) {
    // Setup
    mockService := &MockUserService{}
    handler := NewUserHandler(mockService, log.Default())

    // Create request
    req := httptest.NewRequest("GET", "/users/123", nil)
    w := httptest.NewRecorder()

    // Create router and serve
    r := chi.NewRouter()
    r.Mount("/users", handler.Routes())
    r.ServeHTTP(w, req)

    // Assertions
    assert.Equal(t, http.StatusOK, w.Code)

    var user User
    json.Unmarshal(w.Body.Bytes(), &user)
    assert.Equal(t, "123", user.ID)
}
{{< / highlight >}}

## Conclusion

Go and Chi provide an excellent foundation for building RESTful APIs. The combination of Go's performance and Chi's elegant routing makes it easy to create maintainable, production-ready services. Key takeaways:

- Use Chi's middleware stack for cross-cutting concerns
- Structure handlers around services for testability
- Implement consistent error handling patterns
- Validate all input at the handler level
- Write tests using the standard `httptest` package

The simplicity of this stack means less magic to debug and more control over your application's behavior.
