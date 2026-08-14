/**
 * tournaments.js - Tournament Management
 * Handles tournament creation, team selection, match management, and eliminations
 * Features: Select multiple teams, choose winner, eliminate individual members
 */

var tournamentState = {
    currentTournamentId: null,
    selectedWeek: 1
};

/**
 * Render the tournaments view
 */
function renderTournamentsView(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Tournaments</h2>
            <button id="add-tournament-btn" class="primary">+ New Tournament</button>
        </div>

        <div id="tournament-list">
            <div class="list-header tourn-header">
                <span>Name</span>
                <span>Weeks</span>
                <span>Teams</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            <div id="tournaments-container">
                <p class="empty-state">No tournaments created yet.</p>
            </div>
        </div>

        <!-- Tournament Form Modal -->
        <div id="tournament-form-modal" class="modal hidden">
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3 id="tournament-form-title">New Tournament</h3>
                    <button class="close-modal" id="close-tournament-form">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="tournament-form-inner">
                        <div class="form-group">
                            <label>Tournament Name *</label>
                            <input type="text" id="tournament-name" required>
                        </div>
                        <div class="form-group">
                            <label>Start Week</label>
                            <input type="number" id="tournament-start-week" min="1" max="52" value="1">
                        </div>
                        <div class="form-group">
                            <label>End Week</label>
                            <input type="number" id="tournament-end-week" min="1" max="52" value="4">
                        </div>
                        <div class="form-group">
                            <label>Academic Year</label>
                            <input type="text" id="tournament-year" placeholder="e.g., 1920-1921">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-tournament-form" class="secondary">Cancel</button>
                            <button type="submit" id="save-tournament-btn" class="primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Tournament Detail Modal -->
        <div id="tournament-detail-modal" class="modal hidden">
            <div class="modal-content wide">
                <div class="modal-header">
                    <h3 id="detail-tournament-name">Tournament</h3>
                    <button class="close-modal" id="close-tournament-detail">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="tournament-info" style="margin-bottom:12px;"></div>
                    
                    <!-- Team Selection -->
                    <div id="team-selection-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Select Teams</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="tournament-team-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select a team...</option>
                            </select>
                            <button id="add-team-to-tournament" class="primary small">Add Team</button>
                            <button id="refresh-teams-btn" class="secondary small">⟳ Refresh</button>
                        </div>
                        <div style="margin-top:4px;font-size:0.7rem;color:var(--text-dim);">
                            Only academic teams active in the tournament's week range are shown.
                        </div>
                        <div id="tournament-teams-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- Matches Section -->
                    <div id="matches-section" style="margin-bottom:16px;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Matches</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <select id="match-team1" style="flex:1;min-width:100px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Team 1</option>
                            </select>
                            <span style="color:var(--text-dim);">vs</span>
                            <select id="match-team2" style="flex:1;min-width:100px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Team 2</option>
                            </select>
                            <button id="add-match-btn" class="primary small">Add Match</button>
                        </div>
                        <div id="matches-list">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No matches created</p>
                        </div>
                    </div>

                    <!-- Eliminations Section -->
                    <div id="elimination-section" style="margin-bottom:16px;">
                        <h4 style="color:var(--danger);font-size:0.9rem;margin-bottom:8px;">Eliminations</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <label style="font-size:0.7rem;color:var(--text-dim);">Week:</label>
                            <input type="number" id="elim-week" min="1" max="52" value="1" style="width:60px;padding:4px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;">
                            <select id="elim-character-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select character...</option>
                            </select>
                            <button id="add-elimination-btn" class="danger small">Eliminate</button>
                            <button id="remove-elimination-btn" class="secondary small">Remove Selected</button>
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px;">
                            Eliminated characters cannot be added to new teams from this week onward.
                        </div>
                        <div id="elimination-list">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No eliminations recorded</p>
                        </div>
                    </div>

                    <!-- Winner Section -->
                    <div id="winner-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--accent);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Tournament Winner</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="winner-team-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select winner...</option>
                            </select>
                            <button id="set-winner-btn" class="primary small">Set Winner</button>
                            <button id="clear-winner-btn" class="secondary small">Clear</button>
                        </div>
                        <div id="winner-display" style="margin-top:6px;font-weight:600;color:var(--accent);"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderTournaments();
    initTournamentEvents();
}

