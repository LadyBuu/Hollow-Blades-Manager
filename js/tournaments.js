/**
 * tournaments.js - Tournament Management
 * Supports both Team-based and Individual (1v1 / multiplayer) tournaments
 */

var tournamentState = {
    currentTournamentId: null,
    selectedWeek: 1,
    currentMode: 'teams', // 'teams' or 'individuals'
    expandedMatch: null
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
                <span>Mode</span>
                <span>Participants</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            <div id="tournaments-container">
                <p class="empty-state">No tournaments created yet.</p>
            </div>
        </div>

        <!-- Tournament Form Modal -->
        <div id="tournament-form-modal" class="modal hidden">
            <div class="modal-content" style="max-width:550px;">
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
                            <label>Mode *</label>
                            <select id="tournament-mode" required>
                                <option value="teams">Teams (Academic Teams)</option>
                                <option value="individuals">Individuals (1v1 / Multiplayer)</option>
                            </select>
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
                    <div id="tournament-mode-switcher" style="margin-bottom:12px;display:flex;gap:8px;">
                        <button id="switch-teams-mode" class="small primary">Teams Mode</button>
                        <button id="switch-individuals-mode" class="small">Individuals Mode</button>
                    </div>
                    
                    <!-- TEAM SELECTION SECTION -->
                    <div id="team-selection-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Select Teams</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="tournament-team-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select a team...</option>
                            </select>
                            <button id="add-team-to-tournament" class="primary small">Add Team</button>
                            <button id="refresh-teams-btn" class="secondary small">Refresh</button>
                        </div>
                        <div style="margin-top:4px;font-size:0.7rem;color:var(--text-dim);">
                            Only academic teams active in the tournament's week range are shown.
                        </div>
                        <div id="tournament-teams-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- INDIVIDUAL PARTICIPANTS SECTION -->
                    <div id="individual-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);display:none;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Individual Participants</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="tournament-char-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select character...</option>
                            </select>
                            <button id="add-char-to-tournament" class="primary small">Add Participant</button>
                            <button id="refresh-chars-btn" class="secondary small">Refresh</button>
                        </div>
                        <div style="margin-top:4px;font-size:0.7rem;color:var(--text-dim);">
                            Available characters (not eliminated or deceased in this week).
                        </div>
                        <div id="tournament-characters-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- MATCHES SECTION -->
                    <div id="matches-section" style="margin-bottom:16px;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Matches</h4>
                        <div id="match-controls" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <label style="font-size:0.7rem;color:var(--text-dim);">Match Type:</label>
                            <select id="match-type-select" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;">
                                <option value="1v1">1v1</option>
                                <option value="1v1v1">1v1v1 (3 players)</option>
                                <option value="1v1v1v1">1v1v1v1 (4 players)</option>
                                <option value="ffa">Free-for-All (all)</option>
                            </select>
                            <div id="match-selectors">
                                <select class="match-participant" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;min-width:100px;">
                                    <option value="">Select...</option>
                                </select>
                                <span style="color:var(--text-dim);font-size:0.7rem;">vs</span>
                                <select class="match-participant" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;min-width:100px;">
                                    <option value="">Select...</option>
                                </select>
                            </div>
                            <button id="add-match-btn" class="primary small">Add Match</button>
                        </div>
                        <div id="matches-list">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No matches created</p>
                        </div>
                    </div>

                    <!-- ELIMINATIONS SECTION -->
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
                            Eliminated characters cannot participate in future matches or be added to new teams.
                        </div>
                        <div id="elimination-list">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No eliminations recorded</p>
                        </div>
                    </div>

                    <!-- Tournament Winner Display -->
                    <div id="winner-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--accent);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Tournament Winner</h4>
                        <div id="winner-display" style="font-weight:600;color:var(--accent);font-size:1.1rem;">
                            Not determined yet
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;">
                            Winner is determined by the last match result. Set a match winner below.
                        </div>
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
        var participantCount = 0;
        var modeLabel = 'Teams';
        if (tourn.mode === 'individuals') {
            modeLabel = 'Individuals';
            participantCount = tourn.participants ? tourn.participants.length : 0;
        } else {
            participantCount = tourn.teams ? tourn.teams.length : 0;
        }
        
        var statusText = tourn.status || 'draft';
        var statusColor = 'var(--text-dim)';
        if (tourn.status === 'active') {
            statusColor = 'var(--accent)';
        } else if (tourn.status === 'completed') {
            statusColor = 'var(--info)';
        }
        
        var weekDisplay = 'Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?');
        
        var winnerDisplay = '';
        if (tourn.winner) {
            if (tourn.mode === 'individuals') {
                var winnerChar = data.characters.find(function(c) { return String(c.id) === String(tourn.winner); });
                if (winnerChar) {
                    winnerDisplay = ' ★ ' + [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ');
                }
            } else {
                var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(tourn.winner); });
                if (winnerTeam) {
                    winnerDisplay = ' ★ ' + winnerTeam.name;
                }
            }
        }
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong>' + winnerDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + modeLabel + '</span>' +
            '<span>' + participantCount + '</span>' +
            '<span style="color:' + statusColor + ';font-size:0.75rem;font-weight:600;">' + statusText + '</span>' +
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
            document.getElementById('tournament-mode').value = tourn.mode || 'teams';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '1';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '4';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'New Tournament';
        form.reset();
        document.getElementById('tournament-mode').value = 'teams';
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
        mode: document.getElementById('tournament-mode').value || 'teams',
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
            mode: tournData.mode,
            startWeek: tournData.startWeek,
            endWeek: tournData.endWeek,
            academicYear: tournData.academicYear,
            status: 'active',
            teams: [],
            participants: [],
            matches: [],
            eliminations: [],
            winner: null,
            createdAt: new Date().toISOString()
        };
        data.tournaments.push(newTourn);
        if (typeof logActivity === 'function') {
            logActivity('Created tournament: ' + tournData.name + ' (' + tournData.mode + ')');
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
    tournamentState.currentMode = tourn.mode || 'teams';
    
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    // Info
    var info = document.getElementById('tournament-info');
    var winnerDisplay = '';
    if (tourn.winner) {
        if (tourn.mode === 'individuals') {
            var winnerChar = data.characters.find(function(c) { return String(c.id) === String(tourn.winner); });
            if (winnerChar) {
                winnerDisplay = ' | Winner: <span style="color:var(--accent);font-weight:600;">' + 
                    [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ') + '</span>';
            }
        } else {
            var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(tourn.winner); });
            if (winnerTeam) {
                winnerDisplay = ' | Winner: <span style="color:var(--accent);font-weight:600;">' + winnerTeam.name + '</span>';
            }
        }
    }
    
    var statusColor = 'var(--text-dim)';
    if (tourn.status === 'active') {
        statusColor = 'var(--accent)';
    } else if (tourn.status === 'completed') {
        statusColor = 'var(--info)';
    }
    
    var modeLabel = tourn.mode === 'individuals' ? 'Individuals' : 'Teams';
    var participantCount = tourn.mode === 'individuals' ? (tourn.participants ? tourn.participants.length : 0) : (tourn.teams ? tourn.teams.length : 0);
    
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">Mode: <strong>' + modeLabel + '</strong> | ' +
        'Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + 
        (tourn.academicYear ? ' | ' + tourn.academicYear : '') + 
        ' | Status: <span style="color:' + statusColor + ';font-weight:600;">' + (tourn.status || 'active') + '</span>' +
        ' | Participants: ' + participantCount +
        winnerDisplay + '</span>';
    
    // Update mode switcher buttons
    var teamsBtn = document.getElementById('switch-teams-mode');
    var indBtn = document.getElementById('switch-individuals-mode');
    if (tourn.mode === 'individuals') {
        teamsBtn.className = 'small';
        indBtn.className = 'small primary';
    } else {
        teamsBtn.className = 'small primary';
        indBtn.className = 'small';
    }
    
    // Show/hide sections based on mode
    var teamSection = document.getElementById('team-selection-section');
    var individualSection = document.getElementById('individual-section');
    var matchControls = document.getElementById('match-controls');
    
    if (tourn.mode === 'individuals') {
        teamSection.style.display = 'none';
        individualSection.style.display = 'block';
        // Update match controls for individuals
        updateMatchControlsForIndividuals(tourn);
    } else {
        teamSection.style.display = 'block';
        individualSection.style.display = 'none';
        // Update match controls for teams
        updateMatchControlsForTeams(tourn);
    }
    
    // Populate selectors
    populateTeamSelector(tourn);
    populateCharacterSelector(tourn);
    populateMatchSelectors(tourn);
    populateEliminationSelector(tourn);
    
    // Render sections
    renderTournamentTeams(tourn);
    renderTournamentCharacters(tourn);
    renderMatches(tourn);
    renderEliminations(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

/**
 * Update match controls for teams mode
 */
function updateMatchControlsForTeams(tourn) {
    var container = document.getElementById('match-controls');
    var matchTypeSelect = document.getElementById('match-type-select');
    if (matchTypeSelect) matchTypeSelect.style.display = 'none';
    
    var selectors = document.getElementById('match-selectors');
    selectors.innerHTML = `
        <select class="match-participant" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;min-width:100px;">
            <option value="">Select...</option>
        </select>
        <span style="color:var(--text-dim);font-size:0.7rem;">vs</span>
        <select class="match-participant" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;min-width:100px;">
            <option value="">Select...</option>
        </select>
    `;
    populateMatchSelectors(tourn);
}

/**
 * Update match controls for individuals mode
 */
function updateMatchControlsForIndividuals(tourn) {
    var container = document.getElementById('match-controls');
    var matchTypeSelect = document.getElementById('match-type-select');
    if (matchTypeSelect) matchTypeSelect.style.display = 'inline-block';
    
    var selectors = document.getElementById('match-selectors');
    var matchType = matchTypeSelect ? matchTypeSelect.value : '1v1';
    var count = getMatchParticipantCount(matchType);
    
    var html = '';
    for (var i = 0; i < count; i++) {
        if (i > 0) {
            html += ' <span style="color:var(--text-dim);font-size:0.7rem;">vs</span> ';
        }
        html += '<select class="match-participant" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;min-width:100px;" data-index="' + i + '">';
        html += '<option value="">Select...</option>';
        html += '</select>';
    }
    selectors.innerHTML = html;
    populateMatchSelectors(tourn);
    
    // Add change listener to match type
    if (matchTypeSelect) {
        matchTypeSelect.onchange = function() {
            updateMatchControlsForIndividuals(tourn);
        };
    }
}

/**
 * Get number of participants for a match type
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
 * Populate character selector for individual mode
 */
function populateCharacterSelector(tourn) {
    var select = document.getElementById('tournament-char-select');
    if (!select) return;
    
    var startWeek = parseInt(tourn.startWeek) || 1;
    var existingIds = (tourn.participants || []).map(function(p) { return p.characterId; });
    
    // Get all non-civilian characters that are available
    var available = data.characters.filter(function(c) {
        if (c.deceased) return false;
        if (existingIds.some(function(id) { return String(id) === String(c.id); })) return false;
        // Check if eliminated
        if (c.eliminatedWeeks && c.eliminatedWeeks.length > 0) {
            for (var i = 0; i < c.eliminatedWeeks.length; i++) {
                if (parseInt(c.eliminatedWeeks[i]) <= startWeek) {
                    return false;
                }
            }
        }
        // Check if in any team (optional - allow individuals not in teams)
        // For individual tournaments, we allow anyone who is not eliminated
        var status = getCurrentStatus(c).toLowerCase();
        return status !== 'civilian' && status !== '';
    });
    
    // Also allow civilians if they're not eliminated
    var civilians = data.characters.filter(function(c) {
        if (c.deceased) return false;
        if (existingIds.some(function(id) { return String(id) === String(c.id); })) return false;
        if (c.eliminatedWeeks && c.eliminatedWeeks.length > 0) {
            for (var i = 0; i < c.eliminatedWeeks.length; i++) {
                if (parseInt(c.eliminatedWeeks[i]) <= startWeek) {
                    return false;
                }
            }
        }
        var status = getCurrentStatus(c).toLowerCase();
        return status === 'civilian' || status === '';
    });
    
    var allChars = available.concat(civilians);
    allChars.sort(function(a, b) {
        var nameA = [a.firstName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    select.innerHTML = '<option value="">Select character...</option>';
    if (allChars.length === 0) {
        select.innerHTML += '<option value="" disabled>No available characters</option>';
    } else {
        allChars.forEach(function(c) {
            var option = document.createElement('option');
            option.value = c.id;
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            var status = getCurrentStatus(c);
            option.textContent = name + ' (' + status + ')';
            select.appendChild(option);
        });
    }
}

/**
 * Populate match selectors
 */
function populateMatchSelectors(tourn) {
    var selectors = document.querySelectorAll('.match-participant');
    if (selectors.length === 0) return;
    
    var isTeams = tourn.mode !== 'individuals';
    var options = isTeams ? getTeamOptions(tourn) : getCharacterOptions(tourn);
    
    selectors.forEach(function(select) {
        var currentValue = select.value;
        select.innerHTML = '<option value="">Select...</option>';
        options.forEach(function(opt) {
            var option = document.createElement('option');
            option.value = opt.id;
            option.textContent = opt.name;
            select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
    });
}

/**
 * Get team options for match selectors
 */
function getTeamOptions(tourn) {
    var teams = tourn.teams || [];
    var result = [];
    teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
        if (team) {
            result.push({ id: team.id, name: team.name });
        }
    });
    return result;
}

/**
 * Get character options for match selectors
 */
function getCharacterOptions(tourn) {
    var participants = tourn.participants || [];
    var result = [];
    var startWeek = parseInt(tourn.startWeek) || 1;
    
    participants.forEach(function(entry) {
        var char = data.characters.find(function(c) { return String(c.id) === String(entry.characterId); });
        if (char) {
            // Check if eliminated during tournament
            var isEliminated = false;
            if (tourn.eliminations) {
                tourn.eliminations.forEach(function(elim) {
                    if (String(elim.characterId) === String(char.id)) {
                        var elimWeek = parseInt(elim.week);
                        if (!isNaN(elimWeek) && elimWeek <= startWeek) {
                            isEliminated = true;
                        }
                    }
                });
            }
            if (!isEliminated) {
                var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                result.push({ id: char.id, name: name });
            }
        }
    });
    return result;
}

/**
 * Populate elimination selector with characters from participants
 */
function populateEliminationSelector(tourn) {
    var select = document.getElementById('elim-character-select');
    if (!select) return;
    
    var alreadyEliminated = (tourn.eliminations || []).map(function(e) { return e.characterId; });
    var startWeek = parseInt(tourn.startWeek) || 1;
    
    var chars = [];
    
    if (tourn.mode === 'individuals') {
        var participants = tourn.participants || [];
        participants.forEach(function(entry) {
            var char = data.characters.find(function(c) { return String(c.id) === String(entry.characterId); });
            if (char && !alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) {
                if (!char.deceased) {
                    var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                    var status = getCurrentStatus(char);
                    chars.push({
                        id: char.id,
                        name: name + ' (' + status + ')'
                    });
                }
            }
        });
    } else {
        var teams = tourn.teams || [];
        teams.forEach(function(entry) {
            var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
            if (team && team.members) {
                team.members.forEach(function(member) {
                    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                    if (char && !alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) {
                        if (!char.deceased) {
                            var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                            var status = getCurrentStatus(char);
                            chars.push({
                                id: char.id,
                                name: name + ' (' + status + ')'
                            });
                        }
                    }
                });
            }
        });
    }
    
    // Also include characters with standalone eliminations that haven't been added to this tournament yet
    data.characters.forEach(function(char) {
        if (char.deceased) return;
        if (alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) return;
        // Check if character has standalone eliminations
        var hasStandalone = false;
        if (char.eliminations) {
            char.eliminations.forEach(function(elim) {
                if (elim.standalone) {
                    var elimWeek = parseInt(elim.week);
                    if (!isNaN(elimWeek) && elimWeek <= startWeek) {
                        hasStandalone = true;
                    }
                }
            });
        }
        if (hasStandalone) {
            var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
            var status = getCurrentStatus(char);
            chars.push({
                id: char.id,
                name: name + ' (' + status + ') - standalone'
            });
        }
    });
    
    // Remove duplicates
    var seen = {};
    var uniqueChars = chars.filter(function(c) {
        if (seen[c.id]) return false;
        seen[c.id] = true;
        return true;
    });
    
    uniqueChars.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    
    select.innerHTML = '<option value="">Select character...</option>';
    if (uniqueChars.length === 0) {
        select.innerHTML += '<option value="" disabled>No characters available for elimination</option>';
    } else {
        uniqueChars.forEach(function(char) {
            var option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            if (char.name.includes('standalone')) {
                option.style.color = 'var(--warning)';
            }
            select.appendChild(option);
        });
    }
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
        html += teamName + (isWinner ? ' ★' : '') + ' (' + memberCount + ' members)';
        html += ' <button class="remove-team-from-tournament small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-team="' + entry.teamId + '">✕</button>';
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
 * Render tournament characters (individual participants)
 */
function renderTournamentCharacters(tourn) {
    var container = document.getElementById('tournament-characters-list');
    if (!tourn.participants || tourn.participants.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No individual participants added</p>';
        return;
    }
    
    var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    var startWeek = parseInt(tourn.startWeek) || 1;
    
    tourn.participants.forEach(function(entry) {
        var char = data.characters.find(function(c) { return String(c.id) === String(entry.characterId); });
        var name = char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var isWinner = tourn.winner && String(tourn.winner) === String(entry.characterId);
        
        // Check if eliminated
        var isEliminated = false;
        if (tourn.eliminations) {
            tourn.eliminations.forEach(function(elim) {
                if (String(elim.characterId) === String(entry.characterId)) {
                    var elimWeek = parseInt(elim.week);
                    if (!isNaN(elimWeek) && elimWeek <= startWeek) {
                        isEliminated = true;
                    }
                }
            });
        }
        
        var style = 'border:1px solid ';
        if (isWinner) style += 'var(--accent)';
        else if (isEliminated) style += 'var(--danger)';
        else style += 'var(--border)';
        
        var status = char ? getCurrentStatus(char) : '';
        var deadMarker = char && char.deceased ? ' Deceased' : '';
        var elimMarker = isEliminated ? ' ❌' : '';
        
        html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;' + style + ';">';
        html += name + (isWinner ? ' ★' : '') + elimMarker + ' (' + status + ')' + deadMarker;
        html += ' <button class="remove-char-from-tournament small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-char="' + entry.characterId + '">✕</button>';
        html += '</span>';
    });
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-char-from-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeCharacterFromTournament(tourn.id, this.dataset.char);
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
 * Add character to tournament (individual mode)
 */
function addCharacterToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var charId = document.getElementById('tournament-char-select').value;
    if (!charId) { alert('Please select a character.'); return; }
    
    if (!tourn.participants) tourn.participants = [];
    
    if (tourn.participants.some(function(p) { return String(p.characterId) === String(charId); })) {
        alert('Character already added to this tournament.');
        return;
    }
    
    tourn.participants.push({ characterId: charId });
    
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (typeof logActivity === 'function') {
        logActivity('Added character ' + (char ? char.firstName : '') + ' to tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove character from tournament
 */
function removeCharacterFromTournament(tournId, charId) {
    if (!confirm('Remove this character from the tournament?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    tourn.participants = tourn.participants.filter(function(p) { return String(p.characterId) !== String(charId); });
    
    if (tourn.matches) {
        tourn.matches = tourn.matches.filter(function(m) {
            return String(m.participants) !== String(charId);
        });
    }
    
    if (tourn.winner && String(tourn.winner) === String(charId)) {
        tourn.winner = null;
        tourn.status = 'active';
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
    
    var isTeams = tourn.mode !== 'individuals';
    var html = '';
    
    tourn.matches.forEach(function(match, index) {
        var participantNames = [];
        var participantIds = match.participants || [];
        var isComplete = false;
        var winnerName = 'TBD';
        
        if (isTeams) {
            var team1 = data.teams.find(function(t) { return String(t.id) === String(match.team1Id); });
            var team2 = data.teams.find(function(t) { return String(t.id) === String(match.team2Id); });
            participantNames = [
                team1 ? team1.name : 'Unknown',
                team2 ? team2.name : 'Unknown'
            ];
            participantIds = [match.team1Id, match.team2Id];
            if (match.winner) {
                var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(match.winner); });
                winnerName = winnerTeam ? winnerTeam.name : 'Unknown';
                isComplete = true;
            }
        } else {
            // Individual mode
            if (match.participants) {
                match.participants.forEach(function(id) {
                    var char = data.characters.find(function(c) { return String(c.id) === String(id); });
                    participantNames.push(char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown');
                });
            }
            if (match.winner) {
                var winnerChar = data.characters.find(function(c) { return String(c.id) === String(match.winner); });
                winnerName = winnerChar ? [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                isComplete = true;
            }
        }
        
        var winnerClass = isComplete ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-dim);';
        var borderColor = isComplete ? 'var(--accent)' : 'var(--border)';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;flex-wrap:wrap;gap:4px;border-left:3px solid ' + borderColor + ';">';
        html += '<span style="font-size:0.8rem;"><strong>' + participantNames.join(' vs ') + '</strong></span>';
        html += '<span style="' + winnerClass + 'font-size:0.8rem;">Winner: ' + winnerName + '</span>';
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
        
        // Winner buttons - for each participant
        participantIds.forEach(function(id) {
            if (id) {
                var label = isTeams ? 
                    (data.teams.find(function(t) { return String(t.id) === String(id); }) || {}).name || 'Unknown' :
                    (data.characters.find(function(c) { return String(c.id) === String(id); }) || {}).firstName || 'Unknown';
                html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-winner="' + id + '">' + label + '</button>';
            }
        });
        
        html += '<button class="remove-match-btn small danger" data-index="' + index + '">✕</button>';
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setMatchWinner(tourn.id, parseInt(this.dataset.index), this.dataset.winner);
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
    
    var isTeams = tourn.mode !== 'individuals';
    
    if (isTeams) {
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
    } else {
        // Individual mode
        var matchType = document.getElementById('match-type-select').value;
        var participantSelects = document.querySelectorAll('#match-selectors .match-participant');
        var participantIds = [];
        var selectedNames = [];
        
        participantSelects.forEach(function(select) {
            if (select.value) {
                participantIds.push(select.value);
                var char = data.characters.find(function(c) { return String(c.id) === String(select.value); });
                selectedNames.push(char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown');
            }
        });
        
        if (participantIds.length < 2) {
            alert('Please select at least 2 participants.');
            return;
        }
        
        // Check for duplicates
        var uniqueIds = participantIds.filter(function(id, index) {
            return participantIds.indexOf(id) === index;
        });
        if (uniqueIds.length !== participantIds.length) {
            alert('Duplicate participants selected.');
            return;
        }
        
        if (!tourn.matches) tourn.matches = [];
        
        tourn.matches.push({
            participants: participantIds,
            winner: null
        });
        
        if (typeof logActivity === 'function') {
            logActivity('Added match (' + selectedNames.join(' vs ') + ') to tournament: ' + tourn.name);
        }
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
function setMatchWinner(tournId, matchIndex, winnerId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    tourn.matches[matchIndex].winner = winnerId;
    
    // Update tournament winner to the last match winner
    updateTournamentWinner(tourn);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Update tournament winner
 */
function updateTournamentWinner(tourn) {
    if (!tourn.matches || tourn.matches.length === 0) {
        tourn.winner = null;
        tourn.status = 'active';
        return;
    }
    
    var lastWinner = null;
    for (var i = tourn.matches.length - 1; i >= 0; i--) {
        if (tourn.matches[i].winner) {
            lastWinner = tourn.matches[i].winner;
            break;
        }
    }
    
    if (lastWinner) {
        tourn.winner = lastWinner;
        tourn.status = 'completed';
        if (typeof logActivity === 'function') {
            if (tourn.mode === 'individuals') {
                var winnerChar = data.characters.find(function(c) { return String(c.id) === String(lastWinner); });
                logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + (winnerChar ? winnerChar.firstName : 'Unknown'));
            } else {
                var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(lastWinner); });
                logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + (winnerTeam ? winnerTeam.name : 'Unknown'));
            }
        }
    } else {
        tourn.winner = null;
        tourn.status = 'active';
    }
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
        var charName = char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var teamName = '';
        if (elim.teamId) {
            var team = data.teams.find(function(t) { return String(t.id) === String(elim.teamId); });
            if (team) teamName = ' (' + team.name + ')';
        }
        var standaloneLabel = elim.standalone ? ' [Standalone]' : '';
        var reasonLabel = elim.reason ? ' - ' + elim.reason : '';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--danger-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid ' + (elim.standalone ? 'var(--warning)' : 'var(--danger)') + ';">';
        html += '<span style="font-size:0.75rem;"><strong>' + charName + '</strong>' + teamName + standaloneLabel + ' - Week ' + elim.week + reasonLabel + '</span>';
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
    
    if (tourn.eliminations.some(function(e) { return String(e.characterId) === String(characterId); })) {
        alert('This character is already eliminated from this tournament.');
        return;
    }
    
    // Find which team this character is in (if any)
    var teamId = null;
    if (tourn.mode === 'teams') {
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
    }
    
    // Check if character has standalone eliminations already
    var char = data.characters.find(function(c) { return String(c.id) === String(characterId); });
    var hasStandalone = false;
    if (char && char.eliminations) {
        char.eliminations.forEach(function(elim) {
            if (elim.standalone) {
                var elimWeek = parseInt(elim.week);
                if (!isNaN(elimWeek) && elimWeek <= week) {
                    hasStandalone = true;
                }
            }
        });
    }
    
    // Check if character is already eliminated from another tournament
    var isAlreadyEliminated = false;
    data.tournaments.forEach(function(t) {
        if (String(t.id) === String(tournId)) return;
        if (t.eliminations) {
            t.eliminations.forEach(function(elim) {
                if (String(elim.characterId) === String(characterId)) {
                    var elimWeek = parseInt(elim.week);
                    if (!isNaN(elimWeek) && elimWeek <= week) {
                        isAlreadyEliminated = true;
                    }
                }
            });
        }
    });
    
    if (isAlreadyEliminated && !hasStandalone) {
        alert('This character is already eliminated from another tournament.');
        return;
    }
    
    tourn.eliminations.push({
        characterId: characterId,
        week: week,
        teamId: teamId,
        standalone: false,
        reason: 'Eliminated from tournament'
    });
    
    // Mark character as eliminated (add to eliminatedWeeks)
    if (char) {
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        if (char.eliminatedWeeks.indexOf(week) === -1) {
            char.eliminatedWeeks.push(week);
        }
        // Also add to eliminations array for tracking
        if (!char.eliminations) char.eliminations = [];
        char.eliminations.push({
            tournamentId: tournId,
            week: week,
            reason: 'Eliminated from tournament: ' + tourn.name,
            standalone: false
        });
    }
    
    var charName = char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
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
 * Render winner display
 */
function renderWinner(tourn) {
    var container = document.getElementById('winner-display');
    if (tourn.winner) {
        if (tourn.mode === 'individuals') {
            var winnerChar = data.characters.find(function(c) { return String(c.id) === String(tourn.winner); });
            container.innerHTML = '★ ' + (winnerChar ? [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown');
        } else {
            var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(tourn.winner); });
            container.innerHTML = '★ ' + (winnerTeam ? winnerTeam.name : 'Unknown');
        }
        container.style.color = 'var(--accent)';
        container.style.fontWeight = '600';
        container.style.fontSize = '1.1rem';
        container.style.display = 'block';
    } else {
        container.innerHTML = 'Not determined yet';
        container.style.color = 'var(--text-dim)';
        container.style.fontWeight = 'normal';
        container.style.fontSize = '1rem';
        container.style.display = 'block';
    }
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
    
    // Mode switcher
    var teamsModeBtn = document.getElementById('switch-teams-mode');
    var indModeBtn = document.getElementById('switch-individuals-mode');
    if (teamsModeBtn) {
        teamsModeBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
            if (tourn) {
                tourn.mode = 'teams';
                viewTournament(tournId);
            }
        });
    }
    if (indModeBtn) {
        indModeBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
            if (tourn) {
                tourn.mode = 'individuals';
                viewTournament(tournId);
            }
        });
    }
    
    // Add team to tournament
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
    }
    
    // Add character to tournament
    var addCharBtn = document.getElementById('add-char-to-tournament');
    if (addCharBtn) {
        addCharBtn.addEventListener('click', addCharacterToTournament);
    }
    
    // Refresh buttons
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
                }
            }
        });
    }
    var refreshCharsBtn = document.getElementById('refresh-chars-btn');
    if (refreshCharsBtn) {
        refreshCharsBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            if (tournId) {
                var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
                if (tourn) {
                    populateCharacterSelector(tourn);
                    populateMatchSelectors(tourn);
                    populateEliminationSelector(tourn);
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
window.addCharacterToTournament = addCharacterToTournament;
window.removeCharacterFromTournament = removeCharacterFromTournament;
window.addMatch = addMatch;
window.removeMatch = removeMatch;
window.setMatchWinner = setMatchWinner;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.updateTournamentWinner = updateTournamentWinner;
window.populateTeamSelector = populateTeamSelector;
window.populateCharacterSelector = populateCharacterSelector;
window.populateMatchSelectors = populateMatchSelectors;
window.populateEliminationSelector = populateEliminationSelector;
window.renderTournamentTeams = renderTournamentTeams;
window.renderTournamentCharacters = renderTournamentCharacters;
window.renderMatches = renderMatches;
window.renderEliminations = renderEliminations;
window.renderWinner = renderWinner;
window.initTournamentEvents = initTournamentEvents;
window.tournamentState = tournamentState;
