/**
 * tournaments-core.js - Core Tournament Management
 */

var tournamentState = {
    currentTournamentId: null,
    currentMode: 'teams'
};

/**
 * Get tournament by ID
 */
function getTournament(id) {
    if (!data.tournaments) return null;
    return data.tournaments.find(function(t) { return String(t.id) === String(id); });
}

/**
 * Get all tournaments
 */
function getTournaments() {
    return data.tournaments || [];
}

/**
 * Create a new tournament
 */
function createTournament(tournData) {
    if (!data.tournaments) data.tournaments = [];
    
    var newTourn = {
        id: generateId('tourn'),
        name: tournData.name || 'New Tournament',
        mode: tournData.mode || 'teams',
        startWeek: parseInt(tournData.startWeek) || 1,
        endWeek: parseInt(tournData.endWeek) || 52,
        totalRounds: parseInt(tournData.totalRounds) || 1,
        currentRound: 0,
        status: 'draft',
        participants: [],
        rounds: [],
        eliminations: [],
        winner: null,
        winners: [],
        createdAt: new Date().toISOString()
    };
    data.tournaments.push(newTourn);
    return newTourn;
}

/**
 * Update a tournament
 */
function updateTournament(id, updates) {
    var tourn = getTournament(id);
    if (!tourn) return null;
    Object.assign(tourn, updates);
    // Ensure rounds is always an array
    if (!tourn.rounds) tourn.rounds = [];
    if (!tourn.participants) tourn.participants = [];
    if (!tourn.eliminations) tourn.eliminations = [];
    return tourn;
}

/**
 * Delete a tournament
 */
function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return false;
    var tourn = getTournament(id);
    if (!tourn) return false;
    
    var tournName = tourn.name;
    data.tournaments = data.tournaments.filter(function(t) { return String(t.id) !== String(id); });
    
    if (typeof logActivity === 'function') {
        logActivity('Deleted tournament: ' + tournName);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return true;
}

/**
 * Get participant name by ID
 */
function getParticipantName(id) {
    if (!id) return 'Unknown';
    
    var char = data.characters.find(function(c) { return String(c.id) === String(id); });
    if (char) {
        return [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    
    var team = data.teams.find(function(t) { return String(t.id) === String(id); });
    if (team) {
        return team.name;
    }
    
    return 'Unknown';
}

/**
 * Get participant type
 */
function getParticipantType(id) {
    if (!id) return 'unknown';
    if (data.characters.some(function(c) { return String(c.id) === String(id); })) return 'character';
    if (data.teams.some(function(t) { return String(t.id) === String(id); })) return 'team';
    return 'unknown';
}

/**
 * Get tournament status color
 */
function getTournamentStatusColor(status) {
    var map = {
        'draft': 'var(--text-dim)',
        'active': 'var(--accent)',
        'completed': 'var(--info)'
    };
    return map[status] || 'var(--text-dim)';
}

/**
 * Check if a character is eliminated by a specific week
 */
function isCharacterEliminatedByWeek(char, week) {
    if (!char) return false;
    if (char.deceased) return true;
    if (char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
        var weekNum = parseInt(week) || 1;
        for (var i = 0; i < char.eliminatedWeeks.length; i++) {
            var elimWeek = parseInt(char.eliminatedWeeks[i]);
            if (!isNaN(elimWeek) && elimWeek <= weekNum) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Ensure tournament has required arrays
 */
function ensureTournamentArrays(tourn) {
    if (!tourn) return;
    if (!tourn.rounds) tourn.rounds = [];
    if (!tourn.participants) tourn.participants = [];
    if (!tourn.eliminations) tourn.eliminations = [];
    if (!tourn.winners) tourn.winners = [];
}

// ============================================================
// EXPOSE ALL FUNCTIONS GLOBALLY
// ============================================================
window.getTournament = getTournament;
window.getTournaments = getTournaments;
window.createTournament = createTournament;
window.updateTournament = updateTournament;
window.deleteTournament = deleteTournament;
window.getParticipantName = getParticipantName;
window.getParticipantType = getParticipantType;
window.getTournamentStatusColor = getTournamentStatusColor;
window.isCharacterEliminatedByWeek = isCharacterEliminatedByWeek;
window.ensureTournamentArrays = ensureTournamentArrays;
window.tournamentState = tournamentState;

console.log('tournaments-core.js loaded');
