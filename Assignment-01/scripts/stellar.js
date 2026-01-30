// Stellar Web - Particle Network Simulation
const canvas = document.getElementById('stellar-canvas');
const ctx = canvas.getContext('2d');

// Configuration
let config = {
    connectivityRadius: 150,
    edgeLength: 100,
    volatility: 0.2,
    speed: 1.0,
    particleCount: 350,
    positiveRatio: 0.5,
    antiparticleRatio: 0,
    gravityWellStrength: 5.0,
    polarityEnabled: false,
    dischargeThreshold: 5.0,    // Charge buildup needed for discharge
    chargeDecay: 0.02           // How fast charge dissipates
};

// Periwinkle color palette
const colors = {
    positive: '#ccccff',      // Light periwinkle
    negative: '#8888cc',      // Darker periwinkle
    antiparticle: '#ff88ff',  // Magenta for antiparticles
    edge: 'rgba(204, 204, 255, 0.3)',
    attractEdge: 'rgba(180, 180, 255, 0.4)',
    repelEdge: 'rgba(255, 180, 180, 0.3)',
    annihilateEdge: 'rgba(255, 100, 255, 0.6)'
};

let particles = [];

// Charge regions and lightning system
let chargeRegions = [];
let lightningBolts = [];
const GRID_SIZE = 80; // Size of each charge region cell

// Gravity Well (Jonathan Banks / Finger) - Constellation Mode
// Hand-crafted constellation points based on the portrait
// Coordinates are normalized 0-1 based on the image

let constellationPoints = [];
let constellationScaled = [];
let gravityWellLoaded = false;

