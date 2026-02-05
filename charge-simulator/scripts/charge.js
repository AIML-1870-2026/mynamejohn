// Charge Cloud Simulator - Particle Charge Buildup & Discharge
const canvas = document.getElementById('charge-canvas');
const ctx = canvas.getContext('2d');

// Configuration
let config = {
    particleCount: 400,
    edgeLength: 100,
    connectivityRadius: 150,
    connectivityStrength: 1.5,
    speed: 1.0,
    volatility: 0.4,
    positiveRatio: 0.5,
    antiparticleRatio: 0.08,
    antiparticleCharge: 2.5,
    darkMatterRatio: 0.08,
    darkMatterMass: 4.0,
    dischargeThreshold: 3,
    polarityEnabled: true
};

// Color palette - Periwinkle (negative) and Pale Orange (positive)
const colors = {
    positive: '#ffcc99',       // Pale orange
    negative: '#ccccff',       // Periwinkle
    antiparticle: '#ff88ff',   // Magenta
    darkMatter: '#1a1a2e',     // Deep void blue-black
    darkMatterEdge: '#3a3a5e', // Subtle edge
    positiveRgb: '255, 204, 153',
    negativeRgb: '204, 204, 255',
    antiRgb: '255, 136, 255',
    darkRgb: '40, 40, 70'
};

let particles = [];
let chargeRegions = [];
let lightningBolts = [];
let annihilationEffects = [];

const GRID_SIZE = 60;

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle class
class Particle {
    constructor(isPositive, isAntiparticle = false, isDarkMatter = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.isPositive = isPositive;
        this.isAntiparticle = isAntiparticle;
        this.isDarkMatter = isDarkMatter;

        // Dark matter: large, heavy, no charge, only gravitational interaction
        if (isDarkMatter) {
            this.radius = 6 + Math.random() * 4;
            this.mass = config.darkMatterMass;
            this.charge = 0;
        } else if (isAntiparticle) {
            this.radius = 5;
            this.mass = 0.8;
            this.charge = (isPositive ? 1 : -1) * config.antiparticleCharge;
        } else {
            this.radius = isPositive ? 4 : 3.5;
            this.mass = isPositive ? 1.2 : 1;
            this.charge = isPositive ? 1 : -1;
        }

        this.alive = true;
        this.localChargeDensity = 0;
        this.gravitationalPull = 0; // For dark matter influence visualization
    }

