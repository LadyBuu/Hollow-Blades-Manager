/**
 * instructor-calendar.js - Instructor Calendar Module
 * Works exactly like student calendar with the same data structure
 * Groups are created per-instructor (from the Groups tab)
 * When clicking a class slot, you can add individual students OR select a group to add all at once
 */

var instructorCalendarState = {
    currentWeek: 1,
    selectedInstructorId: null,
    activeGroupFilter: 'all',
    expandedGroups: {}
};

/**
 * Render the instructor calendar view
 */
function renderInstructorCalendar(container) {
    if (!container) {
        container = document.getElementById('instructor-calendar-content');
    }
    if (!container) return;
    
    container.innerHTML = `
        <div class="page-header">
            <h2>◷ Instructor Calendar</h2>
            <div class="header-actions">
                <button id="add-instructor-class-btn" class="primary small">+ Add Class</button>
                <button id="add-instructor-block-btn" class="secondary small">▣ Block Time</button>
            </div>
        </div>
        <div class="calendar-controls">
            <div class="instructor-selector">
                <label for="instructor-calendar-select">Instructor:</label>
                <select id="instructor-calendar-select">
                    <option value="">Select an instructor...</option>
                </select>
            </div>
            <div class="week-nav">
                <button id="prev-instructor-week" class="small">← Prev</button>
                <span id="instructor-week-display" style="font-weight:600;min-width:80px;text-align:center;">Week 1</span>
                <button id="next-instructor-week" class="small">Next →</button>
                <button id="goto-instructor-week" class="small primary">Go to Week</button>
            </div>
            <div class="group-filter">
                <label for="instructor-group-filter" style="font-size:0.7rem;color:var(--text-dim);">Group Filter:</label>
                <select id="instructor-group-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                    <option value="all">All Groups</option>
                </select>
            </div>
        </div>
        <div class="schedule-grid-wrapper" id="instructor-grid-wrapper">
            <div class="schedule-grid" id="instructor-grid">
                <div class="day-column" data-day="1">
                    <div class="day-header">Monday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="2">
                    <div class="day-header">Tuesday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="3">
                    <div class="day-header">Wednesday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="4">
                    <div class="day-header">Thursday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="5">
                    <div class="day-header">Friday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="6">
                    <div class="day-header">Saturday</div>
                    <div class="day-slots"></div>
                </div>
                <div class="day-column" data-day="7">
                    <div class="day-header">Sunday</div>
                    <div class="day-slots"></div>
                </div>
            </div>
        </div>
        <div style="margin-top:8px;font-size:0.7rem;color:var(--text-dim);text-align:center;">
            Click a slot to add class • Click a class to manage students • Right-click to remove
        </div>
        <div id="instructor-groups-container" style="margin-top:16px;"></div>
    `;
    
    populateInstructorCalendarSelector();
    populateGroupFilter();
    initInstructorCalendarEvents();
    renderInstructorCalendarData();
    renderGroupList();
}

/**
 * Populate instructor selector
 */
