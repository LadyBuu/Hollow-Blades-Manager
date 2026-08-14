/**
 * tournaments.js - Tournament Management
 * Handles tournament creation, team selection, match management, and eliminations
 * Supports both Team and Single-Player modes
 * Winner is determined by match results - last match winner becomes tournament winner
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
                <span>Mode</span>
                <span>Weeks</span>
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
                            <label>Tournament Mode</label>
                            <select id="tournament-mode">
                                <option value="team">Team Tournament</option>
                                <option value="single">Single-Player Tournament</option>
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
                    
                    <!-- Team/Individual Selection -->
                    <div id="participant-selection-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">${document.getElementById('tournament-mode')?.value === 'single' ? 'Add Participants' : 'Select Teams'}</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="participant-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select ${document.getElementById('tournament-mode')?.value === 'single' ? 'character...' : 'team...'}</option>
                            </select>
                            <button id="add-participant-btn" class="primary small">Add</button>
                            <button id="refresh-participants-btn" class="secondary small">Refresh</button>
                        </div>
                        <div style="margin-top:4px;font-size:0.7rem;color:var(--text-dim);">
                            ${document.getElementById('tournament-mode')?.value === 'single' ? 
                                'Only non-civilian characters are shown. Eliminated or deceased characters cannot be added.' : 
                                'Only academic teams active in the tournament\'s week range are shown.'}
                        </div>
                        <div id="participants-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- Team-only: Add Teams (legacy) -->
                    <div id="team-selection-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);display:none;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Add Teams</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="tournament-team-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select a team...</option>
                            </select>
                            <button id="add-team-to-tournament" class="primary small">Add Team</button>
                        </div>
                        <div id="tournament-teams-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- Matches Section -->
                    <div id="matches-section" style="margin-bottom:16px;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Matches</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <select id="match-participant1" style="flex:1;min-width:100px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Participant 1</option>
                            </select>
                            <span style="color:var(--text-dim);">vs</span>
                            <select id="match-participant2" style="flex:1;min-width:100px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Participant 2</option>
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
                            <select id="elim-participant-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select participant...</option>
                            </select>
                            <button id="add-elimination-btn" class="danger small">Eliminate</button>
                            <button id="remove-elimination-btn" class="secondary small">Remove Selected</button>
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px;">
                            Eliminated participants cannot be added to new teams from this week onward (individuals) or their team members are affected.
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
        var participantCount = tourn.mode === 'single' ? 
            (tourn.participants ? tourn.participants.length : 0) : 
            (tourn.teams ? tourn.teams.length : 0);
        
        var modeLabel = tourn.mode === 'single' ? 'Single' : 'Team';
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
            if (tourn.mode === 'single') {
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
            '<span style="font-size:0.75rem;">' + modeLabel + '</span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
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
            document.getElementById('tournament-mode').value = tourn.mode || 'team';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '1';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '4';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'New Tournament';
        form.reset();
        document.getElementById('tournament-mode').value = 'team';
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
        mode: document.getElementById('tournament-mode').value || 'team',
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
            // Preserve existing data
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
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    // Info
    var info = document.getElementById('tournament-info');
    var winnerDisplay = '';
    if (tourn.winner) {
        if (tourn.mode === 'single') {
            var winnerChar = data.characters.find(function(c) { return String(c.id) === String(tourn.winner); });
            if (winnerChar) {
                winnerDisplay = ' | Winner: <span style="color:var(--accent);font-weight:600;">' + [winnerChar.firstName, winnerChar.lastName].filter(function(n) { return n; }).join(' ') + '</span>';
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
    
    var modeLabel = tourn.mode === 'single' ? 'Single-Player' : 'Team';
    
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">Mode: ' + modeLabel + 
        ' | Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + 
        (tourn.academicYear ? ' | ' + tourn.academicYear : '') + 
        ' | Status: <span style="color:' + statusColor + ';font-weight:600;">' + (tourn.status || 'active') + '</span>' +
        winnerDisplay + '</span>';
    
    // Show/hide appropriate sections based on mode
    var teamSection = document.getElementById('team-selection-section');
    var participantSection = document.getElementById('participant-selection-section');
    
    if (tourn.mode === 'single') {
        if (teamSection) teamSection.style.display = 'none';
        if (participantSection) {
            participantSection.style.display = 'block';
            // Update the label
            var label = participantSection.querySelector('h4');
            if (label) label.textContent = 'Add Participants';
        }
    } else {
        if (teamSection) teamSection.style.display = 'block';
        if (participantSection) {
            participantSection.style.display = 'block';
            var label = participantSection.querySelector('h4');
            if (label) label.textContent = 'Select Teams';
        }
    }
    
    // Populate selectors
    populateParticipantSelector(tourn);
    populateMatchSelectors(tourn);
    populateEliminationSelector(tourn);
    if (tourn.mode === 'team') {
        populateTeamSelector(tourn);
    }
    
    // Render sections
    renderParticipants(tourn);
    if (tourn.mode === 'team') {
        renderTournamentTeams(tourn);
    }
    renderMatches(tourn);
    renderEliminations(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

/**
 * Populate participant selector (for both team and single modes)
 */