// Define Mike Ehrmantraut's face as a constellation
// Based on the portrait: face is roughly centered, dark background
function defineFingerConstellation() {
    // These points trace his facial features in detail
    // Format: [x, y] where 0,0 is top-left, 1,1 is bottom-right

    const facePoints = [
        // === HEAD OUTLINE (left side - more points for smooth curve) ===
        [0.28, 0.12],
        [0.24, 0.16],
        [0.21, 0.20],
        [0.19, 0.25],
        [0.17, 0.30],
        [0.16, 0.35],
        [0.16, 0.40],
        [0.16, 0.45],
        [0.17, 0.50],
        [0.18, 0.55],
        [0.20, 0.60],
        [0.22, 0.65],
        [0.24, 0.70],
        [0.27, 0.75],

        // === JAW LINE (detailed) ===
        [0.30, 0.79],
        [0.34, 0.82],
        [0.38, 0.85],
        [0.43, 0.87],
        [0.48, 0.88],
        [0.53, 0.88],
        [0.58, 0.86],
        [0.63, 0.84],
        [0.67, 0.81],
        [0.71, 0.77],

        // === HEAD OUTLINE (right side) ===
        [0.74, 0.72],
        [0.76, 0.67],
        [0.78, 0.62],
        [0.79, 0.57],
        [0.80, 0.52],
        [0.80, 0.47],
        [0.80, 0.42],
        [0.79, 0.37],
        [0.78, 0.32],
        [0.76, 0.27],
        [0.73, 0.22],
        [0.70, 0.17],
        [0.66, 0.13],

        // === TOP OF HEAD (bald dome - smooth curve) ===
        [0.62, 0.10],
        [0.58, 0.07],
        [0.54, 0.05],
        [0.50, 0.04],
        [0.46, 0.05],
        [0.42, 0.07],
        [0.38, 0.09],
        [0.33, 0.11],

        // === LEFT EYE (detailed) ===
        [0.28, 0.38],
        [0.30, 0.36],
        [0.33, 0.35],
        [0.36, 0.35],
        [0.39, 0.36],
        [0.41, 0.38],
        [0.39, 0.40],
        [0.36, 0.41],
        [0.33, 0.41],
        [0.30, 0.40],
        // Left pupil
        [0.34, 0.38],

        // === RIGHT EYE (detailed) ===
        [0.54, 0.36],
        [0.57, 0.34],
        [0.60, 0.33],
        [0.63, 0.34],
        [0.66, 0.35],
        [0.68, 0.37],
        [0.66, 0.39],
        [0.63, 0.40],
        [0.60, 0.40],
        [0.57, 0.39],
        // Right pupil
        [0.61, 0.37],

        // === LEFT EYEBROW (thick, expressive) ===
        [0.26, 0.32],
        [0.29, 0.30],
        [0.32, 0.29],
        [0.35, 0.28],
        [0.38, 0.29],
        [0.41, 0.30],
        [0.43, 0.32],

        // === RIGHT EYEBROW ===
        [0.52, 0.30],
        [0.55, 0.28],
        [0.58, 0.27],
        [0.61, 0.27],
        [0.64, 0.28],
        [0.67, 0.29],
        [0.70, 0.31],

        // === FOREHEAD WRINKLES ===
        [0.35, 0.22],
        [0.42, 0.21],
        [0.50, 0.20],
        [0.58, 0.21],
        [0.65, 0.23],
        [0.38, 0.25],
        [0.50, 0.24],
        [0.62, 0.25],

        // === NOSE (detailed) ===
        [0.48, 0.40],
        [0.47, 0.44],
        [0.46, 0.48],
        [0.46, 0.52],
        [0.45, 0.56],
        [0.44, 0.59],
        // Nose tip/nostrils
        [0.42, 0.61],
        [0.46, 0.63],
        [0.50, 0.64],
        [0.54, 0.63],
        [0.56, 0.60],
        // Nose bridge (right side)
        [0.52, 0.56],
        [0.53, 0.52],
        [0.52, 0.48],

        // === NASOLABIAL FOLDS (smile lines) ===
        [0.40, 0.58],
        [0.38, 0.62],
        [0.36, 0.66],
        [0.58, 0.58],
        [0.60, 0.62],
        [0.62, 0.66],

        // === MOUTH (detailed) ===
        [0.38, 0.70],
        [0.42, 0.71],
        [0.46, 0.72],
        [0.50, 0.72],
        [0.54, 0.72],
        [0.58, 0.71],
        [0.62, 0.69],
        // Lower lip
        [0.42, 0.74],
        [0.46, 0.75],
        [0.50, 0.76],
        [0.54, 0.75],
        [0.58, 0.74],
        // Mouth corners
        [0.36, 0.69],
        [0.64, 0.68],

        // === CHIN ===
        [0.45, 0.80],
        [0.50, 0.82],
        [0.55, 0.80],
        [0.48, 0.78],
        [0.52, 0.78],

        // === LEFT EAR ===
        [0.14, 0.36],
        [0.12, 0.40],
        [0.11, 0.44],
        [0.12, 0.48],
        [0.14, 0.52],
        [0.16, 0.54],

        // === RIGHT EAR (partial, visible) ===
        [0.82, 0.40],
        [0.83, 0.44],
        [0.82, 0.48],

        // === NECK/COLLAR ===
        [0.30, 0.85],
        [0.35, 0.90],
        [0.40, 0.93],
        [0.50, 0.95],
        [0.60, 0.93],
        [0.65, 0.90],
        [0.70, 0.85],

        // === CHEEKBONES ===
        [0.24, 0.50],
        [0.26, 0.55],
        [0.74, 0.50],
        [0.72, 0.55],

        // === UNDER-EYE CREASES (weathered look) ===
        [0.30, 0.43],
        [0.34, 0.44],
        [0.38, 0.44],
        [0.58, 0.43],
        [0.62, 0.43],
        [0.66, 0.42],
    ];

    constellationPoints = facePoints.map(([x, y]) => ({
        x: x,
        y: y,
        brightness: 1
    }));

    console.log(`Created Finger constellation with ${constellationPoints.length} points`);
    gravityWellLoaded = true;
    updateScaledConstellation();
}

// Initialize constellation on load
setTimeout(defineFingerConstellation, 100);

function updateScaledConstellation() {
    if (constellationPoints.length === 0) return;

    // Face takes up 40% of the smaller screen dimension (smaller = more defined)
    const wellSize = Math.min(canvas.width, canvas.height) * 0.4;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    constellationScaled = constellationPoints.map(p => ({
        x: centerX + (p.x - 0.5) * wellSize,
        y: centerY + (p.y - 0.5) * wellSize,
        brightness: p.brightness
    }));
}

function drawConstellationPoints() {
    // Guide points are now invisible - particles form the shape on their own
}

