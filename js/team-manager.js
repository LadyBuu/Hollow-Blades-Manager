/**
 * team-manager.js - Team Manager
 * Divided into three tabs: Academic, Professional, Temporary
 * Each tab shows only the appropriate team type with relevant filters
 */

var teamManagerState = {
    currentTab: 'academic',
    currentFilter: 'active', // active, inactive, all
    filterWeek: 1,
    expandedTeamId: null,
    currentTeamId: null
};

/**
 * Initialize team manager system
 */
function initTeamManagerSystem() {
    if (!data.teams) {
        data.teams = [];
    }
    // Migrate existing teams
    data.teams.forEach(function(team) {
        if (!team.nameHistory) team.nameHistory = [];
        if (!team.rankingHistory) team.rankingHistory = [];
        if (!team.members) team.members = [];
        if (!team.status) team.status = 'active';
        if (!team.currentRank) team.currentRank = '';
        if (!team.startPeriod) team.startPeriod = '';
        if (!team.endPeriod) team.endPeriod = '';
        if (!team.type) team.type = 'academic';
        if (!team.temporaryMission) team.temporaryMission = null;
        // Ensure members have all fields
        team.members.forEach(function(member) {
            if (!member.role) member.role = 'Member';
            if (!member.joinPeriod) member.joinPeriod = '';
            if (!member.leavePeriod) member.leavePeriod = '';
        });
    });
    saveData().catch(function(err) { console.error('Failed to save:', err); });
}

/**
 * Get teams filtered by type and status
 */
function getFilteredTeams(type, filter) {
    initTeamManagerSystem();
    var teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    
    // Filter by type
    if (type === 'academic') {
        teams = teams.filter(function(t) { return t.type === 'academic'; });
    } else if (type === 'professional') {
        teams = teams.filter(function(t) { return t.type === 'professional'; });
    } else if (type === 'temporary') {
        teams = teams.filter(function(t) { return t.type === 'temporary' || t.type === 'internship'; });
    }
    
    // Filter by status
    if (filter === 'active') {
        teams = teams.filter(function(t) { return t.status === 'active'; });
    } else if (filter === 'inactive') {
        teams = teams.filter(function(t) { return t.status === 'deprecated' || t.status === 'inactive'; });
    }
    
    // For academic teams, filter by week
    if (type === 'academic') {
        var weekNum = teamManagerState.filterWeek || 1;
        var block = getWeekBlock(weekNum);
        teams = teams.filter(function(team) {
            var start = parseInt(team.startPeriod);
            var end = parseInt(team.endPeriod);
            if (isNaN(start)) return true;
            return start <= block.end && (isNaN(end) || end >= block.start);
        });
    }
    
    teams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    
    return teams;
}

/**
 * Get team name by ID
 */
function getTeamName(teamId) {
    if (!teamId) return 'Unassigned';
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    return team ? team.name : 'Unknown Team';
}

/**
 * Get active members for a team in a week
 */
function getActiveMembers(team, week) {
    if (!team.members) return [];
    var weekNum = parseInt(week) || 1;
    return team.members.filter(function(m) {
        var join = parseInt(m.joinPeriod);
        var leave = parseInt(m.leavePeriod);
        return !isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum);
    });
}

/**
 * Get active member count for a team
 */
function getActiveMemberCount(team) {
    if (!team.members) return 0;
    return team.members.length;
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
    } else if (team.type === 'professional') {
        if (team.startPeriod && team.endPeriod) {
            return team.startPeriod + ' - ' + team.endPeriod;
        } else if (team.startPeriod) {
            return 'From ' + team.startPeriod;
        }
        return '-';
    } else {
        // Temporary
        if (team.startPeriod && team.endPeriod) {
            return team.startPeriod + ' - ' + team.endPeriod;
        } else if (team.startPeriod) {
            return 'From ' + team.startPeriod;
        }
        return '-';
    }
}

/**
 * Get mission title by ID
 */
function getMissionTitle(missionId) {
    if (!missionId) return '';
    var mission = data.missions.find(function(m) { return String(m.id) === String(missionId); });
    return mission ? mission.title : '';
}

