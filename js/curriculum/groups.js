/**
 * groups.js - Auto-Group Management
 * Groups are automatically created based on class slots (discipline + instructor + time)
 * Group name format: [Discipline] ([Instructor]) - [Day] [Time]
 */

/**
 * Generate a group key from class slot data
 */
function generateGroupKey(disciplineId, instructorId, week, day, hour) {
    var discipline = getDiscipline(disciplineId);
    var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
    
    var disciplineName = discipline ? discipline.name : 'Unknown';
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    
    var shortInstructor = instructorName;
    if (instructor) {
        var parts = instructorName.split(' ');
        if (parts.length >= 2) {
            shortInstructor = parts[0][0] + '. ' + parts[parts.length - 1];
        } else {
            shortInstructor = instructorName;
        }
    }
    
    var timeStr = dayNames[day] + ' ' + hourDisplay + ampm;
    return {
        key: disciplineId + '_' + instructorId + '_' + week + '_' + day + '_' + hour,
        displayName: disciplineName + ' (' + shortInstructor + ') - ' + timeStr,
        disciplineId: disciplineId,
        instructorId: instructorId,
        week: week,
        day: day,
        hour: hour
    };
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
 * Get a group by its key
 */
function getGroupByKey(key) {
    var groups = getAllAutoGroups();
    return groups[key] || null;
}

/**
 * Get or create a group for a class slot
 */
function getOrCreateGroup(disciplineId, instructorId, week, day, hour) {
    var groupInfo = generateGroupKey(disciplineId, instructorId, week, day, hour);
    var groups = getAllAutoGroups();
    
    if (!groups[groupInfo.key]) {
        groups[groupInfo.key] = {
            id: groupInfo.key,
            disciplineId: disciplineId,
            instructorId: instructorId,
            week: week,
            day: day,
            hour: hour,
            displayName: groupInfo.displayName,
            students: [],
            createdAt: new Date().toISOString()
        };
    }
    
    return groups[groupInfo.key];
}

/**
 * Add a student to a group (auto-adds them to the class slot)
 */
function addStudentToGroup(groupKey, studentId) {
    var groups = getAllAutoGroups();
    var group = groups[groupKey];
    if (!group) return false;
    
    if (group.students.indexOf(studentId) === -1) {
        group.students.push(studentId);
        group.students.sort();
    }
    
    // Auto-add student to the class slot
    var result = addStudentToClassSlot(studentId, group.disciplineId, group.week, group.day, group.hour, group.instructorId);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return result;
}

/**
 * Remove a student from a group
 */
function removeStudentFromGroup(groupKey, studentId) {
    var groups = getAllAutoGroups();
    var group = groups[groupKey];
    if (!group) return false;
    
    var idx = group.students.indexOf(studentId);
    if (idx !== -1) {
        group.students.splice(idx, 1);
    }
    
    // Remove student from the class slot
    removeStudentFromClassSlot(studentId, group.week, group.day, group.hour);
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return true;
}

/**
 * Add a student to a class slot
 */
function addStudentToClassSlot(studentId, disciplineId, week, day, hour, instructorId) {
    var schedule = getStudentSchedule(studentId, week);
    var duration = 1;
    
    // Check for conflict
    for (var h = hour; h < hour + duration && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            return { success: false, message: 'Student already has a class at this time.' };
        }
    }
    
    // Add the class
    for (var h = hour; h < hour + duration && h <= 23; h++) {
        if (!schedule[day]) schedule[day] = {};
        schedule[day][h] = disciplineId;
        if (instructorId) {
            setClassInstructor(studentId, week, day, h, instructorId);
        }
        if (h === hour) {
            setClassDuration(studentId, week, day, h, duration);
        }
    }
    
    // Add to group if not already
    var groupInfo = generateGroupKey(disciplineId, instructorId, week, day, hour);
    var groups = getAllAutoGroups();
    if (groups[groupInfo.key]) {
        var group = groups[groupInfo.key];
        if (group.students.indexOf(studentId) === -1) {
            group.students.push(studentId);
            group.students.sort();
        }
    } else {
        // Create group
        var group = getOrCreateGroup(disciplineId, instructorId, week, day, hour);
        group.students.push(studentId);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return { success: true, message: 'Student added to class and group.' };
}

/**
 * Remove a student from a class slot
 */
function removeStudentFromClassSlot(studentId, week, day, hour) {
    var schedule = getStudentSchedule(studentId, week);
    var duration = getClassDuration(studentId, week, day, hour) || 1;
    
    for (var h = hour; h < hour + duration && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            delete schedule[day][h];
            setClassInstructor(studentId, week, day, h, null);
            setClassLabel(studentId, week, day, h, null);
            setClassGroupLabel(studentId, week, day, h, null);
            setClassDuration(studentId, week, day, h, null);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
}

/**
 * Get all students in a group
 */
function getStudentsInGroup(groupKey) {
    var groups = getAllAutoGroups();
    var group = groups[groupKey];
    if (!group) return [];
    return group.students.slice();
}

/**
 * Get groups for a discipline
 */
function getGroupsForDiscipline(disciplineId) {
    var groups = getAllAutoGroups();
    var result = {};
    for (var key in groups) {
        if (String(groups[key].disciplineId) === String(disciplineId)) {
            result[key] = groups[key];
        }
    }
    return result;
}

/**
 * Get groups for an instructor
 */
function getGroupsForInstructor(instructorId) {
    var groups = getAllAutoGroups();
    var result = {};
    for (var key in groups) {
        if (String(groups[key].instructorId) === String(instructorId)) {
            result[key] = groups[key];
        }
    }
    return result;
}

/**
 * Get the group a student belongs to for a specific discipline and time
 */
function getStudentGroup(studentId, disciplineId, week, day, hour) {
    var groups = getAllAutoGroups();
    for (var key in groups) {
        var group = groups[key];
        if (String(group.disciplineId) === String(disciplineId) &&
            group.week === week &&
            group.day === day &&
            group.hour === hour &&
            group.students.indexOf(studentId) !== -1) {
            return group;
        }
    }
    return null;
}

/**
 * Rebuild groups from existing schedules
 */
function rebuildGroupsFromSchedules() {
    data.curriculum.autoGroups = {};
    
    var students = getStudents();
    
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
                    
                    // Get or create group for this slot
                    var groupInfo = generateGroupKey(disciplineId, instructorId, weekNum, dayNum, hourNum);
                    var groups = getAllAutoGroups();
                    
                    if (!groups[groupInfo.key]) {
                        groups[groupInfo.key] = {
                            id: groupInfo.key,
                            disciplineId: disciplineId,
                            instructorId: instructorId,
                            week: weekNum,
                            day: dayNum,
                            hour: hourNum,
                            displayName: groupInfo.displayName,
                            students: [],
                            createdAt: new Date().toISOString()
                        };
                    }
                    
                    var group = groups[groupInfo.key];
                    if (group.students.indexOf(studentId) === -1) {
                        group.students.push(studentId);
                        group.students.sort();
                    }
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
                <span style="font-size:0.7rem;color:var(--text-dim);">Groups auto-created from class slots</span>
                <button id="refresh-auto-groups-btn" class="small secondary">⟳ Refresh</button>
                <button id="rebuild-auto-groups-btn" class="small primary">⟳ Rebuild Groups</button>
            </div>
        </div>
        <div class="filter-section">
            <label for="group-filter-discipline">Filter:</label>
            <select id="group-filter-discipline" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                <option value="all">All Disciplines</option>
            </select>
            <label for="group-filter-instructor" style="margin-left:8px;">Instructor:</label>
            <select id="group-filter-instructor" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                <option value="all">All Instructors</option>
            </select>
        </div>
        <div id="auto-groups-container">
            <p class="empty-state">No groups created yet. Groups are auto-created when students are assigned to classes.</p>
        </div>
    `;
    
    populateGroupFilters();
    renderAutoGroups();
    initAutoGroupsEvents();
}

/**
 * Populate group filters
 */
function populateGroupFilters() {
    var disciplineSelect = document.getElementById('group-filter-discipline');
    var instructorSelect = document.getElementById('group-filter-instructor');
    
    if (disciplineSelect) {
        var disciplines = data.curriculum.disciplines || [];
        disciplineSelect.innerHTML = '<option value="all">All Disciplines</option>';
        disciplines.forEach(function(d) {
            var option = document.createElement('option');
            option.value = d.id;
            option.textContent = d.name;
            disciplineSelect.appendChild(option);
        });
    }
    
    if (instructorSelect) {
        var instructors = [];
        if (typeof getInstructors === 'function') {
            instructors = getInstructors();
        }
        instructorSelect.innerHTML = '<option value="all">All Instructors</option>';
        instructors.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            var option = document.createElement('option');
            option.value = c.id;
            option.textContent = name;
            instructorSelect.appendChild(option);
        });
    }
}

/**
 * Render the auto-groups
 */
function renderAutoGroups() {
    var container = document.getElementById('auto-groups-container');
    if (!container) return;
    
    var disciplineFilter = document.getElementById('group-filter-discipline')?.value || 'all';
    var instructorFilter = document.getElementById('group-filter-instructor')?.value || 'all';
    
    var groups = getAllAutoGroups();
    var groupKeys = Object.keys(groups);
    
    // Filter groups
    if (disciplineFilter !== 'all') {
        groupKeys = groupKeys.filter(function(key) {
            return String(groups[key].disciplineId) === String(disciplineFilter);
        });
    }
    if (instructorFilter !== 'all') {
        groupKeys = groupKeys.filter(function(key) {
            return String(groups[key].instructorId) === String(instructorFilter);
        });
    }
    
    if (groupKeys.length === 0) {
        container.innerHTML = '<p class="empty-state">No groups found. Groups are auto-created when students are assigned to classes.</p>';
        return;
    }
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Sort groups by display name
    groupKeys.sort(function(a, b) {
        return (groups[a].displayName || a).localeCompare(groups[b].displayName || b);
    });
    
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    
    groupKeys.forEach(function(key) {
        var group = groups[key];
        var discipline = getDiscipline(group.disciplineId);
        var instructor = data.characters.find(function(c) { return String(c.id) === String(group.instructorId); });
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var studentCount = group.students ? group.students.length : 0;
        var isExpanded = window.autoGroupsExpanded && window.autoGroupsExpanded[key] || false;
        
        var hourDisplay = group.hour > 12 ? group.hour - 12 : group.hour;
        var ampm = group.hour >= 12 ? 'PM' : 'AM';
        if (group.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (group.hour === 12) { ampm = 'PM'; }
        
        html += '<div class="auto-group-card" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<div style="cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">';
        html += '<strong style="color:var(--accent);">' + group.displayName + '</strong>';
        html += ' <span style="color:var(--text-dim);font-size:0.75rem;">(' + studentCount + ' students)</span>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        html += '<span style="font-size:0.7rem;color:var(--text-dim);cursor:pointer;" onclick="window.toggleAutoGroup(\'' + key + '\')">' + (isExpanded ? '▼' : '▶') + '</span>';
        html += '</div>';
        html += '</div>';
        
        if (isExpanded) {
            html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-soft);">';
            
            html += '<div style="margin-bottom:8px;font-size:0.75rem;color:var(--text-dim);">';
            html += 'Week ' + group.week + ' • ' + dayNames[group.day] + ' ' + hourDisplay + ':00 ' + ampm;
            html += ' • Instructor: ' + instructorName;
            html += '</div>';
            
            // List students in this group
            if (group.students && group.students.length > 0) {
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">';
                html += '<span style="font-size:0.7rem;color:var(--text-dim);">Students:</span> ';
                group.students.forEach(function(id) {
                    var student = data.characters.find(function(c) { return String(c.id) === String(id); });
                    var name = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    html += '<span class="student-tag" style="background:var(--bg);padding:2px 10px;border-radius:12px;font-size:0.7rem;border:1px solid var(--border-soft);">' + name;
                    html += ' <button class="remove-from-group-btn small" data-key="' + key + '" data-student="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.5rem;padding:0 2px;">✕</button>';
                    html += '</span>';
                });
                html += '</div>';
            } else {
                html += '<div style="color:var(--text-dim);font-size:0.75rem;margin-bottom:8px;">No students in this group</div>';
            }
            
            // Add student to group dropdown
            html += '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">';
            html += '<span style="font-size:0.7rem;color:var(--text-dim);">Add student:</span>';
            html += '<select class="add-student-to-group-select" data-key="' + key + '" style="flex:1;min-width:120px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 6px;font-size:0.7rem;">';
            html += '<option value="">Select student...</option>';
            
            // Get all students not already in this group
            var allStudents = getStudents();
            allStudents.forEach(function(s) {
                if (group.students.indexOf(s.id) === -1) {
                    var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                    html += '<option value="' + s.id + '">' + name + '</option>';
                }
            });
            html += '</select>';
            html += '<button class="add-student-to-group-btn small primary" data-key="' + key + '">Add</button>';
            html += '</div>';
            
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners
    container.querySelectorAll('.remove-from-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = this.dataset.key;
            var studentId = this.dataset.student;
            
            if (!confirm('Remove this student from the group and class?')) return;
            
            var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
            var name = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
            
            removeStudentFromGroup(key, studentId);
            renderAutoGroups();
            if (typeof renderStudentSchedule === 'function') {
                renderStudentSchedule();
            }
            if (typeof renderInstructorCalendarData === 'function') {
                renderInstructorCalendarData();
            }
            alert('Removed ' + name + ' from group and class.');
        });
    });
    
    container.querySelectorAll('.add-student-to-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = this.dataset.key;
            var select = this.parentElement.querySelector('.add-student-to-group-select');
            var studentId = select.value;
            
            if (!studentId) {
                alert('Please select a student.');
                return;
            }
            
            var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
            var name = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
            
            var result = addStudentToGroup(key, studentId);
            if (result && result.success) {
                renderAutoGroups();
                if (typeof renderStudentSchedule === 'function') {
                    renderStudentSchedule();
                }
                if (typeof renderInstructorCalendarData === 'function') {
                    renderInstructorCalendarData();
                }
                alert('Added ' + name + ' to group and class.');
            } else {
                alert('Failed to add student: ' + (result ? result.message : 'Unknown error'));
            }
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
            if (confirm('Rebuild all groups from existing schedules? This will recreate all groups based on current student assignments.')) {
                rebuildGroupsFromSchedules();
                renderAutoGroups();
                alert('Groups rebuilt successfully!');
            }
        });
    }
    
    var disciplineFilter = document.getElementById('group-filter-discipline');
    if (disciplineFilter) {
        disciplineFilter.addEventListener('change', function() {
            renderAutoGroups();
        });
    }
    
    var instructorFilter = document.getElementById('group-filter-instructor');
    if (instructorFilter) {
        instructorFilter.addEventListener('change', function() {
            renderAutoGroups();
        });
    }
}

// Make functions globally available
window.renderAutoGroupsView = renderAutoGroupsView;
window.renderAutoGroups = renderAutoGroups;
window.getAllAutoGroups = getAllAutoGroups;
window.getGroupByKey = getGroupByKey;
window.getOrCreateGroup = getOrCreateGroup;
window.getOrCreateGroupForStudent = getOrCreateGroupForStudent;
window.addStudentToGroup = addStudentToGroup;
window.removeStudentFromGroup = removeStudentFromGroup;
window.addStudentToClassSlot = addStudentToClassSlot;
window.removeStudentFromClassSlot = removeStudentFromClassSlot;
window.getStudentsInGroup = getStudentsInGroup;
window.getGroupsForDiscipline = getGroupsForDiscipline;
window.getGroupsForInstructor = getGroupsForInstructor;
window.getStudentGroup = getStudentGroup;
window.generateGroupKey = generateGroupKey;
window.rebuildGroupsFromSchedules = rebuildGroupsFromSchedules;
window.toggleAutoGroup = toggleAutoGroup;
window.initAutoGroupsEvents = initAutoGroupsEvents;
window.populateGroupFilters = populateGroupFilters;
window.autoGroupsExpanded = {};
