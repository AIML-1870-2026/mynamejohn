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
Dialogue portrait slot is 100×120px.

### Gary (Dealer) — "Pubert"
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
- Small, scrungly. Climbs onto the table. Deals superhuman fast.
- **Dialogue portrait**: SVG illustration only (no Pubert in frame). White blob body, big round eyes, pencil mustache, sparse upright hair, belt/cummerbund.
- **On-table**: Right half of `MOE_RAW_B64` green-screen photo, chroma-keyed. Rendered at `height: 85vh`, `position: absolute`, `bottom: 0`, anchored to bottom of game area. `pointer-events: none`.
- **Roaming**: After entrance, snaps to a random horizontal position (5 slots: 18%, 33%, 50%, 67%, 82%) every 6–30 seconds. Never repeats same slot consecutively.

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

**Shoe mode:** Medium pace. Gary says a divorce-adjacent one-liner. Resolves via player dismiss.

**Moe mode:** 120ms. No dialogue. No animation.

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
not the other way around. `storyPhase` (0–9) tracks position in the arc.

### Phase Table

| Phase | Event | Deal stagger | Notes |
|---|---|---|---|
| 0 | Hands — intro | 3750ms | Scripted hand 1 (player wins). Shoe offer fires in next shuffle. |
| 1 | Hands — shoe offer | 3750ms | Shoe hint appears as choice during shuffle. |
| 2 | Shoe — one deal | 380ms | Gary briefly professional. One scripted round. |
| 3 | Shoe explosion | — | No hand dealt. Shoe smokes, explodes during shuffle. Pit Boss: *"Pubert. A woid."* Cards scatter. Advances to phase 4. |
| 4 | Hands — pit boss mild | 3750ms | Pit Boss: *"..."* appears mid-shuffle. |
| 5 | Hands — overshare 1 | 3750ms | Gary: *"Been working here about two weeks now."* (divorce/lawyer bills) |
| 6 | Hands — divorce Q | 3750ms | Gary builds toward asking if player's been divorced. Pit Boss: *"Pubert. A woid."* cuts him off. |
| 7 | Hands — last Gary hand | 3750ms | Scripted hand 3. Player wins. Gary's final hand. |
| 8 | Second drop → Moe | — | `runScriptedDrop2()`. Cards scatter wide. Pit Boss snaps. |
| 9+ | Moe — fast forever | 55ms | Moe on table. Instant deal. Roaming. |

### Scripted Hands

**Hand 1** — `setupScriptedHand1()`:

| Draw | Card | Goes to |
|---|---|---|
| 1st | 8♠ | Dealer face-up |
| 2nd | Q♥ | Player card 1 |
| 3rd | 9♦ | Dealer hole |
| 4th | Q♠ | Player card 2 → **20** |
| 5th | A♣ | Player hit → **21** |

Dealer total: 17 (stands). Player wins at 20 (stand) or 21 (hit).

**Hand 2** — `setupScriptedHand2()` (shoe round, phase 2):

| Draw | Card | Goes to |
|---|---|---|
| 1st | 9♣ | Dealer hole |
| 2nd | 6♦ | Dealer face-up |
| 3rd | K♥ | Player card 1 |
| 4th | A♠ | Player card 2 → soft 21 (blackjack) |

