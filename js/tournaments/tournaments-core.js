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
    if (!data || !data.tournaments) return null;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(id); });
    if (tourn) {
        ensureTournamentIntegrity(tourn);
    }
    return tourn;
}

/**
 * Get all tournaments
 */
function getTournaments() {
    if (!data) {
        console.warn('Data not initialized yet');
        return [];
    }
    if (!data.tournaments) {
        data.tournaments = [];
        return [];
    }
    // Ensure all tournaments have required fields
    data.tournaments.forEach(function(tourn) {
        ensureTournamentIntegrity(tourn);
    });
    return data.tournaments;
}

/**
 * Ensure tournament has all required fields
 */
function ensureTournamentIntegrity(tourn) {
    if (!tourn) return;
    if (!tourn.mode) tourn.mode = 'teams';
    if (!tourn.participants || !Array.isArray(tourn.participants)) tourn.participants = [];
    if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = [];
    if (!tourn.eliminations || !Array.isArray(tourn.eliminations)) tourn.eliminations = [];
    if (!tourn.winners || !Array.isArray(tourn.winners)) tourn.winners = [];
    if (!tourn.status) tourn.status = 'draft';
    if (!tourn.totalRounds) tourn.totalRounds = 1;
    if (!tourn.startWeek) tourn.startWeek = 1;
    if (!tourn.endWeek) tourn.endWeek = 52;
    if (!tourn.teams || !Array.isArray(tourn.teams)) tourn.teams = [];
    if (!tourn.matches || !Array.isArray(tourn.matches)) tourn.matches = [];
}

/**
 * Create a new tournament
 */
function createTournament(tournData) {
    if (!data) {
        console.error('Data not initialized');
        return null;
    }
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
        teams: [],
        rounds: [],
        matches: [],
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
    
    var existingParticipants = tourn.participants || [];
    var existingRounds = tourn.rounds || [];
    var existingEliminations = tourn.eliminations || [];
    var existingWinner = tourn.winner || null;
    var existingWinners = tourn.winners || [];
    var existingMode = tourn.mode || 'teams';
    
    Object.assign(tourn, updates);
    
    if (!tourn.mode) tourn.mode = existingMode;
    if (!tourn.participants || !Array.isArray(tourn.participants)) tourn.participants = existingParticipants;
    if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = existingRounds;
    if (!tourn.eliminations || !Array.isArray(tourn.eliminations)) tourn.eliminations = existingEliminations;
    if (!tourn.winner) tourn.winner = existingWinner;
    if (!tourn.winners || !Array.isArray(tourn.winners)) tourn.winners = existingWinners;
    
    return tourn;
}

/**
 * Delete a tournament
 */
function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return false;
    if (!data || !data.tournaments) return false;
    
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(id); });
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
    if (!data) return 'Unknown';
    
    var char = data.characters ? data.characters.find(function(c) { return String(c.id) === String(id); }) : null;
    if (char) {
        return [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    
    var team = data.teams ? data.teams.find(function(t) { return String(t.id) === String(id); }) : null;
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
    if (!data) return 'unknown';
    if (data.characters && data.characters.some(function(c) { return String(c.id) === String(id); })) return 'character';
    if (data.teams && data.teams.some(function(t) { return String(t.id) === String(id); })) return 'team';
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
    if (!tourn.participants || !Array.isArray(tourn.participants)) tourn.participants = [];
    if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = [];
    if (!tourn.eliminations || !Array.isArray(tourn.eliminations)) tourn.eliminations = [];
    if (!tourn.winners || !Array.isArray(tourn.winners)) tourn.winners = [];
    if (!tourn.teams || !Array.isArray(tourn.teams)) tourn.teams = [];
    if (!tourn.matches || !Array.isArray(tourn.matches)) tourn.matches = [];
    if (!tourn.mode) tourn.mode = 'teams';
}

/**
 * Mark a character as eliminated globally
 * @param {string} charId - Character ID
 * @param {Object} tournament - Tournament object (not just ID)
 * @param {string} reason - Reason for elimination
 */
function markCharacterEliminated(charId, tournament, reason) {
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char) {
        console.warn('Character not found for elimination:', charId);
        return;
    }
    
    console.log('Marking character as eliminated:', char.firstName, 'in tournament:', tournament ? tournament.name : 'unknown');
    
    var weekNum = tournament ? (parseInt(tournament.startWeek) || 1) : 1;
    var tournamentId = tournament ? tournament.id : null;
    
    // Add to eliminatedWeeks if not already present
    if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
    if (char.eliminatedWeeks.indexOf(weekNum) === -1) {
        char.eliminatedWeeks.push(weekNum);
        char.eliminatedWeeks.sort(function(a, b) { return parseInt(a) - parseInt(b); });
        console.log('Added week', weekNum, 'to eliminatedWeeks for', char.firstName);
    }
    
    // Add to eliminations array
    if (!char.eliminations) char.eliminations = [];
    var alreadyExists = char.eliminations.some(function(e) {
        return !e.standalone && String(e.tournamentId) === String(tournamentId);
    });
    if (!alreadyExists) {
        char.eliminations.push({
            tournamentId: tournamentId,
            week: weekNum,
            reason: reason || 'Eliminated from tournament',
            standalone: false,
            fromMatch: true
        });
        console.log('Added elimination record for', char.firstName);
    }
}

/**
 * Remove character elimination globally
 * @param {string} charId - Character ID
 * @param {Object} tournament - Tournament object
 */
function unmarkCharacterEliminated(charId, tournament) {
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char) {
        console.warn('Character not found for unelimination:', charId);
        return;
    }
    
    console.log('Unmarking character elimination:', char.firstName);
    
    var tournamentId = tournament ? tournament.id : null;
    var weekNum = tournament ? (parseInt(tournament.startWeek) || 1) : 1;
    
    // Remove from eliminatedWeeks
    if (char.eliminatedWeeks) {
        var idx = char.eliminatedWeeks.indexOf(weekNum);
        if (idx !== -1) {
            char.eliminatedWeeks.splice(idx, 1);
            console.log('Removed week', weekNum, 'from eliminatedWeeks for', char.firstName);
        }
    }
    
    // Remove from eliminations
    if (char.eliminations) {
        char.eliminations = char.eliminations.filter(function(e) {
            return !(String(e.tournamentId) === String(tournamentId) && !e.standalone);
        });
        console.log('Removed elimination record for', char.firstName);
    }
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
window.ensureTournamentIntegrity = ensureTournamentIntegrity;
window.markCharacterEliminated = markCharacterEliminated;
window.unmarkCharacterEliminated = unmarkCharacterEliminated;
window.tournamentState = tournamentState;

console.log('tournaments-core.js loaded');
