/**
 * stats.js - RPG Character Stats System
 * D&D-style stats with class recommendations and power ranking
 * No emojis, only Unicode icons
 */

// Stat definitions
var STAT_DEFINITIONS = {
    'str': { label: 'Strength', icon: '\uD83D\uDCAA', abbr: 'STR' },
    'dex': { label: 'Dexterity', icon: '\uD83C\uDFAF', abbr: 'DEX' },
    'con': { label: 'Constitution', icon: '\uD83D\uDCAA', abbr: 'CON' },
    'int': { label: 'Intelligence', icon: '\uD83E\uDDE0', abbr: 'INT' },
    'wis': { label: 'Wisdom', icon: '\uD83E\uDDD8', abbr: 'WIS' },
    'cha': { label: 'Charisma', icon: '\uD83D\uDCAC', abbr: 'CHA' }
};

// Class definitions with stat requirements
var CLASS_DEFINITIONS = [
    {
        id: 'barbarian',
        label: 'Barbarian',
        icon: '\uD83D\uDE08',
        description: 'Fierce warrior who channels rage into combat',
        primaryStats: ['str', 'con'],
        secondaryStats: ['dex'],
        statWeights: { str: 0.4, con: 0.3, dex: 0.2, wis: 0.1 },
        minStats: { str: 13, con: 12 }
    },
    {
        id: 'bard',
        label: 'Bard',
        icon: '\uD83C\uDFB8',
        description: 'Versatile performer who inspires allies and confounds enemies',
        primaryStats: ['cha', 'dex'],
        secondaryStats: ['int', 'wis'],
        statWeights: { cha: 0.35, dex: 0.25, int: 0.2, wis: 0.15, con: 0.05 },
        minStats: { cha: 13, dex: 12 }
    },
    {
        id: 'cleric',
        label: 'Cleric',
        icon: '\u2728',
        description: 'Divine spellcaster who heals and smites',
        primaryStats: ['wis', 'con'],
        secondaryStats: ['str', 'cha'],
        statWeights: { wis: 0.35, con: 0.25, str: 0.2, cha: 0.15, dex: 0.05 },
        minStats: { wis: 13, con: 12 }
    },
    {
        id: 'druid',
        label: 'Druid',
        icon: '\uD83C\uDF31',
        description: 'Nature\'s guardian who wields primal magic',
        primaryStats: ['wis', 'con'],
        secondaryStats: ['int', 'dex'],
        statWeights: { wis: 0.35, con: 0.25, int: 0.2, dex: 0.15, str: 0.05 },
        minStats: { wis: 13, con: 12 }
    },
    {
        id: 'fighter',
        label: 'Fighter',
        icon: '\uD83D\uDDE1\uFE0F',
        description: 'Master of combat with unparalleled martial prowess',
        primaryStats: ['str', 'con'],
        secondaryStats: ['dex'],
        statWeights: { str: 0.35, con: 0.3, dex: 0.25, wis: 0.1 },
        minStats: { str: 13, con: 12 }
    },
    {
        id: 'monk',
        label: 'Monk',
        icon: '\uD83E\uDDD8',
        description: 'Martial artist who harnesses inner energy',
        primaryStats: ['dex', 'wis'],
        secondaryStats: ['con', 'str'],
        statWeights: { dex: 0.35, wis: 0.3, con: 0.2, str: 0.15 },
        minStats: { dex: 13, wis: 13 }
    },
    {
        id: 'paladin',
        label: 'Paladin',
        icon: '\uD83D\uDEE1\uFE0F',
        description: 'Holy warrior who smites evil and protects allies',
        primaryStats: ['str', 'cha'],
        secondaryStats: ['con', 'wis'],
        statWeights: { str: 0.3, cha: 0.3, con: 0.2, wis: 0.15, dex: 0.05 },
        minStats: { str: 13, cha: 13 }
    },
    {
        id: 'ranger',
        label: 'Ranger',
        icon: '\uD83C\uDFF7\uFE0F',
        description: 'Skilled hunter who tracks and eliminates threats',
        primaryStats: ['dex', 'wis'],
        secondaryStats: ['con', 'str'],
        statWeights: { dex: 0.35, wis: 0.25, con: 0.2, str: 0.15, int: 0.05 },
        minStats: { dex: 13, wis: 12 }
    },
    {
        id: 'rogue',
        label: 'Rogue',
        icon: '\uD83D\uDD77\uFE0F',
        description: 'Stealthy operative who strikes from the shadows',
        primaryStats: ['dex', 'int'],
        secondaryStats: ['cha', 'wis'],
        statWeights: { dex: 0.35, int: 0.25, cha: 0.2, wis: 0.15, str: 0.05 },
        minStats: { dex: 13, int: 12 }
    },
    {
        id: 'sorcerer',
        label: 'Sorcerer',
        icon: '\uD83D\uDD25',
        description: 'Innate spellcaster whose magic flows from bloodline',
        primaryStats: ['cha', 'con'],
        secondaryStats: ['dex', 'int'],
        statWeights: { cha: 0.4, con: 0.2, dex: 0.2, int: 0.15, wis: 0.05 },
        minStats: { cha: 13, con: 12 }
    },
    {
        id: 'warlock',
        label: 'Warlock',
        icon: '\uD83D\uDD6F\uFE0F',
        description: 'Pact-bound caster who channels otherworldly power',
        primaryStats: ['cha', 'con'],
        secondaryStats: ['dex', 'int'],
        statWeights: { cha: 0.35, con: 0.25, dex: 0.2, int: 0.15, wis: 0.05 },
        minStats: { cha: 13, con: 12 }
    },
    {
        id: 'wizard',
        label: 'Wizard',
        icon: '\uD83E\uDDE0',
        description: 'Arcane scholar who masters magic through study',
        primaryStats: ['int', 'con'],
        secondaryStats: ['dex', 'wis'],
        statWeights: { int: 0.4, con: 0.2, dex: 0.2, wis: 0.15, cha: 0.05 },
        minStats: { int: 13, con: 12 }
    },
    {
        id: 'artificer',
        label: 'Artificer',
        icon: '\uD83D\uDD27',
        description: 'Magical inventor who creates powerful artifacts',
        primaryStats: ['int', 'con'],
        secondaryStats: ['dex', 'wis'],
        statWeights: { int: 0.35, con: 0.25, dex: 0.2, wis: 0.15, cha: 0.05 },
        minStats: { int: 13, con: 12 }
    },
    {
        id: 'blood_hunter',
        label: 'Blood Hunter',
        icon: '\uD83D\uDD2A',
        description: 'Hunter who uses blood magic to track and destroy enemies',
        primaryStats: ['dex', 'wis'],
        secondaryStats: ['con', 'str'],
        statWeights: { dex: 0.3, wis: 0.3, con: 0.2, str: 0.15, int: 0.05 },
        minStats: { dex: 13, wis: 13 }
    },
    {
        id: 'gunslinger',
        label: 'Gunslinger',
        icon: '\uD83D\uDD2B',
        description: 'Precise marksman who uses firearms with deadly accuracy',
        primaryStats: ['dex', 'wis'],
        secondaryStats: ['con', 'int'],
        statWeights: { dex: 0.35, wis: 0.25, con: 0.2, int: 0.15, str: 0.05 },
        minStats: { dex: 13, wis: 12 }
    },
    {
        id: 'inquisitive',
        label: 'Inquisitive',
        icon: '\uD83D\uDD0D',
        description: 'Investigator who uncovers secrets and exposes lies',
        primaryStats: ['int', 'wis'],
        secondaryStats: ['dex', 'cha'],
        statWeights: { int: 0.3, wis: 0.3, dex: 0.2, cha: 0.15, con: 0.05 },
        minStats: { int: 13, wis: 13 }
    },
    {
        id: 'mystic',
        label: 'Mystic',
        icon: '\uD83E\uDDF8',
        description: 'Psionic who wields the power of the mind',
        primaryStats: ['int', 'wis'],
        secondaryStats: ['con', 'cha'],
        statWeights: { int: 0.3, wis: 0.3, con: 0.2, cha: 0.15, dex: 0.05 },
        minStats: { int: 13, wis: 13 }
    },
    {
        id: 'samurai',
        label: 'Samurai',
        icon: '\uD83D\uDDE1\uFE0F',
        description: 'Honorable warrior who embodies bushido',
        primaryStats: ['str', 'wis'],
        secondaryStats: ['dex', 'con'],
        statWeights: { str: 0.3, wis: 0.25, dex: 0.2, con: 0.2, cha: 0.05 },
        minStats: { str: 13, wis: 12 }
    },
    {
        id: 'shadow_weaver',
        label: 'Shadow Weaver',
        icon: '\uD83C\uDF03',
        description: 'Mage who weaves shadows to control the battlefield',
        primaryStats: ['int', 'dex'],
        secondaryStats: ['cha', 'con'],
        statWeights: { int: 0.3, dex: 0.25, cha: 0.2, con: 0.15, wis: 0.1 },
        minStats: { int: 13, dex: 13 }
    },
    {
        id: 'warden',
        label: 'Warden',
        icon: '\uD83C\uDF33',
        description: 'Protector of the wild who combines martial and primal power',
        primaryStats: ['str', 'wis'],
        secondaryStats: ['con', 'dex'],
        statWeights: { str: 0.3, wis: 0.25, con: 0.2, dex: 0.2, cha: 0.05 },
        minStats: { str: 13, wis: 12 }
    },
    {
        id: 'witch_hunter',
        label: 'Witch Hunter',
        icon: '\uD83D\uDD6F\uFE0F',
        description: 'Hunter who specializes in tracking and eliminating magic-users',
        primaryStats: ['dex', 'wis'],
        secondaryStats: ['con', 'int'],
        statWeights: { dex: 0.3, wis: 0.25, con: 0.2, int: 0.15, str: 0.1 },
        minStats: { dex: 13, wis: 12 }
    }
];

