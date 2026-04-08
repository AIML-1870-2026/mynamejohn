# LLM Switchboard — Specification

## Overview
A single-page browser tool for calling LLM APIs directly, comparing models side-by-side, and experimenting with structured JSON output. Supports OpenAI (fully functional from browser) and Anthropic (documented CORS limitation with clear user messaging). API keys are stored in memory only — never written to disk or localStorage.

## CORS Reality
- **OpenAI**: supports browser CORS requests — fully functional
- **Anthropic**: blocks all browser-origin requests — the UI surfaces a clear explanation and suggests running via a local proxy or using the OpenAI tab instead
- No backend is required for OpenAI functionality

## API Key Management
- Keys entered via manual text input or `.env` / CSV file upload
- File upload parses lines matching `OPENAI_API_KEY=...` and `ANTHROPIC_API_KEY=...`
- Keys stored in JS memory (`const keys = {}`) only — cleared on page refresh
- Masked display (shows last 4 chars) after entry
- "Clear" button wipes stored key from memory
- No localStorage, no cookies, no persistence

## Tabs

### Tab 1 — Playground
Main prompt interface.

- Provider selector: OpenAI / Anthropic
- Model selector per provider:
  - OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
  - Anthropic: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5 (CORS note shown)
- System prompt textarea (collapsible, pre-filled with sensible default)
- User prompt textarea
- Output mode toggle: **Text** / **JSON**
- JSON schema editor (shown only in JSON mode) — textarea with syntax hint
- Pre-loaded example prompts dropdown (10 examples across categories)
- **Send** button → streams or awaits response
- Response output area with copy button
- Response rendered as plain text (Text mode) or syntax-highlighted JSON (JSON mode)
- Anthropic CORS warning banner when Anthropic selected

### Tab 2 — Compare
Side-by-side model comparison.

- Single prompt input shared by both sides
- Left panel: provider + model selector A
- Right panel: provider + model selector B
- Pre-filled defaults: gpt-4o-mini (left) vs gpt-4o (right)
- **Run Both** button fires both requests in parallel (Promise.all)
- Each panel shows: response text, latency (ms), token count (if available), character count
- Winner badges: fastest ⚡, longest 📝, shown after both resolve
- Diff highlighting: words present in one response but not the other highlighted in each panel

### Tab 3 — Structured Output
JSON schema mode with validation.

- System prompt, user prompt, and JSON schema inputs
- Schema editor with example templates dropdown:
  - Product review analysis
  - News article summary
  - Recipe extraction
  - Contact info extraction
  - Sentiment + keywords
- Sends request with `response_format: { type: "json_object" }` (OpenAI) or JSON instruction injection (Anthropic)
- Response panel split: raw JSON (left) / rendered table view (right)
- Validation report: checks response against provided schema
  - Lists present fields (green checkmark)
  - Lists missing fields (red X)
  - Shows type mismatches

### Tab 4 — Metrics
Response history and performance dashboard.

- Auto-populated from all requests made in current session
- Table: timestamp, provider, model, prompt (truncated), latency (ms), tokens used, output length, mode (text/json)
- Summary stats row: total requests, avg latency, avg tokens, fastest response
- Bar chart (Chart.js): latency by request
- Clear history button
- Export as JSON button (downloads session log)

### Tab 5 — Library
Persistent prompt and schema storage via localStorage.

- Save prompt button on Playground tab → prompts user for a name → saves to localStorage
- Save schema button on Structured tab → same flow
- Library tab shows two sections: Saved Prompts and Saved Schemas
- Each entry shows: name, preview text, Load button (populates Playground/Structured), Delete button
- Import/export library as JSON file

## Example Prompts (Pre-loaded)
1. "Explain quantum entanglement to a 10-year-old"
2. "Write a haiku about debugging code at 2am"
3. "What are three underrated productivity techniques?"
4. "Summarize the French Revolution in exactly 3 sentences"
5. "Give me a contrarian take on remote work"
6. "Write a product description for an invisible bicycle"
7. "What's the difference between a virus and a bacterium?"
8. "List 5 questions a curious person should ask about AI"
9. "Write the opening line of a noir detective novel set on Mars"
10. "Explain recursion using only a metaphor about dreams"

## JSON Schema Templates
- **Sentiment Analysis**: `{ sentiment, confidence, keywords[], summary }`
- **Article Summary**: `{ title, author, date, summary, key_points[], category }`
- **Recipe Extraction**: `{ name, servings, prep_time_min, ingredients[], steps[] }`
- **Contact Info**: `{ name, email, phone, company, role }`
- **Product Review**: `{ rating, pros[], cons[], verdict, recommend_to }`

## Visual Design
- Dark mission-control aesthetic matching NEO Tracker and Drug Safety Explorer
- Background #07070f, surface #0d0d1c, cyan accent #00d4ff
- Monospace font (Courier New)
- JSON syntax highlighting: keys in cyan, strings in green, numbers in orange
- Streaming text rendered character-by-character (OpenAI stream API)
- Response area has subtle typing cursor animation while loading
- Anthropic CORS warning: orange banner with explanation and docs link

## Technical Notes
- Single HTML file, no build tools
- Chart.js via CDN for metrics tab
- OpenAI API: `https://api.openai.com/v1/chat/completions` with `Authorization: Bearer <key>`
- Anthropic API: `https://api.anthropic.com/v1/messages` — blocked by CORS from browsers
- Streaming: OpenAI supports `stream: true` with SSE; implemented for Text mode
- Token counting: extracted from `usage` field in OpenAI response
- All API keys cleared from memory on page unload (`beforeunload` event)
