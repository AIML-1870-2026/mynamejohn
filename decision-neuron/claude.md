# Pizza Decision Neuron 🍕

An interactive single-neuron visualization for the decision: "Should I order this pizza?"

## Domain

**Decision**: Order this pizza or skip it?

### Inputs (5 factors)
| Input | Weight | Description |
|-------|--------|-------------|
| 🧀 Cheese Level | +2.5 | How cheesy is the pizza? |
| 🍅 Sauce Quality | +1.8 | Quality of the tomato sauce |
| 🍄 Topping Variety | +1.5 | Number/quality of toppings |
| 💰 Price | -3.0 | Cost relative to budget (negative weight!) |
| 😋 Hunger Level | +2.0 | How hungry are you? |

### Bias
- **Pizza Craving Tendency**: Your baseline desire for pizza (-3 to +3)
- Positive = "Always down for pizza"
- Negative = "Trying to eat healthy"

## Features

### 1. Interactive Decision Panel
- Real-time sliders for all 5 inputs + bias
- Animated neuron that changes color based on decision
- Probability display (0-100%)
- Live math display showing z calculation and activation

### 2. Decision Boundary Visualization
- 2D heatmap showing decision regions
- Red (skip) → White (uncertain) → Green (order)
- Gold decision boundary line at 50% threshold
- Crosshair tracks current slider position
- Dropdown to change X/Y axes
- Click to add training points (in training mode)

### 3. Training Mode
- Toggle between Explore and Train modes
- Click on boundary plot to add labeled examples
- "Worth It 🍕" vs "Skip It ❌" labels
- **Step**: Single gradient descent iteration
- **Train ×10**: Multiple training steps
- **Reset**: Clear points and reset weights
- Live stats: Steps, Accuracy, Points, Loss
- Animated weight bar visualization

### 4. Scenario Presets
- 🌙 Late Night (high hunger, positive bias)
- 🥗 Diet Mode (low values, negative bias)
- 🎉 Treat Yourself (high everything, positive bias)
- 💸 On a Budget (high price sensitivity)

### 5. Sensitivity Analysis
- Line chart showing each input's effect on probability
- Sweep each input 0→1 while others held constant
- Visual indicator of current position on each curve

### 6. Activation Function Comparison
- Sigmoid (smooth probability curve)
- Step Function (binary 0/1)
- ReLU (rectified linear)
- Live visualization with current z marker

## Technical Details

### Neuron Computation
```
z = w_cheese × cheese + w_sauce × sauce + w_toppings × toppings
    + w_price × price + w_hunger × hunger + bias

probability = σ(z) = 1 / (1 + e^(-z))
```

### Training Algorithm
- Gradient descent with configurable learning rate
- Binary cross-entropy loss
- Updates weights proportional to error × gradient

### Visual Effects
- Pulse animation on confident "yes" decisions
- Cheese/pizza particle celebration at >85% confidence
- Smooth color transitions on decision boundary
- Animated weight bars during training

## File Structure
```
decision-neuron/
├── index.html    # Single-file application
├── spec.md       # Feature specification
└── claude.md     # This documentation
```

## Educational Value

This visualization demonstrates:
1. **Weighted decisions**: How factors combine with different importance
2. **The sigmoid squeeze**: Converting any score to a probability
3. **Decision boundaries**: Every neuron draws a line through feature space
4. **Gradient descent**: How the neuron learns from examples
5. **The role of bias**: Shifting the baseline decision threshold
