/**
 * groups.js - Discipline Group Management
 * Groups are connected to disciplines
 * Each group has a label (A, B, C) and a list of students
 * Groups enforce max students per discipline
 * Auto-Distribute helps fill groups but manual control is always available
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
 * Check if a character is eliminated in a specific week
 */
function isCharacterEliminatedInWeek(charId, week) {
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
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

/**
 * Check if a discipline is active in a specific week
 */
function isDisciplineActiveInWeek(disciplineId, week) {
    var discipline = getDiscipline(disciplineId);
    if (!discipline) return false;
    var weekNum = parseInt(week) || 1;
    var start = parseInt(discipline.startWeek);
    var end = parseInt(discipline.endWeek);
    if (isNaN(start)) return true;
    return start <= weekNum && (isNaN(end) || end >= weekNum);
}

/**
 * Get all students for a discipline (from group assignments)
 */
function getAllStudentsForDiscipline(disciplineId) {
    var allStudents = getStudents();
    var result = [];
    
    allStudents.forEach(function(student) {
        // Check if student is in any group for this discipline
        var group = getStudentDisciplineGroup(disciplineId, student.id);
        if (group) {
            result.push(student);
        }
    });
    
    return result;
}

/**
 * Get all students with their group info for a discipline
 */
function getStudentsWithGroupsForDiscipline(disciplineId) {
    var groups = getDisciplineGroups(disciplineId);
    var allStudents = getStudents();
    var result = {
        groups: {},
        unassigned: []
    };
    
    // Initialize group structure
    for (var label in groups) {
        result.groups[label] = [];
    }
    
    allStudents.forEach(function(student) {
        var groupLabel = getStudentDisciplineGroup(disciplineId, student.id);
        if (groupLabel && result.groups[groupLabel] !== undefined) {
            result.groups[groupLabel].push(student);
        } else {
            result.unassigned.push(student);
        }
    });
    
    return result;
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
 * Get class slots for a discipline in a week
 */
function getClassSlotsForDiscipline(disciplineId, week) {
    var slots = [];
    var weekNum = parseInt(week) || 1;
    
    // Check instructor templates
    if (data.curriculum.instructorTemplates) {
        for (var instructorId in data.curriculum.instructorTemplates) {
            var template = data.curriculum.instructorTemplates[instructorId];
            var templateKey = instructorId + '_' + weekNum;
            if (template[templateKey]) {
                for (var key in template[templateKey]) {
                    var parts = key.split('_');
                    var day = parseInt(parts[0]);
                    var hour = parseInt(parts[1]);
                    var classData = template[templateKey][key];
                    if (String(classData.disciplineId) === String(disciplineId)) {
                        slots.push({
                            instructorId: instructorId,
                            week: weekNum,
                            day: day,
                            hour: hour,
                            capacity: classData.capacity || 4,
                            duration: classData.duration || 1,
                            label: classData.label || ''
                        });
                    }
                }
            }
        }
    }
    
    return slots;
}

/**
 * Get students enrolled in a discipline (from schedules)
 */
function getStudentsForDiscipline(disciplineId, week) {
    var students = getStudents();
    var result = [];
    var weekNum = parseInt(week) || 1;
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, weekNum);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                if (String(schedule[day][hour]) === String(disciplineId)) {
                    result.push(student);
                    return;
                }
            }
        }
    });
    
    return result;
}

/**
 * Auto-distribute students to groups for a discipline
 */