/**
 * Render the team manager view
 */
function renderTeamManagerView(container) {
    initTeamManagerSystem();
    
    var activeTab = teamManagerState.currentTab || 'academic';
    
    container.innerHTML = `
        <div class="page-header">
            <h2>Team Manager</h2>
            <button id="add-team-btn" class="primary">+ Add Team</button>
        </div>

        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-btn ${activeTab === 'academic' ? 'active' : ''}" data-tab="academic">Academic</button>
                <button class="tab-btn ${activeTab === 'professional' ? 'active' : ''}" data-tab="professional">Professional</button>
                <button class="tab-btn ${activeTab === 'temporary' ? 'active' : ''}" data-tab="temporary">Temporary</button>
            </div>
            <div class="tab-content">
                <div id="tab-academic" class="tab-panel ${activeTab === 'academic' ? 'active' : ''}" style="${activeTab === 'academic' ? 'display:block;' : 'display:none;'}">
                    <div id="academic-content"></div>
                </div>
                <div id="tab-professional" class="tab-panel ${activeTab === 'professional' ? 'active' : ''}" style="${activeTab === 'professional' ? 'display:block;' : 'display:none;'}">
                    <div id="professional-content"></div>
                </div>
                <div id="tab-temporary" class="tab-panel ${activeTab === 'temporary' ? 'active' : ''}" style="${activeTab === 'temporary' ? 'display:block;' : 'display:none;'}">
                    <div id="temporary-content"></div>
                </div>
            </div>
        </div>

        <!-- Team Form Modal -->
        <div id="team-form-modal" class="modal hidden">
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 id="team-form-title">Add Team</h3>
                    <button class="close-modal" id="close-team-form">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="team-form-inner">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Team Name *</label>
                                <input type="text" id="team-name" required>
                            </div>
                            <div class="form-group">
                                <label>Team Type *</label>
                                <select id="team-type" required>
                                    <option value="academic">Academic</option>
                                    <option value="professional">Professional</option>
                                    <option value="temporary">Temporary</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label id="team-start-label">Start Week</label>
                                <input type="text" id="team-start" placeholder="Week (e.g., 1)">
                            </div>
                            <div class="form-group">
                                <label id="team-end-label">End Week (optional)</label>
                                <input type="text" id="team-end" placeholder="Week (e.g., 52)">
                            </div>
                            <div class="form-group">
                                <label>Current Ranking</label>
                                <input type="number" id="team-ranking" placeholder="Rank (e.g., 1, 2, 3...)" min="1">
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select id="team-status">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="deprecated">Deprecated</option>
                                </select>
                            </div>
                            <div class="form-group full-width" id="temporary-mission-field" style="display:none;">
                                <label>Associated Mission</label>
                                <select id="team-mission">
                                    <option value="">None</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>Name History</label>
                                <div id="name-history-container">
                                    <div class="name-history-entry">
                                        <input type="text" class="name-history-name" placeholder="Team Name">
                                        <input type="text" class="name-history-start" placeholder="Start">
                                        <input type="text" class="name-history-end" placeholder="End">
                                        <button type="button" class="small danger remove-name">✕</button>
                                    </div>
                                </div>
                                <button type="button" id="add-name-history-btn" class="small" style="margin-top:8px;">+ Add Name Period</button>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-team-form" class="secondary">Cancel</button>
                            <button type="submit" id="save-team-btn" class="primary">Save Team</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Member Modal -->
        <div id="member-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-team-name">Team Members</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="member-form">
                        <select id="member-character">
                            <option value="">Select character...</option>
                        </select>
                        <input type="text" id="member-role" placeholder="Role">
                        <input type="text" id="member-join" placeholder="Join Week/Year">
                        <input type="text" id="member-leave" placeholder="Leave Week/Year">
                        <button id="add-member-btn" class="primary small">Add Member</button>
                    </div>
                    <div id="members-list">
                        <p class="empty-state">No members in this team</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Member Modal -->
        <div id="edit-member-modal" class="modal hidden">
            <div class="modal-content small">
                <div class="modal-header">
                    <h3>Edit Member</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-member-form">
                        <div class="form-group">
                            <label>Character</label>
                            <p id="edit-member-name" style="margin:4px 0 12px 0;font-weight:600;"></p>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" id="edit-member-role">
                        </div>
                        <div class="form-group">
                            <label>Join Week/Year</label>
                            <input type="text" id="edit-member-join">
                        </div>
                        <div class="form-group">
                            <label>Leave Week/Year</label>
                            <input type="text" id="edit-member-leave">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-edit-member" class="secondary">Cancel</button>
                            <button type="submit" id="save-edit-member" class="primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Ranking Modal -->
        <div id="ranking-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="ranking-modal-title">Ranking History</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="ranking-form">
                        <input type="text" id="ranking-week" placeholder="Week Block (1, 3, 5...) or Year" min="1">
                        <input type="number" id="ranking-rank" placeholder="Rank" min="1">
                        <button id="add-ranking-btn" class="primary small">Add Ranking</button>
                    </div>
                    <div id="ranking-list">
                        <p class="empty-state">No ranking history</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Populate mission selector
    populateMissionSelector();
    
    // Render the active tab
    renderTeamTab(activeTab);
    
    // Initialize events
    initTeamManagerEvents();
}

/**
 * Populate mission selector in form
 */
function populateMissionSelector() {
    var select = document.getElementById('team-mission');
    if (!select) return;
    
    var missions = data.missions || [];
    select.innerHTML = '<option value="">None</option>';
    // Show active missions first, then completed
    var sortedMissions = missions.slice().sort(function(a, b) {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return a.title.localeCompare(b.title);
    });
    sortedMissions.forEach(function(mission) {
        if (mission.status !== 'cancelled') {
            var option = document.createElement('option');
            option.value = mission.id;
            option.textContent = mission.title + (mission.status === 'completed' ? ' (completed)' : '');
            select.appendChild(option);
        }
    });
}

/**
 * Render a specific team tab
 */
function renderTeamTab(tab) {
    var container = document.getElementById(tab + '-content');
    if (!container) return;
    
    var filter = teamManagerState.currentFilter || 'active';
    var teams = getFilteredTeams(tab, filter);
    
    // Build filter controls based on tab type
    var filterHtml = '';
    if (tab === 'academic') {
        filterHtml = `
            <div class="filter-section">
                <label for="team-filter-week">Week:</label>
                <input type="number" id="team-filter-week" value="${teamManagerState.filterWeek || 1}" min="1" max="52" style="width:80px;">
                <button id="apply-filter-btn" class="small primary">Apply</button>
                <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Shows teams active during this 2-week block</span>
            </div>
        `;
    } else if (tab === 'professional') {
        filterHtml = `
            <div class="filter-section">
                <label for="team-status-filter">Status:</label>
                <select id="team-status-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;width:auto;">
                    <option value="active" ${filter === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${filter === 'inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>All</option>
                </select>
            </div>
        `;
    } else {
        // Temporary
        filterHtml = `
            <div class="filter-section">
                <label for="team-status-filter">Status:</label>
                <select id="team-status-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;width:auto;">
                    <option value="active" ${filter === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${filter === 'inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>All</option>
                </select>
            </div>
        `;
    }
    
    var listHeader = '';
    if (tab === 'academic') {
        listHeader = `
            <div class="list-header team-header" style="grid-template-columns:1.2fr 0.8fr 0.6fr 0.6fr 1fr;">
                <span>Team Name</span>
                <span>Period</span>
                <span>Rank</span>
                <span>Members</span>
                <span>Actions</span>
            </div>
        `;
    } else {
        listHeader = `
            <div class="list-header team-header" style="grid-template-columns:1.2fr 0.8fr 0.6fr 0.6fr 1fr;">
                <span>Team Name</span>
                <span>Period</span>
                <span>Status</span>
                <span>Members</span>
                <span>Actions</span>
            </div>
        `;
    }
    
    var teamsHtml = renderTeamList(teams, tab);
    
    container.innerHTML = filterHtml + listHeader + '<div id="teams-container-' + tab + '">' + teamsHtml + '</div>';
    
    // Attach filter events
    attachFilterEvents(tab);
    
    // Attach team action events
    attachTeamActionEvents(tab);
}

/**
 * Render team list
 */
function renderTeamList(teams, tab) {
    if (teams.length === 0) {
        var labels = {
            'academic': 'academic teams',
            'professional': 'professional teams',
            'temporary': 'temporary teams'
        };
        return '<p class="empty-state">No ' + (labels[tab] || 'teams') + ' found. Create your first team!</p>';
    }
    
    var html = '';
    var filterWeek = teamManagerState.filterWeek || 1;
    
    teams.forEach(function(team) {
        var periodDisplay = getTeamPeriodDisplay(team);
        var memberCount = getActiveMemberCount(team);
        var isExpanded = teamManagerState.expandedTeamId === team.id;
        
        var statusLabel = team.status === 'active' ? 'Active' : (team.status === 'deprecated' ? 'Deprecated' : 'Inactive');
        var statusColor = team.status === 'active' ? 'var(--accent)' : 'var(--text-dim)';
        
        var rankDisplay = team.currentRank || '-';
        var missionDisplay = '';
        if (tab === 'temporary' && team.temporaryMission) {
            var missionTitle = getMissionTitle(team.temporaryMission);
            if (missionTitle) {
                missionDisplay = ' <span style="font-size:0.6rem;color:var(--text-dim);">(' + missionTitle + ')</span>';
            }
        }
        
        html += '<div class="list-item team-item" data-id="' + team.id + '" style="grid-template-columns:1.2fr 0.8fr 0.6fr 0.6fr 1fr;">';
        html += '<span><strong>' + team.name + '</strong>' + missionDisplay + '</span>';
        
        if (tab === 'academic') {
            html += '<span style="font-size:0.75rem;">' + periodDisplay + '</span>';
            html += '<span style="font-size:0.75rem;">' + rankDisplay + '</span>';
        } else {
            html += '<span style="font-size:0.75rem;">' + periodDisplay + '</span>';
            html += '<span style="color:' + statusColor + ';font-size:0.75rem;">' + statusLabel + '</span>';
        }
        
        html += '<span style="font-size:0.75rem;">' + memberCount + '</span>';
        html += '<span class="actions">' +
            '<button class="small toggle-members" data-id="' + team.id + '">' + (isExpanded ? '▼' : '▶') + '</button>' +
            '<button class="small manage-members" data-id="' + team.id + '">Members</button>' +
            '<button class="small manage-rankings" data-id="' + team.id + '">Rankings</button>' +
            '<button class="small edit-team" data-id="' + team.id + '">Edit</button>' +
            '<button class="small danger delete-team" data-id="' + team.id + '">Delete</button>' +
        '</span>';
        html += '</div>';
        
        if (isExpanded) {
            html += '<div class="team-members-expanded" data-team-id="' + team.id + '">';
            if (team.members && team.members.length > 0) {
                team.members.forEach(function(member) {
                    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    var age = char ? getCharacterAge(char) : '-';
                    var deadMarker = char && char.deceased ? ' Deceased' : '';
                    html += '<div class="member-entry">' +
                        '<span>' + name + deadMarker + ' <span class="role">(' + (member.role || 'Member') + ')</span></span>' +
                        '<span style="color:var(--text-dim);font-size:0.75rem;">Age: ' + age + ' | Joined: ' + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + member.leavePeriod : '') + '</span>' +
                    '</div>';
                });
            } else {
                html += '<div class="member-entry empty">No members</div>';
            }
            html += '</div>';
        }
    });
    
    return html;
}

/**
 * Attach filter events for a tab
 */
function attachFilterEvents(tab) {
    var filterWeek = document.getElementById('team-filter-week');
    if (filterWeek) {
        filterWeek.addEventListener('change', function() {
            var val = parseInt(this.value);
            if (!isNaN(val) && val > 0 && val <= 52) {
                teamManagerState.filterWeek = val;
                renderTeamTab(tab);
            }
        });
        filterWeek.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                var val = parseInt(this.value);
                if (!isNaN(val) && val > 0 && val <= 52) {
                    teamManagerState.filterWeek = val;
                    renderTeamTab(tab);
                }
            }
        });
    }
    
    var statusFilter = document.getElementById('team-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            teamManagerState.currentFilter = this.value;
            renderTeamTab(tab);
        });
    }
    
    var applyBtn = document.getElementById('apply-filter-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            var week = parseInt(document.getElementById('team-filter-week').value);
            if (!isNaN(week) && week > 0 && week <= 52) {
                teamManagerState.filterWeek = week;
                renderTeamTab(tab);
            } else {
                alert('Please enter a valid week (1-52).');
            }
        });
    }
}

/**
 * Attach team action events for a tab
 */
function attachTeamActionEvents(tab) {
    var container = document.getElementById('teams-container-' + tab);
    if (!container) return;
    
    // Toggle members
    container.querySelectorAll('.toggle-members').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = this.dataset.id;
            if (teamManagerState.expandedTeamId === id) {
                teamManagerState.expandedTeamId = null;
            } else {
                teamManagerState.expandedTeamId = id;
            }
            renderTeamTab(tab);
        });
    });
    
    // Manage members
    container.querySelectorAll('.manage-members').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openMemberModal(this.dataset.id, tab);
        });
    });
    
    // Manage rankings
    container.querySelectorAll('.manage-rankings').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openRankingModal(this.dataset.id, tab);
        });
    });
    
    // Edit team
    container.querySelectorAll('.edit-team').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showTeamForm(this.dataset.id, tab);
        });
    });
    
    // Delete team
    container.querySelectorAll('.delete-team').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTeam(this.dataset.id, tab);
        });
    });
}

/**
 * Show team form for add or edit
 */
function showTeamForm(editId, tab) {
    var modal = document.getElementById('team-form-modal');
    var title = document.getElementById('team-form-title');
    var form = document.getElementById('team-form-inner');
    
    modal.classList.remove('hidden');
    populateMissionSelector();
    updatePeriodLabels();
    
    if (editId) {
        title.textContent = 'Edit Team';
        var team = data.teams.find(function(t) { return String(t.id) === String(editId); });
        if (team) {
            document.getElementById('team-name').value = team.name || '';
            document.getElementById('team-type').value = team.type || 'academic';
            document.getElementById('team-start').value = team.startPeriod || '';
            document.getElementById('team-end').value = team.endPeriod || '';
            document.getElementById('team-ranking').value = team.currentRank || '';
            document.getElementById('team-status').value = team.status || 'active';
            if (team.temporaryMission) {
                document.getElementById('team-mission').value = team.temporaryMission;
            }
            form.dataset.editId = editId;
            form.dataset.tab = tab || 'academic';
            
            var container = document.getElementById('name-history-container');
            container.innerHTML = '';
            if (team.nameHistory && team.nameHistory.length > 0) {
                team.nameHistory.forEach(function(entry) {
                    addNameHistoryEntry(container, entry.name, entry.startPeriod, entry.endPeriod);
                });
            } else {
                addNameHistoryEntry(container);
            }
            setTimeout(updatePeriodLabels, 50);
            toggleMissionField(team.type);
        }
    } else {
        title.textContent = 'Add Team';
        form.reset();
        document.getElementById('team-type').value = tab || 'academic';
        document.getElementById('team-status').value = 'active';
        delete form.dataset.editId;
        delete form.dataset.tab;
        var container = document.getElementById('name-history-container');
        container.innerHTML = '';
        addNameHistoryEntry(container);
        setTimeout(updatePeriodLabels, 50);
        toggleMissionField(tab || 'academic');
    }
}

/**
 * Toggle mission field visibility based on team type
 */
function toggleMissionField(type) {
    var field = document.getElementById('temporary-mission-field');
    if (field) {
        field.style.display = (type === 'temporary') ? 'block' : 'none';
    }
}

/**
 * Update period labels based on team type
 */
function updatePeriodLabels() {
    var type = document.getElementById('team-type').value;
    var startLabel = document.getElementById('team-start-label');
    var endLabel = document.getElementById('team-end-label');
    var startInput = document.getElementById('team-start');
    var endInput = document.getElementById('team-end');
    
    toggleMissionField(type);
    
    if (type === 'academic') {
        if (startLabel) startLabel.textContent = 'Start Week';
        if (endLabel) endLabel.textContent = 'End Week (optional)';
        if (startInput) startInput.placeholder = 'Week (e.g., 1)';
        if (endInput) endInput.placeholder = 'Week (e.g., 52)';
    } else {
        if (startLabel) startLabel.textContent = 'Start Period';
        if (endLabel) endLabel.textContent = 'End Period (optional)';
        if (startInput) startInput.placeholder = 'Year or date';
        if (endInput) endInput.placeholder = 'Year or date';
    }
}

/**
 * Add name history entry
 */
function addNameHistoryEntry(container, name, start, end) {
    var entry = document.createElement('div');
    entry.className = 'name-history-entry';
    entry.innerHTML = `
        <input type="text" class="name-history-name" placeholder="Team Name" value="${name || ''}">
        <input type="text" class="name-history-start" placeholder="Start" value="${start || ''}">
        <input type="text" class="name-history-end" placeholder="End" value="${end || ''}">
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
    var tab = form.dataset.tab || 'academic';
    
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
        nameHistory: nameHistory,
        temporaryMission: document.getElementById('team-mission').value || null
    };
    
    if (!teamData.name) { alert('Team name is required.'); return; }
    if (!teamData.type) { alert('Team type is required.'); return; }
    
    if (editId) {
        var index = data.teams.findIndex(function(t) { return String(t.id) === String(editId); });
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
            temporaryMission: teamData.temporaryMission,
            createdAt: new Date().toISOString()
        };
        data.teams.push(newTeam);
        if (typeof logActivity === 'function') {
            logActivity('Added team: ' + teamData.name + ' (' + teamData.type + ')');
        }
    }
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to save team. Please check console for details.');
    });
    closeTeamForm();
    renderTeamTab(tab);
}

