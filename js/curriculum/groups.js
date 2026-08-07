/**
 * groups.js - Auto-Group Management
 * Groups are auto-created from discipline + instructor + time slot
 * Students in the same group share the same time slot
 */

/**
 * Generate a group key from discipline, instructor, day, hour
 */
function generateGroupKey(disciplineId, instructorId, day, hour) {
    return disciplineId + '_' + instructorId + '_' + day + '_' + hour;
}

/**
 * Generate a display name for a group
 */
function generateGroupDisplayName(disciplineId, instructorId, day, hour) {
    var discipline = getDiscipline(disciplineId);
    var disciplineName = discipline ? discipline.name : 'Unknown';
    
    var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    
    // Shorten the name
    var shortInstructor = instructorName.split(' ').map(function(n) { return n[0]; }).join('');
    return disciplineName + ' (' + shortInstructor + ') - ' + dayNames[day] + ' ' + hourDisplay + ampm;
}

/**
 * Get or create an auto-group for a specific discipline + instructor + time slot
 */
function getOrCreateAutoGroup(disciplineId, instructorId, day, hour) {
    if (!data.curriculum.autoGroups) {
        data.curriculum.autoGroups = {};
    }
    
    var key = generateGroupKey(disciplineId, instructorId, day, hour);
    
    if (!data.curriculum.autoGroups[key]) {
        data.curriculum.autoGroups[key] = {
            id: key,
            disciplineId: disciplineId,
            instructorId: instructorId,
            day: day,
            hour: hour,
            students: [],
            displayName: generateGroupDisplayName(disciplineId, instructorId, day, hour),
            createdAt: new Date().toISOString()
        };
    }
    
    return data.curriculum.autoGroups[key];
}

/**
 * Get all auto-groups
 */
function getAllAutoGroups() {
    if (!data.curriculum.autoGroups) {
        data.curriculum.autoGroups = {};
    }
    return data.curriculum.autoGroups;
}

/**
 * Get auto-groups for a specific discipline
 */
function getAutoGroupsForDiscipline(disciplineId) {
    var allGroups = getAllAutoGroups();
    var result = {};
    for (var key in allGroups) {
        if (allGroups[key].disciplineId === disciplineId) {
            result[key] = allGroups[key];
        }
    }
    return result;
}

/**
 * Get auto-groups for a specific instructor
 */
function getAutoGroupsForInstructor(instructorId) {
    var allGroups = getAllAutoGroups();
    var result = {};
    for (var key in allGroups) {
        if (allGroups[key].instructorId === instructorId) {
            result[key] = allGroups[key];
        }
    }
    return result;
}

/**
 * Get the auto-group a student belongs to for a specific discipline
 */
function getStudentAutoGroup(studentId, disciplineId) {
    var allGroups = getAllAutoGroups();
    for (var key in allGroups) {
        var group = allGroups[key];
        if (group.disciplineId === disciplineId && group.students && group.students.indexOf(studentId) !== -1) {
            return group;
        }
    }
    return null;
}

/**
 * Check if a student is in any auto-group for a discipline
 */
function isStudentInAutoGroup(studentId, disciplineId) {
    return getStudentAutoGroup(studentId, disciplineId) !== null;
}

/**
 * Add a student to an auto-group
 */
function addStudentToAutoGroup(disciplineId, instructorId, day, hour, studentId) {
    var group = getOrCreateAutoGroup(disciplineId, instructorId, day, hour);
    
    // Check if student is already in this group
    if (group.students.indexOf(studentId) !== -1) {
        return { success: false, message: 'Student already in this group.', group: group };
    }
    
    // Check if student is already in another group for this discipline
    var existingGroup = getStudentAutoGroup(studentId, disciplineId);
    if (existingGroup) {
        // Remove from old group first
        var index = existingGroup.students.indexOf(studentId);
        if (index !== -1) {
            existingGroup.students.splice(index, 1);
        }
    }
    
    group.students.push(studentId);
    
    return { success: true, message: 'Student added to group.', group: group };
}

/**
 * Remove a student from an auto-group
 */
function removeStudentFromAutoGroup(disciplineId, instructorId, day, hour, studentId) {
    var key = generateGroupKey(disciplineId, instructorId, day, hour);
    if (!data.curriculum.autoGroups || !data.curriculum.autoGroups[key]) {
        return { success: false, message: 'Group not found.' };
    }
    
    var group = data.curriculum.autoGroups[key];
    var index = group.students.indexOf(studentId);
    if (index === -1) {
        return { success: false, message: 'Student not in this group.' };
    }
    
    group.students.splice(index, 1);
    
    // If group is empty, keep it (don't delete - it might be used again)
    
    return { success: true, message: 'Student removed from group.' };
}

