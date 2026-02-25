# The Greatest Casino! — Spec

## Project Vision

A scripted narrative game disguised as blackjack. The blackjack hands are predetermined.
The real content is Gary — a recently-divorced dealer barely holding it together at the
simplest game in the house. Tone: absurdist, warm, LucasArts-era. Comedy through escalation
and specificity. Gary's problems get worse. The player watches.

The aesthetic is deliberately gaudy — a parody of low-rent online gambling sites.

---

## Title

**"THE GRE&nbsp;&nbsp;TEST CASINO!"**

The A in GREATEST flickers via CSS `visibility` animation on a 5s loop. Hidden ~90% of the time.
Reads "GRE TEST" by default. When it flickers on briefly it completes: "GREATEST".

```css
#flicker-a { visibility: hidden; animation: flickerA 5s step-end infinite; }
```

---

## Visual Style

- **Theme**: Gaudy parody casino — deep green felt (`#1a4a2a`), dark red diagonal-stripe body (`#8B0000`), gold everything
- **Font**: Playfair Display (serif) for headings/buttons, Courier New for dialogue and HUD labels
- **Layout**: Three-column grid — 180px left sidebar | 1fr game area | 180px right sidebar
- **Sidebars**: Fake casino ads (MEGA BLACKJACK PRO 2000, GALAXY BLACKJACK, SHAMROCK CASINO, etc.)
- **Tickers**: Gold scrolling ticker at top (swaps to DEAL DEAL DEAL on first deal), green monospace at bottom
- **Trust badges**: Fake SSL/certification badges in subtitle bar
- **Cards**: White face-up, dark red diagonal-stripe back
- **Deal flash overlay**: `#deal-flash-overlay` — gold radial glow, triggered once on Gary's enthusiasm line

---

## Blackjack Rules

- Standard 6-deck shoe, reshuffled when below 15 cards
- Dealer stands on soft 17
- Blackjack pays **1.5× bet** (2.5× total return)
- Push returns the bet
- Double Down: double bet, one more card, auto-stand
- Bust = immediate loss
- Ace = 11, drops to 1 to avoid bust
- Both blackjack = push
- Dealer blackjack checked immediately after deal
- Minimum bet $10, maximum = current balance
- Starting balance $500

---

## Game States

1. **BETTING** — Chips active, Deal button appears once bet > 0
2. **PLAYER_TURN** — Hit, Stand, Double available
3. **DEALER_TURN** — Dealer reveals hole card, draws to 17+
4. **RESULT** — Outcome shown, New Hand button appears
5. **GAME_OVER** — Balance hits $0

---

## Characters

All portraits are user-drawn PNGs (base64 embedded, green-screen chroma keyed).
SVG placeholders have been replaced. Dialogue portrait slot is 100×120px.

### Gary (Dealer)
- Recently divorced. New to the job. Trying not to overshare. Failing.
- Sharon is his ex-wife. Lawyer bills are a sore point.
- Drops cards. Fumbles shuffles. Genuinely trying.
- Portrait: `GARY_NORMAL` — round glasses, balding, jowly nervous smile
- Alt portrait: `GARY_ALT` — wider eyes, raised brows, distressed

**Drop dialogue (escalating by `dropCount`):**

| Drop # | First beat (auto, 4.8s) | Second beat (player clicks) |
|---|---|---|
| 1 | "Oh shoot. I dropped them again. Sorry, I'm new here. Heh. Lawyer bills!" | "...*sigh* I miss you, Sharon." → *Respond Politely* |
| 2 | same | "You know, it gets tough working here. The bosses... they don't play!" → *Respond Politely* |
| 3+ | same | "You ever go through a divor-?" → *Just shuffle the cards, man.* |

### Pit Boss
- Watches. Gets progressively angrier.
- Portrait: `PITBOSS_NORMAL` — top hat, heavy brows, cigar, dark ruffled collar
- Alt: `PITBOSS_ALT` — flushed, extreme brows, anger lines

### Moe
- Small, scrungly. Stands on the table. Deals superhuman fast.
- Portrait: `MOE_PORTRAIT` — white blob body, big round eyes, pencil mustache, sparse upright hair, belt/cummerbund
- User-drawn PNG embedded; appears on table at phase 6

---

## Dealer Hands

User-drawn PNG art (base64 embedded). Source: `Untitled_Artwork 3.jpg` (green screen background).
Green chroma-keyed out. Left hand + horizontally mirrored right. No shadow, no CSS drop-shadow.

```css
.dealer-hand-img { position: absolute; height: 190px; top: -230px; transition: top 0.35s linear; }
.dealer-hand-img.dealing { top: 20px; }
#dealer-hand-left  { left: calc(50% - 110px); }
#dealer-hand-right { left: calc(50% + 52px); }
```

Hands slide in via CSS `top` transition (linear). Card following uses a **pure RAF loop** —
no CSS transitions on `transform` at all. Only the left hand follows the card to its slot;
right hand stays at the deck.

