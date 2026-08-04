/**
 * groups.js - Discipline Group Management
 * Groups are connected to disciplines, not instructors
 * Each group has a label (A, B, C) and a list of students
 * Groups enforce max students per discipline
 */

/**
 * Get groups for a specific discipline
 */
function getDisciplineGroups(disciplineId) {
    if (!data.curriculum.disciplineGroups) {
        data.curriculum.disciplineGroups = {};
    }
    if (!data.curriculum.disciplineGroups[disciplineId]) {
        data.curriculum.disciplineGroups[disciplineId] = {};
    }
    return data.curriculum.disciplineGroups[disciplineId];
}

/**
 * Get all groups across all disciplines
 */
function getAllGroups() {
    if (!data.curriculum.disciplineGroups) {
        data.curriculum.disciplineGroups = {};
    }
    return data.curriculum.disciplineGroups;
}

/**
 * Get students in a specific group
 */
function getStudentsInDisciplineGroup(disciplineId, groupLabel) {
    var groups = getDisciplineGroups(disciplineId);
    if (!groups[groupLabel] || !groups[groupLabel].students) {
        return [];
    }
    return Object.keys(groups[groupLabel].students);
}

/**
 * Check if a student is in a specific group
 */
function isStudentInGroup(disciplineId, groupLabel, studentId) {
    var groups = getDisciplineGroups(disciplineId);
    if (!groups[groupLabel] || !groups[groupLabel].students) {
        return false;
    }
    return !!groups[groupLabel].students[studentId];
}

/**
 * Get the group a student is in for a specific discipline
 */
function getStudentDisciplineGroup(disciplineId, studentId) {
    var groups = getDisciplineGroups(disciplineId);
    for (var label in groups) {
        if (groups[label].students && groups[label].students[studentId]) {
            return label;
        }
    }
    return null;
}

/**
 * Add a student to a group
 */
function addStudentToDisciplineGroup(disciplineId, groupLabel, studentId) {
    var groups = getDisciplineGroups(disciplineId);
    
    if (!groups[groupLabel]) {
        groups[groupLabel] = { students: {} };
    }
    
    // Check if student is already in this group
    if (groups[groupLabel].students && groups[groupLabel].students[studentId]) {
        return { success: false, message: 'Student is already in this group.' };
    }
    
    // Check if student is in another group for this discipline
    var currentGroup = getStudentDisciplineGroup(disciplineId, studentId);
    if (currentGroup) {
        // Remove from old group
        delete groups[currentGroup].students[studentId];
    }
    
    // Check discipline max students limit
    var discipline = getDiscipline(disciplineId);
    if (discipline && discipline.maxStudents) {
        var currentCount = Object.keys(groups[groupLabel].students || {}).length;
        if (currentCount >= discipline.maxStudents) {
            return { 
                success: false, 
                message: 'Group ' + groupLabel + ' already has ' + currentCount + ' students (max ' + discipline.maxStudents + ').' 
            };
        }
    }
    
    if (!groups[groupLabel].students) {
        groups[groupLabel].students = {};
    }
    groups[groupLabel].students[studentId] = true;
    
    return { success: true, message: 'Student added to group.' };
}

/**
 * Remove a student from a group
 */
function removeStudentFromDisciplineGroup(disciplineId, groupLabel, studentId) {
    var groups = getDisciplineGroups(disciplineId);
    if (groups[groupLabel] && groups[groupLabel].students) {
        delete groups[groupLabel].students[studentId];
        return { success: true };
    }
    return { success: false, message: 'Student not found in group.' };
}

/**
 * Remove a group entirely
 */
function removeDisciplineGroup(disciplineId, groupLabel) {
    var groups = getDisciplineGroups(disciplineId);
    if (groups[groupLabel]) {
        delete groups[groupLabel];
        return { success: true };
    }
    return { success: false, message: 'Group not found.' };
}

/**
 * Render the discipline groups view
 */
function renderDisciplineGroupsView(container) {
    if (!container) {
        container = document.getElementById('groups-content');
    }
    if (!container) return;
    
    container.innerHTML = `
        <div class="page-header">
            <h2>▣ Discipline Groups</h2>
            <button id="add-discipline-group-btn" class="primary small">+ Add Group</button>
        </div>
        <div id="discipline-groups-container">
            <p class="empty-state">Select a discipline from the list below to manage its groups.</p>
        </div>
    `;
    
    renderDisciplineGroups();
    initDisciplineGroupsEvents();
}

/**
 * Render the discipline groups
 */