/**
 * Get all students in an auto-group
 */
function getStudentsInAutoGroup(disciplineId, instructorId, day, hour) {
    var key = generateGroupKey(disciplineId, instructorId, day, hour);
    if (!data.curriculum.autoGroups || !data.curriculum.autoGroups[key]) {
        return [];
    }
    return data.curriculum.autoGroups[key].students || [];
}

/**
 * Get the group for a specific class slot (discipline + instructor + time)
 */
function getAutoGroupForSlot(disciplineId, instructorId, day, hour) {
    var key = generateGroupKey(disciplineId, instructorId, day, hour);
    if (!data.curriculum.autoGroups || !data.curriculum.autoGroups[key]) {
        return null;
    }
    return data.curriculum.autoGroups[key];
}

/**
 * Check if adding a student to a group would cause conflicts
 * Returns list of students who would be affected
 */
function checkAutoGroupConflicts(disciplineId, instructorId, day, hour, studentId, week) {
    var group = getOrCreateAutoGroup(disciplineId, instructorId, day, hour);
    var conflicts = [];
    var weekNum = parseInt(week) || 1;
    
    // Check each student in the group
    group.students.forEach(function(id) {
        if (String(id) === String(studentId)) return;
        
        var schedule = getStudentSchedule(id, weekNum);
        // Check if this student has a class at this time (they shouldn't, since they're in this group)
        // But check anyway
        for (var h = hour; h < hour + 1 && h <= 23; h++) {
            if (schedule[day] && schedule[day][h]) {
                var discId = schedule[day][h];
                var disc = getDiscipline(discId);
                conflicts.push({
                    studentId: id,
                    studentName: getStudentName(id),
                    conflictDiscipline: disc ? disc.name : 'Unknown'
                });
                break;
            }
        }
    });
    
    return conflicts;
}

/**
 * Get student name helper
 */
function getStudentName(studentId) {
    var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
    if (student) {
        return [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
    }
    return 'Unknown';
}

/**
 * Auto-assign a student to a discipline, creating/using auto-groups
 * This is the main function called when adding a student to a class
 */
function autoAssignStudentToGroupAndClass(studentId, disciplineId, instructorId, week, day, hour, duration) {
    var weekNum = parseInt(week) || 1;
    var dur = duration || 1;
    var discipline = getDiscipline(disciplineId);
    
    if (!discipline) {
        return { success: false, message: 'Discipline not found.' };
    }
    
    // Get or create the auto-group
    var group = getOrCreateAutoGroup(disciplineId, instructorId, day, hour);
    
    // Check if student is already in this group
    if (group.students.indexOf(studentId) !== -1) {
        // Student is already in the group, just add the class
        var result = addClassToStudent(studentId, disciplineId, weekNum, day, hour, dur, instructorId);
        if (result.success) {
            return { 
                success: true, 
                message: 'Student already in group. Class added.',
                group: group,
                addedToGroup: false
            };
        }
        return result;
    }
    
    // Check if student is in another group for this discipline
    var existingGroup = getStudentAutoGroup(studentId, disciplineId);
    if (existingGroup) {
        // Student is in another group - warn and ask to move
        return {
            success: false,
            message: 'Student is already in group "' + existingGroup.displayName + '" for this discipline. Move to new group?',
            existingGroup: existingGroup,
            needsMoveConfirmation: true
        };
    }
    
    // Check for conflicts with existing students in the group
    var conflicts = checkAutoGroupConflicts(disciplineId, instructorId, day, hour, studentId, weekNum);
    
    // Check if the student has a conflict at this time
    var schedule = getStudentSchedule(studentId, weekNum);
    var studentHasConflict = false;
    var conflictDiscipline = null;
    for (var h = hour; h < hour + dur && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            studentHasConflict = true;
            var conflictId = schedule[day][h];
            var conflictDisc = getDiscipline(conflictId);
            if (conflictDisc) {
                conflictDiscipline = conflictDisc.name;
            }
            break;
        }
    }
    
    if (studentHasConflict) {
        return {
            success: false,
            message: 'Student has a conflict at this time: ' + conflictDiscipline,
            hasConflict: true,
            conflictDiscipline: conflictDiscipline
        };
    }
    
    if (conflicts.length > 0) {
        // Students in the group have conflicts - need to resolve
        var conflictNames = conflicts.map(function(c) { return c.studentName + ' (' + c.conflictDiscipline + ')'; }).join(', ');
        return {
            success: false,
            message: 'Students in this group have conflicts: ' + conflictNames,
            hasConflicts: true,
            conflicts: conflicts,
            group: group
        };
    }
    
    // All checks passed - add student to group
    group.students.push(studentId);
    
    // Add the class to the student
    var result = addClassToStudent(studentId, disciplineId, weekNum, day, hour, dur, instructorId);
    
    if (result.success) {
        return {
            success: true,
            message: 'Student added to group and class assigned.',
            group: group,
            addedToGroup: true
        };
    }
    
    return result;
}

