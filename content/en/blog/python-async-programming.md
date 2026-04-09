---
title: "Async Programming in Python: asyncio Deep Dive"
slug: python-async-programming-en
description: Master Python's asyncio library with practical examples covering coroutines, tasks, event loops, and patterns for building high-performance async applications.
summary: Deep dive into **Python asyncio**, understanding coroutines, tasks, event loops, and practical patterns for writing efficient asynchronous code.
keywords: [python, asyncio, async, concurrency, backend]
media: https://media.giphy.com/media/KAq5w47R9rmTuvWOWa/giphy.gif
tags:
- Development
- Python
- Backend
- Tutorial
- Performance
draft: true
---

## Introduction

Asynchronous programming in Python has evolved significantly with asyncio becoming a core part of the language. Understanding async/await is essential for building high-performance web servers, API clients, and I/O-bound applications.

This guide covers asyncio from fundamentals to advanced patterns, with practical examples you can use in production code.

## The Basics: Coroutines and await

A coroutine is a function defined with `async def` that can be paused and resumed:

{{< highlight python >}}
import asyncio

async def fetch_data(url: str) -> dict:
    print(f"Fetching {url}...")
    await asyncio.sleep(1)  # Simulates I/O operation
    return {"url": url, "data": "response"}

async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

# Run the event loop
asyncio.run(main())
{{< / highlight >}}

Key concepts:
- `async def` defines a coroutine function
- `await` pauses execution until the awaited coroutine completes
- `asyncio.run()` creates an event loop and runs the coroutine

## Concurrent Execution with Tasks

Tasks allow coroutines to run concurrently:

{{< highlight python >}}
import asyncio
import time

async def fetch_data(id: int, delay: float) -> dict:
    print(f"Task {id}: Starting")
    await asyncio.sleep(delay)
    print(f"Task {id}: Complete")
    return {"id": id, "delay": delay}

async def main():
    start = time.perf_counter()

    # Create tasks for concurrent execution
    tasks = [
        asyncio.create_task(fetch_data(1, 2)),
        asyncio.create_task(fetch_data(2, 1)),
        asyncio.create_task(fetch_data(3, 3)),
    ]

    # Wait for all tasks to complete
    results = await asyncio.gather(*tasks)

    elapsed = time.perf_counter() - start
    print(f"Completed in {elapsed:.2f}s")  # ~3s, not 6s
    print(results)

asyncio.run(main())
{{< / highlight >}}

## gather vs wait vs TaskGroup

| Method | Use Case | Error Handling |
|--------|----------|----------------|
| `gather()` | Run tasks, get results in order | `return_exceptions=True` to continue on error |
| `wait()` | Fine-grained control over completion | Returns done/pending sets |
| `TaskGroup` | Structured concurrency (Python 3.11+) | Cancels all on first error |

### Using asyncio.gather

{{< highlight python >}}
async def main():
    # All results returned in order
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2),
        fetch_data(3),
        return_exceptions=True  # Don't raise, return exceptions
    )

    for result in results:
        if isinstance(result, Exception):
            print(f"Error: {result}")
        else:
            print(f"Success: {result}")
{{< / highlight >}}

### Using asyncio.wait

{{< highlight python >}}
async def main():
    tasks = {
        asyncio.create_task(fetch_data(i))
        for i in range(5)
    }

    # Wait for first completion
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_COMPLETED
    )

    print(f"Completed: {len(done)}, Pending: {len(pending)}")

    # Cancel remaining tasks
    for task in pending:
        task.cancel()
{{< / highlight >}}

### Using TaskGroup (Python 3.11+)

{{< highlight python >}}
async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data(1))
        task2 = tg.create_task(fetch_data(2))
        task3 = tg.create_task(fetch_data(3))

    # All tasks complete when exiting context
    # If any task raises, all others are cancelled
    print(task1.result(), task2.result(), task3.result())
{{< / highlight >}}

## Timeouts and Cancellation

### Setting Timeouts

{{< highlight python >}}
async def main():
    try:
        # Timeout after 2 seconds
        async with asyncio.timeout(2):
            result = await slow_operation()
    except asyncio.TimeoutError:
        print("Operation timed out")

    # Alternative: wait_for
    try:
        result = await asyncio.wait_for(slow_operation(), timeout=2.0)
    except asyncio.TimeoutError:
        print("Operation timed out")
{{< / highlight >}}

### Handling Cancellation

{{< highlight python >}}
async def cancellable_operation():
    try:
        while True:
            print("Working...")
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        print("Cleanup before cancellation")
        raise  # Re-raise to propagate cancellation

async def main():
    task = asyncio.create_task(cancellable_operation())
    await asyncio.sleep(3)
    task.cancel()

    try:
        await task
    except asyncio.CancelledError:
        print("Task was cancelled")
{{< / highlight >}}

## Async Context Managers and Iterators

### Async Context Manager

