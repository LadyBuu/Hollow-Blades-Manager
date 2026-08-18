/**
 * tournaments-ui.js - Tournament UI Rendering
 * Simplified tournament management with auto-completion
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
                                <option value="">Add participant...</option>
                            </select>
                            <button id="add-participant-btn" class="primary small">Add</button>
                        </div>
                        <div id="participants-list" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;"></div>
                    </div>

                    <!-- Rounds Section -->
                    <div id="rounds-section" style="margin-bottom:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                            <h4 style="color:var(--accent);font-size:0.9rem;margin:0;">Rounds</h4>
                            <button id="create-round-btn" class="primary small">+ Create Round</button>
                            <span style="font-size:0.7rem;color:var(--text-dim);" id="rounds-status">0 / 0 rounds</span>
                        </div>
                        <div id="rounds-container"></div>
                    </div>

                    <!-- Elimination Management -->
                    <div id="elimination-section" style="margin-bottom:16px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                        <h4 style="color:var(--danger);font-size:0.9rem;margin-bottom:8px;">Individual Eliminations</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">
                            <select id="elimination-select" style="flex:1;min-width:150px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                <option value="">Select individual...</option>
                            </select>
                            <button id="eliminate-btn" class="danger small">Eliminate</button>
                            <button id="uneliminate-btn" class="secondary small">Restore</button>
                        </div>
                        <div id="elimination-list" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
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
            if (deleteTournament(btn.dataset.id)) {
                renderTournamentList();
                closeTournamentDetail();
            }
        });
    });
}

function viewTournament(id) {
    var tourn = getTournament(id);
    if (!tourn) return;
    
    ensureTournamentArrays(tourn);
    
    // Auto-check and update round statuses - optimized
    updateRoundStatuses(tourn);
    
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
    renderEliminations(tourn);
    renderWinner(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function updateRoundStatuses(tourn) {
    if (!tourn.rounds || tourn.rounds.length === 0) return;
    
    var allCompleted = true;
    var anyMatches = false;
    
    for (var i = 0; i < tourn.rounds.length; i++) {
        var round = tourn.rounds[i];
        if (!round.matches || round.matches.length === 0) {
            round.status = 'pending';
            allCompleted = false;
            continue;
        }
        anyMatches = true;
        
        var roundCompleted = true;
        for (var j = 0; j < round.matches.length; j++) {
            if (round.matches[j].status !== 'completed') {
                roundCompleted = false;
                allCompleted = false;
                break;
            }
        }
        round.status = roundCompleted ? 'completed' : 'pending';
    }
    
    // Only update tournament status if there are matches
    if (anyMatches && allCompleted && tourn.rounds.length > 0) {
        tourn.status = 'completed';
        // Determine winner from last match of last round
        var lastRound = tourn.rounds[tourn.rounds.length - 1];
        if (lastRound.matches && lastRound.matches.length > 0) {
            var lastMatch = lastRound.matches[lastRound.matches.length - 1];
            if (lastMatch.winner) {
                tourn.winner = lastMatch.winner;
            }
        }
    } else if (tourn.rounds.length > 0 && tourn.status === 'draft') {
        tourn.status = 'active';
    }
}

function ensureTournamentArrays(tourn) {
    if (!tourn) return;
    if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = [];
    if (!tourn.participants || !Array.isArray(tourn.participants)) tourn.participants = [];
    if (!tourn.eliminations || !Array.isArray(tourn.eliminations)) tourn.eliminations = [];
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
        teams.sort(function(a, b) { return a.name.localeCompare(b.name); });
        teams.forEach(function(t) {
            options.push({ id: t.id, name: t.name + ' (team)' });
        });
    } else {
        var trainees = data.characters.filter(function(c) {
            if (c.deceased) return false;
            if (existingIds.indexOf(c.id) !== -1) return false;
            if (isCharacterEliminatedByWeek(c, startWeek)) return false;
            var status = getCurrentStatus(c).toLowerCase();
            return status === 'trainee';
        });
        trainees.sort(function(a, b) {
            var nameA = [a.firstName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            var nameB = [b.firstName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        trainees.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            options.push({ id: c.id, name: name + ' (trainee)' });
        });
    }
    
    select.innerHTML = '<option value="">Add participant...</option>';
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
        container.innerHTML = '<span style="color:var(--text-dim);font-size:0.75rem;">No participants added</span>';
        return;
    }
    
    var html = '';
    tourn.participants.forEach(function(p) {
        var name = getParticipantName(p.id);
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(p.id); });
        var color = isEliminated ? 'var(--danger)' : 'var(--border)';
        var status = isEliminated ? ' \u274C' : '';
        
        html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.75rem;border:1px solid ' + color + ';">';
        html += name + status;
        html += ' <button class="remove-participant small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + p.id + '">\u2715</button>';
        html += '</span>';
    });
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
    
    if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = [];
    
    var roundCount = tourn.rounds.length;
    if (status) status.textContent = roundCount + ' / ' + tourn.totalRounds + ' rounds';
    
    if (roundCount === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No rounds created.</p>';
        return;
    }
    
    var html = '';
    tourn.rounds.forEach(function(round, roundIndex) {
        var roundLabel = (roundIndex + 1);
        var isCompleted = round.status === 'completed';
        var matchCount = round.matches ? round.matches.length : 0;
        
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-bottom:8px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">';
        html += '<div><strong style="color:var(--accent);">Round ' + roundLabel + '</strong> <span style="color:var(--text-dim);font-size:0.7rem;">(' + matchCount + ' matches)</span>';
        html += ' <span style="font-size:0.65rem;padding:1px 8px;border-radius:8px;background:' + 
            (isCompleted ? 'var(--info-soft);color:var(--info);' : 'var(--bg);color:var(--text-dim);') + '">' + 
            (isCompleted ? '\u2713 Complete' : (matchCount > 0 ? 'In progress' : 'Empty')) + '</span>';
        html += '</div>';
        html += '<button class="small danger delete-round-btn" data-round="' + roundIndex + '">\u2715</button>';
        html += '</div>';
        
        // Add match button (only if round not completed)
        if (!isCompleted) {
            html += '<button class="small primary add-match-btn" data-round="' + roundIndex + '" style="margin-bottom:6px;">+ Add Match</button>';
        }
        
        // Matches
        if (round.matches && round.matches.length > 0) {
            html += '<div style="display:flex;flex-direction:column;gap:4px;padding-left:8px;">';
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
                var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 'var(--warning)';
                var borderColor = matchStatus === 'completed' ? 'var(--accent)' : 'var(--warning)';
                
                html += '<div class="match-item" data-round="' + roundIndex + '" data-match="' + matchIndex + '" style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:4px;border-left:3px solid ' + borderColor + ';cursor:pointer;">';
                html += '<span style="font-size:0.75rem;"><strong>' + participantNames.join(' vs ') + '</strong></span>';
                html += '<span style="font-size:0.65rem;color:' + statusColor + ';">' + matchStatus + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    
    // Match click to edit
    container.querySelectorAll('.match-item').forEach(function(el) {
        el.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            var matchIndex = parseInt(this.dataset.match);
            showEditMatchModal(tourn.id, roundIndex, matchIndex);
        });
    });
    
    container.querySelectorAll('.add-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            showAddMatchModal(tourn.id, roundIndex);
        });
    });
    
    container.querySelectorAll('.delete-round-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var roundIndex = parseInt(this.dataset.round);
            deleteRound(tourn.id, roundIndex);
        });
    });
}

function renderEliminations(tourn) {
    var container = document.getElementById('elimination-list');
    var select = document.getElementById('elimination-select');
    
    // Populate elimination select with all participants
    if (select) {
        var participants = tourn.participants || [];
        var currentValue = select.value;
        select.innerHTML = '<option value="">Select individual...</option>';
        
        // Get all characters from participants (including team members)
        var allChars = [];
        
        // First, get individual participants (for individual mode or characters)
        participants.forEach(function(p) {
            var char = data.characters.find(function(c) { return String(c.id) === String(p.id); });
            if (char) {
                var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                var teamName = '';
                data.teams.forEach(function(t) {
                    if (t.members) {
                        t.members.forEach(function(m) {
                            if (String(m.characterId) === String(char.id)) {
                                teamName = t.name;
                            }
                        });
                    }
                });
                allChars.push({
                    id: char.id,
                    name: name,
                    team: teamName,
                    isEliminated: tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(char.id); })
                });
            }
        });
        
        // For team mode, also get all team members
        if (tourn.mode === 'teams') {
            participants.forEach(function(p) {
                var team = data.teams.find(function(t) { return String(t.id) === String(p.id); });
                if (team && team.members) {
                    team.members.forEach(function(member) {
                        var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                        if (char) {
                            var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
                            var isInList = allChars.some(function(c) { return String(c.id) === String(char.id); });
                            if (!isInList) {
                                allChars.push({
                                    id: char.id,
                                    name: name,
                                    team: team.name,
                                    isEliminated: tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(char.id); })
                                });
                            }
                        }
                    });
                }
            });
        }
        
        // Remove duplicates
        var seen = {};
        allChars = allChars.filter(function(c) {
            if (seen[c.id]) return false;
            seen[c.id] = true;
            return true;
        });
        
        allChars.sort(function(a, b) { return a.name.localeCompare(b.name); });
        
        allChars.forEach(function(c) {
            var option = document.createElement('option');
            option.value = c.id;
            var teamDisplay = c.team ? ' (' + c.team + ')' : '';
            option.textContent = c.name + teamDisplay + (c.isEliminated ? ' \u274C' : '');
            if (c.isEliminated) {
                option.style.color = 'var(--danger)';
            }
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    }
    
    // Render eliminated list
    if (!tourn.eliminations || tourn.eliminations.length === 0) {
        container.innerHTML = '<span style="color:var(--text-dim);font-size:0.75rem;">No eliminations</span>';
        return;
    }
    
    var html = '';
    tourn.eliminations.forEach(function(elim) {
        var name = getParticipantName(elim.participantId);
        var teamName = '';
        data.teams.forEach(function(t) {
            if (t.members) {
                t.members.forEach(function(m) {
                    if (String(m.characterId) === String(elim.participantId)) {
                        teamName = t.name;
                    }
                });
            }
        });
        html += '<span style="background:var(--danger-soft);padding:2px 8px;border-radius:10px;font-size:0.75rem;border:1px solid var(--danger);">';
        html += name + (teamName ? ' (' + teamName + ')' : '') + ' \u274C';
        html += ' <button class="uneliminate-btn small" style="background:none;border:none;color:var(--text);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-id="' + elim.participantId + '">\u21BB</button>';
        html += '</span>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.uneliminate-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            uneliminateParticipant(tourn.id, this.dataset.id);
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
    if (!modal) {
        createMatchEditModal();
        modal = document.getElementById('match-edit-modal');
    }
    
    document.getElementById('match-edit-title').textContent = 'Add Match - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('match-edit-content');
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Click participants to add/remove them from the match. Select <strong>' + (tourn.mode === 'teams' ? 'teams' : 'players') + '</strong> for this match.</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;padding:8px;background:var(--panel-alt);border-radius:6px;min-height:40px;border:1px dashed var(--border);" id="match-selected-participants">';
    html += '<span style="color:var(--text-dim);font-size:0.7rem;padding:4px;">Click participants below to select them...</span>';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Match size (number of participants):</label>';
    html += '<input type="number" id="match-size-input" min="2" max="10" value="2" style="width:60px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;margin-left:8px;">';
    html += '</div>';
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;" id="match-available-participants">';
    availableParticipants.forEach(function(id) {
        var name = getParticipantName(id);
        html += '<button class="small participant-tag" data-id="' + id + '" style="background:var(--panel-alt);border:1px solid var(--border);padding:4px 10px;border-radius:10px;cursor:pointer;">' + name + '</button>';
    });
    html += '</div>';
    
    html += '<div class="form-actions">';
    html += '<button type="button" id="cancel-add-match" class="secondary">Cancel</button>';
    html += '<button type="button" id="create-match-submit" class="primary">Create Match</button>';
    html += '</div>';
    
    content.innerHTML = html;
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    
    var selectedIds = [];
    var selectedContainer = document.getElementById('match-selected-participants');
    var availableContainer = document.getElementById('match-available-participants');
    
    function updateSelection() {
        var matchSize = parseInt(document.getElementById('match-size-input').value) || 2;
        
        if (selectedIds.length === 0) {
            selectedContainer.innerHTML = '<span style="color:var(--text-dim);font-size:0.7rem;padding:4px;">Click participants below to select them...</span>';
        } else {
            var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;width:100%;">';
            selectedIds.forEach(function(id) {
                var name = getParticipantName(id);
                html += '<span style="background:var(--accent-soft);padding:2px 10px;border-radius:10px;font-size:0.75rem;border:1px solid var(--accent);display:inline-flex;align-items:center;gap:4px;">' + name + ' <button class="remove-selected small" data-id="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;">\u2715</button></span>';
            });
            var remaining = matchSize - selectedIds.length;
            if (remaining > 0) {
                html += '<span style="color:var(--text-dim);font-size:0.65rem;padding:4px;">Add ' + remaining + ' more</span>';
            } else {
                html += '<span style="color:var(--accent);font-size:0.65rem;padding:4px;">\u2713 Ready!</span>';
            }
            html += '</div>';
            selectedContainer.innerHTML = html;
        }
        
        // Update available tags
        availableContainer.querySelectorAll('.participant-tag').forEach(function(btn) {
            var id = btn.dataset.id;
            if (selectedIds.indexOf(id) !== -1) {
                btn.style.background = 'var(--accent-soft)';
                btn.style.borderColor = 'var(--accent)';
                btn.textContent = getParticipantName(id) + ' \u2713';
            } else {
                btn.style.background = 'var(--panel-alt)';
                btn.style.borderColor = 'var(--border)';
                btn.textContent = getParticipantName(id);
            }
        });
    }
    
    // Click on participant to toggle selection
    availableContainer.querySelectorAll('.participant-tag').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            var matchSize = parseInt(document.getElementById('match-size-input').value) || 2;
            var idx = selectedIds.indexOf(id);
            if (idx !== -1) {
                selectedIds.splice(idx, 1);
            } else if (selectedIds.length < matchSize) {
                selectedIds.push(id);
            } else {
                alert('Maximum participants reached for this match (' + matchSize + ').');
            }
            updateSelection();
        });
    });
    
    // Remove selected
    selectedContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-selected')) {
            var id = e.target.dataset.id;
            var idx = selectedIds.indexOf(id);
            if (idx !== -1) selectedIds.splice(idx, 1);
            updateSelection();
        }
    });
    
    // Match size change
    document.getElementById('match-size-input').addEventListener('change', function() {
        var matchSize = parseInt(this.value) || 2;
        if (selectedIds.length > matchSize) {
            alert('You have ' + selectedIds.length + ' participants selected, but the match only allows ' + matchSize + '.');
            selectedIds = selectedIds.slice(0, matchSize);
        }
        updateSelection();
    });
    
    document.getElementById('create-match-submit').onclick = function() {
        var matchSize = parseInt(document.getElementById('match-size-input').value) || 2;
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
    
    updateSelection();
    modal.classList.remove('hidden');
}

function showEditMatchModal(tournId, roundIndex, matchIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    var modal = document.getElementById('match-edit-modal');
    if (!modal) {
        createMatchEditModal();
        modal = document.getElementById('match-edit-modal');
    }
    
    document.getElementById('match-edit-title').textContent = 'Edit Match - Round ' + (roundIndex + 1);
    
    var content = document.getElementById('match-edit-content');
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.8rem;">Participants:</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    match.participants.forEach(function(id) {
        var name = getParticipantName(id);
        var isWinner = match.winner && String(match.winner) === String(id);
        var isLoser = match.loser && String(match.loser) === String(id);
        var style = 'background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.75rem;border:1px solid var(--border-soft);';
        if (isWinner) style += 'border-color:var(--accent);';
        else if (isLoser) style += 'border-color:var(--danger);';
        html += '<span style="' + style + '">' + name + (isWinner ? ' \u2605' : '') + (isLoser ? ' \u274C' : '') + '</span>';
    });
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Winner:</label>';
    html += '<select id="edit-match-winner" style="padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;">';
    html += '<option value="">None</option>';
    match.participants.forEach(function(id) {
        var name = getParticipantName(id);
        var selected = match.winner && String(match.winner) === String(id) ? 'selected' : '';
        html += '<option value="' + id + '" ' + selected + '>' + name + '</option>';
    });
    html += '</select>';
    html += '</div>';
    
    if (tourn.mode === 'teams') {
        html += '<div style="margin-bottom:12px;">';
        html += '<label style="font-size:0.7rem;color:var(--text-dim);">Loser (team eliminated):</label>';
        html += '<select id="edit-match-loser" style="padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;">';
        html += '<option value="">None</option>';
        match.participants.forEach(function(id) {
            var name = getParticipantName(id);
            var selected = match.loser && String(match.loser) === String(id) ? 'selected' : '';
            html += '<option value="' + id + '" ' + selected + '>' + name + '</option>';
        });
        html += '</select>';
        html += '<span style="font-size:0.6rem;color:var(--text-dim);margin-left:8px;">The losing team is eliminated from the tournament (individual eliminations handled separately).</span>';
        html += '</div>';
    }
    
    html += '<div class="form-actions">';
    html += '<button type="button" id="save-edit-match" class="primary">Save</button>';
    html += '<button type="button" id="delete-match-btn" class="danger">Delete Match</button>';
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
            if (!tourn.eliminations) tourn.eliminations = [];
            if (!tourn.eliminations.some(function(e) { return String(e.participantId) === String(loserId); })) {
                tourn.eliminations.push({
                    participantId: loserId,
                    week: parseInt(tourn.startWeek) || 1,
                    reason: 'Lost in Round ' + (roundIndex + 1)
                });
            }
        } else if (tourn.mode === 'individuals' && winnerId) {
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
        
        // Auto-update round and tournament status
        updateRoundStatuses(tourn);
        
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        modal.classList.add('hidden');
        viewTournament(tournId);
    };
    
    document.getElementById('delete-match-btn').onclick = function() {
        if (confirm('Delete this match?')) {
            deleteMatch(tournId, roundIndex, matchIndex);
            modal.classList.add('hidden');
        }
    };
    
    document.getElementById('cancel-edit-match').onclick = function() {
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

function createMatchEditModal() {
    var modal = document.createElement('div');
    modal.id = 'match-edit-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3 id="match-edit-title">Edit Match</h3>
                <button class="close-modal" id="close-match-edit">&times;</button>
            </div>
            <div class="modal-body">
                <div id="match-edit-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('close-match-edit').addEventListener('click', function() {
        document.getElementById('match-edit-modal').classList.add('hidden');
    });
    modal.addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });
}

function getAvailableParticipants(tourn, roundNumber) {
    if (!tourn.participants) return [];
    
    var eliminatedIds = [];
    if (tourn.eliminations) {
        tourn.eliminations.forEach(function(e) {
            eliminatedIds.push(e.participantId);
        });
    }
    
    var usedInRound = [];
    if (tourn.rounds) {
        tourn.rounds.forEach(function(r) {
            if (r.roundNumber === roundNumber && r.matches) {
                r.matches.forEach(function(m) {
                    if (m.participants) {
                        m.participants.forEach(function(id) {
                            usedInRound.push(id);
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
        if (usedInRound.indexOf(id) !== -1) return;
        available.push(id);
    });
    
    return available;
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

function removeParticipant(tournId, participantId) {
    if (!confirm('Remove this participant from the tournament?')) return;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    tourn.participants = tourn.participants.filter(function(p) { return String(p.id) !== String(participantId); });
    if (tourn.eliminations) {
        tourn.eliminations = tourn.eliminations.filter(function(e) { return String(e.participantId) !== String(participantId); });
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function eliminateParticipant() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    var select = document.getElementById('elimination-select');
    var id = select.value;
    if (!id) { alert('Please select an individual to eliminate.'); return; }
    
    if (tourn.eliminations && tourn.eliminations.some(function(e) { return String(e.participantId) === String(id); })) {
        alert('Already eliminated.');
        return;
    }
    
    if (!tourn.eliminations) tourn.eliminations = [];
    tourn.eliminations.push({
        participantId: id,
        week: parseInt(tourn.startWeek) || 1,
        reason: 'Eliminated'
    });
    
    var char = data.characters.find(function(c) { return String(c.id) === String(id); });
    if (char) {
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        var weekNum = parseInt(tourn.startWeek) || 1;
        if (char.eliminatedWeeks.indexOf(weekNum) === -1) {
            char.eliminatedWeeks.push(weekNum);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function uneliminateParticipant(tournId, participantId) {
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    tourn.eliminations = tourn.eliminations.filter(function(e) { return String(e.participantId) !== String(participantId); });
    
    var char = data.characters.find(function(c) { return String(c.id) === String(participantId); });
    if (char && char.eliminatedWeeks) {
        var weekNum = parseInt(tourn.startWeek) || 1;
        var idx = char.eliminatedWeeks.indexOf(weekNum);
        if (idx !== -1) {
            char.eliminatedWeeks.splice(idx, 1);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function createRound() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    if (!tourn.rounds) tourn.rounds = [];
    if (tourn.rounds.length >= tourn.totalRounds) {
        alert('Maximum rounds reached for this tournament.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants to create a round.');
        return;
    }
    
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
    viewTournament(tournId);
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
        var tourn = updateTournament(editId, formData);
        if (tourn) {
            ensureTournamentArrays(tourn);
        }
        if (typeof logActivity === 'function') {
            logActivity('Updated tournament: ' + formData.name);
        }
    } else {
        var tourn = createTournament(formData);
        ensureTournamentArrays(tourn);
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
    var detailModal = document.getElementById('tournament-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
    }
    
    var addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', addParticipant);
    }
    
    var createRoundBtn = document.getElementById('create-round-btn');
    if (createRoundBtn) {
        createRoundBtn.addEventListener('click', createRound);
    }
    
    var eliminateBtn = document.getElementById('eliminate-btn');
    if (eliminateBtn) {
        eliminateBtn.addEventListener('click', eliminateParticipant);
    }
    
    var uneliminateBtn = document.getElementById('uneliminate-btn');
    if (uneliminateBtn) {
        uneliminateBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (!tourn) return;
            var select = document.getElementById('elimination-select');
            var id = select.value;
            if (!id) { alert('Please select an individual.'); return; }
            uneliminateParticipant(tournId, id);
        });
    }
    
    var formModal = document.getElementById('tournament-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentForm();
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
window.deleteRound = deleteRound;
window.deleteMatch = deleteMatch;
window.removeParticipant = removeParticipant;
window.eliminateParticipant = eliminateParticipant;
window.uneliminateParticipant = uneliminateParticipant;
window.renderEliminations = renderEliminations;
window.ensureTournamentArrays = ensureTournamentArrays;
window.updateRoundStatuses = updateRoundStatuses;

console.log('tournaments-ui.js loaded');
