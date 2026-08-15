/**
 * tournaments-core.js - Core Tournament Management
 * Complete rework with streamlined round-based system
 */

var tournamentState = {
    currentTournamentId: null,
    currentMode: 'teams',
    selectedTab: 'overview'
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
        endWeek: parseInt(tournData.endWeek) || 4,
        academicYear: tournData.academicYear || '',
        matchType: tournData.matchType || '1v1',
        rounds: parseInt(tournData.rounds) || 1,
        status: 'active',
        participants: [], // Array of { id: string, type: 'team' or 'character' }
        roundsData: [], // Array of round objects
        currentRound: 0,
        eliminations: [],
        winner: null,
        winners: [],
        createdAt: new Date().toISOString()
    };
    data.tournaments.push(newTourn);
    return newTourn;
}

/**
 * Delete a tournament
 */
function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return false;
    var tourn = getTournament(id);
    if (!tourn) return false;
    
    var index = data.tournaments.indexOf(tourn);
    if (index !== -1) {
        data.tournaments.splice(index, 1);
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        if (typeof logActivity === 'function') {
            logActivity('Deleted tournament: ' + tourn.name);
        }
        return true;
    }
    return false;
}

/**
 * Get participant name by ID
 */
function getParticipantNameById(id) {
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
 * Get match type display name
 */
function getMatchTypeDisplay(type) {
    var map = {
        '1v1': '1v1 (2 players)',
        '1v1v1': '1v1v1 (3 players)',
        '1v1v1v1': '1v1v1v1 (4 players)',
        'ffa': 'Free-for-All'
    };
    return map[type] || type || '1v1';
}

/**
 * Get participants for a match type
 */
function getMatchParticipantCount(type) {
    var map = {
        '1v1': 2,
        '1v1v1': 3,
        '1v1v1v1': 4,
        'ffa': 8
    };
    return map[type] || 2;
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
 * Get tournament winner display name
 */
function getTournamentWinnerDisplay(tourn) {
    if (!tourn || !tourn.winner) return null;
    
    if (tourn.mode === 'individuals') {
        if (tourn.winners && tourn.winners.length > 1) {
            var names = tourn.winners.map(function(w) {
                return getParticipantNameById(w);
            });
            return names.join(', ');
        }
        return getParticipantNameById(tourn.winner);
    } else {
        return getParticipantNameById(tourn.winner);
    }
}

// Make functions globally available
window.getTournament = getTournament;
window.getTournaments = getTournaments;
window.createTournament = createTournament;
window.deleteTournament = deleteTournament;
window.getParticipantNameById = getParticipantNameById;
window.getParticipantType = getParticipantType;
window.getMatchTypeDisplay = getMatchTypeDisplay;
window.getMatchParticipantCount = getMatchParticipantCount;
window.getTournamentStatusColor = getTournamentStatusColor;
window.getTournamentWinnerDisplay = getTournamentWinnerDisplay;
window.tournamentState = tournamentState;
