/**
 * tournaments.js - Tournament Management
 * Supports both Team-based and Individual (1v1 / multiplayer) tournaments
 * With multi-round support for individual tournaments
 */

var tournamentState = {
    currentTournamentId: null,
    selectedWeek: 1,
    currentMode: 'teams', // 'teams' or 'individuals'
    expandedMatch: null,
    editingMatch: null
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
                    <div id="tournament-mode-switcher" style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
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

                    <!-- INDIVIDUAL ROUNDS SECTION -->
                    <div id="rounds-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);display:none;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Rounds & Matches</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <button id="add-round-btn" class="primary small">+ Add Round</button>
                            <button id="auto-generate-rounds-btn" class="small info-btn">Auto-Generate Rounds</button>
                            <span style="font-size:0.7rem;color:var(--text-dim);margin-left:8px;" id="rounds-status">No rounds created</span>
                        </div>
                        <div id="rounds-container">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No rounds created. Add a round to start the tournament.</p>
                        </div>
                    </div>

                    <!-- MATCHES SECTION (Legacy - kept for teams mode) -->
                    <div id="matches-section" style="margin-bottom:16px;display:none;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Matches</h4>
                        <div id="match-controls" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
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

        <!-- Match Detail/Edit Modal -->
        <div id="match-detail-modal" class="modal hidden">
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3 id="match-detail-title">Match Details</h3>
                    <button class="close-modal" id="close-match-detail">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="match-detail-content"></div>
                    <div class="form-actions" style="margin-top:16px;">
                        <button type="button" id="save-match-detail" class="primary">Save Results</button>
                        <button type="button" id="cancel-match-detail" class="secondary">Cancel</button>
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
        
        var roundCount = tourn.rounds ? tourn.rounds.length : 0;
        var roundsDisplay = tourn.mode === 'individuals' ? ' | ' + roundCount + ' rounds' : '';
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong>' + winnerDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + modeLabel + roundsDisplay + '</span>' +
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
            rounds: [],
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
    var roundCount = tourn.rounds ? tourn.rounds.length : 0;
    
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">Mode: <strong>' + modeLabel + '</strong> | ' +
        'Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + 
        (tourn.academicYear ? ' | ' + tourn.academicYear : '') + 
        ' | Status: <span style="color:' + statusColor + ';font-weight:600;">' + (tourn.status || 'active') + '</span>' +
        ' | Participants: ' + participantCount +
        (tourn.mode === 'individuals' ? ' | Rounds: ' + roundCount : '') +
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
    var roundsSection = document.getElementById('rounds-section');
    var matchesSection = document.getElementById('matches-section');
    var matchControls = document.getElementById('match-controls');
    
    if (tourn.mode === 'individuals') {
        teamSection.style.display = 'none';
        individualSection.style.display = 'block';
        roundsSection.style.display = 'block';
        matchesSection.style.display = 'none';
    } else {
        teamSection.style.display = 'block';
        individualSection.style.display = 'none';
        roundsSection.style.display = 'none';
        matchesSection.style.display = 'block';
    }
    
    // Populate selectors
    populateTeamSelector(tourn);
    populateCharacterSelector(tourn);
    populateEliminationSelector(tourn);
    
    // Render sections
    renderTournamentTeams(tourn);
    renderTournamentCharacters(tourn);
    renderRounds(tourn);
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
    
    // Also include characters with standalone eliminations
    data.characters.forEach(function(char) {
        if (char.deceased) return;
        if (alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) return;
        if (char.eliminations) {
            char.eliminations.forEach(function(elim) {
                if (elim.standalone) {
                    var elimWeek = parseInt(elim.week);
                    if (!isNaN(elimWeek) && elimWeek <= startWeek) {
                        var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                        var status = getCurrentStatus(char);
                        chars.push({
                            id: char.id,
                            name: name + ' (' + status + ') - standalone'
                        });
                    }
                }
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
        
        // Check if in any rounds
        var roundStatus = '';
        if (tourn.rounds) {
            tourn.rounds.forEach(function(round) {
                round.matches.forEach(function(match) {
                    if (match.participants && match.participants.some(function(id) { return String(id) === String(entry.characterId); })) {
                        if (match.winnerIds && match.winnerIds.some(function(id) { return String(id) === String(entry.characterId); })) {
                            roundStatus = '🏆 ';
                        } else if (match.loserIds && match.loserIds.some(function(id) { return String(id) === String(entry.characterId); })) {
                            roundStatus = '❌ ';
                        } else if (match.status === 'completed') {
                            roundStatus = '⬆️ ';
                        }
                    }
                });
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
        html += roundStatus + name + (isWinner ? ' ★' : '') + elimMarker + ' (' + status + ')' + deadMarker;
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
 * Get participant name by ID
 */
function getParticipantNameById(id, tourn) {
    if (!id) return 'Unknown';
    
    // Check if it's a character
    var char = data.characters.find(function(c) { return String(c.id) === String(id); });
    if (char) {
        return [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    
    // Check if it's a team
    var team = data.teams.find(function(t) { return String(t.id) === String(id); });
    if (team) {
        return team.name;
    }
    
    return 'Unknown';
}

/**
 * Render rounds for individual tournaments
 */
function renderRounds(tourn) {
    var container = document.getElementById('rounds-container');
    if (!tourn.rounds || tourn.rounds.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No rounds created. Add a round to start the tournament.</p>';
        var status = document.getElementById('rounds-status');
        if (status) status.textContent = 'No rounds';
        return;
    }
    
    var status = document.getElementById('rounds-status');
    if (status) {
        var completedRounds = tourn.rounds.filter(function(r) { return r.status === 'completed'; }).length;
        status.textContent = completedRounds + '/' + tourn.rounds.length + ' rounds completed';
    }
    
    var html = '';
    var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    tourn.rounds.forEach(function(round, roundIndex) {
        var roundLabel = String.fromCharCode(65 + roundIndex); // A, B, C...
        var isCompleted = round.status === 'completed';
        var isInProgress = round.status === 'in_progress';
        var matchCount = round.matches ? round.matches.length : 0;
        
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
        html += '<div><strong style="color:var(--accent);">Round ' + roundLabel + '</strong> <span style="color:var(--text-dim);font-size:0.75rem;">(' + matchCount + ' matches)</span>';
        html += ' <span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:' + 
            (isCompleted ? 'var(--info-soft);color:var(--info);' : 
             isInProgress ? 'var(--warning-soft);color:var(--warning);' : 
             'var(--bg);color:var(--text-dim);') + '">' + 
            (isCompleted ? '✓ Completed' : isInProgress ? '⏳ In Progress' : '⏸ Pending') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="small info-btn view-round-matches" data-round="' + roundIndex + '">View Matches</button>';
        if (!isCompleted) {
            html += '<button class="small primary complete-round-btn" data-round="' + roundIndex + '">Complete Round</button>';
        }
        html += '<button class="small danger delete-round-btn" data-round="' + roundIndex + '">✕</button>';
        html += '</div>';
        html += '</div>';
        
        // Show matches in this round
        if (round.matches && round.matches.length > 0) {
            html += '<div style="padding-left:8px;border-left:2px solid var(--border-soft);">';
            round.matches.forEach(function(match, matchIndex) {
                var matchStatus = match.status || 'pending';
                var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 
                                  matchStatus === 'in_progress' ? 'var(--warning)' : 'var(--text-dim)';
                
                var participantNames = [];
                if (match.participants) {
                    match.participants.forEach(function(id) {
                        var name = getParticipantNameById(id, tourn);
                        var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                        var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                        var label = name;
                        if (isWinner) label += ' 🏆';
                        else if (isLoser) label += ' ❌';
                        else if (matchStatus === 'completed') label += ' ⬆️';
                        participantNames.push(label);
                    });
                }
                
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:4px;margin-bottom:4px;border-left:3px solid ' + statusColor + ';">';
                html += '<span style="font-size:0.75rem;">Match ' + (matchIndex + 1) + ': <strong>' + participantNames.join(' vs ') + '</strong></span>';
                html += '<span style="font-size:0.7rem;color:' + statusColor + ';">' + matchStatus + '</span>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            html += '<div style="color:var(--text-dim);font-size:0.7rem;padding:4px 8px;">No matches in this round</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Round action buttons
    container.querySelectorAll('.view-round-matches').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showRoundMatchesModal(tourn.id, roundIndex);
        });
    });
    
    container.querySelectorAll('.complete-round-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            completeRound(tourn.id, roundIndex);
        });
    });
    
    container.querySelectorAll('.delete-round-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            deleteRound(tourn.id, roundIndex);
        });
    });
}

/**
 * Show round matches modal for detailed view and editing
 */
function showRoundMatchesModal(tournId, roundIndex) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var roundLabel = String.fromCharCode(65 + roundIndex);
    
    var modal = document.getElementById('match-detail-modal');
    document.getElementById('match-detail-title').textContent = 'Round ' + roundLabel + ' - Matches';
    
    var content = document.getElementById('match-detail-content');
    var html = '<div style="margin-bottom:12px;">';
    html += '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    html += '<span style="color:var(--text-dim);font-size:0.8rem;">Status: <span style="color:' + 
        (round.status === 'completed' ? 'var(--accent)' : round.status === 'in_progress' ? 'var(--warning)' : 'var(--text-dim)') + 
        ';">' + (round.status || 'pending') + '</span></span>';
    html += '<span style="color:var(--text-dim);font-size:0.8rem;">Matches: ' + (round.matches ? round.matches.length : 0) + '</span>';
    html += '</div>';
    html += '<div style="margin-bottom:12px;padding:8px;background:var(--panel-alt);border-radius:6px;border:1px solid var(--border-soft);">';
    html += '<p style="font-size:0.7rem;color:var(--text-dim);">';
    html += '• <strong>Winners</strong> advance to the next round (if any).<br>';
    html += '• <strong>Losers</strong> are eliminated from the tournament.<br>';
    html += '• <strong>Non-winners</strong> (not winners or losers) get another chance in the next round.';
    html += '</p></div>';
    html += '</div>';
    
    if (round.matches && round.matches.length > 0) {
        html += '<div style="max-height:300px;overflow-y:auto;">';
        round.matches.forEach(function(match, matchIndex) {
            var matchStatus = match.status || 'pending';
            var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 
                              matchStatus === 'in_progress' ? 'var(--warning)' : 'var(--text-dim)';
            
            html += '<div style="background:var(--bg);border-radius:6px;padding:8px 12px;margin-bottom:6px;border-left:3px solid ' + statusColor + ';">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
            html += '<span style="font-size:0.75rem;font-weight:600;">Match ' + (matchIndex + 1) + '</span>';
            html += '<span style="font-size:0.65rem;color:' + statusColor + ';">' + matchStatus + '</span>';
            html += '</div>';
            
            if (match.participants) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
                match.participants.forEach(function(id) {
                    var name = getParticipantNameById(id, tourn);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    var style = '';
                    var label = name;
                    if (isWinner) {
                        style = 'border:1px solid var(--accent);background:var(--accent-soft);';
                        label += ' 🏆 Winner';
                    } else if (isLoser) {
                        style = 'border:1px solid var(--danger);background:var(--danger-soft);';
                        label += ' ❌ Loser';
                    } else if (matchStatus === 'completed') {
                        style = 'border:1px solid var(--warning);background:var(--warning-soft);';
                        label += ' ⬆️ Advances';
                    }
                    html += '<span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;' + style + '">' + label + '</span>';
                });
                html += '</div>';
            }
            
            // Winner selection buttons (only if not completed)
            if (matchStatus !== 'completed' && match.participants) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
                html += '<span style="font-size:0.6rem;color:var(--text-dim);">Set winners:</span>';
                match.participants.forEach(function(id) {
                    var name = getParticipantNameById(id, tourn);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    if (!isLoser) {
                        html += '<button class="small set-winner-in-round" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                            (isWinner ? 'border-color:var(--accent);color:var(--accent);' : '') + '">' + name + 
                            (isWinner ? ' ✓' : '') + '</button>';
                    }
                });
                html += '</div>';
                
                // Loser selection buttons
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">';
                html += '<span style="font-size:0.6rem;color:var(--text-dim);">Set losers (eliminated):</span>';
                match.participants.forEach(function(id) {
                    var name = getParticipantNameById(id, tourn);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    if (!isWinner) {
                        html += '<button class="small set-loser-in-round" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                            (isLoser ? 'border-color:var(--danger);color:var(--danger);' : '') + '">' + name + 
                            (isLoser ? ' ✕' : '') + '</button>';
                    }
                });
                html += '</div>';
            }
            
            // Match actions
            html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
            if (matchStatus !== 'completed') {
                html += '<button class="small primary complete-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">Complete Match</button>';
            }
            html += '<button class="small danger delete-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">✕</button>';
            html += '</div>';
            
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<p class="empty-state" style="padding:12px;">No matches in this round. Add matches to the round.</p>';
    }
    
    content.innerHTML = html;
    
    // Store context for match actions
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    
    // Set winner buttons
    content.querySelectorAll('.set-winner-in-round').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchWinner(tournId, rIdx, mIdx, participantId);
        });
    });
    
    // Set loser buttons
    content.querySelectorAll('.set-loser-in-round').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchLoser(tournId, rIdx, mIdx, participantId);
        });
    });
    
    // Complete match button
    content.querySelectorAll('.complete-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            completeMatch(tournId, rIdx, mIdx);
        });
    });
    
    // Delete match button
    content.querySelectorAll('.delete-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            if (confirm('Delete this match?')) {
                deleteMatch(tournId, rIdx, mIdx);
            }
        });
    });
    
    modal.dataset.tournId = tournId;
    modal.dataset.roundIndex = roundIndex;
    modal.classList.remove('hidden');
    
    // Show match details
    var closeBtn = document.getElementById('close-match-detail');
    if (closeBtn) {
        closeBtn.onclick = function() { modal.classList.add('hidden'); };
    }
    var cancelBtn = document.getElementById('cancel-match-detail');
    if (cancelBtn) {
        cancelBtn.onclick = function() { modal.classList.add('hidden'); };
    }
    var saveBtn = document.getElementById('save-match-detail');
    if (saveBtn) {
        saveBtn.onclick = function() { 
            modal.classList.add('hidden');
            viewTournament(tournId);
        };
    }
    modal.addEventListener('click', function(e) {
        if (e.target === this) modal.classList.add('hidden');
    });
}

