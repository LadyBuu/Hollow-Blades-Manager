/**
 * instructor-calendar.js - Instructor Calendar Module
 * Shows all classes for a selected instructor
 * Click a slot to add/view/remove classes
 * Supports multi-hour class durations
 * Build schedule first, assign students later
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
        <div id="instructor-calendar-container">
            <p class="empty-state">Select an instructor to view their schedule</p>
        </div>
    `;
    
    // Populate instructor selector
    populateInstructorCalendarSelector();
    
    // Initialize events
    initInstructorCalendarEvents();
    
    // Render the calendar
    renderInstructorCalendarData();
}

/**
 * Render instructor calendar data
 */
function renderInstructorCalendarData() {
    var container = document.getElementById('instructor-calendar-container');
    if (!container) return;
    
    var weekDisplay = document.getElementById('instructor-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + instructorCalendarState.currentWeek;
    
    // Populate instructor selector (ensures it's up to date)
    populateInstructorCalendarSelector();
    
    if (!instructorCalendarState.selectedInstructorId) {
        container.innerHTML = '<p class="empty-state">Select an instructor to view their schedule</p>';
        return;
    }
    
    var instructor = data.characters.find(function(c) { 
        return String(c.id) === String(instructorCalendarState.selectedInstructorId); 
    });
    if (!instructor) {
        container.innerHTML = '<p class="empty-state">Instructor not found</p>';
        return;
    }
    
    var instructorName = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
    
    // Find all classes taught by this instructor in the current week
    var classSlots = {}; // key: day_hour, value: class info
    var students = getStudents();
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, instructorCalendarState.currentWeek);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                var disciplineId = schedule[day][hour];
                if (disciplineId) {
                    var discipline = getDiscipline(disciplineId);
                    if (discipline) {
                        // Check if this instructor is assigned to this specific class
                        var classInstructorId = null;
                        if (typeof getClassInstructor === 'function') {
                            classInstructorId = getClassInstructor(student.id, instructorCalendarState.currentWeek, parseInt(day), parseInt(hour));
                        }
                        
                        var isTeaching = false;
                        if (classInstructorId) {
                            isTeaching = String(classInstructorId) === String(instructorCalendarState.selectedInstructorId);
                        } else if (discipline.instructorIds) {
                            isTeaching = discipline.instructorIds.some(function(id) { 
                                return String(id) === String(instructorCalendarState.selectedInstructorId); 
                            });
                        }
                        
                        if (isTeaching) {
                            var key = day + '_' + hour;
                            if (!classSlots[key]) {
                                classSlots[key] = {
                                    day: parseInt(day),
                                    hour: parseInt(hour),
                                    discipline: discipline,
                                    disciplineId: disciplineId,
                                    students: [],
                                    instructorId: classInstructorId || instructorCalendarState.selectedInstructorId,
                                    label: null,
                                    duration: 1
                                };
                            }
                            // Get the class label if it exists
                            if (typeof getClassLabel === 'function') {
                                var label = getClassLabel(student.id, instructorCalendarState.currentWeek, parseInt(day), parseInt(hour));
                                if (label && !classSlots[key].label) {
                                    classSlots[key].label = label;
                                }
                            }
                            // Get the class duration if it exists
                            if (typeof getClassDuration === 'function') {
                                var duration = getClassDuration(student.id, instructorCalendarState.currentWeek, parseInt(day), parseInt(hour));
                                if (duration && duration > classSlots[key].duration) {
                                    classSlots[key].duration = duration;
                                }
                            }
                            classSlots[key].students.push({
                                student: student,
                                studentId: student.id
                            });
                        }
                    }
                }
            }
        }
    });
    
    // Convert to array and sort
    var classArray = Object.values(classSlots).sort(function(a, b) {
        if (a.day !== b.day) return a.day - b.day;
        return a.hour - b.hour;
    });
    
    // Build the calendar grid with scroll wrapper - ALWAYS show the grid
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hours = [];
    for (var h = 5; h <= 23; h++) {
        hours.push(h);
    }
    
    var html = '<div class="instructor-calendar-wrapper">';
    html += '<div class="instructor-calendar-grid">';
    
    // Header row
    html += '<div class="header-cell">Time</div>';
    for (var d = 1; d <= 7; d++) {
        html += '<div class="header-cell">' + dayNames[d].substring(0, 3) + '</div>';
    }
    
    // Track occupied hours for multi-hour classes
    var occupiedHours = {};
    
    // Time slots
    hours.forEach(function(hour) {
        var hourDisplay = hour > 12 ? hour - 12 : hour;
        var ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (hour === 12) { ampm = 'PM'; }
        
        // Check if any class starts at this hour
        var hasStartingClass = false;
        for (var d = 1; d <= 7; d++) {
            var slot = classArray.find(function(c) { return c.day === d && c.hour === hour; });
            if (slot) {
                hasStartingClass = true;
                break;
            }
        }
        
        // If no class starts at this hour and it's occupied, skip
        var isOccupied = false;
        for (var d = 1; d <= 7; d++) {
            var key = d + '_' + hour;
            if (occupiedHours[key]) {
                isOccupied = true;
                break;
            }
        }
        
        if (!hasStartingClass && isOccupied) {
            return;
        }
        
        html += '<div class="time-cell">' + hourDisplay + ':00</div>';
        
        for (var d = 1; d <= 7; d++) {
            var key = d + '_' + hour;
            
            // Check if this hour is already occupied by a multi-hour class
            if (occupiedHours[key]) {
                html += '<div class="empty-cell" style="opacity:0.1;">·</div>';
                continue;
            }
            
            var slot = classArray.find(function(c) { return c.day === d && c.hour === hour; });
            if (slot) {
                var duration = slot.duration || 1;
                var displayName = slot.label ? slot.discipline.name + ' [' + slot.label + ']' : slot.discipline.name;
                var durationDisplay = duration > 1 ? ' (' + duration + 'h)' : '';
                var studentCount = slot.students.length;
                var studentNames = slot.students.map(function(s) {
                    return [s.student.firstName, s.student.lastName].filter(function(n) { return n; }).join(' ');
                });
                
                // Mark occupied hours for this duration
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    occupiedHours[d + '_' + h] = true;
                }
                
                // Calculate height based on duration
                var heightMultiplier = duration;
                
                html += '<div class="class-cell has-class" data-day="' + d + '" data-hour="' + hour + '" data-discipline="' + slot.disciplineId + '" data-label="' + (slot.label || '') + '" data-duration="' + duration + '" data-students=\'' + JSON.stringify(slot.students.map(function(s) { return s.studentId; })) + '\' title="Click to view/manage" style="grid-row: span ' + heightMultiplier + '; min-height: ' + (40 * heightMultiplier) + 'px; height: ' + (40 * heightMultiplier) + 'px;">';
                html += '<div class="class-name">' + displayName + durationDisplay + '</div>';
                html += '<div class="student-count">' + studentCount + ' student' + (studentCount !== 1 ? 's' : '') + '</div>';
                // Show first student name if any
                if (studentNames.length > 0) {
                    html += '<div class="student-name">' + studentNames[0] + (studentNames.length > 1 ? ' +' + (studentNames.length - 1) + ' more' : '') + '</div>';
                }
                html += '</div>';
            } else {
                // Empty slot - click to add class
                html += '<div class="class-cell empty-slot" data-day="' + d + '" data-hour="' + hour + '" title="Click to add class">';
                html += '<div class="add-indicator">+</div>';
                html += '</div>';
            }
        }
    });
    
    html += '</div>';
    html += '</div>';
    
    // Summary - only show if there are classes
    if (classArray.length > 0) {
        html += '<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">';
        
        // Total classes
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
        html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Summary</h4>';
        html += '<p style="font-size:0.8rem;">Total Classes: <strong>' + classArray.length + '</strong></p>';
        // Group by discipline
        var disciplineCounts = {};
        classArray.forEach(function(c) {
            if (!disciplineCounts[c.discipline.name]) disciplineCounts[c.discipline.name] = 0;
            disciplineCounts[c.discipline.name]++;
        });
        html += '<div style="margin-top:4px;font-size:0.75rem;color:var(--text-dim);">';
        for (var name in disciplineCounts) {
            html += '<div>' + name + ': ' + disciplineCounts[name] + ' class(es)</div>';
        }
        html += '</div>';
        html += '</div>';
        
        // Total Students
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
        html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Students</h4>';
        var studentSet = {};
        classArray.forEach(function(c) {
            c.students.forEach(function(s) {
                var name = [s.student.firstName, s.student.lastName].filter(function(n) { return n; }).join(' ');
                studentSet[name] = true;
            });
        });
        html += '<p style="font-size:0.8rem;">Total Students: <strong>' + Object.keys(studentSet).length + '</strong></p>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;max-height:100px;overflow-y:auto;">';
        for (var s in studentSet) {
            html += '<span style="background:var(--bg);padding:2px 8px;border-radius:12px;font-size:0.7rem;">' + s + '</span>';
        }
        html += '</div>';
        html += '</div>';
        
        // Class Labels with durations
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
        html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Class Labels</h4>';
        var labels = {};
        classArray.forEach(function(c) {
            var key = c.discipline.name + (c.label ? ' (' + c.label + ')' : '') + (c.duration > 1 ? ' [' + c.duration + 'h]' : '');
            if (!labels[key]) labels[key] = 0;
            labels[key] += c.students.length;
        });
        html += '<div style="font-size:0.75rem;color:var(--text-dim);">';
        for (var label in labels) {
            html += '<div><strong>' + label + '</strong>: ' + labels[label] + ' student' + (labels[label] > 1 ? 's' : '') + '</div>';
        }
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Add click handlers to empty slots - add class
    container.querySelectorAll('.empty-slot').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var day = parseInt(this.dataset.day);
            var hour = parseInt(this.dataset.hour);
            showAddClassModal(day, hour);
        });
    });
    
    // Add click handlers to class cells - view/manage
    container.querySelectorAll('.class-cell.has-class').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var day = parseInt(this.dataset.day);
            var hour = parseInt(this.dataset.hour);
            var disciplineId = this.dataset.discipline;
            var label = this.dataset.label || '';
            var duration = parseInt(this.dataset.duration) || 1;
            var studentIds = JSON.parse(this.dataset.students);
            
            showClassManagementModal(disciplineId, day, hour, studentIds, label, duration);
        });
    });
}

