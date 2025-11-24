---
title: Complete Markdown Features Demonstration
slug: markdown-demo-comprehensive
description: A comprehensive demonstration of all markdown features including text formatting, lists, tables, code blocks, images, links, and advanced syntax elements supported in modern markdown parsers.
summary: This article showcases **every possible markdown feature** in one place. From basic formatting to advanced syntax like tables, footnotes, and code highlighting. Perfect reference for content creators and developers. [Learn more](https://commonmark.org) about markdown specifications.
keywords: [markdown, demo, tutorial, syntax, formatting]
media: https://media.giphy.com/media/l0HlQXlQ3nHyLMvte/giphy.gif
gitSourceCode: https://github.com/markdown-demo
tags:
- Markdown
- Documentation
- Tutorial
- Web Development
references:
 CommonMark Specification: https://commonmark.org/
 GitHub Flavored Markdown: https://github.github.com/gfm/
 Markdown Guide: https://www.markdownguide.org/
 Hugo Documentation: https://gohugo.io/content-management/formats/
draft: true
---

# H1: The Complete Guide to Markdown Syntax

This article demonstrates every markdown feature available in modern markdown parsers, including CommonMark, GitHub Flavored Markdown (GFM), and Hugo-specific extensions.

## H2: Text Formatting Fundamentals

### H3: Basic Inline Formatting

Markdown supports various ways to **emphasize** your text. You can make text *italic* using single asterisks or _underscores_. For stronger emphasis, use **bold text** with double asterisks or __double underscores__. You can even combine them for ***bold and italic*** or **_mixed styles_**.

#### H4: Advanced Text Styling

Modern markdown parsers support ~~strikethrough~~ text using double tildes. You can also use `inline code` for technical terms, commands, or variable names like `const myVariable = "hello"`.

##### H5: Scientific Notation

For scientific writing, you might need subscript like H~2~O or superscript like E=mc^2^. These features depend on your markdown parser's extended syntax support.

###### H6: The Smallest Header

This is the deepest header level. Generally, it's recommended to not go beyond H4 for better document structure and readability.

---

## H2: Lists and Task Management

### H3: Unordered Lists

Here are different ways to create unordered lists:

* Item one using asterisk
* Item two using asterisk
  * Nested item using two spaces
  * Another nested item
    * Deep nesting level three
* Back to top level

- Item using hyphen
- Another item
  - Nested with hyphen

+ Item using plus sign
+ Another item

### H3: Ordered Lists

1. First item
2. Second item
3. Third item
   1. Nested ordered item
   2. Another nested item
      1. Deep nesting
   3. Back to second level
4. Fourth item

You can also use sequential numbering:

1. First item
1. Second item (auto-numbered)
1. Third item (auto-numbered)

### H3: Task Lists (GFM)

Task lists are great for tracking progress:

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task
  - [x] Nested completed subtask
  - [ ] Nested incomplete subtask

### H3: Definition Lists

Term 1
:   Definition for term 1
:   Another definition for term 1

Term 2
:   Definition for term 2

***

## H2: Links and References

### H3: Link Varieties

There are multiple ways to create links in markdown:

**Inline Links:**
- [Simple link](https://www.example.com)
- [Link with title](https://www.example.com "Example Website")
- [Relative link](../blog/first-blog-post)
- [Anchor link](#h2-code-blocks-and-syntax-highlighting)

**Reference Links:**
This is a [reference link][1] and another [reference link][ref-label].

[1]: https://www.example.com
[ref-label]: https://www.markdown.org "Markdown Reference"

**Automatic Links:**
<https://www.example.com>
<email@example.com>

**URL in Text:**
Visit https://www.example.com for more information.

---

## H2: Images and Media

### H3: Basic Images

![Alt text for image](https://via.placeholder.com/600x300 "Image Title")

### H3: Referenced Images

![Logo][logo]

[logo]: https://via.placeholder.com/150 "Demo Logo"

### H3: Images with Links

[![Clickable Image](https://via.placeholder.com/400x200)](https://www.example.com)

___

## H2: Blockquotes and Citations

### H3: Simple Blockquotes

> This is a simple blockquote. Blockquotes are great for highlighting important information, quotes from other sources, or creating visual separation in your document.

### H3: Multi-Paragraph Blockquotes

> This is the first paragraph in a multi-paragraph blockquote.
>
> This is the second paragraph. Notice the empty line with just the `>` character to separate paragraphs.
>
> This is the third paragraph.

### H3: Nested Blockquotes

> This is the outer blockquote.
>
> > This is a nested blockquote inside the outer one.
> >
> > > And this is even deeper!
>
> Back to the first level.

### H3: Blockquotes with Attribution

> The best way to predict the future is to invent it.
> -- <cite>Alan Kay</cite>

> In theory, theory and practice are the same. In practice, they're not.
> -- <cite>[Yogi Berra][yogi]</cite>

[yogi]: https://en.wikipedia.org/wiki/Yogi_Berra

___

## H2: Code Blocks and Syntax Highlighting

### H3: Inline Code

Use `const` for immutable variables and `let` for mutable ones. File paths like `/usr/local/bin` or commands like `npm install` are typically shown as inline code.

### H3: Fenced Code Blocks

**JavaScript Example:**

```javascript
// Function to calculate fibonacci numbers
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`Fibonacci(10) = ${result}`);
```

**Python Example:**

```python
# Class demonstrating OOP in Python
class Calculator:
    def __init__(self, name):
        self.name = name

    def add(self, a, b):
        """Add two numbers and return result"""
        return a + b

    def multiply(self, a, b):
        """Multiply two numbers"""
        return a * b

calc = Calculator("MyCalc")
print(calc.add(5, 3))
```

**JSON Example:**

```json
{
  "name": "markdown-demo",
  "version": "1.0.0",
  "description": "A comprehensive markdown demonstration",
  "keywords": ["markdown", "demo", "tutorial"],
  "author": {
    "name": "Demo Author",
    "email": "demo@example.com"
  },
  "dependencies": {
    "marked": "^4.0.0",
    "highlight.js": "^11.0.0"
  }
}
```

**SQL Example:**

```sql
-- Select users with their order counts
SELECT
    u.id,
    u.username,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 10;
```

**Bash Example:**

```bash
#!/bin/bash

# Deploy script with error handling
set -e

echo "Starting deployment..."

# Build the project
npm run build

# Run tests
npm test

# Deploy to production
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production..."
    rsync -avz dist/ user@server:/var/www/app/
    echo "Deployment complete!"
else
    echo "Not in production environment. Skipping deployment."
fi
```

### H3: Hugo Shortcode for Syntax Highlighting

{{< highlight go "linenos=table,hl_lines=8 15-17,linenostart=1" >}}
package main

import (
    "fmt"
    "net/http"
)

// HandleRequest processes incoming HTTP requests
func HandleRequest(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    // Register handler and start server
    http.HandleFunc("/", HandleRequest)
    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}
{{< / highlight >}}

---

## H2: Tables and Data Presentation

### H3: Basic Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headers | Yes | H1-H6 |
| Bold | Yes | **text** |
| Italic | Yes | *text* |
| Links | Yes | [link](url) |
| Images | Yes | ![alt](url) |

### H3: Column Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Row 1 Col 1  | Row 1 Col 2    | Row 1 Col 3   |
| Row 2 Col 1  | Row 2 Col 2    | Row 2 Col 3   |
| Long content | Short          | 12345         |

### H3: Tables with Formatting

| Language   | Type Paradigm  | First Released | Popular Use Cases          |
|:-----------|:---------------|---------------:|:---------------------------|
| **Python** | Multi-paradigm |           1991 | Data Science, Web, AI      |
| **JavaScript** | Multi-paradigm |       1995 | Web Development            |
| *Java*     | Object-Oriented |          1995 | Enterprise, Android        |
| **Go**     | Compiled       |           2009 | Cloud, Microservices       |
| `Rust`     | Systems        |           2010 | Systems, Performance       |

### H3: Complex Table Example

| Method | Endpoint | Parameters | Response | Auth Required |
|:-------|:---------|:-----------|:---------|:-------------:|
| GET | `/api/users` | `limit`, `offset` | User[] | ✓ |
| POST | `/api/users` | `name`, `email` | User | ✓ |
| PUT | `/api/users/:id` | `name`, `email` | User | ✓ |
| DELETE | `/api/users/:id` | - | 204 | ✓ |
| GET | `/api/public` | - | Data | ✗ |

### H3: Side-by-Side Content Using Tables

Tables are excellent for creating side-by-side layouts. Here are several examples:

**Example 1: Image with Code**

| Visual | Code |
|:-------|:-----|
| ![Placeholder Image](https://via.placeholder.com/300x200) | ```javascript<br>function greet(name) {<br>  return `Hello, ${name}!`;<br>}<br><br>console.log(greet("World"));<br>``` |

**Example 2: Code with Explanation**

| Code Example | Explanation |
|:-------------|:------------|
| `const pi = 3.14159;`<br>`const radius = 5;`<br>`const area = pi * radius ** 2;` | This code calculates the area of a circle.<br><br>1. Define the constant π<br>2. Set the radius<br>3. Calculate area using πr² |

**Example 3: Multiple Images Side by Side**

| Image 1 | Image 2 | Image 3 |
|:-------:|:-------:|:-------:|
| ![Image 1](https://via.placeholder.com/200x150) | ![Image 2](https://via.placeholder.com/200x150) | ![Image 3](https://via.placeholder.com/200x150) |
| Caption for image 1 | Caption for image 2 | Caption for image 3 |

**Example 4: Before and After Comparison**

| Before ❌ | After ✅ |
|:---------|:--------|
| `var x = 10;`<br>`var y = 20;`<br>`var sum = x + y;` | `const x = 10;`<br>`const y = 20;`<br>`const sum = x + y;` |
| Using `var` which has function scope and can cause issues | Using `const` for immutable values, which is more predictable |

**Example 5: Feature Comparison with Visuals**

| Feature | Free Plan | Pro Plan |
|:--------|:---------:|:--------:|
| Storage | ![Small](https://via.placeholder.com/50x50/ff6b6b/ffffff?text=5GB) | ![Large](https://via.placeholder.com/50x50/51cf66/ffffff?text=100GB) |
| Users | 1 user | Unlimited |
| Support | Email only | 24/7 Phone + Email |
| Price | $0/month | $29/month |

**Example 6: Using HTML for True Multiline Content**

Since standard markdown tables don't support multiline cells well, you can use HTML tables for more complex layouts:

<table>
<tr>
<td width="50%">

**Image Example**

![Demo Image](https://via.placeholder.com/250x200)

This is a caption with multiple lines
that can span and include **formatting**.

</td>
<td width="50%">

**Code Example**

```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);
}

const total = calculateTotal(cart);
console.log(total);
```

This code demonstrates array reduction.

</td>
</tr>
</table>

**Example 7: HTML Table with Multiple Content Types**

<table>
<tr>
<td>

### Feature Overview

- Easy to use
- Fast performance
- Great documentation

> "This is an amazing tool!"

</td>
<td>

```python
def hello_world():
    print("Hello, World!")

hello_world()
```

You can include:
1. Code blocks
2. Lists
3. Any markdown!

</td>
<td>

![Icon](https://via.placeholder.com/100x100)

**Benefits:**
- ✅ Flexible
- ✅ Powerful
- ✅ Simple

</td>
</tr>
</table>

**Tips for Side-by-Side Content:**

- Use `<br>` tags for simple line breaks within markdown table cells
- Code blocks in markdown tables need `<br>` instead of actual newlines
- For **true multiline content with code blocks, lists, or complex formatting**, use HTML `<table>` tags
- In HTML tables, leave blank lines around markdown content blocks
- Align columns appropriately (`:---` left, `:---:` center, `---:` right)
- Keep content balanced between columns for best visual results
- Consider mobile responsiveness - tables may stack on small screens
- HTML tables give you more control but are more verbose

---

## H2: Horizontal Rules

Horizontal rules can be created multiple ways:

Using three hyphens:

---

Using three asterisks:

***

Using three underscores:

___

---

## H2: HTML Elements in Markdown

### H3: Keyboard Input

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.

Use <kbd>Cmd</kbd> + <kbd>V</kbd> on Mac or <kbd>Ctrl</kbd> + <kbd>V</kbd> on Windows to paste.

### H3: Highlighted Text

This is <mark>highlighted text</mark> using HTML mark tags.

### H3: Abbreviations

The <abbr title="HyperText Markup Language">HTML</abbr> specification is maintained by <abbr title="World Wide Web Consortium">W3C</abbr>.

### H3: Details/Summary (Collapsible Content)

<details>
<summary>Click to expand</summary>

This content is hidden by default and can be expanded by clicking the summary.

You can include:
- Lists
- **Formatted text**
- `Code`
- And more!

</details>

---

## H2: Special Characters and Escaping

### H3: Escaping Markdown Characters

To display literal markdown characters, escape them with backslash:

- \* asterisk (not italic)
- \_ underscore (not italic)
- \# hash (not header)
- \[ bracket (not link)
- \` backtick (not code)
- \\ backslash itself

### H3: Emojis

You can use emoji codes (if supported):

- :smile: :heart: :thumbsup:
- :rocket: :fire: :star:
- :computer: :books: :coffee:

Or use Unicode emojis directly: 😀 🚀 💻 📚 ⭐

---

## H2: Footnotes

Markdown supports footnotes[^1] for additional information. You can reference them anywhere[^2] in your document.

Here's a footnote with a longer description[^longnote].

Multiple references to the same footnote[^1] are also supported.

[^1]: This is the first footnote with simple text.

[^2]: This is the second footnote.

[^longnote]: This is a footnote with multiple paragraphs and code.

    Indent paragraphs to include them in the footnote.

    `code blocks` can also be included.

    You can add as many paragraphs as needed.

---

## H2: Advanced Features

### H3: Line Breaks

To create a line break, end a line with two or more spaces,
or use a backslash\
like this.

Or simply use a blank line to create a new paragraph.

### H3: Comments

[//]: # (This is a comment that won't appear in the rendered output)

[//]: # (Comments are useful for notes to yourself or other authors)

### H3: Mathematics (if supported)

Inline math: $E = mc^2$

Block math:

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

---

## H2: Best Practices and Tips

### H3: Document Structure

1. **Use headers hierarchically**: Don't skip levels (e.g., H1 to H3)
2. **One H1 per document**: Typically the title
3. **Consistent formatting**: Choose one style and stick with it
4. **Blank lines**: Use them to separate blocks for readability

### H3: Accessibility

- Provide alt text for all images
- Use descriptive link text instead of "click here"
- Structure content logically with headers
- Use tables for data, not layout

### H3: Performance

- Optimize images before embedding
- Use external links for large media files
- Consider lazy loading for image-heavy documents
- Minimize nested blockquotes and lists

---

## H2: Summary and Conclusion

This document has demonstrated every major markdown feature:

1. ✓ All six header levels (H1-H6)
2. ✓ Text formatting (bold, italic, strikethrough, subscript, superscript)
3. ✓ Lists (ordered, unordered, nested, task lists)
4. ✓ Links (inline, reference, automatic)
5. ✓ Images (standard, referenced, with links)
6. ✓ Blockquotes (simple, nested, with citations)
7. ✓ Code blocks (inline, fenced, with syntax highlighting)
8. ✓ Tables (basic, aligned, formatted)
9. ✓ Horizontal rules
10. ✓ HTML elements (kbd, mark, abbr, details)
11. ✓ Emojis
12. ✓ Footnotes
13. ✓ Escaping characters
14. ✓ Mathematics
15. ✓ Hugo shortcodes

> "Markdown is intended to be as easy-to-read and easy-to-write as is feasible."
> -- <cite>John Gruber, Creator of Markdown</cite>

---

### Additional Resources

For more information about markdown:

- [CommonMark Specification](https://commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Hugo Documentation](https://gohugo.io/)

---

*This document was created as a comprehensive reference for all markdown features. Feel free to use it as a template or learning resource.*

**Last Updated**: 2025-11-23
**Version**: 1.0.0
**License**: MIT
