---
title: "System Design: Caching Strategies at Scale"
slug: system-design-caching-en
description: Master caching strategies for scalable systems including cache invalidation patterns, distributed caching, and real-world implementation considerations.
summary: Deep dive into **caching strategies** for scalable systems, covering cache patterns, invalidation strategies, and distributed caching with Redis and CDNs.
keywords: [system design, caching, redis, performance, architecture]
media: https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif
tags:
- Architecture
- System Design
- Performance
- Redis
- Backend
draft: true
---

## Introduction

Caching is one of the most effective tools for improving system performance and scalability. A well-designed caching strategy can reduce latency by orders of magnitude, decrease database load, and handle traffic spikes gracefully.

This guide covers caching patterns from basic strategies to distributed systems considerations.

## Why Cache?

Benefits of caching:
- **Reduced latency**: Memory access is ~100x faster than disk, ~1000x faster than network
- **Decreased database load**: Fewer queries hitting your database
- **Cost savings**: Handle more traffic with fewer resources
- **Improved availability**: Serve cached data even if backend is down

## Caching Layers

{{< highlight text >}}
Client → CDN → Load Balancer → App Server → Cache → Database
  │       │                        │          │
  │       │                        │          └─ Redis/Memcached
  │       │                        └─ In-Memory Cache
  │       └─ Edge Cache (CloudFront, Fastly)
  └─ Browser Cache
{{< / highlight >}}

| Layer | Latency | Use Case |
|-------|---------|----------|
| Browser | 0ms | Static assets, API responses |
| CDN | 10-50ms | Static content, API edge caching |
| App Memory | < 1ms | Hot data, session state |
| Distributed Cache | 1-5ms | Shared state, database query results |
| Database Cache | 5-20ms | Query results (built-in) |

## Cache Patterns

### Cache-Aside (Lazy Loading)

Application manages cache explicitly:

{{< highlight javascript >}}
async function getUser(userId) {
    // 1. Check cache
    const cached = await redis.get(`user:${userId}`);
    if (cached) {
        return JSON.parse(cached);
    }

    // 2. Cache miss - fetch from database
    const user = await db.users.findById(userId);
    if (!user) {
        return null;
    }

    // 3. Populate cache
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

    return user;
}
{{< / highlight >}}

**Pros**: Only requested data is cached, cache failure doesn't break the app
**Cons**: Cache miss penalty, potential stale data

### Write-Through

Write to cache and database together:

{{< highlight javascript >}}
async function updateUser(userId, data) {
    // 1. Update database
    const user = await db.users.update(userId, data);

    // 2. Update cache immediately
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

    return user;
}
{{< / highlight >}}

**Pros**: Cache always consistent with database
**Cons**: Write latency increased, unused data may be cached

### Write-Behind (Write-Back)

Write to cache, asynchronously sync to database:

{{< highlight javascript >}}
async function updateUser(userId, data) {
    // 1. Update cache immediately
    const user = { ...await getUser(userId), ...data };
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

    // 2. Queue database write
    await queue.add('sync-user', { userId, data });

    return user;
}

// Background worker
queue.process('sync-user', async (job) => {
    await db.users.update(job.data.userId, job.data.data);
});
{{< / highlight >}}

**Pros**: Fast writes, reduced database load
**Cons**: Risk of data loss, eventual consistency

### Read-Through

Cache handles database reads transparently:

{{< highlight javascript >}}
// Using a cache library with read-through support
const cache = new Cache({
    ttl: 3600,
    fetchMethod: async (key) => {
        const userId = key.replace('user:', '');
        return await db.users.findById(userId);
    },
});

// Usage - cache handles fetching
const user = await cache.get(`user:${userId}`);
{{< / highlight >}}

## Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### Time-Based Expiration (TTL)

{{< highlight javascript >}}
// Simple TTL
await redis.setex('user:123', 3600, data);  // Expires in 1 hour

// Sliding expiration
async function getWithSlidingExpiry(key) {
    const data = await redis.get(key);
    if (data) {
        await redis.expire(key, 3600);  // Reset TTL on access
    }
    return data;
}
{{< / highlight >}}

### Event-Based Invalidation

{{< highlight javascript >}}
// Invalidate on write
async function updateUser(userId, data) {
    await db.users.update(userId, data);
    await redis.del(`user:${userId}`);

    // Also invalidate related caches
    await redis.del(`user:${userId}:posts`);
    await redis.del(`user:${userId}:followers`);
}

// Pattern-based invalidation
async function clearUserCaches(userId) {
    const keys = await redis.keys(`user:${userId}:*`);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}
{{< / highlight >}}

### Version-Based Invalidation

{{< highlight javascript >}}
// Include version in cache key
const CACHE_VERSION = 'v2';

function getCacheKey(type, id) {
    return `${CACHE_VERSION}:${type}:${id}`;
}

// Changing CACHE_VERSION effectively invalidates all old caches
const user = await redis.get(getCacheKey('user', userId));
{{< / highlight >}}

## Distributed Caching with Redis

### Connection Setup

{{< highlight javascript >}}
const Redis = require('ioredis');

// Single instance
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
});

// Cluster mode
const cluster = new Redis.Cluster([
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
], {
    redisOptions: {
        password: process.env.REDIS_PASSWORD,
    },
});
{{< / highlight >}}

