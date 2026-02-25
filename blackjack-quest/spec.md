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

## Characters (Planned)

- **Gary** — the dealer. Recently divorced. New to the job. Overshares. Drops cards.
  - Portrait: 🧑‍💼 (normal) / 🫠 (distressed)
  - Sharon is his ex-wife. Gary misses her. The bosses apparently "don't play."
- **Pit Boss** — watching from the side. Implied threat. Has not spoken yet.
  - Stub in CHARS: `pitBoss: { name: 'Pit Boss', portrait: '😤', portraitAlt: '😤' }`
- **Other players / characters** — TBD as dialogue is scripted

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

## What's Next — Scripting

The game loop works. The dialogue system works. The visual style is set.

**The remaining work is writing the script** — deciding what Gary (and eventually other
characters) say, when they say it, and what the player's choices look like.

Candidate moments to script next:

- **Player wins big** — Gary momentarily impressed, then circles back to Sharon somehow
- **Player busts** — Gary empathetic in a misplaced way ("Rough one. Sharon used to say I never knew when to stand either.")
- **Player hits blackjack** — Gary snaps into professionalism for exactly one beat before losing it again
- **Pit Boss cameo** — appears after Gary drops cards multiple times ("Gary. A word.")
- **Gary's closing line** — when the session ends / game over
- **Running gag continuations** — the three-beat drop joke has room for a fourth beat, a fifth

The `showDialogue` / `showDialogueAlt` / `hideDialogue` API is the only interface needed.
Add new characters to `CHARS`. Add new trigger points by calling `showDialogue` inside any
existing game function (`settleResult`, `newHand`, `showGameOver`, etc.).
