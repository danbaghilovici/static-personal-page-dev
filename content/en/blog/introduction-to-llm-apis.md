---
title: "Getting Started with LLM APIs: OpenAI and Beyond"
slug: introduction-to-llm-apis-en
description: A practical guide to integrating Large Language Model APIs into your applications, covering OpenAI, Anthropic, and best practices for production use.
summary: Learn how to integrate **LLM APIs** into your applications, with practical examples using OpenAI and Anthropic, plus best practices for prompt engineering and production deployment.
keywords: [llm, openai, anthropic, ai, machine learning, api]
media: https://media.giphy.com/media/IZY2SE2JmPgFG/giphy.gif
tags:
- AI
- Machine Learning
- Backend
- Tutorial
- API
draft: true
---

## Introduction

Large Language Models have transformed what's possible in software applications. From chatbots to code generation, content creation to data analysis, LLM APIs provide powerful capabilities that were unimaginable just a few years ago.

This guide covers practical integration patterns for LLM APIs, with examples you can adapt for your own projects.

## Getting Started with OpenAI

### Basic Setup

{{< highlight javascript >}}
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function chat(message) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: message },
        ],
    });

    return response.choices[0].message.content;
}

// Usage
const answer = await chat('What is the capital of France?');
console.log(answer);  // "The capital of France is Paris."
{{< / highlight >}}

### Conversation Context

{{< highlight javascript >}}
class Conversation {
    constructor(systemPrompt) {
        this.messages = [
            { role: 'system', content: systemPrompt },
        ];
    }

    async send(userMessage) {
        this.messages.push({ role: 'user', content: userMessage });

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: this.messages,
        });

        const assistantMessage = response.choices[0].message.content;
        this.messages.push({ role: 'assistant', content: assistantMessage });

        return assistantMessage;
    }
}

// Usage
const conv = new Conversation('You are a Python expert.');
await conv.send('How do I read a file?');
await conv.send('Now how do I write to it?');  // Maintains context
{{< / highlight >}}

## Using Anthropic's Claude

{{< highlight javascript >}}
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function askClaude(message) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
            { role: 'user', content: message },
        ],
    });

    return response.content[0].text;
}
{{< / highlight >}}

## Model Comparison

| Model | Strengths | Best For |
|-------|-----------|----------|
| GPT-4 | Reasoning, broad knowledge | Complex tasks, coding |
| GPT-3.5-turbo | Speed, cost-effective | Simple tasks, high volume |
| Claude 3 Opus | Long context, nuanced writing | Analysis, content creation |
| Claude 3 Sonnet | Balanced performance | General purpose |
| Claude 3 Haiku | Fast, affordable | Quick responses |

## Prompt Engineering

### Be Specific

{{< highlight javascript >}}
// ❌ Vague prompt
const prompt = 'Write about dogs';

// ✅ Specific prompt
const prompt = `Write a 200-word blog post about the health benefits
of owning a dog, targeting first-time pet owners. Include 3 key
benefits with brief explanations. Use a friendly, encouraging tone.`;
{{< / highlight >}}

### Use Examples (Few-Shot)

{{< highlight javascript >}}
const prompt = `Extract the product and price from customer messages.

Example 1:
Input: "I'd like to buy the blue widget for $29.99"
Output: {"product": "blue widget", "price": 29.99}

Example 2:
Input: "Add 2 premium subscriptions at $9.99 each to my cart"
Output: {"product": "premium subscription", "price": 9.99, "quantity": 2}

Now extract from this message:
Input: "${userMessage}"
Output:`;
{{< / highlight >}}

### Chain of Thought

{{< highlight javascript >}}
const prompt = `Solve this problem step by step:

Problem: A store has 150 apples. They sell 40% on Monday and 25% of
the remainder on Tuesday. How many apples are left?

Think through this step by step:
1. First, calculate...`;
{{< / highlight >}}

## Structured Output

### JSON Mode

{{< highlight javascript >}}
async function extractData(text) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `Extract entities from text. Return JSON with format:
                    {"people": [], "places": [], "dates": []}`,
            },
            { role: 'user', content: text },
        ],
    });

    return JSON.parse(response.choices[0].message.content);
}

const result = await extractData(
    'John met Sarah in Paris on January 15th, 2024.'
);
// { people: ["John", "Sarah"], places: ["Paris"], dates: ["January 15th, 2024"] }
{{< / highlight >}}

### Function Calling

{{< highlight javascript >}}
const tools = [
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Get the current weather for a location',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'City name, e.g., San Francisco, CA',
                    },
                    unit: {
                        type: 'string',
                        enum: ['celsius', 'fahrenheit'],
                    },
                },
                required: ['location'],
            },
        },
    },
];