function applyGravityWell(particle) {
    if (!gravityWellLoaded || config.gravityWellStrength === 0 || constellationScaled.length === 0) return;

    // Find the nearest constellation point
    let nearestPoint = null;
    let nearestDist = Infinity;

    for (const cp of constellationScaled) {
        const dx = cp.x - particle.x;
        const dy = cp.y - particle.y;
        const dist = dx * dx + dy * dy;

        if (dist < nearestDist) {
            nearestDist = dist;
            nearestPoint = cp;
        }
    }

    if (nearestPoint) {
        const dist = Math.sqrt(nearestDist);
        const dx = nearestPoint.x - particle.x;
        const dy = nearestPoint.y - particle.y;

        if (dist > 8) {
            // Strong pull toward constellation point
            const strength = config.gravityWellStrength * 0.25;
            particle.vx += (dx / dist) * strength;
            particle.vy += (dy / dist) * strength;
        } else {
            // Settle at the point - heavy damping
            particle.vx *= 0.6;
            particle.vy *= 0.6;
            // Strong nudge toward exact position
            particle.vx += dx * 0.1;
            particle.vy += dy * 0.1;
        }
    }
}

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateScaledConstellation();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle class
class Particle {
    constructor(isPositive, isAntiparticle = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.isPositive = isPositive;
        this.isAntiparticle = isAntiparticle;
        this.radius = isAntiparticle ? 5 : (isPositive ? 4 : 3);
        this.mass = isAntiparticle ? 0.8 : (isPositive ? 1.5 : 1);
        this.alive = true;
    }

