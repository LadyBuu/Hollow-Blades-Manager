/**
 * instructor-calendar.js - Instructor Calendar Module
 * Shows all classes for a selected instructor
 * Click a slot to view details and remove from all students
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
            <h2>🧑‍🏫 Instructor Calendar</h2>
            <div class="header-actions">
                <button id="add-class-to-instructor-btn" class="primary small">+ Add Class</button>
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
    var classSlots = {}; // key: day_hour, value: array of student info
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
                                    label: null
                                };
                            }
                            // Get the class label if it exists
                            if (typeof getClassLabel === 'function') {
                                var label = getClassLabel(student.id, instructorCalendarState.currentWeek, parseInt(day), parseInt(hour));
                                if (label && !classSlots[key].label) {
                                    classSlots[key].label = label;
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
    
    if (classArray.length === 0) {
        container.innerHTML = '<p class="empty-state">' + instructorName + ' has no classes scheduled for week ' + instructorCalendarState.currentWeek + '</p>';
        return;
    }
    
    // Build the calendar grid with scroll wrapper
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
    
    // Time slots
    hours.forEach(function(hour) {
        var hourDisplay = hour > 12 ? hour - 12 : hour;
        var ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (hour === 12) { ampm = 'PM'; }
        html += '<div class="time-cell">' + hourDisplay + ':00</div>';
        
        for (var d = 1; d <= 7; d++) {
            var slot = classArray.find(function(c) { return c.day === d && c.hour === hour; });
            if (slot) {
                var displayName = slot.label ? slot.discipline.name + ' [' + slot.label + ']' : slot.discipline.name;
                var studentNames = slot.students.map(function(s) {
                    return [s.student.firstName, s.student.lastName].filter(function(n) { return n; }).join(' ');
                });
                
                html += '<div class="class-cell" data-day="' + d + '" data-hour="' + hour + '" data-discipline="' + slot.disciplineId + '" data-label="' + (slot.label || '') + '" data-students=\'' + JSON.stringify(slot.students.map(function(s) { return s.studentId; })) + '\' title="Click to view/remove">';
                html += '<div class="class-name">' + displayName + '</div>';
                html += '<div class="student-count">' + studentNames.length + ' student' + (studentNames.length > 1 ? 's' : '') + '</div>';
                // Show first 2 student names
                var displayStudents = studentNames.slice(0, 2);
                if (displayStudents.length > 0) {
                    html += '<div class="student-name">' + displayStudents.join(', ') + (studentNames.length > 2 ? ' +' + (studentNames.length - 2) + ' more' : '') + '</div>';
                }
                html += '</div>';
            } else {
                html += '<div class="empty-cell">·</div>';
            }
        }
    });
    
    html += '</div>';
    html += '</div>';
    
    // Summary
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
    
    // Class Labels
    html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
    html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Class Labels</h4>';
    var labels = {};
    classArray.forEach(function(c) {
        var key = c.discipline.name + (c.label ? ' (' + c.label + ')' : '');
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
    
    container.innerHTML = html;
    
    // Add click handlers to class cells - opens details modal with remove option
    container.querySelectorAll('.class-cell').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var day = parseInt(this.dataset.day);
            var hour = parseInt(this.dataset.hour);
            var disciplineId = this.dataset.discipline;
            var label = this.dataset.label || '';
            var studentIds = JSON.parse(this.dataset.students);
            
            showInstructorClassDetails(disciplineId, day, hour, studentIds, label);
        });
    });
}

/**
 * Show class details modal with remove option
 */