/**
 * Render tournament list
 */
function renderTournaments() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    
    if (!data.tournaments || data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }
    
    var html = '';
    data.tournaments.forEach(function(tourn) {
        var teamCount = tourn.teams ? tourn.teams.length : 0;
        var statusColor = tourn.status === 'active' ? 'var(--accent)' : (tourn.status === 'completed' ? 'var(--info)' : 'var(--text-dim)');
        var weekDisplay = 'Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?');
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong></span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
            '<span>' + teamCount + '</span>' +
            '<span style="color:' + statusColor + ';font-size:0.75rem;">' + (tourn.status || 'draft') + '</span>' +
            '<span class="actions">' +
                '<button class="small view-tournament" data-id="' + tourn.id + '">View</button>' +
                '<button class="small edit-tournament" data-id="' + tourn.id + '">Edit</button>' +
                '<button class="small danger delete-tournament" data-id="' + tourn.id + '">Delete</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.view-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { viewTournament(btn.dataset.id); });
    });
    container.querySelectorAll('.edit-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { showTournamentForm(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTournament(btn.dataset.id); });
    });
}

/**
 * Show tournament form for add or edit
 */
function showTournamentForm(editId) {
    var modal = document.getElementById('tournament-form-modal');
    var title = document.getElementById('tournament-form-title');
    var form = document.getElementById('tournament-form-inner');
    
    modal.classList.remove('hidden');
    
    if (editId) {
        title.textContent = 'Edit Tournament';
        var tourn = data.tournaments.find(function(t) { return String(t.id) === String(editId); });
        if (tourn) {
            document.getElementById('tournament-name').value = tourn.name || '';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '1';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '4';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'New Tournament';
        form.reset();
        document.getElementById('tournament-start-week').value = '1';
        document.getElementById('tournament-end-week').value = '4';
        delete form.dataset.editId;
    }
}

/**
 * Save tournament from form
 */
function saveTournament(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    var tournData = {
        name: document.getElementById('tournament-name').value.trim(),
        startWeek: document.getElementById('tournament-start-week').value || '1',
        endWeek: document.getElementById('tournament-end-week').value || '4',
        academicYear: document.getElementById('tournament-year').value.trim(),
        status: 'active'
    };
    
    if (!tournData.name) { alert('Tournament name is required.'); return; }
    if (parseInt(tournData.startWeek) > parseInt(tournData.endWeek)) {
        alert('Start week must be before end week.');
        return;
    }
    
    if (editId) {
        var index = data.tournaments.findIndex(function(t) { return String(t.id) === String(editId); });
        if (index !== -1) {
            // Preserve teams, matches, eliminations
            var existing = data.tournaments[index];
            data.tournaments[index] = Object.assign({}, existing, tournData);
            if (typeof logActivity === 'function') {
                logActivity('Updated tournament: ' + tournData.name);
            }
        }
    } else {
        var newTourn = {
            id: generateId('tourn'),
            name: tournData.name,
            startWeek: tournData.startWeek,
            endWeek: tournData.endWeek,
            academicYear: tournData.academicYear,
            status: 'active',
            teams: [],
            matches: [],
            eliminations: [],
            winner: null,
            createdAt: new Date().toISOString()
        };
        data.tournaments.push(newTourn);
        if (typeof logActivity === 'function') {
            logActivity('Created tournament: ' + tournData.name);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    closeTournamentForm();
    renderTournaments();
}

/**
 * Delete tournament
 */
function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(id); });
    if (!tourn) return;
    data.tournaments = data.tournaments.filter(function(t) { return String(t.id) !== String(id); });
    if (typeof logActivity === 'function') {
        logActivity('Deleted tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTournaments();
    closeTournamentDetail();
}

/**
 * Close tournament form
 */
function closeTournamentForm() {
    document.getElementById('tournament-form-modal').classList.add('hidden');
}

/**
 * Close tournament detail
 */
function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
    tournamentState.currentTournamentId = null;
}

/**
 * View tournament details
 */
function viewTournament(id) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(id); });
    if (!tourn) return;
    
    tournamentState.currentTournamentId = id;
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    // Info
    var info = document.getElementById('tournament-info');
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + 
        (tourn.academicYear ? ' | ' + tourn.academicYear : '') + 
        ' | Status: ' + (tourn.status || 'active') + '</span>';
    
    // Populate selectors
    populateTeamSelector(tourn);
    populateMatchSelectors(tourn);
    populateEliminationSelector(tourn);
    populateWinnerSelector(tourn);
    
    // Render sections
    renderTournamentTeams(tourn);
    renderMatches(tourn);
    renderEliminations(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

/**
 * Populate team selector for adding teams
 */
function populateTeamSelector(tourn) {
    var select = document.getElementById('tournament-team-select');
    if (!select) return;
    
    var startWeek = parseInt(tourn.startWeek) || 1;
    var endWeek = parseInt(tourn.endWeek) || 4;
    
    // Get academic teams active in this range
    var allTeams = data.teams.filter(function(t) {
        if (t.type !== 'academic') return false;
        if (t.status === 'deleted' || t.status === 'inactive') return false;
        var start = parseInt(t.startPeriod);
        var end = parseInt(t.endPeriod);
        if (isNaN(start)) return true;
        return start <= endWeek && (isNaN(end) || end >= startWeek);
    });
    
    // Filter out teams already in tournament
    var existingIds = (tourn.teams || []).map(function(t) { return t.teamId; });
    var available = allTeams.filter(function(t) {
        return !existingIds.some(function(id) { return String(id) === String(t.id); });
    });
    
    select.innerHTML = '<option value="">Select a team...</option>';
    available.forEach(function(team) {
        var option = document.createElement('option');
        option.value = team.id;
        var rankDisplay = team.currentRank ? ' (#' + team.currentRank + ')' : '';
        option.textContent = team.name + rankDisplay;
        select.appendChild(option);
    });
    
    if (available.length === 0) {
        select.innerHTML += '<option value="" disabled>No available teams</option>';
    }
}

/**
 * Populate match selectors
 */
function populateMatchSelectors(tourn) {
    var select1 = document.getElementById('match-team1');
    var select2 = document.getElementById('match-team2');
    
    var teams = tourn.teams || [];
    var teamOptions = '<option value="">Select...</option>';
    teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
        if (team) {
            teamOptions += '<option value="' + team.id + '">' + team.name + '</option>';
        }
    });
    
    select1.innerHTML = teamOptions;
    select2.innerHTML = teamOptions;
}

