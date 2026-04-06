# Drug Safety Explorer — Specification

## Overview
A single-page web dashboard for exploring FDA drug safety data. Queries live OpenFDA endpoints — no API key required. Users can look up individual drugs, compare two drugs side-by-side, browse FAERS adverse event reports, view recall history, and explore safety profiles across entire drug classes. Includes an educational disclaimer and contextual help modals explaining data limitations.

## Data Sources

### OpenFDA (All endpoints — no API key required)
Base URL: `https://api.fda.gov`

| Endpoint | Used For |
|---|---|
| `/drug/label.json` | FDA-approved labeling: boxed warnings, interactions, adverse reactions, indications |
| `/drug/event.json` | FAERS adverse event reports: top reactions, total counts, co-administration drugs |
| `/drug/enforcement.json` | Recall and enforcement actions with classification and reason |

### Search Strategy
- Primary search field: `openfda.brand_name:"<drug>"`
- Fallback: `openfda.generic_name:"<drug>"`
- Full-text fallback for label tab: `"<drug>"` across all fields
- Autocomplete sourced from a predefined list of ~50 common drugs (avoids rate-limiting the API on every keystroke)

## Tabs

### Tab 1 — Drug Lookup
- Search input with autocomplete dropdown (predefined common drugs list)
- On search, fetches `/drug/label.json`
- Displays:
  - Brand name, generic name, manufacturer
  - Boxed warning (if present) — displayed in prominent red-bordered card
  - Warnings & precautions (collapsible)
  - Drug interactions section
  - Adverse reactions section
  - Indications and usage
- Each section rendered from raw label text; "No data available" shown gracefully when field is absent
- "What does this mean?" help link opens FAERS/label explainer modal

### Tab 2 — Adverse Events (FAERS)
- Drug search input
- Fetches `/drug/event.json` with `count=patient.reaction.reactionmeddrapt.exact` for top reactions
- Fetches total event report count from `meta.results.total`
- Displays:
  - Total FAERS report count for the drug
  - Horizontal bar chart (Chart.js) — top 15 reported reactions by frequency
  - Co-administration section: top drugs appearing alongside this drug in reports (`count=patient.drug.openfda.brand_name.exact`)
  - "⚠ About FAERS" info button — opens modal explaining FAERS limitations
- FAERS explainer modal content:
  - Reports are voluntary and may be duplicated
  - Correlation ≠ causation; does not prove the drug caused the reaction
  - Reporting rates vary by drug popularity and media attention
  - Not a substitute for medical advice

### Tab 3 — Recalls
- Drug search input
- Fetches `/drug/enforcement.json?search=product_description:"<drug>"`
- Table columns: date, product description, recalling firm, classification, reason, status
- Color-coded classification badges:
  - Class I (red) — serious adverse health consequences or death possible
  - Class II (orange) — temporary or reversible adverse health effects
  - Class III (yellow) — unlikely to cause adverse health consequences
- Recall count summary shown above table
- "What are recall classes?" help button explains classification system
- Graceful empty state if no recalls found

### Tab 4 — Compare
- Two drug search inputs, pre-loaded with **Warfarin** and **Ibuprofen**
- Side-by-side panels showing for each drug:
  - Total FAERS adverse event reports
  - Has boxed warning? (Yes/No badge)
  - Recall count
  - Top 5 adverse reactions
- Grouped horizontal bar chart comparing top reactions for both drugs simultaneously
- Swap button to exchange drug A and drug B

### Tab 5 — Drug Classes (Stretch)
- Dropdown of drug classes:
  - SSRIs: Fluoxetine, Sertraline, Paroxetine, Citalopram, Escitalopram
  - Statins: Atorvastatin, Simvastatin, Rosuvastatin, Pravastatin, Lovastatin
  - NSAIDs: Ibuprofen, Naproxen, Celecoxib, Diclofenac, Meloxicam
  - ACE Inhibitors: Lisinopril, Enalapril, Ramipril, Captopril, Benazepril
  - Beta Blockers: Metoprolol, Atenolol, Carvedilol, Propranolol, Bisoprolol
- On class select: fetches total FAERS event count for each drug in the class (staggered to avoid rate limits)
- Horizontal bar chart comparing event report totals across the class
- Caveat note: report counts reflect drug popularity and age, not absolute risk

## Modals

### FAERS Limitations Modal
- Triggered from "⚠ About FAERS" button on Adverse Events tab
- Explains: voluntary reporting, no causality, underreporting, duplicate reports, confounding by indication

### Recall Classes Modal
- Triggered from "?" button on Recalls tab
- Explains: Class I / II / III definitions per FDA classification system

## Visual Design
- Dark theme: near-black background (#07070f), cyan accent (#00d4ff)
- Monospace font (Courier New) throughout
- Boxed warnings: red (#ff2244) left border + background tint
- Class I recall badge: red; Class II: orange; Class III: yellow
- Chart.js charts: dark-styled, cyan/orange color palette
- Autocomplete dropdown: surface card below input, keyboard-navigable
- Pulsing green "LIVE" indicator in header

## Required Legal Elements
- Educational disclaimer banner: "This tool is for educational purposes only. Not medical advice. Always consult a healthcare provider."
- FDA attribution in footer: "Data sourced from OpenFDA. FDA is not responsible for the accuracy of this tool."
- FAERS limitations modal accessible from Adverse Events tab

## Technical Notes
- Single HTML file with inline CSS and JS
- Chart.js loaded via CDN (`cdn.jsdelivr.net/npm/chart.js`)
- OpenFDA supports CORS — no proxy or backend needed
- Rate limit: ~240 requests/minute without key; drug class tab staggers requests with 200ms delay between calls
- Tabs are lazy-loaded; data only fetched when tab is first activated (except Compare which pre-loads on page load)
- Chart instances destroyed and recreated on new search to prevent canvas reuse errors