/**
 * Get default stats for a character
 */
function getDefaultStats() {
    return {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    };
}

/**
 * Get stats for a character
 */
function getCharacterStats(char) {
    if (!char) return getDefaultStats();
    if (!char.stats) {
        char.stats = getDefaultStats();
    }
    // Ensure all stats exist
    var statKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var hasAll = true;
    for (var i = 0; i < statKeys.length; i++) {
        if (char.stats[statKeys[i]] === undefined || char.stats[statKeys[i]] === null) {
            hasAll = false;
            break;
        }
    }
    if (!hasAll) {
        var defaultStats = getDefaultStats();
        for (var key in defaultStats) {
            if (char.stats[key] === undefined || char.stats[key] === null) {
                char.stats[key] = defaultStats[key];
            }
        }
    }
    return char.stats;
}

/**
 * Calculate ability modifier for a stat
 */
function getAbilityModifier(score) {
    return Math.floor((parseInt(score) - 10) / 2);
}

/**
 * Get stat modifier display
 */
function getModifierDisplay(score) {
    var mod = getAbilityModifier(score);
    return (mod >= 0 ? '+' : '') + mod;
}

/**
 * Suggest a class based on character stats
 */
function suggestClass(stats) {
    if (!stats) return null;
    
    var scores = {
        str: parseInt(stats.str) || 10,
        dex: parseInt(stats.dex) || 10,
        con: parseInt(stats.con) || 10,
        int: parseInt(stats.int) || 10,
        wis: parseInt(stats.wis) || 10,
        cha: parseInt(stats.cha) || 10
    };
    
    var bestClass = null;
    var bestScore = -Infinity;
    
    CLASS_DEFINITIONS.forEach(function(cls) {
        // Check minimum requirements
        var meetsMin = true;
        for (var stat in cls.minStats) {
            if ((scores[stat] || 0) < cls.minStats[stat]) {
                meetsMin = false;
                break;
            }
        }
        
        if (!meetsMin) return;
        
        // Calculate weighted score
        var total = 0;
        var totalWeight = 0;
        for (var stat in cls.statWeights) {
            var weight = cls.statWeights[stat] || 0;
            var score = scores[stat] || 10;
            total += (score - 10) * weight;
            totalWeight += weight;
        }
        
        // Normalize
        var normalized = totalWeight > 0 ? total / totalWeight : 0;
        
        // Bonus for having high stats in all primary stats
        var primaryBonus = 0;
        cls.primaryStats.forEach(function(stat) {
            primaryBonus += (scores[stat] - 10) * 0.1;
        });
        
        var finalScore = normalized + primaryBonus;
        
        if (finalScore > bestScore) {
            bestScore = finalScore;
            bestClass = cls;
        }
    });
    
    // If no class meets minimum requirements, find the closest
    if (!bestClass) {
        var fallbackScore = -Infinity;
        CLASS_DEFINITIONS.forEach(function(cls) {
            var total = 0;
            var totalWeight = 0;
            for (var stat in cls.statWeights) {
                var weight = cls.statWeights[stat] || 0;
                var score = scores[stat] || 10;
                total += (score - 10) * weight;
                totalWeight += weight;
            }
            var normalized = totalWeight > 0 ? total / totalWeight : 0;
            if (normalized > fallbackScore) {
                fallbackScore = normalized;
                bestClass = cls;
            }
        });
    }
    
    return bestClass;
}

