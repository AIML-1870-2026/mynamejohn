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

## Blackjack Rules

- Standard 6-deck shoe, shuffled when shoe drops below 15 cards
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

## Game States

1. **BETTING** — Chip buttons active ($10/$25/$50/$100). Deal button appears once bet > 0.
2. **PLAYER_TURN** — Cards dealt. Hit, Stand, Double available.
3. **DEALER_TURN** — Dealer flips hole card, draws to 17+. Buttons hidden.
4. **RESULT** — Winner determined, payout applied, outcome message shown. New Hand button appears.
5. **BUST** — Immediate result when player exceeds 21.
6. **GAME_OVER** — Balance hits $0; overlay shown.

---

## Implemented Features

- Card flip animation (CSS 3D `rotateY`)
- Sequential deal animation — stagger speed varies by story phase (see below)
- Card slide-in animation (`slideIn` keyframe, cubic-bezier bounce)
- Bet chip buttons with disabled/hover states
- Double Down mechanic
- Live hand value display (bust = red blink, blackjack = green glow)
- Win/loss/push streak dots (last 12 hands)
- Dealer hand value hidden until reveal
- Game Over overlay with stats summary
- LucasArts-style dialogue bar (anchored bottom, slides in over game)
- Two SVG dealer hands (left + right, flipped palm-down) that animate in/out
- Full narrative arc (`storyPhase` 0–6, resets on restart)

---

## Characters

All portraits are custom SVG drawn from user sketches. Stored as JS template literals in
`GARY_NORMAL`, `GARY_ALT`, `PITBOSS_NORMAL`, `PITBOSS_ALT`, `MOE_PORTRAIT`.

### Gary (Dealer)
- Recently divorced. New to the job. Overshares constantly. Drops cards.
- Portrait: round glasses, balding, big ears, jowly nervous smile — skin colour sparingly applied
- Alt portrait: wider eyes, raised brows, sweat drop (distressed)
- Sharon is his ex-wife. Gary misses her. The bosses "don't play."
- Drops cards with **35% probability** each deal in hands mode
- `dropCount` tracks drops per session, escalating oversharing

**Drop dialogue (escalating):**

| Drop # | Second beat |
|---|---|
| 1 | "...*sigh* I miss you, Sharon." → *Respond Politely* |
| 2 | "You know, it gets tough working here. The bosses... they don't play!" → *Respond Politely* |
| 3+ | "You ever go through a divor-?" → *Just shuffle the cards, man.* |

### Pit Boss
- Watches from the side. Gets progressively angrier as Gary fumbles with his hands.
- Portrait: top hat, heavy eyebrows, cigar with smoke, plain dark collar
- Alt portrait: flushed face, extreme brows, anger lines at temples

### Moe
- Small, scrungly guy. Stands on the table. Deals superhuman fast.
- Portrait: white blob body (shirtless), big round eyes, two-dot nose, pencil mustache,
  straight mouth, sparse upright hair
- Deals at 55ms stagger — effectively instant

---

## Dealer Hands

