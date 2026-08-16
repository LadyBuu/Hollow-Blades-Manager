/**
 * tournaments-ui.js - Tournament UI Rendering
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
                <span>Rounds</span>
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
                            <label>Mode *</label>
                            <select id="tournament-mode">
                                <option value="teams">Teams</option>
                                <option value="individuals">Individuals</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Start Week</label>
                            <input type="number" id="tournament-start-week" min="1" max="52" value="1">
                        </div>
                        <div class="form-group">
                            <label>End Week</label>
                            <input type="number" id="tournament-end-week" min="1" max="52" value="52">
                        </div>
                        <div class="form-group">
                            <label>Number of Rounds</label>
                            <input type="number" id="tournament-rounds" min="1" max="10" value="1">
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
                    
                    <!-- Participants Section -->
                    <div id="participants-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Participants</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                            <select id="participant-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select...</option>
                            </select>
                            <button id="add-participant-btn" class="primary small">Add</button>
                            <button id="refresh-participants-btn" class="secondary small">Refresh</button>
                        </div>
                        <div id="participants-list" style="margin-top:8px;"></div>
                    </div>

                    <!-- Rounds Section -->
                    <div id="rounds-section" style="margin-bottom:16px;">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Rounds</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <button id="create-round-btn" class="primary small">+ Create Round</button>
                            <span style="font-size:0.7rem;color:var(--text-dim);" id="rounds-status">0 / 0 rounds</span>
                        </div>
                        <div id="rounds-container">
                            <p class="empty-state" style="padding:8px;font-size:0.8rem;">No rounds created. Click "Create Round" to start.</p>
                        </div>
                    </div>

                    <!-- Winner Display -->
                    <div id="winner-section" style="padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--accent);">
                        <h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Tournament Winner</h4>
                        <div id="winner-display" style="font-weight:600;color:var(--accent);font-size:1.1rem;">
                            Not determined yet
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Match Edit Modal -->
        <div id="match-edit-modal" class="modal hidden">
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 id="match-edit-title">Edit Match</h3>
                    <button class="close-modal" id="close-match-edit">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="match-edit-content"></div>
                    <div class="form-actions" style="margin-top:16px;">
                        <button type="button" id="save-match-edit" class="primary">Save Match</button>
                        <button type="button" id="cancel-match-edit" class="secondary">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderTournamentList();
    initTournamentEvents();
}

function renderTournamentList() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    
    var tournaments = getTournaments();
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet.</p>';
        return;
    }
    
    var html = '';
    tournaments.forEach(function(tourn) {
        var participantCount = tourn.participants ? tourn.participants.length : 0;
        var modeLabel = tourn.mode === 'teams' ? 'Teams' : 'Individuals';
        var statusColor = getTournamentStatusColor(tourn.status);
        var roundCount = tourn.rounds ? tourn.rounds.length : 0;
        var winnerDisplay = '';
        if (tourn.winner) {
            var winnerName = getParticipantName(tourn.winner);
            if (winnerName) {
                winnerDisplay = ' \u2605 ' + winnerName;
            }
        }
        
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong>' + winnerDisplay + '</span>' +
            '<span style="font-size:0.75rem;">' + modeLabel + '</span>' +
            '<span>' + roundCount + '/' + tourn.totalRounds + '</span>' +
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
        btn.addEventListener('click', function() { 
            var id = btn.dataset.id;
            if (deleteTournament(id)) {
                renderTournamentList();
            }
        });
    });
}

function viewTournament(id) {
    var tourn = getTournament(id);
    if (!tourn) return;
    
    tournamentState.currentTournamentId = id;
    
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    // Info
    var info = document.getElementById('tournament-info');
    var statusColor = getTournamentStatusColor(tourn.status);
    var modeLabel = tourn.mode === 'teams' ? 'Teams' : 'Individuals';
    var winnerDisplay = '';
    if (tourn.winner) {
        var winnerName = getParticipantName(tourn.winner);
        if (winnerName) {
            winnerDisplay = ' | Winner: <span style="color:var(--accent);font-weight:600;">' + winnerName + '</span>';
        }
    }
    
    info.innerHTML = 
        '<span style="color:var(--text-dim);font-size:0.8rem;">' +
        'Mode: <strong>' + modeLabel + '</strong> | ' +
        'Weeks ' + tourn.startWeek + ' - ' + tourn.endWeek + ' | ' +
        'Rounds: ' + (tourn.rounds ? tourn.rounds.length : 0) + '/' + tourn.totalRounds + ' | ' +
        'Status: <span style="color:' + statusColor + ';font-weight:600;">' + (tourn.status || 'draft') + '</span>' +
        winnerDisplay +
        '</span>';
    
    populateParticipantSelector(tourn);
    renderParticipants(tourn);
    renderRounds(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function populateParticipantSelector(tourn) {
    var select = document.getElementById('participant-select');
    if (!select) return;
    
    var existingIds = (tourn.participants || []).map(function(p) { return p.id; });
    var startWeek = parseInt(tourn.startWeek) || 1;
    var endWeek = parseInt(tourn.endWeek) || 52;
    
    var options = [];
    
    if (tourn.mode === 'teams') {
        var teams = data.teams.filter(function(t) {
            if (t.status === 'deleted') return false;
            if (existingIds.indexOf(t.id) !== -1) return false;
            var start = parseInt(t.startPeriod);
            var end = parseInt(t.endPeriod);
            if (isNaN(start)) return true;
            return start <= endWeek && (isNaN(end) || end >= startWeek);
        });
        teams.forEach(function(t) {
            options.push({ id: t.id, name: t.name + ' (team)' });
        });
    } else {
        // Individuals - only trainees, not eliminated
        var trainees = data.characters.filter(function(c) {
            if (c.deceased) return false;
            if (existingIds.indexOf(c.id) !== -1) return false;
            if (isCharacterEliminatedByWeek(c, startWeek)) return false;
            var status = getCurrentStatus(c).toLowerCase();
            return status === 'trainee';
        });
        trainees.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            options.push({ id: c.id, name: name + ' (trainee)' });
        });
    }
    
    select.innerHTML = '<option value="">Select...</option>';
    options.forEach(function(opt) {
        var option = document.createElement('option');
        option.value = opt.id;
        option.textContent = opt.name;
        select.appendChild(option);
    });
}

function renderParticipants(tourn) {
    var container = document.getElementById('participants-list');
    if (!tourn.participants || tourn.participants.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No participants added</p>';
        return;
    }
    
    var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    tourn.participants.forEach(function(p) {
        var name = getParticipantName(p.id);
        var status = '';
        var color = 'var(--border)';
        
        // Check if eliminated
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(p.id); });
        if (isEliminated) {
            status = ' \u274C Eliminated';
            color = 'var(--danger)';
        } else {
            // Check if won a match
            var hasWon = false;
            if (tourn.rounds) {
                tourn.rounds.forEach(function(r) {
                    if (r.matches) {
                        r.matches.forEach(function(m) {
                            if (m.winner && String(m.winner) === String(p.id)) {
                                hasWon = true;
                            }
                        });
                    }
                });
            }
            if (hasWon) {
                status = ' \u2605 Won';
                color = 'var(--accent)';
            } else if (tourn.rounds && tourn.rounds.length > 0) {
                status = ' \u2B06\uFE0F Advanced';
                color = 'var(--warning)';
            }
        }
        
        html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ' + color + ';">';
        html += name + status;
        html += ' <button class="remove-participant small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + p.id + '">\u2715</button>';
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

function renderRounds(tourn) {
    var container = document.getElementById('rounds-container');
    var status = document.getElementById('rounds-status');
    var roundCount = tourn.rounds ? tourn.rounds.length : 0;
    if (status) status.textContent = roundCount + ' / ' + tourn.totalRounds + ' rounds';
    
    if (!tourn.rounds || tourn.rounds.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No rounds created.</p>';
        return;
    }
    
    var html = '';
    tourn.rounds.forEach(function(round, roundIndex) {
        var roundLabel = (roundIndex + 1);
        var isCompleted = round.status === 'completed';
        var matchCount = round.matches ? round.matches.length : 0;
        
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
        html += '<div><strong style="color:var(--accent);">Round ' + roundLabel + '</strong> <span style="color:var(--text-dim);font-size:0.75rem;">(' + matchCount + ' matches)</span>';
        html += ' <span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:' + 
            (isCompleted ? 'var(--info-soft);color:var(--info);' : 'var(--bg);color:var(--text-dim);') + '">' + 
            (isCompleted ? '\u2713 Completed' : 'Pending') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
        html += '<button class="small info-btn view-round-matches" data-round="' + roundIndex + '">View Matches</button>';
        if (!isCompleted) {
            html += '<button class="small primary add-match-to-round" data-round="' + roundIndex + '">+ Add Match</button>';
            html += '<button class="small success complete-round-btn" data-round="' + roundIndex + '">Complete Round</button>';
        }
        html += '<button class="small danger delete-round-btn" data-round="' + roundIndex + '">\u2715</button>';
        html += '</div>';
        html += '</div>';
        
        if (round.matches && round.matches.length > 0) {
            html += '<div style="padding-left:8px;border-left:2px solid var(--border-soft);">';
            round.matches.forEach(function(match, matchIndex) {
                var participantNames = [];
                if (match.participants) {
                    match.participants.forEach(function(id) {
                        var name = getParticipantName(id);
                        var isWinner = match.winner && String(match.winner) === String(id);
                        var isLoser = match.loser && String(match.loser) === String(id);
                        var label = name;
                        if (isWinner) label += ' \u2605';
                        else if (isLoser) label += ' \u274C';
                        participantNames.push(label);
                    });
                }
                
                var matchStatus = match.status || 'pending';
                var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 'var(--text-dim)';
                
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
    
    container.querySelectorAll('.view-round-matches').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showRoundMatches(tourn.id, roundIndex);
        });
    });
    
    container.querySelectorAll('.add-match-to-round').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showAddMatchModal(tourn.id, roundIndex);
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

function renderWinner(tourn) {
    var container = document.getElementById('winner-display');
    if (tourn.winner) {
        var name = getParticipantName(tourn.winner);
        container.innerHTML = '\u2605 ' + name;
        container.style.color = 'var(--accent)';
        container.style.fontWeight = '600';
        container.style.fontSize = '1.1rem';
    } else {
        container.innerHTML = 'Not determined yet';
        container.style.color = 'var(--text-dim)';
        container.style.fontWeight = 'normal';
        container.style.fontSize = '1rem';
    }
}

function showRoundMatches(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var modal = document.getElementById('match-edit-modal');
    document.getElementById('match-edit-title').textContent = 'Round ' + (roundIndex + 1) + ' - Matches';
    
    var content = document.getElementById('match-edit-content');
    var html = '';
    
    if (round.matches && round.matches.length > 0) {
        html += '<div style="max-height:400px;overflow-y:auto;">';
        round.matches.forEach(function(match, matchIndex) {
            var participantNames = [];
            if (match.participants) {
                match.participants.forEach(function(id) {
                    var name = getParticipantName(id);
                    var isWinner = match.winner && String(match.winner) === String(id);
                    var isLoser = match.loser && String(match.loser) === String(id);
                    var label = name;
                    if (isWinner) label += ' \u2605 WINNER';
                    else if (isLoser) label += ' \u274C LOSER';
                    participantNames.push(label);
                });
            }
            
            html += '<div style="background:var(--bg);border-radius:6px;padding:8px 12px;margin-bottom:8px;border-left:3px solid var(--accent);">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
            html += '<span style="font-weight:600;">Match ' + (matchIndex + 1) + '</span>';
            html += '<span style="font-size:0.7rem;color:var(--text-dim);">' + (match.status || 'pending') + '</span>';
            html += '</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
            participantNames.forEach(function(name) {
                html += '<span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;background:var(--panel-alt);">' + name + '</span>';
            });
            html += '</div>';
            html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
            html += '<button class="small primary edit-match-btn" data-match="' + matchIndex + '">Edit Match</button>';
            html += '<button class="small danger delete-match-btn" data-match="' + matchIndex + '">\u2715</button>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<p class="empty-state" style="padding:12px;">No matches in this round.</p>';
    }
    
    content.innerHTML = html;
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    
    content.querySelectorAll('.edit-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var matchIndex = parseInt(this.dataset.match);
            showEditMatchModal(tournId, roundIndex, matchIndex);
        });
    });
    
    content.querySelectorAll('.delete-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var matchIndex = parseInt(this.dataset.match);
            if (confirm('Delete this match?')) {
                deleteMatch(tournId, roundIndex, matchIndex);
            }
        });
    });
    
    modal.classList.remove('hidden');
}

function showAddMatchModal(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var availableParticipants = getAvailableParticipants(tourn, roundIndex + 1);
    
    if (availableParticipants.length < 2) {
        alert('Need at least 2 available participants.');
        return;
    }
    
    var modal = document.getElementById('match-edit-modal');
    document.getElementById('match-edit-title').textContent = 'Add Match - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('match-edit-content');
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Select ' + (tourn.mode === 'teams' ? 'teams' : 'players') + ' for this match.</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    availableParticipants.forEach(function(id) {
        var name = getParticipantName(id);
        html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--border-soft);">' + name + '</span>';
    });
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Number of participants per match:</label>';
    html += '<input type="number" id="match-size" min="2" max="10" value="2" style="width:70px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;margin-left:8px;">';
    html += '</div>';
    
    html += '<div id="match-participants-selection" style="margin-bottom:12px;padding:8px;background:var(--panel-alt);border-radius:6px;border:1px solid var(--border-soft);min-height:50px;">';
    html += '<div style="color:var(--text-dim);font-size:0.7rem;text-align:center;padding:8px;">Select participants below.</div>';
    html += '</div>';
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">';
    html += '<button id="add-participant-selection" class="small secondary">+ Add Participant</button>';
    html += '<button id="clear-participant-selection" class="small secondary">Clear All</button>';
    html += '</div>';
    
    html += '<div class="form-actions">';
    html += '<button type="button" id="cancel-add-match" class="secondary">Cancel</button>';
    html += '<button type="button" id="create-match-submit" class="primary">Create Match</button>';
    html += '</div>';
    
    content.innerHTML = html;
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    
    var selectedIds = [];
    var availParticipants = availableParticipants.slice();
    
    function updateSelectionDisplay() {
        var container = document.getElementById('match-participants-selection');
        var matchSize = parseInt(document.getElementById('match-size').value) || 2;
        
        if (selectedIds.length === 0) {
            container.innerHTML = '<div style="color:var(--text-dim);font-size:0.7rem;text-align:center;padding:8px;">No participants selected.</div>';
        } else {
            var html = '<div style="margin-bottom:4px;"><span style="font-size:0.7rem;color:var(--text-dim);">Selected (' + selectedIds.length + '/' + matchSize + '):</span></div>';
            selectedIds.forEach(function(id, index) {
                var name = getParticipantName(id);
                html += '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">';
                html += '<span style="background:var(--accent-soft);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--accent);">' + name + '</span>';
                html += '<button class="small danger remove-selected-participant" data-index="' + index + '" style="padding:0 4px;font-size:0.6rem;">\u2715</button>';
                html += '</div>';
            });
            var remaining = matchSize - selectedIds.length;
            if (remaining > 0) {
                html += '<div style="color:var(--text-dim);font-size:0.6rem;margin-top:2px;">Add ' + remaining + ' more participant(s).</div>';
            } else {
                html += '<div style="color:var(--accent);font-size:0.6rem;margin-top:2px;">\u2713 Ready!</div>';
            }
            container.innerHTML = html;
        }
        
        container.querySelectorAll('.remove-selected-participant').forEach(function(btn) {
            btn.onclick = function() {
                var idx = parseInt(this.dataset.index);
                var removedId = selectedIds[idx];
                selectedIds.splice(idx, 1);
                if (availParticipants.indexOf(removedId) === -1) {
                    availParticipants.push(removedId);
                    availParticipants.sort();
                }
                updateSelectionDisplay();
            };
        });
    }
    
    document.getElementById('add-participant-selection').onclick = function() {
        var matchSize = parseInt(document.getElementById('match-size').value) || 2;
        if (selectedIds.length >= matchSize) {
            alert('Maximum participants reached for this match.');
            return;
        }
        if (availParticipants.length === 0) {
            alert('No more participants available.');
            return;
        }
        
        var container = document.getElementById('match-participants-selection');
        var selectHtml = '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;" id="temp-select-wrapper">';
        selectHtml += '<select id="temp-participant-select" style="flex:1;padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.7rem;">';
        selectHtml += '<option value="">Select...</option>';
        availParticipants.forEach(function(id) {
            var name = getParticipantName(id);
            selectHtml += '<option value="' + id + '">' + name + '</option>';
        });
        selectHtml += '</select>';
        selectHtml += '<button id="confirm-select-participant" class="primary small" style="padding:2px 8px;">Add</button>';
        selectHtml += '<button id="cancel-select-participant" class="secondary small" style="padding:2px 8px;">\u2715</button>';
        selectHtml += '</div>';
        
        var existing = container.querySelector('div:first-child');
        if (existing) {
            var wrapper = document.createElement('div');
            wrapper.innerHTML = selectHtml;
            var selectElement = wrapper.firstElementChild;
            container.insertBefore(selectElement, existing);
        } else {
            container.innerHTML = selectHtml + container.innerHTML;
        }
        
        document.getElementById('confirm-select-participant').onclick = function() {
            var select = document.getElementById('temp-participant-select');
            var id = select.value;
            if (!id) { alert('Please select a participant.'); return; }
            var idx = availParticipants.indexOf(id);
            if (idx !== -1) availParticipants.splice(idx, 1);
            selectedIds.push(id);
            var wrapper = document.getElementById('temp-select-wrapper');
            if (wrapper) wrapper.remove();
            updateSelectionDisplay();
        };
        
        document.getElementById('cancel-select-participant').onclick = function() {
            var wrapper = document.getElementById('temp-select-wrapper');
            if (wrapper) wrapper.remove();
        };
    };
    
    document.getElementById('clear-participant-selection').onclick = function() {
        selectedIds.forEach(function(id) {
            if (availParticipants.indexOf(id) === -1) {
                availParticipants.push(id);
                availParticipants.sort();
            }
        });
        selectedIds = [];
        updateSelectionDisplay();
    };
    
    document.getElementById('create-match-submit').onclick = function() {
        var matchSize = parseInt(document.getElementById('match-size').value) || 2;
        if (selectedIds.length < 2) {
            alert('Please select at least 2 participants.');
            return;
        }
        if (selectedIds.length !== matchSize) {
            alert('You need exactly ' + matchSize + ' participants for this match.');
            return;
        }
        
        var round = tourn.rounds[roundIndex];
        if (!round.matches) round.matches = [];
        round.matches.push({
            participants: selectedIds.slice(),
            winner: null,
            loser: null,
            status: 'pending'
        });
        
        // If round was completed, set back to pending
        if (round.status === 'completed') {
            round.status = 'pending';
            tourn.status = 'active';
        }
        
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        modal.classList.add('hidden');
        viewTournament(tournId);
    };
    
    document.getElementById('cancel-add-match').onclick = function() {
        modal.classList.add('hidden');
    };
    
    // Update on match size change
    document.getElementById('match-size').onchange = function() {
        var matchSize = parseInt(this.value) || 2;
        if (selectedIds.length > matchSize) {
            alert('You have ' + selectedIds.length + ' participants selected, but this match only allows ' + matchSize + '. Please clear some selections.');
        }
        updateSelectionDisplay();
    };
    
    updateSelectionDisplay();
    modal.classList.remove('hidden');
}

function showEditMatchModal(tournId, roundIndex, matchIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    var modal = document.getElementById('match-edit-modal');
    document.getElementById('match-edit-title').textContent = 'Edit Match - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('match-edit-content');
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Participants:</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    match.participants.forEach(function(id) {
        var name = getParticipantName(id);
        var isWinner = match.winner && String(match.winner) === String(id);
        var isLoser = match.loser && String(match.loser) === String(id);
        var style = 'background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--border-soft);';
        if (isWinner) style += 'border-color:var(--accent);';
        else if (isLoser) style += 'border-color:var(--danger);';
        html += '<span style="' + style + '">' + name + (isWinner ? ' \u2605' : '') + (isLoser ? ' \u274C' : '') + '</span>';
    });
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Set Winner:</label>';
    html += '<select id="edit-match-winner" style="padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;width:auto;">';
    html += '<option value="">None</option>';
    match.participants.forEach(function(id) {
        var name = getParticipantName(id);
        var selected = match.winner && String(match.winner) === String(id) ? 'selected' : '';
        html += '<option value="' + id + '" ' + selected + '>' + name + '</option>';
    });
    html += '</select>';
    html += '</div>';
    
    // For team mode, allow manual loser selection
    if (tourn.mode === 'teams') {
        html += '<div style="margin-bottom:12px;">';
        html += '<label style="font-size:0.7rem;color:var(--text-dim);">Set Loser (eliminated from tournament):</label>';
        html += '<select id="edit-match-loser" style="padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;width:auto;">';
        html += '<option value="">None</option>';
        match.participants.forEach(function(id) {
            var name = getParticipantName(id);
            var selected = match.loser && String(match.loser) === String(id) ? 'selected' : '';
            html += '<option value="' + id + '" ' + selected + '>' + name + '</option>';
        });
        html += '</select>';
        html += '</div>';
    }
    
    // For team mode, show team members for elimination selection
    if (tourn.mode === 'teams' && match.winner && match.loser) {
        var loserTeam = data.teams.find(function(t) { return String(t.id) === String(match.loser); });
        if (loserTeam && loserTeam.members) {
            html += '<div style="margin-bottom:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">';
            html += '<label style="font-size:0.7rem;color:var(--text-dim);">Select team members to eliminate (individual eliminations):</label>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
            loserTeam.members.forEach(function(member) {
                var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                if (!char) return;
                var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(char.id); });
                html += '<label style="font-size:0.7rem;display:flex;align-items:center;gap:4px;background:var(--panel-alt);padding:2px 8px;border-radius:10px;' + (isEliminated ? 'opacity:0.5;' : '') + '">';
                html += '<input type="checkbox" class="eliminate-member-check" data-char="' + char.id + '" ' + (isEliminated ? 'checked' : '') + '>';
                html += name + (isEliminated ? ' \u274C' : '');
                html += '</label>';
            });
            html += '</div>';
            html += '<span style="font-size:0.6rem;color:var(--text-dim);">Checking a member eliminates them from the tournament individually.</span>';
            html += '</div>';
        }
    }
    
    html += '<div class="form-actions" style="margin-top:8px;">';
    html += '<button type="button" id="save-edit-match" class="primary">Save Changes</button>';
    html += '<button type="button" id="cancel-edit-match" class="secondary">Cancel</button>';
    html += '</div>';
    
    content.innerHTML = html;
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    content.dataset.matchIndex = matchIndex;
    
    document.getElementById('save-edit-match').onclick = function() {
        var winnerId = document.getElementById('edit-match-winner').value;
        var loserId = document.getElementById('edit-match-loser') ? document.getElementById('edit-match-loser').value : null;
        var match = tourn.rounds[roundIndex].matches[matchIndex];
        
        if (winnerId) {
            match.winner = winnerId;
            match.status = 'completed';
        } else {
            match.winner = null;
            match.status = 'pending';
        }
        
        if (loserId && tourn.mode === 'teams') {
            match.loser = loserId;
            // Add to eliminations
            if (!tourn.eliminations) tourn.eliminations = [];
            if (!tourn.eliminations.some(function(e) { return String(e.participantId) === String(loserId); })) {
                tourn.eliminations.push({
                    participantId: loserId,
                    week: parseInt(tourn.startWeek) || 1,
                    reason: 'Lost in Round ' + (roundIndex + 1)
                });
            }
        } else if (tourn.mode === 'individuals' && winnerId) {
            // In individuals, loser is auto-determined (the one who didn't win)
            match.participants.forEach(function(id) {
                if (String(id) !== String(winnerId)) {
                    match.loser = id;
                    if (!tourn.eliminations) tourn.eliminations = [];
                    if (!tourn.eliminations.some(function(e) { return String(e.participantId) === String(id); })) {
                        tourn.eliminations.push({
                            participantId: id,
                            week: parseInt(tourn.startWeek) || 1,
                            reason: 'Lost in Round ' + (roundIndex + 1)
                        });
                    }
                }
            });
        }
        
        // Handle team member eliminations
        if (tourn.mode === 'teams') {
            var checkboxes = document.querySelectorAll('.eliminate-member-check');
            checkboxes.forEach(function(cb) {
                var charId = cb.dataset.char;
                if (cb.checked) {
                    if (!tourn.eliminations.some(function(e) { return String(e.participantId) === String(charId); })) {
                        tourn.eliminations.push({
                            participantId: charId,
                            week: parseInt(tourn.startWeek) || 1,
                            reason: 'Eliminated from team'
                        });
                        // Mark character as eliminated
                        var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
                        if (char) {
                            if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
                            var weekNum = parseInt(tourn.startWeek) || 1;
                            if (char.eliminatedWeeks.indexOf(weekNum) === -1) {
                                char.eliminatedWeeks.push(weekNum);
                            }
                        }
                    }
                } else {
                    // Remove from eliminations
                    tourn.eliminations = tourn.eliminations.filter(function(e) { return String(e.participantId) !== String(charId); });
                    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
                    if (char && char.eliminatedWeeks) {
                        var weekNum = parseInt(tourn.startWeek) || 1;
                        var idx = char.eliminatedWeeks.indexOf(weekNum);
                        if (idx !== -1) {
                            char.eliminatedWeeks.splice(idx, 1);
                        }
                    }
                }
            });
        }
        
        // Check if tournament is complete
        var allRoundsComplete = tourn.rounds.every(function(r) { return r.status === 'completed'; });
        if (allRoundsComplete) {
            tourn.status = 'completed';
            // Determine winner (last match winner)
            var lastRound = tourn.rounds[tourn.rounds.length - 1];
            if (lastRound.matches && lastRound.matches.length > 0) {
                var lastMatch = lastRound.matches[lastRound.matches.length - 1];
                if (lastMatch.winner) {
                    tourn.winner = lastMatch.winner;
                }
            }
        }
        
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        modal.classList.add('hidden');
        viewTournament(tournId);
    };
    
    document.getElementById('cancel-edit-match').onclick = function() {
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

function getAvailableParticipants(tourn, roundNumber) {
    if (!tourn.participants) return [];
    
    var eliminatedIds = [];
    if (tourn.eliminations) {
        tourn.eliminations.forEach(function(e) {
            eliminatedIds.push(e.participantId);
        });
    }
    
    var usedInPreviousRounds = [];
    if (tourn.rounds) {
        tourn.rounds.forEach(function(r) {
            if (r.roundNumber < roundNumber && r.matches) {
                r.matches.forEach(function(m) {
                    if (m.participants) {
                        m.participants.forEach(function(id) {
                            // If they lost, they're eliminated (already tracked)
                            if (m.loser && String(m.loser) === String(id)) {
                                if (eliminatedIds.indexOf(id) === -1) {
                                    eliminatedIds.push(id);
                                }
                            } else {
                                usedInPreviousRounds.push(id);
                            }
                        });
                    }
                });
            }
        });
    }
    
    var available = [];
    tourn.participants.forEach(function(p) {
        var id = p.id;
        if (eliminatedIds.indexOf(id) !== -1) return;
        if (usedInPreviousRounds.indexOf(id) !== -1) return;
        available.push(id);
    });
    
    return available;
}

function completeRound(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    if (!allCompleted) {
        alert('All matches in this round must be completed first.');
        return;
    }
    
    round.status = 'completed';
    
    // Check if all rounds are complete
    var allRoundsComplete = tourn.rounds.every(function(r) { return r.status === 'completed'; });
    if (allRoundsComplete) {
        tourn.status = 'completed';
        // Determine winner from last match
        var lastRound = tourn.rounds[tourn.rounds.length - 1];
        if (lastRound.matches && lastRound.matches.length > 0) {
            var lastMatch = lastRound.matches[lastRound.matches.length - 1];
            if (lastMatch.winner) {
                tourn.winner = lastMatch.winner;
            }
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function deleteRound(tournId, roundIndex) {
    if (!confirm('Delete this round and all its matches?')) return;
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds) return;
    tourn.rounds.splice(roundIndex, 1);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function deleteMatch(tournId, roundIndex, matchIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    tourn.rounds[roundIndex].matches.splice(matchIndex, 1);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatches(tournId, roundIndex);
    viewTournament(tournId);
}

function removeParticipant(tournId, participantId) {
    if (!confirm('Remove this participant from the tournament?')) return;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    tourn.participants = tourn.participants.filter(function(p) { return String(p.id) !== String(participantId); });
    // Remove from eliminations too
    if (tourn.eliminations) {
        tourn.eliminations = tourn.eliminations.filter(function(e) { return String(e.participantId) !== String(participantId); });
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function addParticipant() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var select = document.getElementById('participant-select');
    var id = select.value;
    if (!id) { alert('Please select a participant.'); return; }
    
    if (!tourn.participants) tourn.participants = [];
    if (tourn.participants.some(function(p) { return String(p.id) === String(id); })) {
        alert('Already added.');
        return;
    }
    
    tourn.participants.push({ id: id, addedAt: new Date().toISOString() });
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function createRound() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    if (tourn.rounds && tourn.rounds.length >= tourn.totalRounds) {
        alert('Maximum rounds reached for this tournament.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants to create a round.');
        return;
    }
    
    if (!tourn.rounds) tourn.rounds = [];
    var roundNumber = tourn.rounds.length + 1;
    
    tourn.rounds.push({
        roundNumber: roundNumber,
        status: 'pending',
        matches: []
    });
    
    tourn.status = 'active';
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function isCharacterEliminatedByWeek(char, week) {
    if (!char) return false;
    if (char.deceased) return true;
    if (char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
        var weekNum = parseInt(week) || 1;
        for (var i = 0; i < char.eliminatedWeeks.length; i++) {
            var elimWeek = parseInt(char.eliminatedWeeks[i]);
            if (!isNaN(elimWeek) && elimWeek <= weekNum) {
                return true;
            }
        }
    }
    return false;
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
            document.getElementById('tournament-start-week').value = tourn.startWeek || '1';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '52';
            document.getElementById('tournament-rounds').value = tourn.totalRounds || '1';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'New Tournament';
        form.reset();
        document.getElementById('tournament-mode').value = 'teams';
        document.getElementById('tournament-start-week').value = '1';
        document.getElementById('tournament-end-week').value = '52';
        document.getElementById('tournament-rounds').value = '1';
        delete form.dataset.editId;
    }
}

function saveTournament(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    var formData = {
        name: document.getElementById('tournament-name').value.trim(),
        mode: document.getElementById('tournament-mode').value,
        startWeek: parseInt(document.getElementById('tournament-start-week').value) || 1,
        endWeek: parseInt(document.getElementById('tournament-end-week').value) || 52,
        totalRounds: parseInt(document.getElementById('tournament-rounds').value) || 1
    };
    
    if (!formData.name) { alert('Tournament name is required.'); return; }
    if (formData.startWeek > formData.endWeek) {
        alert('Start week must be before end week.');
        return;
    }
    
    if (editId) {
        updateTournament(editId, formData);
        if (typeof logActivity === 'function') {
            logActivity('Updated tournament: ' + formData.name);
        }
    } else {
        createTournament(formData);
        if (typeof logActivity === 'function') {
            logActivity('Created tournament: ' + formData.name);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    closeTournamentForm();
    renderTournamentList();
}

function closeTournamentForm() {
    document.getElementById('tournament-form-modal').classList.add('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
    tournamentState.currentTournamentId = null;
}

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
    
    var form = document.getElementById('tournament-form-inner');
    if (form) {
        form.addEventListener('submit', saveTournament);
    }
    
    var closeDetailBtn = document.getElementById('close-tournament-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeTournamentDetail);
    }
    
    var addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', addParticipant);
    }
    
    var refreshBtn = document.getElementById('refresh-participants-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            if (tournId) {
                var tourn = getTournament(tournId);
                if (tourn) {
                    populateParticipantSelector(tourn);
                    viewTournament(tournId);
                }
            }
        });
    }
    
    var createRoundBtn = document.getElementById('create-round-btn');
    if (createRoundBtn) {
        createRoundBtn.addEventListener('click', createRound);
    }
    
    var closeMatchEdit = document.getElementById('close-match-edit');
    if (closeMatchEdit) {
        closeMatchEdit.addEventListener('click', function() {
            document.getElementById('match-edit-modal').classList.add('hidden');
        });
    }
    
    var cancelMatchEdit = document.getElementById('cancel-match-edit');
    if (cancelMatchEdit) {
        cancelMatchEdit.addEventListener('click', function() {
            document.getElementById('match-edit-modal').classList.add('hidden');
        });
    }
    
    var saveMatchEdit = document.getElementById('save-match-edit');
    if (saveMatchEdit) {
        saveMatchEdit.addEventListener('click', function() {
            document.getElementById('match-edit-modal').classList.add('hidden');
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            if (tournId) viewTournament(tournId);
        });
    }
    
    // Modal background clicks
    var formModal = document.getElementById('tournament-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentForm();
        });
    }
    
    var detailModal = document.getElementById('tournament-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
    }
    
    var matchModal = document.getElementById('match-edit-modal');
    if (matchModal) {
        matchModal.addEventListener('click', function(e) {
            if (e.target === this) document.getElementById('match-edit-modal').classList.add('hidden');
        });
    }
}

// ============================================================
// EXPOSE ALL FUNCTIONS GLOBALLY
// ============================================================
window.renderTournamentsView = renderTournamentsView;
window.renderTournamentList = renderTournamentList;
window.viewTournament = viewTournament;
window.showTournamentForm = showTournamentForm;
window.saveTournament = saveTournament;
window.closeTournamentForm = closeTournamentForm;
window.closeTournamentDetail = closeTournamentDetail;
window.initTournamentEvents = initTournamentEvents;
window.addParticipant = addParticipant;
window.createRound = createRound;
window.getAvailableParticipants = getAvailableParticipants;
window.completeRound = completeRound;
window.deleteRound = deleteRound;
window.deleteMatch = deleteMatch;
window.removeParticipant = removeParticipant;
window.showRoundMatches = showRoundMatches;
window.showAddMatchModal = showAddMatchModal;
window.showEditMatchModal = showEditMatchModal;
window.isCharacterEliminatedByWeek = isCharacterEliminatedByWeek;
window.populateParticipantSelector = populateParticipantSelector;
window.renderParticipants = renderParticipants;
window.renderRounds = renderRounds;
window.renderWinner = renderWinner;