function renderDisciplineGroups() {
    var container = document.getElementById('discipline-groups-container');
    if (!container) return;
    
    var disciplines = data.curriculum.disciplines || [];
    if (disciplines.length === 0) {
        container.innerHTML = '<p class="empty-state">No disciplines created yet. Create a discipline first.</p>';
        return;
    }
    
    var html = '<div style="display:flex;flex-direction:column;gap:16px;">';
    
    disciplines.sort(function(a, b) { return a.name.localeCompare(b.name); });
    
    disciplines.forEach(function(discipline) {
        var groups = getDisciplineGroups(discipline.id);
        var groupLabels = Object.keys(groups).sort();
        var maxStudents = discipline.maxStudents || 'Unlimited';
        
        // Get all students for this discipline
        var allStudents = getStudentsForDiscipline(discipline.id);
        var assignedStudents = {};
        var unassignedStudents = [];
        
        allStudents.forEach(function(student) {
            var assigned = false;
            for (var label in groups) {
                if (groups[label].students && groups[label].students[student.id]) {
                    assigned = true;
                    if (!assignedStudents[label]) assignedStudents[label] = [];
                    assignedStudents[label].push(student);
                    break;
                }
            }
            if (!assigned) {
                unassignedStudents.push(student);
            }
        });
        
        html += '<div class="discipline-groups-card" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
        html += '<h3 style="color:var(--accent);">' + discipline.name + '</h3>';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);">Max Students: ' + maxStudents + ' | Total: ' + allStudents.length + '</span>';
        html += '</div>';
        
        if (groupLabels.length === 0) {
            html += '<p style="color:var(--text-dim);font-size:0.8rem;margin-bottom:8px;">No groups created for this discipline. Click "Add Group" to create one.</p>';
        } else {
            html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
            groupLabels.forEach(function(label) {
                var group = groups[label];
                var studentCount = group.students ? Object.keys(group.students).length : 0;
                var isFull = discipline.maxStudents && studentCount >= discipline.maxStudents;
                var isExpanded = instructorCalendarState && instructorCalendarState.expandedGroups ? 
                    instructorCalendarState.expandedGroups[discipline.id + '_' + label] || false : false;
                
                html += '<div class="discipline-group-card" style="background:var(--bg);border:1px solid ' + (isFull ? 'var(--danger)' : 'var(--border-soft)') + ';border-radius:var(--radius);padding:8px 12px;flex:1;min-width:120px;max-width:250px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="window.toggleDisciplineGroup(\'' + discipline.id + '\', \'' + label + '\')">';
                html += '<span style="font-weight:600;color:var(--accent);">Group ' + label + '</span>';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">' + studentCount + '/' + (discipline.maxStudents || '∞') + (isExpanded ? ' ▼' : ' ▶') + '</span>';
                html += '</div>';
                
                if (isExpanded) {
                    html += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-soft);">';
                    
                    // Show students in this group
                    var studentIds = Object.keys(group.students || {});
                    if (studentIds.length > 0) {
                        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
                        studentIds.forEach(function(id) {
                            var student = data.characters.find(function(c) { return String(c.id) === String(id); });
                            if (student) {
                                var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                                html += '<span class="student-tag" style="background:var(--panel-alt);padding:2px 8px;border-radius:12px;font-size:0.7rem;display:inline-flex;align-items:center;gap:4px;">' + name;
                                html += '<button class="remove-from-discipline-group-btn" data-discipline="' + discipline.id + '" data-group="' + label + '" data-student="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;">✕</button>';
                                html += '</span>';
                            }
                        });
                        html += '</div>';
                    } else {
                        html += '<span style="font-size:0.7rem;color:var(--text-dim);">No students assigned</span>';
                    }
                    
                    // Add student dropdown
                    html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
                    html += '<select class="add-student-to-discipline-group" data-discipline="' + discipline.id + '" data-group="' + label + '" style="flex:1;min-width:100px;padding:2px 4px;font-size:0.7rem;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;">';
                    html += '<option value="">Add student...</option>';
                    unassignedStudents.forEach(function(student) {
                        var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                        var inGroup = isStudentInGroup(discipline.id, label, student.id);
                        if (!inGroup) {
                            html += '<option value="' + student.id + '">' + name + '</option>';
                        }
                    });
                    // Also show students in other groups with a warning
                    for (var otherLabel in groups) {
                        if (otherLabel === label) continue;
                        if (groups[otherLabel].students) {
                            Object.keys(groups[otherLabel].students).forEach(function(id) {
                                var student = data.characters.find(function(c) { return String(c.id) === String(id); });
                                if (student) {
                                    var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                                    html += '<option value="' + id + '" style="color:var(--warning);">' + name + ' (in Group ' + otherLabel + ')</option>';
                                }
                            });
                        }
                    }
                    html += '</select>';
                    html += '<button class="add-student-to-discipline-group-btn small primary" data-discipline="' + discipline.id + '" data-group="' + label + '" style="font-size:0.6rem;padding:2px 6px;">Add</button>';
                    html += '</div>';
                    
                    html += '</div>';
                }
                
                html += '</div>';
            });
            html += '</div>';
            
            // Show unassigned students
            if (unassignedStudents.length > 0) {
                html += '<div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:var(--radius);border:1px dashed var(--border);">';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">Unassigned (' + unassignedStudents.length + '): </span>';
                unassignedStudents.forEach(function(student) {
                    var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                    html += '<span style="background:var(--panel-alt);padding:2px 6px;border-radius:10px;font-size:0.65rem;margin:2px;display:inline-block;">' + name + '</span>';
                });
                html += '</div>';
            }
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners for group management
    container.querySelectorAll('.add-student-to-discipline-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var disciplineId = this.dataset.discipline;
            var groupLabel = this.dataset.group;
            var select = this.parentElement.querySelector('.add-student-to-discipline-group');
            var studentId = select.value;
            if (studentId) {
                var result = addStudentToDisciplineGroup(disciplineId, groupLabel, studentId);
                if (result.success) {
                    saveData().then(function() {
                        if (typeof logActivity === 'function') {
                            logActivity('Added student to group ' + groupLabel);
                        }
                        renderDisciplineGroups();
                    }).catch(function(err) {
                        console.error('Failed to save:', err);
                        alert('Failed to add student to group.');
                    });
                } else {
                    alert(result.message);
                }
            }
        });
    });
    
    container.querySelectorAll('.remove-from-discipline-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var disciplineId = this.dataset.discipline;
            var groupLabel = this.dataset.group;
            var studentId = this.dataset.student;
            if (confirm('Remove this student from the group?')) {
                var result = removeStudentFromDisciplineGroup(disciplineId, groupLabel, studentId);
                if (result.success) {
                    saveData().then(function() {
                        if (typeof logActivity === 'function') {
                            logActivity('Removed student from group');
                        }
                        renderDisciplineGroups();
                    }).catch(function(err) {
                        console.error('Failed to save:', err);
                        alert('Failed to remove student from group.');
                    });
                }
            }
        });
    });
}

