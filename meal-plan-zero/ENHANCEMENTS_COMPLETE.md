# Meal Plan Zero - Gameplay Enhancements Summary

## Enhancements Completed

### 1. ✅ Investigation State (New Worker AI)
**Files Modified**: `js/workers.js`

When workers reach high suspicion (suspicionTimer >= 80), they now transition to a new "investigate" state:
- Workers move toward the last-known player position at 80% normal speed
- Upon arrival, they search the area for 2 seconds (120 frames)
- Visual indicator: "?!" above worker head
- Provides players a strategic choice: hide and wait vs move while being investigated

**Impact**: Adds tension and strategic depth - player must decide whether to stay hidden or risk movement while being searched.

---

### 2. ✅ Risk/Reward Food Placement
**Files Modified**: `js/map.js`

Food values completely rebalanced based on location danger:

| Item | Location | Old Points | New Points | Risk Level |
|------|----------|-----------|-----------|-----------|
| Pizza (Kitchen) | Near Chef Kim | 50 | 200 | HIGH |
| Pasta (Kitchen) | Near Chef Kim | 45 | 180 | HIGH |
| Pizza (Upper) | Medium zone | 50 | 150 | MEDIUM |
| Pasta (Upper) | Medium zone | 45 | 140 | MEDIUM |
| Sandwich | Transition zone | 30 | 100 | MEDIUM |
| Soup | Transition zone | 35 | 120 | MEDIUM |
| Muffin | Corner | 25 | 60 | SAFE |
| Apple | Edge | 10 | 50 | SAFE |
| Cookies | Edge | 15 | 45 | SAFE |
| Chips | Center | 8 | 40 | SAFE |
| Coffee | Remote | 20 | 30 | LOW-VALUE |

**Impact**: Forces meaningful decisions - high-value items are now genuinely risky. Players can "cheese" safe zones or take calculated risks for better scores.

---

### 3. ✅ Enhanced Noise Detection
**Files Modified**: `js/workers.js`

Noise detection system now more sophisticated and dangerous:

- **Very Loud Sounds** (running >110px radius): 
  - If worker is within 50% of noise radius AND in patrol state → **immediate alert state**
  - Suspicion gains +3 per frame instead of +1.5
  - Makes running extremely risky when workers are nearby

- **Normal Sounds** (crouching): 
  - Still detected by workers
  - Suspicion gains +1.5 per frame
  - Gives players a stealth option

**Impact**: Running becomes genuinely dangerous - players now must carefully choose when to sprint vs crouch. Encourages stealth-based gameplay.

---

### 4. ✅ Worker Coordination Bonus
**Files Modified**: `js/workers.js`

When multiple workers are simultaneously in high-alert states, they "coordinate":
- **2+ workers alert/investigating/chasing**: +0.8 detection per additional worker per frame
- Means: 2 workers = +0.8/frame, 3 workers = +1.6/frame, 5 workers = +3.2/frame

**Mechanic**: When one worker spots you and raises alarm, other workers become more effective. This simulates them working together to track and contain the threat.

**Impact**: Makes evasion much harder once you're spotted - encourages avoiding detection in the first place, or finding hiding spots to break line of sight.

---

## Gameplay Flow Changes

### Before Enhancements:
1. Run through dining hall
2. Grab food mostly freely (low risk if careful)
3. Get caught or reach exit

### After Enhancements:
1. **Choose approach**: Grab safe food quickly vs risky food slowly?
2. **Movement**: Sprint (loud, risky) or crouch (slow, safe)?
3. **When caught**: 
   - Workers now investigate last-known position (gives hiding opportunity)
   - Multiple workers coordinate (makes escaping harder)
   - Loud noise draws immediate attention (running is punished)
4. **Exit**: Need enough food to win - encourages taking some risks

---

## Balance Changes

### Difficulty Increase
- **Detection sensitivity**: Increased from running
- **Worker effectiveness**: Coordinated workers are much deadlier
- **Punishment for noise**: Bad planning = immediate detection

### Player Options
- **Safe play**: Crouch, hide, grab low-value food, slow escape (guaranteed win, low score)
- **Aggressive play**: Sprint, grab high-value kitchen items, fight through alert workers (high score, risky)
- **Balanced play**: Mix crouching and running, use investigation time to reposition (medium score, medium risk)

---

## Testing Recommendations

### Test 1: Investigation State Works
- [ ] Get worker to high suspicion (build up detection to ~60)
- [ ] Watch worker move to last-known position
- [ ] Verify worker stops and waits for ~2 seconds
- [ ] Confirm worker returns to suspicious/alert after search

### Test 2: Risk/Reward Food
- [ ] Kitchen items (Pizza, Pasta) should be near Chef Kim patrol
- [ ] Corner items should be accessible without detection
- [ ] High-value items should be dangerous to grab
- [ ] Safe items should be worth less

### Test 3: Noise Detection
- [ ] Running near a worker → immediate suspicion spike
- [ ] Crouching near a worker → no detection
- [ ] Very loud running close to worker → worker goes alert
- [ ] Quiet movement lets you slip past

### Test 4: Worker Coordination
- [ ] One worker chasing → normal difficulty
- [ ] Two workers alert → difficulty spikes
- [ ] Verify detection rises faster with more workers
- [ ] Confirm hiding breaks the coordination boost

### Test 5: Full Round Play
- [ ] Play round 1 with all enhancements
- [ ] Attempt aggressive (high-value items) approach
- [ ] Attempt conservative (safe items) approach
- [ ] Attempt balanced (mixed items) approach
- [ ] Verify win/loss feels balanced

---

## Future Enhancement Ideas

If you want to push this further:

1. **Exit Variations**: Add hidden emergency exit requiring investigation
2. **Worker Types**: Add "patrol bot" that moves randomly
3. **Dynamic Events**: Every 30 seconds, cafeteria gets busier (more workers spawn)
4. **Combo Multiplier**: Grab items quickly in sequence for bonus points
5. **Sound Signature**: Different foods make different noise levels
6. **Distraction AI**: Make distraction throws smarter (workers converge on throws)

---

## Files Modified

| File | Changes | Lines Affected |
|------|---------|-----------------|
| `js/workers.js` | Investigation state, noise enhancement, coordination bonus | ~50 total |
| `js/map.js` | Food value rebalancing | ~13 items updated |
| `js/state.js` | (No changes needed) | - |
| `js/player.js` | (No changes needed) | - |
| `js/engine.js` | (No changes needed) | - |
| `js/ui.js` | (No changes needed) | - |

---

## Summary

The game now has **significantly deeper gameplay** with multiple strategic layers:

1. **Spatial Strategy**: High-value items require dangerous territory access
2. **Temporal Strategy**: Time management between detection building and hiding
3. **Tactical Strategy**: Choose when to run vs crouch based on worker positions
4. **Evasion Strategy**: Use investigation cooldowns to reposition and escape

This transforms Meal Plan Zero from a simple "grab and go" game into a genuine stealth puzzle where players must make meaningful decisions about risk vs reward.

**Estimated Play Time**: 5-10 minutes per round
**Difficulty Curve**: Rounds 2+ are significantly harder due to worker scaling
**Replayability**: High - different strategies yield different experiences
