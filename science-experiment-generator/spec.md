# Science Experiment Generator — Spec

## Overview

A static single-page web app that uses the OpenAI chat completions API to generate age-appropriate, hands-on science experiments from a grade level and a list of available household materials.

---

## Reference Implementation

The `temp/` folder contains the LLM Switchboard — a general-purpose LLM playground built earlier in this course. The Science Experiment Generator adapts these patterns directly:

- **API key handling** — key stored in a JS variable (`let apiKey`), never written to localStorage, sessionStorage, or any persistent store. Cleared on `beforeunload`. Loaded from `.env` file via `FileReader` using the same regex pattern as the Switchboard.
- **Streaming fetch** — identical `fetch` call to `https://api.openai.com/v1/chat/completions` with `stream: true`, reading chunks via `ReadableStream` and `TextDecoder`, parsing `data:` lines to extract `delta.content`.
- **Error handling** — non-OK responses parsed as JSON for the `error.message` field, with a fallback string including the HTTP status code.
- **Single-file deployment** — everything in one `index.html` with no build step, no npm, no external JS dependencies (fonts loaded via Google Fonts CDN only).

---

## Design Constraints

- **OpenAI only** — no provider switching; the app only calls `api.openai.com`
- **Unstructured output** — free-form markdown text, no JSON schema or `response_format`
- **No backend** — runs entirely in the browser; deploys to GitHub Pages as a static file
- **API key privacy** — key lives only in memory for the duration of the session

---

## Inputs

| Input | Type | Notes |
|---|---|---|
| Grade Level | `<select>` dropdown | Kindergarten through 12th Grade |
| Available Materials | `<textarea>` | Comma-separated household items |
| Science Domain | Pill toggle | Any, Chemistry, Physics, Biology, Earth Science, Engineering |
| API Key | Password `<input>` or `.env` file upload | In-memory only |

---

## Output

The model returns a markdown-formatted experiment with these sections:

1. Title (`#` heading)
2. Learning Objective
3. Materials Needed
4. Step-by-Step Instructions
5. What to Observe
6. The Science Behind It

The app renders this as formatted HTML — headings, lists, bold/italic — using a custom `renderMarkdown()` function (no external library).

---

## System Prompt Strategy

The system prompt instructs the model to:
- Be an expert science educator
- Match vocabulary and complexity exactly to the specified grade level
- Use only household materials
- Focus on safe, observable, hands-on results

The selected domain (if not "Any") is appended to the user prompt as a constraint.

---

## Stretch Features Implemented

- Science domain filter (pill selector) appended to prompt
- "Surprise Me" — randomizes grade, domain, and supply preset
- Post-generation remix actions (Harder, Easier, Different Approach, Add Extension)
- Step-by-step walkthrough mode (fullscreen, keyboard-navigable)
- Share via URL (experiment encoded in `#` hash)
- Session history (all generations tracked in-memory, loadable)
- Meta badges (difficulty level, estimated time, domain)
- Print stylesheet (clean white output, no dark chrome)
- Download as `.md` file