function populateInstructorCalendarSelector() {
    var select = document.getElementById('instructor-calendar-select');
    if (!select) return;
    
    var instructors = [];
    if (typeof getInstructors === 'function') {
        instructors = getInstructors();
    } else {
        if (data && data.characters) {
            data.characters.forEach(function(c) {
                if (c.deceased) return;
                var status = getCurrentStatus(c);
                var lowerStatus = status.toLowerCase();
                if (lowerStatus === 'instructor' || lowerStatus === 'teacher' || 
                    lowerStatus === 'professor' || lowerStatus === 'senior') {
                    instructors.push(c);
                }
            });
        }
    }
    
    var currentValue = select.value;
    select.innerHTML = '<option value="">Select an instructor...</option>';
    
    if (!instructors || instructors.length === 0) {
        select.innerHTML += '<option value="" disabled>No instructors found</option>';
        return;
    }
    
    instructors.forEach(function(instructor) {
        var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
        if (!name) name = 'Unnamed';
        var option = document.createElement('option');
        option.value = instructor.id;
        option.textContent = name;
        if (String(instructor.id) === String(instructorCalendarState.selectedInstructorId)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    if (currentValue && !select.querySelector('option[value="' + currentValue + '"]')) {
        instructorCalendarState.selectedInstructorId = null;
    }
}

/**
 * Render the group list at the bottom
 */
function renderGroupList() {
    var container = document.getElementById('instructor-groups-container');
    if (!container) return;
    
    if (!instructorCalendarState.selectedInstructorId) {
        container.innerHTML = '';
        return;
    }
    
    var instructorId = instructorCalendarState.selectedInstructorId;
    var instructor = data.characters.find(function(c) { 
        return String(c.id) === String(instructorId); 
    });
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    // Get groups for this instructor
    var groups = getInstructorGroups(instructorId);
    var groupLabels = Object.keys(groups).sort();
    
    var html = '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    html += '<h4 style="color:var(--accent);font-size:0.9rem;">▣ Groups - ' + instructorName + '</h4>';
    html += '<button id="add-group-btn" class="small primary">+ Add Group</button>';
    html += '</div>';
    
    if (groupLabels.length === 0) {
        html += '<div style="text-align:center;color:var(--text-dim);font-size:0.8rem;padding:8px;">No groups created yet. Click "Add Group" to create one.</div>';
    } else {
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        
        groupLabels.forEach(function(label) {
            var group = groups[label];
            var studentCount = group.students ? Object.keys(group.students).length : 0;
            var isExpanded = instructorCalendarState.expandedGroups[label] || false;
            
            html += '<div class="group-card" style="background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius);padding:8px 12px;flex:1;min-width:150px;max-width:300px;">';
            html += '<div class="group-header" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="window.toggleGroup(\'' + label + '\')">';
            html += '<span class="group-name" style="font-weight:600;color:var(--accent);">Group ' + label + '</span>';
            html += '<span class="group-meta" style="font-size:0.7rem;color:var(--text-dim);">' + studentCount + ' students ' + (isExpanded ? '▼' : '▶') + '</span>';
            html += '</div>';
            
            if (isExpanded) {
                html += '<div class="group-students" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-soft);">';
                html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
                if (group.students) {
                    var studentIds = Object.keys(group.students);
                    if (studentIds.length > 0) {
                        studentIds.forEach(function(id) {
                            var student = data.characters.find(function(c) { return String(c.id) === String(id); });
                            if (student) {
                                var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                                html += '<span class="student-tag" style="background:var(--panel-alt);padding:2px 8px;border-radius:12px;font-size:0.7rem;display:inline-flex;align-items:center;gap:4px;">' + name;
                                html += '<button class="remove-from-group-btn" data-group="' + label + '" data-student="' + id + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 2px;">✕</button>';
                                html += '</span>';
                            }
                        });
                    } else {
                        html += '<span style="font-size:0.7rem;color:var(--text-dim);">No students assigned</span>';
                    }
                }
                html += '</div>';
                
                // Add student dropdown
                html += '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">';
                html += '<select class="add-student-to-group" data-group="' + label + '" style="flex:1;min-width:120px;padding:2px 4px;font-size:0.7rem;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:4px;">';
                html += '<option value="">Add student...</option>';
                var allStudents = getStudents();
                allStudents.forEach(function(s) {
                    var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                    var inThisGroup = group.students && group.students[s.id];
                    if (!inThisGroup) {
                        var inOtherGroup = false;
                        for (var otherLabel in groups) {
                            if (otherLabel === label) continue;
                            if (groups[otherLabel].students && groups[otherLabel].students[s.id]) {
                                inOtherGroup = true;
                                break;
                            }
                        }
                        var status = inOtherGroup ? ' (in other group)' : '';
                        html += '<option value="' + s.id + '">' + name + status + '</option>';
                    }
                });
                html += '</select>';
                html += '<button class="add-student-to-group-btn small primary" data-group="' + label + '" style="font-size:0.6rem;padding:2px 6px;">Add</button>';
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners for group management
    container.querySelectorAll('.add-student-to-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var groupLabel = this.dataset.group;
            var select = this.parentElement.querySelector('.add-student-to-group');
            var studentId = select.value;
            if (studentId) {
                addStudentToGroup(groupLabel, studentId);
            }
        });
    });
    
    container.querySelectorAll('.remove-from-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var groupLabel = this.dataset.group;
            var studentId = this.dataset.student;
            if (confirm('Remove this student from Group ' + groupLabel + '?')) {
                removeStudentFromGroup(groupLabel, studentId);
            }
        });
    });
    
    var addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        var newAddGroupBtn = addGroupBtn.cloneNode(true);
        addGroupBtn.parentNode.replaceChild(newAddGroupBtn, addGroupBtn);
        newAddGroupBtn.addEventListener('click', showAddGroupModal);
    }
}

/**
 * Get groups for an instructor
 */
function getInstructorGroups(instructorId) {
    if (!data.curriculum.instructorGroups) {
        data.curriculum.instructorGroups = {};
    }
    if (!data.curriculum.instructorGroups[instructorId]) {
        data.curriculum.instructorGroups[instructorId] = {};
    }
    return data.curriculum.instructorGroups[instructorId];
}

/**
 * Show add group modal
 */
