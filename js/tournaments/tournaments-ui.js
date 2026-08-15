/**
 * tournaments-ui.js - Tournament UI Rendering
 * Main view rendering and event handling
 */

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
            <div class="modal-content" style="max-width:550px;">
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

    renderTournamentsList();
    initTournamentEvents();
}

/**
 * Render tournaments list
 */
function renderTournamentsList() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    
    var tournaments = getTournaments();
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }
    
    var html = '';
    tournaments.forEach(function(tourn) {
        var participantCount = 0;
        var modeLabel = 'Teams';
        if (tourn.mode === 'individuals') {
            modeLabel = 'Individuals';
            participantCount = tourn.participants ? tourn.participants.length : 0;
        } else {
            participantCount = tourn.teams ? tourn.teams.length : 0;
        }
        
        var statusColor = getTournamentStatusColor(tourn.status);
        var weekDisplay = 'Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?');
        var winnerDisplay = '';
        var winnerName = getTournamentWinnerDisplay(tourn);
        if (winnerName) {
            winnerDisplay = ' \u2605 ' + winnerName;
        }
        
        var roundCount = tourn.rounds ? tourn.rounds.length : 0;
        var roundsDisplay = tourn.mode === 'individuals' ? ' | ' + roundCount + ' rounds' : '';
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong>' + winnerDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + modeLabel + roundsDisplay + '</span>' +
            '<span>' + participantCount + '</span>' +
            '<span style="color:' + statusColor + ';font-size:0.75rem;font-weight:600;">' + (tourn.status || 'draft') + '</span>' +
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
 * View tournament details
 */
function viewTournament(id) {
    var tourn = getTournament(id);
    if (!tourn) return;
    
    tournamentState.currentTournamentId = id;
    tournamentState.currentMode = tourn.mode || 'teams';
    
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    // Info
    var info = document.getElementById('tournament-info');
    var winnerDisplay = '';
    var winnerName = getTournamentWinnerDisplay(tourn);
    if (winnerName) {
        winnerDisplay = ' | Winner: <span style="color:var(--accent);font-weight:600;">' + winnerName + '</span>';
    }
    
    var statusColor = getTournamentStatusColor(tourn.status);
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
    renderTeamMatches(tourn);
    renderEliminations(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
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
        html += '<button class="remove-elimination-btn small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 4px;" data-index="' + index + '">\u2715</button>';
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
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var characterId = document.getElementById('elim-character-select').value;
    var week = parseInt(document.getElementById('elim-week').value) || 1;
    
    if (!characterId) { alert('Please select a character to eliminate.'); return; }
    
    if (!tourn.eliminations) tourn.eliminations = [];
    
    if (tourn.eliminations.some(function(e) { return String(e.characterId) === String(characterId); })) {
        alert('This character is already eliminated from this tournament.');
        return;
    }
    
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
    var tourn = getTournament(tournId);
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
    var winnerName = getTournamentWinnerDisplay(tourn);
    if (winnerName) {
        container.innerHTML = '\u2605 ' + winnerName;
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
 * Delete a tournament - FIXED
 */
function deleteTournament(id) {
    console.log('deleteTournament called with id:', id);
    
    if (!id) {
        console.error('No tournament ID provided');
        alert('Tournament ID not found.');
        return;
    }
    
    var tourn = getTournament(id);
    if (!tourn) {
        console.error('Tournament not found:', id);
        alert('Tournament not found.');
        return;
    }
    
    if (!confirm('Delete "' + tourn.name + '" permanently?')) {
        return;
    }
    
    // Remove from data
    data.tournaments = data.tournaments.filter(function(t) { return String(t.id) !== String(id); });
    
    if (typeof logActivity === 'function') {
        logActivity('Deleted tournament: ' + tourn.name);
    }
    
    saveData().then(function() {
        renderTournamentsList();
        closeTournamentDetail();
        if (typeof renderAll === 'function') {
            renderAll();
        }
        alert('Tournament "' + tourn.name + '" deleted successfully.');
    }).catch(function(err) {
        console.error('Failed to save after deletion:', err);
        alert('Failed to delete tournament. Please check console for details.');
    });
}

/**
 * Initialize tournament events
 */
function initTournamentEvents() {
    var addBtn = document.getElementById('add-tournament-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showTournamentForm(); });
    }
    
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
    
    var form = document.getElementById('tournament-form-inner');
    if (form) {
        form.addEventListener('submit', saveTournament);
    }
    
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
    
    var teamsModeBtn = document.getElementById('switch-teams-mode');
    var indModeBtn = document.getElementById('switch-individuals-mode');
    if (teamsModeBtn) {
        teamsModeBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
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
            var tourn = getTournament(tournId);
            if (tourn) {
                tourn.mode = 'individuals';
                viewTournament(tournId);
            }
        });
    }
    
    var addRoundBtn = document.getElementById('add-round-btn');
    if (addRoundBtn) {
        addRoundBtn.addEventListener('click', addRound);
    }
    
    var autoGenBtn = document.getElementById('auto-generate-rounds-btn');
    if (autoGenBtn) {
        autoGenBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                autoGenerateRounds(tournId);
            }
        });
    }
    
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
    }
    
    var addCharBtn = document.getElementById('add-char-to-tournament');
    if (addCharBtn) {
        addCharBtn.addEventListener('click', addCharacterToTournament);
    }
    
    var refreshBtn = document.getElementById('refresh-teams-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                populateTeamSelector(tourn);
                populateEliminationSelector(tourn);
            }
        });
    }
    var refreshCharsBtn = document.getElementById('refresh-chars-btn');
    if (refreshCharsBtn) {
        refreshCharsBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                populateCharacterSelector(tourn);
                populateEliminationSelector(tourn);
            }
        });
    }
    
    var addMatchBtn = document.getElementById('add-match-btn');
    if (addMatchBtn) {
        addMatchBtn.addEventListener('click', addTeamMatch);
    }
    
    var addElimBtn = document.getElementById('add-elimination-btn');
    if (addElimBtn) {
        addElimBtn.addEventListener('click', addElimination);
    }
    
    var removeElimBtn = document.getElementById('remove-elimination-btn');
    if (removeElimBtn) {
        removeElimBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
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
    
    // Match detail modal events
    var closeMatchDetail = document.getElementById('close-match-detail');
    if (closeMatchDetail) {
        closeMatchDetail.addEventListener('click', function() {
            document.getElementById('match-detail-modal').classList.add('hidden');
        });
    }
    var cancelMatchDetail = document.getElementById('cancel-match-detail');
    if (cancelMatchDetail) {
        cancelMatchDetail.addEventListener('click', function() {
            document.getElementById('match-detail-modal').classList.add('hidden');
        });
    }
}

// Make functions globally available
window.renderTournamentsView = renderTournamentsView;
window.renderTournamentsList = renderTournamentsList;
window.viewTournament = viewTournament;
window.initTournamentEvents = initTournamentEvents;
window.populateEliminationSelector = populateEliminationSelector;
window.renderEliminations = renderEliminations;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.renderWinner = renderWinner;
window.deleteTournament = deleteTournament;