/**
 * Calculate power level for a character
 */
function calculatePowerLevel(char) {
    if (!char) return 0;
    
    var stats = getCharacterStats(char);
    var scores = {
        str: parseInt(stats.str) || 10,
        dex: parseInt(stats.dex) || 10,
        con: parseInt(stats.con) || 10,
        int: parseInt(stats.int) || 10,
        wis: parseInt(stats.wis) || 10,
        cha: parseInt(stats.cha) || 10
    };
    
    // Sum of all stats gives base power
    var total = 0;
    for (var key in scores) {
        total += scores[key];
    }
    
    // Class bonus if assigned
    var classBonus = 0;
    if (char.classId) {
        var cls = CLASS_DEFINITIONS.find(function(c) { return c.id === char.classId; });
        if (cls) {
            // Bonus based on how well stats match the class
            var matchScore = 0;
            for (var stat in cls.statWeights) {
                var weight = cls.statWeights[stat] || 0;
                var score = scores[stat] || 10;
                matchScore += (score - 10) * weight;
            }
            classBonus = matchScore * 0.5;
        }
    }
    
    return total + classBonus;
}

/**
 * Get power level display (stars/circles)
 */
function getPowerLevelDisplay(char) {
    var power = calculatePowerLevel(char);
    var maxPower = 180; // 6 stats * 30 max
    var percentage = Math.min(100, Math.round((power / maxPower) * 100));
    
    // 5 levels: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
    var level = Math.floor(percentage / 20);
    if (level > 4) level = 4;
    if (level < 0) level = 0;
    
    var filled = '\u25CF'; // Circle
    var empty = '\u25CB'; // Empty circle
    
    var display = '';
    for (var i = 0; i < 5; i++) {
        display += (i <= level) ? filled : empty;
    }
    
    return {
        level: level + 1,
        display: display,
        percentage: percentage,
        power: Math.round(power)
    };
}

