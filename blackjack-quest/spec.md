# Blackjack Quest — Spec

## Project Vision

A single-player blackjack game that doubles as a **narrative point-and-click adventure**.
Blackjack is the framing device; the real content is dialogue with the characters around the table.
Tone: absurdist, warm, LucasArts-era — a goofball dealer with personal problems, a world that
reacts to you, comedy through specificity and repetition.

The aesthetic is deliberately gaudy (fake casino ads, Playfair Display serif, gold double-borders
everywhere, scrolling ticker banners) — a parody of low-rent online gambling sites.

---

## Visual Style

- **Theme**: Gaudy parody casino — deep green felt, dark red diagonal-stripe background, gold everything
- **Font**: Playfair Display (serif) for headings/buttons, Courier New for dialogue and HUD labels
- **Color palette**: `#1a4a2a` (felt), `#8B0000` (body bg stripe), `#c9a84c` / `gold` (accent)
- **Cards**: White face-up cards with rank/suit corners; dark red diagonal-stripe back
- **Layout**: Three-column grid — 180px left sidebar | 1fr game area | 180px right sidebar
- **Sidebars**: Fake casino ads (MEGA BLACKJACK PRO 2000, GALAXY BLACKJACK, SHAMROCK CASINO, etc.)
- **Tickers**: Gold scrolling ticker at top, green monospace ticker at bottom with real blackjack tips
- **Trust badges**: Fake SSL/certification badges in subtitle bar

---

## Game States

1. **BETTING** — Chip buttons active ($10/$25/$50/$100). Deal button appears once bet > 0.
2. **PLAYER_TURN** — Cards dealt. Hit, Stand, Double available.
3. **DEALER_TURN** — Dealer flips hole card, draws to 17+. Buttons hidden.
4. **RESULT** — Winner determined, payout applied, outcome message shown. New Hand button appears.
5. **BUST** — Immediate result when player exceeds 21.
6. **GAME_OVER** — Balance hits $0; overlay shown with "Perhaps check out one of our AMAZING partner casinos."

---

## Blackjack Rules

- Standard 6-deck shoe, shuffled each round (when shoe drops below 15 cards)
- Dealer stands on soft 17
- Blackjack (Ace + 10-value on initial deal) pays **1.5× bet** (2.5× total return)
- Push (tie) returns the bet
- Double Down: double the bet, receive exactly one more card, then stand automatically
- Bust = immediate loss
- Ace counts as 11, drops to 1 if it would bust the hand
- Both player and dealer blackjack = push
- Dealer blackjack checked immediately after deal (hole card revealed, settles before player acts)
- Minimum bet: $10; Maximum bet: current balance
- Starting balance: $500

---

## Stretch Features (Already Implemented)

- Card flip animation (CSS 3D transform, `rotateY`)
- Sequential deal animation — cards dealt alternating dealer/player with 380ms stagger
- Card slide-in animation (`slideIn` keyframe, cubic-bezier bounce)
- Bet chip buttons with disabled/hover states
- Double Down mechanic
- Live hand value display (bust = red blink, blackjack = green glow)
- Win/loss/push streak dots (last 12 hands)
- Dealer hand value hidden until reveal
- Game Over overlay with stats summary

---

## Narrative System — Point-and-Click Dialogue

### Architecture

All dialogue uses a **LucasArts-style dialogue bar** anchored to the bottom of the game area.
It slides in (`display: flex` + `.visible` class) over the game content without covering cards.

```
┌─────────────────────────────────────────────────┐
│ 🧑‍💼  GARY  (DEALER)                              │
│     "...some speech here."                       │
│                                                  │
│  ▶  Respond Politely                             │
│  ▶  Ask about Sharon                             │
└─────────────────────────────────────────────────┘
```

**Characters** are defined in the `CHARS` object:

```javascript
const CHARS = {
  dealer: { name: 'Gary  (Dealer)', portrait: '🧑‍💼', portraitAlt: '🫠' },
  // pitBoss: { name: 'Pit Boss', portrait: '😤', portraitAlt: '😤' },
};
```

**Core dialogue functions:**

```javascript
showDialogue(char, speech, choices)      // normal portrait
showDialogueAlt(char, speech, choices)   // alt portrait (distressed)
hideDialogue()
```

`choices` is an array of `{ label: string, cb: function }`.
Clicking a choice calls `hideDialogue()` then invokes `cb`.

---

### Dealer Hand Animation