/**
 * Toggle match winner status
 */
function toggleMatchWinner(tournId, roundIndex, matchIndex, participantId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    if (!match.winnerIds) match.winnerIds = [];
    
    var idx = match.winnerIds.indexOf(participantId);
    if (idx !== -1) {
        match.winnerIds.splice(idx, 1);
    } else {
        // Check if this participant is already a loser
        if (match.loserIds && match.loserIds.indexOf(participantId) !== -1) {
            alert('This participant is marked as a loser. Remove loser status first.');
            return;
        }
        match.winnerIds.push(participantId);
    }
    
    // If winners are set, mark as in_progress
    if (match.winnerIds.length > 0) {
        match.status = 'in_progress';
        round.status = 'in_progress';
        tourn.status = 'active';
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Toggle match loser status
 */
function toggleMatchLoser(tournId, roundIndex, matchIndex, participantId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    if (!match.loserIds) match.loserIds = [];
    
    var idx = match.loserIds.indexOf(participantId);
    if (idx !== -1) {
        match.loserIds.splice(idx, 1);
    } else {
        // Check if this participant is already a winner
        if (match.winnerIds && match.winnerIds.indexOf(participantId) !== -1) {
            alert('This participant is marked as a winner. Remove winner status first.');
            return;
        }
        match.loserIds.push(participantId);
    }
    
    // If losers are set, mark as in_progress
    if (match.loserIds.length > 0) {
        match.status = 'in_progress';
        round.status = 'in_progress';
        tourn.status = 'active';
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Complete a match
 */
function completeMatch(tournId, roundIndex, matchIndex) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    // Validate that all participants have a status
    var allParticipants = match.participants || [];
    var hasWinner = match.winnerIds && match.winnerIds.length > 0;
    var hasLoser = match.loserIds && match.loserIds.length > 0;
    
    // At least one winner and one loser needed for multiplayer
    if (!hasWinner) {
        alert('Please select at least one winner for this match.');
        return;
    }
    
    // Check that no participant is both winner and loser
    var both = false;
    if (match.winnerIds && match.loserIds) {
        match.winnerIds.forEach(function(wid) {
            if (match.loserIds.indexOf(wid) !== -1) both = true;
        });
    }
    if (both) {
        alert('A participant cannot be both winner and loser.');
        return;
    }
    
    // Mark match as completed
    match.status = 'completed';
    
    // If all matches in round are completed, mark round as completed
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    if (allCompleted) {
        round.status = 'completed';
        // Check if tournament is complete (no more rounds or all rounds completed)
        var allRoundsComplete = tourn.rounds.every(function(r) { return r.status === 'completed'; });
        if (allRoundsComplete) {
            tourn.status = 'completed';
            // Determine tournament winner
            determineTournamentWinner(tourn);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Determine tournament winner from completed rounds
 */
function determineTournamentWinner(tourn) {
    if (!tourn.rounds || tourn.rounds.length === 0) {
        tourn.winner = null;
        return;
    }
    
    // Get winners from the last completed round
    var lastRound = tourn.rounds[tourn.rounds.length - 1];
    if (lastRound.status !== 'completed') {
        tourn.winner = null;
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
    
    // If only one winner, that's the tournament winner
    if (winners.length === 1) {
        tourn.winner = winners[0];
        if (typeof logActivity === 'function') {
            var winnerName = getParticipantNameById(winners[0], tourn);
            logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + winnerName);
        }
    } else if (winners.length > 1) {
        // Multiple winners - store all as winner (for display)
        tourn.winner = winners[0]; // Primary winner
        tourn.winners = winners; // All winners
        if (typeof logActivity === 'function') {
            var names = winners.map(function(w) { return getParticipantNameById(w, tourn); });
            logActivity('Tournament ' + tourn.name + ' completed! Winners: ' + names.join(', '));
        }
    } else {
        tourn.winner = null;
    }
}

/**
 * Complete a round
 */
function completeRound(tournId, roundIndex) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    
    // Check if all matches are completed
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    if (!allCompleted) {
        alert('All matches in this round must be completed before completing the round.');
        return;
    }
    
    round.status = 'completed';
    
    // Check if tournament is complete
    var allRoundsComplete = tourn.rounds.every(function(r) { return r.status === 'completed'; });
    if (allRoundsComplete) {
        tourn.status = 'completed';
        determineTournamentWinner(tourn);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Delete a round
 */
function deleteRound(tournId, roundIndex) {
    if (!confirm('Delete this round and all its matches?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds) return;
    
    tourn.rounds.splice(roundIndex, 1);
    // Renumber rounds
    tourn.rounds.forEach(function(r, idx) {
        r.roundNumber = idx + 1;
    });
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Delete a match from a round
 */
function deleteMatch(tournId, roundIndex, matchIndex) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    round.matches.splice(matchIndex, 1);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Add a round to the tournament
 */
function addRound() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    if (!tourn.rounds) tourn.rounds = [];
    
    var roundNumber = tourn.rounds.length + 1;
    var roundLabel = String.fromCharCode(65 + tourn.rounds.length);
    
    // Get available participants (not eliminated, not already in this round)
    var availableParticipants = [];
    if (tourn.participants) {
        tourn.participants.forEach(function(p) {
            var charId = p.characterId;
            // Check if not eliminated
            var isEliminated = false;
            if (tourn.eliminations) {
                tourn.eliminations.forEach(function(elim) {
                    if (String(elim.characterId) === String(charId)) {
                        var elimWeek = parseInt(elim.week);
                        if (!isNaN(elimWeek) && elimWeek <= parseInt(tourn.startWeek)) {
                            isEliminated = true;
                        }
                    }
                });
            }
            // Check if already in this round
            var inRound = false;
            tourn.rounds.forEach(function(r) {
                if (r.matches) {
                    r.matches.forEach(function(m) {
                        if (m.participants && m.participants.some(function(id) { return String(id) === String(charId); })) {
                            if (m.status === 'completed') {
                                // Check if loser - if loser, eliminated
                                if (m.loserIds && m.loserIds.some(function(id) { return String(id) === String(charId); })) {
                                    isEliminated = true;
                                }
                                inRound = true;
                            }
                        }
                    });
                }
            });
            
            if (!isEliminated && !inRound) {
                availableParticipants.push(charId);
            }
        });
    }
    
    if (availableParticipants.length < 2) {
        alert('Not enough available participants for a new round. Need at least 2 participants.');
        return;
    }
    
    // Show match creation modal for the round
    showRoundMatchCreator(tournId, roundNumber, availableParticipants);
}

/**
 * Show round match creator
 */
function showRoundMatchCreator(tournId, roundNumber, availableParticipants) {
    var modal = document.getElementById('match-detail-modal');
    document.getElementById('match-detail-title').textContent = 'Create Matches - Round ' + String.fromCharCode(64 + roundNumber);
    
    var content = document.getElementById('match-detail-content');
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Available participants: ' + availableParticipants.length + '</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    availableParticipants.forEach(function(id) {
        var name = getParticipantNameById(id, null);
        html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;">' + name + '</span>';
    });
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Match Type:</label>';
    html += '<select id="new-match-type" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;width:auto;">';
    html += '<option value="2">1v1 (2 players)</option>';
    html += '<option value="3">1v1v1 (3 players)</option>';
    html += '<option value="4">1v1v1v1 (4 players)</option>';
    html += '</select>';
    html += '</div>';
    
    html += '<div id="new-match-participants" style="margin-bottom:12px;">';
    // Will be populated by JS
    html += '</div>';
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">';
    html += '<button id="add-participant-to-match" class="small secondary">+ Add Participant</button>';
    html += '</div>';
    
    html += '<div class="form-actions" style="margin-top:8px;">';
    html += '<button type="button" id="cancel-match-creator" class="secondary">Cancel</button>';
    html += '<button type="button" id="save-match-creator" class="primary">Create Matches</button>';
    html += '</div>';
    
    content.innerHTML = html;
    
    // Populate initial participants
    var participantsContainer = document.getElementById('new-match-participants');
    var selectedIds = [];
    
    function updateParticipantSelects() {
        var matchType = parseInt(document.getElementById('new-match-type').value) || 2;
        var available = availableParticipants.filter(function(id) {
            return selectedIds.indexOf(id) === -1;
        });
        
        var html = '';
        for (var i = 0; i < matchType; i++) {
            html += '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">';
            html += '<select class="match-participant-select" data-index="' + i + '" style="flex:1;padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;">';
            html += '<option value="">Select participant...</option>';
            available.forEach(function(id) {
                var name = getParticipantNameById(id, null);
                var selected = selectedIds[i] === id ? 'selected' : '';
                html += '<option value="' + id + '" ' + selected + '>' + name + '</option>';
            });
            html += '</select>';
            if (i > 0) {
                html += '<button class="small danger remove-participant-btn" data-index="' + i + '">✕</button>';
            }
            html += '</div>';
        }
        participantsContainer.innerHTML = html;
        
        // Update selectedIds from selects
        participantsContainer.querySelectorAll('.match-participant-select').forEach(function(sel) {
            sel.onchange = function() {
                var idx = parseInt(this.dataset.index);
                if (this.value) {
                    selectedIds[idx] = this.value;
                } else {
                    delete selectedIds[idx];
                }
                updateParticipantSelects();
            };
        });
        
        participantsContainer.querySelectorAll('.remove-participant-btn').forEach(function(btn) {
            btn.onclick = function() {
                var idx = parseInt(this.dataset.index);
                delete selectedIds[idx];
                // Rebuild selectors with updated selectedIds
                updateParticipantSelects();
            };
        });
    }
    
    updateParticipantSelects();
    
    // Add participant button
    var addBtn = document.getElementById('add-participant-to-match');
    if (addBtn) {
        addBtn.onclick = function() {
            var available = availableParticipants.filter(function(id) {
                return selectedIds.indexOf(id) === -1;
            });
            if (available.length === 0) {
                alert('No more participants available.');
                return;
            }
            // Add a new slot
            var matchType = parseInt(document.getElementById('new-match-type').value) || 2;
            var currentCount = Object.keys(selectedIds).length;
            if (currentCount >= matchType) {
                alert('Match type allows only ' + matchType + ' participants.');
                return;
            }
            // Find first available participant
            var firstAvailable = available[0];
            selectedIds[currentCount] = firstAvailable;
            updateParticipantSelects();
        };
    }
    
    // Cancel button
    var cancelBtn = document.getElementById('cancel-match-creator');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            modal.classList.add('hidden');
        };
    }
    
    // Save button
    var saveBtn = document.getElementById('save-match-creator');
    if (saveBtn) {
        saveBtn.onclick = function() {
            var participantIds = [];
            participantsContainer.querySelectorAll('.match-participant-select').forEach(function(sel) {
                if (sel.value) {
                    participantIds.push(sel.value);
                }
            });
            
            if (participantIds.length < 2) {
                alert('Please select at least 2 participants for the match.');
                return;
            }
            
            // Create the round and match
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
            if (!tourn) return;
            
            if (!tourn.rounds) tourn.rounds = [];
            
            // Check if round already exists
            var existingRound = tourn.rounds.find(function(r) { return r.roundNumber === roundNumber; });
            if (existingRound) {
                // Add match to existing round
                if (!existingRound.matches) existingRound.matches = [];
                existingRound.matches.push({
                    participants: participantIds,
                    winnerIds: [],
                    loserIds: [],
                    status: 'pending',
                    roundNumber: roundNumber
                });
            } else {
                // Create new round
                tourn.rounds.push({
                    roundNumber: roundNumber,
                    status: 'pending',
                    matches: [{
                        participants: participantIds,
                        winnerIds: [],
                        loserIds: [],
                        status: 'pending',
                        roundNumber: roundNumber
                    }]
                });
            }
            
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            modal.classList.add('hidden');
            viewTournament(tournId);
        };
    }
    
    // Match type change
    var typeSelect = document.getElementById('new-match-type');
    if (typeSelect) {
        typeSelect.onchange = function() {
            // Reset selectedIds
            selectedIds = [];
            updateParticipantSelects();
        };
    }
    
    modal.dataset.tournId = tournId;
    modal.classList.remove('hidden');
}

/**
 * Render matches (legacy - for teams mode)
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
 * Add match (legacy - for teams mode)
 */
function addMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
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
 * Set match winner (legacy - for teams mode)
 */
function setMatchWinner(tournId, matchIndex, winnerId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    tourn.matches[matchIndex].winner = winnerId;
    updateTournamentWinner(tourn);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove match (legacy - for teams mode)
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
 * Update tournament winner (legacy - for teams mode)
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
            var winnerTeam = data.teams.find(function(t) { return String(t.id) === String(lastWinner); });
            logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + (winnerTeam ? winnerTeam.name : 'Unknown'));
        }
    } else {
        tourn.winner = null;
        tourn.status = 'active';
    }
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
    
    // Remove from rounds
    if (tourn.rounds) {
        tourn.rounds.forEach(function(round) {
            if (round.matches) {
                round.matches = round.matches.filter(function(m) {
                    return !m.participants || !m.participants.some(function(id) { return String(id) === String(charId); });
                });
            }
        });
        // Remove empty rounds
        tourn.rounds = tourn.rounds.filter(function(r) { return r.matches && r.matches.length > 0; });
    }
    
    if (tourn.winner && String(tourn.winner) === String(charId)) {
        tourn.winner = null;
        tourn.status = 'active';
    }
    
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
        var charName = char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var teamName = '';
        if (elim.teamId) {
            var team = data.teams.find(function(t) { return String(t.id) === String(elim.teamId); });
            if (team) teamName = ' (' + team.name + ')';
        }
        var standaloneLabel = elim.standalone ? ' [Standalone]' : '';
        var reasonLabel = elim.reason ? ' - ' + elim.reason : '';
        var fromMatchLabel = elim.fromMatch ? ' (Match)' : '';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--danger-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid ' + (elim.standalone ? 'var(--warning)' : 'var(--danger)') + ';">';
        html += '<span style="font-size:0.75rem;"><strong>' + charName + '</strong>' + teamName + standaloneLabel + fromMatchLabel + ' - Week ' + elim.week + reasonLabel + '</span>';
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
        fromMatch: false,
        reason: 'Eliminated from tournament'
    });
    
    // Mark character as eliminated (add to eliminatedWeeks)
    if (char) {
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        if (char.eliminatedWeeks.indexOf(week) === -1) {
            char.eliminatedWeeks.push(week);
        }
        if (!char.eliminations) char.eliminations = [];
        char.eliminations.push({
            tournamentId: tournId,
            week: week,
            reason: 'Eliminated from tournament: ' + tourn.name,
            standalone: false,
            fromMatch: false
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
            var name = winnerChar ? [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
            // Check if multiple winners
            if (tourn.winners && tourn.winners.length > 1) {
                var names = tourn.winners.map(function(w) {
                    var c = data.characters.find(function(ch) { return String(ch.id) === String(w); });
                    return c ? [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                });
                container.innerHTML = '★ ' + names.join(', ');
            } else {
                container.innerHTML = '★ ' + name;
            }
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
    
    // Add round button
    var addRoundBtn = document.getElementById('add-round-btn');
    if (addRoundBtn) {
        addRoundBtn.addEventListener('click', addRound);
    }
    
    // Auto-generate rounds button
    var autoGenBtn = document.getElementById('auto-generate-rounds-btn');
    if (autoGenBtn) {
        autoGenBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
            if (tourn) {
                autoGenerateRounds(tournId);
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
                    populateEliminationSelector(tourn);
                }
            }
        });
    }
    
    // Add match (legacy - teams mode)
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

/**
 * Auto-generate rounds for a tournament
 * This creates balanced matches based on participants
 */
function autoGenerateRounds(tournId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    if (tourn.mode !== 'individuals') {
        alert('Auto-generate rounds is only available for individual tournaments.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants to generate rounds.');
        return;
    }
    
    // Check if rounds already exist
    if (tourn.rounds && tourn.rounds.length > 0) {
        if (!confirm('This tournament already has rounds. Overwrite them?')) return;
    }
    
    tourn.rounds = [];
    
    var participantIds = tourn.participants.map(function(p) { return p.characterId; });
    var matchSize = 3; // Default to 1v1v1 for more interesting matches
    var numMatches = Math.ceil(participantIds.length / matchSize);
    
    // Shuffle participants
    var shuffled = participantIds.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    // Create round 1
    var round1 = {
        roundNumber: 1,
        status: 'pending',
        matches: []
    };
    
    for (var i = 0; i < shuffled.length; i += matchSize) {
        var matchParticipants = shuffled.slice(i, i + matchSize);
        if (matchParticipants.length < 2) {
            // If odd number, add to last match
            if (round1.matches.length > 0) {
                round1.matches[round1.matches.length - 1].participants = 
                    round1.matches[round1.matches.length - 1].participants.concat(matchParticipants);
            }
            continue;
        }
        round1.matches.push({
            participants: matchParticipants,
            winnerIds: [],
            loserIds: [],
            status: 'pending',
            roundNumber: 1
        });
    }
    
    tourn.rounds.push(round1);
    tourn.status = 'active';
    
    if (typeof logActivity === 'function') {
        logActivity('Auto-generated rounds for tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
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
window.addRound = addRound;
window.showRoundMatchesModal = showRoundMatchesModal;
window.completeRound = completeRound;
window.deleteRound = deleteRound;
window.deleteMatch = deleteMatch;
window.completeMatch = completeMatch;
window.toggleMatchWinner = toggleMatchWinner;
window.toggleMatchLoser = toggleMatchLoser;
window.addMatch = addMatch;
window.removeMatch = removeMatch;
window.setMatchWinner = setMatchWinner;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.updateTournamentWinner = updateTournamentWinner;
window.populateTeamSelector = populateTeamSelector;
window.populateCharacterSelector = populateCharacterSelector;
window.populateEliminationSelector = populateEliminationSelector;
window.renderTournamentTeams = renderTournamentTeams;
window.renderTournamentCharacters = renderTournamentCharacters;
window.renderRounds = renderRounds;
window.renderMatches = renderMatches;
window.renderEliminations = renderEliminations;
window.renderWinner = renderWinner;
window.initTournamentEvents = initTournamentEvents;
window.autoGenerateRounds = autoGenerateRounds;
window.tournamentState = tournamentState;