function showInstructorClassDetails(disciplineId, day, hour, studentIds, label) {
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
    
    // Get student names
    var studentNames = [];
    studentIds.forEach(function(id) {
        var student = data.characters.find(function(c) { return String(c.id) === String(id); });
        if (student) {
            studentNames.push([student.firstName, student.lastName].filter(function(n) { return n; }).join(' '));
        }
    });
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <h3>${discipline.name} ${label ? '[' + label + ']' : ''}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Instructor:</span> <span>${instructorName}</span></div>
                <div class="detail-row"><span class="label">Type:</span> <span>${discipline.type === 'mandatory' ? '📚 Mandatory' : '🎯 Optional'}</span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm}</span></div>
                <div class="detail-row"><span class="label">Week:</span> <span>${week}</span></div>
                <div class="detail-row"><span class="label">Students (${studentNames.length}):</span> <span style="font-size:0.8rem;">${studentNames.join(', ')}</span></div>
                
                <div style="margin-top:16px;padding:12px;background:var(--danger-soft);border-radius:6px;border:1px solid var(--danger);">
                    <p style="color:var(--danger);font-size:0.85rem;margin-bottom:4px;font-weight:600;">⚠️ Remove this class?</p>
                    <p style="color:var(--text-dim);font-size:0.75rem;">This will remove the class from <strong>ALL ${studentNames.length} student(s)</strong> listed above.</p>
                </div>
                
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-class-all" class="danger">🗑️ Remove from All Students</button>
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
    
    modal.querySelector('#remove-class-all').onclick = function() {
        var studentCount = studentNames.length;
        var confirmMsg = 'Remove this class from ALL ' + studentCount + ' student(s)?\n\n' + studentNames.join('\n');
        if (!confirm(confirmMsg)) return;
        
        // Remove from all students
        var removedCount = 0;
        studentIds.forEach(function(studentId) {
            var schedule = getStudentSchedule(studentId, week);
            if (schedule[day] && schedule[day][hour]) {
                delete schedule[day][hour];
                
                // Remove instructor assignment
                if (typeof setClassInstructor === 'function') {
                    setClassInstructor(studentId, week, day, hour, null);
                }
                // Remove class label
                if (typeof setClassLabel === 'function') {
                    setClassLabel(studentId, week, day, hour, null);
                }
                removedCount++;
            }
        });
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Removed class ' + discipline.name + (label ? ' [' + label + ']' : '') + ' from ' + removedCount + ' student(s) (instructor: ' + instructorName + ')');
            }
            modal.remove();
            renderInstructorCalendarData();
            // Also refresh student schedule if on that page
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
    
    // If we had a selection that's no longer in the list, clear it
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
    
    // Add Class button
    var addBtn = document.getElementById('add-class-to-instructor-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddClassToInstructorModal);
    }
}

/**
 * Show modal to add a class directly to instructor calendar
 */