/**
 * Delete a team
 */
function deleteTeam(id, tab) {
    var team = data.teams.find(function(t) { return String(t.id) === String(id); });
    if (!team) return;
    if (!confirm('Delete "' + team.name + '" permanently?')) return;
    
    data.teams = data.teams.filter(function(t) { return String(t.id) !== String(id); });
    if (typeof logActivity === 'function') {
        logActivity('Deleted team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTeamTab(tab || 'academic');
}

/**
 * Close team form
 */
function closeTeamForm() {
    document.getElementById('team-form-modal').classList.add('hidden');
}

/**
 * Open member management modal
 */
function openMemberModal(teamId, tab) {
    var modal = document.getElementById('member-modal');
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team) return;
    
    teamManagerState.currentTeamId = teamId;
    var periodLabel = team.type === 'academic' ? 'Week' : 'Period';
    document.getElementById('modal-team-name').textContent = team.name + ' - Members';
    
    var select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    
    var sortedChars = data.characters.slice().sort(function(a, b) {
        var nameA = [a.firstName, a.middleName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.middleName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    sortedChars.forEach(function(char) {
        var inThisTeam = team.members && team.members.some(function(m) { return String(m.characterId) === String(char.id); });
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var deadMarker = char.deceased ? ' Deceased' : '';
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = name + deadMarker + (inThisTeam ? ' ✓' : '');
        if (inThisTeam) {
            option.style.color = 'var(--accent)';
            option.style.fontWeight = '600';
        }
        select.appendChild(option);
    });
    
    document.getElementById('member-role').value = '';
    document.getElementById('member-join').placeholder = 'Join ' + periodLabel;
    document.getElementById('member-join').value = '';
    document.getElementById('member-leave').placeholder = 'Leave ' + periodLabel;
    document.getElementById('member-leave').value = '';
    
    renderMembers(team);
    modal.dataset.teamId = teamId;
    modal.dataset.tab = tab || 'academic';
    modal.classList.remove('hidden');
}

/**
 * Render members in the member modal
 */
function renderMembers(team) {
    var container = document.getElementById('members-list');
    if (!team.members || team.members.length === 0) {
