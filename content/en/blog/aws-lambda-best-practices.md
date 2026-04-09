---
title: AWS Lambda Best Practices for Production
slug: aws-lambda-best-practices-en
description: Production-ready AWS Lambda patterns covering cold starts, performance optimization, error handling, monitoring, and cost management for serverless applications.
summary: Master **AWS Lambda** best practices for production, including cold start optimization, memory tuning, error handling, and cost-effective serverless architecture.
keywords: [aws, lambda, serverless, cloud, backend]
media: https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif
tags:
- Cloud
- AWS
- Serverless
- Backend
- Best Practices
draft: true
---

## Introduction

AWS Lambda has revolutionized how we build applications, but production-ready Lambda functions require more than just uploading code. This guide covers battle-tested patterns for building reliable, performant, and cost-effective serverless applications.

## Cold Start Optimization

Cold starts occur when Lambda provisions new execution environments. Here's how to minimize their impact:

### Keep Packages Light

{{< highlight javascript >}}
// ❌ Importing entire SDK
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// ✅ Import only what you need (v3 SDK)
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });
{{< / highlight >}}

### Initialize Outside Handler

{{< highlight javascript >}}
// ❌ Cold start on every invocation
exports.handler = async (event) => {
    const db = await connectToDatabase();
    // ... use db
};

// ✅ Reuse connection across invocations
let dbConnection = null;

async function getDbConnection() {
    if (!dbConnection) {
        dbConnection = await connectToDatabase();
    }
    return dbConnection;
}

exports.handler = async (event) => {
    const db = await getDbConnection();
    // ... use db
};
{{< / highlight >}}

### Provisioned Concurrency

For latency-sensitive workloads:

{{< highlight yaml >}}
# serverless.yml
functions:
  api:
    handler: src/handler.main
    provisionedConcurrency: 5
    events:
      - http:
          path: /api
          method: any
{{< / highlight >}}

## Memory and Performance Tuning

Lambda CPU scales with memory. More memory often means faster execution and lower cost:

| Memory | vCPU | Use Case |
|--------|------|----------|
| 128 MB | 0.083 | Simple transforms |
| 512 MB | 0.333 | API handlers |
| 1024 MB | 0.667 | Data processing |
| 1769 MB | 1 full | CPU-intensive tasks |
| 3008+ MB | 2 | Heavy computation |

### Power Tuning

Use AWS Lambda Power Tuning to find optimal memory:

{{< highlight bash >}}
# Deploy power tuning step function
aws cloudformation deploy \
  --template-url https://github.com/.../lambda-power-tuning.yaml \
  --stack-name lambda-power-tuning \
  --capabilities CAPABILITY_IAM

# Run analysis
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:...:LambdaPowerTuning \
  --input '{
    "lambdaARN": "arn:aws:lambda:...:my-function",
    "powerValues": [128, 256, 512, 1024, 2048],
    "num": 50,
    "payload": "{\"test\": \"data\"}"
  }'
{{< / highlight >}}

## Structured Error Handling

### Custom Error Classes

{{< highlight javascript >}}
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
{{< / highlight >}}

### Error Handler Middleware

{{< highlight javascript >}}
const errorHandler = (handler) => async (event, context) => {
    try {
        return await handler(event, context);
    } catch (error) {
        console.error('Error:', JSON.stringify({
            errorMessage: error.message,
            errorCode: error.code,
            stack: error.stack,
            requestId: context.awsRequestId,
        }));

        if (error.isOperational) {
            return {
                statusCode: error.statusCode,
                body: JSON.stringify({
                    error: error.code,
                    message: error.message,
                }),
            };
        }

        // Unknown errors - don't leak details
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
                requestId: context.awsRequestId,
            }),
        };
    }
};

// Usage
exports.handler = errorHandler(async (event, context) => {
    const { id } = event.pathParameters;
    const item = await getItem(id);

    if (!item) {
        throw new NotFoundError('Item');
    }

    return { statusCode: 200, body: JSON.stringify(item) };
});
{{< / highlight >}}

## Idempotency

Lambda can invoke your function more than once. Design for idempotency:

{{< highlight javascript >}}
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({});

async function processPaymentIdempotent(paymentId, amount) {
    const idempotencyKey = `payment-${paymentId}`;

    try {
        // Try to claim the idempotency key
        await dynamodb.send(new PutItemCommand({
            TableName: 'IdempotencyTable',
            Item: {
                pk: { S: idempotencyKey },
                status: { S: 'PROCESSING' },
                ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) },
            },
            ConditionExpression: 'attribute_not_exists(pk)',
        }));

        // Process payment
        const result = await chargeCard(paymentId, amount);

        // Update with result
        await dynamodb.send(new PutItemCommand({
            TableName: 'IdempotencyTable',
            Item: {
                pk: { S: idempotencyKey },
                status: { S: 'COMPLETED' },
                result: { S: JSON.stringify(result) },
                ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) },
            },
        }));

        return result;

    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            // Already processed - return cached result
            const existing = await getIdempotencyRecord(idempotencyKey);
            return JSON.parse(existing.result.S);
        }
        throw error;
    }
}
{{< / highlight >}}

