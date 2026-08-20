/**
 * team-manager.js - Team Manager
 * Divided into four tabs: Academic, Professional, Temporary, Civilian
 * Each tab has its own independent filter state
 * 
 * Academic - Filtered by week, remembers week on page refresh/tab switch
 * Professional - Filtered by year, inactive teams at bottom greyed out
 * Temporary - Filtered by year, no inactive status (all are one-time)
 * Civilian - No filter, always shows all
 */

var teamManagerState = {
    currentTab: 'academic',
    // Independent filter states per tab
    filters: {
        academic: {
            filterWeek: 1,
            filterStatus: 'active'
        },
        professional: {
            filterYear: '',
            filterStatus: 'active'
        },
        temporary: {
            filterYear: '',
            filterStatus: 'active'
        },
        civilian: {
            filterStatus: 'active'
        }
    },
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
 * Get teams filtered by type and status with tab-specific filters
 */
function getFilteredTeams(type, filter, tabFilter) {
    initTeamManagerSystem();
    var teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    
    // Filter by type
    if (type === 'academic') {
        teams = teams.filter(function(t) { return t.type === 'academic'; });
    } else if (type === 'professional') {
        teams = teams.filter(function(t) { return t.type === 'professional'; });
    } else if (type === 'temporary') {
        teams = teams.filter(function(t) { return t.type === 'temporary' || t.type === 'internship'; });
    } else if (type === 'civilian') {
        teams = teams.filter(function(t) { return t.type === 'civilian'; });
    }
    
    // Apply tab-specific filters
    if (type === 'academic') {
        // Academic: Filter by week
        var weekNum = tabFilter?.filterWeek || teamManagerState.filters.academic.filterWeek || 1;
        var block = getWeekBlock(weekNum);
        teams = teams.filter(function(team) {
            var start = parseInt(team.startPeriod);
            var end = parseInt(team.endPeriod);
            if (isNaN(start)) return true;
            return start <= block.end && (isNaN(end) || end >= block.start);
        });
        // Also filter by status if needed
        if (filter === 'active') {
            teams = teams.filter(function(t) { return t.status === 'active'; });
        } else if (filter === 'inactive') {
            teams = teams.filter(function(t) { return t.status === 'deprecated' || t.status === 'inactive'; });
        }
    } else if (type === 'professional') {
        // Professional: Filter by year (startPeriod >= filterYear)
        var year = tabFilter?.filterYear || '';
        if (year) {
            var yearNum = parseInt(year);
            if (!isNaN(yearNum)) {
                teams = teams.filter(function(team) {
                    var start = parseInt(team.startPeriod);
                    return !isNaN(start) && start >= yearNum;
                });
            }
        }
        // Filter by status - inactive teams go to bottom
        if (filter === 'active') {
            teams = teams.filter(function(t) { return t.status === 'active'; });
        } else if (filter === 'inactive') {
            teams = teams.filter(function(t) { return t.status === 'deprecated' || t.status === 'inactive'; });
        }
    } else if (type === 'temporary') {
        // Temporary: Filter by year (startPeriod >= filterYear)
        var year = tabFilter?.filterYear || '';
        if (year) {
            var yearNum = parseInt(year);
            if (!isNaN(yearNum)) {
                teams = teams.filter(function(team) {
                    var start = parseInt(team.startPeriod);
                    return !isNaN(start) && start >= yearNum;
                });
            }
        }
        // No inactive filter - all temporary teams are shown
    } else if (type === 'civilian') {
        // Civilian: No filters, show all
        // Just ensure we show all civilian teams
    }
    
    // Sort teams: active first, then inactive/deprecated
    teams.sort(function(a, b) {
        // For professional, put inactive at bottom
        if (type === 'professional') {
            var aActive = a.status === 'active' ? 0 : 1;
            var bActive = b.status === 'active' ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
        }
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
    } else if (team.type === 'temporary') {
        if (team.startPeriod && team.endPeriod) {
            return team.startPeriod + ' - ' + team.endPeriod;
        } else if (team.startPeriod) {
            return 'From ' + team.startPeriod;
        }
        return '-';
    } else {
        // Civilian
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
 * Get member status for a specific week
 */
function getMemberStatusAtWeek(member, week) {
    var weekNum = parseInt(week) || 1;
    var join = parseInt(member.joinPeriod);
    var leave = parseInt(member.leavePeriod);
    
    // Find the character
    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
    
    // Check if deceased
    if (char && char.deceased) {
        if (char.deathYear) {
            var deathYear = parseInt(char.deathYear);
            if (!isNaN(deathYear) && deathYear <= weekNum) {
                return 'deceased';
            }
        }
        if (char.deathAge) {
            var birthYear = parseInt(char.birthYear);
            if (!isNaN(birthYear)) {
                var deathYear = birthYear + parseInt(char.deathAge);
                if (deathYear <= weekNum) {
                    return 'deceased';
                }
            }
        }
        return 'deceased';
    }
    
    // Check if eliminated
    if (char && char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
        for (var i = 0; i < char.eliminatedWeeks.length; i++) {
            var elimWeek = parseInt(char.eliminatedWeeks[i]);
            if (!isNaN(elimWeek) && elimWeek <= weekNum) {
                return 'eliminated';
            }
        }
    }
    
    // Check if left the team
    if (!isNaN(leave) && leave < weekNum) {
        return 'left';
    }
    
    // Check if not joined yet
    if (!isNaN(join) && join > weekNum) {
        return 'future';
    }
    
    // Check if currently active
    if (!isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum)) {
        return 'active';
    }
    
    return 'unknown';
}

/**
 * Get member status label and color
 */
function getMemberStatusInfo(status) {
    var map = {
        'active': { label: 'Active', color: 'var(--accent)' },
        'left': { label: 'Former', color: 'var(--text-dim)' },
        'deceased': { label: 'Deceased', color: 'var(--danger)' },
        'eliminated': { label: 'Eliminated', color: 'var(--danger)' },
        'future': { label: 'Future Member', color: 'var(--warning)' },
        'unknown': { label: 'Unknown', color: 'var(--text-dim)' }
    };
    return map[status] || map['unknown'];
}

/**
 * Get character's current career status for a specific year/week
 */
function getCharacterStatusAtYear(char, year) {
    if (!char || !char.careerStatus || char.careerStatus.length === 0) {
        return 'civilian';
    }
    
    var yearNum = parseInt(year) || 1;
    var currentStatus = 'civilian';
    
    char.careerStatus.forEach(function(status) {
        var start = parseInt(status.startYear);
        var end = status.endYear ? parseInt(status.endYear) : null;
        
        if (!isNaN(start) && start <= yearNum && (end === null || yearNum <= end)) {
            currentStatus = status.status;
        }
    });
    
    return currentStatus;
}

/**
 * Check if a character's academic period is complete
 */
function isAcademicPeriodComplete(char, week) {
    if (!char) return true;
    var weekNum = parseInt(week) || 1;
    var status = getCharacterStatusAtYear(char, weekNum);
    return status !== 'trainee';
}

/**
 * Get character availability for a specific time
 */
function getCharacterAvailability(charId, week, teamId) {
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char) return { available: false, reason: 'Character not found' };
    
    var weekNum = parseInt(week) || 1;
    
    // Check if deceased
    if (char.deceased) {
        if (char.deathYear) {
            var deathYear = parseInt(char.deathYear);
            if (!isNaN(deathYear) && deathYear <= weekNum) {
                return { available: false, reason: 'Deceased' };
            }
        }
        if (char.deathAge) {
            var birthYear = parseInt(char.birthYear);
            if (!isNaN(birthYear)) {
                var deathYear = birthYear + parseInt(char.deathAge);
                if (deathYear <= weekNum) {
                    return { available: false, reason: 'Deceased' };
                }
            }
        }
        return { available: false, reason: 'Deceased' };
    }
    
    // Check if eliminated
    if (char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
        for (var i = 0; i < char.eliminatedWeeks.length; i++) {
            var elimWeek = parseInt(char.eliminatedWeeks[i]);
            if (!isNaN(elimWeek) && elimWeek <= weekNum) {
                return { available: false, reason: 'Eliminated from tournaments' };
            }
        }
    }
    
    // Check if already in another team (academic teams only count if still a trainee)
    var targetTeam = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    var targetTeamType = targetTeam ? targetTeam.type : null;
    
    for (var i = 0; i < data.teams.length; i++) {
        var team = data.teams[i];
        if (team.status === 'deleted' || team.status === 'inactive') continue;
        if (String(team.id) === String(teamId)) continue;
        
        // If target is professional/temporary/civilian, ignore academic teams if not a trainee
        if (targetTeamType === 'professional' || targetTeamType === 'temporary' || targetTeamType === 'civilian') {
            if (team.type === 'academic') {
                if (isAcademicPeriodComplete(char, weekNum)) {
                    continue;
                }
            }
        }
        
        if (team.members) {
            for (var j = 0; j < team.members.length; j++) {
                var member = team.members[j];
                if (String(member.characterId) === String(charId)) {
                    var join = parseInt(member.joinPeriod);
                    var leave = parseInt(member.leavePeriod);
                    if (!isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum)) {
                        var typeLabel = team.type === 'academic' ? 'Academic' : 
                                       team.type === 'professional' ? 'Professional' : 
                                       team.type === 'temporary' ? 'Temporary' : 'Civilian';
                        return { available: false, reason: 'Currently in ' + typeLabel + ' team: ' + team.name };
                    }
                }
            }
        }
    }
    
    return { available: true, reason: 'Available' };
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
                <button class="tab-btn ${activeTab === 'civilian' ? 'active' : ''}" data-tab="civilian">Civilian</button>
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
                <div id="tab-civilian" class="tab-panel ${activeTab === 'civilian' ? 'active' : ''}" style="${activeTab === 'civilian' ? 'display:block;' : 'display:none;'}">
                    <div id="civilian-content"></div>
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
                                    <option value="civilian">Civilian</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label id="team-start-label">Start Period</label>
                                <input type="text" id="team-start" placeholder="Week or Year">
                            </div>
                            <div class="form-group">
                                <label id="team-end-label">End Period (optional)</label>
                                <input type="text" id="team-end" placeholder="Week or Year">
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
            <div class="modal-content" style="max-width:800px;">
                <div class="modal-header">
                    <h3 id="modal-team-name">Team Members</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="member-form">
                        <select id="member-character" style="min-width:200px;">
                            <option value="">Select character...</option>
                        </select>
                        <input type="text" id="member-role" placeholder="Role" style="min-width:120px;">
                        <input type="text" id="member-join" placeholder="Join Week/Year" style="min-width:100px;">
                        <input type="text" id="member-leave" placeholder="Leave Week/Year" style="min-width:100px;">
                        <button id="add-member-btn" class="primary small">Add Member</button>
                    </div>
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:8px;">
                        Shows all members who have ever been in this team. Status indicates their current state.
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
 * Get characters by status based on team type
 */
function getCharactersForTeamType(teamType) {
    var chars = data.characters || [];
    var result = [];
    
    chars.forEach(function(c) {
        var status = getCurrentStatus(c).toLowerCase();
        
        if (teamType === 'academic') {
            if (status === 'trainee' || status.startsWith('trainee')) {
                result.push(c);
            }
        } else if (teamType === 'civilian') {
            if (status === 'civilian') {
                result.push(c);
            }
        } else {
            var allowedStatuses = ['trainee', 'rookie', 'junior', 'senior', 'instructor', 'support'];
            var isAllowed = false;
            for (var i = 0; i < allowedStatuses.length; i++) {
                if (status === allowedStatuses[i] || status.startsWith(allowedStatuses[i])) {
                    isAllowed = true;
                    break;
                }
            }
            if (isAllowed) {
                result.push(c);
            }
        }
    });
    
    return result;
}

/**
 * Render a specific team tab
 */
function renderTeamTab(tab) {
    var container = document.getElementById(tab + '-content');
    if (!container) return;
    
    var filter = teamManagerState.filters[tab]?.filterStatus || 'active';
    var tabFilter = teamManagerState.filters[tab] || {};
    
    var teams = getFilteredTeams(tab, filter, tabFilter);
    
    // Build filter controls based on tab type
    var filterHtml = '';
    if (tab === 'academic') {
        var weekValue = tabFilter.filterWeek || 1;
        filterHtml = `
            <div class="filter-section">
                <label for="team-filter-week">Week:</label>
                <input type="number" id="team-filter-week" value="${weekValue}" min="1" max="52" style="width:80px;">
                <button id="apply-filter-btn" class="small primary">Apply</button>
                <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Shows teams active during this 2-week block</span>
                <label style="margin-left:12px;display:flex;align-items:center;gap:4px;font-size:0.75rem;color:var(--text-dim);cursor:pointer;">
                    <input type="checkbox" id="academic-show-inactive" ${filter === 'inactive' ? 'checked' : ''} style="width:auto;accent-color:var(--accent);cursor:pointer;"> Show Inactive
                </label>
            </div>
        `;
    } else if (tab === 'professional') {
        var yearValue = tabFilter.filterYear || '';
        filterHtml = `
            <div class="filter-section">
                <label for="team-filter-year">Year:</label>
                <input type="number" id="team-filter-year" value="${yearValue}" min="1900" max="2100" style="width:80px;" placeholder="All">
                <button id="apply-filter-btn" class="small primary">Apply</button>
                <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Shows teams active from this year onward</span>
                <label style="margin-left:12px;display:flex;align-items:center;gap:4px;font-size:0.75rem;color:var(--text-dim);cursor:pointer;">
                    <input type="checkbox" id="professional-show-inactive" ${filter === 'inactive' ? 'checked' : ''} style="width:auto;accent-color:var(--accent);cursor:pointer;"> Show Inactive
                </label>
            </div>
        `;
    } else if (tab === 'temporary') {
        var yearValue = tabFilter.filterYear || '';
        filterHtml = `
            <div class="filter-section">
                <label for="team-filter-year">Year:</label>
                <input type="number" id="team-filter-year" value="${yearValue}" min="1900" max="2100" style="width:80px;" placeholder="All">
                <button id="apply-filter-btn" class="small primary">Apply</button>
                <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Shows teams active from this year onward</span>
                <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Temporary teams are always shown (no inactive filter)</span>
            </div>
        `;
    } else if (tab === 'civilian') {
        filterHtml = `
            <div class="filter-section">
                <span style="font-size:0.75rem;color:var(--text-dim);">All civilian teams shown (no filters)</span>
            </div>
        `;
    }
    
    var listHeader = '';
    listHeader = `
        <div class="list-header team-header" style="grid-template-columns:1.2fr 0.8fr 0.6fr 0.6fr 1fr;">
            <span>Team Name</span>
            <span>Period</span>
            <span>Rank</span>
            <span>Members</span>
            <span>Actions</span>
        </div>
    `;
    
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
            'temporary': 'temporary teams',
            'civilian': 'civilian teams'
        };
        return '<p class="empty-state">No ' + (labels[tab] || 'teams') + ' found.</p>';
    }
    
    var html = '';
    var filterWeek = teamManagerState.filters.academic?.filterWeek || 1;
    
    teams.forEach(function(team) {
        var periodDisplay = getTeamPeriodDisplay(team);
        var memberCount = getActiveMemberCount(team);
        var isExpanded = teamManagerState.expandedTeamId === team.id;
        
        var isInactive = team.status === 'deprecated' || team.status === 'inactive';
        var statusLabel = team.status === 'active' ? 'Active' : (team.status === 'deprecated' ? 'Deprecated' : 'Inactive');
        var statusColor = team.status === 'active' ? 'var(--accent)' : 'var(--text-dim)';
        
        // For professional, grey out inactive teams
        var inactiveClass = '';
        var inactiveStyle = '';
        if (tab === 'professional' && isInactive) {
            inactiveClass = ' inactive-team';
            inactiveStyle = 'opacity:0.5;background:var(--panel-alt);';
        }
        
        var rankDisplay = team.currentRank || '-';
        var missionDisplay = '';
        if ((tab === 'temporary' || tab === 'professional') && team.temporaryMission) {
            var missionTitle = getMissionTitle(team.temporaryMission);
            if (missionTitle) {
                missionDisplay = ' <span style="font-size:0.6rem;color:var(--text-dim);">(' + missionTitle + ')</span>';
            }
        }
        
        var typeLabel = team.type === 'academic' ? '📚 Academic' : 
                        team.type === 'professional' ? '💼 Professional' : 
                        team.type === 'temporary' ? '📋 Temporary' : '👤 Civilian';
        
        html += '<div class="list-item team-item' + inactiveClass + '" data-id="' + team.id + '" style="grid-template-columns:1.2fr 0.8fr 0.6fr 0.6fr 1fr;' + inactiveStyle + '">';
        html += '<span><strong>' + team.name + '</strong> <span style="font-size:0.6rem;color:var(--text-dim);">' + typeLabel + '</span>' + missionDisplay + 
            (isInactive ? ' <span style="color:var(--text-dim);font-size:0.6rem;">(Inactive)</span>' : '') + '</span>';
        html += '<span style="font-size:0.75rem;">' + periodDisplay + '</span>';
        html += '<span style="font-size:0.75rem;">' + rankDisplay + '</span>';
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
            var activeMembers = getActiveMembers(team, filterWeek);
            if (activeMembers.length > 0) {
                html += '<div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px;">Current Active Members:</div>';
                activeMembers.forEach(function(member) {
                    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    var age = char ? getCharacterAge(char) : '-';
                    var deadMarker = char && char.deceased ? ' Deceased' : '';
                    var status = getMemberStatusAtWeek(member, filterWeek);
                    var statusInfo = getMemberStatusInfo(status);
                    
                    html += '<div class="member-entry" style="border-left:3px solid ' + statusInfo.color + ';padding-left:8px;">' +
                        '<span>' + name + deadMarker + ' <span class="role">(' + (member.role || 'Member') + ')</span></span>' +
                        '<span style="color:var(--text-dim);font-size:0.75rem;">Age: ' + age + ' | Joined: ' + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + member.leavePeriod : '') + ' | <span style="color:' + statusInfo.color + ';">' + statusInfo.label + '</span></span>' +
                    '</div>';
                });
            } else {
                html += '<div class="member-entry empty" style="color:var(--text-dim);font-size:0.8rem;">No active members this week</div>';
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
    var container = document.getElementById('teams-container-' + tab);
    if (!container) return;
    
    var applyBtn = document.getElementById('apply-filter-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            if (tab === 'academic') {
                var week = parseInt(document.getElementById('team-filter-week').value);
                if (!isNaN(week) && week > 0 && week <= 52) {
                    teamManagerState.filters.academic.filterWeek = week;
                    renderTeamTab(tab);
                } else {
                    alert('Please enter a valid week (1-52).');
                }
            } else if (tab === 'professional' || tab === 'temporary') {
                var year = document.getElementById('team-filter-year').value;
                if (year === '' || !isNaN(parseInt(year))) {
                    teamManagerState.filters[tab].filterYear = year;
                    renderTeamTab(tab);
                } else {
                    alert('Please enter a valid year.');
                }
            }
        });
    }
    
    // Enter key support for inputs
    var input = document.getElementById('team-filter-week') || document.getElementById('team-filter-year');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyBtn.click();
            }
        });
    }
    
    // Show inactive checkbox
    var inactiveCheck = document.getElementById(tab + '-show-inactive');
    if (inactiveCheck) {
        inactiveCheck.addEventListener('change', function() {
            teamManagerState.filters[tab].filterStatus = this.checked ? 'inactive' : 'active';
            renderTeamTab(tab);
        });
    }
}