    update() {
        // Apply volatility
        this.vx += (Math.random() - 0.5) * config.volatility * 0.1;
        this.vy += (Math.random() - 0.5) * config.volatility * 0.1;

        // Damping
        const damping = 0.97;
        this.vx *= damping;
        this.vy *= damping;

        // Speed limit
        const maxSpeed = 4 * config.volatility;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // Update position
        this.x += this.vx * config.speed;
        this.y += this.vy * config.speed;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -0.8;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -0.8;
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isDarkMatter) {
            // Dark matter is invisible - do not draw the particle itself
            // Only visible through gravitational effects on other particles
            return;
        } else if (this.isAntiparticle) {
            // Antiparticle: hollow with X, intensity based on charge
            const chargeIntensity = Math.min(config.antiparticleCharge / 3, 1);
            ctx.strokeStyle = colors.antiparticle;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Glow based on charge
            if (chargeIntensity > 0.5) {
                ctx.shadowColor = `rgba(${colors.antiRgb}, ${chargeIntensity * 0.5})`;
                ctx.shadowBlur = 6 * chargeIntensity;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // X mark
            ctx.beginPath();
            const s = this.radius * 0.6;
            ctx.moveTo(this.x - s, this.y - s);
            ctx.lineTo(this.x + s, this.y + s);
            ctx.moveTo(this.x + s, this.y - s);
            ctx.lineTo(this.x - s, this.y + s);
            ctx.stroke();
        } else if (this.isPositive) {
            // Positive: filled pale orange
            ctx.fillStyle = colors.positive;
            ctx.fill();

            // Subtle glow based on local charge
            if (this.localChargeDensity > 2) {
                const glowIntensity = Math.min(this.localChargeDensity / 10, 0.5);
                ctx.shadowColor = `rgba(${colors.positiveRgb}, ${glowIntensity})`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        } else {
            // Negative: filled periwinkle
            ctx.fillStyle = colors.negative;
            ctx.fill();

            // Subtle glow based on local charge
            if (this.localChargeDensity > 2) {
                const glowIntensity = Math.min(this.localChargeDensity / 10, 0.5);
                ctx.shadowColor = `rgba(${colors.negativeRgb}, ${glowIntensity})`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
}

// Initialize particles
function initParticles() {
    particles = [];
    const darkMatterCount = Math.floor(config.particleCount * config.darkMatterRatio);
    const antiparticleCount = Math.floor(config.particleCount * config.antiparticleRatio);
    const regularCount = config.particleCount - antiparticleCount - darkMatterCount;
    const positiveCount = Math.floor(regularCount * config.positiveRatio);

    // Regular particles
    for (let i = 0; i < regularCount; i++) {
        particles.push(new Particle(i < positiveCount, false, false));
    }

    // Antiparticles (random charge)
    for (let i = 0; i < antiparticleCount; i++) {
        particles.push(new Particle(Math.random() > 0.5, true, false));
    }

    // Dark matter (invisible, only gravitational)
    for (let i = 0; i < darkMatterCount; i++) {
        particles.push(new Particle(false, false, true));
    }
}

// Distance calculation
function getDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Apply electrostatic and gravitational forces
function applyForces() {
    const toAnnihilate = [];

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            if (!p1.alive || !p2.alive) continue;

            const distance = getDistance(p1, p2);
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Dark matter gravitational pull (always active, affects all particles)
            if (p1.isDarkMatter || p2.isDarkMatter) {
                if (distance < config.connectivityRadius * 1.5 && distance > 5) {
                    // Gravitational attraction - dark matter pulls everything toward it
                    const darkParticle = p1.isDarkMatter ? p1 : p2;
                    const otherParticle = p1.isDarkMatter ? p2 : p1;
                    const direction = p1.isDarkMatter ? 1 : -1;

                    // Gravitational force: stronger when closer, proportional to dark matter mass
                    const gravityStrength = (config.darkMatterMass * 0.002) / Math.max(distance * 0.01, 0.5);

                    const gx = (dx / distance) * gravityStrength * direction;
                    const gy = (dy / distance) * gravityStrength * direction;

                    // Dark matter affects other particle
                    otherParticle.vx += gx;
                    otherParticle.vy += gy;

                    // Dark matter itself moves slowly (high inertia)
                    darkParticle.vx -= gx * 0.1 / config.darkMatterMass;
                    darkParticle.vy -= gy * 0.1 / config.darkMatterMass;
                }
                continue; // Dark matter doesn't participate in electromagnetic forces
            }

            // Skip electromagnetic forces if polarity disabled
            if (!config.polarityEnabled) continue;

            if (distance < config.connectivityRadius && distance > 5) {
                // Check for annihilation (antiparticle meets regular particle)
                const canAnnihilate = (p1.isAntiparticle !== p2.isAntiparticle) &&
                                      (p1.isAntiparticle || p2.isAntiparticle);

                if (canAnnihilate && distance < 12) {
                    toAnnihilate.push(i, j);
                    createAnnihilationEffect((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
                    continue;
                }

                // Check if both are antiparticles (colony formation)
                const bothAntiparticles = p1.isAntiparticle && p2.isAntiparticle;

                // Coulomb's law: F = k * q1 * q2 / r²
                // Positive result = repulsion, negative = attraction
                const minDist = 15; // Prevent extreme forces at close range
                const effectiveDist = Math.max(distance, minDist);
                const coulombK = config.connectivityStrength * config.volatility * 25;

                // Get charge values (regular particles: ±1, antiparticles: ±antiparticleCharge)
                const q1 = p1.charge;
                const q2 = p2.charge;

                // Inverse square law: force magnitude
                let forceMagnitude = coulombK * Math.abs(q1 * q2) / (effectiveDist * effectiveDist);

                // Determine direction: same sign charges repel, opposite attract
                const sameCharge = (q1 * q2) > 0;
                let fx, fy;

                if (bothAntiparticles) {
                    // Antiparticles form colonies - add cohesion on top of electromagnetic forces
                    const colonyAttraction = 0.5 * config.connectivityStrength;

                    if (sameCharge) {
                        // Same charge: repel (but weaker for colony formation)
                        fx = -(dx / distance) * forceMagnitude * 0.3;
                        fy = -(dy / distance) * forceMagnitude * 0.3;
                    } else {
                        // Opposite charge: attract
                        fx = (dx / distance) * forceMagnitude;
                        fy = (dy / distance) * forceMagnitude;
                    }
                    // Add colony cohesion
                    fx += (dx / distance) * colonyAttraction;
                    fy += (dy / distance) * colonyAttraction;
                } else if (canAnnihilate) {
                    // Strong attraction for annihilation
                    fx = (dx / distance) * forceMagnitude * 2;
                    fy = (dy / distance) * forceMagnitude * 2;
                } else if (sameCharge) {
                    // Same charges repel (force points away from other particle)
                    fx = -(dx / distance) * forceMagnitude;
                    fy = -(dy / distance) * forceMagnitude;
                } else {
                    // Opposite charges attract (force points toward other particle)
                    fx = (dx / distance) * forceMagnitude;
                    fy = (dy / distance) * forceMagnitude;
                }

                // Apply forces
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

// Annihilation effects
function createAnnihilationEffect(x, y) {
    annihilationEffects.push({
        x, y,
        radius: 5,
        alpha: 1
    });
}

function updateAnnihilationEffects() {
    annihilationEffects = annihilationEffects.filter(effect => {
        effect.radius += 3;
        effect.alpha -= 0.04;

        if (effect.alpha > 0) {
            // Outer ring
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${colors.antiRgb}, ${effect.alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Inner flash
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.6})`;
            ctx.fill();
        }

        return effect.alpha > 0;
    });
}

// Charge region calculation
function calculateChargeRegions() {
    const cols = Math.ceil(canvas.width / GRID_SIZE);
    const rows = Math.ceil(canvas.height / GRID_SIZE);

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
                // Antiparticle colony charge tracking
                antiPositiveCharge: 0,
                antiNegativeCharge: 0,
                antiNetCharge: 0,
                antiparticleCount: 0,
                particleCount: 0
            };
        }
    }

    // Accumulate charges - separate tracking for regular and antiparticles
    particles.forEach(p => {
        if (!p.alive || p.isDarkMatter) return;

        const col = Math.floor(p.x / GRID_SIZE);
        const row = Math.floor(p.y / GRID_SIZE);

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const region = chargeRegions[row][col];
            region.particleCount++;

            if (p.isAntiparticle) {
                // Antiparticles form their own charge colonies
                region.antiparticleCount++;
                const chargeAmount = config.antiparticleCharge;
                if (p.isPositive) {
                    region.antiPositiveCharge += chargeAmount;
                } else {
                    region.antiNegativeCharge += chargeAmount;
                }
            } else {
                // Regular particles
                if (p.isPositive) {
                    region.positiveCharge += 1;
                } else {
                    region.negativeCharge += 1;
                }
            }
        }
    });

    // Calculate net charges for both regular and antiparticle colonies
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];
            region.netCharge = region.positiveCharge - region.negativeCharge;
            region.antiNetCharge = region.antiPositiveCharge - region.antiNegativeCharge;
        }
    }

    // Update particle local charge density
    particles.forEach(p => {
        if (!p.alive || p.isDarkMatter) return;
        const col = Math.floor(p.x / GRID_SIZE);
        const row = Math.floor(p.y / GRID_SIZE);
        if (row >= 0 && row < chargeRegions.length && col >= 0 && col < chargeRegions[0].length) {
            const region = chargeRegions[row][col];
            if (p.isAntiparticle) {
                p.localChargeDensity = Math.abs(region.antiNetCharge);
            } else {
                p.localChargeDensity = Math.abs(region.netCharge);
            }
        }
    });
}

// Check for discharge (lightning)
function checkForDischarge() {
    if (config.dischargeThreshold <= 0) return;

    const rows = chargeRegions.length;
    if (rows === 0) return;
    const cols = chargeRegions[0].length;

    // Regular particle regions
    const positiveRegions = [];
    const negativeRegions = [];
    // Antiparticle colony regions
    const antiPositiveRegions = [];
    const antiNegativeRegions = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];

            // Regular particle charge buildup
            const absCharge = Math.abs(region.netCharge);
            if (absCharge >= config.dischargeThreshold) {
                if (region.netCharge > 0) {
                    positiveRegions.push({ ...region, row, col, isAnti: false });
                } else {
                    negativeRegions.push({ ...region, row, col, isAnti: false });
                }
            }

            // Antiparticle colony charge buildup
            const absAntiCharge = Math.abs(region.antiNetCharge);
            if (absAntiCharge >= config.dischargeThreshold * 0.7) { // Lower threshold for volatile antimatter
                if (region.antiNetCharge > 0) {
                    antiPositiveRegions.push({ ...region, row, col, isAnti: true });
                } else {
                    antiNegativeRegions.push({ ...region, row, col, isAnti: true });
                }
            }
        }
    }

    // Regular particle lightning (white/blue)
    positiveRegions.forEach(posRegion => {
        negativeRegions.forEach(negRegion => {
            const dx = negRegion.x - posRegion.x;
            const dy = negRegion.y - posRegion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const combinedCharge = Math.abs(posRegion.netCharge) + Math.abs(negRegion.netCharge);
            const dischargeProbability = (combinedCharge / 25) * (250 / Math.max(dist, 80));

            if (Math.random() < dischargeProbability * 0.04) {
                createLightningBolt(posRegion.x, posRegion.y, negRegion.x, negRegion.y, false);

                // Reduce charge
                chargeRegions[posRegion.row][posRegion.col].netCharge *= 0.2;
                chargeRegions[negRegion.row][negRegion.col].netCharge *= 0.2;
            }
        });
    });

    // Antiparticle colony lightning (magenta/pink)
    antiPositiveRegions.forEach(posRegion => {
        antiNegativeRegions.forEach(negRegion => {
            const dx = negRegion.x - posRegion.x;
            const dy = negRegion.y - posRegion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const combinedCharge = Math.abs(posRegion.antiNetCharge) + Math.abs(negRegion.antiNetCharge);
            const dischargeProbability = (combinedCharge / 20) * (300 / Math.max(dist, 60)); // More volatile

            if (Math.random() < dischargeProbability * 0.02) {
                createLightningBolt(posRegion.x, posRegion.y, negRegion.x, negRegion.y, true);

                // Reduce antiparticle charge
                chargeRegions[posRegion.row][posRegion.col].antiNetCharge *= 0.15;
                chargeRegions[negRegion.row][negRegion.col].antiNetCharge *= 0.15;
            }
        });
    });

    // Cross-discharge: antiparticle regions can discharge to regular regions (explosive!)
    antiPositiveRegions.concat(antiNegativeRegions).forEach(antiRegion => {
        const oppositeRegions = antiRegion.antiNetCharge > 0 ? negativeRegions : positiveRegions;
        oppositeRegions.forEach(regRegion => {
            const dx = regRegion.x - antiRegion.x;
            const dy = regRegion.y - antiRegion.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) { // Only nearby regions
                const combinedCharge = Math.abs(antiRegion.antiNetCharge) + Math.abs(regRegion.netCharge);
                const dischargeProbability = (combinedCharge / 15) * (150 / Math.max(dist, 40));

                if (Math.random() < dischargeProbability * 0.008) {
                    createLightningBolt(antiRegion.x, antiRegion.y, regRegion.x, regRegion.y, true);
                    // Cross-discharge is extra destructive
                    createAnnihilationEffect((antiRegion.x + regRegion.x) / 2, (antiRegion.y + regRegion.y) / 2);

                    chargeRegions[antiRegion.row][antiRegion.col].antiNetCharge *= 0.1;
                    chargeRegions[regRegion.row][regRegion.col].netCharge *= 0.1;
                }
            }
        });
    });
}

// Lightning bolt creation - realistic style
function createLightningBolt(x1, y1, x2, y2, isAntiparticle = false) {
    const bolt = {
        segments: [],
        branches: [],
        alpha: 1,
        life: isAntiparticle ? 5 : 4, // Quick flash
        maxLife: isAntiparticle ? 5 : 4,
        isAntiparticle: isAntiparticle,
        flicker: Math.random() // For flickering effect
    };

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // More segments for jaggedness
    const segmentCount = Math.max(8, Math.floor(dist / 15));

    let currentX = x1;
    let currentY = y1;
    bolt.segments.push({ x: currentX, y: currentY });

    // Main channel with irregular jagged path
    for (let i = 1; i < segmentCount; i++) {
        const progress = i / segmentCount;
        const targetX = x1 + dx * progress;
        const targetY = y1 + dy * progress;

        const perpX = -dy / dist;
        const perpY = dx / dist;

        // Variable displacement - sharp but controlled
        const jitter = (Math.random() - 0.5) * 2;
        const maxDisp = 35 * (1 - Math.pow(Math.abs(progress - 0.5) * 2, 0.5));
        const displacement = jitter * maxDisp * (0.4 + Math.random() * 0.4);

        currentX = targetX + perpX * displacement;
        currentY = targetY + perpY * displacement;
        bolt.segments.push({ x: currentX, y: currentY });

        // More frequent branching
        if (Math.random() < 0.4 && i > 1 && i < segmentCount - 1) {
            // Branches tend to go outward from main direction
            const mainAngle = Math.atan2(dy, dx);
            const branchSide = Math.random() > 0.5 ? 1 : -1;
            const branchAngle = mainAngle + branchSide * (0.3 + Math.random() * 0.8);
            const branchLength = 20 + Math.random() * 60;
            createBranch(bolt, currentX, currentY, branchAngle, branchLength, 3);
        }
    }

    bolt.segments.push({ x: x2, y: y2 });
    lightningBolts.push(bolt);
    scatterParticlesNearBolt(bolt);
}

function createBranch(bolt, startX, startY, angle, length, depth) {
    if (depth <= 0 || length < 8) return;

    const branch = {
        segments: [],
        depth: depth
    };

    const segments = Math.max(3, Math.floor(length / 10));

    let x = startX;
    let y = startY;
    let currentAngle = angle;
    branch.segments.push({ x, y });

    for (let i = 1; i <= segments; i++) {
        const segmentLength = (length / segments) * (0.7 + Math.random() * 0.6);
        // Sharper angle changes
        const wiggle = (Math.random() - 0.5) * 0.7;
        currentAngle = angle + wiggle;

        x += Math.cos(currentAngle) * segmentLength;
        y += Math.sin(currentAngle) * segmentLength;
        branch.segments.push({ x, y });

        // Sub-branches
        if (Math.random() < 0.3 && depth > 1) {
            const subSide = Math.random() > 0.5 ? 1 : -1;
            const subAngle = currentAngle + subSide * (0.4 + Math.random() * 0.6);
            createBranch(bolt, x, y, subAngle, length * 0.5, depth - 1);
        }
    }

    bolt.branches.push(branch);
}

function scatterParticlesNearBolt(bolt) {
    const scatterRadius = 40;
    const scatterForce = 6;

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

// Draw lightning - realistic multi-layer rendering
function drawLightning() {
    lightningBolts = lightningBolts.filter(bolt => {
        bolt.life--;
        bolt.alpha = bolt.life / bolt.maxLife;

        if (bolt.alpha <= 0) return false;

        // Flicker effect - intensity varies
        const flicker = 0.7 + Math.random() * 0.3;
        const intensity = bolt.alpha * flicker;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'bevel'; // Sharper joins

        // Color palettes
        let outerGlow, midGlow, innerGlow, core, branchOuter, branchCore;

        if (bolt.isAntiparticle) {
            // Antimatter: magenta/violet
            outerGlow = `rgba(180, 50, 200, ${intensity * 0.15})`;
            midGlow = `rgba(220, 100, 255, ${intensity * 0.4})`;
            innerGlow = `rgba(255, 150, 255, ${intensity * 0.7})`;
            core = `rgba(255, 220, 255, ${intensity})`;
            branchOuter = `rgba(200, 80, 220, ${intensity * 0.3})`;
            branchCore = `rgba(255, 180, 255, ${intensity * 0.6})`;
        } else {
            // Regular: white/cyan/blue
            outerGlow = `rgba(100, 150, 255, ${intensity * 0.12})`;
            midGlow = `rgba(150, 200, 255, ${intensity * 0.35})`;
            innerGlow = `rgba(200, 230, 255, ${intensity * 0.7})`;
            core = `rgba(255, 255, 255, ${intensity})`;
            branchOuter = `rgba(120, 170, 255, ${intensity * 0.25})`;
            branchCore = `rgba(220, 240, 255, ${intensity * 0.5})`;
        }

        // === MAIN BOLT ===

        // Layer 1: Subtle outer glow
        ctx.beginPath();
        ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
        for (let i = 1; i < bolt.segments.length; i++) {
            ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
        }
        ctx.strokeStyle = outerGlow;
        ctx.lineWidth = 6;
        ctx.shadowColor = outerGlow;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Layer 2: Inner glow
        ctx.shadowBlur = 6;
        ctx.strokeStyle = innerGlow;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Layer 3: Bright core
        ctx.shadowBlur = 2;
        ctx.shadowColor = core;
        ctx.strokeStyle = core;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // === BRANCHES ===
        bolt.branches.forEach(branch => {
            if (!branch.segments || branch.segments.length < 2) return;

            const depthFade = branch.depth / 3;

            ctx.beginPath();
            ctx.moveTo(branch.segments[0].x, branch.segments[0].y);
            for (let i = 1; i < branch.segments.length; i++) {
                ctx.lineTo(branch.segments[i].x, branch.segments[i].y);
            }

            ctx.shadowBlur = 4 * depthFade;
            ctx.shadowColor = branchOuter;
            ctx.strokeStyle = branchCore;
            ctx.lineWidth = 0.8 * depthFade;
            ctx.stroke();
        });

        // === FLASH EFFECT on first frame ===
        if (bolt.life === bolt.maxLife - 1) {
            const flashGrad = ctx.createRadialGradient(
                bolt.segments[0].x, bolt.segments[0].y, 0,
                bolt.segments[0].x, bolt.segments[0].y, 25
            );
            flashGrad.addColorStop(0, bolt.isAntiparticle ? 'rgba(255, 200, 255, 0.4)' : 'rgba(255, 255, 255, 0.4)');
            flashGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = flashGrad;
            ctx.fillRect(bolt.segments[0].x - 25, bolt.segments[0].y - 25, 50, 50);
        }

        ctx.restore();
        return true;
    });
}

// Draw charge glow regions
function drawChargeGlow() {
    if (chargeRegions.length === 0) return;

    const rows = chargeRegions.length;
    const cols = chargeRegions[0].length;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const region = chargeRegions[row][col];

            // Regular particle charge glow
            const absCharge = Math.abs(region.netCharge);
            if (absCharge > 2) {
                const intensity = Math.min(absCharge / 12, 0.35);
                const isPositive = region.netCharge > 0;

                const gradient = ctx.createRadialGradient(
                    region.x, region.y, 0,
                    region.x, region.y, GRID_SIZE * 0.9
                );

                if (isPositive) {
                    gradient.addColorStop(0, `rgba(${colors.positiveRgb}, ${intensity})`);
                    gradient.addColorStop(1, `rgba(${colors.positiveRgb}, 0)`);
                } else {
                    gradient.addColorStop(0, `rgba(${colors.negativeRgb}, ${intensity})`);
                    gradient.addColorStop(1, `rgba(${colors.negativeRgb}, 0)`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    region.x - GRID_SIZE,
                    region.y - GRID_SIZE,
                    GRID_SIZE * 2,
                    GRID_SIZE * 2
                );
            }

            // Antiparticle colony charge glow (magenta-tinted)
            const absAntiCharge = Math.abs(region.antiNetCharge);
            if (absAntiCharge > 1.5) {
                const intensity = Math.min(absAntiCharge / 10, 0.4);

                const gradient = ctx.createRadialGradient(
                    region.x, region.y, 0,
                    region.x, region.y, GRID_SIZE * 0.85
                );

                // Antimatter glow - magenta/pink with slight variation based on charge
                if (region.antiNetCharge > 0) {
                    // Anti-positive: more orange-pink
                    gradient.addColorStop(0, `rgba(255, 150, 200, ${intensity})`);
                    gradient.addColorStop(1, `rgba(255, 150, 200, 0)`);
                } else {
                    // Anti-negative: more blue-pink
                    gradient.addColorStop(0, `rgba(200, 150, 255, ${intensity})`);
                    gradient.addColorStop(1, `rgba(200, 150, 255, 0)`);
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

// Draw connections between particles
function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            if (!p1.alive || !p2.alive) continue;

            const distance = getDistance(p1, p2);

            if (distance < config.connectivityRadius) {
                const opacity = (1 - (distance / config.connectivityRadius)) * 0.5 * config.connectivityStrength;
                const sameCharge = p1.isPositive === p2.isPositive;
                const canAnnihilate = (p1.isAntiparticle !== p2.isAntiparticle) &&
                                      (p1.isAntiparticle || p2.isAntiparticle);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                if (canAnnihilate) {
                    ctx.strokeStyle = `rgba(${colors.antiRgb}, ${opacity * 0.8})`;
                    ctx.lineWidth = opacity * 2.5;
                } else if (sameCharge) {
                    // Same charge - use their color but muted
                    const rgb = p1.isPositive ? colors.positiveRgb : colors.negativeRgb;
                    ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.4})`;
                    ctx.lineWidth = opacity * 1.2;
                } else {
                    // Opposite charges - blend of both colors (appears as light purple-peach)
                    ctx.strokeStyle = `rgba(230, 210, 230, ${opacity * 0.6})`;
                    ctx.lineWidth = opacity * 1.5;
                }

                ctx.stroke();
            }
        }
    }
}

// Animation loop
function animate() {
    // Clear with trail effect
    ctx.fillStyle = 'rgba(8, 8, 16, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate charge regions
    calculateChargeRegions();

    // Draw charge glow
    drawChargeGlow();

    // Apply forces
    applyForces();

    // Draw connections
    drawConnections();

    // Effects
    updateAnnihilationEffects();
    checkForDischarge();
    drawLightning();

    // Update and draw particles
    particles.forEach(particle => {
        if (particle.alive) {
            particle.update();
            particle.draw();
        }
    });

    // Cleanup dead particles periodically
    if (Math.random() < 0.01) {
        particles = particles.filter(p => p.alive);
    }

    requestAnimationFrame(animate);
}

// Control event listeners
document.getElementById('particle-count').addEventListener('input', (e) => {
    config.particleCount = parseInt(e.target.value);
    document.getElementById('particle-count-val').textContent = e.target.value;
    // Update antiparticle count display based on current ratio
    const antiCount = Math.floor(config.particleCount * config.antiparticleRatio);
    document.getElementById('antiparticle-count').value = antiCount;
    document.getElementById('antiparticle-count-val').textContent = antiCount;
    initParticles();
});

document.getElementById('edge-length').addEventListener('input', (e) => {
    config.edgeLength = parseInt(e.target.value);
    document.getElementById('edge-length-val').textContent = e.target.value;
});

document.getElementById('connectivity-radius').addEventListener('input', (e) => {
    config.connectivityRadius = parseInt(e.target.value);
    document.getElementById('connectivity-radius-val').textContent = e.target.value;
});

document.getElementById('connectivity-strength').addEventListener('input', (e) => {
    config.connectivityStrength = parseFloat(e.target.value);
    document.getElementById('connectivity-strength-val').textContent = e.target.value;
});

document.getElementById('speed').addEventListener('input', (e) => {
    config.speed = parseFloat(e.target.value);
    document.getElementById('speed-val').textContent = e.target.value;
});

document.getElementById('volatility').addEventListener('input', (e) => {
    config.volatility = parseFloat(e.target.value);
    document.getElementById('volatility-val').textContent = e.target.value;
});

document.getElementById('positive-ratio').addEventListener('input', (e) => {
    config.positiveRatio = parseInt(e.target.value) / 100;
    document.getElementById('positive-ratio-val').textContent = e.target.value;
    initParticles();
});

document.getElementById('antiparticle-ratio').addEventListener('input', (e) => {
    config.antiparticleRatio = parseInt(e.target.value) / 100;
    document.getElementById('antiparticle-ratio-val').textContent = e.target.value;
    // Sync count slider
    const count = Math.floor(config.particleCount * config.antiparticleRatio);
    document.getElementById('antiparticle-count').value = count;
    document.getElementById('antiparticle-count-val').textContent = count;
    initParticles();
});

document.getElementById('antiparticle-count').addEventListener('input', (e) => {
    const count = parseInt(e.target.value);
    document.getElementById('antiparticle-count-val').textContent = count;
    // Calculate ratio and sync percentage slider
    config.antiparticleRatio = count / config.particleCount;
    const percentage = Math.round(config.antiparticleRatio * 100);
    document.getElementById('antiparticle-ratio').value = percentage;
    document.getElementById('antiparticle-ratio-val').textContent = percentage;
    initParticles();
});

document.getElementById('antiparticle-charge').addEventListener('input', (e) => {
    config.antiparticleCharge = parseFloat(e.target.value);
    document.getElementById('antiparticle-charge-val').textContent = e.target.value;
    // Update existing antiparticle charges
    particles.forEach(p => {
        if (p.isAntiparticle) {
            p.charge = (p.isPositive ? 1 : -1) * config.antiparticleCharge;
        }
    });
});

document.getElementById('dark-matter-ratio').addEventListener('input', (e) => {
    config.darkMatterRatio = parseInt(e.target.value) / 100;
    document.getElementById('dark-matter-ratio-val').textContent = e.target.value;
    initParticles();
});

document.getElementById('dark-matter-mass').addEventListener('input', (e) => {
    config.darkMatterMass = parseFloat(e.target.value);
    document.getElementById('dark-matter-mass-val').textContent = e.target.value;
    // Update existing dark matter masses
    particles.forEach(p => {
        if (p.isDarkMatter) {
            p.mass = config.darkMatterMass;
        }
    });
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
    lightningBolts = [];
});

// Settings visibility toggle
const toggleBtn = document.getElementById('toggle-controls');
const controlsPanel = document.getElementById('controls');

toggleBtn.addEventListener('click', () => {
    controlsPanel.classList.toggle('hidden');
    toggleBtn.classList.toggle('active');
});

// Start simulation
initParticles();
animate();