{{< highlight python >}}
class AsyncDatabaseConnection:
    async def __aenter__(self):
        print("Opening connection")
        await asyncio.sleep(0.1)  # Simulate connection
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Closing connection")
        await asyncio.sleep(0.1)  # Simulate cleanup
        return False

    async def query(self, sql: str):
        await asyncio.sleep(0.1)
        return [{"id": 1}, {"id": 2}]

async def main():
    async with AsyncDatabaseConnection() as db:
        results = await db.query("SELECT * FROM users")
        print(results)
{{< / highlight >}}

### Async Iterator

{{< highlight python >}}
class AsyncPaginator:
    def __init__(self, total_pages: int):
        self.total_pages = total_pages
        self.current_page = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.current_page >= self.total_pages:
            raise StopAsyncIteration

        self.current_page += 1
        await asyncio.sleep(0.1)  # Simulate API call
        return {"page": self.current_page, "items": [1, 2, 3]}

async def main():
    async for page in AsyncPaginator(5):
        print(page)
{{< / highlight >}}

## Semaphores for Rate Limiting

Control concurrency with semaphores:

{{< highlight python >}}
import aiohttp

async def fetch_with_limit(
    session: aiohttp.ClientSession,
    semaphore: asyncio.Semaphore,
    url: str
) -> dict:
    async with semaphore:  # Limits concurrent requests
        async with session.get(url) as response:
            return await response.json()

async def main():
    urls = [f"https://api.example.com/item/{i}" for i in range(100)]

    # Maximum 10 concurrent requests
    semaphore = asyncio.Semaphore(10)

    async with aiohttp.ClientSession() as session:
        tasks = [
            fetch_with_limit(session, semaphore, url)
            for url in urls
        ]
        results = await asyncio.gather(*tasks)

    print(f"Fetched {len(results)} items")
{{< / highlight >}}

## Queues for Producer-Consumer

{{< highlight python >}}
async def producer(queue: asyncio.Queue, n: int):
    for i in range(n):
        await asyncio.sleep(0.1)  # Simulate work
        await queue.put({"id": i, "data": f"item_{i}"})
        print(f"Produced item {i}")
    await queue.put(None)  # Signal completion

async def consumer(queue: asyncio.Queue, name: str):
    while True:
        item = await queue.get()
        if item is None:
            queue.task_done()
            break
        print(f"{name} processing {item}")
        await asyncio.sleep(0.2)  # Simulate processing
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=5)

    # Start producer and multiple consumers
    producer_task = asyncio.create_task(producer(queue, 10))
    consumer_tasks = [
        asyncio.create_task(consumer(queue, f"Consumer-{i}"))
        for i in range(3)
    ]

    await producer_task
    await queue.join()  # Wait for all items to be processed

    # Stop consumers
    for _ in consumer_tasks:
        await queue.put(None)
{{< / highlight >}}

## Real-World Example: Async HTTP Client

{{< highlight python >}}
import aiohttp
import asyncio
from dataclasses import dataclass
from typing import Optional

@dataclass
class ApiResponse:
    status: int
    data: Optional[dict]
    error: Optional[str] = None

class AsyncApiClient:
    def __init__(self, base_url: str, max_concurrent: int = 10):
        self.base_url = base_url
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self._session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()

    async def get(self, endpoint: str) -> ApiResponse:
        async with self.semaphore:
            try:
                url = f"{self.base_url}{endpoint}"
                async with self._session.get(url) as response:
                    data = await response.json()
                    return ApiResponse(status=response.status, data=data)
            except Exception as e:
                return ApiResponse(status=0, data=None, error=str(e))

    async def get_many(self, endpoints: list[str]) -> list[ApiResponse]:
        tasks = [self.get(endpoint) for endpoint in endpoints]
        return await asyncio.gather(*tasks)

# Usage
async def main():
    async with AsyncApiClient("https://api.example.com") as client:
        # Single request
        response = await client.get("/users/1")
        print(response)

        # Multiple concurrent requests
        endpoints = [f"/users/{i}" for i in range(1, 11)]
        responses = await client.get_many(endpoints)
        print(f"Fetched {len(responses)} users")

asyncio.run(main())
{{< / highlight >}}

## Common Pitfalls

### 1. Forgetting to await

{{< highlight python >}}
# ❌ Wrong - coroutine never runs
async def main():
    fetch_data()  # Returns coroutine object, doesn't execute

# ✅ Correct
async def main():
    await fetch_data()
{{< / highlight >}}

### 2. Blocking the Event Loop

{{< highlight python >}}
# ❌ Wrong - blocks all async operations
async def main():
    time.sleep(1)  # Blocking!

# ✅ Correct
async def main():
    await asyncio.sleep(1)

# For CPU-bound work, use executor
async def main():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, cpu_intensive_function)
{{< / highlight >}}

## Conclusion

Python's asyncio provides powerful tools for writing concurrent code. The key is understanding when to use async (I/O-bound operations) and how to properly structure concurrent tasks.

Key takeaways:
- Use `async/await` for I/O-bound operations
- `gather()` for running tasks concurrently
- `TaskGroup` for structured concurrency (Python 3.11+)
- Semaphores for rate limiting
- Queues for producer-consumer patterns
- Never block the event loop with synchronous I/O