/**
 * Add a class to a student's schedule
 */
function addClassToStudent(studentId, disciplineId, week, day, hour, duration, instructorId) {
    var schedule = getStudentSchedule(studentId, week);
    var dur = duration || 1;
    
    // Check for conflicts
    for (var h = hour; h < hour + dur && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            var conflictId = schedule[day][h];
            var conflictDisc = getDiscipline(conflictId);
            return {
                success: false,
                message: 'Student has a conflict at ' + h + ':00' + (conflictDisc ? ' (' + conflictDisc.name + ')' : '')
            };
        }
    }
    
    // Add the class
    for (var h = hour; h < hour + dur && h <= 23; h++) {
        if (!schedule[day]) schedule[day] = {};
        schedule[day][h] = disciplineId;
        if (instructorId) {
            setClassInstructor(studentId, week, day, h, instructorId);
        }
        if (h === hour) {
            setClassDuration(studentId, week, day, h, dur);
        }
        // Set group label on the class
        setClassGroupLabel(studentId, week, day, h, 'G-' + instructorId + '-' + day + '-' + hour);
    }
    
    return { success: true, message: 'Class added successfully.' };
}

/**
 * Resolve conflicts by removing conflicting students from the group
 * Or by removing their conflicting classes
 */
function resolveAutoGroupConflicts(disciplineId, instructorId, day, hour, week, resolveAction) {
    var group = getAutoGroupForSlot(disciplineId, instructorId, day, hour);
    if (!group) {
        return { success: false, message: 'Group not found.' };
    }
    
    var weekNum = parseInt(week) || 1;
    var results = [];
    var conflicts = checkAutoGroupConflicts(disciplineId, instructorId, day, hour, null, weekNum);
    
    if (conflicts.length === 0) {
        return { success: true, message: 'No conflicts to resolve.', conflicts: [] };
    }
    
    if (resolveAction === 'remove_conflicting') {
        // Remove students with conflicts from the group
        conflicts.forEach(function(c) {
            var index = group.students.indexOf(c.studentId);
            if (index !== -1) {
                group.students.splice(index, 1);
                results.push({
                    studentId: c.studentId,
                    studentName: c.studentName,
                    action: 'removed from group'
                });
            }
        });
        return { success: true, message: 'Conflicting students removed from group.', results: results };
    } else if (resolveAction === 'clear_conflicting_classes') {
        // Remove conflicting classes from students
        conflicts.forEach(function(c) {
            var schedule = getStudentSchedule(c.studentId, weekNum);
            for (var h = hour; h < hour + 1 && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    delete schedule[day][h];
                    setClassInstructor(c.studentId, weekNum, day, h, null);
                    setClassLabel(c.studentId, weekNum, day, h, null);
                    setClassGroupLabel(c.studentId, weekNum, day, h, null);
                    setClassDuration(c.studentId, weekNum, day, h, null);
                }
            }
            results.push({
                studentId: c.studentId,
                studentName: c.studentName,
                action: 'conflicting class removed'
            });
        });
        return { success: true, message: 'Conflicting classes removed.', results: results };
    }
    
    return { success: false, message: 'Invalid resolve action.' };
}

/**
 * Render the auto-groups view
 */
function renderAutoGroupsView(container) {
    if (!container) {
        container = document.getElementById('groups-content');
    }
    if (!container) return;
    
    container.innerHTML = `
        <div class="page-header">
            <h2>▣ Auto-Groups</h2>
            <div class="header-actions">
                <span style="font-size:0.7rem;color:var(--text-dim);">Groups auto-created from classes</span>
                <button id="refresh-auto-groups-btn" class="small secondary">⟳ Refresh</button>
            </div>
        </div>
        <div id="auto-groups-container">
            <p class="empty-state">No groups created yet. Groups are auto-created when classes are scheduled.</p>
        </div>
    `;
    
    renderAutoGroups();
    initAutoGroupsEvents();
}

/**
 * Render the auto-groups
 */
