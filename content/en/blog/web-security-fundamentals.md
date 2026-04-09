---
title: "Web Security Fundamentals: OWASP Top 10 Explained"
slug: web-security-fundamentals-en
description: Understand the OWASP Top 10 security vulnerabilities with practical examples and prevention techniques for building secure web applications.
summary: A practical guide to the **OWASP Top 10** security vulnerabilities, with code examples demonstrating both vulnerable patterns and secure implementations.
keywords: [security, owasp, web security, vulnerabilities, backend]
media: https://media.giphy.com/media/077i6AULCXc0FKTj9s/giphy.gif
tags:
- Security
- Backend
- Web Development
- Best Practices
draft: true
---

## Introduction

Security vulnerabilities can devastate applications and organizations. The OWASP Top 10 represents the most critical security risks to web applications, based on data from security experts worldwide. Understanding these vulnerabilities is essential for every developer.

This guide explains each vulnerability with real code examples and practical prevention techniques.

## A01: Broken Access Control

The most common vulnerability—improper enforcement of user permissions.

### Vulnerable Example

{{< highlight javascript >}}
// ❌ Insecure Direct Object Reference (IDOR)
app.get('/api/users/:id/profile', async (req, res) => {
    // Anyone can access any user's profile!
    const user = await User.findById(req.params.id);
    res.json(user);
});

// ❌ Missing function-level access control
app.delete('/api/users/:id', async (req, res) => {
    // No check if user has admin privileges
    await User.deleteById(req.params.id);
    res.json({ success: true });
});
{{< / highlight >}}

### Secure Implementation

{{< highlight javascript >}}
// ✅ Verify ownership
app.get('/api/users/:id/profile', authenticate, async (req, res) => {
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await User.findById(req.params.id);
    res.json(user);
});

// ✅ Role-based access control
app.delete('/api/users/:id', authenticate, authorize('admin'), async (req, res) => {
    await User.deleteById(req.params.id);
    res.json({ success: true });
});

function authorize(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
{{< / highlight >}}

## A02: Cryptographic Failures

Weak or missing encryption of sensitive data.

### Common Mistakes

{{< highlight javascript >}}
// ❌ Storing passwords in plain text
await db.query('INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password]);

// ❌ Using weak hashing
const hash = crypto.createHash('md5').update(password).digest('hex');

// ❌ Hardcoded secrets
const JWT_SECRET = 'super-secret-key-123';
{{< / highlight >}}

### Secure Implementation

{{< highlight javascript >}}
const bcrypt = require('bcrypt');

// ✅ Hash passwords with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
await db.query('INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword]);

// ✅ Verify passwords
const isValid = await bcrypt.compare(inputPassword, storedHash);

// ✅ Use environment variables for secrets
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('Invalid JWT secret configuration');
}
{{< / highlight >}}

## A03: Injection

Untrusted data sent to an interpreter as part of a command.

### SQL Injection

{{< highlight javascript >}}
// ❌ Vulnerable to SQL injection
app.get('/api/users', async (req, res) => {
    const query = `SELECT * FROM users WHERE name = '${req.query.name}'`;
    // Input: ' OR '1'='1' -- returns all users!
    const users = await db.query(query);
    res.json(users);
});

// ✅ Use parameterized queries
app.get('/api/users', async (req, res) => {
    const users = await db.query(
        'SELECT * FROM users WHERE name = ?',
        [req.query.name]
    );
    res.json(users);
});
{{< / highlight >}}

### NoSQL Injection

{{< highlight javascript >}}
// ❌ Vulnerable to NoSQL injection
app.post('/api/login', async (req, res) => {
    // Input: { "email": { "$gt": "" }, "password": { "$gt": "" } }
    const user = await User.findOne({
        email: req.body.email,
        password: req.body.password
    });
});

// ✅ Validate and sanitize input
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        // Login successful
    }
});
{{< / highlight >}}

## A04: Insecure Design

Missing or ineffective security controls.

### Security by Design Principles

| Principle | Implementation |
|-----------|----------------|
| Defense in depth | Multiple security layers |
| Least privilege | Minimal permissions needed |
| Fail secure | Deny by default |
| Separation of concerns | Isolated components |

{{< highlight javascript >}}
// ✅ Rate limiting
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

app.post('/api/login', loginLimiter, loginHandler);

// ✅ Account lockout
async function handleLogin(email, password) {
    const user = await User.findOne({ email });

    if (user.lockoutUntil > new Date()) {
        throw new Error('Account temporarily locked');
    }

    if (!await verifyPassword(password, user.password)) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await user.save();
        throw new Error('Invalid credentials');
    }

    user.failedAttempts = 0;
    await user.save();
    return user;
}
{{< / highlight >}}

## A05: Security Misconfiguration

Insecure default configurations, missing hardening.

### Express Security Hardening

