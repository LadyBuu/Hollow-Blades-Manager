/**
 * tournaments.js - Tournament Management
 * Handles tournament CRUD operations, matches, eliminations, and bracket rendering
 */

// Tournament state
var currentTournamentId = null;

/**
 * Render the tournaments view with tabs
 */
function renderTournamentsView(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>Tournament Manager</h2>
            <button id="add-tournament-btn" class="primary">+ Create Tournament</button>
        </div>

        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-btn active" data-tab="teams">Teams</button>
                <button class="tab-btn" data-tab="tournaments">Tournaments</button>
                <button class="tab-btn" data-tab="weekly">Weekly View</button>
            </div>
            <div class="tab-content">
                <!-- TAB 1: Teams -->
                <div id="tab-teams" class="tab-panel active">
                    <div class="page-header">
                        <h2>Teams</h2>
                        <button id="add-team-btn" class="primary">+ Add Team</button>
                    </div>
                    <!-- Team Form -->
                    <div id="team-form" class="form-container hidden">
                        <h3 id="team-form-title">Add Team</h3>
                        <form id="team-form-inner">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Team Name *</label>
                                    <input type="text" id="team-name" required>
                                </div>
                                <div class="form-group">
                                    <label>Team Type *</label>
                                    <select id="team-type" required>
                                        <option value="">Select type...</option>
                                        <option value="academic">Academic (weeks)</option>
                                        <option value="professional">Professional (years)</option>
                                        <option value="internship">Internship (one-time)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label id="team-start-label">Start Week</label>
                                    <input type="number" id="team-start" placeholder="Week (e.g., 1)">
                                </div>
                                <div class="form-group">
                                    <label id="team-end-label">End Week (optional)</label>
                                    <input type="number" id="team-end" placeholder="Week (e.g., 52)">
                                </div>
                                <div class="form-group">
                                    <label>Current Ranking</label>
                                    <input type="number" id="team-ranking" placeholder="Rank (e.g., 1, 2, 3...)" min="1">
                                    <span style="font-size:0.7rem;color:var(--text-dim);">For academic teams: ranking applies to the current 2-week block</span>
                                </div>
                                <div class="form-group">
                                    <label>Status</label>
                                    <select id="team-status">
                                        <option value="active">Active</option>
                                        <option value="deprecated">Deprecated (history kept)</option>
                                        <option value="deleted">Deleted (permanent)</option>
                                    </select>
                                </div>
                                <div class="form-group full-width">
                                    <label>Name History</label>
                                    <div id="name-history-container">
                                        <div class="name-history-entry">
                                            <input type="text" class="name-history-name" placeholder="Team Name">
                                            <input type="text" class="name-history-start" placeholder="Start Week/Year">
                                            <input type="text" class="name-history-end" placeholder="End Week/Year">
                                            <button type="button" class="small danger remove-name">✕</button>
                                        </div>
                                    </div>
                                    <button type="button" id="add-name-history-btn" class="small" style="margin-top:8px;">+ Add Name Period</button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="cancel-team-btn" class="secondary">Cancel</button>
                                <button type="submit" id="save-team-btn" class="primary">Save Team</button>
                            </div>
                        </form>
                    </div>

                    <!-- Team List -->
                    <div id="team-list">
                        <div class="filter-section">
                            <label for="team-filter-type">Team Type:</label>
                            <select id="team-filter-type" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;width:auto;">
                                <option value="all">All Types</option>
                                <option value="academic">📚 Academic</option>
                                <option value="professional">💼 Professional</option>
                                <option value="internship">📋 Internship</option>
                            </select>
                            <label for="team-filter-week" style="margin-left:12px;">Filter by Week:</label>
                            <input type="number" id="team-filter-week" value="1" min="1" max="52" style="width:80px;">
                            <button id="apply-filter-btn" class="small primary">Apply</button>
                            <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Shows academic teams active during this 2-week block</span>
                        </div>
                        <div class="list-header team-header">
                            <span>Team Name</span>
                            <span>Type</span>
                            <span>Period</span>
                            <span>Rank</span>
                            <span>Members</span>
                            <span>Actions</span>
                        </div>
                        <div id="teams-container"></div>
                    </div>
                </div>

                <!-- TAB 2: Tournaments -->
                <div id="tab-tournaments" class="tab-panel">
                    <!-- Tournament Form -->
                    <div id="tournament-form" class="form-container hidden">
                        <h3 id="tournament-form-title">Create Tournament</h3>
                        <form id="tournament-form-inner">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Tournament Name *</label>
                                    <input type="text" id="tournament-name" required>
                                </div>
                                <div class="form-group">
                                    <label>Tournament Mode *</label>
                                    <select id="tournament-mode" required>
                                        <option value="team">Team Tournament</option>
                                        <option value="single">Single Player Tournament</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Academic Year</label>
                                    <input type="text" id="tournament-year" placeholder="e.g., 2025-2026">
                                </div>
                                <div class="form-group">
                                    <label>Start Week</label>
                                    <input type="number" id="tournament-start-week" min="1" max="52">
                                </div>
                                <div class="form-group">
                                    <label>End Week</label>
                                    <input type="number" id="tournament-end-week" min="1" max="52">
                                </div>
                                <div class="form-group">
                                    <label>Eliminations per Round</label>
                                    <input type="number" id="tournament-eliminations" value="4" min="1">
                                </div>
                                <div class="form-group full-width">
                                    <label>Description</label>
                                    <textarea id="tournament-description" rows="3" placeholder="Tournament details..."></textarea>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="cancel-tournament-btn" class="secondary">Cancel</button>
                                <button type="submit" id="save-tournament-btn" class="primary">Save Tournament</button>
                            </div>
                        </form>
                    </div>

                    <!-- Tournament List -->
                    <div id="tournament-list">
                        <div class="list-header tourn-header">
                            <span>Tournament</span>
                            <span>Mode</span>
                            <span>Weeks</span>
                            <span>Participants</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>
                        <div id="tournaments-container"></div>
                    </div>
                </div>

                <!-- TAB 3: Weekly View -->
                <div id="tab-weekly" class="tab-panel">
                    <div id="weekly-view">
                        <div class="weekly-nav">
                            <button id="prev-weeks-btn" class="small">← Previous</button>
                            <span id="weekly-range-display" style="font-size:1.1rem;font-weight:600;min-width:200px;text-align:center;">Weeks 1-16</span>
                            <button id="next-weeks-btn" class="small">Next →</button>
                        </div>
                        <div class="weekly-container">
                            <div class="weekly-scroll-wrapper">
                                <table class="weekly-table">
                                    <thead>
                                        <tr>
                                            <th class="team-header">Team</th>
                                            <th class="week-header" data-week="1">Wk 1-2</th>
                                            <th class="week-header" data-week="3">Wk 3-4</th>
                                            <th class="week-header" data-week="5">Wk 5-6</th>
                                            <th class="week-header" data-week="7">Wk 7-8</th>
                                            <th class="week-header" data-week="9">Wk 9-10</th>
                                            <th class="week-header" data-week="11">Wk 11-12</th>
                                            <th class="week-header" data-week="13">Wk 13-14</th>
                                            <th class="week-header" data-week="15">Wk 15-16</th>
                                            <th class="week-header" data-week="17">Wk 17-18</th>
                                            <th class="week-header" data-week="19">Wk 19-20</th>
                                            <th class="week-header" data-week="21">Wk 21-22</th>
                                            <th class="week-header" data-week="23">Wk 23-24</th>
                                            <th class="week-header" data-week="25">Wk 25-26</th>
                                            <th class="week-header" data-week="27">Wk 27-28</th>
                                            <th class="week-header" data-week="29">Wk 29-30</th>
                                            <th class="week-header" data-week="31">Wk 31-32</th>
                                            <th class="week-header" data-week="33">Wk 33-34</th>
                                            <th class="week-header" data-week="35">Wk 35-36</th>
                                            <th class="week-header" data-week="37">Wk 37-38</th>
                                            <th class="week-header" data-week="39">Wk 39-40</th>
                                            <th class="week-header" data-week="41">Wk 41-42</th>
                                            <th class="week-header" data-week="43">Wk 43-44</th>
                                            <th class="week-header" data-week="45">Wk 45-46</th>
                                            <th class="week-header" data-week="47">Wk 47-48</th>
                                            <th class="week-header" data-week="49">Wk 49-50</th>
                                            <th class="week-header" data-week="51">Wk 51-52</th>
                                        </tr>
                                    </thead>
                                    <tbody id="weekly-teams-body"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="weekly-legend">
                            <span class="legend-item">
                                <span class="legend-color active-member"></span> Active Member
                            </span>
                            <span class="legend-item">
                                <span class="legend-color inactive-member"></span> Inactive/Left
                            </span>
                            <span class="legend-item">
                                <span class="legend-color eliminated-member"></span> Eliminated
                            </span>
                            <span class="legend-item">
                                <span class="legend-color team-inactive"></span> Team Not Active
                            </span>
                        </div>
                        <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                            <div class="dashboard-section">
                                <h3>Unassigned Characters</h3>
                                <div id="unassigned-characters"></div>
                            </div>
                            <div class="dashboard-section">
                                <h3>Eliminated This Block</h3>
                                <div id="eliminated-characters"></div>
                            </div>
                        </div>
                        <div class="dashboard-section" style="margin-top:20px;">
                            <h3>Team Rankings - <span id="ranking-week-label">Weeks 1-2</span></h3>
                            <div id="team-rankings"></div>
                        </div>
                    </div>
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
                    <button class="close-modal" id="close-edit-member">&times;</button>
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
                    <button class="close-modal" id="close-ranking-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="ranking-form">
                        <input type="text" id="ranking-week" placeholder="Week Block (1, 3, 5...) or Year" min="1">
                        <span style="font-size:0.7rem;color:var(--text-dim);">For academic: enter the starting week (1=weeks 1-2, 3=weeks 3-4, etc.)</span>
                        <input type="number" id="ranking-rank" placeholder="Rank" min="1">
                        <button id="add-ranking-btn" class="primary small">Add Ranking</button>
                    </div>
                    <div id="ranking-list">
                        <p class="empty-state">No ranking history</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tournament Detail Modal -->
        <div id="tournament-detail-modal" class="modal hidden">
            <div class="modal-content wide">
                <div class="modal-header">
                    <h3 id="detail-tournament-name">Tournament Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="tournament-info"></div>
                    
                    <div id="participants-section">
                        <h4>Participants</h4>
                        <div class="participants-controls">
                            <div class="participants-form">
                                <select id="participant-select">
                                    <option value="">Select participant...</option>
                                </select>
                                <button id="add-participant-btn" class="primary small">Add</button>
                            </div>
                        </div>
                        <div id="participants-list">
                            <p class="empty-state">No participants added</p>
                        </div>
                    </div>

                    <div class="team-selection">
                        <h4>Add Teams</h4>
                        <select id="tournament-team-select">
                            <option value="">Select academic team...</option>
                        </select>
                        <button id="add-team-to-tournament" class="primary small">Add Team</button>
                    </div>
                    <div id="tournament-teams-list"></div>

                    <div id="matches-section">
                        <h4>Matches</h4>
                        <div class="matches-controls">
                            <div class="match-form">
                                <label>Round:</label>
                                <input type="number" id="match-round" placeholder="Round" min="1">
                                <label>Participants:</label>
                                <select id="match-participant1">
                                    <option value="">Select...</option>
                                </select>
                                <span>vs</span>
                                <select id="match-participant2">
                                    <option value="">Select...</option>
                                </select>
                                <button id="add-match-btn" class="primary small">Add Match</button>
                            </div>
                        </div>
                        <div id="matches-list">
                            <p class="empty-state">No matches created</p>
                        </div>
                    </div>

                    <div id="elimination-section">
                        <h4>Elimination Management</h4>
                        <div class="elimination-controls">
                            <div class="elimination-form">
                                <label>Week Block:</label>
                                <input type="number" id="elim-week" placeholder="Week (1, 3, 5...)" min="1" max="52">
                                <label>Eliminated:</label>
                                <select id="elim-characters" multiple style="min-height:100px;">
                                    <option value="">Select participants to eliminate...</option>
                                </select>
                                <button id="add-elimination-btn" class="primary small">Add Elimination</button>
                                <button id="remove-elimination-btn" class="danger small">Remove Selected</button>
                            </div>
                        </div>
                        <div id="elimination-list">
                            <p class="empty-state">No eliminations recorded</p>
                        </div>
                    </div>

                    <div id="tournament-bracket">
                        <h4>Tournament Bracket</h4>
                        <div id="bracket-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize tabs
    initTournamentTabs();
    
    // Render content
    if (typeof renderTeams === 'function') {
        renderTeams();
    }
    renderTournaments();
    if (typeof renderWeeklyView === 'function') {
        renderWeeklyView();
    }
    
    // Initialize events
    if (typeof initTeamEvents === 'function') {
        initTeamEvents();
    }
    initTournamentEvents();
    if (typeof initWeeklyEvents === 'function') {
        initWeeklyEvents();
    }
}