function populateParticipantSelector(tourn) {
    var select = document.getElementById('participant-select');
    if (!select) return;
    
    var startWeek = parseInt(tourn.startWeek) || 1;
    var endWeek = parseInt(tourn.endWeek) || 4;
    
    // Get already added participants
    var existingIds = (tourn.participants || []).map(function(p) { return p.id; });
    
    if (tourn.mode === 'single') {
        // Single mode: show non-civilian characters
        var chars = data.characters.filter(function(c) {
            if (c.deceased) return false;
            var status = getCurrentStatus(c).toLowerCase();
            if (status === 'civilian' || status === '') return false;
            // Check if already in tournament
            if (existingIds.some(function(id) { return String(id) === String(c.id); })) return false;
            // Check if eliminated during this time
            if (c.eliminatedWeeks) {
                for (var i = 0; i < c.eliminatedWeeks.length; i++) {
                    var elimWeek = parseInt(c.eliminatedWeeks[i]);
                    if (!isNaN(elimWeek) && elimWeek >= startWeek && elimWeek <= endWeek) {
                        return false;
                    }
                }
            }
            return true;
        });
        
        select.innerHTML = '<option value="">Select character...</option>';
        chars.forEach(function(c) {
            var option = document.createElement('option');
            option.value = 'char_' + c.id;
            var name = [c.firstName, c.middleName, c.lastName].filter(function(n) { return n; }).join(' ');
            var status = getCurrentStatus(c);
            option.textContent = name + ' [' + status + ']';
            select.appendChild(option);
        });
        
        if (chars.length === 0) {
            select.innerHTML += '<option value="" disabled>No available characters</option>';
        }
    } else {
        // Team mode: show academic teams
        var allTeams = data.teams.filter(function(t) {
            if (t.type !== 'academic') return false;
            if (t.status === 'deleted' || t.status === 'inactive') return false;
            var start = parseInt(t.startPeriod);
            var end = parseInt(t.endPeriod);
            if (isNaN(start)) return true;
            return start <= endWeek && (isNaN(end) || end >= startWeek);
        });
        
        var available = allTeams.filter(function(t) {
            return !existingIds.some(function(id) { return String(id) === String(t.id); });
        });
        
        select.innerHTML = '<option value="">Select team...</option>';
        available.forEach(function(team) {
            var option = document.createElement('option');
            option.value = 'team_' + team.id;
            var rankDisplay = team.currentRank ? ' (#' + team.currentRank + ')' : '';
            option.textContent = team.name + rankDisplay;
            select.appendChild(option);
        });
        
        if (available.length === 0) {
            select.innerHTML += '<option value="" disabled>No available teams</option>';
        }
    }
}

/**
 * Populate team selector (legacy - for team mode)
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
    var select1 = document.getElementById('match-participant1');
    var select2 = document.getElementById('match-participant2');
    
    var participants = tourn.participants || [];
    var options = '<option value="">Select...</option>';
    
    if (tourn.mode === 'single') {
        participants.forEach(function(p) {
            var char = data.characters.find(function(c) { return String(c.id) === String(p.id); });
            if (char) {
                var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                options += '<option value="char_' + p.id + '">' + name + '</option>';
            }
        });
    } else {
        participants.forEach(function(p) {
            var team = data.teams.find(function(t) { return String(t.id) === String(p.id); });
            if (team) {
                options += '<option value="team_' + p.id + '">' + team.name + '</option>';
            }
        });
    }
    
    select1.innerHTML = options;
    select2.innerHTML = options;
}

/**
 * Populate elimination selector
 */