/**
 * Get power level color
 */
function getPowerLevelColor(level) {
    var colors = [
        'var(--text-dim)',
        'var(--warning)',
        'var(--accent)',
        'var(--info)',
        'var(--danger)'
    ];
    return colors[level - 1] || 'var(--text-dim)';
}

/**
 * Render character stats in the form
 */
function renderCharacterStats(char) {
    var stats = getCharacterStats(char);
    var strInput = document.getElementById('char-str');
    var dexInput = document.getElementById('char-dex');
    var conInput = document.getElementById('char-con');
    var intInput = document.getElementById('char-int');
    var wisInput = document.getElementById('char-wis');
    var chaInput = document.getElementById('char-cha');
    
    if (strInput) strInput.value = stats.str || 10;
    if (dexInput) dexInput.value = stats.dex || 10;
    if (conInput) conInput.value = stats.con || 10;
    if (intInput) intInput.value = stats.int || 10;
    if (wisInput) wisInput.value = stats.wis || 10;
    if (chaInput) chaInput.value = stats.cha || 10;
    
    // Update class suggestion
    updateClassSuggestion();
}

/**
 * Update class suggestion based on current stats
 */
function updateClassSuggestion() {
    var str = parseInt(document.getElementById('char-str')?.value) || 10;
    var dex = parseInt(document.getElementById('char-dex')?.value) || 10;
    var con = parseInt(document.getElementById('char-con')?.value) || 10;
    var int = parseInt(document.getElementById('char-int')?.value) || 10;
    var wis = parseInt(document.getElementById('char-wis')?.value) || 10;
    var cha = parseInt(document.getElementById('char-cha')?.value) || 10;
    
    var stats = { str: str, dex: dex, con: con, int: int, wis: wis, cha: cha };
    var suggested = suggestClass(stats);
    var display = document.getElementById('suggested-class');
    
    if (display) {
        if (suggested) {
            display.textContent = suggested.icon + ' ' + suggested.label;
            display.style.color = 'var(--accent)';
            display.style.background = 'var(--accent-soft)';
            display.style.borderColor = 'var(--accent)';
        } else {
            display.textContent = '\u2014';
            display.style.color = 'var(--text-dim)';
            display.style.background = 'transparent';
            display.style.borderColor = 'var(--border)';
        }
    }
}