function showAddGroupModal() {
    if (!instructorCalendarState.selectedInstructorId) {
        alert('Please select an instructor first.');
        return;
    }
    
    var instructorId = instructorCalendarState.selectedInstructorId;
    var groups = getInstructorGroups(instructorId);
    var existingLabels = Object.keys(groups);
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Add Group</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Group Label *</label>
                    <input type="text" id="new-group-label" placeholder="e.g., A, B, 1, 2..." style="width:100%;padding:8px;">
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
        var label = document.getElementById('new-group-label').value.trim().toUpperCase();
        if (!label) {
            alert('Please enter a group label.');
            return;
        }
        if (existingLabels.indexOf(label) !== -1) {
            alert('Group "' + label + '" already exists.');
            return;
        }
        
        var groups = getInstructorGroups(instructorId);
        groups[label] = { students: {} };
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Created group ' + label + ' for instructor');
            }
            modal.remove();
            renderGroupList();
            populateGroupFilter();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to create group.');
        });
    };
}

/**
 * Add student to group
 */
function addStudentToGroup(groupLabel, studentId) {
    if (!instructorCalendarState.selectedInstructorId) return;
    
    var instructorId = instructorCalendarState.selectedInstructorId;
    var groups = getInstructorGroups(instructorId);
    
    if (!groups[groupLabel]) {
        alert('Group not found.');
        return;
    }
    
    // Check if student is already in any group for this instructor
    var currentGroup = null;
    for (var label in groups) {
        if (groups[label].students && groups[label].students[studentId]) {
            currentGroup = label;
            break;
        }
    }
    
    if (currentGroup === groupLabel) {
        alert('Student is already in this group.');
        return;
    }
    
    if (currentGroup) {
        if (!confirm('Student is already in Group ' + currentGroup + '. Move to Group ' + groupLabel + '?')) {
            return;
        }
        delete groups[currentGroup].students[studentId];
    }
    
    if (!groups[groupLabel].students) {
        groups[groupLabel].students = {};
    }
    groups[groupLabel].students[studentId] = true;
    
    saveData().then(function() {
        var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
        var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        if (typeof logActivity === 'function') {
            logActivity('Added ' + studentName + ' to group ' + groupLabel);
        }
        renderGroupList();
        populateGroupFilter();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to add student to group.');
    });
}

/**
 * Remove student from group
 */
function removeStudentFromGroup(groupLabel, studentId) {
    if (!instructorCalendarState.selectedInstructorId) return;
    
    var instructorId = instructorCalendarState.selectedInstructorId;
    var groups = getInstructorGroups(instructorId);
    
    if (groups[groupLabel] && groups[groupLabel].students) {
        delete groups[groupLabel].students[studentId];
    }
    
    saveData().then(function() {
        var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
        var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        if (typeof logActivity === 'function') {
            logActivity('Removed ' + studentName + ' from group ' + groupLabel);
        }
        renderGroupList();
        populateGroupFilter();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to remove student from group.');
    });
}

/**
 * Get students in a group
 */
function getStudentsInGroup(instructorId, groupLabel) {
    var groups = getInstructorGroups(instructorId);
    if (!groups[groupLabel] || !groups[groupLabel].students) {
        return [];
    }
    return Object.keys(groups[groupLabel].students);
}

/**
 * Toggle group expansion
 */
function toggleGroup(label) {
    if (instructorCalendarState.expandedGroups[label]) {
        delete instructorCalendarState.expandedGroups[label];
    } else {
        instructorCalendarState.expandedGroups[label] = true;
    }
    renderGroupList();
}

/**
 * Populate group filter dropdown
 */
function populateGroupFilter() {
    var select = document.getElementById('instructor-group-filter');
    if (!select) return;
    
    if (!instructorCalendarState.selectedInstructorId) {
        select.innerHTML = '<option value="all">All Groups</option>';
        return;
    }
    
    var instructorId = instructorCalendarState.selectedInstructorId;
    var groups = getInstructorGroups(instructorId);
    var groupLabels = Object.keys(groups).sort();
    
    var currentValue = select.value;
    select.innerHTML = '<option value="all">All Groups</option>';
    groupLabels.forEach(function(label) {
        var option = document.createElement('option');
        option.value = label;
        option.textContent = 'Group ' + label;
        select.appendChild(option);
    });
    
    if (currentValue && groupLabels.indexOf(currentValue) !== -1) {
        select.value = currentValue;
    } else {
        select.value = 'all';
        instructorCalendarState.activeGroupFilter = 'all';
    }
}

/**
 * Render instructor calendar data
 */