/**
 * Initialize tournament tabs
 */
function initTournamentTabs() {
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = {
        teams: document.getElementById('tab-teams'),
        tournaments: document.getElementById('tab-tournaments'),
        weekly: document.getElementById('tab-weekly')
    };

    // Hide all panels first
    for (var key in panels) {
        if (panels[key]) {
            panels[key].style.display = 'none';
            panels[key].classList.remove('active');
        }
    }

    // Show the active tab's panel
    var activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        var activeTabName = activeTab.dataset.tab;
        if (panels[activeTabName]) {
            panels[activeTabName].style.display = 'block';
            panels[activeTabName].classList.add('active');
        }
    } else {
        // Default to teams
        if (panels.teams) {
            panels.teams.style.display = 'block';
            panels.teams.classList.add('active');
        }
    }

    // Add click handlers
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update tab buttons
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            
            var tabName = this.dataset.tab;
            
            // Hide all panels
            for (var key in panels) {
                if (panels[key]) {
                    panels[key].style.display = 'none';
                    panels[key].classList.remove('active');
                }
            }
            
            // Show the selected panel
            if (panels[tabName]) {
                panels[tabName].style.display = 'block';
                panels[tabName].classList.add('active');
            }
            
            // Refresh content when switching tabs
            if (tabName === 'teams' && typeof renderTeams === 'function') {
                renderTeams();
            } else if (tabName === 'tournaments') {
                renderTournaments();
            } else if (tabName === 'weekly' && typeof renderWeeklyView === 'function') {
                renderWeeklyView();
            }
        });
    });
}