    update() {
        // Apply volatility to velocity
        this.vx += (Math.random() - 0.5) * config.volatility * 0.1;
        this.vy += (Math.random() - 0.5) * config.volatility * 0.1;

        // Damping
        const damping = 0.98;
        this.vx *= damping;
        this.vy *= damping;

        // Speed limit
        const maxSpeed = 3 * config.volatility;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Update position (apply speed multiplier)
        this.x += this.vx * config.speed;
        this.y += this.vy * config.speed;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isAntiparticle) {
            // Antiparticles: X shape with glow
            ctx.strokeStyle = colors.antiparticle;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Draw X inside
            ctx.beginPath();
            ctx.moveTo(this.x - 3, this.y - 3);
            ctx.lineTo(this.x + 3, this.y + 3);
            ctx.moveTo(this.x + 3, this.y - 3);
            ctx.lineTo(this.x - 3, this.y + 3);
            ctx.stroke();
        } else if (this.isPositive) {
            ctx.fillStyle = colors.positive;
            ctx.fill();
        } else {
            ctx.strokeStyle = colors.negative;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
}

// Initialize particles
function initParticles() {
    particles = [];
    const antiparticleCount = Math.floor(config.particleCount * config.antiparticleRatio);
    const regularCount = config.particleCount - antiparticleCount;
    const positiveCount = Math.floor(regularCount * config.positiveRatio);

    // Add regular particles
    for (let i = 0; i < regularCount; i++) {
        particles.push(new Particle(i < positiveCount, false));
    }

    // Add antiparticles
    for (let i = 0; i < antiparticleCount; i++) {
        particles.push(new Particle(Math.random() > 0.5, true));
    }
}

// Calculate distance between two particles
function getDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Apply forces between particles
function applyForces() {
    // Skip all particle-to-particle forces if polarity is disabled
    if (!config.polarityEnabled) return;

    const toAnnihilate = [];

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            if (!p1.alive || !p2.alive) continue;

            const distance = getDistance(p1, p2);

            if (distance < config.connectivityRadius && distance > 0) {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;

                // Check for annihilation (antiparticle meets regular particle)
                const canAnnihilate = (p1.isAntiparticle !== p2.isAntiparticle) &&
                                      (p1.isAntiparticle || p2.isAntiparticle);

                if (canAnnihilate && distance < 15) {
                    toAnnihilate.push(i, j);
                    createAnnihilationEffect((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
                    continue;
                }

                // Determine force type based on particle charges
                // Same charge = repel, opposite charge = attract
                // Antiparticles strongly attract their opposites
                let forceMagnitude = (config.edgeLength - distance) * 0.0005 * config.volatility;

                if (canAnnihilate) {
                    // Strong attraction between particle and antiparticle
                    forceMagnitude *= 3;
                }

                const sameCharge = p1.isPositive === p2.isPositive;
                let fx, fy;

                if (canAnnihilate) {
                    // Always attract for annihilation
                    fx = (dx / distance) * forceMagnitude;
                    fy = (dy / distance) * forceMagnitude;
                } else if (sameCharge) {
                    // Repel
                    fx = -(dx / distance) * forceMagnitude;
                    fy = -(dy / distance) * forceMagnitude;
                } else {
                    // Attract
                    fx = (dx / distance) * forceMagnitude;
                    fy = (dy / distance) * forceMagnitude;
                }

                // Apply forces (considering mass)
                p1.vx += fx / p1.mass;
                p1.vy += fy / p1.mass;
                p2.vx -= fx / p2.mass;
                p2.vy -= fy / p2.mass;
            }
        }
    }

    // Process annihilations
    toAnnihilate.forEach(idx => {
        if (particles[idx]) particles[idx].alive = false;
    });
}

// Annihilation visual effect
let annihilationEffects = [];

function createAnnihilationEffect(x, y) {
    annihilationEffects.push({
        x, y,
        radius: 5,
        maxRadius: 40,
        alpha: 1
    });
}

function updateAnnihilationEffects() {
    annihilationEffects = annihilationEffects.filter(effect => {
        effect.radius += 2;
        effect.alpha -= 0.05;

        if (effect.alpha > 0) {
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 100, 255, ${effect.alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Inner flash
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.5})`;
            ctx.fill();
        }

        return effect.alpha > 0;
    });
}

// ============ CHARGE BUILDUP & LIGHTNING SYSTEM ============

// Calculate charge density in grid regions
function calculateChargeRegions() {
    const cols = Math.ceil(canvas.width / GRID_SIZE);
    const rows = Math.ceil(canvas.height / GRID_SIZE);

    // Initialize grid
    chargeRegions = [];
    for (let row = 0; row < rows; row++) {
        chargeRegions[row] = [];
        for (let col = 0; col < cols; col++) {
            chargeRegions[row][col] = {
                x: col * GRID_SIZE + GRID_SIZE / 2,
                y: row * GRID_SIZE + GRID_SIZE / 2,
                positiveCharge: 0,
                negativeCharge: 0,
                netCharge: 0,
                particleCount: 0
            };
        }
    }

    // Accumulate charge from particles
    particles.forEach(p => {
        if (!p.alive) return;

        const col = Math.floor(p.x / GRID_SIZE);
        const row = Math.floor(p.y / GRID_SIZE);

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const region = chargeRegions[row][col];
            region.particleCount++;

            if (p.isAntiparticle) {
                // Antiparticles contribute both charges (volatile)
                region.positiveCharge += 0.5;
                region.negativeCharge += 0.5;
            } else if (p.isPositive) {
                region.positiveCharge += 1;
            } else {
                region.negativeCharge += 1;
            }
        }
    });

    // Calculate net charge for each region
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];
            region.netCharge = region.positiveCharge - region.negativeCharge;
        }
    }
}

// Find highly charged regions and trigger lightning
function checkForDischarge() {
    if (config.dischargeThreshold === 0) return;

    const rows = chargeRegions.length;
    if (rows === 0) return;
    const cols = chargeRegions[0].length;

    // Find strongly positive and negative regions
    const positiveRegions = [];
    const negativeRegions = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];
            const absCharge = Math.abs(region.netCharge);

            if (absCharge >= config.dischargeThreshold) {
                if (region.netCharge > 0) {
                    positiveRegions.push({ ...region, row, col });
                } else {
                    negativeRegions.push({ ...region, row, col });
                }
            }
        }
    }

    // Try to create lightning between opposite charges
    positiveRegions.forEach(posRegion => {
        negativeRegions.forEach(negRegion => {
            const dx = negRegion.x - posRegion.x;
            const dy = negRegion.y - posRegion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Discharge probability based on charge magnitude and distance
            const combinedCharge = Math.abs(posRegion.netCharge) + Math.abs(negRegion.netCharge);
            const dischargeProbability = (combinedCharge / 20) * (300 / Math.max(dist, 100));

            if (Math.random() < dischargeProbability * 0.02) {
                createLightningBolt(posRegion.x, posRegion.y, negRegion.x, negRegion.y);

                // Discharge reduces charge in both regions
                chargeRegions[posRegion.row][posRegion.col].netCharge *= 0.3;
                chargeRegions[negRegion.row][negRegion.col].netCharge *= 0.3;
            }
        });
    });
}

// Create a lightning bolt with jagged path
function createLightningBolt(x1, y1, x2, y2) {
    const bolt = {
        segments: [],
        branches: [],
        alpha: 1,
        life: 15  // frames
    };

    // Generate main bolt path with jagged segments
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segmentCount = Math.max(5, Math.floor(dist / 30));

    let currentX = x1;
    let currentY = y1;
    bolt.segments.push({ x: currentX, y: currentY });

    for (let i = 1; i < segmentCount; i++) {
        const progress = i / segmentCount;
        const targetX = x1 + dx * progress;
        const targetY = y1 + dy * progress;

        // Add perpendicular displacement for jagged effect
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const displacement = (Math.random() - 0.5) * 60 * (1 - Math.abs(progress - 0.5) * 2);

        currentX = targetX + perpX * displacement;
        currentY = targetY + perpY * displacement;
        bolt.segments.push({ x: currentX, y: currentY });

        // Chance to create branch
        if (Math.random() < 0.3 && i > 1 && i < segmentCount - 1) {
            const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI * 0.8;
            const branchLength = 30 + Math.random() * 50;
            createBranch(bolt, currentX, currentY, branchAngle, branchLength, 2);
        }
    }

    bolt.segments.push({ x: x2, y: y2 });
    lightningBolts.push(bolt);

    // Scatter particles near the bolt
    scatterParticlesNearBolt(bolt);
}

// Create a branch off the main bolt
function createBranch(bolt, startX, startY, angle, length, depth) {
    if (depth <= 0) return;

    const branch = [];
    const segments = Math.max(2, Math.floor(length / 20));

    let x = startX;
    let y = startY;
    branch.push({ x, y });

    for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const segmentLength = length / segments;

        // Add some wiggle
        const wiggle = (Math.random() - 0.5) * 0.5;
        const currentAngle = angle + wiggle;

        x += Math.cos(currentAngle) * segmentLength;
        y += Math.sin(currentAngle) * segmentLength;
        branch.push({ x, y });

        // Sub-branches
        if (Math.random() < 0.2 && depth > 1) {
            const subAngle = currentAngle + (Math.random() - 0.5) * Math.PI * 0.6;
            createBranch(bolt, x, y, subAngle, length * 0.5, depth - 1);
        }
    }

    bolt.branches.push(branch);
}

// Scatter particles away from lightning bolt
function scatterParticlesNearBolt(bolt) {
    const scatterRadius = 50;
    const scatterForce = 8;

    bolt.segments.forEach(seg => {
        particles.forEach(p => {
            if (!p.alive) return;

            const dx = p.x - seg.x;
            const dy = p.y - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < scatterRadius && dist > 0) {
                const force = (1 - dist / scatterRadius) * scatterForce;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        });
    });
}

// Draw all lightning bolts
function drawLightning() {
    lightningBolts = lightningBolts.filter(bolt => {
        bolt.life--;
        bolt.alpha = bolt.life / 15;

        if (bolt.alpha <= 0) return false;

        // Draw main bolt with glow
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow
        ctx.shadowColor = `rgba(180, 200, 255, ${bolt.alpha})`;
        ctx.shadowBlur = 20;

        // Main bolt - bright core
        ctx.beginPath();
        ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
        for (let i = 1; i < bolt.segments.length; i++) {
            ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Secondary glow layer
        ctx.strokeStyle = `rgba(180, 200, 255, ${bolt.alpha * 0.8})`;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Draw branches
        bolt.branches.forEach(branch => {
            ctx.beginPath();
            ctx.moveTo(branch[0].x, branch[0].y);
            for (let i = 1; i < branch.length; i++) {
                ctx.lineTo(branch[i].x, branch[i].y);
            }
            ctx.strokeStyle = `rgba(200, 220, 255, ${bolt.alpha * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        ctx.restore();

        return true;
    });
}

// Draw charge glow on particles based on local charge density
function drawChargeGlow() {
    if (chargeRegions.length === 0) return;

    const rows = chargeRegions.length;
    const cols = chargeRegions[0].length;

    // Draw subtle glow for charged regions
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];
            const absCharge = Math.abs(region.netCharge);

            if (absCharge > 2) {
                const intensity = Math.min(absCharge / 10, 0.4);
                const isPositive = region.netCharge > 0;

                // Draw glow
                const gradient = ctx.createRadialGradient(
                    region.x, region.y, 0,
                    region.x, region.y, GRID_SIZE
                );

                if (isPositive) {
                    gradient.addColorStop(0, `rgba(255, 200, 200, ${intensity})`);
                    gradient.addColorStop(1, 'rgba(255, 200, 200, 0)');
                } else {
                    gradient.addColorStop(0, `rgba(150, 150, 255, ${intensity})`);
                    gradient.addColorStop(1, 'rgba(150, 150, 255, 0)');
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    region.x - GRID_SIZE,
                    region.y - GRID_SIZE,
                    GRID_SIZE * 2,
                    GRID_SIZE * 2
                );
            }
        }
    }
}

