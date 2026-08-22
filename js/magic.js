/**
 * magic.js - Magical Abilities System
 * Proficiency tracking for different magic types
 * Class recommendations based on magical proficiency
 * No emojis, only Unicode icons
 */

// Magic type definitions
var MAGIC_TYPES = {
    earth: {
        id: 'earth',
        label: 'Earth Magic',
        icon: '\u26F6\uFE0F', // Geyser/earth icon
        description: 'Manipulation of earth, stone, and metals',
        category: 'elemental',
        color: '#8B7355'
    },
    water: {
        id: 'water',
        label: 'Water Magic',
        icon: '\uD83D\uDCA7', // Water droplet
        description: 'Control of water, ice, and moisture',
        category: 'elemental',
        color: '#4A9BC7'
    },
    fire: {
        id: 'fire',
        label: 'Fire Magic',
        icon: '\uD83D\uDD25', // Fire
        description: 'Manipulation of flames and heat',
        category: 'elemental',
        color: '#E67E22'
    },
    air: {
        id: 'air',
        label: 'Air Magic',
        icon: '\uD83C\uDF2A\uFE0F', // Wind/cloud
        description: 'Control of wind and air currents',
        category: 'elemental',
        color: '#A8D5E2'
    },
    metal: {
        id: 'metal',
        label: 'Metal Magic',
        icon: '\u2692\uFE0F', // Hammer and pick
        description: 'Shaping and manipulation of metals',
        category: 'elemental',
        color: '#95A5A6'
    },
    wood: {
        id: 'wood',
        label: 'Wood Magic',
        icon: '\uD83C\uDF33', // Tree/plant
        description: 'Control of plant life and growth',
        category: 'elemental',
        color: '#27AE60'
    },
    blood: {
        id: 'blood',
        label: 'Blood Magic',
        icon: '\uD83E\uDE78', // Blood drop
        description: 'Manipulation of life force through blood',
        category: 'body',
        color: '#C0392B'
    },
    bone: {
        id: 'bone',
        label: 'Bone Magic',
        icon: '\uD83E\uDDB4', // Bone
        description: 'Control of skeletal structures',
        category: 'body',
        color: '#F5F5DC'
    },
    mind: {
        id: 'mind',
        label: 'Mind Magic',
        icon: '\uD83E\uDDE0', // Brain
        description: 'Manipulation of thoughts and emotions',
        category: 'body',
        color: '#8E44AD'
    },
    morphic: {
        id: 'morphic',
        label: 'Morphic Magic',
        icon: '\uD83E\uDDF8', // Morphic field
        description: 'Control of growth, transformation, and regeneration',
        category: 'body',
        color: '#1ABC9C'
    },
    life: {
        id: 'life',
        label: 'Life Magic',
        icon: '\u2728', // Sparkles/life
        description: 'Manipulation of living essence and vitality',
        category: 'body',
        color: '#2ECC71'
    },
    death: {
        id: 'death',
        label: 'Death Magic',
        icon: '\u2620\uFE0F', // Skull
        description: 'Control of decay, death, and entropy',
        category: 'body',
        color: '#2C3E50'
    },
    space: {
        id: 'space',
        label: 'Space Magic',
        icon: '\uD83C\uDF0C', // Milky way
        description: 'Manipulation of physical space and distances',
        category: 'aether',
        color: '#3498DB'
    },
    time: {
        id: 'time',
        label: 'Time Magic',
        icon: '\u23F3', // Hourglass
        description: 'Control of time flow and temporal events',
        category: 'aether',
        color: '#F39C12'
    },
    dimension: {
        id: 'dimension',
        label: 'Dimension Magic',
        icon: '\uD83C\uDF10', // Globe with meridians
        description: 'Access to other dimensions and realms',
        category: 'aether',
        color: '#9B59B6'
    },
    void: {
        id: 'void',
        label: 'Void Magic',
        icon: '\u25CF', // Dark circle
        description: 'Absorption, erasure, and severing of connections',
        category: 'aether',
        color: '#1A1A2E'
    },
    reality: {
        id: 'reality',
        label: 'Reality Magic',
        icon: '\uD83C\uDF0D', // Earth/globe
        description: 'Manipulation of reality itself',
        category: 'aether',
        color: '#F1C40F'
    },
    transference: {
        id: 'transference',
        label: 'Transference Magic',
        icon: '\uD83D\uDD77\uFE0F', // Staff
        description: 'Absorption of power and memories through consumption',
        category: 'aether',
        color: '#E74C3C'
    }
};

// Magic categories
var MAGIC_CATEGORIES = {
    elemental: { label: 'Elemental Magic', icon: '\u26A1', color: '#8cbb3a' },
    body: { label: 'Body Magic', icon: '\uD83D\uDCAA', color: '#c1453c' },
    aether: { label: 'Aether Magic', icon: '\u2728', color: '#4a9bc7' }
};

/**
 * Get default magic proficiencies
 */
function getDefaultMagicProficiencies() {
    var proficiencies = {};
    for (var key in MAGIC_TYPES) {
        proficiencies[key] = 0;
    }
    return proficiencies;
}

/**
 * Get character magic proficiencies
 */