Two SVG hands (Gary's) positioned either side of centre, slide down from above the game area.
Palm-down orientation (fingers point toward table). Right hand is CSS-mirrored.

```css
#dealer-hand-left  { left: calc(50% - 100px); transform: scaleY(-1); }
#dealer-hand-right { left: calc(50% + 8px);   transform: scaleX(-1) scaleY(-1); }
```

- Organic skin texture via `feTurbulence` / `feDisplacementMap` SVG filters
- Knuckle stroke lines, age spots, prominent mole (matching user sketch)
- No fingernails

```javascript
handIn()   // adds .dealing → top: 42px (both hands visible)
handOut()  // removes .dealing → top: -200px (hidden)
```

Hands are hidden in shoe mode (phase 2) and Moe mode (phase 6+).

---

## Narrative System

### Dialogue Bar

LucasArts-style bar anchored to the bottom of the game area.

```
┌──────────────────────────────────────────────────┐
│ [portrait]  CHARACTER NAME                        │
│             "...speech..."                        │
│                                                   │
│  ▶  Choice one                                    │
│  ▶  Choice two                                    │
└──────────────────────────────────────────────────┘
```

```javascript
showDialogue(char, speech, choices)      // normal portrait
showDialogueAlt(char, speech, choices)   // alt portrait
hideDialogue()
// choices: [{ label: string, cb: function }]
```

### Characters object

```javascript
const CHARS = {
  dealer:  { name: 'Gary  (Dealer)', portrait: GARY_NORMAL,    portraitAlt: GARY_ALT    },
  pitBoss: { name: 'Pit Boss',       portrait: PITBOSS_NORMAL, portraitAlt: PITBOSS_ALT },
  moe:     { name: 'Moe',            portrait: MOE_PORTRAIT,   portraitAlt: MOE_PORTRAIT },
};
```

---

## Narrative Arc — The Dealing Crisis

Linear story tracked via `storyPhase` (0–6). Resets on restart.

| Phase | Dealer mode | Deal stagger | What happens |
|---|---|---|---|
| 0 | Hands (slow) | 900ms | Gary fumbles. Random drop (35%) still fires. |
| 1 | Shoe offer | 900ms | After hand 1: Gary apologises. Player can suggest shoe (or Gary goes anyway). |
| 2 | Shoe | 380ms | One round. Gary is briefly professional. |
| 3 | Hands | 900ms | Shoe breaks. Pit Boss: *"Gary."* (fires pre-deal) |
| 4 | Hands | 900ms | Pit Boss: *"GARY. I'm watching you."* (fires pre-deal) |
| 5 | Hands | 900ms | Pit Boss: *"Gary, this is your last chance."* (fires pre-deal) |
| 6 | Moe | 55ms | Pit Boss: *"THAT'S IT. MOE!!!"* Moe climbs on table. Fast forever. |

**Story hooks:**
- `checkPreDealNarrative(proceed)` — fires before each deal; shows pit boss in phases 3–5
- `checkPostResultNarrative()` — fires after each settled result; advances story
- `runShoeOffer()` — Gary retrieves the shoe; sets `storyPhase = 2`
- `runMoeEntrance()` — pit boss calls Moe; sets `storyPhase = 6`

**Deal speed:** `dealStagger()` returns 900 / 380 / 55 based on `storyPhase`.

---

## Dialogue Trigger Points

| Trigger | Function | Current behaviour |
|---|---|---|
| Deal button | `deal()` → `checkPreDealNarrative` | Pit boss in phases 3–5 |
| Card drop (35%) | `runDropSequence(count, onDone)` | Gary overshares (Sharon, divorce) |
| Shuffle | `runShuffle(onDone)` | Fumble lines (hands) / brisk (shoe) / instant (Moe) |
| After result | `checkPostResultNarrative()` | Advances story phase |
| Blackjack | `settleResult('blackjack')` | No dialogue yet |
| Player busts | `settleResult('lose')` after bust | No dialogue yet |
| Player wins | `settleResult('win')` | No dialogue yet |
| Game over | `showGameOver()` | Static overlay |

To add dialogue anywhere:
```javascript
showDialogue(CHARS.dealer, '"Some speech"', [{ label: 'Response', cb: () => { ... } }]);
```

---

## File Structure

```
blackjack-quest/
  index.html    — All CSS, HTML, and JS in one file
  spec.md       — This document
```

- **Deployed:** `https://aiml-1870-2026.github.io/mynamejohn/blackjack-quest/`
- **Repo:** `https://github.com/AIML-1870-2026/mynamejohn.git` (branch: `main`)
- **Local:** `/Users/johnkryzsko/Documents/mynamejohn/blackjack-quest/`

---

## What's Next

- **Gary win/bust/blackjack lines** — unscripted (hooks exist in `settleResult`)
- **Sharon lore** — 4th and 5th drop beats
- **Game-over Gary line** — closing monologue when balance hits $0
- **Pit Boss extended dialogue** — more than one line per phase
- **Moe lines** — Moe speaking while dealing (fast, terse)