/**
 * Render tournament list
 */
function renderTournaments() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    
    if (data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }
    
    var html = '';
    data.tournaments.forEach(function(tourn) {
        var participantCount = tourn.mode === 'single' ? 
            (tourn.participants ? tourn.participants.length : 0) : 
            (tourn.teams ? tourn.teams.length : 0);
        html += '<div class="list-item tourn-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong></span>' +
            '<span>' + (tourn.mode || 'team') + '</span>' +
            '<span>Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</span>' +
            '<span>' + participantCount + '</span>' +
            '<span>' + (tourn.status || 'draft') + '</span>' +
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
    var form = document.getElementById('tournament-form');
    var title = document.getElementById('tournament-form-title');
    var formElement = document.getElementById('tournament-form-inner');
    form.classList.remove('hidden');
    
    if (editId) {
        title.textContent = 'Edit Tournament';
        var tourn = data.tournaments.find(function(t) { return t.id === editId; });
        if (tourn) {
            document.getElementById('tournament-name').value = tourn.name || '';
            document.getElementById('tournament-mode').value = tourn.mode || 'team';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '';
            document.getElementById('tournament-eliminations').value = tourn.eliminationsPerRound || 4;
            document.getElementById('tournament-description').value = tourn.description || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Tournament';
        formElement.reset();
        document.getElementById('tournament-mode').value = 'team';
        document.getElementById('tournament-eliminations').value = 4;
        delete formElement.dataset.editId;
    }
    document.getElementById('tournament-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide tournament form
 */
function hideTournamentForm() {
    document.getElementById('tournament-form').classList.add('hidden');
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
        mode: document.getElementById('tournament-mode').value,
        academicYear: document.getElementById('tournament-year').value.trim(),
        startWeek: document.getElementById('tournament-start-week').value || '',
        endWeek: document.getElementById('tournament-end-week').value || '',
        eliminationsPerRound: parseInt(document.getElementById('tournament-eliminations').value) || 4,
        description: document.getElementById('tournament-description').value.trim(),
        status: 'draft'
    };
    
    if (!tournData.name) { alert('Tournament name is required.'); return; }
    
    if (editId) {
        var index = data.tournaments.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            data.tournaments[index] = Object.assign({}, data.tournaments[index], tournData);
            if (typeof logActivity === 'function') {
                logActivity('Updated tournament: ' + tournData.name);
            }
        }
    } else {
        var newTourn = { 
            id: generateId('tourn'), 
            name: tournData.name, 
            mode: tournData.mode,
            academicYear: tournData.academicYear, 
            startWeek: tournData.startWeek, 
            endWeek: tournData.endWeek,
            eliminationsPerRound: tournData.eliminationsPerRound, 
            description: tournData.description,
            status: tournData.status, 
            teams: [], 
            participants: [], 
            matches: [], 
            eliminations: [], 
            winners: [], 
            createdAt: new Date().toISOString() 
        };
        data.tournaments.push(newTourn);
        if (typeof logActivity === 'function') {
            logActivity('Created tournament: ' + tournData.name);
        }
    }
    
    saveData().catch(function(err) { 
        console.error('Failed to save:', err); 
        alert('Failed to save tournament. Please check console for details.'); 
    });
    renderTournaments();
    hideTournamentForm();
}

/**
 * Delete tournament
 */
function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;
    data.tournaments = data.tournaments.filter(function(t) { return t.id !== id; });
    if (typeof logActivity === 'function') {
        logActivity('Deleted tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTournaments();
    closeTournamentDetail();
}

/**
 * View tournament details
 */
function viewTournament(id) {
    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;
    
    currentTournamentId = id;
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    var info = document.getElementById('tournament-info');
    info.innerHTML = 
        '<p><strong>Mode:</strong> ' + (tourn.mode || 'team') + '</p>' +
        '<p><strong>Academic Year:</strong> ' + (tourn.academicYear || 'N/A') + '</p>' +
        '<p><strong>Weeks:</strong> Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</p>' +
        '<p><strong>Eliminations per Round:</strong> ' + (tourn.eliminationsPerRound || 4) + '</p>' +
        '<p><strong>Status:</strong> ' + (tourn.status || 'draft') + '</p>' +
        '<p><strong>Description:</strong> ' + (tourn.description || 'No description') + '</p>';

    populateParticipantSelects(tourn);
    populateEliminationSelect(tourn);
    populateTeamSelector(tourn);
    
    renderParticipants(tourn);
    renderTournamentTeams(tourn);
    renderMatches(tourn);
    renderEliminations(tourn);
    renderBracket(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

/**
 * Close tournament detail modal
 */
function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
    currentTournamentId = null;
}

/**
 * Render participants in tournament detail
 */
function renderParticipants(tourn) {
    var container = document.getElementById('participants-list');
    if (!tourn.participants || tourn.participants.length === 0) {
        container.innerHTML = '<p class="empty-state">No participants added</p>';
        return;
    }
    
    var html = '';
    tourn.participants.forEach(function(participant, index) {
        var name = getParticipantName(participant, tourn);
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { 
            return e.participantId === participant.id && e.participantType === participant.type; 
        });
        var elimMarker = isEliminated ? ' Eliminated' : '';
        html += '<div class="participant-entry">' +
            '<span>' + name + elimMarker + '</span>' +
            '<button class="small danger remove-participant" data-tourn="' + tourn.id + '" data-index="' + index + '">Remove</button>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-participant').forEach(function(btn) {
        btn.addEventListener('click', function() { removeParticipant(btn.dataset.tourn, parseInt(btn.dataset.index)); });
    });
}

/**
 * Add participant to tournament
 */
function addParticipant() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var value = document.getElementById('participant-select').value;
    if (!value) { alert('Please select a participant.'); return; }
    
    var parts = value.split('_');
    var type = parts[0];
    var id = parts[1];
    
    if (!tourn.participants) tourn.participants = [];
    
    if (tourn.participants.some(function(p) { return p.id === id && p.type === type; })) {
        alert('Participant already added.'); 
        return;
    }
    
    tourn.participants.push({ type: type, id: id });
    
    if (tourn.mode === 'team' && type === 'team') {
        if (!tourn.teams) tourn.teams = [];
        if (!tourn.teams.some(function(t) { return t.teamId === id; })) {
            tourn.teams.push({ teamId: id, seed: tourn.teams.length + 1 });
        }
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Added participant to tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove participant from tournament
 */
function removeParticipant(tournId, index) {
    if (!confirm('Remove this participant?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.participants) return;
    
    var removed = tourn.participants[index];
    tourn.participants.splice(index, 1);
    
    if (tourn.mode === 'team' && removed.type === 'team') {
        if (tourn.teams) {
            tourn.teams = tourn.teams.filter(function(t) { return t.teamId !== removed.id; });
        }
    }
    
    if (tourn.eliminations) {
        tourn.eliminations = tourn.eliminations.filter(function(e) {
            return !(e.participantId === removed.id && e.participantType === removed.type);
        });
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Removed participant from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Populate participant select dropdowns - FIXED to show team names
 */
function populateParticipantSelects(tourn) {
    var select1 = document.getElementById('match-participant1');
    var select2 = document.getElementById('match-participant2');
    var participantSelect = document.getElementById('participant-select');
    
    select1.innerHTML = '<option value="">Select...</option>';
    select2.innerHTML = '<option value="">Select...</option>';
    participantSelect.innerHTML = '<option value="">Select participant...</option>';
    
    if (tourn.mode === 'single') {
        var availableChars = data.characters.filter(function(char) {
            if (char.deceased) return false;
            // Only show non-civilian characters
            var status = getCurrentStatus(char).toLowerCase();
            if (status === 'civilian' || status === '') return false;
            if (tourn.participants && tourn.participants.some(function(p) { 
                return p.id === char.id && p.type === 'char'; 
            })) return false;
            return true;
        });
        availableChars.forEach(function(char) {
            var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
            addOptionToSelect(select1, 'char_' + char.id, name);
            addOptionToSelect(select2, 'char_' + char.id, name);
            addOptionToSelect(participantSelect, 'char_' + char.id, name);
        });
    } else {
        var teamsInTournament = [];
        
        // Get teams from tournament
        if (tourn.teams) {
            tourn.teams.forEach(function(teamEntry) {
                var team = data.teams.find(function(t) { return t.id === teamEntry.teamId; });
                if (team) {
                    teamsInTournament.push({
                        id: team.id,
                        name: team.name,
                        rank: team.currentRank
                    });
                }
            });
        }
        
        // Also check participants for teams
        if (tourn.participants) {
            tourn.participants.forEach(function(participant) {
                if (participant.type === 'team') {
                    var team = data.teams.find(function(t) { return t.id === participant.id; });
                    if (team && !teamsInTournament.some(function(t) { return t.id === team.id; })) {
                        teamsInTournament.push({
                            id: team.id,
                            name: team.name,
                            rank: team.currentRank
                        });
                    }
                }
            });
        }
        
        teamsInTournament.sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });
        
        teamsInTournament.forEach(function(team) {
            var label = team.name + (team.rank ? ' (#' + team.rank + ')' : '');
            addOptionToSelect(select1, 'team_' + team.id, label);
            addOptionToSelect(select2, 'team_' + team.id, label);
            addOptionToSelect(participantSelect, 'team_' + team.id, label);
        });
    }
}

/**
 * Populate elimination select dropdown
 */
function populateEliminationSelect(tourn) {
    var elimSelect = document.getElementById('elim-characters');
    elimSelect.innerHTML = '';
    
    if (tourn.mode === 'single') {
        var participants = tourn.participants || [];
        participants.forEach(function(participant) {
            if (participant.type === 'char') {
                var char = data.characters.find(function(c) { return c.id === participant.id; });
                if (char) {
                    var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                    // Check if already eliminated - don't show eliminated characters
                    var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                        return e.participantId === char.id && e.participantType === 'char';
                    });
                    if (!isEliminated) {
                        addOptionToSelect(elimSelect, 'char_' + char.id, name);
                    }
                }
            }
        });
    } else {
        var teams = tourn.teams || [];
        teams.forEach(function(teamEntry) {
            var team = data.teams.find(function(t) { return t.id === teamEntry.teamId; });
            if (team && team.members) {
                team.members.forEach(function(member) {
                    var char = data.characters.find(function(c) { return c.id === member.characterId; });
                    if (char) {
                        // Check if character is already eliminated
                        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                            return e.participantId === char.id && e.participantType === 'char';
                        });
                        if (!isEliminated) {
                            var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                            addOptionToSelect(elimSelect, 'char_' + char.id, team.name + ' - ' + name);
                        }
                    }
                });
            }
        });
    }
}

/**
 * Helper to add option to select
 */
function addOptionToSelect(select, value, text) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
}

/**
 * Populate team selector for tournament
 */
function populateTeamSelector(tourn) {
    var select = document.getElementById('tournament-team-select');
    if (!select) return;
    
    var currentWeek = parseInt(tourn.startWeek) || 1;
    var activeTeams = getActiveTeamsForWeek(currentWeek, tourn.id);
    
    select.innerHTML = '<option value="">Select academic team...</option>';
    activeTeams.forEach(function(team) {
        var alreadyAdded = tourn.teams && tourn.teams.some(function(t) { return t.teamId === team.id; });
        if (!alreadyAdded && team.status !== 'deleted') {
            addOptionToSelect(select, team.id, team.name + (team.currentRank ? ' (#' + team.currentRank + ')' : ''));
        }
    });
    
    if (select.options.length === 1) {
        select.innerHTML += '<option value="" disabled>No available teams</option>';
    }
}

/**
 * Render tournament teams
 */
function renderTournamentTeams(tourn) {
    var container = document.getElementById('tournament-teams-list');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams added to this tournament</p>';
        return;
    }

    var html = '';
    tourn.teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return t.id === entry.teamId; });
        // Check if any characters in this team are eliminated (not the whole team)
        var hasEliminatedMembers = false;
        if (team && team.members) {
            team.members.forEach(function(member) {
                var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                    return e.participantId === member.characterId && e.participantType === 'char';
                });
                if (isEliminated) hasEliminatedMembers = true;
            });
        }
        var elimClass = hasEliminatedMembers ? ' eliminated' : '';
        var elimMarker = hasEliminatedMembers ? ' (has eliminated members)' : '';
        
        html += '<div class="team-entry' + elimClass + '">' +
            '<span>' + (team ? team.name : 'Unknown team') + elimMarker + '</span>' +
            '<span>' + (entry.seed || 'Unseeded') + '</span>' +
            '<span class="team-actions">' +
                '<button class="small danger eliminate-team-members" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '">Eliminate Members</button>' +
                '<button class="small restore-team-members" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '" style="display:' + (hasEliminatedMembers ? 'inline-block' : 'none') + ';">Restore Members</button>' +
                '<button class="small danger remove-team-from-tournament" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '">Remove Team</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.eliminate-team-members').forEach(function(btn) {
        btn.addEventListener('click', function() { eliminateTeamMembers(btn.dataset.tourn, btn.dataset.team); });
    });
    container.querySelectorAll('.restore-team-members').forEach(function(btn) {
        btn.addEventListener('click', function() { restoreTeamMembers(btn.dataset.tourn, btn.dataset.team); });
    });
    container.querySelectorAll('.remove-team-from-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { removeTeamFromTournament(btn.dataset.tourn, btn.dataset.team); });
    });
}