### Common Patterns

{{< highlight javascript >}}
// Hash for structured data
await redis.hset('user:123', {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
});
const user = await redis.hgetall('user:123');

// Sorted set for leaderboards
await redis.zadd('leaderboard', 100, 'user:1', 200, 'user:2', 150, 'user:3');
const topPlayers = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// List for recent items
await redis.lpush('recent:user:123', 'item:456');
await redis.ltrim('recent:user:123', 0, 99);  // Keep last 100
const recent = await redis.lrange('recent:user:123', 0, 9);

// Set for unique items
await redis.sadd('online:users', 'user:123', 'user:456');
const onlineCount = await redis.scard('online:users');
{{< / highlight >}}

## Cache Stampede Prevention

When cache expires, many requests can hit the database simultaneously:

### Locking

{{< highlight javascript >}}
async function getWithLock(key, fetchFn, ttl = 3600) {
    // Try cache first
    let data = await redis.get(key);
    if (data) {
        return JSON.parse(data);
    }

    // Try to acquire lock
    const lockKey = `lock:${key}`;
    const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');

    if (acquired) {
        try {
            // We got the lock - fetch and cache
            data = await fetchFn();
            await redis.setex(key, ttl, JSON.stringify(data));
            return data;
        } finally {
            await redis.del(lockKey);
        }
    } else {
        // Another process is fetching - wait and retry
        await sleep(100);
        return getWithLock(key, fetchFn, ttl);
    }
}
{{< / highlight >}}

### Probabilistic Early Expiration

{{< highlight javascript >}}
async function getWithEarlyExpiry(key, fetchFn, ttl = 3600) {
    const result = await redis.get(key);
    if (!result) {
        const data = await fetchFn();
        await redis.setex(key, ttl, JSON.stringify({ data, fetchedAt: Date.now() }));
        return data;
    }

    const { data, fetchedAt } = JSON.parse(result);
    const age = Date.now() - fetchedAt;
    const remainingTtl = ttl * 1000 - age;

    // Probabilistically refresh before expiry
    const shouldRefresh = Math.random() < (age / (ttl * 1000));
    if (shouldRefresh && remainingTtl < ttl * 0.1) {
        // Async refresh - don't wait
        fetchFn().then(newData => {
            redis.setex(key, ttl, JSON.stringify({ data: newData, fetchedAt: Date.now() }));
        });
    }

    return data;
}
{{< / highlight >}}

## CDN Caching

### Cache-Control Headers

{{< highlight javascript >}}
// Static assets - cache aggressively
app.use('/static', express.static('public', {
    maxAge: '1y',
    immutable: true,
}));

// API responses - cache with revalidation
app.get('/api/products', (req, res) => {
    res.set({
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Vary': 'Accept-Encoding',
    });
    res.json(products);
});

// Private data - no caching
app.get('/api/user/profile', authenticate, (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    res.json(req.user);
});
{{< / highlight >}}

### Cache-Control Directives

| Directive | Meaning |
|-----------|---------|
| `public` | Can be cached by CDN |
| `private` | Only browser can cache |
| `max-age=N` | Cache for N seconds |
| `s-maxage=N` | CDN-specific max age |
| `no-cache` | Must revalidate before using |
| `no-store` | Never cache |
| `stale-while-revalidate=N` | Serve stale while fetching fresh |
| `immutable` | Will never change |

## Caching Best Practices

### 1. Cache the Right Things

{{< highlight javascript >}}
// ✅ Good candidates
// - Expensive computations
// - Frequently accessed data
// - Data that changes infrequently

// ❌ Poor candidates
// - Highly personalized data
// - Rapidly changing data
// - Security-sensitive data
{{< / highlight >}}

### 2. Monitor Cache Performance

{{< highlight javascript >}}
// Track hit/miss rates
const cacheStats = {
    hits: 0,
    misses: 0,
};

async function cachedGet(key, fetchFn) {
    const cached = await redis.get(key);
    if (cached) {
        cacheStats.hits++;
        return JSON.parse(cached);
    }

    cacheStats.misses++;
    const data = await fetchFn();
    await redis.setex(key, 3600, JSON.stringify(data));
    return data;
}

// Expose metrics
app.get('/metrics', (req, res) => {
    const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
    res.json({ hitRate, ...cacheStats });
});
{{< / highlight >}}

### 3. Plan for Cache Failures

{{< highlight javascript >}}
async function resilientCachedGet(key, fetchFn) {
    try {
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Cache error:', error);
        // Continue to fetch from source
    }

    const data = await fetchFn();

    try {
        await redis.setex(key, 3600, JSON.stringify(data));
    } catch (error) {
        console.error('Cache write error:', error);
        // Don't fail the request
    }

    return data;
}
{{< / highlight >}}

## Conclusion

Effective caching requires understanding your data access patterns and choosing appropriate strategies. Start simple with cache-aside and TTL-based expiration, then add complexity only as needed.

Key takeaways:
- Cache at multiple layers for best performance
- Choose invalidation strategy based on consistency needs
- Prevent cache stampedes with locking or early expiration
- Use appropriate Cache-Control headers for CDN caching
- Monitor hit rates and plan for cache failures
- Remember: a cache is an optimization, not a primary data store
