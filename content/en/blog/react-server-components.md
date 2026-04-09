---
title: Understanding React Server Components
slug: react-server-components-en
description: A comprehensive guide to React Server Components, explaining how they work, when to use them, and how they change the way we build React applications.
summary: Explore **React Server Components** (RSC), understanding the server/client component model, data fetching patterns, and how RSC fundamentally changes React architecture.
keywords: [react, server components, nextjs, frontend, javascript]
media: https://media.giphy.com/media/eNAsjO55tPbgaor7ma/giphy.gif
tags:
- Development
- Frontend
- React
- JavaScript
- Tutorial
draft: true
---

## Introduction

React Server Components (RSC) represent the biggest shift in React's architecture since hooks. They allow components to run exclusively on the server, enabling direct database access, smaller bundle sizes, and improved performance—all while maintaining React's component model.

This guide explains how Server Components work, when to use them versus Client Components, and practical patterns for building applications with RSC.

## The Mental Model

In the RSC model, components are divided into two types:

- **Server Components**: Run only on the server. Can access databases, file systems, and APIs directly. Cannot use hooks or browser APIs.
- **Client Components**: Run on both server (for SSR) and client. Can use hooks, event handlers, and browser APIs.

{{< highlight tsx >}}
// Server Component (default in Next.js App Router)
// No "use client" directive
async function UserProfile({ userId }: { userId: string }) {
  // Direct database access - no API needed!
  const user = await db.users.findUnique({ where: { id: userId } });

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
      <FollowButton userId={userId} /> {/* Client Component */}
    </div>
  );
}
{{< / highlight >}}

{{< highlight tsx >}}
// Client Component
'use client';

import { useState } from 'react';

function FollowButton({ userId }: { userId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <button onClick={() => setIsFollowing(!isFollowing)}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}
{{< / highlight >}}

## Key Benefits

### 1. Zero Bundle Size for Server Components

Server Components don't ship JavaScript to the client:

{{< highlight tsx >}}
// This entire component and its dependencies stay on the server
import { formatDate } from 'date-fns';  // Not sent to client
import { marked } from 'marked';         // Not sent to client

async function BlogPost({ slug }: { slug: string }) {
  const post = await getPost(slug);
  const html = marked(post.content);

  return (
    <article>
      <h1>{post.title}</h1>
      <time>{formatDate(post.date, 'MMMM d, yyyy')}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
{{< / highlight >}}

### 2. Direct Backend Access

No need for API routes for data fetching:

{{< highlight tsx >}}
// Before: API route + client fetch
// pages/api/posts.ts + useEffect in component

// After: Direct database access in Server Component
async function PostList() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
{{< / highlight >}}

### 3. Automatic Code Splitting

Each Client Component becomes a separate chunk:

{{< highlight tsx >}}
// Server Component
import ClientComponent from './ClientComponent';  // Auto code-split

function Page() {
  return (
    <div>
      <ServerContent />
      <ClientComponent />  {/* Loaded only when needed */}
    </div>
  );
}
{{< / highlight >}}

## Server vs Client: Decision Guide

| Need | Use Server Component | Use Client Component |
|------|---------------------|---------------------|
| Fetch data | ✅ | Via props or API |
| Access backend resources | ✅ | ❌ |
| Use sensitive data (API keys) | ✅ | ❌ |
| Use hooks (useState, useEffect) | ❌ | ✅ |
| Add event listeners | ❌ | ✅ |
| Use browser APIs | ❌ | ✅ |
| Use custom hooks with state | ❌ | ✅ |

## Composition Patterns

### Passing Server Components as Children

{{< highlight tsx >}}
// Client Component wrapper
'use client';

function Modal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <div className="modal">
          {children}  {/* Server Component can go here */}
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}

// Usage in Server Component
function Page() {
  return (
    <Modal>
      <ServerRenderedContent />  {/* This works! */}
    </Modal>
  );
}
{{< / highlight >}}

### Data Fetching Patterns

{{< highlight tsx >}}
// Pattern 1: Fetch in Server Component, pass to Client
async function Dashboard() {
  const data = await fetchDashboardData();

  return <InteractiveChart data={data} />;
}

// Pattern 2: Parallel data fetching
async function Page() {
  // These run in parallel
  const userPromise = getUser();
  const postsPromise = getPosts();

  const [user, posts] = await Promise.all([userPromise, postsPromise]);

  return (
    <>
      <UserProfile user={user} />
      <PostList posts={posts} />
    </>
  );
}

// Pattern 3: Streaming with Suspense
import { Suspense } from 'react';

function Page() {
  return (
    <div>
      <Header />  {/* Renders immediately */}
      <Suspense fallback={<PostsSkeleton />}>
        <SlowPostList />  {/* Streams in when ready */}
      </Suspense>
    </div>
  );
}
{{< / highlight >}}

## Common Mistakes

### 1. Importing Server Components into Client Components

{{< highlight tsx >}}
// ❌ Wrong - Server Component imported into Client Component
'use client';

import ServerComponent from './ServerComponent';

function ClientComponent() {
  return <ServerComponent />;  // This won't work as expected
}

// ✅ Correct - Pass as children
'use client';

function ClientComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// In a Server Component:
<ClientComponent>
  <ServerComponent />
</ClientComponent>
{{< / highlight >}}

### 2. Using Hooks in Server Components

{{< highlight tsx >}}
// ❌ Wrong
async function ServerComponent() {
  const [count, setCount] = useState(0);  // Error!
  return <div>{count}</div>;
}

// ✅ Correct - Move interactivity to Client Component
async function ServerComponent() {
  const initialData = await fetchData();
  return <ClientCounter initialValue={initialData.count} />;
}
{{< / highlight >}}

### 3. Forgetting 'use client' Directive

{{< highlight tsx >}}
// ❌ Missing directive - will error on useState
import { useState } from 'react';

function Toggle() {
  const [on, setOn] = useState(false);
  return <button onClick={() => setOn(!on)}>{on ? 'ON' : 'OFF'}</button>;
}

// ✅ Correct
'use client';

import { useState } from 'react';
// ... rest of component
{{< / highlight >}}

## Caching and Revalidation

Server Components integrate with caching:

{{< highlight tsx >}}
// Next.js fetch with caching options
async function Posts() {
  // Cache indefinitely (default)
  const posts = await fetch('https://api.example.com/posts');

  // Revalidate every 60 seconds
  const freshPosts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }
  });

  // No caching
  const realtimePosts = await fetch('https://api.example.com/posts', {
    cache: 'no-store'
  });

  return <PostList posts={posts} />;
}
{{< / highlight >}}

## Migration Strategy

When adopting Server Components:

1. **Start at the leaves**: Convert leaf components that don't need interactivity
2. **Lift state up**: Move useState to the nearest Client Component ancestor
3. **Use composition**: Pass Server Components as children to Client Components
4. **Gradual adoption**: The "use client" boundary can be anywhere in your tree

## Conclusion

React Server Components fundamentally change how we build React applications. By moving computation to the server, we get smaller bundles, direct backend access, and improved performance. The key is understanding the boundary between Server and Client Components.

Key takeaways:
- Server Components run only on the server, shipping zero JavaScript
- Use Server Components for data fetching and static content
- Use Client Components for interactivity and browser APIs
- Compose them together using the children pattern
- Start migration at leaf components and work upward