/**
 * Attach team action events for a tab
 */
function attachTeamActionEvents(tab) {
    var container = document.getElementById('teams-container-' + tab);
    if (!container) return;
    
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
    
    container.querySelectorAll('.manage-members').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openMemberModal(this.dataset.id, tab);
        });
    });
    
    container.querySelectorAll('.manage-rankings').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openRankingModal(this.dataset.id, tab);
        });
    });
    
    container.querySelectorAll('.edit-team').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showTeamForm(this.dataset.id, tab);
        });
    });
    
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
        field.style.display = (type === 'temporary' || type === 'professional') ? 'block' : 'none';
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
 * Get status priority for sorting
 */
function getStatusPriority(status) {
    var map = {
        'active': 0,
        'future': 1,
        'left': 2,
        'eliminated': 3,
        'deceased': 4,
        'unknown': 5
    };
    return map[status] !== undefined ? map[status] : 5;
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
    document.getElementById('modal-team-name').textContent = team.name + ' - Members (Full History)';
    
    var select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    
    var currentWeek = teamManagerState.filters.academic?.filterWeek || 1;
    var teamType = team.type || 'academic';
    
    var eligibleChars = getCharactersForTeamType(teamType);
    
    var currentMemberIds = [];
    var formerMemberIds = [];
    if (team.members) {
        team.members.forEach(function(m) {
            var status = getMemberStatusAtWeek(m, currentWeek);
            if (status === 'active' || status === 'future') {
                currentMemberIds.push(m.characterId);
            } else {
                formerMemberIds.push(m.characterId);
            }
        });
    }
    
    var inTeamChars = [];
    var inOtherTeamChars = [];
    var formerChars = [];
    var eliminatedChars = [];
    var deceasedChars = [];
    var availableChars = [];
    
    eligibleChars.forEach(function(char) {
        var charId = char.id;
        var charStatus = getCurrentStatus(char).toLowerCase();
        var isDeceased = char.deceased || false;
        
        var inTeam = currentMemberIds.indexOf(charId) !== -1;
        var isFormer = formerMemberIds.indexOf(charId) !== -1;
        
        if (inTeam) {
            var status = getMemberStatusAtWeek({ characterId: charId, joinPeriod: '', leavePeriod: '' }, currentWeek);
            var statusInfo = getMemberStatusInfo(status);
            inTeamChars.push({ char: char, status: 'in_team', label: '✓ Already in team', statusInfo: statusInfo });
            return;
        }
        
        if (isDeceased) {
            if (char.deathYear) {
                var deathYear = parseInt(char.deathYear);
                if (!isNaN(deathYear) && deathYear <= currentWeek) {
                    isDeceased = true;
                }
            }
            if (char.deathAge) {
                var birthYear = parseInt(char.birthYear);
                if (!isNaN(birthYear)) {
                    var deathYear = birthYear + parseInt(char.deathAge);
                    if (deathYear <= currentWeek) {
                        isDeceased = true;
                    }
                }
            }
        }
        
        if (isDeceased) {
            deceasedChars.push({ char: char, status: 'deceased', label: '✝ Deceased' });
            return;
        }
        
        var isEliminated = false;
        if (char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
            for (var i = 0; i < char.eliminatedWeeks.length; i++) {
                var elimWeek = parseInt(char.eliminatedWeeks[i]);
                if (!isNaN(elimWeek) && elimWeek <= currentWeek) {
                    isEliminated = true;
                    break;
                }
            }
        }
        
        if (isEliminated) {
            eliminatedChars.push({ char: char, status: 'eliminated', label: '⚠ Eliminated' });
            return;
        }
        
        if (isFormer) {
            formerChars.push({ char: char, status: 'former', label: '↩ Former Member' });
            return;
        }
        
        var availability = getCharacterAvailability(charId, currentWeek, teamId);
        if (!availability.available) {
            inOtherTeamChars.push({ char: char, status: 'in_other_team', label: '⊘ ' + availability.reason });
            return;
        }
        
        availableChars.push({ char: char, status: 'available', label: '' });
    });
    
    function sortByName(a, b) {
        var nameA = [a.char.firstName, a.char.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.char.firstName, b.char.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    }
    
    inTeamChars.sort(sortByName);
    availableChars.sort(sortByName);
    inOtherTeamChars.sort(sortByName);
    formerChars.sort(sortByName);
    eliminatedChars.sort(sortByName);
    deceasedChars.sort(sortByName);
    
    var groupOrder = [
        { items: inTeamChars, label: '— Already in Team —' },
        { items: availableChars, label: '— Available —' },
        { items: inOtherTeamChars, label: '— In Other Teams —' },
        { items: formerChars, label: '— Former Members —' },
        { items: eliminatedChars, label: '— Eliminated —' },
        { items: deceasedChars, label: '— Deceased —' }
    ];
    
    var hasItems = false;
    groupOrder.forEach(function(group) {
        if (group.items.length > 0) {
            if (hasItems) {
                var separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = group.label;
                separator.style.color = 'var(--text-dim)';
                select.appendChild(separator);
            } else {
                hasItems = true;
            }
            
            group.items.forEach(function(item) {
                var char = item.char;
                var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                var status = getCurrentStatus(char);
                var option = document.createElement('option');
                option.value = char.id;
                
                var label = name + ' [' + status + ']';
                if (item.label) {
                    label += ' ' + item.label;
                }
                option.textContent = label;
                
                if (item.status === 'deceased') {
                    option.style.color = 'var(--danger)';
                    option.style.textDecoration = 'line-through';
                } else if (item.status === 'eliminated') {
                    option.style.color = 'var(--danger)';
                } else if (item.status === 'former') {
                    option.style.color = 'var(--text-dim)';
                    option.style.fontStyle = 'italic';
                } else if (item.status === 'in_team') {
                    option.style.color = 'var(--accent)';
                    option.style.fontWeight = 'bold';
                } else if (item.status === 'in_other_team') {
                    option.style.color = 'var(--text-dim)';
                }
                select.appendChild(option);
            });
        }
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
        container.innerHTML = '<p class="empty-state">No members in this team</p>';
        return;
    }
    
    var periodLabel = team.type === 'academic' ? 'Wk' : 'Period';
    var currentWeek = teamManagerState.filters.academic?.filterWeek || 1;
    var html = '';
    
    var activeMembers = [];
    var formerMembers = [];
    
    team.members.forEach(function(member, index) {
        var status = getMemberStatusAtWeek(member, currentWeek);
        if (status === 'active' || status === 'future') {
            activeMembers.push({ member: member, index: index, status: status });
        } else {
            formerMembers.push({ member: member, index: index, status: status });
        }
    });
    
    activeMembers.sort(function(a, b) {
        var aJoin = parseInt(a.member.joinPeriod) || 0;
        var bJoin = parseInt(b.member.joinPeriod) || 0;
        return aJoin - bJoin;
    });
    
    formerMembers.sort(function(a, b) {
        var aPriority = getStatusPriority(a.status);
        var bPriority = getStatusPriority(b.status);
        if (aPriority !== bPriority) return aPriority - bPriority;
        var aName = a.member.characterId || '';
        var bName = b.member.characterId || '';
        return aName.localeCompare(bName);
    });
    
    var allMembers = activeMembers.concat(formerMembers);
    
    allMembers.forEach(function(item) {
        var member = item.member;
        var index = item.index;
        var status = item.status;
        var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
        var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var age = char ? getCharacterAge(char) : '-';
        
        var statusInfo = getMemberStatusInfo(status);
        var periodDisplay = periodLabel + (member.joinPeriod || '?');
        if (member.leavePeriod) {
            periodDisplay += ' → ' + periodLabel + member.leavePeriod;
        }
        
        var statusIcon = '';
        var statusSuffix = '';
        if (status === 'deceased') {
            statusIcon = '✝ ';
            statusSuffix = ' (Deceased)';
        } else if (status === 'eliminated') {
            statusIcon = '⚠ ';
            statusSuffix = ' (Eliminated)';
        } else if (status === 'left') {
            statusIcon = '↩ ';
            statusSuffix = ' (Former)';
        } else if (status === 'future') {
            statusIcon = '⏳ ';
            statusSuffix = ' (Future)';
        } else if (status === 'active') {
            statusIcon = '✓ ';
        }
        
        html += '<div class="member-entry" style="border-left:3px solid ' + statusInfo.color + ';padding-left:8px;' + 
            (status === 'deceased' ? 'opacity:0.6;' : '') + 
            (status === 'left' ? 'opacity:0.7;' : '') + '" data-member-index="' + index + '">' +
            '<div class="member-info">' +
                '<span><strong>' + name + '</strong></span>' +
                '<span class="role">' + (member.role || 'Member') + '</span>' +
                '<span class="years">' + periodDisplay + '</span>' +
                '<span class="years">Age: ' + age + '</span>' +
                '<span style="color:' + statusInfo.color + ';font-size:0.7rem;font-weight:600;">' + statusIcon + statusInfo.label + statusSuffix + '</span>' +
            '</div>' +
            '<div class="member-actions">' +
                '<button class="small edit-member" data-index="' + index + '">Edit</button>' +
                '<button class="small danger remove-member" data-char="' + member.characterId + '">Remove</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-member').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var index = parseInt(this.dataset.index);
            if (!isNaN(index)) {
                openEditMemberModal(team.id, index);
            }
        });
    });
    container.querySelectorAll('.remove-member').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeMember(team.id, this.dataset.char);
        });
    });
}