// Draw connections between nearby particles
function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            if (!p1.alive || !p2.alive) continue;

            const distance = getDistance(p1, p2);

            if (distance < config.connectivityRadius) {
                const opacity = 1 - (distance / config.connectivityRadius);
                const sameCharge = p1.isPositive === p2.isPositive;
                const canAnnihilate = (p1.isAntiparticle !== p2.isAntiparticle) &&
                                      (p1.isAntiparticle || p2.isAntiparticle);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                if (canAnnihilate) {
                    // Magenta connection for particle-antiparticle
                    ctx.strokeStyle = `rgba(255, 100, 255, ${opacity * 0.6})`;
                    ctx.lineWidth = opacity * 2;
                } else if (sameCharge) {
                    ctx.strokeStyle = `rgba(255, 180, 180, ${opacity * 0.3})`;
                    ctx.lineWidth = opacity * 1.5;
                } else {
                    ctx.strokeStyle = `rgba(180, 180, 255, ${opacity * 0.5})`;
                    ctx.lineWidth = opacity * 1.5;
                }

                ctx.stroke();
            }
        }
    }
}

// Main animation loop
function animate() {
    // Clear canvas with slight trail effect
    ctx.fillStyle = 'rgba(10, 10, 18, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw constellation guide points (subtle)
    drawConstellationPoints();

    // Calculate charge regions for lightning system
    calculateChargeRegions();

    // Draw charge glow before particles
    drawChargeGlow();

    applyForces();
    drawConnections();
    updateAnnihilationEffects();

    // Check for and trigger lightning discharge
    checkForDischarge();
    drawLightning();

    particles.forEach(particle => {
        if (particle.alive) {
            applyGravityWell(particle);
            particle.update();
            particle.draw();
        }
    });

    // Clean up dead particles periodically
    if (Math.random() < 0.01) {
        particles = particles.filter(p => p.alive);
    }

    requestAnimationFrame(animate);
}

