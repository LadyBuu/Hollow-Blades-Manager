/**
 * tournaments-individuals.js - Individual Tournament Logic
 * Rounds, matches, and participant management
 */

/**
 * Populate character selector for individual mode
 */
function populateCharacterSelector(tourn) {
    var select = document.getElementById('tournament-char-select');
    if (!select) return;
    
    var startWeek = parseInt(tourn.startWeek) || 1;
    var existingIds = (tourn.participants || []).map(function(p) { return p.characterId; });
    
    var available = data.characters.filter(function(c) {
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
        return status !== 'civilian' && status !== '';
    });
    
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
 * Add character to tournament
 */
function addCharacterToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = getTournament(tournId);
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
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    tourn.participants = tourn.participants.filter(function(p) { return String(p.characterId) !== String(charId); });
    
    if (tourn.rounds) {
        tourn.rounds.forEach(function(round) {
            if (round.matches) {
                round.matches = round.matches.filter(function(m) {
                    return !m.participants || !m.participants.some(function(id) { return String(id) === String(charId); });
                });
            }
        });
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
 * Render tournament characters
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
        
        var roundStatus = '';
        if (tourn.rounds) {
            tourn.rounds.forEach(function(round) {
                round.matches.forEach(function(match) {
                    if (match.participants && match.participants.some(function(id) { return String(id) === String(entry.characterId); })) {
                        if (match.winnerIds && match.winnerIds.some(function(id) { return String(id) === String(entry.characterId); })) {
                            roundStatus = '\uD83C\uDFC6 ';
                        } else if (match.loserIds && match.loserIds.some(function(id) { return String(id) === String(entry.characterId); })) {
                            roundStatus = '\u274C ';
                        } else if (match.status === 'completed') {
                            roundStatus = '\u2B06\uFE0F ';
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
        var elimMarker = isEliminated ? ' \u274C' : '';
        
        html += '<span style="background:var(--panel-alt);padding:4px 10px;border-radius:12px;font-size:0.75rem;' + style + ';">';
        html += roundStatus + name + (isWinner ? ' \u2605' : '') + elimMarker + ' (' + status + ')' + deadMarker;
        html += ' <button class="remove-char-from-tournament small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;" data-char="' + entry.characterId + '">\u2715</button>';
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
 * Get available participants for a round
 */
function getAvailableParticipantsForRound(tourn, roundNumber) {
    var availableParticipants = [];
    var startWeek = parseInt(tourn.startWeek) || 1;
    
    if (!tourn.participants) return availableParticipants;
    
    var eliminatedIds = [];
    if (tourn.eliminations) {
        tourn.eliminations.forEach(function(elim) {
            var elimWeek = parseInt(elim.week);
            if (!isNaN(elimWeek) && elimWeek <= startWeek) {
                eliminatedIds.push(elim.characterId);
            }
        });
    }
    
    if (tourn.rounds) {
        tourn.rounds.forEach(function(r) {
            if (r.matches) {
                r.matches.forEach(function(m) {
                    if (m.participants) {
                        m.participants.forEach(function(id) {
                            if (m.loserIds && m.loserIds.some(function(lid) { return String(lid) === String(id); })) {
                                eliminatedIds.push(id);
                            }
                        });
                    }
                });
            }
        });
    }
    
    tourn.participants.forEach(function(p) {
        var charId = p.characterId;
        if (eliminatedIds.some(function(id) { return String(id) === String(charId); })) {
            return;
        }
        availableParticipants.push(charId);
    });
    
    var unique = [];
    var seen = {};
    availableParticipants.forEach(function(id) {
        if (!seen[id]) {
            seen[id] = true;
            unique.push(id);
        }
    });
    
    return unique;
}

/**
 * Render rounds
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
    
    tourn.rounds.forEach(function(round, roundIndex) {
        var roundLabel = String.fromCharCode(65 + roundIndex);
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
            (isCompleted ? '\u2713 Completed' : isInProgress ? '\u23F3 In Progress' : '\u23F8 Pending') + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="small info-btn view-round-matches" data-round="' + roundIndex + '">View Matches</button>';
        if (!isCompleted) {
            html += '<button class="small primary complete-round-btn" data-round="' + roundIndex + '">Complete Round</button>';
        }
        html += '<button class="small danger delete-round-btn" data-round="' + roundIndex + '">\u2715</button>';
        html += '</div>';
        html += '</div>';
        
        if (round.matches && round.matches.length > 0) {
            html += '<div style="padding-left:8px;border-left:2px solid var(--border-soft);">';
            round.matches.forEach(function(match, matchIndex) {
                var matchStatus = match.status || 'pending';
                var statusColor = matchStatus === 'completed' ? 'var(--accent)' : 
                                  matchStatus === 'in_progress' ? 'var(--warning)' : 'var(--text-dim)';
                
                var participantNames = [];
                if (match.participants) {
                    match.participants.forEach(function(id) {
                        var name = getParticipantNameById(id);
                        var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                        var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                        var label = name;
                        if (isWinner) label += ' \uD83C\uDFC6';
                        else if (isLoser) label += ' \u274C';
                        else if (matchStatus === 'completed') label += ' \u2B06\uFE0F';
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
 * Add a round to the tournament
 */
function addRound() {
    console.log('addRound called');
    
    var modal = document.getElementById('tournament-detail-modal');
    if (!modal) {
        alert('Please open a tournament first.');
        return;
    }
    
    var tournId = modal.dataset.tournamentId;
    if (!tournId) {
        alert('Tournament not found. Please refresh and try again.');
        return;
    }
    
    var tourn = getTournament(tournId);
    if (!tourn) {
        alert('Tournament not found. Please refresh and try again.');
        return;
    }
    
    if (tourn.mode !== 'individuals') {
        alert('Rounds are only available for individual tournaments.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants to create a round.');
        return;
    }
    
    if (!tourn.rounds) tourn.rounds = [];
    var roundNumber = tourn.rounds.length + 1;
    
    var availableParticipants = getAvailableParticipantsForRound(tourn, roundNumber);
    
    if (availableParticipants.length < 2) {
        alert('Not enough available participants for a new round. Need at least 2 participants who are not eliminated.');
        return;
    }
    
    showRoundMatchCreator(tournId, roundNumber, availableParticipants);
}

/**
 * Show round match creator
 */
function showRoundMatchCreator(tournId, roundNumber, availableParticipants) {
    var modal = document.getElementById('match-detail-modal');
    if (!modal) {
        alert('Modal not found. Please refresh.');
        return;
    }
    
    document.getElementById('match-detail-title').textContent = 'Create Matches - Round ' + String.fromCharCode(64 + roundNumber);
    
    var content = document.getElementById('match-detail-content');
    if (!content) {
        alert('Content area not found. Please refresh.');
        return;
    }
    
    var creatorState = {
        selectedIds: [],
        createdMatches: [],
        availableParticipants: availableParticipants.slice(),
        matchType: 2
    };
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    html += '<span style="color:var(--text-dim);font-size:0.8rem;">Available participants: <strong id="available-count">' + availableParticipants.length + '</strong></span>';
    html += '<span style="color:var(--text-dim);font-size:0.8rem;">Matches created: <strong id="created-count">0</strong></span>';
    html += '</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;" id="available-participants-display">';
    if (availableParticipants.length === 0) {
        html += '<span style="color:var(--text-dim);font-size:0.7rem;">No participants available</span>';
    } else {
        availableParticipants.forEach(function(id) {
            var name = getParticipantNameById(id);
            html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--border-soft);" data-id="' + id + '">' + name + '</span>';
        });
    }
    html += '</div>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;">';
    html += '<label style="font-size:0.7rem;color:var(--text-dim);">Match Type:</label>';
    html += '<select id="new-match-type" style="padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.75rem;margin-left:8px;width:auto;">';
    html += '<option value="2">1v1 (2 players)</option>';
    html += '<option value="3">1v1v1 (3 players)</option>';
    html += '<option value="4">1v1v1v1 (4 players)</option>';
    html += '<option value="5">1v1v1v1v1 (5 players)</option>';
    html += '<option value="6">1v1v1v1v1v1 (6 players)</option>';
    html += '<option value="8">8-player Free-for-All</option>';
    html += '</select>';
    html += '<span style="font-size:0.6rem;color:var(--text-dim);margin-left:4px;">Select how many players per match</span>';
    html += '</div>';
    
    html += '<div id="new-match-participants" style="margin-bottom:12px;padding:8px;background:var(--panel-alt);border-radius:6px;border:1px solid var(--border-soft);min-height:50px;">';
    html += '<div style="color:var(--text-dim);font-size:0.7rem;text-align:center;padding:8px;">No participants selected. Use "Add Participant" below.</div>';
    html += '</div>';
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">';
    html += '<button id="add-participant-to-match" class="small secondary">+ Add Participant</button>';
    html += '<button id="clear-match-participants" class="small secondary">Clear All</button>';
    html += '<button id="create-match-btn" class="primary small" style="margin-left:8px;" disabled>Create Match</button>';
    html += '</div>';
    
    html += '<div style="margin-bottom:12px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">';
    html += '<p style="font-size:0.7rem;color:var(--text-dim);">';
    html += '\u2022 Click "Add Participant" and select a player from the dropdown.<br>';
    html += '\u2022 When you have enough players, click "Create Match".<br>';
    html += '\u2022 Created matches appear below. Click "Save All Matches" when done.';
    html += '</p></div>';
    
    html += '<div id="created-matches-list" style="margin-bottom:12px;">';
    html += '<p style="color:var(--text-dim);font-size:0.7rem;">No matches created yet.</p>';
    html += '</div>';
    
    html += '<div class="form-actions" style="margin-top:8px;">';
    html += '<button type="button" id="cancel-match-creator" class="secondary">Cancel</button>';
    html += '<button type="button" id="save-match-creator" class="primary" disabled>Save All Matches (0)</button>';
    html += '</div>';
    
    content.innerHTML = html;
    
    content.dataset.tournId = tournId;
    content.dataset.roundNumber = roundNumber;
    
    var selectedContainer = document.getElementById('new-match-participants');
    var createdList = document.getElementById('created-matches-list');
    var addBtn = document.getElementById('add-participant-to-match');
    var clearBtn = document.getElementById('clear-match-participants');
    var createBtn = document.getElementById('create-match-btn');
    var saveBtn = document.getElementById('save-match-creator');
    var cancelBtn = document.getElementById('cancel-match-creator');
    var matchTypeSelect = document.getElementById('new-match-type');
    var availDisplay = document.getElementById('available-participants-display');
    
    function updateAvailableDisplay() {
        if (!availDisplay) return;
        
        if (creatorState.availableParticipants.length === 0) {
            availDisplay.innerHTML = '<span style="color:var(--text-dim);font-size:0.7rem;">No participants available</span>';
            return;
        }
        
        var html = '';
        creatorState.availableParticipants.forEach(function(id) {
            var name = getParticipantNameById(id);
            html += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--border-soft);" data-id="' + id + '">' + name + '</span>';
        });
        availDisplay.innerHTML = html;
        
        var countEl = document.getElementById('available-count');
        if (countEl) countEl.textContent = creatorState.availableParticipants.length;
    }
    
    function updateSelectedDisplay() {
        var matchType = parseInt(matchTypeSelect.value) || 2;
        
        if (creatorState.selectedIds.length === 0) {
            selectedContainer.innerHTML = '<div style="color:var(--text-dim);font-size:0.7rem;text-align:center;padding:8px;">No participants selected. Click "Add Participant" to select players.</div>';
        } else {
            var html = '<div style="margin-bottom:4px;"><span style="font-size:0.7rem;color:var(--text-dim);">Selected (' + creatorState.selectedIds.length + '/' + matchType + '):</span></div>';
            creatorState.selectedIds.forEach(function(id, index) {
                var name = getParticipantNameById(id);
                html += '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">';
                html += '<span style="background:var(--accent-soft);padding:2px 8px;border-radius:10px;font-size:0.7rem;border:1px solid var(--accent);">' + name + '</span>';
                html += '<button class="small danger remove-selected-participant" data-index="' + index + '" style="padding:0 4px;font-size:0.6rem;">\u2715</button>';
                html += '</div>';
            });
            var remaining = matchType - creatorState.selectedIds.length;
            if (remaining > 0) {
                html += '<div style="color:var(--text-dim);font-size:0.6rem;margin-top:2px;">Add ' + remaining + ' more participant(s) to complete this match.</div>';
            } else {
                html += '<div style="color:var(--accent);font-size:0.6rem;margin-top:2px;">\u2713 Match is ready! Click "Create Match".</div>';
            }
            selectedContainer.innerHTML = html;
        }
        
        selectedContainer.querySelectorAll('.remove-selected-participant').forEach(function(btn) {
            btn.onclick = function() {
                var idx = parseInt(this.dataset.index);
                var removedId = creatorState.selectedIds[idx];
                creatorState.selectedIds.splice(idx, 1);
                if (removedId && creatorState.availableParticipants.indexOf(removedId) === -1) {
                    creatorState.availableParticipants.push(removedId);
                    creatorState.availableParticipants.sort();
                }
                updateSelectedDisplay();
                updateAvailableDisplay();
                updateButtonStates();
            };
        });
        
        updateButtonStates();
    }
    
    function updateButtonStates() {
        var matchType = parseInt(matchTypeSelect.value) || 2;
        var canCreate = creatorState.selectedIds.length >= 2 && creatorState.selectedIds.length === matchType;
        createBtn.disabled = !canCreate;
        createBtn.style.opacity = canCreate ? '1' : '0.5';
        
        var matchCount = creatorState.createdMatches.length;
        saveBtn.disabled = matchCount === 0;
        saveBtn.textContent = 'Save All Matches (' + matchCount + ')';
        saveBtn.style.opacity = matchCount === 0 ? '0.5' : '1';
        
        var countEl = document.getElementById('created-count');
        if (countEl) countEl.textContent = matchCount;
    }
    
    function updateCreatedMatchesDisplay() {
        if (creatorState.createdMatches.length === 0) {
            createdList.innerHTML = '<p style="color:var(--text-dim);font-size:0.7rem;">No matches created yet.</p>';
            return;
        }
        
        var html = '<div style="margin-bottom:4px;"><span style="font-size:0.7rem;color:var(--text-dim);">Created Matches:</span></div>';
        creatorState.createdMatches.forEach(function(match, index) {
            var names = match.participants.map(function(id) {
                return getParticipantNameById(id);
            });
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:4px;margin-bottom:4px;border-left:3px solid var(--accent);">';
            html += '<span style="font-size:0.75rem;">Match ' + (index + 1) + ': <strong>' + names.join(' vs ') + '</strong></span>';
            html += '<button class="small danger remove-created-match" data-index="' + index + '" style="padding:0 4px;font-size:0.6rem;">\u2715</button>';
            html += '</div>';
        });
        createdList.innerHTML = html;
        
        createdList.querySelectorAll('.remove-created-match').forEach(function(btn) {
            btn.onclick = function() {
                var idx = parseInt(this.dataset.index);
                var match = creatorState.createdMatches[idx];
                match.participants.forEach(function(id) {
                    if (creatorState.availableParticipants.indexOf(id) === -1) {
                        creatorState.availableParticipants.push(id);
                        creatorState.availableParticipants.sort();
                    }
                });
                creatorState.createdMatches.splice(idx, 1);
                updateCreatedMatchesDisplay();
                updateAvailableDisplay();
                updateSelectedDisplay();
                updateButtonStates();
            };
        });
        
        updateButtonStates();
    }
    
    if (addBtn) {
        addBtn.onclick = function() {
            var matchType = parseInt(matchTypeSelect.value) || 2;
            
            if (creatorState.selectedIds.length >= matchType) {
                alert('You have already selected the maximum number of participants for this match type (' + matchType + '). Click "Create Match" to create the match.');
                return;
            }
            
            if (creatorState.availableParticipants.length === 0) {
                alert('No more participants available.');
                return;
            }
            
            var container = document.getElementById('new-match-participants');
            var selectHtml = '<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;" id="temp-select-wrapper">';
            selectHtml += '<select id="temp-participant-select" style="flex:1;padding:4px 8px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:0.7rem;">';
            selectHtml += '<option value="">Select participant...</option>';
            creatorState.availableParticipants.forEach(function(id) {
                var name = getParticipantNameById(id);
                selectHtml += '<option value="' + id + '">' + name + '</option>';
            });
            selectHtml += '</select>';
            selectHtml += '<button id="confirm-add-participant" class="primary small" style="padding:2px 8px;">Add</button>';
            selectHtml += '<button id="cancel-add-participant" class="secondary small" style="padding:2px 8px;">\u2715</button>';
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
            
            var confirmBtn = document.getElementById('confirm-add-participant');
            var cancelBtn2 = document.getElementById('cancel-add-participant');
            var tempSelect = document.getElementById('temp-participant-select');
            
            if (confirmBtn) {
                confirmBtn.onclick = function() {
                    var id = tempSelect.value;
                    if (!id) {
                        alert('Please select a participant.');
                        return;
                    }
                    var idx = creatorState.availableParticipants.indexOf(id);
                    if (idx !== -1) {
                        creatorState.availableParticipants.splice(idx, 1);
                    }
                    creatorState.selectedIds.push(id);
                    var wrapper = document.getElementById('temp-select-wrapper');
                    if (wrapper) wrapper.remove();
                    updateSelectedDisplay();
                    updateAvailableDisplay();
                    updateButtonStates();
                };
            }
            if (cancelBtn2) {
                cancelBtn2.onclick = function() {
                    var wrapper = document.getElementById('temp-select-wrapper');
                    if (wrapper) wrapper.remove();
                };
            }
        };
    }
    
    if (clearBtn) {
        clearBtn.onclick = function() {
            creatorState.selectedIds.forEach(function(id) {
                if (creatorState.availableParticipants.indexOf(id) === -1) {
                    creatorState.availableParticipants.push(id);
                    creatorState.availableParticipants.sort();
                }
            });
            creatorState.selectedIds = [];
            updateSelectedDisplay();
            updateAvailableDisplay();
            updateButtonStates();
        };
    }
    
    if (createBtn) {
        createBtn.onclick = function() {
            var matchType = parseInt(matchTypeSelect.value) || 2;
            
            if (creatorState.selectedIds.length < 2) {
                alert('Please select at least 2 participants.');
                return;
            }
            if (creatorState.selectedIds.length !== matchType) {
                alert('You need exactly ' + matchType + ' participants for this match type. You have ' + creatorState.selectedIds.length + '.');
                return;
            }
            
            creatorState.createdMatches.push({
                participants: creatorState.selectedIds.slice()
            });
            
            creatorState.selectedIds = [];
            updateSelectedDisplay();
            updateAvailableDisplay();
            updateCreatedMatchesDisplay();
            updateButtonStates();
            
            var btn = this;
            var origText = btn.textContent;
            btn.textContent = '\u2713 Created!';
            btn.disabled = true;
            setTimeout(function() {
                btn.textContent = origText;
                btn.disabled = false;
                updateButtonStates();
            }, 1000);
        };
    }
    
    if (saveBtn) {
        saveBtn.onclick = function() {
            var tourn = getTournament(tournId);
            if (!tourn) {
                alert('Tournament not found.');
                return;
            }
            
            if (creatorState.createdMatches.length === 0) {
                alert('No matches to save. Create at least one match first.');
                return;
            }
            
            if (!tourn.rounds) tourn.rounds = [];
            
            var round = {
                roundNumber: roundNumber,
                status: 'pending',
                matches: creatorState.createdMatches.map(function(m) {
                    return {
                        participants: m.participants,
                        winnerIds: [],
                        loserIds: [],
                        status: 'pending',
                        roundNumber: roundNumber
                    };
                })
            };
            
            tourn.rounds.push(round);
            tourn.status = 'active';
            
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            modal.classList.add('hidden');
            viewTournament(tournId);
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            modal.classList.add('hidden');
        };
    }
    
    if (matchTypeSelect) {
        matchTypeSelect.onchange = function() {
            var newType = parseInt(this.value) || 2;
            if (creatorState.selectedIds.length > newType) {
                alert('You have ' + creatorState.selectedIds.length + ' participants selected, but this match type only allows ' + newType + '. Please clear some selections.');
            }
            updateSelectedDisplay();
            updateButtonStates();
        };
    }
    
    updateAvailableDisplay();
    updateSelectedDisplay();
    updateCreatedMatchesDisplay();
    updateButtonStates();
    
    modal.classList.remove('hidden');
}

/**
 * Complete a round
 */
function completeRound(tournId, roundIndex) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    if (!allCompleted) {
        alert('All matches in this round must be completed before completing the round.');
        return;
    }
    
    round.status = 'completed';
    
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
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds) return;
    
    tourn.rounds.splice(roundIndex, 1);
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
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    round.matches.splice(matchIndex, 1);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Toggle match winner status
 */
function toggleMatchWinner(tournId, roundIndex, matchIndex, participantId) {
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
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
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
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
    var tourn = getTournament(tournId);
    if (!tourn || !tourn.rounds || !tourn.rounds[roundIndex]) return;
    
    var round = tourn.rounds[roundIndex];
    var match = round.matches[matchIndex];
    if (!match) return;
    
    var allParticipants = match.participants || [];
    var hasWinner = match.winnerIds && match.winnerIds.length > 0;
    
    if (!hasWinner) {
        alert('Please select at least one winner for this match.');
        return;
    }
    
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
    
    if (allParticipants.length === 2 && match.winnerIds.length !== 1) {
        alert('For 1v1 matches, exactly 1 winner must be selected.');
        return;
    }
    
    match.status = 'completed';
    
    var allCompleted = round.matches.every(function(m) { return m.status === 'completed'; });
    if (allCompleted) {
        round.status = 'completed';
        var allRoundsComplete = tourn.rounds.every(function(r) { return r.status === 'completed'; });
        if (allRoundsComplete) {
            tourn.status = 'completed';
            determineTournamentWinner(tourn);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    showRoundMatchesModal(tournId, roundIndex);
    viewTournament(tournId);
}

/**
 * Show round matches modal
 */
function showRoundMatchesModal(tournId, roundIndex) {
    var tourn = getTournament(tournId);
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
    html += '\u2022 <strong>Winners</strong> advance to the next round (if any).<br>';
    html += '\u2022 <strong>Losers</strong> are eliminated from the tournament.<br>';
    html += '\u2022 <strong>Non-winners</strong> (not winners or losers) get another chance in the next round.';
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
                    var name = getParticipantNameById(id);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    var style = '';
                    var label = name;
                    if (isWinner) {
                        style = 'border:1px solid var(--accent);background:var(--accent-soft);';
                        label += ' \uD83C\uDFC6 Winner';
                    } else if (isLoser) {
                        style = 'border:1px solid var(--danger);background:var(--danger-soft);';
                        label += ' \u274C Loser';
                    } else if (matchStatus === 'completed') {
                        style = 'border:1px solid var(--warning);background:var(--warning-soft);';
                        label += ' \u2B06\uFE0F Advances';
                    }
                    html += '<span style="padding:2px 8px;border-radius:10px;font-size:0.7rem;' + style + '">' + label + '</span>';
                });
                html += '</div>';
            }
            
            if (matchStatus !== 'completed' && match.participants) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">';
                html += '<span style="font-size:0.6rem;color:var(--text-dim);">Set winners:</span>';
                match.participants.forEach(function(id) {
                    var name = getParticipantNameById(id);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    if (!isLoser) {
                        html += '<button class="small set-winner-in-round" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                            (isWinner ? 'border-color:var(--accent);color:var(--accent);' : '') + '">' + name + 
                            (isWinner ? ' \u2713' : '') + '</button>';
                    }
                });
                html += '</div>';
                
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;">';
                html += '<span style="font-size:0.6rem;color:var(--text-dim);">Set losers (eliminated):</span>';
                match.participants.forEach(function(id) {
                    var name = getParticipantNameById(id);
                    var isWinner = match.winnerIds && match.winnerIds.some(function(wid) { return String(wid) === String(id); });
                    var isLoser = match.loserIds && match.loserIds.some(function(lid) { return String(lid) === String(id); });
                    if (!isWinner) {
                        html += '<button class="small set-loser-in-round" data-round="' + roundIndex + '" data-match="' + matchIndex + '" data-participant="' + id + '" style="' + 
                            (isLoser ? 'border-color:var(--danger);color:var(--danger);' : '') + '">' + name + 
                            (isLoser ? ' \u2715' : '') + '</button>';
                    }
                });
                html += '</div>';
            }
            
            html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
            if (matchStatus !== 'completed') {
                html += '<button class="small primary complete-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">Complete Match</button>';
            }
            html += '<button class="small danger delete-match-btn" data-round="' + roundIndex + '" data-match="' + matchIndex + '">\u2715</button>';
            html += '</div>';
            
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<p class="empty-state" style="padding:12px;">No matches in this round. Add matches to the round.</p>';
    }
    
    content.innerHTML = html;
    
    content.dataset.tournId = tournId;
    content.dataset.roundIndex = roundIndex;
    
    content.querySelectorAll('.set-winner-in-round').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchWinner(tournId, rIdx, mIdx, participantId);
        });
    });
    
    content.querySelectorAll('.set-loser-in-round').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            var participantId = this.dataset.participant;
            toggleMatchLoser(tournId, rIdx, mIdx, participantId);
        });
    });
    
    content.querySelectorAll('.complete-match-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var rIdx = parseInt(this.dataset.round);
            var mIdx = parseInt(this.dataset.match);
            completeMatch(tournId, rIdx, mIdx);
        });
    });
    
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
 * Auto-generate rounds for a tournament
 */