/**
 * Add member to team
 */
function addMember() {
    var modal = document.getElementById('member-modal');
    var teamId = modal.dataset.teamId;
    var tab = modal.dataset.tab || 'academic';
    if (!teamId) return;
    
    var charId = document.getElementById('member-character').value;
    var role = document.getElementById('member-role').value.trim();
    var joinPeriod = document.getElementById('member-join').value;
    var leavePeriod = document.getElementById('member-leave').value;
    
    if (!charId) { alert('Please select a character.'); return; }
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team) return;
    
    if (team.members && team.members.some(function(m) { return String(m.characterId) === String(charId); })) {
        alert('This character is already in the team.');
        return;
    }
    
    var currentWeek = teamManagerState.filters.academic?.filterWeek || 1;
    var availability = getCharacterAvailability(charId, currentWeek, teamId);
    if (!availability.available) {
        if (!confirm('This character is currently not available: ' + availability.reason + '\n\nAdd them anyway?')) {
            return;
        }
    }
    
    if (!team.members) team.members = [];
    team.members.push({
        characterId: charId,
        role: role || 'Member',
        joinPeriod: joinPeriod || '',
        leavePeriod: leavePeriod || ''
    });
    
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (typeof logActivity === 'function') {
        logActivity('Added ' + (char ? char.firstName : 'character') + ' to team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeamTab(tab);
}

/**
 * Remove member from team
 */
function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;
    var modal = document.getElementById('member-modal');
    var tab = modal.dataset.tab || 'academic';
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team) return;
    
    team.members = team.members.filter(function(m) { return String(m.characterId) !== String(charId); });
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (typeof logActivity === 'function') {
        logActivity('Removed ' + (char ? char.firstName : 'character') + ' from team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeamTab(tab);
}

/**
 * Open edit member modal
 */
function openEditMemberModal(teamId, index) {
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team || !team.members || !team.members[index]) {
        alert('Member not found.');
        return;
    }
    
    var member = team.members[index];
    var char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    document.getElementById('edit-member-name').textContent = name;
    document.getElementById('edit-member-role').value = member.role || '';
    document.getElementById('edit-member-join').value = member.joinPeriod || '';
    document.getElementById('edit-member-leave').value = member.leavePeriod || '';
    document.getElementById('edit-member-modal').dataset.teamId = teamId;
    document.getElementById('edit-member-modal').dataset.index = index;
    document.getElementById('edit-member-modal').classList.remove('hidden');
}

