/**
 * instructor-calendar.js - Instructor Calendar Module
 * Works exactly like student calendar with the same data structure
 */

var instructorCalendarState = {
    currentWeek: 1,
    selectedInstructorId: null
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
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <button id="add-instructor-class-btn" class="primary small">+ Add Class</button>
            <button id="add-instructor-block-btn" class="secondary small">🔬 Block Time</button>
            <span style="font-size:0.7rem;color:var(--text-dim);">Click a slot to assign students, right-click to remove</span>
        </div>
    `;
    
    populateInstructorCalendarSelector();
    initInstructorCalendarEvents();
    renderInstructorCalendarData();
}

/**
 * Render instructor calendar data - IDENTICAL to student calendar
 */
function renderInstructorCalendarData() {
    var grid = document.getElementById('instructor-grid');
    if (!grid) return;
    
    var weekDisplay = document.getElementById('instructor-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + instructorCalendarState.currentWeek;
    
    populateInstructorCalendarSelector();
    
    if (!instructorCalendarState.selectedInstructorId) {
        var dayColumns = grid.querySelectorAll('.day-column');
        dayColumns.forEach(function(col) {
            var slots = col.querySelector('.day-slots');
            if (slots) {
                slots.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;">Select an instructor</div>';
            }
        });
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
        return;
    }
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    
    // Build schedule by checking ALL students
    var scheduleMap = {};
    var students = getStudents();
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, week);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                var disciplineId = schedule[day][hour];
                if (disciplineId) {
                    var discipline = getDiscipline(disciplineId);
                    if (discipline) {
                        // Check if this instructor teaches this class
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
                                    duration: 1
                                };
                            }
                            if (typeof getClassLabel === 'function') {
                                var label = getClassLabel(student.id, week, parseInt(day), parseInt(hour));
                                if (label && !scheduleMap[key].label) {
                                    scheduleMap[key].label = label;
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
                                studentName: [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ')
                            });
                        }
                    }
                }
            }
        }
    });
    
    // Also check instructor template classes (classes without students yet)
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
                            isTemplate: true
                        };
                    }
                }
            }
        }
    }
    
    // Check for blocked time
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
            
            // Check for blocked time
            var isBlocked = blockedSlots[day] && blockedSlots[day][hour];
            
            // Check for class
            var slotData = classArray.find(function(c) { return c.day === day && c.hour === hour; });
            
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
                var durationDisplay = duration > 1 ? ' (' + duration + 'h)' : '';
                var templateDisplay = slotData.isTemplate ? ' (template)' : '';
                
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = slotData.discipline.name + labelDisplay + durationDisplay + templateDisplay + (studentCount > 0 ? ' - ' + studentCount + ' students' : '');
                slot.appendChild(labelEl);
                
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
                
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = '🔬 ' + (isBlocked.label || 'Research/Office Time');
                slot.appendChild(labelEl);
                
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
}

/**
 * Show modal to add a class
 */
function showAddClassModal(day, hour) {
    if (!instructorCalendarState.selectedInstructorId) {
        alert('Please select an instructor first.');
        return;
    }
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var instructor = data.characters.find(function(c) { 
        return String(c.id) === String(instructorId); 
    });
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    var disciplines = getAvailableDisciplines(week);
    var availableDisciplines = disciplines.filter(function(d) {
        return d.instructorIds && d.instructorIds.some(function(id) { return String(id) === String(instructorId); });
    });
    
    if (availableDisciplines.length === 0) {
        alert('No disciplines available for this instructor in week ' + week + '.');
        return;
    }
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <h3>Add Class - ${dayNames[day]} at ${hourDisplay}:00 ${ampm}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Instructor:</label>
                    <span style="padding:6px 0;display:block;">${instructorName}</span>
                </div>
                <div class="form-group">
                    <label>Discipline *:</label>
                    <select id="add-class-discipline" style="width:100%;padding:8px;">
                        ${availableDisciplines.map(function(d) {
                            return '<option value="' + d.id + '">' + d.name + '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Class Label (optional):</label>
                    <input type="text" id="add-class-label" placeholder="e.g., A, B, Group 1..." style="width:100%;padding:8px;">
                </div>
                <div class="form-group">
                    <label>Duration (hours):</label>
                    <select id="add-class-duration" style="width:100%;padding:8px;">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                    </select>
                </div>
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">
                    <p style="font-size:0.75rem;color:var(--text-dim);">
                        ⚡ This creates a template class. Click on the slot later to assign students.
                    </p>
                </div>
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-add-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-discipline').value;
        var duration = parseInt(document.getElementById('add-class-duration').value) || 1;
        var label = document.getElementById('add-class-label').value.trim();
        
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
        // Store as a template class
        if (!data.curriculum.instructorTemplates) {
            data.curriculum.instructorTemplates = {};
        }
        var templateKey = instructorId + '_' + week;
        if (!data.curriculum.instructorTemplates[templateKey]) {
            data.curriculum.instructorTemplates[templateKey] = {};
        }
        var classKey = day + '_' + hour;
        data.curriculum.instructorTemplates[templateKey][classKey] = {
            disciplineId: disciplineId,
            label: label,
            duration: duration,
            assignedStudents: []
        };
        
        modal.remove();
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                var discipline = getDiscipline(disciplineId);
                logActivity('Added template class ' + (discipline ? discipline.name : '') + 
                    (label ? ' [' + label + ']' : '') + 
                    ' (' + duration + 'h) for instructor ' + instructorName);
            }
            renderInstructorCalendarData();
            alert('Class template added! Click on the slot to assign students.');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            renderInstructorCalendarData();
        });
    };
}

/**
 * Show class management modal - assign students, remove
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
    
    // Get student names
    var studentNames = [];
    assignedStudentIds.forEach(function(id) {
        var student = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (student) {
            studentNames.push([student.firstName, student.lastName].filter(function(n) { return n; }).join(' '));
        }
    });
    
    var durationDisplay = duration > 1 ? ' (' + duration + ' hours)' : '';
    var templateDisplay = slotData.isTemplate ? ' (Template - no students assigned yet)' : '';
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3>${discipline.name} ${label ? '[' + label + ']' : ''} ${durationDisplay}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Instructor:</span> <span>${instructorName}</span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm} ${duration > 1 ? '(until ' + (hour + duration) + ':00)' : ''}</span></div>
                <div class="detail-row"><span class="label">Duration:</span> <span><strong>${duration} hour${duration > 1 ? 's' : ''}</strong></span></div>
                <div class="detail-row"><span class="label">Assigned Students:</span> <span>${studentNames.length > 0 ? studentNames.join(', ') : 'None'}</span></div>
                ${slotData.isTemplate ? '<div class="detail-row"><span class="label">Status:</span> <span style="color:var(--warning);">Template Class</span></div>' : ''}
                
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Assign Students:</label>
                    <div style="max-height:150px;overflow-y:auto;margin-top:4px;">
                        ${allStudents.map(function(s) {
                            var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                            var isAssigned = assignedStudentIds.some(function(id) { return String(id) === String(s.id); });
                            var schedule = getStudentSchedule(s.id, week);
                            var hasConflict = false;
                            for (var h = hour; h < hour + duration && h <= 23; h++) {
                                if (schedule[day] && schedule[day][h]) {
                                    hasConflict = true;
                                    break;
                                }
                            }
                            return '<label style="display:block;padding:4px 0;font-size:0.8rem;cursor:pointer;border-bottom:1px solid var(--border-soft);">' +
                                '<input type="checkbox" class="assign-student-checkbox" value="' + s.id + '" ' + 
                                (isAssigned ? 'checked' : '') + 
                                (hasConflict && !isAssigned ? ' disabled' : '') + '> ' + 
                                name + 
                                (hasConflict && !isAssigned ? ' <span style="color:var(--danger);font-size:0.7rem;">(conflict)</span>' : '') +
                                (isAssigned ? ' <span style="color:var(--accent);font-size:0.7rem;">✓ assigned</span>' : '') +
                            '</label>';
                        }).join('')}
                    </div>
                    <button id="assign-students-btn" class="small primary" style="margin-top:8px;">Update Assignments</button>
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
    
    modal.querySelector('#assign-students-btn').onclick = function() {
        var selectedStudents = [];
        modal.querySelectorAll('.assign-student-checkbox:checked').forEach(function(cb) {
            selectedStudents.push(cb.value);
        });
        
        var currentAssigned = assignedStudentIds || [];
        var toAdd = selectedStudents.filter(function(id) { return !currentAssigned.some(function(cid) { return String(cid) === String(id); }); });
        var toRemove = currentAssigned.filter(function(id) { return !selectedStudents.some(function(sid) { return String(sid) === String(id); }); });
        
        // Remove from students
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
                    if (typeof setClassDuration === 'function') {
                        setClassDuration(studentId, week, day, h, null);
                    }
                }
            }
        });
        
        // Add to students
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
                if (h === hour && typeof setClassDuration === 'function') {
                    setClassDuration(studentId, week, day, h, duration);
                }
            }
        });
        
        // Update template
        if (data.curriculum.instructorTemplates) {
            var templateKey = instructorId + '_' + week;
            var classKey = day + '_' + hour;
            if (data.curriculum.instructorTemplates[templateKey] && 
                data.curriculum.instructorTemplates[templateKey][classKey]) {
                data.curriculum.instructorTemplates[templateKey][classKey].assignedStudents = selectedStudents;
                // If students assigned, remove from templates or keep as reference
            }
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Updated student assignments for ' + discipline.name + 
                    (label ? ' [' + label + ']' : '') + 
                    ' - Added ' + toAdd.length + ', Removed ' + toRemove.length);
            }
            modal.remove();
            renderInstructorCalendarData();
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

/**
 * Remove an instructor class from all students
 */
function removeInstructorClass(slotData, day, hour) {
    if (!instructorCalendarState.selectedInstructorId) return;
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var duration = slotData.duration || 1;
    var studentIds = slotData.students ? slotData.students.map(function(s) { return s.studentId; }) : [];
    var disciplineId = slotData.disciplineId;
    
    // Remove from all students
    studentIds.forEach(function(studentId) {
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
                if (typeof setClassDuration === 'function') {
                    setClassDuration(studentId, week, day, h, null);
                }
            }
        }
    });
    
    // Remove template
    if (data.curriculum.instructorTemplates) {
        var templateKey = instructorId + '_' + week;
        var classKey = day + '_' + hour;
        if (data.curriculum.instructorTemplates[templateKey]) {
            delete data.curriculum.instructorTemplates[templateKey][classKey];
            if (Object.keys(data.curriculum.instructorTemplates[templateKey]).length === 0) {
                delete data.curriculum.instructorTemplates[templateKey];
            }
        }
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            var discipline = getDiscipline(disciplineId);
            logActivity('Removed class ' + (discipline ? discipline.name : '') + ' from ' + studentIds.length + ' student(s)');
        }
        renderInstructorCalendarData();
        if (typeof renderSchedule === 'function') {
            renderSchedule();
        }
        alert('Class removed!');
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderInstructorCalendarData();
    });
}

/**
 * Show modal to add blocked time
 */
function showAddBlockModal() {
    if (!instructorCalendarState.selectedInstructorId) {
        alert('Please select an instructor first.');
        return;
    }
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>🔬 Block Time</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Day *:</label>
                    <select id="block-day" style="width:100%;padding:8px;">
                        ${[1,2,3,4,5,6,7].map(function(d) {
                            return '<option value="' + d + '">' + dayNames[d] + '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Hour *:</label>
                    <select id="block-hour" style="width:100%;padding:8px;">
                        ${[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(function(h) {
                            var hourDisplay = h > 12 ? h - 12 : h;
                            var ampm = h >= 12 ? 'PM' : 'AM';
                            if (h === 0) { hourDisplay = 12; ampm = 'AM'; }
                            if (h === 12) { ampm = 'PM'; }
                            return '<option value="' + h + '">' + hourDisplay + ':00 ' + ampm + '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Label (optional):</label>
                    <input type="text" id="block-label" placeholder="e.g., Research, Office Hours..." style="width:100%;padding:8px;">
                </div>
                <div class="form-group">
                    <label>Duration (hours):</label>
                    <select id="block-duration" style="width:100%;padding:8px;">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                    </select>
                </div>
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-block" class="secondary">Cancel</button>
                    <button type="button" id="confirm-block" class="primary">Block Time</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-block').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-block').onclick = function() {
        var day = parseInt(document.getElementById('block-day').value);
        var hour = parseInt(document.getElementById('block-hour').value);
        var label = document.getElementById('block-label').value.trim() || 'Research/Office Time';
        var duration = parseInt(document.getElementById('block-duration').value) || 1;
        
        if (!data.curriculum.instructorBlocks) {
            data.curriculum.instructorBlocks = {};
        }
        var blockKey = instructorId + '_' + week;
        if (!data.curriculum.instructorBlocks[blockKey]) {
            data.curriculum.instructorBlocks[blockKey] = {};
        }
        if (!data.curriculum.instructorBlocks[blockKey][day]) {
            data.curriculum.instructorBlocks[blockKey][day] = {};
        }
        
        // Remove any existing blocks in this range
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            delete data.curriculum.instructorBlocks[blockKey][day][h];
        }
        
        data.curriculum.instructorBlocks[blockKey][day][hour] = {
            label: label,
            duration: duration
        };
        
        modal.remove();
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Blocked time for instructor: ' + label + ' (' + duration + 'h)');
            }
            renderInstructorCalendarData();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            renderInstructorCalendarData();
        });
    };
}

/**
 * Show block management modal
 */
function showBlockManagementModal(day, hour) {
    if (!instructorCalendarState.selectedInstructorId) return;
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var blockKey = instructorId + '_' + week;
    
    if (!data.curriculum.instructorBlocks || !data.curriculum.instructorBlocks[blockKey]) return;
    if (!data.curriculum.instructorBlocks[blockKey][day] || !data.curriculum.instructorBlocks[blockKey][day][hour]) return;
    
    var blockData = data.curriculum.instructorBlocks[blockKey][day][hour];
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>🔬 ${blockData.label || 'Blocked Time'}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm}</span></div>
                <div class="detail-row"><span class="label">Duration:</span> <span>${blockData.duration || 1} hour(s)</span></div>
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-block" class="danger small">✕ Remove Block</button>
                    <button type="button" id="close-block" class="secondary small">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#close-block').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#remove-block').onclick = function() {
        if (confirm('Remove this blocked time?')) {
            removeBlockedTime(day, hour);
            modal.remove();
        }
    };
}

/**
 * Remove blocked time
 */
function removeBlockedTime(day, hour) {
    if (!instructorCalendarState.selectedInstructorId) return;
    
    var week = instructorCalendarState.currentWeek;
    var instructorId = instructorCalendarState.selectedInstructorId;
    var blockKey = instructorId + '_' + week;
    
    if (data.curriculum.instructorBlocks && data.curriculum.instructorBlocks[blockKey]) {
        if (data.curriculum.instructorBlocks[blockKey][day]) {
            delete data.curriculum.instructorBlocks[blockKey][day][hour];
            if (Object.keys(data.curriculum.instructorBlocks[blockKey][day]).length === 0) {
                delete data.curriculum.instructorBlocks[blockKey][day];
            }
            if (Object.keys(data.curriculum.instructorBlocks[blockKey]).length === 0) {
                delete data.curriculum.instructorBlocks[blockKey];
            }
        }
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Removed blocked time');
        }
        renderInstructorCalendarData();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderInstructorCalendarData();
    });
}

/**
 * Populate instructor selector
 */
function populateInstructorCalendarSelector() {
    var select = document.getElementById('instructor-calendar-select');
    if (!select) return;
    
    var instructors = getInstructors();
    var currentValue = select.value;
    
    select.innerHTML = '<option value="">Select an instructor...</option>';
    instructors.forEach(function(instructor) {
        var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
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
 * Initialize instructor calendar events
 */
function initInstructorCalendarEvents() {
    var select = document.getElementById('instructor-calendar-select');
    if (select) {
        select.addEventListener('change', function() {
            instructorCalendarState.selectedInstructorId = this.value;
            renderInstructorCalendarData();
        });
    }
    
    var prevBtn = document.getElementById('prev-instructor-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (instructorCalendarState.currentWeek > 1) {
                instructorCalendarState.currentWeek--;
                renderInstructorCalendarData();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-instructor-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (instructorCalendarState.currentWeek < 52) {
                instructorCalendarState.currentWeek++;
                renderInstructorCalendarData();
            }
        });
    }
    
    var gotoBtn = document.getElementById('goto-instructor-week');
    if (gotoBtn) {
        gotoBtn.addEventListener('click', function() {
            var week = prompt('Enter week number (1-52):', instructorCalendarState.currentWeek);
            if (week) {
                var w = parseInt(week);
                if (!isNaN(w) && w >= 1 && w <= 52) {
                    instructorCalendarState.currentWeek = w;
                    renderInstructorCalendarData();
                } else {
                    alert('Please enter a valid week (1-52).');
                }
            }
        });
    }
    
    var addClassBtn = document.getElementById('add-instructor-class-btn');
    if (addClassBtn) {
        addClassBtn.addEventListener('click', function() {
            showAddClassModal(5, 8); // Default to Monday 8am
        });
    }
    
    var addBlockBtn = document.getElementById('add-instructor-block-btn');
    if (addBlockBtn) {
        addBlockBtn.addEventListener('click', showAddBlockModal);
    }
}

// Make functions globally available
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderInstructorCalendarData = renderInstructorCalendarData;
window.populateInstructorCalendarSelector = populateInstructorCalendarSelector;
window.initInstructorCalendarEvents = initInstructorCalendarEvents;
window.showAddClassModal = showAddClassModal;
window.showAddBlockModal = showAddBlockModal;
window.showClassManagementModal = showClassManagementModal;
window.showBlockManagementModal = showBlockManagementModal;
window.removeBlockedTime = removeBlockedTime;
window.removeInstructorClass = removeInstructorClass;
window.instructorCalendarState = instructorCalendarState;