function autoGenerateRounds(tournId) {
    var tourn = getTournament(tournId);
    if (!tourn) return;
    
    if (tourn.mode !== 'individuals') {
        alert('Auto-generate rounds is only available for individual tournaments.');
        return;
    }
    
    if (!tourn.participants || tourn.participants.length < 2) {
        alert('Need at least 2 participants to generate rounds.');
        return;
    }
    
    if (tourn.rounds && tourn.rounds.length > 0) {
        if (!confirm('This tournament already has rounds. Overwrite them?')) return;
    }
    
    tourn.rounds = [];
    
    var participantIds = tourn.participants.map(function(p) { return p.characterId; });
    var matchSize = 3;
    
    var shuffled = participantIds.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    var round1 = {
        roundNumber: 1,
        status: 'pending',
        matches: []
    };
    
    for (var i = 0; i < shuffled.length; i += matchSize) {
        var matchParticipants = shuffled.slice(i, i + matchSize);
        if (matchParticipants.length < 2) {
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
window.populateCharacterSelector = populateCharacterSelector;
window.addCharacterToTournament = addCharacterToTournament;
window.removeCharacterFromTournament = removeCharacterFromTournament;
window.renderTournamentCharacters = renderTournamentCharacters;
window.getAvailableParticipantsForRound = getAvailableParticipantsForRound;
window.renderRounds = renderRounds;
window.addRound = addRound;
window.showRoundMatchCreator = showRoundMatchCreator;
window.completeRound = completeRound;
window.deleteRound = deleteRound;
window.deleteMatch = deleteMatch;
window.toggleMatchWinner = toggleMatchWinner;
window.toggleMatchLoser = toggleMatchLoser;
window.completeMatch = completeMatch;
window.showRoundMatchesModal = showRoundMatchesModal;
window.autoGenerateRounds = autoGenerateRounds;
