# Product Review Generator — Specification

## Overview
A single-page browser tool for generating AI-powered product reviews using OpenAI's API. Users configure product details, review tone, target sentiment, and aspect focus, then generate markdown-rendered reviews with a single click. Built on the same API infrastructure as the LLM Switchboard.

**Ethical Notice:** The FTC banned fake AI-generated reviews (effective October 2024), with penalties up to $51,744 per violation. This tool is educational — it demonstrates what LLMs can produce. Do not use generated content as genuine reviews.

## Core Features

### API Key Management
- OpenAI key entered via password input at the top of the page
- Key stored in JS memory only — never written to localStorage, cookies, or disk
- Status badge shows SET / NOT SET
- Clear button wipes key from memory
- `.env` file upload parses `OPENAI_API_KEY=...` automatically

### Product Info Panel
- **Product Name**: text input (required)
- **Product Description**: textarea — features, specs, what makes it notable
- **Category**: dropdown — Electronics, Clothing & Apparel, Food & Beverage, Home & Kitchen, Sports & Outdoors, Beauty & Personal Care, Books & Media, Software & Apps, Other

### Review Controls
- **Model**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Tone**: Casual, Professional, Expert, Enthusiast, Skeptical
- **Sentiment**: Positive (4–5 stars), Balanced (3 stars), Critical (1–2 stars)
- **Length**: Short (~100 words), Medium (~250 words), Long (~500 words)
- **Star Rating**: 1–5 selector (visual stars UI, updates sentiment preset)

### Aspect Focus
Multi-select checkboxes — model is instructed to address each checked aspect:
- Build Quality / Durability
- Value for Money
- Performance / Speed
- Design & Aesthetics
- Ease of Use
- Customer Support
- Packaging & Delivery

### Generation
- **Generate** button fires OpenAI chat completions API (streaming)
- System prompt: instructs model to write a review for the configured product with the selected tone, sentiment, star rating, length, and aspects
- User-visible prompt preview (collapsible) shows exactly what is sent to the API
- Streaming output — text appears character by character with blinking cursor

### Output Panel
- Response rendered as formatted markdown (via marked.js CDN)
- Star rating displayed visually (★★★☆☆ etc.)
- Copy button — copies raw markdown to clipboard
- Regenerate button — re-sends same configuration for a fresh variation
- Token usage and latency shown after generation completes

### Sentiment Analysis Panel (optional extension)
After generation, a secondary call analyzes the generated review and returns:
```json
{
  "overall_sentiment": "positive",
  "confidence": 0.91,
  "aspect_scores": {
    "build_quality": 4.5,
    "value": 3.8,
    "performance": 4.2
  },
  "key_phrases": ["sturdy construction", "a bit pricey", "blazing fast"]
}
```
Displayed as a compact breakdown with mini bar chart per aspect.

## Prompt Construction
System prompt template:
```
You are writing a product review for a consumer website.
Product: {name}
Category: {category}
Description: {description}

Write a {tone} {sentiment} review approximately {length} words long.
Target star rating: {stars}/5
Address these aspects: {aspects}

Format the review with:
- A catchy headline (H3)
- Opening paragraph
- Pros section (bullet list)
- Cons section (bullet list)
- Closing verdict

Use markdown formatting.
```

## Visual Design
- Dark mission-control aesthetic matching LLM Switchboard and NEO Tracker
- CSS variables: `--bg: #07070f`, `--surface: #0d0d1c`, `--cyan: #00d4ff`
- Monospace font (Courier New)
- Streaming cursor animation during generation
- FTC warning banner — orange, persistent at the bottom of the page

## Technical Notes
- Single HTML file, no build tools
- marked.js via CDN for markdown rendering
- OpenAI API: `https://api.openai.com/v1/chat/completions` with `stream: true`
- SSE parsing via `ReadableStream` / `TextDecoder`
- All API keys cleared from memory on page unload (`beforeunload` event)
- No backend required