function renderAutoGroups() {
    var container = document.getElementById('auto-groups-container');
    if (!container) return;
    
    var allGroups = getAllAutoGroups();
    var groupKeys = Object.keys(allGroups);
    
    if (groupKeys.length === 0) {
        container.innerHTML = '<p class="empty-state">No groups created yet. Groups are auto-created when classes are scheduled.</p>';
        return;
    }
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    
    // Sort groups by discipline, then day, then hour
    groupKeys.sort(function(a, b) {
        var gA = allGroups[a];
        var gB = allGroups[b];
        if (gA.disciplineId !== gB.disciplineId) {
            var dA = getDiscipline(gA.disciplineId);
            var dB = getDiscipline(gB.disciplineId);
            return (dA ? dA.name : '') > (dB ? dB.name : '') ? 1 : -1;
        }
        if (gA.day !== gB.day) return gA.day - gB.day;
        return gA.hour - gB.hour;
    });
    
    groupKeys.forEach(function(key) {
        var group = allGroups[key];
        var discipline = getDiscipline(group.disciplineId);
        var instructor = data.characters.find(function(c) { return String(c.id) === String(group.instructorId); });
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        
        var hourDisplay = group.hour > 12 ? group.hour - 12 : group.hour;
        var ampm = group.hour >= 12 ? 'PM' : 'AM';
        if (group.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (group.hour === 12) { ampm = 'PM'; }
        
        var studentCount = group.students ? group.students.length : 0;
        var isExpanded = window.autoGroupsExpanded && window.autoGroupsExpanded[key] || false;
        
        html += '<div class="auto-group-card" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<div style="cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">';
        html += '<strong style="color:var(--accent);">' + (discipline ? discipline.name : 'Unknown') + '</strong>';
        html += ' <span style="color:var(--text-dim);font-size:0.8rem;">' + dayNames[group.day] + ' ' + hourDisplay + ':00 ' + ampm + '</span>';
        html += ' <span style="color:var(--text-dim);font-size:0.7rem;">(' + instructorName + ')</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:0.75rem;color:var(--text-dim);">' + studentCount + ' student' + (studentCount !== 1 ? 's' : '') + '</span>';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">' + (isExpanded ? '▼' : '▶') + '</span>';
        html += '</div>';
        html += '</div>';
        
        if (isExpanded) {
            html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-soft);">';
            
            // List students in this group
            if (group.students && group.students.length > 0) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
                group.students.forEach(function(id) {
                    var name = getStudentName(id);
                    html += '<span class="student-tag" style="background:var(--bg);padding:2px 10px;border-radius:12px;font-size:0.75rem;border:1px solid var(--border-soft);">' + name;
                    html += ' <button class="remove-from-auto-group-btn small" data-key="' + key + '" data-student="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;">✕</button>';
                    html += '</span>';
                });
                html += '</div>';
            } else {
                html += '<div style="color:var(--text-dim);font-size:0.75rem;margin-bottom:8px;">No students in this group</div>';
            }
            
            // Add student dropdown
            var allStudents = getStudents();
            var availableStudents = allStudents.filter(function(s) {
                return !group.students || group.students.indexOf(s.id) === -1;
            });
            
            if (availableStudents.length > 0) {
                html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
                html += '<select class="add-to-auto-group-select" data-key="' + key + '" style="flex:1;min-width:120px;padding:4px 8px;font-size:0.75rem;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;">';
                html += '<option value="">Add student...</option>';
                availableStudents.forEach(function(s) {
                    var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                    html += '<option value="' + s.id + '">' + name + '</option>';
                });
                html += '</select>';
                html += '<button class="add-to-auto-group-btn small primary" data-key="' + key + '" style="font-size:0.65rem;padding:2px 8px;">Add</button>';
                html += '</div>';
            } else {
                html += '<div style="color:var(--text-dim);font-size:0.75rem;">All students are in this group</div>';
            }
            
            // Show class slot info
            html += '<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-soft);font-size:0.7rem;color:var(--text-dim);">';
            html += 'Class: ' + (discipline ? discipline.name : 'Unknown') + ' | Instructor: ' + instructorName;
            html += ' | Time: ' + dayNames[group.day] + ' ' + hourDisplay + ':00 ' + ampm;
            html += '</div>';
            
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners for add/remove
    container.querySelectorAll('.add-to-auto-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = this.dataset.key;
            var select = this.parentElement.querySelector('.add-to-auto-group-select');
            var studentId = select.value;
            if (!studentId) {
                alert('Please select a student.');
                return;
            }
            
            var allGroups = getAllAutoGroups();
            var group = allGroups[key];
            if (!group) {
                alert('Group not found.');
                return;
            }
            
            // Check if student already in group
            if (group.students.indexOf(studentId) !== -1) {
                alert('Student already in this group.');
                return;
            }
            
            // Check if student is in another group for this discipline
            var existingGroup = getStudentAutoGroup(studentId, group.disciplineId);
            if (existingGroup && existingGroup.id !== key) {
                if (!confirm('Student is in group "' + existingGroup.displayName + '" for this discipline. Move to "' + group.displayName + '"?')) {
                    return;
                }
                // Remove from old group
                var idx = existingGroup.students.indexOf(studentId);
                if (idx !== -1) {
                    existingGroup.students.splice(idx, 1);
                }
            }
            
            // Add student to group
            group.students.push(studentId);
            
            // Add the class to the student
            var weekNum = 1; // Default to week 1
            var result = addClassToStudent(
                studentId,
                group.disciplineId,
                weekNum,
                group.day,
                group.hour,
                1,
                group.instructorId
            );
            
            if (result.success) {
                saveData().then(function() {
                    if (typeof logActivity === 'function') {
                        logActivity('Added student to auto-group: ' + group.displayName);
                    }
                    renderAutoGroups();
                    if (typeof renderSchedule === 'function') {
                        renderSchedule();
                    }
                    alert('Student added to group and class assigned!');
                }).catch(function(err) {
                    console.error('Failed to save:', err);
                    alert('Failed to save changes.');
                });
            } else {
                // If class assignment failed, remove from group
                var idx = group.students.indexOf(studentId);
                if (idx !== -1) group.students.splice(idx, 1);
                alert('Failed to add class: ' + result.message);
            }
        });
    });
    
    container.querySelectorAll('.remove-from-auto-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = this.dataset.key;
            var studentId = this.dataset.student;
            
            if (!confirm('Remove this student from the group? This will remove their class from this time slot.')) return;
            
            var allGroups = getAllAutoGroups();
            var group = allGroups[key];
            if (!group) return;
            
            var idx = group.students.indexOf(studentId);
            if (idx !== -1) {
                group.students.splice(idx, 1);
            }
            
            // Remove the class from the student's schedule
            var weekNum = 1;
            var schedule = getStudentSchedule(studentId, weekNum);
            for (var h = group.hour; h < group.hour + 1 && h <= 23; h++) {
                if (schedule[group.day] && schedule[group.day][h]) {
                    delete schedule[group.day][h];
                }
            }
            
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Removed student from auto-group: ' + group.displayName);
                }
                renderAutoGroups();
                if (typeof renderSchedule === 'function') {
                    renderSchedule();
                }
                alert('Student removed from group and class removed.');
            }).catch(function(err) {
                console.error('Failed to save:', err);
                alert('Failed to save changes.');
            });
        });
    });
}

