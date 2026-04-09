---
title: PostgreSQL Performance Tuning for High-Traffic Apps
slug: postgresql-performance-tuning-en
description: Learn essential PostgreSQL performance tuning techniques including indexing strategies, query optimization, configuration tuning, and monitoring for production databases.
summary: Master **PostgreSQL performance tuning** with practical techniques for indexing, query optimization, configuration, and monitoring high-traffic databases.
keywords: [postgresql, database, performance, sql, backend]
media: https://media.giphy.com/media/vISmwpBJUNYzukTnVx/giphy.gif
tags:
- Development
- PostgreSQL
- Database
- Performance
- Backend
draft: true
---

## Introduction

PostgreSQL is renowned for its robustness and feature set, but achieving optimal performance requires understanding its internals. This guide covers practical techniques for tuning PostgreSQL in high-traffic environments, from query optimization to server configuration.

## Indexing Strategies

### B-Tree Indexes (Default)

The workhorse of PostgreSQL indexing:

{{< highlight sql >}}
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (column order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Partial index (index only relevant rows)
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Covering index (includes all needed columns)
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name, created_at);
{{< / highlight >}}

### When to Use Different Index Types

| Index Type | Best For | Example |
|------------|----------|---------|
| B-Tree | Equality, range queries | `WHERE email = 'x'`, `WHERE date > '2024-01-01'` |
| Hash | Equality only (rare) | `WHERE id = 123` |
| GIN | Arrays, JSONB, full-text | `WHERE tags @> ARRAY['go']` |
| GiST | Geometric, range types | `WHERE location <-> point(x,y)` |
| BRIN | Large sequential data | Time-series with natural ordering |

### GIN Index for JSONB

{{< highlight sql >}}
-- Index entire JSONB document
CREATE INDEX idx_products_data ON products USING GIN(metadata);

-- Index specific path
CREATE INDEX idx_products_category ON products USING GIN((metadata->'category'));

-- Query examples
SELECT * FROM products WHERE metadata @> '{"category": "electronics"}';
SELECT * FROM products WHERE metadata ? 'discount';
{{< / highlight >}}

## Query Optimization

### EXPLAIN ANALYZE

Always analyze slow queries:

{{< highlight sql >}}
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
ORDER BY order_count DESC
LIMIT 10;
{{< / highlight >}}

Key metrics to watch:
- **Seq Scan** on large tables (consider indexing)
- **Nested Loop** with high row counts (might need different join)
- **Sort** operations (consider index for ORDER BY)
- **Buffers** hit vs read ratio (memory efficiency)

### Common Query Optimizations

{{< highlight sql >}}
-- ❌ Slow: Function on indexed column
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- ✅ Fast: Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ❌ Slow: OR conditions
SELECT * FROM orders WHERE user_id = 1 OR user_id = 2 OR user_id = 3;

-- ✅ Fast: IN clause
SELECT * FROM orders WHERE user_id IN (1, 2, 3);

-- ❌ Slow: Subquery in WHERE
SELECT * FROM products
WHERE category_id IN (SELECT id FROM categories WHERE active = true);

-- ✅ Fast: JOIN
SELECT p.* FROM products p
INNER JOIN categories c ON c.id = p.category_id
WHERE c.active = true;

-- ❌ Slow: SELECT * with large tables
SELECT * FROM orders WHERE user_id = 1;

-- ✅ Fast: Select only needed columns
SELECT id, total, status FROM orders WHERE user_id = 1;
{{< / highlight >}}

### Pagination Done Right

{{< highlight sql >}}
-- ❌ Slow: OFFSET with large values
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 100000;

-- ✅ Fast: Keyset pagination
SELECT * FROM products
WHERE id > 100000  -- Last seen ID
ORDER BY id
LIMIT 20;

-- For complex sorting, use composite cursor
SELECT * FROM products
WHERE (created_at, id) < ('2024-01-15', 50000)
ORDER BY created_at DESC, id DESC
LIMIT 20;
{{< / highlight >}}