function renderInstructorCalendarData() {
    var grid = document.getElementById('instructor-grid');
    if (!grid) return;
    
    var weekDisplay = document.getElementById('instructor-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + instructorCalendarState.currentWeek;
    
    populateInstructorCalendarSelector();
    populateGroupFilter();
    
    if (!instructorCalendarState.selectedInstructorId) {
        var dayColumns = grid.querySelectorAll('.day-column');
        dayColumns.forEach(function(col) {
            var slots = col.querySelector('.day-slots');
            if (slots) {
                slots.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;">Select an instructor</div>';
            }
        });
        renderGroupList();
        return;
    }
    
    var instructor = data.characters.find(function(c) { 
        return String(c.id) === String(instructorCalendarState.selectedInstructorId); 
    });
    if (!instructor) {
        var dayColumns = grid.querySelectorAll('.day-column');
        dayColumns.forEach(function(col) {
            var slots = col.querySelector('.day-slots');
            if (slots) {
                slots.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;">Instructor not found</div>';
            }
        });
        renderGroupList();
        return;
    }
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var activeFilter = instructorCalendarState.activeGroupFilter;
    
    var scheduleMap = {};
    var students = getStudents();
    var groups = getInstructorGroups(instructorId);
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, week);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                var disciplineId = schedule[day][hour];
                if (disciplineId) {
                    var discipline = getDiscipline(disciplineId);
                    if (discipline) {
                        var classInstructorId = null;
                        if (typeof getClassInstructor === 'function') {
                            classInstructorId = getClassInstructor(student.id, week, parseInt(day), parseInt(hour));
                        }
                        
                        var isTeaching = false;
                        if (classInstructorId) {
                            isTeaching = String(classInstructorId) === String(instructorId);
                        } else if (discipline.instructorIds) {
                            isTeaching = discipline.instructorIds.some(function(id) { 
                                return String(id) === String(instructorId); 
                            });
                        }
                        
                        if (isTeaching) {
                            var key = day + '_' + hour;
                            if (!scheduleMap[key]) {
                                scheduleMap[key] = {
                                    day: parseInt(day),
                                    hour: parseInt(hour),
                                    disciplineId: disciplineId,
                                    discipline: discipline,
                                    students: [],
                                    label: null,
                                    duration: 1,
                                    groupLabel: null
                                };
                            }
                            if (typeof getClassLabel === 'function') {
                                var label = getClassLabel(student.id, week, parseInt(day), parseInt(hour));
                                if (label && !scheduleMap[key].label) {
                                    scheduleMap[key].label = label;
                                }
                            }
                            if (typeof getClassGroupLabel === 'function') {
                                var groupLabel = getClassGroupLabel(student.id, week, parseInt(day), parseInt(hour));
                                if (groupLabel && !scheduleMap[key].groupLabel) {
                                    scheduleMap[key].groupLabel = groupLabel;
                                }
                            }
                            if (typeof getClassDuration === 'function') {
                                var duration = getClassDuration(student.id, week, parseInt(day), parseInt(hour));
                                if (duration && duration > scheduleMap[key].duration) {
                                    scheduleMap[key].duration = duration;
                                }
                            }
                            scheduleMap[key].students.push({
                                studentId: student.id,
                                studentName: [student.firstName, student.lastName].filter(function(n) { return n; }).join(' '),
                                groupLabel: scheduleMap[key].groupLabel
                            });
                        }
                    }
                }
            }
        }
    });
    
    if (data.curriculum.instructorTemplates) {
        var templateKey = instructorId + '_' + week;
        if (data.curriculum.instructorTemplates[templateKey]) {
            for (var key in data.curriculum.instructorTemplates[templateKey]) {
                var parts = key.split('_');
                var day = parseInt(parts[0]);
                var hour = parseInt(parts[1]);
                var templateData = data.curriculum.instructorTemplates[templateKey][key];
                var mapKey = day + '_' + hour;
                if (!scheduleMap[mapKey]) {
                    var discipline = getDiscipline(templateData.disciplineId);
                    if (discipline) {
                        scheduleMap[mapKey] = {
                            day: day,
                            hour: hour,
                            disciplineId: templateData.disciplineId,
                            discipline: discipline,
                            students: [],
                            label: templateData.label || null,
                            duration: templateData.duration || 1,
                            groupLabel: templateData.groupLabel || null,
                            isTemplate: true
                        };
                    }
                }
            }
        }
    }
    
    var blockedSlots = {};
    if (data.curriculum.instructorBlocks) {
        var blockKey = instructorId + '_' + week;
        if (data.curriculum.instructorBlocks[blockKey]) {
            blockedSlots = data.curriculum.instructorBlocks[blockKey];
        }
    }
    
    var classArray = Object.values(scheduleMap).sort(function(a, b) {
        if (a.day !== b.day) return a.day - b.day;
        return a.hour - b.hour;
    });
    
    var filteredClassArray = classArray;
    if (activeFilter !== 'all') {
        filteredClassArray = classArray.filter(function(c) {
            return c.groupLabel === activeFilter || (c.isTemplate && !c.groupLabel);
        });
    }
    
    var hours = [];
    for (var h = 5; h <= 23; h++) {
        hours.push(h);
    }
    
    var dayColumns = grid.querySelectorAll('.day-column');
    dayColumns.forEach(function(column, index) {
        var day = index + 1;
        var slots = column.querySelector('.day-slots');
        if (!slots) return;
        
        slots.innerHTML = '';
        var occupiedHours = {};
        
        hours.forEach(function(hour) {
            if (occupiedHours[hour]) return;
            
            var slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.day = day;
            slot.dataset.hour = hour;
            
            var timeLabel = document.createElement('span');
            timeLabel.className = 'slot-time';
            var hourDisplay = hour > 12 ? hour - 12 : hour;
            var ampm = hour >= 12 ? 'PM' : 'AM';
            if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
            if (hour === 12) { ampm = 'PM'; }
            timeLabel.textContent = hourDisplay + ':00 ' + ampm;
            slot.appendChild(timeLabel);
            
            var isBlocked = blockedSlots[day] && blockedSlots[day][hour];
            var slotData = filteredClassArray.find(function(c) { return c.day === day && c.hour === hour; });
            
            if (slotData) {
                var duration = slotData.duration || 1;
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    occupiedHours[h] = true;
                }
                
                slot.classList.add('occupied');
                slot.style.minHeight = (30 * duration) + 'px';
                slot.style.height = (30 * duration) + 'px';
                if (duration > 1) {
                    slot.classList.add('duration-' + duration);
                }
                
                var studentCount = slotData.students.length;
                var labelDisplay = slotData.label ? ' [' + slotData.label + ']' : '';
                var groupDisplay = slotData.groupLabel ? ' (G' + slotData.groupLabel + ')' : '';
                var durationDisplay = duration > 1 ? ' (' + duration + 'h)' : '';
                var templateDisplay = slotData.isTemplate ? ' (template)' : '';
                
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = slotData.discipline.name + labelDisplay + groupDisplay + durationDisplay + templateDisplay + (studentCount > 0 ? ' - ' + studentCount + ' students' : '');
                slot.appendChild(labelEl);
                
                if (activeFilter !== 'all' && slotData.groupLabel !== activeFilter && !slotData.isTemplate) {
                    slot.style.opacity = '0.3';
                    slot.style.filter = 'grayscale(1)';
                }
                
                slot.addEventListener('click', function() {
                    showClassManagementModal(slotData, day, hour);
                });
                
                slot.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    if (confirm('Remove this class?')) {
                        removeInstructorClass(slotData, day, hour);
                    }
                });
                
            } else if (isBlocked) {
                var blockDuration = isBlocked.duration || 1;
                
                for (var h = hour; h < hour + blockDuration && h <= 23; h++) {
                    occupiedHours[h] = true;
                }
                
                slot.classList.add('occupied');
                slot.classList.add('blocked');
                slot.style.minHeight = (30 * blockDuration) + 'px';
                slot.style.height = (30 * blockDuration) + 'px';
                if (blockDuration > 1) {
                    slot.classList.add('duration-' + blockDuration);
                }
                
                var blockLabel = isBlocked.label || 'Blocked Time';
                var blockGroup = isBlocked.groupLabel ? ' (G' + isBlocked.groupLabel + ')' : '';
                
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = '▣ ' + blockLabel + blockGroup;
                slot.appendChild(labelEl);
                
                if (activeFilter !== 'all' && isBlocked.groupLabel !== activeFilter) {
                    slot.style.opacity = '0.3';
                    slot.style.filter = 'grayscale(1)';
                }
                
                slot.addEventListener('click', function() {
                    showBlockManagementModal(day, hour);
                });
                
                slot.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    if (confirm('Remove this blocked time?')) {
                        removeBlockedTime(day, hour);
                    }
                });
                
            } else {
                slot.classList.add('empty');
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = '+';
                slot.appendChild(labelEl);
                
                slot.addEventListener('click', function() {
                    showAddClassModal(day, hour);
                });
            }
            
            slots.appendChild(slot);
        });
    });
    
    renderGroupList();
}