function populateEliminationSelector(tourn) {
    var select = document.getElementById('elim-participant-select');
    if (!select) return;
    
    var participants = tourn.participants || [];
    var alreadyEliminated = (tourn.eliminations || []).map(function(e) { return e.participantId; });
    var currentWeek = parseInt(tourn.startWeek) || 1;
    
    var options = '<option value="">Select participant...</option>';
    
    if (tourn.mode === 'single') {
        participants.forEach(function(p) {
            var char = data.characters.find(function(c) { return String(c.id) === String(p.id); });
            if (char && !alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) {
                // Check if character is deceased
                if (char.deceased) return;
                // Check if already eliminated in this tournament
                var isEliminated = false;
                if (char.eliminatedWeeks) {
                    for (var i = 0; i < char.eliminatedWeeks.length; i++) {
                        if (parseInt(char.eliminatedWeeks[i]) <= currentWeek) {
                            isEliminated = true;
                            break;
                        }
                    }
                }
                if (!isEliminated) {
                    var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                    var status = getCurrentStatus(char);
                    options += '<option value="' + char.id + '">' + name + ' [' + status + ']</option>';
                }
            }
        });
    } else {
        // Team mode: show characters from teams
        var teams = tourn.teams || [];
        var addedChars = [];
        
        teams.forEach(function(entry) {
            var team = data.teams.find(function(t) { return String(t.id) === String(entry.teamId); });
            if (team && team.members) {
                team.members.forEach(function(member) {
                    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                    if (char && !alreadyEliminated.some(function(id) { return String(id) === String(char.id); })) {
                        if (char.deceased) return;
                        if (addedChars.some(function(id) { return String(id) === String(char.id); })) return;
                        // Check if eliminated
                        var isEliminated = false;
                        if (char.eliminatedWeeks) {
                            for (var i = 0; i < char.eliminatedWeeks.length; i++) {
                                if (parseInt(char.eliminatedWeeks[i]) <= currentWeek) {
                                    isEliminated = true;
                                    break;
                                }
                            }
                        }
                        if (!isEliminated) {
                            var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                            addedChars.push(char.id);
                            options += '<option value="' + char.id + '">' + name + ' (' + team.name + ')</option>';
                        }
                    }
                });
            }
        });
    }
    
    select.innerHTML = options;
    if (select.options.length <= 1) {
        select.innerHTML += '<option value="" disabled>No participants available</option>';
    }
}

/**
 * Render participants
 */
function renderParticipants(tourn) {
    var container = document.getElementById('participants-list');
    if (!tourn.participants || tourn.participants.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No participants added</p>';
        return;
    }
    
    var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    tourn.participants.forEach(function(p) {
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { 
            return String(e.participantId) === String(p.id) && e.participantType === p.type; 
        });
        
        var name = '';
        if (tourn.mode === 'single') {
            var char = data.characters.find(function(c) { return String(c.id) === String(p.id); });
            if (char) {
                name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                var status = getCurrentStatus(char);
                name += ' [' + status + ']';
            }
        } else {
            var team = data.teams.find(function(t) { return String(t.id) === String(p.id); });
            if (team) name = team.name;
        }
        
        if (!name) name = 'Unknown';
        
        html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ' + (isEliminated ? 'var(--danger)' : 'var(--border)') + ';">';
        html += name + (isEliminated ? ' ✕' : '');
        html += ' <button class="remove-participant small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + p.id + '">✕</button>';
        html += '</span>';
    });
    html += '</div>';
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-participant').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeParticipant(tourn.id, this.dataset.id);
        });
    });
}

/**
 * Render tournament teams (team mode only)
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
 * Add participant (for both modes)
 */
