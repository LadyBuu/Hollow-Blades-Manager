/**
 * tournaments-core.js - Core Tournament Management
 * Data management, CRUD operations, and shared utilities
 */

var tournamentState = {
    currentTournamentId: null,
    selectedWeek: 1,
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
        name: tournData.name,
        mode: tournData.mode || 'teams',
        startWeek: tournData.startWeek || '1',
        endWeek: tournData.endWeek || '4',
        academicYear: tournData.academicYear || '',
        status: 'active',
        teams: [],
        participants: [],
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
    Object.assign(tourn, updates);
    return tourn;
}

/**
 * Delete a tournament
 */
function deleteTournament(id) {
    if (!data.tournaments) return false;
    data.tournaments = data.tournaments.filter(function(t) { return String(t.id) !== String(id); });
    return true;
}

/**
 * Get participant name by ID (character or team)
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
 * Get participant type by ID
 */
function getParticipantType(id) {
    if (!id) return 'unknown';
    if (data.characters.some(function(c) { return String(c.id) === String(id); })) return 'character';
    if (data.teams.some(function(t) { return String(t.id) === String(id); })) return 'team';
    return 'unknown';
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
 * Determine tournament winner from completed rounds
 */
function determineTournamentWinner(tourn) {
    if (!tourn.rounds || tourn.rounds.length === 0) {
        tourn.winner = null;
        tourn.winners = [];
        return;
    }
    
    var lastRound = tourn.rounds[tourn.rounds.length - 1];
    if (lastRound.status !== 'completed') {
        tourn.winner = null;
        tourn.winners = [];
        return;
    }
    
    var winners = [];
    lastRound.matches.forEach(function(match) {
        if (match.winnerIds) {
            match.winnerIds.forEach(function(wid) {
                winners.push(wid);
            });
        }
    });
    
    tourn.winners = winners;
    
    if (winners.length === 1) {
        tourn.winner = winners[0];
        if (typeof logActivity === 'function') {
            var winnerName = getParticipantNameById(winners[0]);
            logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + winnerName);
        }
    } else if (winners.length > 1) {
        tourn.winner = winners[0];
        if (typeof logActivity === 'function') {
            var names = winners.map(function(w) { return getParticipantNameById(w); });
            logActivity('Tournament ' + tourn.name + ' completed! Winners: ' + names.join(', '));
        }
    } else {
        tourn.winner = null;
        tourn.winners = [];
    }
}

// Make functions globally available
window.getTournament = getTournament;
window.getTournaments = getTournaments;
window.createTournament = createTournament;
window.updateTournament = updateTournament;
window.deleteTournament = deleteTournament;
window.getParticipantNameById = getParticipantNameById;
window.getParticipantType = getParticipantType;
window.getTournamentWinnerDisplay = getTournamentWinnerDisplay;
window.getTournamentStatusColor = getTournamentStatusColor;
window.determineTournamentWinner = determineTournamentWinner;
window.tournamentState = tournamentState;