/**
 * Show modal to add a class by clicking an empty slot
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
    
    // Get available disciplines for this week that have this instructor
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
                        ⚡ The class will be added to the schedule. You can assign students to it later by clicking on the class slot.
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
        
        // Check if slots are available
        var hasConflict = false;
        var students = getStudents();
        var conflictDetails = [];
        
        students.forEach(function(student) {
            var schedule = getStudentSchedule(student.id, week);
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    // Check if this instructor is teaching that class
                    var discId = schedule[day][h];
                    var disc = getDiscipline(discId);
                    if (disc) {
                        var classInstructorId = null;
                        if (typeof getClassInstructor === 'function') {
                            classInstructorId = getClassInstructor(student.id, week, day, h);
                        }
                        var isTeaching = false;
                        if (classInstructorId) {
                            isTeaching = String(classInstructorId) === String(instructorId);
                        } else if (disc.instructorIds) {
                            isTeaching = disc.instructorIds.some(function(id) { 
                                return String(id) === String(instructorId); 
                            });
                        }
                        if (isTeaching) {
                            var studentName = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
                            conflictDetails.push(studentName + ' has ' + disc.name + ' at ' + h + ':00');
                            hasConflict = true;
                        }
                    }
                }
            }
        });
        
        if (hasConflict) {
            if (!confirm('⚠ The instructor already has classes at this time for these students:\n\n' + conflictDetails.join('\n') + '\n\nAdd anyway?')) {
                return;
            }
        }
        
        // Add the class to the schedule (without students)
        // We need to create the class in the system - we'll add it to a "template" student
        // or we can store it separately. For now, we'll add it to a special "schedule" object.
        
        // Check if we have a separate schedule storage for instructor classes
        if (!data.curriculum.instructorClasses) {
            data.curriculum.instructorClasses = {};
        }
        var key = instructorId + '_' + week + '_' + day + '_' + hour;
        data.curriculum.instructorClasses[key] = {
            disciplineId: disciplineId,
            label: label,
            duration: duration,
            students: [] // No students assigned yet
        };
        
        // Also add to the instructor's schedule for display
        // We'll use the existing schedule system but with a special marker
        // Or we can just store it in the instructorClasses object
        
        modal.remove();
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                var discipline = getDiscipline(disciplineId);
                logActivity('Added class ' + (discipline ? discipline.name : '') + 
                    (label ? ' [' + label + ']' : '') + 
                    ' (' + duration + 'h) for instructor ' + instructorName + ' (no students assigned)');
            }
            renderInstructorCalendarData();
            alert('Class added successfully! Click on the class slot to assign students.');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            renderInstructorCalendarData();
            alert('Class was added but there was a save error. Please check your data.');
        });
    };
}

/**
 * Show class management modal - view, assign students, remove
 */