/**
 * Populate elimination selector with characters from teams
 */
function populateEliminationSelector(tourn) {
    var select = document.getElementById('elim-character-select');
    if (!select) return;
    
    var teams = tourn.teams || [];
    var alreadyEliminated = (tourn.eliminations || []).map(function(e) { return e.characterId; });
    
    var chars = [];
    teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
        if (team && team.members) {
            team.members.forEach(function(member) {
                var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                if (char && !alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) {
                    chars.push({
                        id: char.id,
                        name: [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' '),
                        teamName: team.name
                    });
                }
            });
        }
    });
    
    select.innerHTML = '<option value="">Select character...</option>';
    chars.forEach(function(char) {
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name + ' (' + char.teamName + ')';
        select.appendChild(option);
    });
    
    if (chars.length === 0) {
        select.innerHTML += '<option value="" disabled>No characters available</option>';
    }
}

/**
 * Populate winner selector
 */
function populateWinnerSelector(tourn) {
    var select = document.getElementById('winner-team-select');
    if (!select) return;
    
    var teams = tourn.teams || [];
    select.innerHTML = '<option value="">Select winner...</option>';
    teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
        if (team) {
            var option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (tourn.winner && String(tourn.winner) === String(team.id)) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    });
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
        if (team) {
            var isWinner = tourn.winner && String(tourn.winner) === String(team.id);
            var memberCount = team.members ? team.members.length : 0;
            html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ' + (isWinner ? 'var(--accent)' : 'var(--border)') + ';">';
            html += team.name + (isWinner ? ' ★' : '') + ' (' + memberCount + ' members)';
            html += ' <button class="remove-team-from-tournament small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-team="' + team.id + '">✕</button>';
            html += '</span>';
        }
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
 * Add team to tournament
 */
function addTeamToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
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
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    tourn.teams = tourn.teams.filter(function(t) { return String(t.teamId) !== String(teamId); });
    
    // Also remove any matches involving this team
    if (tourn.matches) {
        tourn.matches = tourn.matches.filter(function(m) {
            return String(m.team1Id) !== String(teamId) && String(m.team2Id) !== String(teamId);
        });
    }
    
    // If this team was the winner, clear it
    if (tourn.winner && String(tourn.winner) === String(teamId)) {
        tourn.winner = null;
    }
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Removed team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Render matches
 */
function renderMatches(tourn) {
    var container = document.getElementById('matches-list');
    if (!tourn.matches || tourn.matches.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No matches created</p>';
        return;
    }
    
    var html = '';
    tourn.matches.forEach(function(match, index) {
        var team1 = data.teams.find(function(t) { return String(t.id) === String(match.team1Id); });
        var team2 = data.teams.find(function(t) { return String(t.id) === String(match.team2Id); });
        var t1Name = team1 ? team1.name : 'Unknown';
        var t2Name = team2 ? team2.name : 'Unknown';
        var winnerName = match.winner ? (data.teams.find(function(t) { return String(t.id) === String(match.winner); }) ? data.teams.find(function(t) { return String(t.id) === String(match.winner); }).name : 'Unknown') : 'TBD';
        
        var winnerClass = match.winner ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-dim);';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;flex-wrap:wrap;gap:4px;border-left:3px solid ' + (match.winner ? 'var(--accent)' : 'var(--border)') + ';">';
        html += '<span style="font-size:0.8rem;"><strong>' + t1Name + '</strong> vs <strong>' + t2Name + '</strong></span>';
        html += '<span style="' + winnerClass + 'font-size:0.8rem;">Winner: ' + winnerName + '</span>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-team="' + match.team1Id + '">' + t1Name + '</button>';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-team="' + match.team2Id + '">' + t2Name + '</button>';
        html += '<button class="remove-match-btn small danger" data-index="' + index + '">✕</button>';
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setMatchWinner(tourn.id, parseInt(this.dataset.index), this.dataset.team);
        });
    });
    container.querySelectorAll('.remove-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeMatch(tourn.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Add match
 */
function addMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var team1Id = document.getElementById('match-team1').value;
    var team2Id = document.getElementById('match-team2').value;
    
    if (!team1Id || !team2Id) { alert('Please select both teams.'); return; }
    if (team1Id === team2Id) { alert('Teams must be different.'); return; }
    
    if (!tourn.matches) tourn.matches = [];
    
    // Check if match already exists
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
        var team1 = data.teams.find(function(t) { return String(t.id) === String(team1Id); });
        var team2 = data.teams.find(function(t) { return String(t.id) === String(team2Id); });
        logActivity('Added match: ' + (team1 ? team1.name : '') + ' vs ' + (team2 ? team2.name : '') + ' to tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove match
 */
function removeMatch(tournId, index) {
    if (!confirm('Remove this match?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.matches) return;
    tourn.matches.splice(index, 1);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Set match winner
 */
function setMatchWinner(tournId, matchIndex, teamId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    tourn.matches[matchIndex].winner = teamId;
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Set winner for match in tournament: ' + tourn.name + ' - ' + (team ? team.name : ''));
    }
    
    // Check if this team becomes tournament winner (optional - can be manually set)
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Render eliminations
 */
function renderEliminations(tourn) {
    var container = document.getElementById('elimination-list');
    if (!tourn.eliminations || tourn.eliminations.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No eliminations recorded</p>';
        return;
    }
    
    var html = '';
    var sorted = tourn.eliminations.slice().sort(function(a, b) { return parseInt(a.week) - parseInt(b.week); });
    sorted.forEach(function(elim, index) {
        var char = data.characters.find(function(c) { return String(c.id) === String(elim.characterId); });
        var charName = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var team = data.teams.find(function(t) { return String(t.id) === String(elim.teamId); });
        var teamName = team ? team.name : 'Unknown Team';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--danger-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid var(--danger);">';
        html += '<span style="font-size:0.75rem;"><strong>' + charName + '</strong> (' + teamName + ') - Week ' + elim.week + '</span>';
        html += '<button class="remove-elimination-btn small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 4px;" data-index="' + index + '">✕</button>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-elimination-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeElimination(tourn.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Add elimination
 */
function addElimination() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var characterId = document.getElementById('elim-character-select').value;
    var week = parseInt(document.getElementById('elim-week').value) || 1;
    
    if (!characterId) { alert('Please select a character to eliminate.'); return; }
    
    if (!tourn.eliminations) tourn.eliminations = [];
    
    // Check if already eliminated
    if (tourn.eliminations.some(function(e) { return String(e.characterId) === String(characterId); })) {
        alert('This character is already eliminated.');
        return;
    }
    
    // Find which team this character is in
    var teamId = null;
    var teams = tourn.teams || [];
    for (var i = 0; i < teams.length; i++) {
        var team = data.teams.find(function(t) { return String(t.id) === String(teams[i].teamId); });
        if (team && team.members) {
            if (team.members.some(function(m) { return String(m.characterId) === String(characterId); })) {
                teamId = team.id;
                break;
            }
        }
    }
    
    tourn.eliminations.push({
        characterId: characterId,
        week: week,
        teamId: teamId
    });
    
    // Mark character as eliminated (add to eliminatedWeeks)
    var char = data.characters.find(function(c) { return String(c.id) === String(characterId); });
    if (char) {
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        if (char.eliminatedWeeks.indexOf(week) === -1) {
            char.eliminatedWeeks.push(week);
        }
    }
    
    var charName = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    if (typeof logActivity === 'function') {
        logActivity('Eliminated ' + charName + ' from tournament: ' + tourn.name + ' (Week ' + week + ')');
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove elimination
 */
function removeElimination(tournId, index) {
    if (!confirm('Remove this elimination?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.eliminations || !tourn.eliminations[index]) return;
    
    var elim = tourn.eliminations[index];
    var char = data.characters.find(function(c) { return String(c.id) === String(elim.characterId); });
    if (char && char.eliminatedWeeks) {
        var weekIdx = char.eliminatedWeeks.indexOf(parseInt(elim.week));
        if (weekIdx !== -1) {
            char.eliminatedWeeks.splice(weekIdx, 1);
        }
    }
    
    tourn.eliminations.splice(index, 1);
    
    if (typeof logActivity === 'function') {
        logActivity('Removed elimination from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Render winner
 */
function renderWinner(tourn) {
    var container = document.getElementById('winner-display');
    if (tourn.winner) {
        var team = data.teams.find(function(t) { return String(t.id) === String(tourn.winner); });
        container.innerHTML = '★ ' + (team ? team.name : 'Unknown Team');
        container.style.display = 'block';
    } else {
        container.innerHTML = 'No winner set';
        container.style.color = 'var(--text-dim)';
        container.style.fontWeight = 'normal';
    }
}

/**
 * Set tournament winner
 */
function setTournamentWinner() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var teamId = document.getElementById('winner-team-select').value;
    if (!teamId) { alert('Please select a winner.'); return; }
    
    tourn.winner = teamId;
    tourn.status = 'completed';
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Set tournament winner: ' + (team ? team.name : '') + ' for ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Clear tournament winner
 */
function clearTournamentWinner() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    if (!confirm('Clear the tournament winner?')) return;
    
    tourn.winner = null;
    tourn.status = 'active';
    
    if (typeof logActivity === 'function') {
        logActivity('Cleared tournament winner for: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Initialize tournament events
 */
function initTournamentEvents() {
    // Add tournament button
    var addBtn = document.getElementById('add-tournament-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showTournamentForm(); });
    }
    
    // Form close buttons
    var closeFormBtn = document.getElementById('close-tournament-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeTournamentForm);
    }
    var cancelFormBtn = document.getElementById('cancel-tournament-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeTournamentForm);
    }
    var formModal = document.getElementById('tournament-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentForm();
        });
    }
    
    // Form submit
    var form = document.getElementById('tournament-form-inner');
    if (form) {
        form.addEventListener('submit', saveTournament);
    }
    
    // Detail close buttons
    var closeDetailBtn = document.getElementById('close-tournament-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeTournamentDetail);
    }
    var detailModal = document.getElementById('tournament-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
    }
    
    // Add team to tournament
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
    }
    
    // Refresh teams button
    var refreshBtn = document.getElementById('refresh-teams-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            if (tournId) {
                var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
                if (tourn) {
                    populateTeamSelector(tourn);
                    populateMatchSelectors(tourn);
                    populateEliminationSelector(tourn);
                    populateWinnerSelector(tourn);
                }
            }
        });
    }
    
    // Add match
    var addMatchBtn = document.getElementById('add-match-btn');
    if (addMatchBtn) {
        addMatchBtn.addEventListener('click', addMatch);
    }
    
    // Add elimination
    var addElimBtn = document.getElementById('add-elimination-btn');
    if (addElimBtn) {
        addElimBtn.addEventListener('click', addElimination);
    }
    
    // Remove elimination
    var removeElimBtn = document.getElementById('remove-elimination-btn');
    if (removeElimBtn) {
        removeElimBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
            if (!tourn || !tourn.eliminations) return;
            
            var select = document.getElementById('elim-character-select');
            var selectedValue = select.value;
            if (!selectedValue) { alert('Please select a character to remove from eliminations.'); return; }
            if (!confirm('Remove this character from eliminations?')) return;
            
            var index = tourn.eliminations.findIndex(function(e) { return String(e.characterId) === String(selectedValue); });
            if (index === -1) { alert('Character not found in eliminations.'); return; }
            
            removeElimination(tournId, index);
        });
    }
    
    // Set winner
    var setWinnerBtn = document.getElementById('set-winner-btn');
    if (setWinnerBtn) {
        setWinnerBtn.addEventListener('click', setTournamentWinner);
    }
    
    // Clear winner
    var clearWinnerBtn = document.getElementById('clear-winner-btn');
    if (clearWinnerBtn) {
        clearWinnerBtn.addEventListener('click', clearTournamentWinner);
    }
}

// Make functions globally available
window.renderTournamentsView = renderTournamentsView;
window.renderTournaments = renderTournaments;
window.showTournamentForm = showTournamentForm;
window.saveTournament = saveTournament;
window.deleteTournament = deleteTournament;
window.viewTournament = viewTournament;
window.closeTournamentDetail = closeTournamentDetail;
window.closeTournamentForm = closeTournamentForm;
window.addTeamToTournament = addTeamToTournament;
window.removeTeamFromTournament = removeTeamFromTournament;
window.addMatch = addMatch;
window.removeMatch = removeMatch;
window.setMatchWinner = setMatchWinner;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.setTournamentWinner = setTournamentWinner;
window.clearTournamentWinner = clearTournamentWinner;
window.populateTeamSelector = populateTeamSelector;
window.populateMatchSelectors = populateMatchSelectors;
window.populateEliminationSelector = populateEliminationSelector;
window.populateWinnerSelector = populateWinnerSelector;
window.renderTournamentTeams = renderTournamentTeams;
window.renderMatches = renderMatches;
window.renderEliminations = renderEliminations;
window.renderWinner = renderWinner;
window.initTournamentEvents = initTournamentEvents;
window.tournamentState = tournamentState;