function getCharacterMagic(char) {
    if (!char) return getDefaultMagicProficiencies();
    if (!char.magic) {
        char.magic = getDefaultMagicProficiencies();
    }
    // Ensure all magic types exist
    var hasAll = true;
    for (var key in MAGIC_TYPES) {
        if (char.magic[key] === undefined || char.magic[key] === null) {
            hasAll = false;
            break;
        }
    }
    if (!hasAll) {
        var defaultMagic = getDefaultMagicProficiencies();
        for (var key in defaultMagic) {
            if (char.magic[key] === undefined || char.magic[key] === null) {
                char.magic[key] = defaultMagic[key];
            }
        }
    }
    return char.magic;
}

/**
 * Calculate total magical power
 */
function calculateMagicPower(char) {
    var magic = getCharacterMagic(char);
    var total = 0;
    for (var key in magic) {
        total += parseInt(magic[key]) || 0;
    }
    return total;
}

/**
 * Get magic power level display
 */
function getMagicPowerDisplay(char) {
    var power = calculateMagicPower(char);
    var maxPower = MAGIC_TYPES.length * 10; // 16 types * 10 max
    var percentage = Math.min(100, Math.round((power / maxPower) * 100));
    var level = Math.floor(percentage / 20);
    if (level > 4) level = 4;
    if (level < 0) level = 0;
    var filled = '\u25CF';
    var empty = '\u25CB';
    var display = '';
    for (var i = 0; i < 5; i++) {
        display += (i <= level) ? filled : empty;
    }
    return display;
}

/**
 * Suggest a magical class based on proficiencies
 */
function suggestMagicClass(char) {
    var magic = getCharacterMagic(char);
    if (!magic) return null;
    
    var scores = {};
    for (var key in magic) {
        scores[key] = parseInt(magic[key]) || 0;
    }
    
    // Calculate category averages
    var categoryScores = {
        elemental: 0,
        body: 0,
        aether: 0
    };
    var categoryCounts = {
        elemental: 0,
        body: 0,
        aether: 0
    };
    
    for (var key in MAGIC_TYPES) {
        var type = MAGIC_TYPES[key];
        var score = scores[key] || 0;
        if (categoryScores[type.category] !== undefined) {
            categoryScores[type.category] += score;
            categoryCounts[type.category]++;
        }
    }
    
    // Calculate averages
    var highestCategory = 'elemental';
    var highestAvg = 0;
    for (var cat in categoryScores) {
        if (categoryCounts[cat] > 0) {
            var avg = categoryScores[cat] / categoryCounts[cat];
            if (avg > highestAvg) {
                highestAvg = avg;
                highestCategory = cat;
            }
        }
    }
    
    // Find specific highest magic type
    var highestType = null;
    var highestScore = 0;
    for (var key in scores) {
        if (scores[key] > highestScore) {
            highestScore = scores[key];
            highestType = key;
        }
    }
    
    // Determine class based on category and highest type
    var classMap = {
        elemental: {
            earth: 'Geomancer',
            water: 'Hydromancer',
            fire: 'Pyromancer',
            air: 'Aeromancer',
            metal: 'Ferromancer',
            wood: 'Dendromancer'
        },
        body: {
            blood: 'Hemomancer',
            bone: 'Osteomancer',
            mind: 'Psychomancer',
            morphic: 'Morphomancer',
            life: 'Vitalmancer',
            death: 'Necromancer'
        },
        aether: {
            space: 'Spatiomancer',
            time: 'Chronomancer',
            dimension: 'Dimensionist',
            void: 'Voidmancer',
            reality: 'Reality Weaver',
            transference: 'Transference Mage'
        }
    };
    
    var className = 'Adept Mage';
    if (highestType && classMap[highestCategory] && classMap[highestCategory][highestType]) {
        className = classMap[highestCategory][highestType];
    } else if (highestCategory === 'elemental') {
        className = 'Elementalist';
    } else if (highestCategory === 'body') {
        className = 'Body Mage';
    } else if (highestCategory === 'aether') {
        className = 'Aether Mage';
    }
    
    return {
        name: className,
        category: highestCategory,
        categoryLabel: MAGIC_CATEGORIES[highestCategory]?.label || highestCategory,
        primaryType: highestType,
        primaryLabel: highestType ? MAGIC_TYPES[highestType]?.label : null,
        score: highestScore
    };
}

/**
 * Get magic proficiency level label
 */
function getMagicLevelLabel(score) {
    if (score >= 9) return 'Master';
    if (score >= 7) return 'Expert';
    if (score >= 5) return 'Adept';
    if (score >= 3) return 'Apprentice';
    if (score >= 1) return 'Novice';
    return 'Untrained';
}

/**
 * Get magic proficiency level color
 */
function getMagicLevelColor(score) {
    if (score >= 9) return 'var(--danger)';
    if (score >= 7) return 'var(--warning)';
    if (score >= 5) return 'var(--accent)';
    if (score >= 3) return 'var(--info)';
    if (score >= 1) return 'var(--text-dim)';
    return 'var(--border)';
}

// Make functions globally available
window.MAGIC_TYPES = MAGIC_TYPES;
window.MAGIC_CATEGORIES = MAGIC_CATEGORIES;
window.getDefaultMagicProficiencies = getDefaultMagicProficiencies;
window.getCharacterMagic = getCharacterMagic;
window.calculateMagicPower = calculateMagicPower;
window.getMagicPowerDisplay = getMagicPowerDisplay;
window.suggestMagicClass = suggestMagicClass;
window.getMagicLevelLabel = getMagicLevelLabel;
window.getMagicLevelColor = getMagicLevelColor;

console.log('magic.js loaded');
