/**
 * missions.js - Mission Manager
 * Handles mission creation, assignment, tracking, and completion
 */

// Mission state
var missionState = {
    currentFilter: 'all', // all, active, completed, cancelled
    currentMissionId: null
};

/**
 * Initialize missions system
 */
function initMissionsSystem() {
    if (!data.missions) {
        data.missions = [];
    }
    // Migrate existing missions to have all fields
    data.missions.forEach(function(mission) {
        if (!mission.status) mission.status = 'active';
        if (!mission.createdAt) mission.createdAt = new Date().toISOString();
        if (!mission.completedAt) mission.completedAt = null;
        if (!mission.assignedTeamId) mission.assignedTeamId = null;
        if (!mission.priority) mission.priority = 'medium';
        if (!mission.tags) mission.tags = [];
        if (!mission.objectives) mission.objectives = [];
        if (!mission.progress) mission.progress = 0;
        if (!mission.log) mission.log = [];
    });
    saveData().catch(function(err) { console.error('Failed to save:', err); });
}

/**
 * Get all missions with optional filtering
 */
function getMissions(filter) {
    initMissionsSystem();
    var missions = data.missions.slice();
    
    if (filter === 'active') {
        missions = missions.filter(function(m) { return m.status === 'active'; });
    } else if (filter === 'completed') {
        missions = missions.filter(function(m) { return m.status === 'completed'; });
    } else if (filter === 'cancelled') {
        missions = missions.filter(function(m) { return m.status === 'cancelled'; });
    }
    
    // Sort by priority (high first), then by createdAt
    var priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    missions.sort(function(a, b) {
        var pa = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 2;
        var pb = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 2;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return missions;
}

/**
 * Get a single mission by ID
 */
function getMission(id) {
    initMissionsSystem();
    return data.missions.find(function(m) { return String(m.id) === String(id); });
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
 * Get priority label and color
 */
function getPriorityInfo(priority) {
    var map = {
        'critical': { label: '🔴 Critical', color: 'var(--danger)' },
        'high': { label: '🟠 High', color: 'var(--warning)' },
        'medium': { label: '🟡 Medium', color: 'var(--warning)' },
        'low': { label: '🟢 Low', color: 'var(--accent)' }
    };
    return map[priority] || { label: 'Medium', color: 'var(--text-dim)' };
}

/**
 * Get status label and color
 */
function getStatusInfo(status) {
    var map = {
        'active': { label: 'Active', color: 'var(--accent)' },
        'completed': { label: 'Completed', color: 'var(--info)' },
        'cancelled': { label: 'Cancelled', color: 'var(--danger)' }
    };
    return map[status] || { label: 'Active', color: 'var(--text-dim)' };
}

/**
 * Create a new mission
 */
function createMission(data) {
    initMissionsSystem();
    var mission = {
        id: generateId('miss'),
        title: data.title || 'Untitled Mission',
        description: data.description || '',
        location: data.location || '',
        objective: data.objective || '',
        duration: data.duration || '',
        difficulty: data.difficulty || 'medium',
        pay: data.pay || '',
        assignedTeamId: data.assignedTeamId || null,
        status: 'active',
        priority: data.priority || 'medium',
        tags: data.tags || [],
        objectives: data.objectives || [],
        progress: 0,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        completedAt: null,
        log: []
    };
    data.missions.push(mission);
    if (typeof logActivity === 'function') {
        logActivity('Created mission: ' + mission.title);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Update an existing mission
 */
function updateMission(id, updates) {
    initMissionsSystem();
    var mission = getMission(id);
    if (!mission) return null;
    
    // Track changes for log
    var changes = [];
    for (var key in updates) {
        if (updates[key] !== undefined && updates[key] !== null && String(mission[key]) !== String(updates[key])) {
            changes.push(key);
            mission[key] = updates[key];
        }
    }
    
    // If status changed to completed, set completedAt
    if (updates.status === 'completed' && mission.status === 'completed') {
        mission.completedAt = new Date().toISOString();
    }
    
    // Update progress if objectives changed
    if (updates.objectives) {
        var total = mission.objectives.length;
        var completed = mission.objectives.filter(function(o) { return o.done; }).length;
        mission.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    }
    
    // Add log entry
    if (changes.length > 0 && typeof logActivity === 'function') {
        logActivity('Updated mission: ' + mission.title + ' (' + changes.join(', ') + ')');
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Add a log entry to a mission
 */
function addMissionLog(missionId, message) {
    initMissionsSystem();
    var mission = getMission(missionId);
    if (!mission) return null;
    
    if (!mission.log) mission.log = [];
    mission.log.push({
        timestamp: new Date().toISOString(),
        message: message
    });
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Delete a mission
 */
function deleteMission(id) {
    initMissionsSystem();
    var mission = getMission(id);
    if (!mission) return false;
    
    data.missions = data.missions.filter(function(m) { return String(m.id) !== String(id); });
    if (typeof logActivity === 'function') {
        logActivity('Deleted mission: ' + mission.title);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return true;
}

/**
 * Toggle an objective's completion status
 */
function toggleObjective(missionId, objectiveIndex) {
    initMissionsSystem();
    var mission = getMission(missionId);
    if (!mission || !mission.objectives || !mission.objectives[objectiveIndex]) return null;
    
    mission.objectives[objectiveIndex].done = !mission.objectives[objectiveIndex].done;
    
    // Update progress
    var total = mission.objectives.length;
    var completed = mission.objectives.filter(function(o) { return o.done; }).length;
    mission.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // If all objectives done, mark mission as completed
    if (mission.progress === 100 && mission.status === 'active') {
        mission.status = 'completed';
        mission.completedAt = new Date().toISOString();
        if (typeof logActivity === 'function') {
            logActivity('Mission completed: ' + mission.title);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Add an objective to a mission
 */
function addObjective(missionId, text) {
    initMissionsSystem();
    var mission = getMission(missionId);
    if (!mission) return null;
    
    if (!mission.objectives) mission.objectives = [];
    mission.objectives.push({
        text: text,
        done: false
    });
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Remove an objective from a mission
 */
function removeObjective(missionId, objectiveIndex) {
    initMissionsSystem();
    var mission = getMission(missionId);
    if (!mission || !mission.objectives || !mission.objectives[objectiveIndex]) return null;
    
    mission.objectives.splice(objectiveIndex, 1);
    
    // Update progress
    var total = mission.objectives.length;
    var completed = mission.objectives.filter(function(o) { return o.done; }).length;
    mission.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return mission;
}

/**
 * Render the missions view
 */
function renderMissionsView(container) {
    initMissionsSystem();
    
    container.innerHTML = `
        <div class="page-header">
            <h2>🎯 Mission Manager</h2>
            <button id="add-mission-btn" class="primary">+ New Mission</button>
        </div>

        <div class="filter-section">
            <label for="mission-filter">Filter:</label>
            <select id="mission-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                <option value="all">All Missions</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Total: <span id="mission-count">0</span></span>
        </div>

        <div id="missions-list">
            <p class="empty-state">No missions created yet. Create your first mission!</p>
        </div>

        <!-- Mission Form Modal -->
        <div id="mission-form-modal" class="modal hidden">
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 id="mission-form-title">Create Mission</h3>
                    <button class="close-modal" id="close-mission-form">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="mission-form-inner">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Mission Title *</label>
                                <input type="text" id="mission-title" required placeholder="e.g., Operation Nightfall">
                            </div>
                            <div class="form-group full-width">
                                <label>Description</label>
                                <textarea id="mission-description" rows="2" placeholder="Brief description of the mission..."></textarea>
                            </div>
                            <div class="form-group">
                                <label>Location</label>
                                <input type="text" id="mission-location" placeholder="e.g., Berlin, Germany">
                            </div>
                            <div class="form-group">
                                <label>Expected Duration</label>
                                <input type="text" id="mission-duration" placeholder="e.g., 3 days, 2 weeks">
                            </div>
                            <div class="form-group">
                                <label>Difficulty</label>
                                <select id="mission-difficulty">
                                    <option value="easy">Easy</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority</label>
                                <select id="mission-priority">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Pay/Reward</label>
                                <input type="text" id="mission-pay" placeholder="e.g., 5000 credits">
                            </div>
                            <div class="form-group">
                                <label>Assign Team</label>
                                <select id="mission-team">
                                    <option value="">Unassigned</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>Objective</label>
                                <input type="text" id="mission-objective" placeholder="Primary objective...">
                                <button type="button" id="add-objective-btn" class="small primary" style="margin-top:4px;">+ Add Objective</button>
                                <div id="mission-objectives-list" style="margin-top:8px;"></div>
                            </div>
                            <div class="form-group full-width">
                                <label>Notes</label>
                                <textarea id="mission-notes" rows="2" placeholder="Additional notes..."></textarea>
                            </div>
                            <div class="form-group full-width">
                                <label>Tags (comma separated)</label>
                                <input type="text" id="mission-tags" placeholder="e.g., covert, rescue, extraction">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-mission-form" class="secondary">Cancel</button>
                            <button type="submit" id="save-mission-btn" class="primary">Save Mission</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Mission Detail Modal -->
        <div id="mission-detail-modal" class="modal hidden">
            <div class="modal-content" style="max-width:700px;">
                <div class="modal-header">
                    <h3 id="detail-mission-title">Mission Details</h3>
                    <button class="close-modal" id="close-mission-detail">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="mission-detail-content"></div>
                    <div class="form-actions" style="margin-top:16px;">
                        <button type="button" id="edit-mission-from-detail" class="primary">Edit</button>
                        <button type="button" id="delete-mission-from-detail" class="danger">Delete Mission</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    populateTeamSelectors();
    renderMissions();
    initMissionEvents();
}

/**
 * Populate team selectors in forms
 */
function populateTeamSelectors() {
    var select = document.getElementById('mission-team');
    if (!select) return;
    
    var teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    select.innerHTML = '<option value="">Unassigned</option>';
    teams.forEach(function(team) {
        var option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name + (team.type ? ' (' + team.type + ')' : '');
        select.appendChild(option);
    });
}

/**
 * Render the missions list
 */
function renderMissions() {
    var container = document.getElementById('missions-list');
    if (!container) return;
    
    var filter = document.getElementById('mission-filter')?.value || 'all';
    var missions = getMissions(filter);
    var count = document.getElementById('mission-count');
    if (count) count.textContent = missions.length;
    
    if (missions.length === 0) {
        var filterLabels = {
            'all': 'missions',
            'active': 'active missions',
            'completed': 'completed missions',
            'cancelled': 'cancelled missions'
        };
        container.innerHTML = '<p class="empty-state">No ' + (filterLabels[filter] || 'missions') + ' found.</p>';
        return;
    }
    
    var html = '';
    missions.forEach(function(mission) {
        var priorityInfo = getPriorityInfo(mission.priority);
        var statusInfo = getStatusInfo(mission.status);
        var teamName = getTeamName(mission.assignedTeamId);
        var progressBar = mission.progress || 0;
        
        html += '<div class="list-item" style="grid-template-columns:1.5fr 0.8fr 0.8fr 0.8fr 1fr;cursor:pointer;" data-id="' + mission.id + '">';
        html += '<span><strong>' + mission.title + '</strong>';
        if (mission.status === 'completed') {
            html += ' <span style="color:var(--info);font-size:0.6rem;">✅</span>';
        }
        html += '</span>';
        html += '<span style="color:' + priorityInfo.color + ';font-size:0.75rem;">' + priorityInfo.label + '</span>';
        html += '<span style="color:' + statusInfo.color + ';font-size:0.75rem;">' + statusInfo.label + '</span>';
        html += '<span style="font-size:0.75rem;">' + teamName + '</span>';
        html += '<span style="display:flex;align-items:center;gap:8px;">';
        html += '<div style="flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden;">';
        html += '<div style="height:100%;width:' + progressBar + '%;background:var(--accent);border-radius:3px;"></div>';
        html += '</div>';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);min-width:35px;">' + progressBar + '%</span>';
        html += '</span>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    // Click to view detail
    container.querySelectorAll('.list-item').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.dataset.id;
            showMissionDetail(id);
        });
    });
}

/**
 * Show mission detail modal
 */
function showMissionDetail(id) {
    var mission = getMission(id);
    if (!mission) return;
    
    var modal = document.getElementById('mission-detail-modal');
    var content = document.getElementById('mission-detail-content');
    var title = document.getElementById('detail-mission-title');
    title.textContent = mission.title;
    
    var priorityInfo = getPriorityInfo(mission.priority);
    var statusInfo = getStatusInfo(mission.status);
    var teamName = getTeamName(mission.assignedTeamId);
    
    var difficultyMap = {
        'easy': '🟢 Easy',
        'medium': '🟡 Medium',
        'hard': '🟠 Hard',
        'expert': '🔴 Expert'
    };
    var difficultyLabel = difficultyMap[mission.difficulty] || mission.difficulty || 'Medium';
    
    var progressBar = mission.progress || 0;
    var createdAt = new Date(mission.createdAt).toLocaleDateString();
    var completedAt = mission.completedAt ? new Date(mission.completedAt).toLocaleDateString() : 'Not completed';
    
    var objectivesHtml = '';
    if (mission.objectives && mission.objectives.length > 0) {
        objectivesHtml = '<div style="margin-top:8px;"><strong>Objectives:</strong><ul style="list-style:none;padding:0;margin:4px 0;">';
        mission.objectives.forEach(function(obj, index) {
            var doneClass = obj.done ? 'style="text-decoration:line-through;color:var(--text-dim);"' : '';
            objectivesHtml += '<li style="padding:4px 8px;border-bottom:1px solid var(--border-soft);display:flex;align-items:center;gap:8px;" ' + doneClass + '>';
            objectivesHtml += '<input type="checkbox" ' + (obj.done ? 'checked' : '') + ' data-mission="' + mission.id + '" data-index="' + index + '" class="objective-check">';
            objectivesHtml += '<span>' + obj.text + '</span>';
            objectivesHtml += '</li>';
        });
        objectivesHtml += '</ul></div>';
    }
    
    var logHtml = '';
    if (mission.log && mission.log.length > 0) {
        logHtml = '<div style="margin-top:12px;max-height:150px;overflow-y:auto;font-size:0.75rem;background:var(--bg);border-radius:6px;padding:8px;">';
        logHtml += '<strong>Activity Log:</strong>';
        mission.log.slice().reverse().forEach(function(entry) {
            var date = new Date(entry.timestamp).toLocaleString();
            logHtml += '<div style="padding:2px 0;border-bottom:1px solid var(--border-soft);color:var(--text-dim);">' + date + ' - ' + entry.message + '</div>';
        });
        logHtml += '</div>';
    }
    
    var tagsHtml = '';
    if (mission.tags && mission.tags.length > 0) {
        tagsHtml = '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">';
        mission.tags.forEach(function(tag) {
            tagsHtml += '<span style="background:var(--panel-alt);padding:2px 8px;border-radius:10px;font-size:0.65rem;color:var(--text-dim);">#' + tag + '</span>';
        });
        tagsHtml += '</div>';
    }
    
    content.innerHTML = `
        <div class="detail-row"><span class="label">Status:</span> <span style="color:${statusInfo.color};font-weight:600;">${statusInfo.label}</span></div>
        <div class="detail-row"><span class="label">Priority:</span> <span style="color:${priorityInfo.color};font-weight:600;">${priorityInfo.label}</span></div>
        <div class="detail-row"><span class="label">Team:</span> <span>${teamName}</span></div>
        <div class="detail-row"><span class="label">Location:</span> <span>${mission.location || 'Not specified'}</span></div>
        <div class="detail-row"><span class="label">Duration:</span> <span>${mission.duration || 'Not specified'}</span></div>
        <div class="detail-row"><span class="label">Difficulty:</span> <span>${difficultyLabel}</span></div>
        <div class="detail-row"><span class="label">Pay:</span> <span>${mission.pay || 'Not specified'}</span></div>
        <div class="detail-row"><span class="label">Created:</span> <span>${createdAt}</span></div>
        <div class="detail-row"><span class="label">Completed:</span> <span>${completedAt}</span></div>
        ${mission.description ? '<div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:4px;"><span class="label">Description:</span><span style="padding:4px 0;">' + mission.description + '</span></div>' : ''}
        ${mission.notes ? '<div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:4px;"><span class="label">Notes:</span><span style="padding:4px 0;">' + mission.notes + '</span></div>' : ''}
        ${tagsHtml}
        <div style="margin-top:8px;">
            <strong>Progress:</strong>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <div style="flex:1;height:8px;background:var(--bg);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${progressBar}%;background:var(--accent);border-radius:4px;"></div>
                </div>
                <span style="font-size:0.8rem;color:var(--text-dim);min-width:40px;">${progressBar}%</span>
            </div>
        </div>
        ${objectivesHtml}
        ${logHtml}
    `;
    
    // Objective checkbox handlers
    content.querySelectorAll('.objective-check').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var missionId = this.dataset.mission;
            var index = parseInt(this.dataset.index);
            toggleObjective(missionId, index);
            showMissionDetail(missionId);
            renderMissions();
        });
    });
    
    modal.dataset.missionId = id;
    modal.classList.remove('hidden');
}

/**
 * Show mission form for add or edit
 */
function showMissionForm(editId) {
    var modal = document.getElementById('mission-form-modal');
    var title = document.getElementById('mission-form-title');
    var form = document.getElementById('mission-form-inner');
    
    modal.classList.remove('hidden');
    populateTeamSelectors();
    
    // Clear objectives list
    document.getElementById('mission-objectives-list').innerHTML = '';
    
    if (editId) {
        title.textContent = 'Edit Mission';
        var mission = getMission(editId);
        if (mission) {
            document.getElementById('mission-title').value = mission.title || '';
            document.getElementById('mission-description').value = mission.description || '';
            document.getElementById('mission-location').value = mission.location || '';
            document.getElementById('mission-duration').value = mission.duration || '';
            document.getElementById('mission-difficulty').value = mission.difficulty || 'medium';
            document.getElementById('mission-priority').value = mission.priority || 'medium';
            document.getElementById('mission-pay').value = mission.pay || '';
            document.getElementById('mission-team').value = mission.assignedTeamId || '';
            document.getElementById('mission-objective').value = '';
            document.getElementById('mission-notes').value = mission.notes || '';
            document.getElementById('mission-tags').value = (mission.tags || []).join(', ');
            
            // Populate objectives
            if (mission.objectives) {
                mission.objectives.forEach(function(obj) {
                    addObjectiveToList(obj.text);
                });
            }
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Mission';
        form.reset();
        document.getElementById('mission-difficulty').value = 'medium';
        document.getElementById('mission-priority').value = 'medium';
        document.getElementById('mission-team').value = '';
        delete form.dataset.editId;
    }
}

/**
 * Add objective to the list in the form
 */
function addObjectiveToList(text) {
    var container = document.getElementById('mission-objectives-list');
    if (!container) return;
    
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:6px;margin-bottom:4px;align-items:center;';
    div.innerHTML = `
        <span style="flex:1;font-size:0.8rem;padding:4px 8px;background:var(--bg);border-radius:4px;">${text}</span>
        <button type="button" class="small danger remove-objective-btn">✕</button>
        <input type="hidden" value="${text}">
    `;
    container.appendChild(div);
    
    div.querySelector('.remove-objective-btn').onclick = function() {
        div.remove();
    };
}

/**
 * Save mission from form
 */
function saveMission(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    // Collect objectives
    var objectives = [];
    document.querySelectorAll('#mission-objectives-list .remove-objective-btn').forEach(function(btn) {
        var parent = btn.parentElement;
        var text = parent.querySelector('input[type="hidden"]')?.value || parent.querySelector('span')?.textContent || '';
        if (text.trim()) {
            objectives.push({ text: text.trim(), done: false });
        }
    });
    
    // Also check the objective input
    var objectiveInput = document.getElementById('mission-objective');
    if (objectiveInput.value.trim()) {
        objectives.push({ text: objectiveInput.value.trim(), done: false });
    }
    
    var tags = document.getElementById('mission-tags').value.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; });
    
    var missionData = {
        title: document.getElementById('mission-title').value.trim(),
        description: document.getElementById('mission-description').value.trim(),
        location: document.getElementById('mission-location').value.trim(),
        duration: document.getElementById('mission-duration').value.trim(),
        difficulty: document.getElementById('mission-difficulty').value,
        priority: document.getElementById('mission-priority').value,
        pay: document.getElementById('mission-pay').value.trim(),
        assignedTeamId: document.getElementById('mission-team').value || null,
        objectives: objectives,
        notes: document.getElementById('mission-notes').value.trim(),
        tags: tags,
        status: 'active',
        progress: 0
    };
    
    if (!missionData.title) {
        alert('Mission title is required.');
        return;
    }
    
    if (editId) {
        var updated = updateMission(editId, missionData);
        if (updated) {
            addMissionLog(editId, 'Mission updated');
        }
    } else {
        var newMission = createMission(missionData);
        if (newMission) {
            addMissionLog(newMission.id, 'Mission created');
        }
    }
    
    closeMissionForm();
    renderMissions();
}

/**
 * Close mission form
 */
function closeMissionForm() {
    document.getElementById('mission-form-modal').classList.add('hidden');
}

/**
 * Close mission detail
 */
function closeMissionDetail() {
    document.getElementById('mission-detail-modal').classList.add('hidden');
}

/**
 * Initialize mission events
 */
function initMissionEvents() {
    // Add mission button
    var addBtn = document.getElementById('add-mission-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showMissionForm(); });
    }
    
    // Form close buttons
    var closeFormBtn = document.getElementById('close-mission-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeMissionForm);
    }
    var cancelFormBtn = document.getElementById('cancel-mission-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeMissionForm);
    }
    var formModal = document.getElementById('mission-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeMissionForm();
        });
    }
    
    // Form submit
    var form = document.getElementById('mission-form-inner');
    if (form) {
        form.addEventListener('submit', saveMission);
    }
    
    // Add objective button
    var addObjBtn = document.getElementById('add-objective-btn');
    if (addObjBtn) {
        addObjBtn.addEventListener('click', function() {
            var input = document.getElementById('mission-objective');
            if (input.value.trim()) {
                addObjectiveToList(input.value.trim());
                input.value = '';
            }
        });
    }
    var objectiveInput = document.getElementById('mission-objective');
    if (objectiveInput) {
        objectiveInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('add-objective-btn').click();
            }
        });
    }
    
    // Detail close buttons
    var closeDetailBtn = document.getElementById('close-mission-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeMissionDetail);
    }
    var detailModal = document.getElementById('mission-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeMissionDetail();
        });
    }
    
    // Filter
    var filterSelect = document.getElementById('mission-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', renderMissions);
    }
    
    // Edit from detail
    var editDetailBtn = document.getElementById('edit-mission-from-detail');
    if (editDetailBtn) {
        editDetailBtn.addEventListener('click', function() {
            var modal = document.getElementById('mission-detail-modal');
            var id = modal.dataset.missionId;
            if (id) {
                closeMissionDetail();
                showMissionForm(id);
            }
        });
    }
    
    // Delete from detail
    var deleteDetailBtn = document.getElementById('delete-mission-from-detail');
    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', function() {
            var modal = document.getElementById('mission-detail-modal');
            var id = modal.dataset.missionId;
            if (id && confirm('Delete this mission permanently?')) {
                deleteMission(id);
                closeMissionDetail();
                renderMissions();
            }
        });
    }
}

// Make functions globally available
window.renderMissionsView = renderMissionsView;
window.renderMissions = renderMissions;
window.showMissionForm = showMissionForm;
window.saveMission = saveMission;
window.deleteMission = deleteMission;
window.getMission = getMission;
window.getMissions = getMissions;
window.createMission = createMission;
window.updateMission = updateMission;
window.addMissionLog = addMissionLog;
window.toggleObjective = toggleObjective;
window.addObjective = addObjective;
window.removeObjective = removeObjective;
window.showMissionDetail = showMissionDetail;
window.closeMissionForm = closeMissionForm;
window.closeMissionDetail = closeMissionDetail;
window.initMissionEvents = initMissionEvents;
window.initMissionsSystem = initMissionsSystem;
window.getTeamName = getTeamName;
window.getPriorityInfo = getPriorityInfo;
window.getStatusInfo = getStatusInfo;
window.populateTeamSelectors = populateTeamSelectors;
window.addObjectiveToList = addObjectiveToList;
