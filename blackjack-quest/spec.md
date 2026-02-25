# Blackjack Quest — Spec

## Visual Style
- **Theme**: Midnight casino — deep green felt table, dark backgrounds, gold accents
- **Cards**: White face-up cards with rank/suit in corners; dark card back pattern for dealer's hidden card
- **Chips**: Gold coin buttons for placing bets ($10, $25, $50, $100)
- **Typography**: Clean sans-serif for HUD numbers; stylized serif for title
- **Color palette**: `#1a3a2a` (felt), `#0d1f17` (bg), `#c9a84c` (gold), `#e8f5e9` (card white)

## Game States
1. **BETTING** — Player selects bet amount using chip buttons. Deal button appears once bet > 0.
2. **PLAYER_TURN** — Cards dealt face-up (player) and 1 up/1 down (dealer). Hit, Stand, Double available.
3. **DEALER_TURN** — Player stood or doubled. Dealer flips hole card and draws until 17+. Buttons hidden.
4. **RESULT** — Winner determined, payout applied, message shown. New Hand button appears.
5. **BUST** — Immediate result state when player exceeds 21.
6. **GAME_OVER** — Balance reaches $0, restart prompt shown.

## Rules & Payouts
- Standard 6-deck shoe, shuffled each round
- Dealer stands on soft 17
- Blackjack (Ace + 10-value on initial deal) pays **1.5× bet**
- Push (tie) returns the bet
- Bust = immediate loss
- Double Down: double the bet, receive exactly one more card, then stand

## Edge Cases Covered
- Ace counts as 11 unless it would bust, then counts as 1
- Both player and dealer blackjack = push
- Dealer blackjack checked immediately after deal
- Minimum bet: $10; Maximum bet: current balance
- All combinations summing to 21 correctly detected as blackjack or 21

## Stretch Features Implemented
- Card flip animation
- Bet chip buttons
- Double Down mechanic
- Hand value displayed live
- Win/loss/push streak counter