function autoDistributeStudents(disciplineId, week) {
    var discipline = getDiscipline(disciplineId);
    if (!discipline) {
        return { success: false, message: 'Discipline not found.' };
    }
    
    var weekNum = parseInt(week) || 1;
    var groups = getDisciplineGroups(disciplineId);
    var groupLabels = Object.keys(groups).sort();
    
    if (groupLabels.length === 0) {
        return { success: false, message: 'No groups created for this discipline. Create groups first.' };
    }
    
    // Get all students enrolled in this discipline
    var allStudents = getStudentsForDiscipline(disciplineId, weekNum);
    if (allStudents.length === 0) {
        return { success: false, message: 'No students enrolled in this discipline for week ' + weekNum + '.' };
    }
    
    // Get current assignments
    var assignedStudents = {};
    var unassignedStudents = [];
    
    allStudents.forEach(function(student) {
        var groupLabel = getStudentDisciplineGroup(disciplineId, student.id);
        if (groupLabel) {
            if (!assignedStudents[groupLabel]) assignedStudents[groupLabel] = [];
            assignedStudents[groupLabel].push(student);
        } else {
            unassignedStudents.push(student);
        }
    });
    
    // Calculate capacity per group
    var maxStudents = discipline.maxStudents || 4;
    var totalCapacity = groupLabels.length * maxStudents;
    var totalStudents = allStudents.length;
    
    if (totalCapacity < totalStudents) {
        return { 
            success: false, 
            message: 'Not enough capacity. ' + totalStudents + ' students, ' + totalCapacity + ' spots available.',
            totalStudents: totalStudents,
            totalCapacity: totalCapacity,
            shortfall: totalStudents - totalCapacity
        };
    }
    
    // Clear all existing assignments
    for (var label in groups) {
        groups[label].students = {};
    }
    
    // First pass: keep students already in groups (if they fit)
    for (var label in assignedStudents) {
        var students = assignedStudents[label];
        var group = groups[label];
        if (!group) continue;
        
        var maxForGroup = maxStudents;
        var count = 0;
        students.forEach(function(student) {
            if (count < maxForGroup) {
                if (!group.students) group.students = {};
                group.students[student.id] = true;
                count++;
            } else {
                unassignedStudents.push(student);
            }
        });
    }
    
    // Second pass: distribute remaining students evenly
    var remainingStudents = unassignedStudents.slice();
    var groupIndex = 0;
    
    remainingStudents.forEach(function(student) {
        // Find the group with the most space
        var bestGroup = null;
        var bestSpace = -1;
        
        for (var i = 0; i < groupLabels.length; i++) {
            var label = groupLabels[i];
            var group = groups[label];
            var currentCount = Object.keys(group.students || {}).length;
            var space = maxStudents - currentCount;
            if (space > bestSpace) {
                bestSpace = space;
                bestGroup = label;
            }
        }
        
        if (bestGroup && bestSpace > 0) {
            if (!groups[bestGroup].students) groups[bestGroup].students = {};
            groups[bestGroup].students[student.id] = true;
        } else {
            // This shouldn't happen if capacity is sufficient
        }
    });
    
    // Count final assignments
    var finalAssignments = {};
    var finalUnassigned = [];
    allStudents.forEach(function(student) {
        var groupLabel = getStudentDisciplineGroup(disciplineId, student.id);
        if (groupLabel) {
            if (!finalAssignments[groupLabel]) finalAssignments[groupLabel] = 0;
            finalAssignments[groupLabel]++;
        } else {
            finalUnassigned.push(student);
        }
    });
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    
    return {
        success: true,
        message: 'Successfully distributed ' + (totalStudents - finalUnassigned.length) + ' students across ' + groupLabels.length + ' groups.',
        assignments: finalAssignments,
        unassigned: finalUnassigned.length,
        groupLabels: groupLabels
    };
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
            <div class="header-actions">
                <button id="auto-distribute-btn" class="primary small">🔄 Auto-Distribute</button>
            </div>
        </div>
        <div id="discipline-groups-container">
            <p class="empty-state">No disciplines available. Create a discipline first.</p>
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
    
    var week = instructorCalendarState ? instructorCalendarState.currentWeek || 1 : 1;
    
    var html = '<div style="display:flex;flex-direction:column;gap:16px;">';
    
    disciplines.sort(function(a, b) { return a.name.localeCompare(b.name); });
    
    disciplines.forEach(function(discipline) {
        var isActive = isDisciplineActiveInWeek(discipline.id, week);
        var groups = getDisciplineGroups(discipline.id);
        var groupLabels = Object.keys(groups).sort();
        var maxStudents = discipline.maxStudents || 'Unlimited';
        
        // Get all students with their group info
        var studentData = getStudentsWithGroupsForDiscipline(discipline.id);
        var totalStudents = Object.values(studentData.groups).reduce(function(sum, arr) { return sum + arr.length; }, 0) + studentData.unassigned.length;
        
        html += '<div class="discipline-groups-card" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow);' + (!isActive ? 'opacity:0.6;' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
        html += '<h3 style="color:var(--accent);">' + discipline.name + '</h3>';
        html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);">Max: ' + maxStudents + ' | Total: ' + totalStudents + '</span>';
        if (!isActive) {
            html += '<span style="font-size:0.65rem;color:var(--warning);padding:2px 8px;border:1px solid var(--warning);border-radius:10px;">Inactive (Wk ' + (discipline.startWeek || '?') + '-' + (discipline.endWeek || '?') + ')</span>';
        }
        html += '<button class="add-discipline-group-btn small primary" data-discipline="' + discipline.id + '">+ Add Group</button>';
        html += '<button class="auto-distribute-btn small primary" data-discipline="' + discipline.id + '" style="background:var(--accent-soft);border-color:var(--accent);">🔄 Auto-Distribute</button>';
        html += '</div>';
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
                
                // Get students in this group
                var studentsInGroup = studentData.groups[label] || [];
                
                html += '<div class="discipline-group-card" style="background:var(--bg);border:1px solid ' + (isFull ? 'var(--danger)' : 'var(--border-soft)') + ';border-radius:var(--radius);padding:8px 12px;flex:1;min-width:120px;max-width:250px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="window.toggleDisciplineGroup(\'' + discipline.id + '\', \'' + label + '\')">';
                html += '<span style="font-weight:600;color:var(--accent);">Group ' + label + '</span>';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">' + studentCount + '/' + (discipline.maxStudents || '∞') + (isExpanded ? ' ▼' : ' ▶') + '</span>';
                html += '</div>';
                
                if (isExpanded) {
                    html += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-soft);">';
                    
                    // Show students in this group
                    if (studentsInGroup.length > 0) {
                        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
                        studentsInGroup.forEach(function(student) {
                            var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                            var isEliminated = isCharacterEliminatedInWeek(student.id, week);
                            html += '<span class="student-tag" style="background:var(--panel-alt);padding:2px 8px;border-radius:12px;font-size:0.7rem;display:inline-flex;align-items:center;gap:4px;' + (isEliminated ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + name;
                            html += '<button class="remove-from-discipline-group-btn" data-discipline="' + discipline.id + '" data-group="' + label + '" data-student="' + student.id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;">✕</button>';
                            html += '</span>';
                        });
                        html += '</div>';
                    } else {
                        html += '<span style="font-size:0.7rem;color:var(--text-dim);">No students assigned</span>';
                    }
                    
                    // Add student dropdown
                    html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
                    html += '<select class="add-student-to-discipline-group" data-discipline="' + discipline.id + '" data-group="' + label + '" style="flex:1;min-width:100px;padding:2px 4px;font-size:0.7rem;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;">';
                    html += '<option value="">Add student...</option>';
                    
                    // Show unassigned students
                    studentData.unassigned.forEach(function(student) {
                        var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                        var inGroup = isStudentInGroup(discipline.id, label, student.id);
                        if (!inGroup) {
                            var isEliminated = isCharacterEliminatedInWeek(student.id, week);
                            html += '<option value="' + student.id + '" ' + (isEliminated ? 'style="opacity:0.4;"' : '') + '>' + name + (isEliminated ? ' (eliminated)' : '') + '</option>';
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
                                    var isEliminated = isCharacterEliminatedInWeek(id, week);
                                    html += '<option value="' + id + '" style="color:var(--warning);' + (isEliminated ? 'opacity:0.4;' : '') + '">' + name + ' (in Group ' + otherLabel + ')' + (isEliminated ? ' (eliminated)' : '') + '</option>';
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
            if (studentData.unassigned.length > 0) {
                html += '<div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:var(--radius);border:1px dashed var(--border);">';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">Unassigned (' + studentData.unassigned.length + '): </span>';
                studentData.unassigned.forEach(function(student) {
                    var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                    var isEliminated = isCharacterEliminatedInWeek(student.id, week);
                    html += '<span style="background:var(--panel-alt);padding:2px 6px;border-radius:10px;font-size:0.65rem;margin:2px;display:inline-block;' + (isEliminated ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + name + '</span>';
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
    
    // Add group buttons per discipline
    container.querySelectorAll('.add-discipline-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var disciplineId = this.dataset.discipline;
            showAddDisciplineGroupModal(disciplineId);
        });
    });
    
    // Auto-Distribute buttons per discipline
    container.querySelectorAll('.auto-distribute-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var disciplineId = this.dataset.discipline;
            var week = instructorCalendarState ? instructorCalendarState.currentWeek || 1 : 1;
            
            if (!confirm('Auto-distribute will reassign all students to groups for this discipline. Continue?')) {
                return;
            }
            
            var result = autoDistributeStudents(disciplineId, week);
            if (result.success) {
                saveData().then(function() {
                    if (typeof logActivity === 'function') {
                        logActivity('Auto-distributed students for discipline');
                    }
                    renderDisciplineGroups();
                    alert('✅ ' + result.message + '\n\n' + 
                        Object.keys(result.assignments).map(function(label) {
                            return 'Group ' + label + ': ' + result.assignments[label] + ' students';
                        }).join('\n') +
                        (result.unassigned > 0 ? '\n\n⚠ ' + result.unassigned + ' students could not be assigned.' : ''));
                }).catch(function(err) {
                    console.error('Failed to save:', err);
                    alert('Failed to save distribution.');
                });
            } else {
                alert('❌ ' + result.message);
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
 * Show add group modal for a specific discipline
 */
function showAddDisciplineGroupModal(disciplineId) {
    var disciplines = data.curriculum.disciplines || [];
    if (disciplines.length === 0) {
        alert('No disciplines available. Create a discipline first.');
        return;
    }
    
    // If no disciplineId provided, show a dropdown
    if (!disciplineId) {
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
            var selectedDisciplineId = document.getElementById('add-group-discipline-select').value;
            var label = document.getElementById('add-group-label').value.trim().toUpperCase();
            
            if (!selectedDisciplineId) {
                alert('Please select a discipline.');
                return;
            }
            if (!label) {
                alert('Please enter a group label.');
                return;
            }
            
            var groups = getDisciplineGroups(selectedDisciplineId);
            if (groups[label]) {
                alert('Group "' + label + '" already exists for this discipline.');
                return;
            }
            
            groups[label] = { students: {} };
            
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    var discipline = getDiscipline(selectedDisciplineId);
                    logActivity('Created group ' + label + ' for discipline ' + (discipline ? discipline.name : ''));
                }
                modal.remove();
                renderDisciplineGroups();
            }).catch(function(err) {
                console.error('Failed to save:', err);
                alert('Failed to create group.');
            });
        };
        return;
    }
    
    // If disciplineId provided, use it directly
    var discipline = getDiscipline(disciplineId);
    if (!discipline) {
        alert('Discipline not found.');
        return;
    }
    
    var groups = getDisciplineGroups(disciplineId);
    var existingLabels = Object.keys(groups);
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Add Group to ${discipline.name}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Discipline:</label>
                    <span style="padding:6px 0;display:block;">${discipline.name}</span>
                </div>
                <div class="form-group">
                    <label>Group Label *</label>
                    <input type="text" id="add-group-label" placeholder="e.g., A, B, 1, 2..." style="width:100%;padding:8px;">
                    ${existingLabels.length > 0 ? '<span style="font-size:0.6rem;color:var(--text-dim);">Existing groups: ' + existingLabels.join(', ') + '</span>' : ''}
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
        var label = document.getElementById('add-group-label').value.trim().toUpperCase();
        
        if (!label) {
            alert('Please enter a group label.');
            return;
        }
        if (existingLabels.indexOf(label) !== -1) {
            alert('Group "' + label + '" already exists for this discipline.');
            return;
        }
        
        var groups = getDisciplineGroups(disciplineId);
        groups[label] = { students: {} };
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Created group ' + label + ' for discipline ' + discipline.name);
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
    // Auto-Distribute global button
    var autoDistBtn = document.getElementById('auto-distribute-btn');
    if (autoDistBtn) {
        autoDistBtn.addEventListener('click', function() {
            var disciplines = data.curriculum.disciplines || [];
            if (disciplines.length === 0) {
                alert('No disciplines available.');
                return;
            }
            
            // Show a discipline selector
            var modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:400px;">
                    <div class="modal-header">
                        <h3>Auto-Distribute Students</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Select Discipline:</label>
                            <select id="auto-dist-discipline" style="width:100%;padding:8px;">
                                ${disciplines.map(function(d) {
                                    return '<option value="' + d.id + '">' + d.name + '</option>';
                                }).join('')}
                            </select>
                        </div>
                        <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">
                            <p style="font-size:0.75rem;color:var(--text-dim);">
                                ⚡ This will reassign all students to groups for the selected discipline.
                                Existing group assignments will be overwritten.
                            </p>
                        </div>
                        <div class="form-actions" style="margin-top:16px;">
                            <button type="button" id="cancel-auto-dist" class="secondary">Cancel</button>
                            <button type="button" id="confirm-auto-dist" class="primary">Auto-Distribute</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
            modal.querySelector('#cancel-auto-dist').onclick = function() { modal.remove(); };
            modal.addEventListener('click', function(e) {
                if (e.target === modal) modal.remove();
            });
            
            modal.querySelector('#confirm-auto-dist').onclick = function() {
                var disciplineId = document.getElementById('auto-dist-discipline').value;
                var week = instructorCalendarState ? instructorCalendarState.currentWeek || 1 : 1;
                modal.remove();
                
                var result = autoDistributeStudents(disciplineId, week);
                if (result.success) {
                    saveData().then(function() {
                        if (typeof logActivity === 'function') {
                            logActivity('Auto-distributed students for discipline');
                        }
                        renderDisciplineGroups();
                        alert('✅ ' + result.message + '\n\n' + 
                            Object.keys(result.assignments).map(function(label) {
                                return 'Group ' + label + ': ' + result.assignments[label] + ' students';
                            }).join('\n') +
                            (result.unassigned > 0 ? '\n\n⚠ ' + result.unassigned + ' students could not be assigned.' : ''));
                    }).catch(function(err) {
                        console.error('Failed to save:', err);
                        alert('Failed to save distribution.');
                    });
                } else {
                    alert('❌ ' + result.message);
                }
            };
        });
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
window.getAllStudentsForDiscipline = getAllStudentsForDiscipline;
window.getStudentsWithGroupsForDiscipline = getStudentsWithGroupsForDiscipline;
window.isCharacterEliminatedInWeek = isCharacterEliminatedInWeek;
window.isDisciplineActiveInWeek = isDisciplineActiveInWeek;
window.showAddDisciplineGroupModal = showAddDisciplineGroupModal;
window.initDisciplineGroupsEvents = initDisciplineGroupsEvents;
window.autoDistributeStudents = autoDistributeStudents;
window.getClassSlotsForDiscipline = getClassSlotsForDiscipline;
window.getStudentsForDiscipline = getStudentsForDiscipline;