/**
 * Add team to tournament
 */
function addTeamToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var teamId = document.getElementById('tournament-team-select').value;
    if (!teamId) { alert('Please select a team.'); return; }
    if (!tourn.teams) tourn.teams = [];
    if (tourn.teams.some(function(t) { return t.teamId === teamId; })) {
        alert('Team already added to this tournament.'); 
        return;
    }
    
    tourn.teams.push({ teamId: teamId, seed: tourn.teams.length + 1 });
    
    if (!tourn.participants) tourn.participants = [];
    if (!tourn.participants.some(function(p) { return p.id === teamId && p.type === 'team'; })) {
        tourn.participants.push({ type: 'team', id: teamId });
    }
    
    var team = data.teams.find(function(t) { return t.id === teamId; });
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
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    tourn.teams = tourn.teams.filter(function(t) { return t.teamId !== teamId; });
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (typeof logActivity === 'function') {
        logActivity('Removed team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Eliminate team members (not the whole team, just the characters)
 */
function eliminateTeamMembers(tournId, teamId) {
    if (!confirm('Eliminate all members of this team from the tournament?')) return;
    
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    if (!tourn.eliminations) tourn.eliminations = [];
    
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members) return;
    
    var block = getWeekBlock(tourn.startWeek || 1);
    var week = block.start;
    var added = 0;
    
    team.members.forEach(function(member) {
        var char = data.characters.find(function(c) { return c.id === member.characterId; });
        if (!char) return;
        
        // Check if already eliminated
        var existing = tourn.eliminations.some(function(e) {
            return e.participantId === char.id && e.participantType === 'char';
        });
        if (!existing) {
            tourn.eliminations.push({
                participantId: char.id,
                participantType: 'char',
                week: week,
                teamId: teamId
            });
            added++;
        }
    });
    
    if (added === 0) {
        alert('All team members are already eliminated.');
        return;
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Eliminated ' + added + ' members of team ' + team.name + ' from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Restore team members
 */
function restoreTeamMembers(tournId, teamId) {
    if (!confirm('Restore all members of this team in the tournament?')) return;
    
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members) return;
    
    if (tourn.eliminations) {
        var removed = 0;
        team.members.forEach(function(member) {
            var char = data.characters.find(function(c) { return c.id === member.characterId; });
            if (!char) return;
            
            var before = tourn.eliminations.length;
            tourn.eliminations = tourn.eliminations.filter(function(e) {
                return !(e.participantId === char.id && e.participantType === 'char');
            });
            if (tourn.eliminations.length < before) removed++;
        });
        
        if (removed === 0) {
            alert('No team members were eliminated.');
            return;
        }
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Restored ' + removed + ' members of team ' + team.name + ' in tournament: ' + tourn.name);
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
        container.innerHTML = '<p class="empty-state">No matches created</p>';
        return;
    }
    
    var html = '';
    tourn.matches.forEach(function(match, index) {
        var p1Name = getParticipantName(match.participant1, tourn);
        var p2Name = getParticipantName(match.participant2, tourn);
        var winnerName = match.winner ? getParticipantName(match.winner, tourn) : 'TBD';
        var winnerDisplay = match.winner ? 'Winner: ' + winnerName : 'TBD';
        
        html += '<div class="match-entry">' +
            '<span><strong>Round ' + match.round + ':</strong> ' + p1Name + ' vs ' + p2Name + ' → ' + winnerDisplay + '</span>' +
            '<div class="match-actions">' +
                '<button class="small set-winner" data-tourn="' + tourn.id + '" data-index="' + index + '" data-participant="1">' + p1Name + '</button>' +
                '<button class="small set-winner" data-tourn="' + tourn.id + '" data-index="' + index + '" data-participant="2">' + p2Name + '</button>' +
                '<button class="small danger remove-match" data-tourn="' + tourn.id + '" data-index="' + index + '">Remove</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            setMatchWinner(btn.dataset.tourn, parseInt(btn.dataset.index), parseInt(btn.dataset.participant)); 
        });
    });
    container.querySelectorAll('.remove-match').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            removeMatch(btn.dataset.tourn, parseInt(btn.dataset.index)); 
        });
    });
}