## Configuration Tuning

### Memory Settings

{{< highlight ini >}}
# postgresql.conf

# Shared memory for caching (25% of RAM)
shared_buffers = 4GB

# Memory per operation (sort, hash)
work_mem = 256MB

# Maintenance operations (vacuum, index creation)
maintenance_work_mem = 1GB

# Effective cache size (estimate of OS cache, ~75% of RAM)
effective_cache_size = 12GB
{{< / highlight >}}

### Connection Settings

{{< highlight ini >}}
# Maximum connections (use connection pooling!)
max_connections = 200

# For connection pooling (PgBouncer recommended)
# Keep max_connections low, let pooler handle scaling
{{< / highlight >}}

### Write Performance

{{< highlight ini >}}
# WAL settings for write-heavy workloads
wal_buffers = 64MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# For SSDs
random_page_cost = 1.1
effective_io_concurrency = 200
{{< / highlight >}}

## Connection Pooling with PgBouncer

{{< highlight ini >}}
# pgbouncer.ini
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
{{< / highlight >}}

### Pool Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| session | Connection per session | Legacy apps, prepared statements |
| transaction | Connection per transaction | Most web applications |
| statement | Connection per statement | Simple read queries |

## Vacuuming and Maintenance

### Understanding VACUUM

PostgreSQL's MVCC creates dead tuples that need cleanup:

{{< highlight sql >}}
-- Manual vacuum (rarely needed with autovacuum)
VACUUM VERBOSE users;

-- Vacuum and reclaim space
VACUUM FULL users;  -- Locks table!

-- Analyze for query planner statistics
ANALYZE users;

-- Both together
VACUUM ANALYZE users;
{{< / highlight >}}

### Autovacuum Tuning

{{< highlight ini >}}
# postgresql.conf
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s

# Trigger vacuum when 20% of table is dead tuples
autovacuum_vacuum_scale_factor = 0.1
autovacuum_vacuum_threshold = 50

# For high-write tables, tune individually
ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);
{{< / highlight >}}

## Monitoring Queries

### Slow Query Log

{{< highlight ini >}}
# postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1 second
log_statement = 'none'  # Don't log all statements
log_lock_waits = on
{{< / highlight >}}

### pg_stat_statements Extension

{{< highlight sql >}}
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- Find slowest queries
SELECT
    substring(query, 1, 100) as query,
    calls,
    round(total_exec_time::numeric, 2) as total_ms,
    round(mean_exec_time::numeric, 2) as mean_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Find most frequent queries
SELECT
    substring(query, 1, 100) as query,
    calls,
    round(total_exec_time::numeric, 2) as total_ms
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;
{{< / highlight >}}

### Useful Monitoring Queries

{{< highlight sql >}}
-- Table sizes
SELECT
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as data_size,
    pg_size_pretty(pg_indexes_size(relid)) as index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage
SELECT
    indexrelname as index_name,
    relname as table_name,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Cache hit ratio (should be > 99%)
SELECT
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Active connections
SELECT
    state,
    count(*),
    max(now() - state_change) as max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
{{< / highlight >}}

## Partitioning Large Tables

For tables with millions of rows:

{{< highlight sql >}}
-- Create partitioned table
CREATE TABLE orders (
    id BIGSERIAL,
    user_id BIGINT NOT NULL,
    total DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Create indexes on partitions
CREATE INDEX ON orders_2024_q1(user_id);
CREATE INDEX ON orders_2024_q2(user_id);
{{< / highlight >}}

## Conclusion

PostgreSQL performance tuning is an iterative process. Start with proper indexing and query optimization before tuning server configuration.

Key takeaways:
- Always use EXPLAIN ANALYZE to understand query plans
- Index based on actual query patterns
- Use connection pooling in production
- Monitor with pg_stat_statements
- Keep autovacuum healthy
- Partition large tables for better maintenance

Remember: premature optimization is the root of all evil. Profile first, optimize what matters.
