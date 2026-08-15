/**
 * tournaments-ui.js - Tournament UI Rendering
 * Complete rework with manual rounds, alphabetical dropdowns, individual eliminations
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
                                <option value="teams">Teams</option>
                                <option value="individuals">Individuals</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Match Type *</label>
                            <select id="tournament-match-type" required>
                                <option value="1v1">1v1 (2 players/teams)</option>
                                <option value="1v1v1">1v1v1 (3 players/teams)</option>
                                <option value="1v1v1v1">1v1v1v1 (4 players/teams)</option>
                                <option value="ffa">Free-for-All (8 max)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Number of Rounds *</label>
                            <select id="tournament-rounds" required>
                                <option value="1">1 Round</option>
                                <option value="2">2 Rounds</option>
                                <option value="3">3 Rounds</option>
                                <option value="4">4 Rounds</option>
                                <option value="5">5 Rounds</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Round Setup *</label>
                            <select id="tournament-round-setup" required>
                                <option value="auto">Auto-Generate Rounds</option>
                                <option value="manual">Manual Setup</option>
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
                    
                    <div class="tab-container" style="margin-top:12px;">
                        <div class="tab-nav">
                            <button class="tab-btn active" data-tab="overview">Overview</button>
                            <button class="tab-btn" data-tab="participants">Participants</button>
                            <button class="tab-btn" data-tab="rounds">Rounds</button>
                            <button class="tab-btn" data-tab="eliminations">Eliminations</button>
                        </div>
                        <div class="tab-content">
                            <div id="tab-overview" class="tab-panel active">
                                <div id="overview-content"></div>
                            </div>
                            <div id="tab-participants" class="tab-panel">
                                <div id="participants-content"></div>
                            </div>
                            <div id="tab-rounds" class="tab-panel">
                                <div id="rounds-content"></div>
                            </div>
                            <div id="tab-eliminations" class="tab-panel">
                                <div id="eliminations-content"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manual Match Modal -->
        <div id="manual-match-modal" class="modal hidden">
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3 id="manual-match-title">Create Match</h3>
                    <button class="close-modal" id="close-manual-match">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="manual-match-content"></div>
                    <div class="form-actions" style="margin-top:16px;">
                        <button type="button" id="cancel-manual-match" class="secondary">Cancel</button>
                        <button type="button" id="save-manual-match" class="primary">Create Match</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Eliminate Character Modal -->
        <div id="eliminate-modal" class="modal hidden">
            <div class="modal-content" style="max-width:400px;">
                <div class="modal-header">
                    <h3 id="eliminate-modal-title">Eliminate Character</h3>
                    <button class="close-modal" id="close-eliminate-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="eliminate-content"></div>
                    <div class="form-actions" style="margin-top:16px;">
                        <button type="button" id="cancel-eliminate" class="secondary">Cancel</button>
                        <button type="button" id="confirm-eliminate" class="danger">Eliminate</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderTournamentsList();
    initTournamentEvents();
}

function renderTournamentsList() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    
    var tournaments = getTournaments();
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet.</p>';
        return;
    }
    
    var html = '';
    tournaments.forEach(function(tourn) {
        var modeLabel = tourn.mode === 'individuals' ? 'Individuals' : 'Teams';
        var participantCount = tourn.participants ? tourn.participants.length : 0;
        var statusColor = getTournamentStatusColor(tourn.status);
        var weekDisplay = 'Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?');
        var winnerDisplay = '';
        var winnerName = getTournamentWinnerDisplay(tourn);
        if (winnerName) {
            winnerDisplay = ' \u2605 ' + winnerName;
        }
        var matchTypeDisplay = getMatchTypeDisplay(tourn.matchType);
        var setupLabel = tourn.roundSetup === 'manual' ? ' \u2692' : '';
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong>' + winnerDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + weekDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + modeLabel + ' | ' + matchTypeDisplay + setupLabel + '</span>' +
            '<span>' + participantCount + '</span>' +
            '<span style="color:' + statusColor + ';font-size:0.75rem;font-weight:600;">' + (tourn.status || 'active') + '</span>' +
            '<span class="actions">' +
                '<button class="small view-tournament" data-id="' + tourn.id + '">View</button>' +
                '<button class="small edit-tournament" data-id="' + tourn.id + '">Edit</button>' +
                '<button class="small danger delete-tournament" data-id="' + tourn.id + '">Delete</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.view-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            var id = this.dataset.id;
            viewTournament(id); 
        });
    });
    container.querySelectorAll('.edit-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            showTournamentForm(this.dataset.id); 
        });
    });
    container.querySelectorAll('.delete-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            deleteTournament(this.dataset.id); 
        });
    });
}

function showTournamentForm(editId) {
    var modal = document.getElementById('tournament-form-modal');
    var title = document.getElementById('tournament-form-title');
    var form = document.getElementById('tournament-form-inner');
    
    modal.classList.remove('hidden');
    
    if (editId) {
        title.textContent = 'Edit Tournament';
        var tourn = getTournament(editId);
        if (tourn) {
            document.getElementById('tournament-name').value = tourn.name || '';
            document.getElementById('tournament-mode').value = tourn.mode || 'teams';
            document.getElementById('tournament-match-type').value = tourn.matchType || '1v1';
            document.getElementById('tournament-rounds').value = tourn.rounds || 1;
            document.getElementById('tournament-round-setup').value = tourn.roundSetup || 'auto';
            document.getElementById('tournament-start-week').value = tourn.startWeek || 1;
            document.getElementById('tournament-end-week').value = tourn.endWeek || 4;
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'New Tournament';
        form.reset();
        document.getElementById('tournament-mode').value = 'teams';
        document.getElementById('tournament-match-type').value = '1v1';
        document.getElementById('tournament-rounds').value = '1';
        document.getElementById('tournament-round-setup').value = 'auto';
        document.getElementById('tournament-start-week').value = '1';
        document.getElementById('tournament-end-week').value = '4';
        delete form.dataset.editId;
    }
}

function saveTournament(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    var tournData = {
        name: document.getElementById('tournament-name').value.trim(),
        mode: document.getElementById('tournament-mode').value,
        matchType: document.getElementById('tournament-match-type').value,
        rounds: parseInt(document.getElementById('tournament-rounds').value) || 1,
        roundSetup: document.getElementById('tournament-round-setup').value || 'auto',
        startWeek: parseInt(document.getElementById('tournament-start-week').value) || 1,
        endWeek: parseInt(document.getElementById('tournament-end-week').value) || 4,
        academicYear: document.getElementById('tournament-year').value.trim(),
        status: 'active'
    };
    
    if (!tournData.name) { alert('Tournament name is required.'); return; }
    if (tournData.startWeek > tournData.endWeek) {
        alert('Start week must be before end week.');
        return;
    }
    
    if (editId) {
        var index = data.tournaments.findIndex(function(t) { return String(t.id) === String(editId); });
        if (index !== -1) {
            var existing = data.tournaments[index];
            // Preserve roundsData if it exists
            var roundsData = existing.roundsData || [];
            var participants = existing.participants || [];
            var eliminations = existing.eliminations || [];
            data.tournaments[index] = Object.assign({}, existing, tournData, {
                roundsData: roundsData,
                participants: participants,
                eliminations: eliminations
            });
            if (typeof logActivity === 'function') {
                logActivity('Updated tournament: ' + tournData.name);
            }
        }
    } else {
        var newTourn = createTournament(tournData);
        if (typeof logActivity === 'function') {
            logActivity('Created tournament: ' + tournData.name + ' (' + tournData.roundSetup + ' rounds)');
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    closeTournamentForm();
    renderTournamentsList();
}

function closeTournamentForm() {
    document.getElementById('tournament-form-modal').classList.add('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
    tournamentState.currentTournamentId = null;
}

function viewTournament(id) {
    var tourn = getTournament(id);
    if (!tourn) return;
    
    tournamentState.currentTournamentId = id;
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
    var matchTypeDisplay = getMatchTypeDisplay(tourn.matchType);
    var participantCount = tourn.participants ? tourn.participants.length : 0;
    var setupLabel = tourn.roundSetup === 'manual' ? 'Manual' : 'Auto';
    
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">Mode: <strong>' + modeLabel + '</strong> | ' +
        'Match: <strong>' + matchTypeDisplay + '</strong> | ' +
        'Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + 
        (tourn.academicYear ? ' | ' + tourn.academicYear : '') + 
        ' | Rounds: <strong>' + tourn.rounds + '</strong> (' + setupLabel + ')' +
        ' | Status: <span style="color:' + statusColor + ';font-weight:600;">' + (tourn.status || 'active') + '</span>' +
        ' | Participants: ' + participantCount +
        winnerDisplay + '</span>';
    
    renderOverviewTab(tourn);
    renderParticipantsTab(tourn);
    renderRoundsTab(tourn);
    renderEliminationsTab(tourn);
    
    initDetailTabs(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function initDetailTabs(tourn) {
    var tabs = document.querySelectorAll('#tournament-detail-modal .tab-btn');
    var panels = {
        overview: document.getElementById('tab-overview'),
        participants: document.getElementById('tab-participants'),
        rounds: document.getElementById('tab-rounds'),
        eliminations: document.getElementById('tab-eliminations')
    };
    
    for (var key in panels) {
        if (panels[key]) {
            panels[key].style.display = 'none';
            panels[key].classList.remove('active');
        }
    }
    
    var activeTab = document.querySelector('#tournament-detail-modal .tab-btn.active');
    if (activeTab) {
        var tabName = activeTab.dataset.tab;
        if (panels[tabName]) {
            panels[tabName].style.display = 'block';
            panels[tabName].classList.add('active');
        }
    } else if (panels.overview) {
        panels.overview.style.display = 'block';
        panels.overview.classList.add('active');
    }
    
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            
            var tabName = this.dataset.tab;
            for (var key in panels) {
                if (panels[key]) {
                    panels[key].style.display = 'none';
                    panels[key].classList.remove('active');
                }
            }
            if (panels[tabName]) {
                panels[tabName].style.display = 'block';
                panels[tabName].classList.add('active');
            }
            
            if (tabName === 'overview') renderOverviewTab(tourn);
            else if (tabName === 'participants') renderParticipantsTab(tourn);
            else if (tabName === 'rounds') renderRoundsTab(tourn);
            else if (tabName === 'eliminations') renderEliminationsTab(tourn);
        });
    });
}

function renderOverviewTab(tourn) {
    var container = document.getElementById('overview-content');
    if (!container) return;
    
    var participantCount = tourn.participants ? tourn.participants.length : 0;
    var totalMatches = 0;
    var completedMatches = 0;
    var eliminatedCount = tourn.eliminations ? tourn.eliminations.length : 0;
    
    if (tourn.roundsData) {
        tourn.roundsData.forEach(function(round) {
            if (round.matches) {
                totalMatches += round.matches.length;
                round.matches.forEach(function(m) {
                    if (m.status === 'completed') completedMatches++;
                });
            }
        });
    }
    
    var currentRound = tourn.currentRound || 0;
    var totalRounds = tourn.rounds || 1;
    var progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px;">';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Participants</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--accent);">' + participantCount + '</span></div>';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Matches</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--text);">' + completedMatches + '/' + totalMatches + '</span></div>';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Progress</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--info);">' + progress + '%</span></div>';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Eliminated</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--danger);">' + eliminatedCount + '</span></div>';
    html += '</div>';
    
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;margin-bottom:12px;">';
    html += '<span style="color:var(--text-dim);">Current Round: </span>';
    html += '<span style="font-weight:600;color:var(--accent);">' + (currentRound + 1) + '/' + totalRounds + '</span>';
    html += '</div>';
    
    if (tourn.winner) {
        var winnerName = getParticipantNameById(tourn.winner);
        html += '<div style="background:var(--accent-soft);padding:12px;border-radius:6px;border:1px solid var(--accent);">';
        html += '<span style="color:var(--accent);font-weight:600;">\u2605 Winner: </span>';
        html += '<span style="font-weight:600;">' + winnerName + '</span>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function renderParticipantsTab(tourn) {
    var container = document.getElementById('participants-content');
    if (!container) return;
    
    var isTeams = tourn.mode === 'teams';
    var matchCount = getMatchParticipantCount(tourn.matchType);
    
    var available = [];
    var activeParticipants = [];
    
    if (isTeams) {
        var allTeams = data.teams.filter(function(t) {
            if (t.status === 'deleted' || t.status === 'inactive') return false;
            if (t.type !== 'academic') return false;
            var start = parseInt(t.startPeriod);
            var end = parseInt(t.endPeriod);
            if (isNaN(start)) return true;
            return start <= tourn.endWeek && (isNaN(end) || end >= tourn.startWeek);
        });
        
        // Sort alphabetically
        allTeams.sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });
        
        var existingIds = (tourn.participants || []).map(function(p) { return p.id; });
        
        allTeams.forEach(function(team) {
            var inTourn = existingIds.some(function(id) { return String(id) === String(team.id); });
            if (inTourn) {
                activeParticipants.push({ id: team.id, name: team.name, type: 'team' });
            } else {
                available.push({ id: team.id, name: team.name, type: 'team' });
            }
        });
    } else {
        // Individuals - only trainees, alphabetical
        var startWeek = tourn.startWeek || 1;
        var allChars = data.characters.filter(function(c) {
            if (c.deceased) return false;
            var status = getCurrentStatus(c).toLowerCase();
            return status === 'trainee';
        });
        
        allChars.sort(function(a, b) {
            var nameA = [a.firstName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            var nameB = [b.firstName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        var existingIds = (tourn.participants || []).map(function(p) { return p.id; });
        
        allChars.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            var inTourn = existingIds.some(function(id) { return String(id) === String(c.id); });
            if (inTourn) {
                activeParticipants.push({ id: c.id, name: name, type: 'character' });
            } else {
                available.push({ id: c.id, name: name, type: 'character' });
            }
        });
    }
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Add Participants</h4>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">';
    html += '<select id="add-participant-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">';
    html += '<option value="">Select ' + (isTeams ? 'team' : 'trainee') + '...</option>';
    available.forEach(function(p) {
        html += '<option value="' + p.id + '">' + p.name + '</option>';
    });
    html += '</select>';
    html += '<button id="add-participant-btn" class="primary small">Add</button>';
    html += '</div>';
    html += '<div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;">';
    html += 'Need at least ' + matchCount + ' participants. Total: ' + (activeParticipants.length + available.length) + ' available.';
    html += '</div>';
    html += '</div>';
    
    html += '<div><h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Current Participants (' + activeParticipants.length + ')</h4>';
    if (activeParticipants.length === 0) {
        html += '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No participants added yet.</p>';
    } else {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        activeParticipants.forEach(function(p) {
            var isEliminated = false;
            if (tourn.eliminations) {
                tourn.eliminations.forEach(function(elim) {
                    if (String(elim.participantId) === String(p.id)) {
                        isEliminated = true;
                    }
                });
            }
            html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ' + (isEliminated ? 'var(--danger)' : 'var(--border)') + ';">';
            html += p.name + (isEliminated ? ' \u274C' : '');
            html += ' <button class="remove-participant-btn small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + p.id + '">\u2715</button>';
            html += '</span>';
        });
        html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
    
    container.querySelector('#add-participant-btn')?.addEventListener('click', function() {
        var select = document.getElementById('add-participant-select');
        var id = select.value;
        if (!id) { alert('Please select a participant.'); return; }
        
        if (!tourn.participants) tourn.participants = [];
        if (tourn.participants.some(function(p) { return String(p.id) === String(id); })) {
            alert('Already added.');
            return;
        }
        
        tourn.participants.push({ id: id, type: isTeams ? 'team' : 'character' });
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        viewTournament(tourn.id);
    });
    
    container.querySelectorAll('.remove-participant-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            if (!confirm('Remove this participant?')) return;
            tourn.participants = tourn.participants.filter(function(p) { return String(p.id) !== String(id); });
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            viewTournament(tourn.id);
        });
    });
}

function renderRoundsTab(tourn) {
    var container = document.getElementById('rounds-content');
    if (!container) return;
    
    var isManual = tourn.roundSetup === 'manual';
    var roundLabels = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">';
    
    if (isManual) {
        html += '<button id="add-manual-round-btn" class="primary small">+ Add Manual Round</button>';
        var lastRoundIndex = tourn.roundsData ? tourn.roundsData.length - 1 : 0;
        if (tourn.roundsData && tourn.roundsData.length > 0) {
            html += '<button id="add-manual-match-btn" class="primary small">+ Add Match to Current Round</button>';
        }
    } else {
        html += '<button id="create-rounds-btn" class="primary small">Generate Rounds</button>';
    }
    html += '<button id="reset-rounds-btn" class="danger small">Reset All Rounds</button>';
    html += '<span style="font-size:0.7rem;color:var(--text-dim);margin-left:8px;">Rounds: ' + (tourn.roundsData ? tourn.roundsData.length : 0) + '/' + (tourn.rounds || 1) + '</span>';
    html += '</div>';
    
    // Show the mode indicator
    html += '<div style="background:var(--bg);padding:8px 12px;border-radius:6px;margin-bottom:12px;border:1px solid var(--border-soft);">';
    html += '<span style="color:var(--text-dim);font-size:0.75rem;">Setup Mode: </span>';
    html += '<span style="font-weight:600;color:' + (isManual ? 'var(--warning)' : 'var(--info)') + ';">' + (isManual ? '\u2692 Manual' : '\u26A0 Auto') + '</span>';
    html += ' <span style="color:var(--text-dim);font-size:0.7rem;">' + (isManual ? '(Add rounds and matches manually)' : '(Auto-generated rounds)') + '</span>';
    html += '</div>';
    
    if (!tourn.roundsData || tourn.roundsData.length === 0) {
        html += '<p class="empty-state">No rounds created. Click "' + (isManual ? 'Add Manual Round' : 'Generate Rounds') + '" to start.</p>';
        container.innerHTML = html;
        attachRoundEvents(tourn);
        return;
    }
    
    tourn.roundsData.forEach(function(round, roundIndex) {
        var roundLabel = roundLabels[roundIndex + 1] || (roundIndex + 1);
        var isCompleted = round.status === 'completed';
        var matchCount = round.matches ? round.matches.length : 0;
        var isCurrent = tourn.currentRound === roundIndex;
        
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
        html += '<div><strong style="color:' + (isCurrent ? 'var(--accent)' : 'var(--text)') + ';">Round ' + roundLabel + '</strong> ' + (isCurrent ? ' \u25B6' : '') + ' <span style="color:var(--text-dim);font-size:0.75rem;">(' + matchCount + ' matches)</span>';
        html += ' <span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:' + 
            (isCompleted ? 'var(--info-soft);color:var(--info);' : 
             isCurrent ? 'var(--warning-soft);color:var(--warning);' :
             'var(--bg);color:var(--text-dim);') + '">' + 
            (isCompleted ? '\u2713 Completed' : isCurrent ? '\u23F3 In Progress' : '\u23F8 Pending') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
        if (!isCompleted && isManual) {
            html += '<button class="small primary add-match-btn" data-round="' + roundIndex + '">+ Match</button>';
        }
        if (!isCompleted) {
            html += '<button class="small primary complete-round-btn" data-round="' + roundIndex + '">Complete Round</button>';
        }
        // Always show eliminate button if there are participants
        var hasParticipants = tourn.participants && tourn.participants.length > 0;
        if (hasParticipants) {
            html += '<button class="small danger eliminate-char-btn" data-round="' + roundIndex + '">\u274C Eliminate</button>';
        }
        html += '<button class="small danger delete-round-btn" data-round="' + roundIndex + '">\u2715</button>';
        html += '</div>';
        html += '</div>';
        
        if (round.matches && round.matches.length > 0) {
            html += '<div style="padding-left:8px;border-left:2px solid var(--border-soft);">';
            round.matches.forEach(function(match, matchIndex) {
                var matchStatus = match.status || 'pending';
                var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 'var(--text-dim)';
                
                var participantNames = [];
                var participantIds = [];
                if (match.participants) {
                    match.participants.forEach(function(id) {
                        var name = getParticipantNameById(id);
                        var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                        var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                        var label = name;
                        if (isWinner) label += ' \uD83C\uDFC6';
                        else if (isLoser) label += ' \u274C';
                        participantNames.push(label);
                        participantIds.push(id);
                    });
                }
                
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:4px;margin-bottom:4px;border-left:3px solid ' + statusColor + ';flex-wrap:wrap;gap:4px;">';
                html += '<span style="font-size:0.75rem;">Match ' + (matchIndex + 1) + ': <strong>' + participantNames.join(' vs ') + '</strong></span>';
                html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
                if (matchStatus !== 'completed') {
                    html += '<span style="font-size:0.6rem;color:var(--text-dim);">Winner:</span>';
                    participantIds.forEach(function(id) {
                        var name = getParticipantNameById(id);
                        var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                        html += '<button class="small set-winner-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                            (isWinner ? 'border-color:var(--accent);color:var(--accent);' : '') + '">' + name + 
                            (isWinner ? ' \u2713' : '') + '</button>';
                    });
                    html += '<span style="font-size:0.6rem;color:var(--text-dim);">Loser:</span>';
                    participantIds.forEach(function(id) {
                        var name = getParticipantNameById(id);
                        var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                        if (!isLoser) {
                            html += '<button class="small set-loser-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                                (isLoser ? 'border-color:var(--danger);color:var(--danger);' : '') + '">' + name + 
                                (isLoser ? ' \u2715' : '') + '</button>';
                        }
                    });
                    html += '<button class="small primary complete-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">Complete</button>';
                } else {
                    html += '<span style="font-size:0.7rem;color:' + statusColor + ';">Completed</span>';
                    html += '<button class="small warning-btn reset-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">\u21BB Reset</button>';
                }
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    attachRoundEvents(tourn);
}

function attachRoundEvents(tourn) {
    var isManual = tourn.roundSetup === 'manual';
    
    document.getElementById('create-rounds-btn')?.addEventListener('click', function() {
        if (tourn.roundSetup === 'auto') {
            generateRounds(tourn.id);
        } else {
            alert('This tournament is set to Manual mode. Use "Add Manual Round" instead.');
        }
    });
    
    document.getElementById('add-manual-round-btn')?.addEventListener('click', function() {
        addManualRound(tourn.id);
    });
    
    document.getElementById('add-manual-match-btn')?.addEventListener('click', function() {
        var lastRound = tourn.roundsData ? tourn.roundsData.length - 1 : 0;
        if (lastRound < 0) {
            alert('Please add a round first.');
            return;
        }
        showManualMatchModal(tourn.id, lastRound);
    });
    
    document.getElementById('reset-rounds-btn')?.addEventListener('click', function() {
        if (!confirm('Reset all rounds? This will remove all match data.')) return;
        tourn.roundsData = [];
        tourn.currentRound = 0;
        tourn.winner = null;
        tourn.winners = [];
        tourn.eliminations = [];
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        viewTournament(tourn.id);
    });
    
    document.querySelectorAll('.add-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showManualMatchModal(tourn.id, roundIndex);
        });
    });
    
    document.querySelectorAll('.set-winner-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            var matchIndex = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchWinner(tourn.id, roundIndex, matchIndex, participantId);
        });
    });
    
    document.querySelectorAll('.set-loser-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            var matchIndex = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchLoser(tourn.id, roundIndex, matchIndex, participantId);
        });
    });
    
    document.querySelectorAll('.complete-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            var matchIndex = parseInt(this.dataset.match);
            completeMatch(tourn.id, roundIndex, matchIndex);
        });
    });
    
    document.querySelectorAll('.reset-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            var matchIndex = parseInt(this.dataset.match);
            resetMatch(tourn.id, roundIndex, matchIndex);
        });
    });
    
    document.querySelectorAll('.complete-round-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            completeRound(tourn.id, roundIndex);
        });
    });
    
    document.querySelectorAll('.delete-round-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            if (!confirm('Delete this round?')) return;
            tourn.roundsData.splice(roundIndex, 1);
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            viewTournament(tourn.id);
        });
    });
    
    document.querySelectorAll('.eliminate-char-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showEliminateModal(tourn.id, roundIndex);
        });
    });
}

function addManualRound(tournId) {
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    if (!tourn.roundsData) tourn.roundsData = [];
    var roundNumber = tourn.roundsData.length;
    
    if (roundNumber >= tourn.rounds) {
        alert('Maximum rounds reached (' + tourn.rounds + ').');
        return;
    }
    
    tourn.roundsData.push({
        roundNumber: roundNumber,
        status: 'pending',
        matches: []
    });
    
    tourn.currentRound = roundNumber;
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function showManualMatchModal(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) {
        alert('Round not found.');
        return;
    }
    
    var round = tourn.roundsData[roundIndex];
    var isTeams = tourn.mode === 'teams';
    var matchCount = getMatchParticipantCount(tourn.matchType);
    
    // Get available participants (not eliminated, not already in this round)
    var eliminatedIds = (tourn.eliminations || []).map(function(e) { return e.participantId; });
    var usedInRound = [];
    if (round.matches) {
        round.matches.forEach(function(m) {
            if (m.participants) {
                m.participants.forEach(function(id) {
                    usedInRound.push(id);
                });
            }
        });
    }
    
    var available = [];
    if (tourn.participants) {
        tourn.participants.forEach(function(p) {
            if (eliminatedIds.indexOf(p.id) === -1 && usedInRound.indexOf(p.id) === -1) {
                var name = getParticipantNameById(p.id);
                available.push({ id: p.id, name: name });
            }
        });
    }
    
    // Sort alphabetically
    available.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    
    if (available.length < 2) {
        alert('Not enough available participants for a match. Need at least 2 non-eliminated participants not already in this round.');
        return;
    }
    
    var modal = document.getElementById('manual-match-modal');
    document.getElementById('manual-match-title').textContent = 'Add Match - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('manual-match-content');
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Select ' + matchCount + ' participants for this match.</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    available.forEach(function(p) {
        html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--border-soft);">' + p.name + '</span>';
    });
    html += '</div>';
    html += '</div>';
    
    html += '<div id="manual-match-selection" style="margin-bottom:12px;">';
    for (var i = 0; i < matchCount; i++) {
        html += '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">';
        html += '<select class="manual-participant-select" data-index="' + i + '" style="flex:1;padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.7rem;">';
        html += '<option value="">Select participant...</option>';
        available.forEach(function(p) {
            html += '<option value="' + p.id + '">' + p.name + '</option>';
        });
        html += '</select>';
        html += '</div>';
    }
    html += '</div>';
    
    content.innerHTML = html;
    modal.dataset.tournId = tournId;
    modal.dataset.roundIndex = roundIndex;
    modal.classList.remove('hidden');
    
    document.getElementById('close-manual-match').onclick = function() { modal.classList.add('hidden'); };
    document.getElementById('cancel-manual-match').onclick = function() { modal.classList.add('hidden'); };
    modal.onclick = function(e) { if (e.target === this) modal.classList.add('hidden'); };
    
    document.getElementById('save-manual-match').onclick = function() {
        var selects = document.querySelectorAll('.manual-participant-select');
        var participantIds = [];
        selects.forEach(function(sel) {
            if (sel.value) participantIds.push(sel.value);
        });
        
        if (participantIds.length < 2) {
            alert('Please select at least 2 participants.');
            return;
        }
        
        var round = tourn.roundsData[roundIndex];
        if (!round.matches) round.matches = [];
        
        round.matches.push({
            participants: participantIds,
            winnerIds: [],
            loserIds: [],
            status: 'pending'
        });
        
        modal.classList.add('hidden');
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        viewTournament(tournId);
    };
}

function showEliminateModal(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var isTeams = tourn.mode === 'teams';
    var modal = document.getElementById('eliminate-modal');
    document.getElementById('eliminate-modal-title').textContent = 'Eliminate Character - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('eliminate-content');
    
    // Get all characters from the tournament
    var allCharacters = [];
    var alreadyEliminated = (tourn.eliminations || []).map(function(e) { return e.participantId; });
    
    if (isTeams) {
        // Get characters from all participating teams
        var tournamentChars = getTournamentCharacters(tourn);
        tournamentChars.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            var isEliminated = alreadyEliminated.some(function(id) { return String(id) === String(c.id); });
            if (!isEliminated) {
                allCharacters.push({ id: c.id, name: name + ' (' + getCurrentStatus(c) + ')' });
            }
        });
    } else {
        // Individual mode - get participants who are not eliminated
        var participants = tourn.participants || [];
        participants.forEach(function(p) {
            var isEliminated = alreadyEliminated.some(function(id) { return String(id) === String(p.id); });
            if (!isEliminated) {
                var name = getParticipantNameById(p.id);
                allCharacters.push({ id: p.id, name: name });
            }
        });
    }
    
    // Sort alphabetically
    allCharacters.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    
    if (allCharacters.length === 0) {
        content.innerHTML = '<p class="empty-state">No characters available to eliminate.</p>';
        document.getElementById('confirm-eliminate').style.display = 'none';
        modal.classList.remove('hidden');
        return;
    }
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Select a character to eliminate from the tournament.</p>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">';
    html += '<select id="eliminate-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">';
    html += '<option value="">Select character...</option>';
    allCharacters.forEach(function(c) {
        html += '<option value="' + c.id + '">' + c.name + '</option>';
    });
    html += '</select>';
    html += '</div>';
    html += '<div style="margin-top:8px;font-size:0.7rem;color:var(--text-dim);">';
    html += 'Eliminating a character will remove them from the tournament. They will not be able to participate in future rounds.';
    html += '</div>';
    html += '</div>';
    
    content.innerHTML = html;
    document.getElementById('confirm-eliminate').style.display = 'inline-block';
    
    modal.dataset.tournId = tournId;
    modal.dataset.roundIndex = roundIndex;
    modal.classList.remove('hidden');
    
    document.getElementById('close-eliminate-modal').onclick = function() { modal.classList.add('hidden'); };
    document.getElementById('cancel-eliminate').onclick = function() { modal.classList.add('hidden'); };
    modal.onclick = function(e) { if (e.target === this) modal.classList.add('hidden'); };
    
    document.getElementById('confirm-eliminate').onclick = function() {
        var select = document.getElementById('eliminate-select');
        var charId = select.value;
        if (!charId) {
            alert('Please select a character to eliminate.');
            return;
        }
        
        var name = getParticipantNameById(charId);
        if (!confirm('Eliminate "' + name + '" from the tournament?')) return;
        
        if (!tourn.eliminations) tourn.eliminations = [];
        tourn.eliminations.push({
            participantId: charId,
            round: parseInt(modal.dataset.roundIndex) || 0,
            type: 'manual'
        });
        
        // Also mark the character as eliminated in their data
        var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
        if (char) {
            if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
            var weekNum = tourn.startWeek || 1;
            if (char.eliminatedWeeks.indexOf(weekNum) === -1) {
                char.eliminatedWeeks.push(weekNum);
            }
        }
        
        modal.classList.add('hidden');
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        viewTournament(tournId);
        
        if (typeof logActivity === 'function') {
            logActivity('Eliminated ' + name + ' from tournament: ' + tourn.name);
        }
    };
}

function toggleMatchWinner(tournId, roundIndex, matchIndex, participantId) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) return;
    
    var round = tourn.roundsData[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    if (!match.winnerIds) match.winnerIds = [];
    
    var idx = match.winnerIds.indexOf(participantId);
    if (idx !== -1) {
        match.winnerIds.splice(idx, 1);
    } else {
        if (match.loserIds && match.loserIds.indexOf(participantId) !== -1) {
            alert('This participant is marked as a loser. Remove loser status first.');
            return;
        }
        match.winnerIds.push(participantId);
    }
    
    match.status = 'in_progress';
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function toggleMatchLoser(tournId, roundIndex, matchIndex, participantId) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) return;
    
    var round = tourn.roundsData[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    if (!match.loserIds) match.loserIds = [];
    
    var idx = match.loserIds.indexOf(participantId);
    if (idx !== -1) {
        match.loserIds.splice(idx, 1);
    } else {
        if (match.winnerIds && match.winnerIds.indexOf(participantId) !== -1) {
            alert('This participant is marked as a winner. Remove winner status first.');
            return;
        }
        match.loserIds.push(participantId);
    }
    
    match.status = 'in_progress';
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function completeMatch(tournId, roundIndex, matchIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) return;
    
    var round = tourn.roundsData[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    var hasWinner = match.winnerIds && match.winnerIds.length > 0;
    if (!hasWinner) {
        alert('Please select at least one winner.');
        return;
    }
    
    // For 1v1, ensure exactly 1 winner and 1 loser
    if (match.participants && match.participants.length === 2) {
        if (match.winnerIds.length !== 1) {
            alert('For 1v1 matches, exactly 1 winner must be selected.');
            return;
        }
        if (!match.loserIds || match.loserIds.length !== 1) {
            alert('For 1v1 matches, exactly 1 loser must be selected.');
            return;
        }
    }
    
    match.status = 'completed';
    
    // Add losers to eliminations
    if (match.loserIds) {
        match.loserIds.forEach(function(loserId) {
            if (!tourn.eliminations) tourn.eliminations = [];
            if (!tourn.eliminations.some(function(e) { return String(e.participantId) === String(loserId); })) {
                tourn.eliminations.push({
                    participantId: loserId,
                    round: roundIndex,
                    type: 'lost'
                });
            }
        });
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function resetMatch(tournId, roundIndex, matchIndex) {
    if (!confirm('Reset this match?')) return;
    
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) return;
    
    var round = tourn.roundsData[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    // Remove eliminations for losers
    if (match.loserIds) {
        match.loserIds.forEach(function(loserId) {
            if (tourn.eliminations) {
                tourn.eliminations = tourn.eliminations.filter(function(e) { 
                    return String(e.participantId) !== String(loserId); 
                });
            }
        });
    }
    
    match.winnerIds = [];
    match.loserIds = [];
    match.status = 'pending';
    round.status = 'pending';
    tourn.status = 'active';
    tourn.winner = null;
    tourn.winners = [];
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function completeRound(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.roundsData || !tourn.roundsData[roundIndex]) return;
    
    var round = tourn.roundsData[roundIndex];
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    
    if (!allCompleted) {
        alert('All matches in this round must be completed first.');
        return;
    }
    
    round.status = 'completed';
    tourn.currentRound = roundIndex + 1;
    
    var allRoundsComplete = tourn.roundsData.every(function(r) { return r.status === 'completed'; });
    if (allRoundsComplete) {
        tourn.status = 'completed';
        determineTournamentWinner(tourn);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function determineTournamentWinner(tourn) {
    var lastRound = tourn.roundsData[tourn.roundsData.length - 1];
    if (!lastRound || lastRound.status !== 'completed') return;
    
    var winners = [];
    lastRound.matches.forEach(function(match) {
        if (match.winnerIds) {
            match.winnerIds.forEach(function(wid) {
                winners.push(wid);
            });
        }
    });
    
    if (winners.length === 1) {
        tourn.winner = winners[0];
        if (typeof logActivity === 'function') {
            var winnerName = getParticipantNameById(winners[0]);
            logActivity('Tournament ' + tourn.name + ' completed! Winner: ' + winnerName);
        }
    } else if (winners.length > 1) {
        tourn.winner = winners[0];
        tourn.winners = winners;
        if (typeof logActivity === 'function') {
            var names = winners.map(function(w) { return getParticipantNameById(w); });
            logActivity('Tournament ' + tourn.name + ' completed! Winners: ' + names.join(', '));
        }
    }
}

function generateRounds(tournId) {
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    if (tourn.roundSetup === 'manual') {
        alert('This tournament is set to Manual mode. Use "Add Manual Round" instead.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants.');
        return;
    }
    
    tourn.roundsData = [];
    tourn.eliminations = [];
    tourn.winner = null;
    tourn.winners = [];
    
    var matchCount = getMatchParticipantCount(tourn.matchType);
    var totalRounds = tourn.rounds || 1;
    var participants = tourn.participants.map(function(p) { return p.id; });
    
    for (var round = 0; round < totalRounds; round++) {
        var roundParticipants = [];
        if (round === 0) {
            roundParticipants = participants.slice();
        } else {
            var eliminatedIds = (tourn.eliminations || []).map(function(e) { return e.participantId; });
            roundParticipants = participants.filter(function(id) {
                return eliminatedIds.indexOf(id) === -1;
            });
        }
        
        if (roundParticipants.length < 2) break;
        
        for (var i = roundParticipants.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = roundParticipants[i];
            roundParticipants[i] = roundParticipants[j];
            roundParticipants[j] = temp;
        }
        
        var roundMatches = [];
        for (var i = 0; i < roundParticipants.length; i += matchCount) {
            var matchParticipants = roundParticipants.slice(i, i + matchCount);
            if (matchParticipants.length < 2) {
                if (roundMatches.length > 0) {
                    roundMatches[roundMatches.length - 1].participants = 
                        roundMatches[roundMatches.length - 1].participants.concat(matchParticipants);
                }
                continue;
            }
            roundMatches.push({
                participants: matchParticipants,
                winnerIds: [],
                loserIds: [],
                status: 'pending'
            });
        }
        
        tourn.roundsData.push({
            roundNumber: round,
            status: 'pending',
            matches: roundMatches
        });
    }
    
    tourn.currentRound = 0;
    tourn.status = 'active';
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function renderEliminationsTab(tourn) {
    var container = document.getElementById('eliminations-content');
    if (!container) return;
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<h4 style="color:var(--danger);font-size:0.9rem;margin-bottom:8px;">Eliminated Participants</h4>';
    
    if (!tourn.eliminations || tourn.eliminations.length === 0) {
        html += '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No eliminations recorded.</p>';
    } else {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        tourn.eliminations.forEach(function(elim) {
            var name = getParticipantNameById(elim.participantId);
            var typeLabel = '';
            if (elim.type === 'manual') typeLabel = ' (Manual)';
            else if (elim.type === 'lost') typeLabel = ' (Lost Match)';
            html += '<span style="background:var(--danger-soft);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid var(--danger);">';
            html += name + ' \u274C' + typeLabel;
            if (elim.round !== undefined && elim.round !== null) {
                html += ' (Round ' + (elim.round + 1) + ')';
            }
            html += ' <button class="remove-elimination-btn small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + elim.participantId + '">\u2715</button>';
            html += '</span>';
        });
        html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-elimination-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            if (!confirm('Remove this elimination?')) return;
            tourn.eliminations = tourn.eliminations.filter(function(e) { return String(e.participantId) !== String(id); });
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            viewTournament(tourn.id);
        });
    });
}

function initTournamentEvents() {
    document.getElementById('add-tournament-btn')?.addEventListener('click', function() { showTournamentForm(); });
    document.getElementById('close-tournament-form')?.addEventListener('click', closeTournamentForm);
    document.getElementById('cancel-tournament-form')?.addEventListener('click', closeTournamentForm);
    document.getElementById('tournament-form-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeTournamentForm();
    });
    document.getElementById('tournament-form-inner')?.addEventListener('submit', saveTournament);
    document.getElementById('close-tournament-detail')?.addEventListener('click', closeTournamentDetail);
    document.getElementById('tournament-detail-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeTournamentDetail();
    });
}

// Make functions globally available
window.renderTournamentsView = renderTournamentsView;
window.renderTournamentsList = renderTournamentsList;
window.showTournamentForm = showTournamentForm;
window.saveTournament = saveTournament;
window.closeTournamentForm = closeTournamentForm;
window.closeTournamentDetail = closeTournamentDetail;
window.viewTournament = viewTournament;
window.generateRounds = generateRounds;
window.completeRound = completeRound;
window.completeMatch = completeMatch;
window.resetMatch = resetMatch;
window.toggleMatchWinner = toggleMatchWinner;
window.toggleMatchLoser = toggleMatchLoser;
window.addManualRound = addManualRound;
window.showManualMatchModal = showManualMatchModal;
window.showEliminateModal = showEliminateModal;
window.determineTournamentWinner = determineTournamentWinner;
window.initTournamentEvents = initTournamentEvents;
window.deleteTournament = deleteTournament;