/**
 * Toggle discipline group expansion
 */
function toggleDisciplineGroup(disciplineId, groupLabel) {
    if (!instructorCalendarState) {
        instructorCalendarState = { expandedGroups: {} };
    }
    var key = disciplineId + '_' + groupLabel;
    if (instructorCalendarState.expandedGroups[key]) {
        delete instructorCalendarState.expandedGroups[key];
    } else {
        instructorCalendarState.expandedGroups[key] = true;
    }
    renderDisciplineGroups();
}

/**
 * Get students for a discipline (from schedules)
 */
function getStudentsForDiscipline(disciplineId) {
    var students = getStudents();
    var result = [];
    var week = instructorCalendarState ? instructorCalendarState.currentWeek || 1 : 1;
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, week);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                if (String(schedule[day][hour]) === String(disciplineId)) {
                    result.push(student);
                    return;
                }
            }
        }
        // Also check templates
        if (data.curriculum.instructorTemplates) {
            for (var key in data.curriculum.instructorTemplates) {
                var templateData = data.curriculum.instructorTemplates[key];
                for (var classKey in templateData) {
                    if (templateData[classKey].disciplineId === disciplineId) {
                        result.push(student);
                        return;
                    }
                }
            }
        }
    });
    
    return result;
}

/**
 * Show add group modal for a discipline
 */
function showAddDisciplineGroupModal() {
    var disciplines = data.curriculum.disciplines || [];
    if (disciplines.length === 0) {
        alert('No disciplines available. Create a discipline first.');
        return;
    }
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Add Group to Discipline</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Discipline *</label>
                    <select id="add-group-discipline-select" style="width:100%;padding:8px;">
                        ${disciplines.map(function(d) {
                            return '<option value="' + d.id + '">' + d.name + '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Group Label *</label>
                    <input type="text" id="add-group-label" placeholder="e.g., A, B, 1, 2..." style="width:100%;padding:8px;">
                </div>
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-add-group" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-group" class="primary">Add Group</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-group').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-add-group').onclick = function() {
        var disciplineId = document.getElementById('add-group-discipline-select').value;
        var label = document.getElementById('add-group-label').value.trim().toUpperCase();
        
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        if (!label) {
            alert('Please enter a group label.');
            return;
        }
        
        var groups = getDisciplineGroups(disciplineId);
        if (groups[label]) {
            alert('Group "' + label + '" already exists for this discipline.');
            return;
        }
        
        groups[label] = { students: {} };
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                var discipline = getDiscipline(disciplineId);
                logActivity('Created group ' + label + ' for discipline ' + (discipline ? discipline.name : ''));
            }
            modal.remove();
            renderDisciplineGroups();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to create group.');
        });
    };
}

/**
 * Initialize discipline groups events
 */
function initDisciplineGroupsEvents() {
    var addBtn = document.getElementById('add-discipline-group-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddDisciplineGroupModal);
    }
}

// Make functions globally available
window.renderDisciplineGroupsView = renderDisciplineGroupsView;
window.renderDisciplineGroups = renderDisciplineGroups;
window.getDisciplineGroups = getDisciplineGroups;
window.getStudentsInDisciplineGroup = getStudentsInDisciplineGroup;
window.isStudentInGroup = isStudentInGroup;
window.getStudentDisciplineGroup = getStudentDisciplineGroup;
window.addStudentToDisciplineGroup = addStudentToDisciplineGroup;
window.removeStudentFromDisciplineGroup = removeStudentFromDisciplineGroup;
window.removeDisciplineGroup = removeDisciplineGroup;
window.toggleDisciplineGroup = toggleDisciplineGroup;
window.getStudentsForDiscipline = getStudentsForDiscipline;
window.showAddDisciplineGroupModal = showAddDisciplineGroupModal;
window.initDisciplineGroupsEvents = initDisciplineGroupsEvents;