async function chatWithTools(message) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: message }],
        tools,
        tool_choice: 'auto',
    });

    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        // Call your actual function
        const weatherData = await getWeather(args.location, args.unit);

        // Send result back to model
        return openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'user', content: message },
                response.choices[0].message,
                {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(weatherData),
                },
            ],
        });
    }

    return response;
}
{{< / highlight >}}

## Streaming Responses

{{< highlight javascript >}}
async function streamChat(message, onChunk) {
    const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: message }],
        stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        onChunk(content);
    }

    return fullResponse;
}

// Usage in Express
app.get('/api/chat', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await streamChat(req.query.message, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
});
{{< / highlight >}}

## Error Handling and Retries

{{< highlight javascript >}}
class LLMClient {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000;
    }

    async complete(messages, options = {}) {
        let lastError;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await openai.chat.completions.create({
                    model: options.model || 'gpt-4',
                    messages,
                    ...options,
                });
            } catch (error) {
                lastError = error;

                if (error.status === 429) {
                    // Rate limited - wait longer
                    const delay = this.baseDelay * Math.pow(2, attempt);
                    console.log(`Rate limited, waiting ${delay}ms...`);
                    await sleep(delay);
                } else if (error.status >= 500) {
                    // Server error - retry with backoff
                    await sleep(this.baseDelay * Math.pow(2, attempt));
                } else {
                    // Client error - don't retry
                    throw error;
                }
            }
        }

        throw lastError;
    }
}
{{< / highlight >}}

## Cost Optimization

### Token Counting

{{< highlight javascript >}}
const { encoding_for_model } = require('tiktoken');

function countTokens(text, model = 'gpt-4') {
    const enc = encoding_for_model(model);
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
}

// Estimate cost before sending
function estimateCost(messages, model = 'gpt-4') {
    const inputTokens = messages.reduce((sum, m) =>
        sum + countTokens(m.content), 0);

    const rates = {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    };

    const rate = rates[model];
    return (inputTokens / 1000) * rate.input;
}
{{< / highlight >}}

### Caching Responses

{{< highlight javascript >}}
const crypto = require('crypto');

function hashPrompt(messages) {
    const content = JSON.stringify(messages);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function cachedComplete(messages, options = {}) {
    const cacheKey = `llm:${hashPrompt(messages)}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // Call API
    const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4',
        messages,
        ...options,
    });

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(response));

    return response;
}
{{< / highlight >}}

## Production Checklist

| Concern | Solution |
|---------|----------|
| Rate limiting | Implement exponential backoff |
| Cost control | Set budget alerts, cache responses |
| Latency | Use streaming, consider smaller models |
| Reliability | Add retries, fallback models |
| Content safety | Add moderation, filter outputs |
| Monitoring | Log usage, track costs and latency |

## Content Moderation

{{< highlight javascript >}}
async function moderateContent(text) {
    const response = await openai.moderations.create({
        input: text,
    });

    const results = response.results[0];
    if (results.flagged) {
        const categories = Object.entries(results.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category);
        throw new Error(`Content flagged: ${categories.join(', ')}`);
    }

    return true;
}

// Usage
async function safeChat(message) {
    await moderateContent(message);

    const response = await chat(message);

    await moderateContent(response);

    return response;
}
{{< / highlight >}}

## Building a RAG System

Retrieval-Augmented Generation combines LLMs with your own data:

{{< highlight javascript >}}
async function ragQuery(question, documents) {
    // 1. Embed the question
    const questionEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
    });

    // 2. Find relevant documents (using vector DB)
    const relevantDocs = await vectorDB.search(
        questionEmbedding.data[0].embedding,
        { topK: 5 }
    );

    // 3. Build context
    const context = relevantDocs
        .map(doc => doc.content)
        .join('\n\n');

    // 4. Generate answer with context
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `Answer questions based on the following context.
                         If the answer isn't in the context, say so.
                         Context: ${context}`,
            },
            { role: 'user', content: question },
        ],
    });

    return response.choices[0].message.content;
}
{{< / highlight >}}

## Conclusion

LLM APIs open up powerful capabilities, but production use requires careful attention to reliability, cost, and safety. Start simple, measure everything, and iterate based on real-world usage.

Key takeaways:
- Choose models based on task requirements
- Invest in prompt engineering for better results
- Implement retries and error handling
- Cache responses to reduce costs
- Add content moderation for safety
- Monitor usage and costs closely
- Consider RAG for domain-specific applications