/**
 * Save edited member
 */
function saveEditMember(e) {
    e.preventDefault();
    var modal = document.getElementById('edit-member-modal');
    var teamId = modal.dataset.teamId;
    var index = parseInt(modal.dataset.index);
    var parentModal = document.getElementById('member-modal');
    var tab = parentModal ? parentModal.dataset.tab || 'academic' : 'academic';
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
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
    closeEditMemberModal();
    renderMembers(team);
    renderTeamTab(tab);
}

/**
 * Close edit member modal
 */
function closeEditMemberModal() {
    document.getElementById('edit-member-modal').classList.add('hidden');
}

/**
 * Close member modal
 */
function closeMemberModal() {
    document.getElementById('member-modal').classList.add('hidden');
}

/**
 * Open ranking modal
 */
function openRankingModal(teamId, tab) {
    var modal = document.getElementById('ranking-modal');
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team) return;
    
    var periodLabel = team.type === 'academic' ? 'Week Block' : 'Period';
    document.getElementById('ranking-modal-title').textContent = team.name + ' - Ranking History';
    document.getElementById('ranking-week').placeholder = periodLabel + ' (e.g., 1 for weeks 1-2)';
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
    modal.dataset.teamId = teamId;
    modal.dataset.tab = tab || 'academic';
    
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
    
    var periodLabel = team.type === 'academic' ? 'Weeks' : 'Period';
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
            '<button class="small danger remove-ranking" data-index="' + index + '">Remove</button>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-ranking').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeRanking(team.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Add ranking entry
 */
function addRanking() {
    var modal = document.getElementById('ranking-modal');
    var teamId = modal.dataset.teamId;
    var tab = modal.dataset.tab || 'academic';
    if (!teamId) return;
    
    var period = document.getElementById('ranking-week').value;
    var rank = document.getElementById('ranking-rank').value;
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team) return;
    
    if (!period) {
        alert('Please enter a ' + (team.type === 'academic' ? 'week block' : 'period') + '.');
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
            return String(r.period) === String(period);
        });
        if (existing !== -1) {
            if (!confirm('Ranking for ' + period + ' already exists. Overwrite?')) return;
            team.rankingHistory[existing] = { period: period, rank: rank };
        } else {
            team.rankingHistory.push({ period: period, rank: rank });
        }
    }
    
    team.rankingHistory.sort(function(a, b) {
        if (team.type === 'academic') {
            return parseInt(a.period) - parseInt(b.period);
        }
        return String(a.period).localeCompare(String(b.period));
    });
    
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) {
            if (team.type === 'academic') {
                return parseInt(a.period) - parseInt(b.period);
            }
            return String(a.period).localeCompare(String(b.period));
        });
        team.currentRank = sorted[sorted.length - 1].rank;
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Added ranking #' + rank + ' for team: ' + team.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRankings(team);
    renderTeamTab(tab);
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
}