/**
 * Toggle auto-group expansion
 */
function toggleAutoGroup(key) {
    if (!window.autoGroupsExpanded) {
        window.autoGroupsExpanded = {};
    }
    window.autoGroupsExpanded[key] = !window.autoGroupsExpanded[key];
    renderAutoGroups();
}

/**
 * Initialize auto-groups events
 */
function initAutoGroupsEvents() {
    var refreshBtn = document.getElementById('refresh-auto-groups-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            renderAutoGroups();
        });
    }
}

// Make functions globally available
window.renderAutoGroupsView = renderAutoGroupsView;
window.renderAutoGroups = renderAutoGroups;
window.getAllAutoGroups = getAllAutoGroups;
window.getAutoGroupsForDiscipline = getAutoGroupsForDiscipline;
window.getAutoGroupsForInstructor = getAutoGroupsForInstructor;
window.getStudentAutoGroup = getStudentAutoGroup;
window.isStudentInAutoGroup = isStudentInAutoGroup;
window.addStudentToAutoGroup = addStudentToAutoGroup;
window.removeStudentFromAutoGroup = removeStudentFromAutoGroup;
window.getStudentsInAutoGroup = getStudentsInAutoGroup;
window.getAutoGroupForSlot = getAutoGroupForSlot;
window.getOrCreateAutoGroup = getOrCreateAutoGroup;
window.autoAssignStudentToGroupAndClass = autoAssignStudentToGroupAndClass;
window.addClassToStudent = addClassToStudent;
window.checkAutoGroupConflicts = checkAutoGroupConflicts;
window.resolveAutoGroupConflicts = resolveAutoGroupConflicts;
window.toggleAutoGroup = toggleAutoGroup;
window.generateGroupKey = generateGroupKey;
window.generateGroupDisplayName = generateGroupDisplayName;
window.getStudentName = getStudentName;
window.initAutoGroupsEvents = initAutoGroupsEvents;
window.autoGroupsExpanded = {};
