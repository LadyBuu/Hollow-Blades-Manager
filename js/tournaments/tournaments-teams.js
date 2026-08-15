/**
 * tournaments-teams.js - Team-based Tournament Logic
 */

/**
 * Populate team selector for adding teams
 */
function populateTeamSelector(tourn) {
    var select = document.getElementById('tournament-team-select');
    if (!select) return;
    
    var startWeek = parseInt(tourn.startWeek) || 1;
    var endWeek = parseInt(tourn.endWeek) || 4;
    
    var allTeams = data.teams.filter(function(t) {
        if (t.type !== 'academic') return false;
        if (t.status === 'deleted' || t.status === 'inactive') return false;
        var start = parseInt(t.startPeriod);
        var end = parseInt(t.endPeriod);
        if (isNaN(start)) return true;
        return start <= endWeek && (isNaN(end) || end >= startWeek);
    });
    
    var existingIds = (tourn.teams || []).map(function(t) { return t.teamId; });
    var available = allTeams.filter(function(t) {
        return !existingIds.some(function(id) { return String(id) === String(t.id); });
    });
    
    select.innerHTML = '<option value="">Select a team...</option>';
    if (available.length === 0) {
        select.innerHTML += '<option value="" disabled>No available teams</option>';
    } else {
        available.forEach(function(team) {
            var option = document.createElement('option');
            option.value = team.id;
            var rankDisplay = team.currentRank ? ' (#' + team.currentRank + ')' : '';
            option.textContent = team.name + rankDisplay;
            select.appendChild(option);
        });
    }
}

/**
 * Add team to tournament
 */
function addTeamToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var teamId = document.getElementById('tournament-team-select').value;
    if (!teamId) { alert('Please select a team.'); return; }
    
    if (!tourn.teams) tourn.teams = [];
    
    if (tourn.teams.some(function(t) { return String(t.teamId) === String(teamId); })) {
        alert('Team already added to this tournament.');
        return;
    }
    
    tourn.teams.push({ teamId: teamId });
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Added team ' + (team ? team.name : '') + ' to tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove team from tournament
 */
function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    tourn.teams = tourn.teams.filter(function(t) { return String(t.teamId) !== String(teamId); });
    
    if (tourn.matches) {
        tourn.matches = tourn.matches.filter(function(m) {
            return String(m.team1Id) !== String(teamId) && String(m.team2Id) !== String(teamId);
        });
    }
    
    if (tourn.winner && String(tourn.winner) === String(teamId)) {
        tourn.winner = null;
        tourn.status = 'active';
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Render tournament teams
 */
function renderTournamentTeams(tourn) {
    var container = document.getElementById('tournament-teams-list');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No teams added to this tournament</p>';
        return;
    }
    
    var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    tourn.teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
        var teamName = team ? team.name : 'Unknown Team';
        var isWinner = tourn.winner && String(tourn.winner) === String(entry.teamId);
        var memberCount = team && team.members ? team.members.length : 0;
        
        html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ' + (isWinner ? 'var(--accent)' : 'var(--border)') + ';">';
        html += teamName + (isWinner ? ' \u2605' : '') + ' (' + memberCount + ' members)';
        html += ' <button class="remove-team-from-tournament small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-team="' + entry.teamId + '">\u2715</button>';
        html += '</span>';
    });
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-team-from-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeTeamFromTournament(tourn.id, this.dataset.team);
        });
    });
}

/**
 * Render team matches (legacy)
 */
function renderTeamMatches(tourn) {
    var container = document.getElementById('matches-list');
    if (!tourn.matches || tourn.matches.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No matches created</p>';
        return;
    }
    
    var html = '';
    tourn.matches.forEach(function(match, index) {
        var team1 = data.teams.find(function(t) { return String(t.id) === String(match.team1Id); });
        var team2 = data.teams.find(function(t) { return String(t.id) === String(match.team2Id); });
        var t1Name = team1 ? team1.name : 'Unknown Team';
        var t2Name = team2 ? team2.name : 'Unknown Team';
        var winnerName = 'TBD';
        if (match.winner) {
            var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(match.winner); });
            winnerName = winnerTeam ? winnerTeam.name : 'Unknown';
        }
        
        var winnerClass = match.winner ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-dim);';
        var borderColor = match.winner ? 'var(--accent)' : 'var(--border)';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;flex-wrap:wrap;gap:4px;border-left:3px solid ' + borderColor + ';">';
        html += '<span style="font-size:0.8rem;"><strong>' + t1Name + '</strong> vs <strong>' + t2Name + '</strong></span>';
        html += '<span style="' + winnerClass + 'font-size:0.8rem;">Winner: ' + winnerName + '</span>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-team="' + match.team1Id + '">' + t1Name + '</button>';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-team="' + match.team2Id + '">' + t2Name + '</button>';
        html += '<button class="remove-match-btn small danger" data-index="' + index + '">\u2715</button>';
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setTeamMatchWinner(tourn.id, parseInt(this.dataset.index), this.dataset.team);
        });
    });
    container.querySelectorAll('.remove-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeTeamMatch(tourn.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Add team match
 */
function addTeamMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var team1Id = document.querySelector('#match-selectors .match-participant:first-child')?.value;
    var team2Id = document.querySelector('#match-selectors .match-participant:last-child')?.value;
    
    if (!team1Id || !team2Id) { alert('Please select both teams.'); return; }
    if (team1Id === team2Id) { alert('Teams must be different.'); return; }
    
    if (!tourn.matches) tourn.matches = [];
    
    var exists = tourn.matches.some(function(m) {
        return (String(m.team1Id) === String(team1Id) && String(m.team2Id) === String(team2Id)) ||
               (String(m.team1Id) === String(team2Id) && String(m.team2Id) === String(team1Id));
    });
    if (exists) { alert('This match already exists.'); return; }
    
    tourn.matches.push({
        team1Id: team1Id,
        team2Id: team2Id,
        winner: null
    });
    
    if (typeof logActivity === 'function') {
        logActivity('Added match to tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Set team match winner
 */
function setTeamMatchWinner(tournId, matchIndex, winnerId) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    tourn.matches[matchIndex].winner = winnerId;
    determineTournamentWinner(tourn);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove team match
 */
function removeTeamMatch(tournId, index) {
    if (!confirm('Remove this match?')) return;
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.matches) return;
    tourn.matches.splice(index, 1);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

// Make functions globally available
window.populateTeamSelector = populateTeamSelector;
window.addTeamToTournament = addTeamToTournament;
window.removeTeamFromTournament = removeTeamFromTournament;
window.renderTournamentTeams = renderTournamentTeams;
window.renderTeamMatches = renderTeamMatches;
window.addTeamMatch = addTeamMatch;
window.setTeamMatchWinner = setTeamMatchWinner;
window.removeTeamMatch = removeTeamMatch;