function addParticipant() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var value = document.getElementById('participant-select').value;
    if (!value) { alert('Please select a participant.'); return; }
    
    var parts = value.split('_');
    var type = parts[0];
    var id = parts[1];
    
    if (!tourn.participants) tourn.participants = [];
    
    if (tourn.participants.some(function(p) { return String(p.id) === String(id) && p.type === type; })) {
        alert('Participant already added.');
        return;
    }
    
    tourn.participants.push({ type: type, id: id });
    
    // If team mode, also add to teams array
    if (tourn.mode === 'team' && type === 'team') {
        if (!tourn.teams) tourn.teams = [];
        if (!tourn.teams.some(function(t) { return String(t.teamId) === String(id); })) {
            tourn.teams.push({ teamId: id, seed: tourn.teams.length + 1 });
        }
    }
    
    if (typeof logActivity === 'function') {
        var name = '';
        if (type === 'char') {
            var char = data.characters.find(function(c) { return String(c.id) === String(id); });
            if (char) name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        } else {
            var team = data.teams.find(function(t) { return String(t.id) === String(id); });
            if (team) name = team.name;
        }
        logActivity('Added ' + (name || 'participant') + ' to tournament: ' + tourn.name);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove participant
 */
function removeParticipant(tournId, participantId) {
    if (!confirm('Remove this participant from the tournament?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    tourn.participants = tourn.participants.filter(function(p) { return String(p.id) !== String(participantId); });
    
    // Also remove from teams if in team mode
    if (tourn.mode === 'team') {
        tourn.teams = tourn.teams.filter(function(t) { return String(t.teamId) !== String(participantId); });
    }
    
    // Remove from matches
    if (tourn.matches) {
        tourn.matches = tourn.matches.filter(function(m) {
            return String(m.participant1Id) !== String(participantId) && String(m.participant2Id) !== String(participantId);
        });
    }
    
    // If this was the winner, clear it
    if (tourn.winner && String(tourn.winner) === String(participantId)) {
        tourn.winner = null;
        tourn.status = 'active';
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Removed participant from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove team from tournament (team mode only)
 */
function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    tourn.teams = tourn.teams.filter(function(t) { return String(t.teamId) !== String(teamId); });
    tourn.participants = tourn.participants.filter(function(p) { return String(p.id) !== String(teamId); });
    
    if (tourn.matches) {
        tourn.matches = tourn.matches.filter(function(m) {
            return String(m.participant1Id) !== String(teamId) && String(m.participant2Id) !== String(teamId);
        });
    }
    
    if (tourn.winner && String(tourn.winner) === String(teamId)) {
        tourn.winner = null;
        tourn.status = 'active';
    }
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Removed team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Add team to tournament (team mode only)
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
    
    if (!tourn.participants) tourn.participants = [];
    if (!tourn.participants.some(function(p) { return String(p.id) === String(teamId) && p.type === 'team'; })) {
        tourn.participants.push({ type: 'team', id: teamId });
    }
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (typeof logActivity === 'function') {
        logActivity('Added team ' + (team ? team.name : '') + ' to tournament: ' + tourn.name);
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
        var p1Name = getParticipantDisplayName(match.participant1Id, tourn);
        var p2Name = getParticipantDisplayName(match.participant2Id, tourn);
        var winnerName = match.winner ? getParticipantDisplayName(match.winner, tourn) : 'TBD';
        
        var winnerClass = match.winner ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-dim);';
        
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px;flex-wrap:wrap;gap:4px;border-left:3px solid ' + (match.winner ? 'var(--accent)' : 'var(--border)') + ';">';
        html += '<span style="font-size:0.8rem;"><strong>' + p1Name + '</strong> vs <strong>' + p2Name + '</strong></span>';
        html += '<span style="' + winnerClass + 'font-size:0.8rem;">Winner: ' + winnerName + '</span>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-participant="' + match.participant1Id + '">' + p1Name + '</button>';
        html += '<button class="set-winner-btn small primary" data-index="' + index + '" data-participant="' + match.participant2Id + '">' + p2Name + '</button>';
        html += '<button class="remove-match-btn small danger" data-index="' + index + '">✕</button>';
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            setMatchWinner(tourn.id, parseInt(this.dataset.index), this.dataset.participant);
        });
    });
    container.querySelectorAll('.remove-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeMatch(tourn.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Get display name for a participant
 */
function getParticipantDisplayName(id, tourn) {
    if (!id) return 'Unknown';
    if (tourn.mode === 'single') {
        var char = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (char) {
            return [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        }
    } else {
        var team = data.teams.find(function(t) { return String(t.id) === String(id); });
        if (team) return team.name;
        // Also check participants for characters in team mode
        var char = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (char) {
            return [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        }
    }
    return 'Unknown';
}

/**
 * Add match
 */
function addMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn) return;
    
    var p1Value = document.getElementById('match-participant1').value;
    var p2Value = document.getElementById('match-participant2').value;
    
    if (!p1Value || !p2Value) { alert('Please select both participants.'); return; }
    if (p1Value === p2Value) { alert('Participants must be different.'); return; }
    
    var p1Parts = p1Value.split('_');
    var p2Parts = p2Value.split('_');
    var p1Id = p1Parts[1];
    var p2Id = p2Parts[1];
    
    if (!tourn.matches) tourn.matches = [];
    
    // Check if match already exists
    var exists = tourn.matches.some(function(m) {
        return (String(m.participant1Id) === String(p1Id) && String(m.participant2Id) === String(p2Id)) ||
               (String(m.participant1Id) === String(p2Id) && String(m.participant2Id) === String(p1Id));
    });
    if (exists) { alert('This match already exists.'); return; }
    
    tourn.matches.push({
        participant1Id: p1Id,
        participant2Id: p2Id,
        winner: null
    });
    
    if (typeof logActivity === 'function') {
        var p1Name = getParticipantDisplayName(p1Id, tourn);
        var p2Name = getParticipantDisplayName(p2Id, tourn);
        logActivity('Added match: ' + p1Name + ' vs ' + p2Name + ' to tournament: ' + tourn.name);
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
function setMatchWinner(tournId, matchIndex, participantId) {
    var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    tourn.matches[matchIndex].winner = participantId;
    
    if (typeof logActivity === 'function') {
        var name = getParticipantDisplayName(participantId, tourn);
        logActivity('Set winner for match in tournament: ' + tourn.name + ' - ' + name);
    }
    
    updateTournamentWinner(tourn);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Update tournament winner based on the last match winner
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
            var name = getParticipantDisplayName(lastWinner, tourn);
            logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + name);
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
        var name = getParticipantDisplayName(elim.participantId, tourn);
        var teamName = '';
        if (tourn.mode === 'team') {
            // Find the team this character belongs to
            var char = data.characters.find(function(c) { return String(c.id) === String(elim.participantId); });
            if (char) {
                data.teams.forEach(function(team) {
                    if (team.members) {
                        team.members.forEach(function(member) {
                            if (String(member.characterId) === String(char.id)) {
                                teamName = team.name;
                            }
                        });
                    }
                });
            }
        }
        
        var teamDisplay = teamName ? ' (' + teamName + ')' : '';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--danger-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid var(--danger);">';
        html += '<span style="font-size:0.75rem;"><strong>' + name + '</strong>' + teamDisplay + ' - Week ' + elim.week + '</span>';
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
    
    var participantId = document.getElementById('elim-participant-select').value;
    var week = parseInt(document.getElementById('elim-week').value) || 1;
    
    if (!participantId) { alert('Please select a participant to eliminate.'); return; }
    
    if (!tourn.eliminations) tourn.eliminations = [];
    
    if (tourn.eliminations.some(function(e) { return String(e.participantId) === String(participantId); })) {
        alert('This participant is already eliminated.');
        return;
    }
    
    tourn.eliminations.push({
        participantId: participantId,
        week: week
    });
    
    // Mark character as eliminated (add to eliminatedWeeks)
    var char = data.characters.find(function(c) { return String(c.id) === String(participantId); });
    if (char) {
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        if (char.eliminatedWeeks.indexOf(week) === -1) {
            char.eliminatedWeeks.push(week);
        }
    }
    
    var name = getParticipantDisplayName(participantId, tourn);
    if (typeof logActivity === 'function') {
        logActivity('Eliminated ' + name + ' from tournament: ' + tourn.name + ' (Week ' + week + ')');
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
    var char = data.characters.find(function(c) { return String(c.id) === String(elim.participantId); });
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
        var name = getParticipantDisplayName(tourn.winner, tourn);
        container.innerHTML = '★ ' + name;
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
    
    // Add participant
    var addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', addParticipant);
    }
    
    // Refresh participants
    var refreshBtn = document.getElementById('refresh-participants-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            if (tournId) {
                var tourn = data.tournaments.find(function(t) { return String(t.id) === String(tournId); });
                if (tourn) {
                    populateParticipantSelector(tourn);
                    populateMatchSelectors(tourn);
                    populateEliminationSelector(tourn);
                }
            }
        });
    }
    
    // Add team to tournament (team mode)
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
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
            
            var select = document.getElementById('elim-participant-select');
            var selectedValue = select.value;
            if (!selectedValue) { alert('Please select a participant to remove from eliminations.'); return; }
            if (!confirm('Remove this participant from eliminations?')) return;
            
            var index = tourn.eliminations.findIndex(function(e) { return String(e.participantId) === String(selectedValue); });
            if (index === -1) { alert('Participant not found in eliminations.'); return; }
            
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
window.addParticipant = addParticipant;
window.removeParticipant = removeParticipant;
window.addTeamToTournament = addTeamToTournament;
window.removeTeamFromTournament = removeTeamFromTournament;
window.addMatch = addMatch;
window.removeMatch = removeMatch;
window.setMatchWinner = setMatchWinner;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.updateTournamentWinner = updateTournamentWinner;
window.getParticipantDisplayName = getParticipantDisplayName;
window.populateParticipantSelector = populateParticipantSelector;
window.populateMatchSelectors = populateMatchSelectors;
window.populateEliminationSelector = populateEliminationSelector;
window.populateTeamSelector = populateTeamSelector;
window.renderParticipants = renderParticipants;
window.renderTournamentTeams = renderTournamentTeams;
window.renderMatches = renderMatches;
window.renderEliminations = renderEliminations;
window.renderWinner = renderWinner;
window.initTournamentEvents = initTournamentEvents;
window.tournamentState = tournamentState;