```javascript
handIn()   // adds .dealing → CSS top: 20px (linear 0.35s)
handOut()  // removes .dealing, resets transform instantly
slideCardFromDeck(wrapper)  // RAF loop: card + left hand slide together (SLIDE=6000ms),
                            // hand returns (RETURN=2000ms). dealStagger=7000ms hands mode.
```

---

## Narrative System

### Dialogue Bar

LucasArts-style bar anchored to the bottom of the game area.

```
┌──────────────────────────────────────────────────┐
│ [portrait]  CHARACTER NAME                        │
│             "...speech..."                        │
│  ▶  Choice one      ▶  Choice two                 │
└──────────────────────────────────────────────────┘
```

```javascript
showDialogue(char, speech, choices)      // normal portrait
showDialogueAlt(char, speech, choices)   // alt portrait (distressed)
hideDialogue()
// choices: [{ label: string, cb: function }]
```

---

## Shuffle Animation

**Hands mode (~10 seconds):** Overhand shuffle — a single card peels off the top of a
floating deck, hovers, returns. Loops. Both Gary hands visible. Gary mutters a fumble line.

```javascript
// #shuffle-deck + #shuffle-fly-card — positioned absolutely in game area
// fly card: @keyframes overhandShuffle (2.6s ease-in-out infinite)
```

**Shoe mode:** Instant. Gary says "Okay — shoe, shoe, shoe—". Resolves in 750ms.

**Moe mode:** 120ms. No dialogue.

---

## Drop Animation

When Gary drops cards (hands mode only):

1. `showDropPile()` — 5 scattered face-down cards appear with staggered fall animation
2. First beat auto-dismisses after **4.8 seconds** (Gary: "Oh shoot... Lawyer bills!")
3. Second beat: player-clickable (escalating Sharon/divorce lore)
4. On player click: `hideDropPile(cb)` — cards float back up (0.95s), then `cb` → shuffle

```javascript
showDropPile()       // renders scattered .drop-card elements, @keyframes cardFall
hideDropPile(cb)     // adds .returning → @keyframes cardReturn, then calls cb
```

---

## Scripted Narrative Arc

This is a **scripted game**. Hands are predetermined. The story drives the blackjack,
not the other way around. `storyPhase` (0–6) tracks position in the arc.

### Phase Table

| Phase | Dealer mode | Deal stagger | Narrative |
|---|---|---|---|
| 0 | Hands | 3750ms | Intro sequence. Scripted hand 1 (player wins). |
| 1 | Hands | 3750ms | Post-win awkward silence. Shoe offer fires during next shuffle. |
| 2 | Shoe | 380ms | One scripted round. Gary briefly professional. |
| 3 | Hands | 3750ms | Shoe breaks. Pit Boss: *"Gary."* (pre-deal) |
| 4 | Hands | 3750ms | Pit Boss: *"GARY. I'm watching you."* (pre-deal) |
| 5 | Hands | 3750ms | Pit Boss: *"Gary, this is your last chance."* (pre-deal) |
| 6 | Moe | 55ms | Pit Boss calls Moe. Moe appears on table. Fast forever. |

### Scripted Hands

**Hand 1** — `setupScriptedHand1()` pushes cards to shoe end (drawn via `shoe.pop()`):

| Draw | Card | Goes to |
|---|---|---|
| 1st | 8♠ | Dealer face-up |
| 2nd | Q♥ | Player card 1 |
| 3rd | 9♦ | Dealer hole |
| 4th | Q♠ | Player card 2 → **20** |
| 5th | A♣ | Player hit → **21** |

Dealer total: 17 (stands). Player wins at 20 (stand) or 21 (hit). Win guaranteed.

*Further scripted hands: TBD.*

### Intro Sequence (Phase 0, first deal only)

```
Gary:    "So, uh— are you familiar with Blackjack?"
Player:  [All too well.] → Gary enthusiasm
         [Not at all.]  → 3-beat rules explanation → Gary enthusiasm

Gary enthusiasm (runGaryEnthusiasm):
  - Ticker → "DEAL! DEAL! DEAL!"
  - Gold flash overlay fires
  - Gary: "Alright! Let's get dealing!!!"
  - 2.5s, then BETTING state begins
```

Rules explanation is clean and professional. Gary holds it together.
No oversharing yet. The cracks come later.

### Post-Hand-1 (Phase 0 → 1)

```
Gary:    "Hey hey, there you go! First try!
          ...Not everything goes well, on the first try."
Player:  [break awkward silence] → hideDialogue
```

### Shoe Offer (Phase 1, during hand-2 shuffle)

The shoe option appears as a dialogue choice during Gary's 10-second shuffle:

```
Gary:    [fumble line + overhand shuffle animation running]
Player:  [Have you considered a shoe?]
         → clearTimeout, cancel shuffle, setButtons('BETTING'), runShoeOffer()
```

If player ignores it, shuffle completes and deal proceeds normally.

### Shoe Sequence (Phase 1 → 2)