An SVG wrinkly hand (Gary's) slides down from above the dealer zone during shuffling/dealing.

```javascript
handIn()   // adds .dealing class → top: 42px (visible)
handOut()  // removes .dealing class → top: -190px (hidden)
```

The hand uses `feTurbulence` / `feDisplacementMap` SVG filters for organic skin texture,
with bezier finger paths, knuckle stroke lines, age spots, and fingernails.

---

### Gary the Dealer — Current Dialogue

Gary drops the cards with **35% probability** each deal. `dropCount` tracks total drops per session
(resets to 0 on game restart). Each drop escalates the oversharing:

**Drop 1:**
> "Oh shoot. I dropped them again. Sorry, I'm new here. Heh. Lawyer bills!"
> [2.2s pause]
> "...*sigh* I miss you, Sharon."
> → Player: **"Respond Politely"**

**Drop 2:**
> "Oh shoot. I dropped them again. Sorry, I'm new here. Heh. Lawyer bills!"
> [2.2s pause]
> "You know, it gets tough working here. The bosses... they don't play!"
> → Player: **"Respond Politely"**

**Drop 3+:**
> "Oh shoot. I dropped them again. Sorry, I'm new here. Heh. Lawyer bills!"
> [2.2s pause]
> "You ever go through a divor-?"
> → Player: **"Just shuffle the cards, man."**

After any player response, Gary shuffles and deals normally.

---

## Characters

- **Gary** — the dealer. Recently divorced. New to the job. Overshares. Drops cards.
  - Portrait: custom SVG (round glasses, balding, big ears, nervous grin) — normal + distressed variants
  - Sharon is his ex-wife. Gary misses her. The bosses apparently "don't play."
- **Pit Boss** — watching from the side. Gets progressively angrier as Gary fumbles.
  - Portrait: 😤 / 🤬 (placeholder — drawing TBD)
- **Moe** — a small, scrungly guy who stands on the table and deals superhuman fast.
  - Portrait: placeholder — drawing TBD (user will supply)
  - Deals at 55ms stagger (vs Gary's 900ms hands-mode)

---

## Dialogue Trigger Points (Where to Add Content)

The dialogue system can fire at any game moment. Current hooks:

| Trigger | Location in code | Current behavior |
|---|---|---|
| Deal button pressed | `deal()` | Shuffle narration + optional drop sequence |
| Card drop (35% chance) | `runDropSequence(count, onDone)` | Gary overshares |
| Normal shuffle | `runShuffle(onDone)` | Gary says "shuffling cards..." |
| Blackjack result | `settleResult('blackjack')` | No dialogue yet |
| Player busts | `settleResult('lose')` after bust | No dialogue yet |
| Player wins | `settleResult('win')` | No dialogue yet |
| Game over | `showGameOver()` | Static overlay |
| New hand | `newHand()` | No dialogue yet |

To add dialogue at any trigger point:
```javascript
showDialogue(CHARS.dealer, 'Some speech', [{ label: 'Response', cb: () => { /* continue */ } }]);
```

---

## File Structure

```
blackjack-quest/
  index.html    — All CSS, HTML, and JS in one file (~1,437 lines)
  spec.md       — This document
```

- **Deployed:** `https://aiml-1870-2026.github.io/mynamejohn/blackjack-quest/`
- **Repo:** `https://github.com/AIML-1870-2026/mynamejohn.git` (branch: `main`)
- **Local:** `/Users/johnkryzsko/Documents/mynamejohn/blackjack-quest/`

---

## Narrative Arc — The Dealing Crisis

The first session plays out as a linear story that overrides random events.
Tracked via `storyPhase` (0–6). Resets on restart.

| Phase | Mode | What happens |
|---|---|---|
| 0 | Hands (slow) | Gary deals with both hands. 900ms card stagger. Fumbling dialogue. |
| 1 | Shoe offer | After hand 1 result: Gary apologises. Player can suggest a shoe (or Gary gets it anyway). |
| 2 | Shoe (1 round) | Normal 380ms stagger. Gary is briefly professional. |
| 3 | Hands post-shoe | Shoe breaks. Back to hands. Pit boss: "Gary." |
| 4 | Hands | Pit boss: "GARY. I'm watching you." |
| 5 | Hands | Pit boss: "Gary, this is your last chance." |
| 6 | Moe | Pit boss: "THAT'S IT. MOE!!!" — Moe climbs on table. 55ms stagger forever. |

**Dealer visuals:**
- Phases 0–5 (hands): both hand SVGs animate in/out
- Phase 2 (shoe): no hand SVGs (shoe is off-screen object, dialogue only)
- Phase 6 (Moe): hand SVGs hidden; Moe character portrait (drawing TBD)

**Deal speed function:** `dealStagger()` returns 900 / 380 / 55 based on phase.

**Gary portrait:** Custom SVG face — round glasses, balding, big ears, nervous smile.
Drawn by user. Coloured sparingly (warm skin wash only). Normal + distressed variants.
Hand SVGs doubled up (left + right), dark nails, prominent knuckle mole, matching sketch.

## What's Next

- **Moe portrait** — user will supply drawing; replace `'🧍'` placeholder in `CHARS.moe`
- **Pit Boss portrait** — optional drawing to replace `'😤'` placeholder
- **Gary win/bust/blackjack lines** — still unscripted (see dialogue trigger table above)
- **Sharon lore expansion** — more drop-sequence beats (4th, 5th drop)
- **Game-over Gary line** — closing monologue when balance hits $0

The `showDialogue` / `showDialogueAlt` / `hideDialogue` API is the only interface needed.
Add trigger points by calling `showDialogue` inside any existing game function.