/**
 * Add match
 */
function addMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var round = document.getElementById('match-round').value;
    var p1Value = document.getElementById('match-participant1').value;
    var p2Value = document.getElementById('match-participant2').value;
    
    if (!round) { alert('Please enter a round number.'); return; }
    if (!p1Value || !p2Value) { alert('Please select both participants.'); return; }
    if (p1Value === p2Value) { alert('Participants must be different.'); return; }
    
    var p1Parts = p1Value.split('_');
    var p2Parts = p2Value.split('_');
    
    if (!tourn.matches) tourn.matches = [];
    
    tourn.matches.push({
        round: round,
        participant1: { type: p1Parts[0], id: p1Parts[1] },
        participant2: { type: p2Parts[0], id: p2Parts[1] },
        winner: null
    });
    
    if (typeof logActivity === 'function') {
        logActivity('Added match to tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove match
 */
function removeMatch(tournId, index) {
    if (!confirm('Remove this match?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.matches) return;
    tourn.matches.splice(index, 1);
    if (typeof logActivity === 'function') {
        logActivity('Removed match from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Set match winner - eliminates the loser (but does NOT mark as deceased)
 */
function setMatchWinner(tournId, matchIndex, participantNum) {
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    var match = tourn.matches[matchIndex];
    var winner = participantNum === 1 ? match.participant1 : match.participant2;
    match.winner = winner;
    
    // Eliminate the loser (but NOT mark as deceased)
    var loser = participantNum === 1 ? match.participant2 : match.participant1;
    if (!tourn.eliminations) tourn.eliminations = [];
    
    var weekNum = parseInt(tourn.startWeek) || 1;
    var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
    
    if (!tourn.eliminations.some(function(e) { 
        return e.participantId === loser.id && e.participantType === loser.type; 
    })) {
        tourn.eliminations.push({
            participantId: loser.id,
            participantType: loser.type,
            week: String(blockStart),
            matchRound: match.round
        });
        
        // Log the elimination WITHOUT marking as deceased
        var loserName = getParticipantName(loser, tourn);
        if (typeof logActivity === 'function') {
            logActivity('Eliminated ' + loserName + ' from tournament: ' + tourn.name + ' (Round ' + match.round + ')');
        }
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
        container.innerHTML = '<p class="empty-state">No eliminations recorded</p>';
        return;
    }
    
    var html = '';
    var sorted = tourn.eliminations.slice().sort(function(a, b) { 
        return parseInt(a.week) - parseInt(b.week); 
    });
    sorted.forEach(function(entry, index) {
        var name = getParticipantName({ type: entry.participantType, id: entry.participantId }, tourn);
        var block = getWeekBlock(entry.week);
        var weekDisplay = block ? block.label : entry.week;
        var teamName = '';
        if (entry.teamId) {
            var team = data.teams.find(function(t) { return t.id === entry.teamId; });
            if (team) teamName = ' (' + team.name + ')';
        }
        html += '<div class="elimination-entry">' +
            '<span><strong>Wk ' + weekDisplay + ':</strong> ' + name + teamName + (entry.matchRound ? ' (Round ' + entry.matchRound + ')' : '') + '</span>' +
            '<button class="small danger remove-elimination" data-tourn="' + tourn.id + '" data-index="' + index + '">Remove</button>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-elimination').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            removeElimination(btn.dataset.tourn, parseInt(btn.dataset.index)); 
        });
    });
}

/**
 * Add elimination - DOES NOT mark as deceased
 */
function addElimination() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;

    var week = document.getElementById('elim-week').value;
    var selectedOptions = document.getElementById('elim-characters').selectedOptions;
    
    if (!week) { alert('Please enter a week number.'); return; }
    if (selectedOptions.length === 0) { 
        alert('Please select at least one participant to eliminate.'); 
        return; 
    }
    if (!tourn.eliminations) tourn.eliminations = [];

    var weekNum = parseInt(week);
    if (!isNaN(weekNum)) {
        var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
        week = String(blockStart);
    }

    var added = 0;
    for (var i = 0; i < selectedOptions.length; i++) {
        var value = selectedOptions[i].value;
        if (!value) continue;
        var parts = value.split('_');
        var type = parts[0];
        var id = parts[1];
        
        var existing = tourn.eliminations.some(function(e) { 
            return e.participantId === id && e.participantType === type && parseInt(e.week) === parseInt(week); 
        });
        if (!existing) {
            tourn.eliminations.push({
                participantId: id,
                participantType: type,
                week: week
            });
            added++;
        }
    }

    if (added === 0) { 
        alert('All selected participants are already eliminated this week.'); 
        return; 
    }
    
    if (typeof logActivity === 'function') {
        logActivity('Added ' + added + ' elimination(s) for tournament: ' + tourn.name + ' (Week ' + week + ')');
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Remove elimination - DOES NOT mark as deceased (never did)
 */
function removeElimination(tournId, index) {
    if (!confirm('Remove this elimination?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.eliminations || !tourn.eliminations[index]) return;
    
    tourn.eliminations.splice(index, 1);
    
    if (typeof logActivity === 'function') {
        logActivity('Removed elimination from tournament: ' + tourn.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

/**
 * Render bracket
 */
function renderBracket(tourn) {
    var container = document.getElementById('bracket-container');
    
    if (tourn.matches && tourn.matches.length > 0) {
        var html = '';
        var rounds = {};
        tourn.matches.forEach(function(match) {
            if (!rounds[match.round]) rounds[match.round] = [];
            rounds[match.round].push(match);
        });
        
        var roundKeys = Object.keys(rounds).sort(function(a, b) { return parseInt(a) - parseInt(b); });
        roundKeys.forEach(function(round) {
            html += '<div class="bracket-round">' +
                '<div class="round-label">Round ' + round + '</div>';
            rounds[round].forEach(function(match) {
                var p1Name = getParticipantName(match.participant1, tourn);
                var p2Name = getParticipantName(match.participant2, tourn);
                var winnerName = match.winner ? getParticipantName(match.winner, tourn) : 'TBD';
                var p1Class = match.winner && match.winner.id === match.participant1.id ? 'team winner' : 'team';
                var p2Class = match.winner && match.winner.id === match.participant2.id ? 'team winner' : 'team';
                
                html += '<div class="bracket-match">' +
                    '<div class="' + p1Class + '">' + p1Name + (p1Class === 'team winner' ? ' Winner' : '') + '</div>' +
                    '<div class="' + p2Class + '">' + p2Name + (p2Class === 'team winner' ? ' Winner' : '') + '</div>' +
                    '<div style="font-size:0.7rem;color:var(--text-dim);border-top:1px solid var(--border-soft);margin-top:4px;padding-top:4px;">Winner: ' + winnerName + '</div>' +
                '</div>';
            });
            html += '</div>';
        });
        container.innerHTML = html;
        return;
    }
    
    if ((!tourn.participants || tourn.participants.length === 0) && (!tourn.teams || tourn.teams.length === 0)) {
        container.innerHTML = '<p class="empty-state">Add participants to generate bracket</p>';
        return;
    }

    var participants = tourn.participants || [];
    if (tourn.mode === 'team') {
        var teams = tourn.teams || [];
        participants = teams.map(function(t) { return { type: 'team', id: t.teamId }; });
    }
    
    var rounds = [];
    var currentParticipants = participants.slice();
    
    if (currentParticipants.length === 1) {
        var name = getParticipantName(currentParticipants[0], tourn);
        rounds.push([['Winner: ' + name, 'BYE']]);
    } else {
        while (currentParticipants.length > 1) {
            var roundTeams = [];
            for (var i = 0; i < currentParticipants.length; i += 2) {
                if (i + 1 < currentParticipants.length) {
                    roundTeams.push([currentParticipants[i], currentParticipants[i + 1]]);
                } else {
                    roundTeams.push([currentParticipants[i], 'BYE']);
                }
            }
            rounds.push(roundTeams);
            currentParticipants = roundTeams.map(function(match) {
                if (match[0] === 'BYE') return match[1];
                if (match[1] === 'BYE') return match[0];
                var p1Eliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                    return e.participantId === match[0].id && e.participantType === match[0].type;
                });
                var p2Eliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                    return e.participantId === match[1].id && e.participantType === match[1].type;
                });
                if (p1Eliminated && !p2Eliminated) return match[1];
                if (p2Eliminated && !p1Eliminated) return match[0];
                return Math.random() < 0.5 ? match[0] : match[1];
            });
        }
    }
    
    var html = '';
    rounds.forEach(function(round, index) {
        html += '<div class="bracket-round">' +
            '<div class="round-label">Round ' + (index + 1) + '</div>';
        round.forEach(function(match) {
            var p1Name = match[0] !== 'BYE' ? getParticipantName(match[0], tourn) : 'BYE';
            var p2Name = match[1] !== 'BYE' ? getParticipantName(match[1], tourn) : 'BYE';
            
            var p1Eliminated = match[0] !== 'BYE' && tourn.eliminations && tourn.eliminations.some(function(e) {
                return e.participantId === match[0].id && e.participantType === match[0].type;
            });
            var p2Eliminated = match[1] !== 'BYE' && tourn.eliminations && tourn.eliminations.some(function(e) {
                return e.participantId === match[1].id && e.participantType === match[1].type;
            });
            
            var p1Class = p1Eliminated ? 'team eliminated' : 'team';
            var p2Class = p2Eliminated ? 'team eliminated' : 'team';
            
            html += '<div class="bracket-match">' +
                '<div class="' + p1Class + '">' + p1Name + (p1Eliminated ? ' Eliminated' : '') + '</div>' +
                '<div class="' + p2Class + '">' + p2Name + (p2Eliminated ? ' Eliminated' : '') + '</div>' +
            '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

/**
 * Initialize tournament events
 */
function initTournamentEvents() {
    var addBtn = document.getElementById('add-tournament-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showTournamentForm(); });
    }
    
    var cancelBtn = document.getElementById('cancel-tournament-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideTournamentForm);
    }
    
    var form = document.getElementById('tournament-form-inner');
    if (form) {
        form.addEventListener('submit', saveTournament);
    }

    var closeBtn = document.querySelector('#tournament-detail-modal .close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTournamentDetail);
    }
    
    var modalBg = document.getElementById('tournament-detail-modal');
    if (modalBg) {
        modalBg.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
    }
    
    var addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', addParticipant);
    }
    
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
    }
    
    var addMatchBtn = document.getElementById('add-match-btn');
    if (addMatchBtn) {
        addMatchBtn.addEventListener('click', addMatch);
    }
    
    var addElimBtn = document.getElementById('add-elimination-btn');
    if (addElimBtn) {
        addElimBtn.addEventListener('click', addElimination);
    }
    
    var removeElimBtn = document.getElementById('remove-elimination-btn');
    if (removeElimBtn) {
        removeElimBtn.addEventListener('click', function() {
            var select = document.getElementById('elim-characters');
            var selected = [];
            for (var i = 0; i < select.options.length; i++) {
                if (select.options[i].selected) selected.push(select.options[i].value);
            }
            if (selected.length === 0) { 
                alert('Please select characters to remove.'); 
                return; 
            }
            if (!confirm('Remove selected eliminations?')) return;
            
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
            if (!tourn || !tourn.eliminations) return;
            
            var toRemove = [];
            tourn.eliminations.forEach(function(e, index) {
                if (selected.indexOf(e.participantId) !== -1) toRemove.push(index);
            });
            toRemove.sort(function(a, b) { return b - a; });
            toRemove.forEach(function(idx) {
                tourn.eliminations.splice(idx, 1);
            });
            
            saveData().catch(function(err) { console.error('Failed to save:', err); });
            renderEliminations(tourn);
            renderBracket(tourn);
            if (typeof logActivity === 'function') {
                logActivity('Removed eliminations from tournament: ' + tourn.name);
            }
        });
    }
}

// Make functions globally available
window.renderTournamentsView = renderTournamentsView;
window.renderTournaments = renderTournaments;
window.showTournamentForm = showTournamentForm;
window.hideTournamentForm = hideTournamentForm;
window.saveTournament = saveTournament;
window.deleteTournament = deleteTournament;
window.viewTournament = viewTournament;
window.closeTournamentDetail = closeTournamentDetail;
window.renderParticipants = renderParticipants;
window.addParticipant = addParticipant;
window.removeParticipant = removeParticipant;
window.populateParticipantSelects = populateParticipantSelects;
window.populateEliminationSelect = populateEliminationSelect;
window.addOptionToSelect = addOptionToSelect;
window.populateTeamSelector = populateTeamSelector;
window.renderTournamentTeams = renderTournamentTeams;
window.addTeamToTournament = addTeamToTournament;
window.removeTeamFromTournament = removeTeamFromTournament;
window.eliminateTeamMembers = eliminateTeamMembers;
window.restoreTeamMembers = restoreTeamMembers;
window.renderMatches = renderMatches;
window.addMatch = addMatch;
window.removeMatch = removeMatch;
window.setMatchWinner = setMatchWinner;
window.renderEliminations = renderEliminations;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.renderBracket = renderBracket;
window.initTournamentEvents = initTournamentEvents;
window.initTournamentTabs = initTournamentTabs;
