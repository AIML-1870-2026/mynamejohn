# Meal Plan Zero - Gameplay Enhancement Roadmap

## Current State Analysis

The game already has strong core mechanics:
✅ Noise-based detection system (running vs crouching)
✅ Worker alert propagation (workers coordinate when one spots you)
✅ Multiple worker states (patrol → suspicious → alert → chase)
✅ Suspicion timer mechanics
✅ Distraction mechanic (Q key to throw)
✅ Hiding spots (lockers/closets)
✅ Lives system (3 hearts)
✅ Multiple rounds with difficulty scaling

## Proposed High-Impact Enhancements

### Priority 1: Investigation/Search State (Medium Effort, High Impact)
**What**: Add a new worker state "investigate" that activates when suspicion is high  
**Why**: Adds strategic depth - player must decide: move while being investigated, or hide and wait  
**Implementation**:
- In `workers.js`, add `searchTarget` and `searchTimer` fields to worker objects
- When `suspicionTimer >= 60` and detection < 40, transition to "investigate" state
- Workers move toward `lastKnownX/Y` at 70% speed and scan the area
- After 120 frames with no new contact, return to suspicious/patrol
- Visual indicator: "?!" above worker head

**Code Location**: `js/workers.js` lines ~260-280 (state transitions section)

### Priority 2: Risk/Reward Food Placement (Low Effort, Medium Impact)
**What**: Rebalance food values - high-value items near guards, safe items in corners  
**Why**: Forces decision-making: grab high points (risky) vs safe points (conservative)  
**Current Balance**: All items worth similar points regardless of location  
**Proposed**:
- Pizza/Pasta near Kitchen workers (200 points vs 50)
- Coffee near Security checkpoint (100 points vs 20)
- Muffins/Apples in hidden side routes (30 points, safe)
- Soup/Bread in middle areas (40 points, medium risk)

**Code Location**: `js/map.js` food definitions (~line 180-220)

### Priority 3: Alternate Exits (Medium Effort, Medium Impact)
**What**: Add risky fast exit vs safe slow exit  
**Why**: Players can choose whether to fight or flee  
**Proposed**:
- Main exit (front door): Always has 1 security guard, but fastest route (y=1350)
- Side exit (kitchen): Slower, unguarded but through food prep area (y=150)
- Emergency exit (back): Very slow, requires navigating around all workers (y=600, right side)

**Code Location**: `js/player.js` (win condition), `js/map.js` (exit visualization)

### Priority 4: Worker Coordination Radio (Low Effort, High Impact)
**What**: When one worker spots you, others get a "radio alert" boost  
**Why**: Makes workers feel coordinated, increases tension  
**Implementation**:
- When worker enters "alert" state, reduce other workers' suspicion drain by 50% for 5 seconds
- Visual: small "📡" icon above workers receiving radio alert
- Prevents easy escape after being spotted once

**Code Location**: `js/workers.js` lines ~215-230 (detection gain section)

### Priority 5: Dynamic Difficulty Twist (Low Effort, High Replay Value)
**What**: Add special conditions for each round  
**Round 1**: Normal gameplay  
**Round 2**: One extra worker joins halfway through  
**Round 3**: Workers get permanent 20% speed boost, better vision  
**Round 4+**: New worker type - "patrol bot" that moves randomly but can't be evaded by hiding

**Code Location**: `js/workers.js` reset() function, `js/state.js` round progression

## Quick Wins (Could Do Today)

1. **Increase detection gain when running** (1 line change)
   - Currently: 1.6 when moving and visible
   - Change to: 2.5 (makes stealth more important)
   - File: `js/workers.js` ~line 225

2. **Add "noise proximity" bonus** (2 lines)
   - Workers closer to loud sounds detect faster
   - File: `js/workers.js` ~line 200

3. **Make distractions last longer** (1 line)
   - Increase timer duration from ~60 to ~150 frames
   - File: `js/state.js` distraction creation

4. **Improve visual feedback for search zones** (add circle drawing)
   - When investigat, draw search radius  
   - File: `js/workers.js` draw() function

## Implementation Priority

1. **Start with: Investigation/Search State** - adds most strategic depth
2. **Then: Risk/Reward Food** - changes risk/reward calculus
3. **Then: Worker Coordination Radio** - increases tension
4. **Optional: Alternate Exits** - adds replayability
5. **Polish: Dynamic Difficulty** - adds long-term engagement

## Testing Checklist

- [ ] New investigation state doesn't break patrol resumption
- [ ] Workers can be evaded while investigating (by crouching/hiding)
- [ ] High-value food is actually harder to grab (near guards)
- [ ] Alternate exits are visually distinct
- [ ] Radio coordination feels balanced (not overpowered)
- [ ] Game still wins when reaching any exit with food

## Estimated Time Investment

- **Investigation State**: 30 mins coding + 15 mins testing
- **Food Rebalance**: 10 mins 
- **Alternate Exits**: 45 mins + 20 mins testing
- **Radio Coordination**: 15 mins
- **Total**: ~2.5 hours for all major features

---

**Current Focus**: The game is already engaging! These enhancements would push it from "good" to "excellent" by adding strategic layers.