## Environment Configuration

{{< highlight yaml >}}
# serverless.yml
provider:
  environment:
    STAGE: ${self:provider.stage}
    LOG_LEVEL: ${self:custom.logLevel.${self:provider.stage}}

custom:
  logLevel:
    dev: DEBUG
    staging: INFO
    prod: WARN

functions:
  api:
    handler: src/handler.main
    environment:
      DATABASE_URL: ${ssm:/myapp/${self:provider.stage}/database-url}
      API_KEY: ${ssm:/myapp/${self:provider.stage}/api-key~true}  # Encrypted
{{< / highlight >}}

### Configuration Validation

{{< highlight javascript >}}
const requiredEnvVars = [
    'DATABASE_URL',
    'API_KEY',
    'STAGE',
];

function validateConfig() {
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
}

// Validate at cold start, not in handler
validateConfig();
{{< / highlight >}}

## Logging Best Practices

### Structured Logging

{{< highlight javascript >}}
const log = {
    info: (message, data = {}) => console.log(JSON.stringify({
        level: 'INFO',
        message,
        ...data,
        timestamp: new Date().toISOString(),
    })),
    error: (message, error, data = {}) => console.error(JSON.stringify({
        level: 'ERROR',
        message,
        error: error.message,
        stack: error.stack,
        ...data,
        timestamp: new Date().toISOString(),
    })),
};

// Usage
exports.handler = async (event, context) => {
    log.info('Processing request', {
        requestId: context.awsRequestId,
        path: event.path,
        userId: event.requestContext?.authorizer?.userId,
    });

    try {
        const result = await processRequest(event);
        log.info('Request completed', { requestId: context.awsRequestId });
        return result;
    } catch (error) {
        log.error('Request failed', error, { requestId: context.awsRequestId });
        throw error;
    }
};
{{< / highlight >}}

## Timeouts and Retries

### Timeout Configuration

{{< highlight yaml >}}
functions:
  api:
    handler: src/handler.main
    timeout: 10  # seconds

  processor:
    handler: src/processor.main
    timeout: 300  # 5 minutes for batch processing
{{< / highlight >}}

### Downstream Timeouts

Always set shorter timeouts for downstream calls:

{{< highlight javascript >}}
const axios = require('axios');

// Lambda timeout: 30s
// HTTP timeout: 25s (leaves time for cleanup)
const httpClient = axios.create({
    timeout: 25000,
});

async function callExternalApi(data) {
    try {
        const response = await httpClient.post('https://api.example.com', data);
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            throw new Error('External API timeout');
        }
        throw error;
    }
}
{{< / highlight >}}

## Cost Optimization

### Right-Size Memory

{{< highlight bash >}}
# Check actual memory usage in CloudWatch
aws logs filter-log-events \
  --log-group-name /aws/lambda/my-function \
  --filter-pattern "REPORT" \
  --query 'events[].message' \
  --output text | grep "Max Memory Used"
{{< / highlight >}}

### Batch Processing

{{< highlight javascript >}}
// ❌ One Lambda per message
exports.handler = async (event) => {
    await processItem(event.body);
};

// ✅ Process batch in single invocation
exports.handler = async (event) => {
    const results = await Promise.allSettled(
        event.Records.map(record =>
            processItem(JSON.parse(record.body))
        )
    );

    // Return failed items for retry
    const failures = results
        .map((result, index) => result.status === 'rejected' ? index : null)
        .filter(index => index !== null);

    return {
        batchItemFailures: failures.map(index => ({
            itemIdentifier: event.Records[index].messageId,
        })),
    };
};
{{< / highlight >}}

## Monitoring Checklist

Essential CloudWatch metrics to monitor:

| Metric | Alert Threshold | Reason |
|--------|-----------------|--------|
| Errors | > 1% of invocations | Application failures |
| Duration | > 80% of timeout | Risk of timeouts |
| Throttles | > 0 | Concurrency limits |
| ConcurrentExecutions | > 80% of limit | Scaling ceiling |
| IteratorAge (streams) | > 1 minute | Processing lag |

## Conclusion

Production Lambda functions require careful attention to cold starts, error handling, idempotency, and monitoring. The serverless model shifts responsibility to the code level—these patterns help you build reliable systems.

Key takeaways:
- Initialize connections outside the handler
- Right-size memory based on actual usage
- Design for idempotency from the start
- Use structured logging for observability
- Set appropriate timeouts at every level
- Monitor key metrics and alert proactively