/**
 * Remove ranking entry
 */
function removeRanking(teamId, index) {
    if (!confirm('Remove this ranking entry?')) return;
    var modal = document.getElementById('ranking-modal');
    var tab = modal.dataset.tab || 'academic';
    
    var team = data.teams.find(function(t) { return String(t.id) === String(teamId); });
    if (!team || !team.rankingHistory) return;
    
    team.rankingHistory.splice(index, 1);
    
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) {
            if (team.type === 'academic') {
                return parseInt(a.period) - parseInt(b.period);
            }
            return String(a.period).localeCompare(String(b.period));
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
    renderTeamTab(tab);
}

/**
 * Close ranking modal
 */
function closeRankingModal() {
    document.getElementById('ranking-modal').classList.add('hidden');
}

/**
 * Initialize team manager events
 */
function initTeamManagerEvents() {
    // Tab switching - preserves filter state per tab
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tab = this.dataset.tab;
            teamManagerState.currentTab = tab;
            
            document.querySelectorAll('.tab-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.tab-panel').forEach(function(p) {
                p.style.display = 'none';
                p.classList.remove('active');
            });
            var panel = document.getElementById('tab-' + tab);
            if (panel) {
                panel.style.display = 'block';
                panel.classList.add('active');
            }
            
            renderTeamTab(tab);
        });
    });
    
    // Add team button
    var addBtn = document.getElementById('add-team-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showTeamForm(null, teamManagerState.currentTab || 'academic');
        });
    }
    
    // Form close buttons
    var closeFormBtn = document.getElementById('close-team-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeTeamForm);
    }
    var cancelFormBtn = document.getElementById('cancel-team-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeTeamForm);
    }
    var formModal = document.getElementById('team-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeTeamForm();
        });
    }
    
    // Form submit
    var form = document.getElementById('team-form-inner');
    if (form) {
        form.addEventListener('submit', saveTeam);
    }
    
    // Team type change handler
    var typeSelect = document.getElementById('team-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', updatePeriodLabels);
    }
    
    // Add name history
    var addNameBtn = document.getElementById('add-name-history-btn');
    if (addNameBtn) {
        addNameBtn.addEventListener('click', function() {
            var container = document.getElementById('name-history-container');
            addNameHistoryEntry(container);
        });
    }
    
    // Member modal events
    var memberClose = document.querySelector('#member-modal .close-modal');
    if (memberClose) {
        memberClose.addEventListener('click', closeMemberModal);
    }
    var memberBg = document.getElementById('member-modal');
    if (memberBg) {
        memberBg.addEventListener('click', function(e) {
            if (e.target === this) closeMemberModal();
        });
    }
    var addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', addMember);
    }
    
    // Edit member modal events
    var editClose = document.querySelector('#edit-member-modal .close-modal');
    if (editClose) {
        editClose.addEventListener('click', closeEditMemberModal);
    }
    var editBg = document.getElementById('edit-member-modal');
    if (editBg) {
        editBg.addEventListener('click', function(e) {
            if (e.target === this) closeEditMemberModal();
        });
    }
    var cancelEdit = document.getElementById('cancel-edit-member');
    if (cancelEdit) {
        cancelEdit.addEventListener('click', closeEditMemberModal);
    }
    var editForm = document.getElementById('edit-member-form');
    if (editForm) {
        editForm.addEventListener('submit', saveEditMember);
    }
    
    // Ranking modal events
    var rankClose = document.querySelector('#ranking-modal .close-modal');
    if (rankClose) {
        rankClose.addEventListener('click', closeRankingModal);
    }
    var rankBg = document.getElementById('ranking-modal');
    if (rankBg) {
        rankBg.addEventListener('click', function(e) {
            if (e.target === this) closeRankingModal();
        });
    }
    var addRankBtn = document.getElementById('add-ranking-btn');
    if (addRankBtn) {
        addRankBtn.addEventListener('click', addRanking);
    }
}