/**
 * Show class management modal - with group dropdown to add all students from a group
 */
function showClassManagementModal(slotData, day, hour) {
    var discipline = slotData.discipline;
    if (!discipline) return;
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var instructor = data.characters.find(function(c) { 
        return String(c.id) === String(instructorId); 
    });
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var allStudents = getStudents();
    var assignedStudentIds = slotData.students ? slotData.students.map(function(s) { return s.studentId; }) : [];
    var duration = slotData.duration || 1;
    var label = slotData.label || '';
    var groupLabel = slotData.groupLabel || '';
    
    // Get groups for this instructor
    var groups = getInstructorGroups(instructorId);
    var groupLabels = Object.keys(groups).sort();
    
    var studentInfo = [];
    assignedStudentIds.forEach(function(id) {
        var student = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (student) {
            // Get the group label for this student for this specific class slot
            var studentGroupLabel = null;
            if (typeof getClassGroupLabel === 'function') {
                studentGroupLabel = getClassGroupLabel(id, week, day, hour);
            }
            studentInfo.push({
                id: id,
                name: [student.firstName, student.lastName].filter(function(n) { return n; }).join(' '),
                group: studentGroupLabel || groupLabel || 'None'
            });
        }
    });
    
    var durationDisplay = duration > 1 ? ' (' + duration + ' hours)' : '';
    var templateDisplay = slotData.isTemplate ? ' (Template - no students assigned yet)' : '';
    var groupDisplay = groupLabel ? ' (Group ' + groupLabel + ')' : '';
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:550px;">
            <div class="modal-header">
                <h3>${discipline.name} ${label ? '[' + label + ']' : ''} ${groupDisplay} ${durationDisplay}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Instructor:</span> <span>${instructorName}</span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm} ${duration > 1 ? '(until ' + (hour + duration) + ':00)' : ''}</span></div>
                <div class="detail-row"><span class="label">Duration:</span> <span><strong>${duration} hour${duration > 1 ? 's' : ''}</strong></span></div>
                <div class="detail-row"><span class="label">Group Label:</span> <span><strong>${groupLabel || 'None'}</strong></span></div>
                <div class="detail-row"><span class="label">Assigned Students:</span> <span>${studentInfo.length > 0 ? studentInfo.map(function(s) { return s.name + ' (G' + s.group + ')'; }).join(', ') : 'None'}</span></div>
                ${slotData.isTemplate ? '<div class="detail-row"><span class="label">Status:</span> <span style="color:var(--warning);">Template Class</span></div>' : ''}
                
                <!-- ADD FROM GROUP DROPDOWN -->
                ${groupLabels.length > 0 ? `
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Add Students from Group:</label>
                    <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;">
                        <select id="add-from-group-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            <option value="">Select a group...</option>
                            ${groupLabels.map(function(g) {
                                var groupStudents = Object.keys(groups[g].students || {});
                                var alreadyAssigned = groupStudents.filter(function(id) { 
                                    return assignedStudentIds.some(function(aid) { return String(aid) === String(id); });
                                });
                                var count = groupStudents.length;
                                var assignedCount = alreadyAssigned.length;
                                var status = assignedCount > 0 ? ' (' + assignedCount + '/' + count + ' already assigned)' : ' (' + count + ' students)';
                                return '<option value="' + g + '">Group ' + g + status + '</option>';
                            }).join('')}
                        </select>
                        <button id="add-from-group-btn" class="primary small">Add All</button>
                    </div>
                    <span style="font-size:0.6rem;color:var(--text-dim);">Adds all students from the selected group to this class</span>
                </div>
                ` : '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);"><span style="font-size:0.75rem;color:var(--text-dim);">No groups created yet. Use "Manage Groups" to create groups.</span></div>'}
                
                <!-- Assign Individual Students -->
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Individual Students:</label>
                    <div style="max-height:150px;overflow-y:auto;margin-top:4px;">
                        ${allStudents.map(function(s) {
                            var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                            var isAssigned = assignedStudentIds.some(function(id) { return String(id) === String(s.id); });
                            
                            var schedule = getStudentSchedule(s.id, week);
                            var hasConflict = false;
                            var conflictGroup = null;
                            for (var h = hour; h < hour + duration && h <= 23; h++) {
                                if (schedule[day] && schedule[day][h]) {
                                    hasConflict = true;
                                    if (typeof getClassGroupLabel === 'function') {
                                        conflictGroup = getClassGroupLabel(s.id, week, day, h);
                                    }
                                    break;
                                }
                            }
                            
                            var assignedToDifferentGroup = false;
                            if (isAssigned) {
                                var currentGroup = groupLabel || 'None';
                                var studentGroup = null;
                                if (typeof getClassGroupLabel === 'function') {
                                    studentGroup = getClassGroupLabel(s.id, week, day, hour);
                                }
                                if (studentGroup && studentGroup !== groupLabel) {
                                    assignedToDifferentGroup = true;
                                }
                            }
                            
                            var conflictText = '';
                            if (hasConflict && conflictGroup) {
                                conflictText = ' <span style="color:var(--danger);font-size:0.7rem;">(conflict - Group ' + conflictGroup + ')</span>';
                            } else if (hasConflict) {
                                conflictText = ' <span style="color:var(--danger);font-size:0.7rem;">(conflict)</span>';
                            } else if (assignedToDifferentGroup) {
                                conflictText = ' <span style="color:var(--warning);font-size:0.7rem;">(assigned to different group)</span>';
                            }
                            
                            return '<label style="display:block;padding:4px 0;font-size:0.8rem;cursor:pointer;border-bottom:1px solid var(--border-soft);' + 
                                (assignedToDifferentGroup ? ' background:var(--warning-soft);' : '') + '">' +
                                '<input type="checkbox" class="assign-student-checkbox" value="' + s.id + '" ' + 
                                (isAssigned ? 'checked' : '') + 
                                (hasConflict && !isAssigned ? ' disabled' : '') + '> ' + 
                                name + 
                                (isAssigned ? ' <span style="color:var(--accent);font-size:0.7rem;">✓ assigned</span>' : '') +
                                conflictText +
                            '</label>';
                        }).join('')}
                    </div>
                    <button id="assign-students-btn" class="small primary" style="margin-top:8px;">Update Assignments</button>
                    <span style="font-size:0.6rem;color:var(--text-dim);margin-left:8px;">Students with conflicts cannot be assigned</span>
                </div>
                
                <div style="margin-top:12px;padding:12px;background:var(--danger-soft);border-radius:6px;border:1px solid var(--danger);">
                    <p style="color:var(--danger);font-size:0.85rem;margin-bottom:4px;font-weight:600;">⚠ Remove this class?</p>
                    <p style="color:var(--text-dim);font-size:0.75rem;">This will remove the class from <strong>ALL ${assignedStudentIds.length} student(s)</strong> assigned to it.</p>
                </div>
                
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-class-all" class="danger">✕ Remove Class</button>
                    <button type="button" id="close-detail" class="secondary">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#close-detail').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Add from group
    var addFromGroupBtn = document.getElementById('add-from-group-btn');
    if (addFromGroupBtn) {
        addFromGroupBtn.addEventListener('click', function() {
            var groupSelect = document.getElementById('add-from-group-select');
            var selectedGroup = groupSelect.value;
            if (!selectedGroup) {
                alert('Please select a group.');
                return;
            }
            
            var groupStudents = getStudentsInGroup(instructorId, selectedGroup);
            var toAdd = groupStudents.filter(function(id) { 
                return !assignedStudentIds.some(function(aid) { return String(aid) === String(id); });
            });
            
            if (toAdd.length === 0) {
                alert('All students in this group are already assigned.');
                return;
            }
            
            // Check for conflicts
            var conflicts = [];
            toAdd.forEach(function(studentId) {
                var schedule = getStudentSchedule(studentId, week);
                var hasConflict = false;
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    if (schedule[day] && schedule[day][h]) {
                        hasConflict = true;
                        break;
                    }
                }
                if (hasConflict) {
                    var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
                    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    conflicts.push(studentName);
                }
            });
            
            if (conflicts.length > 0) {
                if (!confirm('⚠ The following students have conflicts at this time:\n\n' + 
                    conflicts.join('\n') + 
                    '\n\nAdd anyway? This will overwrite their existing classes.')) {
                    return;
                }
            }
            
            // Add all students from group
            toAdd.forEach(function(studentId) {
                var schedule = getStudentSchedule(studentId, week);
                
                // Remove existing classes in this time slot
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    if (schedule[day] && schedule[day][h]) {
                        delete schedule[day][h];
                        if (typeof setClassInstructor === 'function') {
                            setClassInstructor(studentId, week, day, h, null);
                        }
                        if (typeof setClassLabel === 'function') {
                            setClassLabel(studentId, week, day, h, null);
                        }
                        if (typeof setClassGroupLabel === 'function') {
                            setClassGroupLabel(studentId, week, day, h, null);
                        }
                        if (typeof setClassDuration === 'function') {
                            setClassDuration(studentId, week, day, h, null);
                        }
                    }
                }
                
                // Add the class
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    if (!schedule[day]) schedule[day] = {};
                    schedule[day][h] = discipline.id;
                    if (typeof setClassInstructor === 'function') {
                        setClassInstructor(studentId, week, day, h, instructorId);
                    }
                    if (label && typeof setClassLabel === 'function') {
                        setClassLabel(studentId, week, day, h, label);
                    }
                    if (selectedGroup && typeof setClassGroupLabel === 'function') {
                        setClassGroupLabel(studentId, week, day, h, selectedGroup);
                    }
                    if (h === hour && typeof setClassDuration === 'function') {
                        setClassDuration(studentId, week, day, h, duration);
                    }
                }
                
                // Update assigned list
                if (!assignedStudentIds.some(function(id) { return String(id) === String(studentId); })) {
                    assignedStudentIds.push(studentId);
                }
            });
            
            // Update template
            if (data.curriculum.instructorTemplates) {
                var templateKey = instructorId + '_' + week;
                var classKey = day + '_' + hour;
                if (data.curriculum.instructorTemplates[templateKey] && 
                    data.curriculum.instructorTemplates[templateKey][classKey]) {
                    data.curriculum.instructorTemplates[templateKey][classKey].assignedStudents = assignedStudentIds;
                    data.curriculum.instructorTemplates[templateKey][classKey].groupLabel = selectedGroup;
                }
            }
            
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Added ' + toAdd.length + ' students from group ' + selectedGroup + ' to ' + discipline.name);
                }
                modal.remove();
                renderInstructorCalendarData();
                populateGroupFilter();
                if (typeof renderSchedule === 'function') {
                    renderSchedule();
                }
                alert('Added ' + toAdd.length + ' students from Group ' + selectedGroup + '!');
            }).catch(function(err) {
                console.error('Failed to save:', err);
                alert('Failed to add students from group.');
            });
        });
    }
    
    // Assign individual students
    modal.querySelector('#assign-students-btn').onclick = function() {
        var selectedStudents = [];
        modal.querySelectorAll('.assign-student-checkbox:checked').forEach(function(cb) {
            selectedStudents.push(cb.value);
        });
        
        var currentAssigned = assignedStudentIds || [];
        var toAdd = selectedStudents.filter(function(id) { return !currentAssigned.some(function(cid) { return String(cid) === String(id); }); });
        var toRemove = currentAssigned.filter(function(id) { return !selectedStudents.some(function(sid) { return String(sid) === String(id); }); });
        
        var groupWarnings = [];
        toAdd.forEach(function(studentId) {
            if (typeof getClassGroupLabel === 'function') {
                var studentGroup = getClassGroupLabel(studentId, week, day, hour);
                if (studentGroup && studentGroup !== groupLabel) {
                    var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
                    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    groupWarnings.push(studentName + ' is currently in Group ' + studentGroup);
                }
            }
        });
        
        if (groupWarnings.length > 0) {
            if (!confirm('⚠ The following students are currently assigned to a different group:\n\n' + 
                groupWarnings.join('\n') + 
                '\n\nAssigning them here will move them to Group ' + (groupLabel || 'None') + 
                '. This will remove them from their previous group.\n\nContinue?')) {
                return;
            }
        }
        
        toRemove.forEach(function(studentId) {
            var schedule = getStudentSchedule(studentId, week);
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    delete schedule[day][h];
                    if (typeof setClassInstructor === 'function') {
                        setClassInstructor(studentId, week, day, h, null);
                    }
                    if (typeof setClassLabel === 'function') {
                        setClassLabel(studentId, week, day, h, null);
                    }
                    if (typeof setClassGroupLabel === 'function') {
                        setClassGroupLabel(studentId, week, day, h, null);
                    }
                    if (typeof setClassDuration === 'function') {
                        setClassDuration(studentId, week, day, h, null);
                    }
                }
            }
        });
        
        toAdd.forEach(function(studentId) {
            var schedule = getStudentSchedule(studentId, week);
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (!schedule[day]) schedule[day] = {};
                schedule[day][h] = discipline.id;
                if (typeof setClassInstructor === 'function') {
                    setClassInstructor(studentId, week, day, h, instructorId);
                }
                if (label && typeof setClassLabel === 'function') {
                    setClassLabel(studentId, week, day, h, label);
                }
                if (groupLabel && typeof setClassGroupLabel === 'function') {
                    setClassGroupLabel(studentId, week, day, h, groupLabel);
                }
                if (h === hour && typeof setClassDuration === 'function') {
                    setClassDuration(studentId, week, day, h, duration);
                }
            }
        });
        
        if (data.curriculum.instructorTemplates) {
            var templateKey = instructorId + '_' + week;
            var classKey = day + '_' + hour;
            if (data.curriculum.instructorTemplates[templateKey] && 
                data.curriculum.instructorTemplates[templateKey][classKey]) {
                data.curriculum.instructorTemplates[templateKey][classKey].assignedStudents = selectedStudents;
            }
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Updated student assignments for ' + discipline.name + 
                    (label ? ' [' + label + ']' : '') + 
                    (groupLabel ? ' (Group ' + groupLabel + ')' : '') +
                    ' - Added ' + toAdd.length + ', Removed ' + toRemove.length);
            }
            modal.remove();
            renderInstructorCalendarData();
            populateGroupFilter();
            if (typeof renderSchedule === 'function') {
                renderSchedule();
            }
            alert('Student assignments updated!');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to update assignments.');
        });
    };
    
    modal.querySelector('#remove-class-all').onclick = function() {
        removeInstructorClass(slotData, day, hour);
        modal.remove();
    };
}

// ... (rest of the functions: removeInstructorClass, showAddClassModal, showAddBlockModal, showBlockManagementModal, removeBlockedTime, initInstructorCalendarEvents)

// Make toggleGroup globally available
window.toggleGroup = toggleGroup;

// Make functions globally available
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderInstructorCalendarData = renderInstructorCalendarData;
window.populateInstructorCalendarSelector = populateInstructorCalendarSelector;
window.populateGroupFilter = populateGroupFilter;
window.renderGroupList = renderGroupList;
window.toggleGroup = toggleGroup;
window.getInstructorGroups = getInstructorGroups;
window.getStudentsInGroup = getStudentsInGroup;
window.showAddGroupModal = showAddGroupModal;
window.addStudentToGroup = addStudentToGroup;
window.removeStudentFromGroup = removeStudentFromGroup;
window.initInstructorCalendarEvents = initInstructorCalendarEvents;
window.showAddClassModal = showAddClassModal;
window.showAddBlockModal = showAddBlockModal;
window.showClassManagementModal = showClassManagementModal;
window.showBlockManagementModal = showBlockManagementModal;
window.removeBlockedTime = removeBlockedTime;
window.removeInstructorClass = removeInstructorClass;
window.instructorCalendarState = instructorCalendarState;
