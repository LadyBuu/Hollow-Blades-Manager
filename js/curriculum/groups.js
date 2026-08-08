/**
 * groups.js - Auto-Group Management
 * Groups are created based on the SET of students assigned to a discipline
 * If the same set of students has multiple time slots, they are ONE group
 * Group name is based on the earliest time slot
 */

/**
 * Get all students assigned to a specific class slot
 */
function getStudentsInClassSlot(week, day, hour) {
    var students = getStudents();
    var result = [];
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, week);
        if (schedule[day] && schedule[day][hour]) {
            result.push(student.id);
        }
    });
    
    return result;
}

/**
 * Get the instructor for a specific slot
 */
function getSlotInstructor(disciplineId, week, day, hour) {
    // Check instructor templates
    if (data.curriculum.instructorTemplates) {
        for (var instructorId in data.curriculum.instructorTemplates) {
            var templateKey = instructorId + '_' + week;
            if (data.curriculum.instructorTemplates[templateKey]) {
                var slotKey = day + '_' + hour;
                var slotData = data.curriculum.instructorTemplates[templateKey][slotKey];
                if (slotData && String(slotData.disciplineId) === String(disciplineId)) {
                    return instructorId;
                }
            }
        }
    }
    return null;
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
 * Get all slots for a group (from instructor templates)
 * This scans all instructor templates to find slots for this discipline
 */
function getSlotsForGroup(disciplineId, instructorId) {
    var slots = [];
    if (!data.curriculum.instructorTemplates) return slots;
    
    // Check all weeks for this instructor
    for (var weekKey in data.curriculum.instructorTemplates) {
        var parts = weekKey.split('_');
        if (parts[0] === instructorId) {
            var weekNum = parseInt(parts[1]);
            if (!isNaN(weekNum)) {
                var template = data.curriculum.instructorTemplates[weekKey];
                for (var slotKey in template) {
                    var slotData = template[slotKey];
                    if (String(slotData.disciplineId) === String(disciplineId)) {
                        var slotParts = slotKey.split('_');
                        var day = parseInt(slotParts[0]);
                        var hour = parseInt(slotParts[1]);
                        slots.push({
                            week: weekNum,
                            day: day,
                            hour: hour,
                            duration: slotData.duration || 1,
                            label: slotData.label || '',
                            groupLabel: slotData.groupLabel || ''
                        });
                    }
                }
            }
        }
    }
    
    return slots;
}

/**
 * Update group display name from its slots
 */
function updateGroupDisplayName(group) {
    var discipline = getDiscipline(group.disciplineId);
    var disciplineName = discipline ? discipline.name : 'Unknown';
    
    var instructor = data.characters.find(function(c) { 
        // Find instructor from the first slot if available
        if (group.slots && group.slots.length > 0) {
            var slot = group.slots[0];
            var instructorId = getSlotInstructor(group.disciplineId, slot.week, slot.day, slot.hour);
            if (instructorId) {
                return String(c.id) === String(instructorId);
            }
        }
        return false;
    });
    
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    var shortInstructor = instructorName;
    if (instructor) {
        var parts = instructorName.split(' ');
        if (parts.length >= 2) {
            shortInstructor = parts[0][0] + '. ' + parts[parts.length - 1];
        } else {
            shortInstructor = instructorName;
        }
    }
    
    var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var timeDisplay = '';
    if (group.slots && group.slots.length > 0) {
        var firstSlot = group.slots[0];
        var hourDisplay = firstSlot.hour > 12 ? firstSlot.hour - 12 : firstSlot.hour;
        var ampm = firstSlot.hour >= 12 ? 'PM' : 'AM';
        if (firstSlot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (firstSlot.hour === 12) { ampm = 'PM'; }
        timeDisplay = dayNames[firstSlot.day] + ' ' + hourDisplay + ampm;
    }
    
    group.displayName = disciplineName + ' (' + shortInstructor + ') - ' + timeDisplay;
}

/**
 * Add a slot to a group and update display name
 */
function addSlotToGroup(group, week, day, hour, duration, label) {
    var slotKey = week + '_' + day + '_' + hour;
    
    // Check if slot already exists
    var exists = false;
    for (var i = 0; i < group.slots.length; i++) {
        if (group.slots[i].week === week && 
            group.slots[i].day === day && 
            group.slots[i].hour === hour) {
            exists = true;
            break;
        }
    }
    
    if (!exists) {
        group.slots.push({
            week: week,
            day: day,
            hour: hour,
            duration: duration || 1,
            label: label || ''
        });
        
        // Sort slots by day then hour
        group.slots.sort(function(a, b) {
            if (a.day !== b.day) return a.day - b.day;
            return a.hour - b.hour;
        });
        
        // Update display name based on earliest slot
        updateGroupDisplayName(group);
    }
}

/**
 * Get or create an auto-group for a specific discipline + set of students
 */
function getOrCreateAutoGroupForStudents(disciplineId, studentIds) {
    if (!data.curriculum.autoGroups) {
        data.curriculum.autoGroups = {};
    }
    
    var sortedIds = studentIds.slice().sort();
    var key = disciplineId + '_' + sortedIds.join('_');
    
    if (!data.curriculum.autoGroups[key]) {
        data.curriculum.autoGroups[key] = {
            id: key,
            disciplineId: disciplineId,
            students: sortedIds,
            slots: [],
            displayName: '',
            createdAt: new Date().toISOString()
        };
    }
    
    return data.curriculum.autoGroups[key];
}

/**
 * Get or create a group for a student assignment
 * This is called when assigning a student to a class
 */
function getOrCreateGroupForStudent(disciplineId, studentId, week, day, hour, instructorId) {
    // Get all students in this class slot
    var studentsInSlot = getStudentsInClassSlot(week, day, hour);
    var allStudentsInGroup = studentsInSlot.slice();
    
    // Add the new student if not already in the list
    if (allStudentsInGroup.indexOf(studentId) === -1) {
        allStudentsInGroup.push(studentId);
    }
    
    // Check if a group already exists with exactly these students
    var allGroups = getAllAutoGroups();
    var sortedNewStudents = allStudentsInGroup.slice().sort();
    var newKey = disciplineId + '_' + sortedNewStudents.join('_');
    
    // First check if a group with these exact students exists
    if (allGroups[newKey]) {
        var group = allGroups[newKey];
        // Add this slot to the group
        addSlotToGroup(group, week, day, hour);
        return group;
    }
    
    // Check if a group exists with a subset of these students
    // (Student is joining an existing group)
    for (var key in allGroups) {
        var group = allGroups[key];
        if (group.disciplineId === disciplineId) {
            var existingStudents = group.students;
            var isSubset = true;
            for (var i = 0; i < existingStudents.length; i++) {
                if (allStudentsInGroup.indexOf(existingStudents[i]) === -1) {
                    isSubset = false;
                    break;
                }
            }
            if (isSubset && existingStudents.length > 0) {
                // Student is joining this group
                // Add the new student to the group
                if (group.students.indexOf(studentId) === -1) {
                    group.students.push(studentId);
                    group.students.sort();
                }
                addSlotToGroup(group, week, day, hour);
                return group;
            }
        }
    }
    
    // No existing group found - create a new one
    var newGroup = getOrCreateAutoGroupForStudents(disciplineId, allStudentsInGroup);
    addSlotToGroup(newGroup, week, day, hour);
    return newGroup;
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
        setClassGroupLabel(studentId, week, day, h, 'auto-group');
    }
    
    return { success: true, message: 'Class added successfully.' };
}

/**
 * Rebuild groups from existing schedules
 */
function rebuildGroupsFromSchedules() {
    // Clear existing auto-groups
    data.curriculum.autoGroups = {};
    
    var students = getStudents();
    var groupsMap = {};
    
    // For each student, check their schedule
    students.forEach(function(student) {
        var studentId = student.id;
        var schedule = data.curriculum.schedules[studentId];
        if (!schedule) return;
        
        for (var week in schedule) {
            var weekNum = parseInt(week);
            if (isNaN(weekNum)) continue;
            
            for (var day in schedule[weekNum]) {
                var dayNum = parseInt(day);
                if (isNaN(dayNum)) continue;
                
                for (var hour in schedule[weekNum][dayNum]) {
                    var hourNum = parseInt(hour);
                    if (isNaN(hourNum)) continue;
                    
                    var disciplineId = schedule[weekNum][dayNum][hourNum];
                    if (!disciplineId) continue;
                    
                    var instructorId = getClassInstructor(studentId, weekNum, dayNum, hourNum);
                    if (!instructorId) continue;
                    
                    // Get all students in this slot
                    var studentsInSlot = getStudentsInClassSlot(weekNum, dayNum, hourNum);
                    
                    // Create or get group for these students
                    var group = getOrCreateGroupForStudent(disciplineId, studentId, weekNum, dayNum, hourNum, instructorId);
                    
                    // Store the group key for this student+discipline
                    var key = studentId + '_' + disciplineId;
                    groupsMap[key] = group.id;
                }
            }
        }
    });
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
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
                <span style="font-size:0.7rem;color:var(--text-dim);">Groups auto-created from student assignments</span>
                <button id="refresh-auto-groups-btn" class="small secondary">⟳ Refresh</button>
                <button id="rebuild-auto-groups-btn" class="small primary">⟳ Rebuild Groups</button>
            </div>
        </div>
        <div id="auto-groups-container">
            <p class="empty-state">No groups created yet. Groups are auto-created when students are assigned to classes.</p>
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
    
    // Rebuild groups from existing schedules first
    rebuildGroupsFromSchedules();
    
    var allGroups = getAllAutoGroups();
    var groupKeys = Object.keys(allGroups);
    
    if (groupKeys.length === 0) {
        container.innerHTML = '<p class="empty-state">No groups created yet. Groups are auto-created when students are assigned to classes.</p>';
        return;
    }
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    
    // Sort groups by display name
    groupKeys.sort(function(a, b) {
        return (allGroups[a].displayName || a).localeCompare(allGroups[b].displayName || b);
    });
    
    groupKeys.forEach(function(key) {
        var group = allGroups[key];
        var discipline = getDiscipline(group.disciplineId);
        var instructor = data.characters.find(function(c) { 
            // Find instructor from the first slot
            if (group.slots && group.slots.length > 0) {
                var slot = group.slots[0];
                var instructorId = getSlotInstructor(group.disciplineId, slot.week, slot.day, slot.hour);
                if (instructorId) {
                    return String(c.id) === String(instructorId);
                }
            }
            return false;
        });
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        
        var studentCount = group.students ? group.students.length : 0;
        var slotCount = group.slots ? group.slots.length : 0;
        var isExpanded = window.autoGroupsExpanded && window.autoGroupsExpanded[key] || false;
        
        html += '<div class="auto-group-card" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<div style="cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">';
        html += '<strong style="color:var(--accent);">' + (group.displayName || (discipline ? discipline.name : 'Unknown')) + '</strong>';
        html += ' <span style="color:var(--text-dim);font-size:0.75rem;">(' + studentCount + ' students, ' + slotCount + ' slots)</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">' + (isExpanded ? '▼' : '▶') + '</span>';
        html += '</div>';
        html += '</div>';
        
        if (isExpanded) {
            html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-soft);">';
            
            // Show slots
            if (group.slots && group.slots.length > 0) {
                html += '<div style="margin-bottom:8px;">';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">Class Times:</span><br>';
                group.slots.forEach(function(slot) {
                    var hourDisplay = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                    var ampm = slot.hour >= 12 ? 'PM' : 'AM';
                    if (slot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                    if (slot.hour === 12) { ampm = 'PM'; }
                    var durationDisplay = slot.duration > 1 ? ' (' + slot.duration + 'h)' : '';
                    var labelDisplay = slot.label ? ' [' + slot.label + ']' : '';
                    html += '<span style="background:var(--bg);padding:2px 8px;border-radius:10px;font-size:0.7rem;margin:2px;display:inline-block;border:1px solid var(--border-soft);">';
                    html += 'Week ' + slot.week + ' - ' + dayNames[slot.day] + ' ' + hourDisplay + ':00 ' + ampm + durationDisplay + labelDisplay;
                    html += '</span>';
                });
                html += '</div>';
            }
            
            // List students in this group
            if (group.students && group.students.length > 0) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">Students:</span> ';
                group.students.forEach(function(id) {
                    var name = getStudentName(id);
                    html += '<span class="student-tag" style="background:var(--bg);padding:2px 10px;border-radius:12px;font-size:0.7rem;border:1px solid var(--border-soft);">' + name;
                    html += ' <button class="remove-from-auto-group-btn small" data-key="' + key + '" data-student="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.5rem;padding:0 2px;">✕</button>';
                    html += '</span>';
                });
                html += '</div>';
            } else {
                html += '<div style="color:var(--text-dim);font-size:0.75rem;margin-bottom:8px;">No students in this group</div>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners for remove buttons
    container.querySelectorAll('.remove-from-auto-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = this.dataset.key;
            var studentId = this.dataset.student;
            
            if (!confirm('Remove this student from the group? This will remove them from ALL class slots in this group.')) return;
            
            var allGroups = getAllAutoGroups();
            var group = allGroups[key];
            if (!group) return;
            
            var idx = group.students.indexOf(studentId);
            if (idx !== -1) {
                group.students.splice(idx, 1);
            }
            
            // Remove the student from all slots in this group
            if (group.slots) {
                group.slots.forEach(function(slot) {
                    var schedule = getStudentSchedule(studentId, slot.week);
                    for (var h = slot.hour; h < slot.hour + (slot.duration || 1) && h <= 23; h++) {
                        if (schedule[slot.day] && schedule[slot.day][h]) {
                            delete schedule[slot.day][h];
                            setClassInstructor(studentId, slot.week, slot.day, h, null);
                            setClassLabel(studentId, slot.week, slot.day, h, null);
                            setClassGroupLabel(studentId, slot.week, slot.day, h, null);
                            setClassDuration(studentId, slot.week, slot.day, h, null);
                        }
                    }
                });
            }
            
            // If group is empty, keep it (might get students later)
            
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Removed student from auto-group: ' + group.displayName);
                }
                renderAutoGroups();
                if (typeof renderSchedule === 'function') {
                    renderSchedule();
                }
                alert('Student removed from group and all their classes for this discipline.');
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
    
    var rebuildBtn = document.getElementById('rebuild-auto-groups-btn');
    if (rebuildBtn) {
        rebuildBtn.addEventListener('click', function() {
            if (confirm('Rebuild all groups from existing schedules? This will recreate all auto-groups based on current student assignments.')) {
                rebuildGroupsFromSchedules();
                renderAutoGroups();
                alert('Groups rebuilt successfully!');
            }
        });
    }
}

// Make functions globally available
window.renderAutoGroupsView = renderAutoGroupsView;
window.renderAutoGroups = renderAutoGroups;
window.getAllAutoGroups = getAllAutoGroups;
window.getAutoGroupsForDiscipline = getAutoGroupsForDiscipline;
window.getStudentAutoGroup = getStudentAutoGroup;
window.isStudentInAutoGroup = isStudentInAutoGroup;
window.getOrCreateGroupForStudent = getOrCreateGroupForStudent;
window.getStudentsInClassSlot = getStudentsInClassSlot;
window.getSlotInstructor = getSlotInstructor;
window.getSlotsForGroup = getSlotsForGroup;
window.addSlotToGroup = addSlotToGroup;
window.updateGroupDisplayName = updateGroupDisplayName;
window.rebuildGroupsFromSchedules = rebuildGroupsFromSchedules;
window.toggleAutoGroup = toggleAutoGroup;
window.getStudentName = getStudentName;
window.initAutoGroupsEvents = initAutoGroupsEvents;
window.autoGroupsExpanded = {};