// Make functions globally available
window.renderTeamManagerView = renderTeamManagerView;
window.getFilteredTeams = getFilteredTeams;
window.getTeamName = getTeamName;
window.getActiveMembers = getActiveMembers;
window.getActiveMemberCount = getActiveMemberCount;
window.getTeamPeriodDisplay = getTeamPeriodDisplay;
window.getMemberStatusAtWeek = getMemberStatusAtWeek;
window.getMemberStatusInfo = getMemberStatusInfo;
window.getCharacterAvailability = getCharacterAvailability;
window.getCharacterStatusAtYear = getCharacterStatusAtYear;
window.isAcademicPeriodComplete = isAcademicPeriodComplete;
window.showTeamForm = showTeamForm;
window.saveTeam = saveTeam;
window.deleteTeam = deleteTeam;
window.openMemberModal = openMemberModal;
window.openRankingModal = openRankingModal;
window.closeMemberModal = closeMemberModal;
window.closeRankingModal = closeRankingModal;
window.closeTeamForm = closeTeamForm;
window.initTeamManagerEvents = initTeamManagerEvents;
window.initTeamManagerSystem = initTeamManagerSystem;
window.teamManagerState = teamManagerState;
window.getCharactersForTeamType = getCharactersForTeamType;
window.getStatusPriority = getStatusPriority;

console.log('team-manager.js loaded');
