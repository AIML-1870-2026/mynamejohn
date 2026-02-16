# Pizza Decision Neuron Spec

## Domain
**Decision**: "Should I order this pizza?"
- **Yes**: Order it! This pizza is worth it.
- **No**: Skip it. Not worth the calories/money.

## Inputs (5 factors)

| Input | Description | Range | Weight Sign |
|-------|-------------|-------|-------------|
| Cheese Level | How cheesy is this pizza? | 0-1 | Positive (+) |
| Sauce Quality | How good is the sauce? | 0-1 | Positive (+) |
| Topping Variety | Number/quality of toppings | 0-1 | Positive (+) |
| Price | Cost relative to budget | 0-1 | Negative (-) |
| Hunger Level | How hungry are you right now? | 0-1 | Positive (+) |

## Bias
- **Name**: "Pizza Craving Tendency"
- **Interpretation**: Your baseline desire for pizza regardless of factors
- **Range**: -3 to +3
- High positive = "I'm always down for pizza"
- Negative = "I'm trying to eat healthy"

## Core Features

### 1. Interactive Decision Panel
- Sliders for each input (0-1 scale)
- Real-time probability output (0-100%)
- Sigmoid activation visualization
- Animated neuron that pulses based on decision strength
- Math display showing: z = w₁x₁ + w₂x₂ + ... + b
- Pizza emoji celebration when probability > 70%

### 2. Decision Boundary Visualization
- 2D heatmap/scatter plot
- X-axis: Cheese Level (most important positive)
- Y-axis: Price (most important negative)
- Color gradient: Red (no) → White (uncertain) → Green (yes)
- Gold decision boundary line at 50%
- Crosshair showing current slider position
- Dropdown to swap which inputs are on X/Y axes

### 3. Training Mode (Step-by-Step Learning)
- Click on 2D plot to add example points
- Toggle buttons: "Worth It 🍕" vs "Skip It ❌"
- **Step button**: Single gradient descent step with animation
  - Show the point being evaluated
  - Animate the boundary line moving
  - Update weights numerically
- **Train button**: Run multiple steps automatically
- **Reset button**: Clear points and reset weights
- Display: Current weights, bias, step counter, accuracy %
- Learning rate slider

### 4. Weight Visualization
- Bar chart showing current weight values
- Positive weights in green, negative in red
- Animate bars during training

## UI/UX Requirements

### Layout
- Left panel: Sliders and decision output
- Center: Large decision boundary visualization
- Right panel: Training controls and stats
- Mobile: Stack vertically

### Visual Style
- Dark theme with pizza-themed accents (orange, red, golden)
- Smooth animations (300ms transitions)
- Glowing effects on decision boundary
- Pizza slice icons for positive examples
- X marks for negative examples

### Animations
- Neuron pulses when making decision
- Boundary line smoothly rotates/shifts during training
- Confetti/cheese particles on high confidence "yes"
- Weight bars animate during updates

## Stretch Features

### Feature 1: Pizza Scenario Presets
- "Late Night Craving" (high hunger bias)
- "Diet Mode" (negative bias, price sensitivity high)
- "Treat Yourself" (all positive weights boosted)
- "Budget Conscious" (price weight very negative)

### Feature 2: Activation Function Comparison
- Sigmoid (smooth probability)
- Step Function (binary yes/no)
- ReLU (for comparison)
- Side-by-side curve visualization

### Feature 3: Sensitivity Analysis
- Line chart showing how each input affects output
- Sweep each input 0→1 while others fixed
- Identify which factor matters most for YOUR decision

## Technical Notes
- Pure HTML/CSS/JS, single file
- Canvas for decision boundary heatmap
- requestAnimationFrame for smooth animations
- No external dependencies
