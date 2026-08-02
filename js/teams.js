/**
 * teams.js - Team Management
 * Handles team CRUD operations, member management, and ranking history
 */

// Team management state - use a single object to avoid redeclaration issues
var TeamState = {
    currentTeamId: null,
    currentEditMember: null,
    currentRankingTeamId: null,
    expandedTeamId: null,
    currentFilterWeek: 1
};

// Convenience aliases
var currentTeamId = TeamState.currentTeamId;
var currentEditMember = TeamState.currentEditMember;
var currentRankingTeamId = TeamState.currentRankingTeamId;
var expandedTeamId = TeamState.expandedTeamId;
var currentFilterWeek = TeamState.currentFilterWeek;

/**
 * Render the teams list with filtering
 */
function renderTeams() {
    var container = document.getElementById('teams-container');
    if (!container) return;

    var filterWeek = parseInt(document.getElementById('team-filter-week')?.value) || currentFilterWeek || 1;
    currentFilterWeek = filterWeek;
    TeamState.currentFilterWeek = filterWeek;

    var filteredTeams = data.teams.filter(function(team) {
        if (team.status === 'deleted') return false;
        var start = parseInt(team.startPeriod);
        var end = parseInt(team.endPeriod);
        if (isNaN(start)) return true;
        return start <= filterWeek && (isNaN(end) || end >= filterWeek);
    });

    filteredTeams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    if (filteredTeams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams active in Week ' + filterWeek + '.<br><span style="font-size:0.8rem;color:var(--text-dim);">Try adjusting the filter week above.</span></p>';
        return;
    }

    var html = '';
    filteredTeams.forEach(function(team) {
        var isEliminated = false;
        data.tournaments.forEach(function(tourn) {
            if (tourn.eliminations) {
                tourn.eliminations.forEach(function(elim) {
                    if (elim.participantId === team.id && elim.participantType === 'team') {
                        var elimWeek = parseInt(elim.week);
                        if (!isNaN(elimWeek) && elimWeek <= filterWeek) {
                            isEliminated = true;
                        }
                    }
                });
            }
        });

        var periodDisplay = getTeamPeriodDisplay(team);
        var isExpanded = TeamState.expandedTeamId === team.id;
        var memberCount = getActiveMemberCount(team, filterWeek);

        html += '<div class="list-item team-item" data-id="' + team.id + '">' +
            '<span><strong>' + team.name + '</strong>' + (isEliminated ? ' <span class="eliminated-badge">Eliminated</span>' : '') + '</span>' +
            '<span>' + (team.type || '-') + '</span>' +
            '<span>' + periodDisplay + '</span>' +
            '<span>' + (team.currentRank || '-') + '</span>' +
            '<span>' + memberCount + '</span>' +
            '<span class="actions">' +
                '<button class="small toggle-members" data-id="' + team.id + '">' + (isExpanded ? '▼' : '▶') + '</button>' +
                '<button class="small manage-members" data-id="' + team.id + '">Members</button>' +
                '<button class="small manage-rankings" data-id="' + team.id + '">Rankings</button>' +
                '<button class="small edit-team" data-id="' + team.id + '">Edit</button>' +
                '<button class="small danger delete-team" data-id="' + team.id + '">Delete</button>' +
            '</span>' +
        '</div>';

        if (isExpanded) {
            html += '<div class="team-members-expanded" data-team-id="' + team.id + '">';
            var activeMembers = getActiveMembers(team, filterWeek);
            
            if (activeMembers.length === 0) {
                html += '<div class="member-entry empty">No active members this week</div>';
            } else {
                activeMembers.forEach(function(member) {
                    var char = data.characters.find(function(c) { return c.id === member.characterId; });
                    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    var age = char ? getCharacterAge(char) : '-';
                    var deadMarker = char && char.deceased ? ' Deceased' : '';
                    html += '<div class="member-entry">' +
                        '<span>' + name + deadMarker + ' <span class="role">(' + (member.role || 'Member') + ')</span></span>' +
                        '<span style="color:var(--text-dim);font-size:0.75rem;">Age: ' + age + ' | Joined: ' + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + member.leavePeriod : '') + '</span>' +
                    '</div>';
                });
            }
            html += '</div>';
        }
    });
    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('.toggle-members').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = btn.dataset.id;
            if (TeamState.expandedTeamId === id) {
                TeamState.expandedTeamId = null;
            } else {
                TeamState.expandedTeamId = id;
            }
            expandedTeamId = TeamState.expandedTeamId;
            renderTeams();
        });
    });

    container.querySelectorAll('.manage-members').forEach(function(btn) {
        btn.addEventListener('click', function() { openMemberModal(btn.dataset.id); });
    });
    container.querySelectorAll('.manage-rankings').forEach(function(btn) {
        btn.addEventListener('click', function() { openRankingModal(btn.dataset.id); });
    });
    container.querySelectorAll('.edit-team').forEach(function(btn) {
        btn.addEventListener('click', function() { showTeamForm(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-team').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTeam(btn.dataset.id); });
    });
}

/**
 * Get team period display string
 */
function getTeamPeriodDisplay(team) {
    if (team.type === 'academic') {
        var startBlock = getRankingBlock(team.startPeriod);
        var endBlock = getRankingBlock(team.endPeriod);
        if (startBlock && endBlock) return 'Wk ' + startBlock.label + ' - Wk ' + endBlock.label;
        if (startBlock) return 'Wk ' + startBlock.label + '+';
        return '-';
    } else {
        return team.startPeriod ? team.startPeriod + (team.endPeriod ? ' - ' + team.endPeriod : '') : '-';
    }
}

/**
 * Get active members for a team in a week
 */
function getActiveMembers(team, week) {
    if (!team.members) return [];
    return team.members.filter(function(m) {
        var join = parseInt(m.joinPeriod);
        var leave = parseInt(m.leavePeriod);
        return !isNaN(join) && join <= week && (isNaN(leave) || leave >= week);
    });
}

/**
 * Get active member count for a team in a week
 */
function getActiveMemberCount(team, week) {
    return getActiveMembers(team, week).length;
}

/**
 * Show team form for add or edit
 */
function showTeamForm(editId) {
    var form = document.getElementById('team-form');
    var title = document.getElementById('team-form-title');
    var formElement = document.getElementById('team-form-inner');
    form.classList.remove('hidden');
    
    if (editId) {
        title.textContent = 'Edit Team';
        var team = data.teams.find(function(t) { return t.id === editId; });
        if (team) {
            document.getElementById('team-name').value = team.name || '';
            document.getElementById('team-type').value = team.type || '';
            document.getElementById('team-start').value = team.startPeriod || '';
            document.getElementById('team-end').value = team.endPeriod || '';
            document.getElementById('team-ranking').value = team.currentRank || '';
            document.getElementById('team-status').value = team.status || 'active';
            formElement.dataset.editId = editId;
            var container = document.getElementById('name-history-container');
            container.innerHTML = '';
            if (team.nameHistory && team.nameHistory.length > 0) {
                team.nameHistory.forEach(function(entry) { 
                    addNameHistoryEntry(container, entry.name, entry.startPeriod, entry.endPeriod); 
                });
            } else { 
                addNameHistoryEntry(container); 
            }
        }
    } else {
        title.textContent = 'Add Team';
        formElement.reset();
        delete formElement.dataset.editId;
        var container = document.getElementById('name-history-container');
        container.innerHTML = '';
        addNameHistoryEntry(container);
    }
    document.getElementById('team-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide team form
 */
function hideTeamForm() {
    document.getElementById('team-form').classList.add('hidden');
}

/**
 * Add name history entry
 */
function addNameHistoryEntry(container, name, start, end) {
    var entry = document.createElement('div');
    entry.className = 'name-history-entry';
    entry.innerHTML = `
        <input type="text" class="name-history-name" placeholder="Team Name" value="${name || ''}">
        <input type="number" class="name-history-start" placeholder="Start Week/Year" value="${start || ''}">
        <input type="number" class="name-history-end" placeholder="End Week/Year" value="${end || ''}">
        <button type="button" class="small danger remove-name">✕</button>
    `;
    container.appendChild(entry);
    entry.querySelector('.remove-name').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one name entry.');
    };
}

/**
 * Save team from form
 */
function saveTeam(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    var nameHistory = [];
    document.querySelectorAll('.name-history-entry').forEach(function(entry) {
        var nameInput = entry.querySelector('.name-history-name');
        var startInput = entry.querySelector('.name-history-start');
        var endInput = entry.querySelector('.name-history-end');
        if (nameInput.value.trim()) {
            nameHistory.push({ 
                name: nameInput.value.trim(), 
                startPeriod: startInput.value || '', 
                endPeriod: endInput.value || '' 
            });
        }
    });
    
    var teamData = {
        name: document.getElementById('team-name').value.trim(),
        type: document.getElementById('team-type').value,
        startPeriod: document.getElementById('team-start').value || '',
        endPeriod: document.getElementById('team-end').value || '',
        currentRank: document.getElementById('team-ranking').value || '',
        status: document.getElementById('team-status').value || 'active',
        nameHistory: nameHistory
    };
    
    if (!teamData.name) { alert('Team name is required.'); return; }
    if (!teamData.type) { alert('Team type is required.'); return; }
    
    if (editId) {
        var index = data.teams.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            if (!teamData.members) teamData.members = data.teams[index].members || [];
            if (!teamData.rankingHistory) teamData.rankingHistory = data.teams[index].rankingHistory || [];
            data.teams[index] = Object.assign({}, data.teams[index], teamData);
            if (typeof logActivity === 'function') {
                logActivity('Updated team: ' + teamData.name);
            }
        }
    } else {
        var newTeam = { 
            id: generateId('team'), 
            name: teamData.name, 
            type: teamData.type, 
            startPeriod: teamData.startPeriod,
            endPeriod: teamData.endPeriod, 
            currentRank: teamData.currentRank, 
            status: teamData.status,
            nameHistory: teamData.nameHistory, 
            members: [], 
            rankingHistory: [], 
            createdAt: new Date().toISOString() 
        };
        data.teams.push(newTeam);
        if (typeof logActivity === 'function') {
            logActivity('Added team: ' + teamData.name);
        }
    }
    
    saveData().catch(function(err) { 
        console.error('Failed to save:', err); 
        alert('Failed to save team. Please check console for details.'); 
    });
    renderTeams();
    hideTeamForm();
}

/**
 * Delete a team
 */
function deleteTeam(id) {
    var team = data.teams.find(function(t) { return t.id === id; });
    if (!team) return;
    if (!confirm('Delete "' + team.name + '" permanently? This will also remove it from tournaments.')) return;
    
    data.tournaments.forEach(function(t) {
        if (t.teams) {
            t.teams = t.teams.filter(function(entry) { return entry.teamId !== id; });
        }
    });
    data.teams = data.teams.filter(function(t) { return t.id !== id; });
    if (typeof logActivity === 'function') {
        logActivity('Deleted team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTeams();
}

/**
 * Open member management modal
 */
function openMemberModal(teamId) {
    var modal = document.getElementById('member-modal');
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    
    TeamState.currentTeamId = teamId;
    currentTeamId = TeamState.currentTeamId;
    var periodLabel = team.type === 'academic' ? 'Week' : 'Year';
    document.getElementById('modal-team-name').textContent = team.name + ' - Members (' + periodLabel + 's)';
    
    var select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    
    var sortedChars = data.characters.slice().sort(function(a, b) {
        var nameA = [a.firstName, a.middleName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.middleName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    var currentPeriod = parseInt(team.startPeriod) || 1;
    
    sortedChars.forEach(function(char) {
        var inThisTeam = team.members && team.members.some(function(m) { return m.characterId === char.id; });
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var deadMarker = char.deceased ? ' Deceased' : '';
        var inTeamMarker = '';
        
        if (!inThisTeam) {
            data.teams.forEach(function(t) {
                if (t.id === team.id) return;
                if (t.members) {
                    t.members.forEach(function(m) {
                        if (m.characterId === char.id) {
                            var joinPeriod = parseInt(m.joinPeriod);
                            var leavePeriod = parseInt(m.leavePeriod);
                            if (!isNaN(joinPeriod) && joinPeriod <= currentPeriod && (isNaN(leavePeriod) || leavePeriod >= currentPeriod)) {
                                inTeamMarker = ' (in ' + t.name + ')';
                            }
                        }
                    });
                }
            });
        }
        
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = name + deadMarker + (inThisTeam ? ' ✓' : inTeamMarker);
        if (inThisTeam) { 
            option.style.color = 'var(--accent)'; 
            option.style.fontWeight = '600'; 
        } else if (inTeamMarker) { 
            option.style.color = 'var(--text-dim)'; 
        }
        select.appendChild(option);
    });
    
    document.getElementById('member-role').value = '';
    document.getElementById('member-join').placeholder = 'Join ' + periodLabel;
    document.getElementById('member-join').value = '';
    document.getElementById('member-leave').placeholder = 'Leave ' + periodLabel;
    document.getElementById('member-leave').value = '';
    
    renderMembers(team);
    modal.classList.remove('hidden');
}

/**
 * Render members in the member modal
 */
function renderMembers(team) {
    var container = document.getElementById('members-list');
    if (!team.members || team.members.length === 0) {
        container.innerHTML = '<p class="empty-state">No members in this team</p>';
        return;
    }
    
    var periodLabel = team.type === 'academic' ? 'Wk' : 'Yr';
    var html = '';
    team.members.forEach(function(member, index) {
        var char = data.characters.find(function(c) { return c.id === member.characterId; });
        var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var age = char ? getCharacterAge(char) : '-';
        var deadMarker = char && char.deceased ? ' Deceased' : '';
        html += '<div class="member-entry">' +
            '<div class="member-info">' +
                '<span><strong>' + name + deadMarker + '</strong></span>' +
                '<span class="role">' + (member.role || 'Member') + '</span>' +
                '<span class="years">' + periodLabel + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + periodLabel + member.leavePeriod : '') + '</span>' +
                '<span class="years">Age: ' + age + '</span>' +
            '</div>' +
            '<div class="member-actions">' +
                '<button class="small edit-member" data-team="' + team.id + '" data-index="' + index + '">Edit</button>' +
                '<button class="small danger remove-member" data-team="' + team.id + '" data-char="' + member.characterId + '">Remove</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-member').forEach(function(btn) {
        btn.addEventListener('click', function() { openEditMemberModal(btn.dataset.team, parseInt(btn.dataset.index)); });
    });
    container.querySelectorAll('.remove-member').forEach(function(btn) {
        btn.addEventListener('click', function() { removeMember(btn.dataset.team, btn.dataset.char); });
    });
}

/**
 * Add member to team
 */
function addMember() {
    if (!TeamState.currentTeamId) return;
    var charId = document.getElementById('member-character').value;
    var role = document.getElementById('member-role').value.trim();
    var joinPeriod = document.getElementById('member-join').value;
    var leavePeriod = document.getElementById('member-leave').value;
    
    if (!charId) { alert('Please select a character.'); return; }
    
    var team = data.teams.find(function(t) { return t.id === TeamState.currentTeamId; });
    if (!team) return;
    
    if (team.members && team.members.some(function(m) { return m.characterId === charId; })) {
        alert('This character is already in the team.');
        return;
    }
    
    if (!team.members) team.members = [];
    team.members.push({ 
        characterId: charId, 
        role: role || 'Member', 
        joinPeriod: joinPeriod || '', 
        leavePeriod: leavePeriod || '' 
    });
    
    var char = data.characters.find(function(c) { return c.id === charId; });
    if (typeof logActivity === 'function') {
        logActivity('Added ' + (char ? char.firstName : 'character') + ' to team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
}

/**
 * Remove member from team
 */
function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    
    team.members = team.members.filter(function(m) { return m.characterId !== charId; });
    var char = data.characters.find(function(c) { return c.id === charId; });
    if (typeof logActivity === 'function') {
        logActivity('Removed ' + (char ? char.firstName : 'character') + ' from team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
}

/**
 * Open edit member modal
 */
function openEditMemberModal(teamId, index) {
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members || !team.members[index]) return;
    
    var member = team.members[index];
    var char = data.characters.find(function(c) { return c.id === member.characterId; });
    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    TeamState.currentEditMember = { teamId: teamId, index: index };
    currentEditMember = TeamState.currentEditMember;
    var periodLabel = team.type === 'academic' ? 'Week' : 'Year';
    
    document.getElementById('edit-member-name').textContent = name;
    document.getElementById('edit-member-role').value = member.role || '';
    document.getElementById('edit-member-join').placeholder = 'Join ' + periodLabel;
    document.getElementById('edit-member-join').value = member.joinPeriod || '';
    document.getElementById('edit-member-leave').placeholder = 'Leave ' + periodLabel;
    document.getElementById('edit-member-leave').value = member.leavePeriod || '';
    document.getElementById('edit-member-modal').classList.remove('hidden');
}

/**
 * Save edited member
 */
function saveEditMember(e) {
    e.preventDefault();
    if (!TeamState.currentEditMember) return;
    
    var teamId = TeamState.currentEditMember.teamId;
    var index = TeamState.currentEditMember.index;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members || !team.members[index]) return;
    
    var role = document.getElementById('edit-member-role').value.trim();
    var joinPeriod = document.getElementById('edit-member-join').value;
    var leavePeriod = document.getElementById('edit-member-leave').value;
    
    team.members[index].role = role || 'Member';
    team.members[index].joinPeriod = joinPeriod || '';
    team.members[index].leavePeriod = leavePeriod || '';
    
    if (typeof logActivity === 'function') {
        logActivity('Updated member in team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
    closeEditMemberModal();
}

/**
 * Close edit member modal
 */
function closeEditMemberModal() {
    document.getElementById('edit-member-modal').classList.add('hidden');
    TeamState.currentEditMember = null;
    currentEditMember = null;
}

/**
 * Close member modal
 */
function closeMemberModal() {
    document.getElementById('member-modal').classList.add('hidden');
    TeamState.currentTeamId = null;
    currentTeamId = null;
}

/**
 * Open ranking modal
 */
function openRankingModal(teamId) {
    var modal = document.getElementById('ranking-modal');
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    
    TeamState.currentRankingTeamId = teamId;
    currentRankingTeamId = TeamState.currentRankingTeamId;
    var periodLabel = team.type === 'academic' ? 'Week Block' : 'Year';
    document.getElementById('ranking-modal-title').textContent = team.name + ' - Ranking History';
    document.getElementById('ranking-week').placeholder = periodLabel + ' (e.g., 1 for weeks 1-2)';
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
    
    renderRankings(team);
    modal.classList.remove('hidden');
}

/**
 * Render rankings in the ranking modal
 */
function renderRankings(team) {
    var container = document.getElementById('ranking-list');
    if (!team.rankingHistory || team.rankingHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No ranking history</p>';
        return;
    }
    
    var periodLabel = team.type === 'academic' ? 'Weeks' : 'Yr';
    var html = '';
    var sorted = team.rankingHistory.slice().sort(function(a, b) { 
        return parseInt(a.period) - parseInt(b.period); 
    });
    
    sorted.forEach(function(entry, index) {
        var blockDisplay = '';
        if (team.type === 'academic') {
            var block = getRankingBlock(entry.period);
            if (block) blockDisplay = ' (Wk ' + block.label + ')';
            else blockDisplay = ' (Wk ' + entry.period + ')';
        } else {
            blockDisplay = ' (' + entry.period + ')';
        }
        html += '<div class="ranking-entry">' +
            '<span><strong>#' + entry.rank + '</strong> - ' + periodLabel + blockDisplay + '</span>' +
            '<button class="small danger remove-ranking" data-team="' + team.id + '" data-index="' + index + '">Remove</button>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-ranking').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            removeRanking(btn.dataset.team, parseInt(btn.dataset.index)); 
        });
    });
}

/**
 * Add ranking entry
 */
function addRanking() {
    if (!TeamState.currentRankingTeamId) return;
    
    var period = document.getElementById('ranking-week').value;
    var rank = document.getElementById('ranking-rank').value;
    var team = data.teams.find(function(t) { return t.id === TeamState.currentRankingTeamId; });
    if (!team) return;
    
    if (!period) {
        alert('Please enter a ' + (team.type === 'academic' ? 'week block (1 for weeks 1-2, 3 for weeks 3-4, etc.)' : 'year') + '.');
        return;
    }
    if (!rank) { alert('Please enter a rank.'); return; }
    
    if (!team.rankingHistory) team.rankingHistory = [];
    var periodNum = parseInt(period);
    if (team.type === 'academic' && !isNaN(periodNum)) {
        var blockStart = Math.floor((periodNum - 1) / 2) * 2 + 1;
        var existing = team.rankingHistory.findIndex(function(r) { 
            return parseInt(r.period) === blockStart; 
        });
        if (existing !== -1) {
            if (!confirm('Ranking for weeks ' + (getRankingBlock(blockStart)?.label || blockStart) + ' already exists. Overwrite?')) return;
            team.rankingHistory[existing] = { period: String(blockStart), rank: rank };
        } else {
            team.rankingHistory.push({ period: String(blockStart), rank: rank });
        }
    } else {
        var existing = team.rankingHistory.findIndex(function(r) { 
            return parseInt(r.period) === parseInt(period); 
        });
        if (existing !== -1) {
            if (!confirm('Ranking for ' + period + ' already exists. Overwrite?')) return;
            team.rankingHistory[existing] = { period: period, rank: rank };
        } else {
            team.rankingHistory.push({ period: period, rank: rank });
        }
    }
    
    team.rankingHistory.sort(function(a, b) { 
        return parseInt(a.period) - parseInt(b.period); 
    });
    
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) { 
            return parseInt(a.period) - parseInt(b.period); 
        });
        team.currentRank = sorted[sorted.length - 1].rank;
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Added ranking #' + rank + ' for team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRankings(team);
    renderTeams();
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
}

/**
 * Remove ranking entry
 */
function removeRanking(teamId, index) {
    if (!confirm('Remove this ranking entry?')) return;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.rankingHistory) return;
    
    team.rankingHistory.splice(index, 1);
    
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) { 
            return parseInt(a.period) - parseInt(b.period); 
        });
        team.currentRank = sorted[sorted.length - 1].rank;
    } else {
        team.currentRank = '';
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Removed ranking from team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRankings(team);
    renderTeams();
}

/**
 * Close ranking modal
 */
function closeRankingModal() {
    document.getElementById('ranking-modal').classList.add('hidden');
    TeamState.currentRankingTeamId = null;
    currentRankingTeamId = null;
}

/**
 * Initialize team events
 */
function initTeamEvents() {
    var addBtn = document.getElementById('add-team-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showTeamForm(); });
    }
    var cancelBtn = document.getElementById('cancel-team-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideTeamForm);
    }
    var form = document.getElementById('team-form-inner');
    if (form) {
        form.addEventListener('submit', saveTeam);
    }
    
    var filterBtn = document.getElementById('apply-filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            var week = parseInt(document.getElementById('team-filter-week').value);
            if (!isNaN(week) && week > 0 && week <= 52) {
                TeamState.currentFilterWeek = week;
                currentFilterWeek = TeamState.currentFilterWeek;
                renderTeams();
            } else {
                alert('Please enter a valid week (1-52).');
            }
        });
    }
    
    var filterInput = document.getElementById('team-filter-week');
    if (filterInput) {
        filterInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('apply-filter-btn').click();
            }
        });
    }

    var memberModal = document.querySelector('#member-modal .close-modal');
    if (memberModal) {
        memberModal.addEventListener('click', closeMemberModal);
    }
    var memberModalBg = document.getElementById('member-modal');
    if (memberModalBg) {
        memberModalBg.addEventListener('click', function(e) {
            if (e.target === this) closeMemberModal();
        });
    }
    var addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', addMember);
    }

    var editMemberModal = document.querySelector('#edit-member-modal .close-modal');
    if (editMemberModal) {
        editMemberModal.addEventListener('click', closeEditMemberModal);
    }
    var editMemberBg = document.getElementById('edit-member-modal');
    if (editMemberBg) {
        editMemberBg.addEventListener('click', function(e) {
            if (e.target === this) closeEditMemberModal();
        });
    }
    var cancelEditMember = document.getElementById('cancel-edit-member');
    if (cancelEditMember) {
        cancelEditMember.addEventListener('click', closeEditMemberModal);
    }
    var editForm = document.getElementById('edit-member-form');
    if (editForm) {
        editForm.addEventListener('submit', saveEditMember);
    }

    var rankingModal = document.querySelector('#ranking-modal .close-modal');
    if (rankingModal) {
        rankingModal.addEventListener('click', closeRankingModal);
    }
    var rankingBg = document.getElementById('ranking-modal');
    if (rankingBg) {
        rankingBg.addEventListener('click', function(e) {
            if (e.target === this) closeRankingModal();
        });
    }
    var addRankBtn = document.getElementById('add-ranking-btn');
    if (addRankBtn) {
        addRankBtn.addEventListener('click', addRanking);
    }
    
    var addNameBtn = document.getElementById('add-name-history-btn');
    if (addNameBtn) {
        addNameBtn.addEventListener('click', function() {
            var container = document.getElementById('name-history-container');
            addNameHistoryEntry(container);
        });
    }
}

// Make functions globally available
window.TeamState = TeamState;
window.renderTeams = renderTeams;
window.showTeamForm = showTeamForm;
window.hideTeamForm = hideTeamForm;
window.addNameHistoryEntry = addNameHistoryEntry;
window.saveTeam = saveTeam;
window.deleteTeam = deleteTeam;
window.openMemberModal = openMemberModal;
window.renderMembers = renderMembers;
window.addMember = addMember;
window.removeMember = removeMember;
window.openEditMemberModal = openEditMemberModal;
window.saveEditMember = saveEditMember;
window.closeEditMemberModal = closeEditMemberModal;
window.closeMemberModal = closeMemberModal;
window.openRankingModal = openRankingModal;
window.renderRankings = renderRankings;
window.addRanking = addRanking;
window.removeRanking = removeRanking;
window.closeRankingModal = closeRankingModal;
window.initTeamEvents = initTeamEvents;
window.getTeamPeriodDisplay = getTeamPeriodDisplay;
window.getActiveMembers = getActiveMembers;
window.getActiveMemberCount = getActiveMemberCount;