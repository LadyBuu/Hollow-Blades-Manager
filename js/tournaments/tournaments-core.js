/**
 * tournaments-core.js - Core Tournament Management
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
        roundSetup: tournData.roundSetup || 'auto',
        status: 'active',
        participants: [], // Array of { id: string, type: 'team' or 'character' }
        roundsData: [],
        currentRound: 0,
        eliminations: [], // Array of { participantId, round, type }
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
    if (!id) {
        alert('Tournament ID not found.');
        return false;
    }
    
    var tourn = getTournament(id);
    if (!tourn) {
        alert('Tournament not found.');
        return false;
    }
    
    if (!confirm('Delete "' + tourn.name + '" permanently?')) {
        return false;
    }
    
    var index = data.tournaments.findIndex(function(t) { return String(t.id) === String(id); });
    if (index !== -1) {
        data.tournaments.splice(index, 1);
        
        if (typeof logActivity === 'function') {
            logActivity('Deleted tournament: ' + tourn.name);
        }
        
        saveData().then(function() {
            renderTournamentsList();
            closeTournamentDetail();
            if (typeof renderAll === 'function') {
                renderAll();
            }
        }).catch(function(err) {
            console.error('Failed to save after deletion:', err);
        });
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
        '1v1': '1v1 (2)',
        '1v1v1': '1v1v1 (3)',
        '1v1v1v1': '1v1v1v1 (4)',
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

/**
 * Get characters in a team
 */
function getTeamCharacters(teamId) {
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team || !team.members) return [];
    
    var characters = [];
    team.members.forEach(function(member) {
        var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
        if (char && !char.deceased) {
            characters.push(char);
        }
    });
    return characters;
}

/**
 * Get all characters from all participating teams in a tournament
 */
function getTournamentCharacters(tourn) {
    if (!tourn || tourn.mode !== 'teams') return [];
    if (!tourn.participants) return [];
    
    var allChars = [];
    var seenIds = {};
    
    tourn.participants.forEach(function(p) {
        if (p.type === 'team') {
            var teamChars = getTeamCharacters(p.id);
            teamChars.forEach(function(c) {
                if (!seenIds[c.id]) {
                    seenIds[c.id] = true;
                    allChars.push(c);
                }
            });
        }
    });
    
    return allChars;
}

/**
 * Get tournament participants with their names
 */
function getTournamentParticipants(tourn) {
    if (!tourn || !tourn.participants) return [];
    
    var result = [];
    tourn.participants.forEach(function(p) {
        result.push({
            id: p.id,
            name: getParticipantNameById(p.id),
            type: p.type
        });
    });
    return result;
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
window.getTeamCharacters = getTeamCharacters;
window.getTournamentCharacters = getTournamentCharacters;
window.getTournamentParticipants = getTournamentParticipants;
window.tournamentState = tournamentState;