/**
 * Get stats from form
 */
function getStatsFromForm() {
    return {
        str: parseInt(document.getElementById('char-str')?.value) || 10,
        dex: parseInt(document.getElementById('char-dex')?.value) || 10,
        con: parseInt(document.getElementById('char-con')?.value) || 10,
        int: parseInt(document.getElementById('char-int')?.value) || 10,
        wis: parseInt(document.getElementById('char-wis')?.value) || 10,
        cha: parseInt(document.getElementById('char-cha')?.value) || 10
    };
}

/**
 * Initialize stats events
 */
function initStatsEvents() {
    var statInputs = ['char-str', 'char-dex', 'char-con', 'char-int', 'char-wis', 'char-cha'];
    statInputs.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                // Ensure value is within bounds
                var val = parseInt(this.value);
                if (isNaN(val)) val = 10;
                if (val < 1) val = 1;
                if (val > 30) val = 30;
                this.value = val;
                updateClassSuggestion();
            });
            el.addEventListener('change', function() {
                var val = parseInt(this.value);
                if (isNaN(val)) val = 10;
                if (val < 1) val = 1;
                if (val > 30) val = 30;
                this.value = val;
                updateClassSuggestion();
            });
        }
    });
    
    var recalcBtn = document.getElementById('recalculate-class-btn');
    if (recalcBtn) {
        recalcBtn.addEventListener('click', updateClassSuggestion);
    }
}

// Make functions globally available
window.STAT_DEFINITIONS = STAT_DEFINITIONS;
window.CLASS_DEFINITIONS = CLASS_DEFINITIONS;
window.getDefaultStats = getDefaultStats;
window.getCharacterStats = getCharacterStats;
window.getAbilityModifier = getAbilityModifier;
window.getModifierDisplay = getModifierDisplay;
window.suggestClass = suggestClass;
window.calculatePowerLevel = calculatePowerLevel;
window.getPowerLevelDisplay = getPowerLevelDisplay;
window.getPowerLevelColor = getPowerLevelColor;
window.renderCharacterStats = renderCharacterStats;
window.updateClassSuggestion = updateClassSuggestion;
window.getStatsFromForm = getStatsFromForm;
window.initStatsEvents = initStatsEvents;

console.log('stats.js loaded');