```
Gary:  "Found it! Okay! This is a shoe. Professional casino equipment. Much better."
Player: [Let's see it.] → storyPhase = 2
```

### Post-Shoe (Phase 2 → 3)

After shoe round result:
```
Gary:  "See? Smooth. That's called professionalism..."
Player: [...what was that sound?]
Gary:  "[CRACK] ...The shoe. It broke."
Player: [Of course it did.] → hideDialogue, storyPhase = 3
```

### Pit Boss Escalation (Phases 3–5, pre-deal)

| Phase | Line | Player response |
|---|---|---|
| 3 | *"Gary."* | (Gary shuffles) |
| 4 | *"GARY. I'm watching you."* | (Silence) |
| 5 | *"Gary, this is your last chance. Those cards had better move."* | (Gary shuffles. Slower than usual.) |

### Moe Entrance (Phase 5 → 6)

```
Pit Boss: "THAT'S IT. MOE!!!"
Player:   [(A distant clattering)]
→ Moe PNG appears on table, hands retract
Moe:      "[Moe has climbed onto the table. He is already dealing.]"
Player:   [Okay.] → hideDialogue
```

---

## Dialogue Trigger Map

| Trigger | Function | Behaviour |
|---|---|---|
| First deal ever | `deal()` → `runIntroDialogue` | Gary asks if player knows the game |
| Post-intro | `runGaryEnthusiasm` | DEAL flash, ticker, Gary's enthusiasm |
| Deal button (phases 3–5) | `checkPreDealNarrative(proceed)` | Pit boss pre-deal lines |
| Card drop (35%, hands mode) | `runDropSequence(count, onDone)` | Gary overshares (Sharon, lawyer bills) |
| Shuffle (hands mode, phase 1) | `runShuffle(onDone)` | Shoe offer available as choice |
| Shuffle (hands mode, others) | `runShuffle(onDone)` | Fumble line, auto-resolves 10s |
| After result | `checkPostResultNarrative()` | Advances storyPhase |
| Player wins | `settleResult('win')` | **No dialogue yet** |
| Player busts | `settleResult('lose')` | **No dialogue yet** |
| Blackjack | `settleResult('blackjack')` | **No dialogue yet** |
| Balance hits $0 | `showGameOver()` | Static overlay — **no Gary line yet** |

---

## Key Functions Reference

```javascript
// Narrative
runIntroDialogue(proceed)       // fires on first deal only (stats.hands === 0)
runRulesExplanation(proceed)    // 3-beat clean explanation
runGaryEnthusiasm(proceed)      // DEAL flash + ticker swap + Gary line
setupScriptedHand1()            // pushes scripted cards to shoe (called at init + restart)
checkPreDealNarrative(proceed)  // pit boss lines phases 3–5
checkPostResultNarrative()      // advances storyPhase after each result
runShoeOffer()                  // Gary retrieves shoe → storyPhase = 2
runMoeEntrance()                // Pit Boss snaps, Moe appears → storyPhase = 6

// Dealing
dealStagger()                   // 3750ms / 380ms / 55ms by phase
handIn() / handOut()            // slide hands in/out; handOut resets transform
slideCardFromDeck(wrapper)      // JS-driven card + hand slide from deck to slot
runShuffle(onDone)              // overhand animation (hands) / instant (shoe/Moe)

// Drop
showDropPile()                  // renders scattered card pile
hideDropPile(cb)                // cards float back, then calls cb
runDropSequence(count, onDone)  // full drop sequence with escalating Gary dialogue

// Dialogue
showDialogue(char, speech, choices)
showDialogueAlt(char, speech, choices)
hideDialogue()
```

---

## File Structure

```
blackjack-quest/
  index.html    — All CSS, HTML, and JS in one file (~450KB with embedded art)
  spec.md       — This document
```

- **Deployed:** `https://aiml-1870-2026.github.io/mynamejohn/blackjack-quest/`
- **Repo:** `https://github.com/AIML-1870-2026/mynamejohn.git` (branch: `main`)
- **Local:** `/Users/johnkryzsko/Documents/mynamejohn/blackjack-quest/`

---

## What's Next

- **Scripted hands 2+** — need sequence mapped out
- **Gary win/bust/blackjack reactions** — hooks exist in `settleResult`, no lines written
- **Drop beats 4 & 5** — Sharon lore after drop #3
- **Game-over Gary monologue** — closing beat when balance hits $0
- **Pit Boss extended** — more than one line per phase (3–5)
- **Moe lines** — terse one-liners while dealing fast
- **UI/HUD redesign** — pending mockup from user
- **Hand art** — `Untitled_Artwork 3.jpg`, green chroma key, 454×420px, embedded. Clean.
- **Gary portrait** — `Untitled_Artwork 4.jpg`, left half, green chroma key, embedded.
- **Pit Boss portrait** — `Untitled_Artwork 3.jpg`, right half, green chroma key, embedded.
- **Gary alt portrait** — same as normal for now (no distressed variant yet)
- **Moe portrait** — SVG placeholder still in use; needs real art on green screen