function showClassManagementModal(disciplineId, day, hour, studentIds, label, duration) {
    var discipline = getDiscipline(disciplineId);
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
    
    // Get all students
    var allStudents = getStudents();
    var assignedStudentIds = studentIds || [];
    
    // Get student names
    var studentNames = [];
    assignedStudentIds.forEach(function(id) {
        var student = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (student) {
            studentNames.push([student.firstName, student.lastName].filter(function(n) { return n; }).join(' '));
        }
    });
    
    var durationDisplay = duration > 1 ? ' (' + duration + ' hours)' : '';
    
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
                
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Assign Students:</label>
                    <div style="max-height:150px;overflow-y:auto;margin-top:4px;">
                        ${allStudents.map(function(s) {
                            var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                            var isAssigned = assignedStudentIds.some(function(id) { return String(id) === String(s.id); });
                            // Check if student already has a class at this time
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
    
    // Assign students
    modal.querySelector('#assign-students-btn').onclick = function() {
        var selectedStudents = [];
        modal.querySelectorAll('.assign-student-checkbox:checked').forEach(function(cb) {
            selectedStudents.push(cb.value);
        });
        
        // Get current assigned students
        var currentAssigned = assignedStudentIds || [];
        
        // Find students to add and remove
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
                schedule[day][h] = disciplineId;
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
        
        // Update instructorClasses storage
        if (data.curriculum.instructorClasses) {
            var key = instructorId + '_' + week + '_' + day + '_' + hour;
            if (data.curriculum.instructorClasses[key]) {
                data.curriculum.instructorClasses[key].students = selectedStudents;
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
    
    // Remove class
    modal.querySelector('#remove-class-all').onclick = function() {
        var studentCount = assignedStudentIds.length;
        var confirmMsg = 'Remove this class from ALL ' + studentCount + ' student(s)?\n\n' + studentNames.join('\n');
        if (!confirm(confirmMsg)) return;
        
        // Remove from all students
        var removedCount = 0;
        assignedStudentIds.forEach(function(studentId) {
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
            removedCount++;
        });
        
        // Also remove from instructorClasses
        if (data.curriculum.instructorClasses) {
            var key = instructorId + '_' + week + '_' + day + '_' + hour;
            delete data.curriculum.instructorClasses[key];
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Removed class ' + discipline.name + (label ? ' [' + label + ']' : '') + ' from ' + removedCount + ' student(s)');
            }
            modal.remove();
            renderInstructorCalendarData();
            if (typeof renderSchedule === 'function') {
                renderSchedule();
            }
            alert('Class removed from ' + removedCount + ' student(s)!');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to remove class.');
        });
    };
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
}

// Make functions globally available
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderInstructorCalendarData = renderInstructorCalendarData;
window.populateInstructorCalendarSelector = populateInstructorCalendarSelector;
window.initInstructorCalendarEvents = initInstructorCalendarEvents;
window.showAddClassModal = showAddClassModal;
window.showClassManagementModal = showClassManagementModal;
window.instructorCalendarState = instructorCalendarState;