**Hand 3** — `setupScriptedHand3()` (phase 7, Gary's last):

Player: A♦ + 8♣ = soft 19. Dealer: K♠ (up) + 5♥ (hole) = 15, draws 8♦ → busts at 23. Player wins.

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

### Shoe Offer (Phase 1, during hand-2 shuffle)

```
Gary:    [fumble line + overhand shuffle running]
Player:  [Have you considered a shoe?]
         → cancel shuffle → runShoeOffer()

Gary:  "A shoe? Why, that's a GREAT idea!..."
Gary:  (Pubert has gone to retrieve a shoe.)
Player: [(Wait politely)]
Gary:  "Found it! Okay! This is a shoe. Professional casino equipment."
Player: [Let's see it.] → storyPhase = 2, setupScriptedHand2()
```

### Shoe Explosion (Phase 2 → 3 → 4)

After shoe round result, `storyPhase` silently advances to 3. On the next shuffle:

```
[Shuffle animation starts]
(The shoe is smoking.)
Player:  [Is it meant to do that?]
Gary:    "NO!"
[800ms pause — shoe explodes, cards scatter: showDropPileWide()]
Gary:    "Heh heh... user error..."
Player:  [(The cards are everywhere.)]
[1000ms pause]
Pit Boss: "Pubert. A woid."
Player:  [(…)]
[handOut() — 700ms pause — hideDropPile()]
→ storyPhase = 4, setButtons('BETTING')
```

### Pit Boss Escalation (Phases 4–6, mid-shuffle)

| Phase | Shuffle line | Player response |
|---|---|---|
| 4 | Pit Boss: *"..."* | (Pubert shuffles.) |
| 5 | Gary: *"Been working here about two weeks now... since everything with the wife..."* | *(…Please just deal.)* |
| 6 | Gary builds to: *"You know, I was just wondering if you've ever been divor—"* → Pit Boss: *"Pubert. A woid."* | (Pubert shuffles.) |

### Moe Entrance (Phase 8 → 9)

```
[runScriptedDrop2 — cards scatter wide]
Pit Boss: "THAT'S IT. MOE!!!"
Player:   [(A distant clattering)]
→ 900ms delay → Moe PNG appears on table (85vh, bottom: 0), hands retract
Moe:      "[Moe has climbed onto the table. He is already dealing.]"
Player:   [Okay.] → hideDialogue, setButtons('BETTING'), startMoeRoam()
```

Moe then snaps to random horizontal positions every 6–30s indefinitely.

---

## Dialogue Trigger Map

| Trigger | Function | Behaviour |
|---|---|---|
| First deal ever | `deal()` → `runIntroDialogue` | Gary asks if player knows the game |
| Post-intro | `runGaryEnthusiasm` | DEAL flash, ticker, Gary's enthusiasm |
| Shuffle (hands, phase 1) | `runShuffle(onDone)` | Shoe offer as dialogue choice |
| Shuffle (hands, phase 3) | `runShuffle(onDone)` | Shoe explosion sequence |
| Shuffle (hands, phase 4) | `runShuffle(onDone)` | Pit Boss: "..." mid-shuffle |
| Shuffle (hands, phase 5) | `runShuffle(onDone)` | Gary overshares (wife/lawyer bills) |
| Shuffle (hands, phase 6) | `runShuffle(onDone)` | Gary → divorce Q → Pit Boss cuts him off |
| Shuffle (Moe, phase 9+) | `runShuffle(onDone)` | Instant, 120ms, no dialogue |
| Card drop (35%, hands mode) | `runDropSequence(count, onDone)` | Gary overshares (Sharon, lawyer bills) |
| After result | `checkPostResultNarrative()` | Advances storyPhase |
| Phase 8 pre-deal | `runScriptedDrop2()` | Second wide scatter → Moe entrance |
| Balance hits $0 | `showGameOver()` | Static overlay |

---

## Key Functions Reference

```javascript
// Narrative
runIntroDialogue(proceed)       // fires on first deal only (stats.hands === 0)
runRulesExplanation(proceed)    // 3-beat clean explanation
runGaryEnthusiasm(proceed)      // DEAL flash + ticker swap + Gary line
setupScriptedHand1/2/3()        // push scripted cards to shoe
checkPostResultNarrative()      // advances storyPhase after each result
runShoeOffer()                  // Gary retrieves shoe → storyPhase = 2
runMoeEntrance()                // Pit Boss snaps, Moe appears → storyPhase = 9
startMoeRoam()                  // begins random snap-to-position loop (6–30s intervals)
stopMoeRoam()                   // clears roam timer (called on restartGame)

// Dealing
dealStagger()                   // 3750ms (hands) / 380ms (shoe) / 55ms (Moe)
handIn() / handOut()            // slide hands in/out; handOut resets transform
slideCardFromDeck(wrapper)      // JS RAF loop: card + left hand slide from deck to slot
runShuffle(onDone)              // overhand animation (hands) / shoe dialogue / instant (Moe)

// Drop
showDropPile()                  // 5 scattered face-down cards, staggered fall
showDropPileWide()              // wider scatter (shoe explosion, second drop)
hideDropPile(cb)                // cards float back, then calls cb
runDropSequence(count, onDone)  // full drop sequence with escalating Gary dialogue
runScriptedDrop2()              // phase 8 wide drop → Moe entrance

// Dialogue
showDialogue(char, speech, choices)
showDialogueAlt(char, speech, choices)
hideDialogue()
```

---

## Dev Panel

A floating dev panel (`⚙ DEV`, top-right corner) is injected at runtime via JS.
Fully bypasses the layout system — appended directly to `document.body`, `z-index: 2147483647`.

**Features:**
- Live state display: `storyPhase`, `gameState`, balance, `phase1Dropped`, `scriptedHand3Done`
- Phase jump buttons (0–9): clear dialogue, cancel pending timeouts, set phase, restore Moe/BETTING
- Force → BETTING button: unstick the UI at any point

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

- **Gary win/bust/blackjack reactions** — hooks exist in `settleResult`, no lines written yet
- **Drop beats 4 & 5** — Sharon lore after drop #3
- **Game-over Gary monologue** — closing beat when balance hits $0
- **Pit Boss extended** — more lines per phase (4–6); currently one line each
- **Moe lines** — terse one-liners while dealing fast (hooks not yet added)
- **Moe portrait art** — SVG placeholder still in use for dialogue box; needs green-screen photo cropped to Moe only
- **Hand art** — `Untitled_Artwork 3.jpg`, green chroma key, 454×420px, embedded
- **Gary portrait** — `Untitled_Artwork 4.jpg`, left half, green chroma key, embedded
- **Pit Boss portrait** — `Untitled_Artwork 3.jpg`, right half, green chroma key, embedded