function showAddClassToInstructorModal() {
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
    
    // Get available disciplines for this week
    var disciplines = getAvailableDisciplines(week);
    // Filter to those that have this instructor assigned
    var availableDisciplines = disciplines.filter(function(d) {
        return d.instructorIds && d.instructorIds.some(function(id) { return String(id) === String(instructorId); });
    });
    
    if (availableDisciplines.length === 0) {
        alert('No disciplines available for this instructor in week ' + week + '.');
        return;
    }
    
    // Get all students
    var students = getStudents();
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3>Add Class - ${instructorName}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Week:</label>
                        <span style="padding:6px 0;display:block;">${week}</span>
                    </div>
                    <div class="form-group">
                        <label>Class Label (A, B, etc.):</label>
                        <input type="text" id="add-class-label" placeholder="e.g., A, B, Group 1..." style="width:100%;padding:6px;">
                    </div>
                    <div class="form-group">
                        <label>Discipline *:</label>
                        <select id="add-class-discipline" style="width:100%;padding:6px;">
                            ${availableDisciplines.map(function(d) {
                                return '<option value="' + d.id + '">' + d.name + '</option>';
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Day *:</label>
                        <select id="add-class-day" style="width:100%;padding:6px;">
                            ${[1,2,3,4,5,6,7].map(function(d) {
                                return '<option value="' + d + '">' + dayNames[d] + '</option>';
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Hour *:</label>
                        <select id="add-class-hour" style="width:100%;padding:6px;">
                            ${[5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(function(h) {
                                var hourDisplay = h > 12 ? h - 12 : h;
                                var ampm = h >= 12 ? 'PM' : 'AM';
                                if (h === 0) { hourDisplay = 12; ampm = 'AM'; }
                                if (h === 12) { ampm = 'PM'; }
                                return '<option value="' + h + '">' + hourDisplay + ':00 ' + ampm + '</option>';
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Students:</label>
                        <div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:8px;background:var(--bg);">
                            ${students.map(function(s) {
                                var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                                // Check if student already has this class
                                var schedule = getStudentSchedule(s.id, week);
                                var hasClass = false;
                                var selectedDay = document.getElementById('add-class-day') ? parseInt(document.getElementById('add-class-day').value) : 1;
                                var selectedHour = document.getElementById('add-class-hour') ? parseInt(document.getElementById('add-class-hour').value) : 8;
                                if (schedule[selectedDay] && schedule[selectedDay][selectedHour]) {
                                    hasClass = true;
                                }
                                return '<label style="display:block;padding:2px 0;font-size:0.8rem;cursor:pointer;">' +
                                    '<input type="checkbox" class="add-class-student" value="' + s.id + '" ' + (hasClass ? 'disabled' : '') + '> ' + 
                                    name + (hasClass ? ' <span style="color:var(--danger);font-size:0.7rem;">(already has class)</span>' : '') +
                                '</label>';
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-add-instructor-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-instructor-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Update student list when day/hour changes to show conflicts
    var daySelect = document.getElementById('add-class-day');
    var hourSelect = document.getElementById('add-class-hour');
    
    function updateStudentList() {
        var day = parseInt(daySelect.value);
        var hour = parseInt(hourSelect.value);
        var studentCheckboxes = modal.querySelectorAll('.add-class-student');
        
        studentCheckboxes.forEach(function(cb) {
            var studentId = cb.value;
            var schedule = getStudentSchedule(studentId, week);
            var hasClass = schedule[day] && schedule[day][hour];
            if (hasClass) {
                cb.disabled = true;
                cb.checked = false;
                var label = cb.parentElement;
                if (!label.querySelector('.conflict-warning')) {
                    var warning = document.createElement('span');
                    warning.className = 'conflict-warning';
                    warning.style.cssText = 'color:var(--danger);font-size:0.7rem;margin-left:4px;';
                    warning.textContent = '(conflict)';
                    label.appendChild(warning);
                }
            } else {
                cb.disabled = false;
                var label = cb.parentElement;
                var warning = label.querySelector('.conflict-warning');
                if (warning) warning.remove();
            }
        });
    }
    
    daySelect.addEventListener('change', updateStudentList);
    hourSelect.addEventListener('change', updateStudentList);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-instructor-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-add-instructor-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-discipline').value;
        var day = parseInt(document.getElementById('add-class-day').value);
        var hour = parseInt(document.getElementById('add-class-hour').value);
        var label = document.getElementById('add-class-label').value.trim();
        
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
        // Get selected students
        var selectedStudents = [];
        modal.querySelectorAll('.add-class-student:checked').forEach(function(cb) {
            selectedStudents.push(cb.value);
        });
        
        if (selectedStudents.length === 0) {
            alert('Please select at least one student.');
            return;
        }
        
        // Add the class to each selected student
        var addedCount = 0;
        selectedStudents.forEach(function(studentId) {
            var schedule = getStudentSchedule(studentId, week);
            if (!schedule[day]) schedule[day] = {};
            
            // Check if slot is already occupied
            if (schedule[day][hour]) {
                return;
            }
            
            schedule[day][hour] = disciplineId;
            
            // Set the instructor for this class
            if (typeof setClassInstructor === 'function') {
                setClassInstructor(studentId, week, day, hour, instructorId);
            }
            
            // Set the class label
            if (label && typeof setClassLabel === 'function') {
                setClassLabel(studentId, week, day, hour, label);
            }
            
            addedCount++;
        });
        
        if (addedCount === 0) {
            alert('No classes were added. They may already exist.');
            modal.remove();
            return;
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                var discipline = getDiscipline(disciplineId);
                logActivity('Added class ' + (discipline ? discipline.name : '') + 
                    (label ? ' (' + label + ')' : '') + 
                    ' to ' + addedCount + ' students for instructor ' + instructorName);
            }
            modal.remove();
            renderInstructorCalendarData();
            // Also refresh student schedule if on that page
            if (typeof renderSchedule === 'function') {
                renderSchedule();
            }
            alert('Class added to ' + addedCount + ' student(s)!');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to add classes.');
        });
    };
}

// Make functions globally available
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderInstructorCalendarData = renderInstructorCalendarData;
window.populateInstructorCalendarSelector = populateInstructorCalendarSelector;
window.initInstructorCalendarEvents = initInstructorCalendarEvents;
window.showAddClassToInstructorModal = showAddClassToInstructorModal;
window.showInstructorClassDetails = showInstructorClassDetails;
window.instructorCalendarState = instructorCalendarState;