// Control event listeners
document.getElementById('connectivity').addEventListener('input', (e) => {
    config.connectivityRadius = parseInt(e.target.value);
    document.getElementById('connectivity-val').textContent = e.target.value;
});

document.getElementById('edge-length').addEventListener('input', (e) => {
    config.edgeLength = parseInt(e.target.value);
    document.getElementById('edge-length-val').textContent = e.target.value;
});

document.getElementById('volatility').addEventListener('input', (e) => {
    config.volatility = parseFloat(e.target.value);
    document.getElementById('volatility-val').textContent = e.target.value;
});

document.getElementById('particle-count').addEventListener('input', (e) => {
    config.particleCount = parseInt(e.target.value);
    document.getElementById('particle-count-val').textContent = e.target.value;
    initParticles();
});

document.getElementById('positive-ratio').addEventListener('input', (e) => {
    config.positiveRatio = parseInt(e.target.value) / 100;
    document.getElementById('positive-ratio-val').textContent = e.target.value;
    initParticles();
});

document.getElementById('speed').addEventListener('input', (e) => {
    config.speed = parseFloat(e.target.value);
    document.getElementById('speed-val').textContent = e.target.value;
});

document.getElementById('antiparticle-ratio').addEventListener('input', (e) => {
    config.antiparticleRatio = parseInt(e.target.value) / 100;
    document.getElementById('antiparticle-ratio-val').textContent = e.target.value;
    initParticles();
});

document.getElementById('gravity-well').addEventListener('input', (e) => {
    config.gravityWellStrength = parseFloat(e.target.value);
    document.getElementById('gravity-well-val').textContent = e.target.value;
});

document.getElementById('discharge-threshold').addEventListener('input', (e) => {
    config.dischargeThreshold = parseFloat(e.target.value);
    document.getElementById('discharge-threshold-val').textContent = e.target.value;
});

document.getElementById('polarity-toggle').addEventListener('change', (e) => {
    config.polarityEnabled = e.target.checked;
});

document.getElementById('reset-btn').addEventListener('click', () => {
    initParticles();
    annihilationEffects = [];
});

// Start the simulation
initParticles();
animate();