{{< highlight javascript >}}
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// ✅ Security headers with Helmet
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
    },
}));

// ✅ CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://myapp.com',
    credentials: true,
}));

// ✅ Disable fingerprinting
app.disable('x-powered-by');

// ✅ Secure cookies
app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        secure: true,      // HTTPS only
        httpOnly: true,    // No JavaScript access
        sameSite: 'strict', // CSRF protection
        maxAge: 3600000,   // 1 hour
    },
}));
{{< / highlight >}}

## A06: Vulnerable Components

Using components with known vulnerabilities.

{{< highlight bash >}}
# Check for vulnerabilities
npm audit
npm audit fix

# Use automated scanning
npx snyk test
npx retire

# Keep dependencies updated
npx npm-check-updates -u
npm install
{{< / highlight >}}

## A07: Authentication Failures

Weak authentication mechanisms.

### Secure Authentication

{{< highlight javascript >}}
// ✅ Strong password requirements
function validatePassword(password) {
    const minLength = 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
        return { valid: false, error: 'Password must be at least 12 characters' };
    }
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        return { valid: false, error: 'Password must include uppercase, lowercase, number, and special character' };
    }
    return { valid: true };
}

// ✅ Secure JWT implementation
const jwt = require('jsonwebtoken');

function generateTokens(user) {
    const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m', algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, tokenVersion: user.tokenVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
    );

    return { accessToken, refreshToken };
}

// ✅ Multi-factor authentication
async function verifyMFA(user, code) {
    const speakeasy = require('speakeasy');
    return speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 1, // Allow 30 seconds clock skew
    });
}
{{< / highlight >}}

## A08: Data Integrity Failures

Trusting untrusted data without verification.

{{< highlight javascript >}}
// ❌ Trusting client-side data
app.post('/api/order', async (req, res) => {
    const { productId, price } = req.body;
    // Attacker can modify price!
    await createOrder(productId, price);
});

// ✅ Always verify server-side
app.post('/api/order', async (req, res) => {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    await createOrder(productId, product.price); // Use server-side price
});
{{< / highlight >}}

## A09: Security Logging and Monitoring

Insufficient logging to detect attacks.

{{< highlight javascript >}}
const winston = require('winston');

const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'security.log' }),
    ],
});

// ✅ Log security events
function logSecurityEvent(event, data) {
    securityLogger.info({
        event,
        timestamp: new Date().toISOString(),
        ip: data.ip,
        userId: data.userId,
        userAgent: data.userAgent,
        details: data.details,
    });
}

// Usage
app.post('/api/login', async (req, res) => {
    const result = await authenticate(req.body);

    if (!result.success) {
        logSecurityEvent('LOGIN_FAILED', {
            ip: req.ip,
            userId: req.body.email,
            userAgent: req.headers['user-agent'],
            details: result.reason,
        });
    } else {
        logSecurityEvent('LOGIN_SUCCESS', {
            ip: req.ip,
            userId: result.user.id,
            userAgent: req.headers['user-agent'],
        });
    }
});
{{< / highlight >}}

## A10: Server-Side Request Forgery (SSRF)

Fetching URLs provided by users without validation.

{{< highlight javascript >}}
// ❌ Vulnerable to SSRF
app.get('/api/fetch', async (req, res) => {
    // Attacker can access internal services!
    // ?url=http://169.254.169.254/latest/meta-data/ (AWS metadata)
    const response = await fetch(req.query.url);
    res.json(await response.json());
});

// ✅ Validate and restrict URLs
const { URL } = require('url');

const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];

app.get('/api/fetch', async (req, res) => {
    try {
        const url = new URL(req.query.url);

        // Block internal IPs
        if (isInternalIP(url.hostname)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        // Whitelist allowed hosts
        if (!ALLOWED_HOSTS.includes(url.hostname)) {
            return res.status(400).json({ error: 'Host not allowed' });
        }

        // Only allow HTTPS
        if (url.protocol !== 'https:') {
            return res.status(400).json({ error: 'HTTPS required' });
        }

        const response = await fetch(url.toString());
        res.json(await response.json());
    } catch {
        res.status(400).json({ error: 'Invalid URL' });
    }
});
{{< / highlight >}}

## Security Headers Reference

| Header | Purpose | Value |
|--------|---------|-------|
| `Content-Security-Policy` | Prevent XSS | `default-src 'self'` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000; includeSubDomains` |
| `X-XSS-Protection` | Legacy XSS filter | `1; mode=block` |

## Conclusion

Security is not a feature—it's a continuous process. The OWASP Top 10 provides a foundation, but real security requires ongoing vigilance, regular testing, and staying current with emerging threats.

Key takeaways:
- Validate all input, sanitize all output
- Use parameterized queries for databases
- Implement proper authentication and authorization
- Keep dependencies updated
- Log security events for monitoring
- Apply defense in depth
