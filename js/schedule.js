/**
 * schedule.js - Per-Student Schedule Calendar
 * Handles individual student schedules, week by week
 * Updated to support multiple instructors per discipline
 */

// Schedule state
var scheduleState = {
    currentWeek: 1,
    selectedStudentId: null
};

/**
 * Initialize the schedule system
 */
function initScheduleSystem() {
    if (!data.curriculum) {
        data.curriculum = {
            disciplines: [],
            schedules: {},
            restDays: {},
            examDays: {},
            grades: {},
            rankings: {},
            currentWeek: 1,
            classInstructors: {}
        };
    }
    if (!data.curriculum.schedules) {
        data.curriculum.schedules = {};
    }
    if (!data.curriculum.restDays) {
        data.curriculum.restDays = {};
    }
    if (!data.curriculum.classInstructors) {
        data.curriculum.classInstructors = {};
    }
}

/**
 * Get a student's schedule for a specific week
 */
function getStudentSchedule(studentId, week) {
    initScheduleSystem();
    var weekNum = parseInt(week) || 1;
    if (!data.curriculum.schedules[studentId]) {
        data.curriculum.schedules[studentId] = {};
    }
    if (!data.curriculum.schedules[studentId][weekNum]) {
        data.curriculum.schedules[studentId][weekNum] = {};
    }
    return data.curriculum.schedules[studentId][weekNum];
}

/**
 * Get the instructor for a specific class slot
 */
function getClassInstructor(studentId, week, day, hour) {
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    return data.curriculum.classInstructors ? data.curriculum.classInstructors[key] : null;
}

/**
 * Set the instructor for a specific class slot
 */
function setClassInstructor(studentId, week, day, hour, instructorId) {
    if (!data.curriculum.classInstructors) {
        data.curriculum.classInstructors = {};
    }
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    if (instructorId) {
        data.curriculum.classInstructors[key] = instructorId;
    } else {
        delete data.curriculum.classInstructors[key];
    }
}

/**
 * Get all disciplines a student is scheduled for in a week with hours count
 */
function getStudentDisciplineHours(studentId, week) {
    var schedule = getStudentSchedule(studentId, week);
    var disciplineHours = {};
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            var discId = schedule[day][hour];
            if (discId) {
                if (!disciplineHours[discId]) disciplineHours[discId] = 0;
                disciplineHours[discId]++;
            }
        }
    }
    return disciplineHours;
}

/**
 * Get available disciplines for a student in a week with instructor info
 */
function getAvailableDisciplinesForStudent(studentId, week) {
    var allDisciplines = getAvailableDisciplines(week);
    var used = getStudentDisciplineHours(studentId, week);
    var available = [];
    allDisciplines.forEach(function(d) {
        var usedCount = used[d.id] || 0;
        var maxHours = d.weeklyHours || 1;
        if (usedCount < maxHours) {
            var instructors = [];
            if (d.instructorIds) {
                d.instructorIds.forEach(function(id) {
                    var instructor = data.characters.find(function(c) { return String(c.id) === String(id); });
                    if (instructor) {
                        instructors.push([instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' '));
                    }
                });
            }
            available.push({
                discipline: d,
                used: usedCount,
                maxHours: maxHours,
                remaining: maxHours - usedCount,
                instructorIds: d.instructorIds || [],
                instructorNames: instructors
            });
        }
    });
    return available;
}

/**
 * Get instructor names for a discipline
 */
function getInstructorNames(discipline) {
    var names = [];
    if (discipline && discipline.instructorIds) {
        discipline.instructorIds.forEach(function(id) {
            var instructor = data.characters.find(function(c) { return String(c.id) === String(id); });
            if (instructor) {
                names.push([instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' '));
            }
        });
    }
    return names;
}

/**
 * Render the schedule view
 */
function renderScheduleView(container) {
    initScheduleSystem();
    
    container.innerHTML = `
        <div class="page-header">
            <h2>Student Schedule</h2>
            <div class="header-actions">
                <button id="duplicate-schedule-btn" class="primary small">📋 Duplicate to Next Week</button>
                <button id="clear-schedule-btn" class="danger small">🗑️ Clear Week</button>
            </div>
        </div>

        <div class="calendar-controls">
            <div class="student-selector">
                <label for="schedule-student">Student:</label>
                <select id="schedule-student">
                    <option value="">Select a student...</option>
                </select>
            </div>
            <div class="week-nav">
                <button id="prev-schedule-week" class="small">← Prev</button>
                <span id="schedule-week-display" style="font-weight:600;min-width:80px;text-align:center;">Week 1</span>
                <button id="next-schedule-week" class="small">Next →</button>
                <button id="goto-schedule-week" class="small primary">Go to Week</button>
            </div>
        </div>

        <!-- Schedule Grid with scroll wrapper for mobile -->
        <div class="schedule-grid-wrapper" id="schedule-grid-wrapper">
            <div class="schedule-grid" id="schedule-grid">
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

        <!-- Sidebar -->
        <div class="schedule-sidebar">
            <div class="sidebar-section">
                <h4>Week Overview</h4>
                <div id="schedule-overview">
                    <p class="empty-state">No classes scheduled</p>
                </div>
            </div>
            <div class="sidebar-section">
                <h4>Available Disciplines</h4>
                <div id="schedule-available">
                    <p class="empty-state">No disciplines available</p>
                </div>
            </div>
            <div class="sidebar-section">
                <h4>Rest Days</h4>
                <div class="rest-day-controls">
                    <label><input type="checkbox" class="rest-day-check" data-day="1"> Mon</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="2"> Tue</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="3"> Wed</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="4"> Thu</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="5"> Fri</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="6"> Sat</label>
                    <label><input type="checkbox" class="rest-day-check" data-day="7"> Sun</label>
                </div>
                <button id="save-rest-days-btn" class="small primary" style="margin-top:8px;">Save Rest Days</button>
            </div>
            <div class="sidebar-section">
                <h4>Hours Summary</h4>
                <div id="schedule-hours-summary">
                    <p>Used: <strong id="schedule-hours-used">0</strong> / <span id="schedule-hours-total">0</span></p>
                </div>
            </div>
        </div>
    `;

    // Populate student selector
    populateScheduleStudentSelector();
    
    // Set up events
    initScheduleEvents();
    
    // Render the schedule
    renderSchedule();
}

/**
 * Populate student selector
 */
function populateScheduleStudentSelector() {
    var select = document.getElementById('schedule-student');
    if (!select) return;
    
    var students = getStudents();
    select.innerHTML = '<option value="">Select a student...</option>';
    students.forEach(function(student) {
        var name = [student.firstName, student.middleName, student.lastName].filter(function(n) { return n; }).join(' ');
        var option = document.createElement('option');
        option.value = student.id;
        option.textContent = name;
        select.appendChild(option);
    });
}

/**
 * Initialize schedule events
 */
function initScheduleEvents() {
    // Student selector
    var studentSelect = document.getElementById('schedule-student');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            scheduleState.selectedStudentId = this.value;
            renderSchedule();
        });
    }
    
    // Week navigation - moves by 1 week at a time
    var prevBtn = document.getElementById('prev-schedule-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (scheduleState.currentWeek > 1) {
                scheduleState.currentWeek--;
                renderSchedule();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-schedule-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (scheduleState.currentWeek < 52) {
                scheduleState.currentWeek++;
                renderSchedule();
            }
        });
    }
    
    var gotoBtn = document.getElementById('goto-schedule-week');
    if (gotoBtn) {
        gotoBtn.addEventListener('click', function() {
            var week = prompt('Enter week number (1-52):', scheduleState.currentWeek);
            if (week) {
                var w = parseInt(week);
                if (!isNaN(w) && w >= 1 && w <= 52) {
                    scheduleState.currentWeek = w;
                    renderSchedule();
                } else {
                    alert('Please enter a valid week (1-52).');
                }
            }
        });
    }
    
    // Duplicate schedule - duplicates to week + 1
    var duplicateBtn = document.getElementById('duplicate-schedule-btn');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', duplicateSchedule);
    }
    
    // Clear schedule
    var clearBtn = document.getElementById('clear-schedule-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSchedule);
    }
    
    // Save rest days
    var saveRestBtn = document.getElementById('save-rest-days-btn');
    if (saveRestBtn) {
        saveRestBtn.addEventListener('click', saveRestDays);
    }
    
    // Set initial student if available
    if (studentSelect && studentSelect.options.length > 1) {
        studentSelect.selectedIndex = 1;
        scheduleState.selectedStudentId = studentSelect.value;
        renderSchedule();
    }
}

/**
 * Render the schedule grid
 */
function renderSchedule() {
    var grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    var weekDisplay = document.getElementById('schedule-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + scheduleState.currentWeek;
    
    // Check if student is selected
    if (!scheduleState.selectedStudentId) {
        var dayColumns = grid.querySelectorAll('.day-column');
        dayColumns.forEach(function(col) {
            var slots = col.querySelector('.day-slots');
            if (slots) {
                slots.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;">Select a student</div>';
            }
        });
        updateSidebarEmpty();
        return;
    }
    
    // Get schedule data
    var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
    var restDays = data.curriculum.restDays[scheduleState.currentWeek] || [];
    var availableDisciplines = getAvailableDisciplinesForStudent(
        scheduleState.selectedStudentId, 
        scheduleState.currentWeek
    );
    
    // Build hours (5 AM to 11 PM)
    var hours = [];
    for (var h = 5; h <= 23; h++) {
        hours.push(h);
    }
    
    // Render each day
    var dayColumns = grid.querySelectorAll('.day-column');
    dayColumns.forEach(function(column, index) {
        var day = index + 1;
        var slots = column.querySelector('.day-slots');
        if (!slots) return;
        
        var isRestDay = restDays.indexOf(day) !== -1;
        column.classList.toggle('rest-day', isRestDay);
        
        // Clear slots
        slots.innerHTML = '';
        
        if (isRestDay) {
            var restMsg = document.createElement('div');
            restMsg.className = 'empty-state';
            restMsg.style.padding = '20px';
            restMsg.style.textAlign = 'center';
            restMsg.textContent = '🛑 Rest Day';
            slots.appendChild(restMsg);
            return;
        }
        
        // Create each time slot
        hours.forEach(function(hour) {
            var slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.day = day;
            slot.dataset.hour = hour;
            
            // Time label
            var timeLabel = document.createElement('span');
            timeLabel.className = 'slot-time';
            var hourDisplay = hour > 12 ? hour - 12 : hour;
            var ampm = hour >= 12 ? 'PM' : 'AM';
            if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
            if (hour === 12) { ampm = 'PM'; }
            timeLabel.textContent = hourDisplay + ':00 ' + ampm;
            slot.appendChild(timeLabel);
            
            // Check if this slot has a class
            var disciplineId = null;
            if (schedule[day] && schedule[day][hour]) {
                disciplineId = schedule[day][hour];
            }
            
            if (disciplineId) {
                var discipline = getDiscipline(disciplineId);
                if (discipline) {
                    slot.classList.add('occupied');
                    
                    // Get instructor for this class
                    var instructorId = getClassInstructor(
                        scheduleState.selectedStudentId, 
                        scheduleState.currentWeek, 
                        day, 
                        hour
                    );
                    var instructorName = '';
                    if (instructorId) {
                        var instructor = data.characters.find(function(c) { 
                            return String(c.id) === String(instructorId); 
                        });
                        if (instructor) {
                            instructorName = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                        }
                    }
                    
                    var label = document.createElement('span');
                    label.className = 'slot-label';
                    label.textContent = discipline.name + (instructorName ? ' (' + instructorName + ')' : '');
                    slot.appendChild(label);
                    
                    // Click to show details
                    slot.addEventListener('click', (function(discId, d, h) {
                        return function() {
                            showScheduleClassDetails(
                                scheduleState.selectedStudentId, 
                                discId, 
                                scheduleState.currentWeek, 
                                d, 
                                h
                            );
                        };
                    })(disciplineId, day, hour));
                    
                    // Right-click to remove
                    slot.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (confirm('Remove this class from the schedule?')) {
                            removeScheduleClass(scheduleState.selectedStudentId, scheduleState.currentWeek, day, hour);
                        }
                    });
                } else {
                    // Unknown discipline
                    slot.classList.add('empty');
                    var label = document.createElement('span');
                    label.className = 'slot-label';
                    label.textContent = '❓';
                    slot.appendChild(label);
                }
            } else {
                // Empty slot - click to add
                slot.classList.add('empty');
                var label = document.createElement('span');
                label.className = 'slot-label';
                label.textContent = '+';
                slot.appendChild(label);
                
                slot.addEventListener('click', function() {
                    showAddScheduleClassModal(
                        scheduleState.selectedStudentId,
                        scheduleState.currentWeek,
                        day,
                        hour
                    );
                });
            }
            
            slots.appendChild(slot);
        });
    });
    
    // Update sidebar
    updateScheduleSidebar();
}

/**
 * Update the schedule sidebar
 */
function updateScheduleSidebar() {
    if (!scheduleState.selectedStudentId) {
        updateSidebarEmpty();
        return;
    }
    
    var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
    var available = getAvailableDisciplinesForStudent(
        scheduleState.selectedStudentId,
        scheduleState.currentWeek
    );
    var restDays = data.curriculum.restDays[scheduleState.currentWeek] || [];
    
    // Overview
    var overview = document.getElementById('schedule-overview');
    if (overview) {
        var classList = [];
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                var discId = schedule[day][hour];
                if (discId) {
                    var discipline = getDiscipline(discId);
                    if (discipline) {
                        var instructorId = getClassInstructor(
                            scheduleState.selectedStudentId, 
                            scheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var instructorName = '';
                        if (instructorId) {
                            var instructor = data.characters.find(function(c) { 
                                return String(c.id) === String(instructorId); 
                            });
                            if (instructor) {
                                instructorName = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                            }
                        }
                        classList.push({
                            day: parseInt(day),
                            hour: parseInt(hour),
                            name: discipline.name,
                            instructor: instructorName
                        });
                    }
                }
            }
        }
        
        if (classList.length === 0) {
            overview.innerHTML = '<p class="empty-state">No classes scheduled</p>';
        } else {
            var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            classList.sort(function(a, b) {
                if (a.day !== b.day) return a.day - b.day;
                return a.hour - b.hour;
            });
            var html = '';
            classList.forEach(function(cls) {
                var hourDisplay = cls.hour > 12 ? cls.hour - 12 : cls.hour;
                var ampm = cls.hour >= 12 ? 'PM' : 'AM';
                if (cls.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                if (cls.hour === 12) { ampm = 'PM'; }
                html += '<div class="activity-item">' +
                    dayNames[cls.day] + ' ' + hourDisplay + ':00 ' + ampm + 
                    ' - <strong>' + cls.name + '</strong>' +
                    (cls.instructor ? ' <span style="color:var(--text-dim);font-size:0.7rem;">(' + cls.instructor + ')</span>' : '') +
                '</div>';
            });
            overview.innerHTML = html;
        }
    }
    
    // Available disciplines
    var availContainer = document.getElementById('schedule-available');
    if (availContainer) {
        if (available.length === 0) {
            availContainer.innerHTML = '<p class="empty-state">All disciplines are full for this week</p>';
        } else {
            var html = '';
            available.forEach(function(item) {
                var disc = item.discipline;
                var instructorDisplay = item.instructorNames.length > 0 ? 
                    item.instructorNames.join(', ') : 'No instructors assigned';
                var isFull = item.remaining === 0;
                html += '<div class="available-discipline' + (isFull ? ' full' : '') + '">' +
                    '<span>' + disc.name + ' <span style="font-size:0.6rem;color:var(--text-dim);">(' + instructorDisplay + ')</span></span>' +
                    '<span class="hours">' + item.used + '/' + item.maxHours + 'h <span style="color:var(--accent);">(' + item.remaining + ' left)</span></span>' +
                '</div>';
            });
            availContainer.innerHTML = html;
        }
    }
    
    // Hours summary
    var usedEl = document.getElementById('schedule-hours-used');
    var totalEl = document.getElementById('schedule-hours-total');
    if (usedEl && totalEl) {
        var totalHours = 0;
        var usedHours = 0;
        var allDisciplines = getAvailableDisciplines(scheduleState.currentWeek);
        allDisciplines.forEach(function(d) {
            totalHours += d.weeklyHours || 0;
        });
        var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
        for (var day in schedule) {
            for (var hour in schedule[day]) {
                if (schedule[day][hour]) usedHours++;
            }
        }
        usedEl.textContent = usedHours;
        totalEl.textContent = totalHours;
    }
    
    // Rest days - checkboxes
    var checkboxes = document.querySelectorAll('.rest-day-check');
    checkboxes.forEach(function(cb) {
        var day = parseInt(cb.dataset.day);
        cb.checked = restDays.indexOf(day) !== -1;
    });
}

/**
 * Update sidebar when no student is selected
 */
function updateSidebarEmpty() {
    var overview = document.getElementById('schedule-overview');
    if (overview) {
        overview.innerHTML = '<p class="empty-state">Select a student</p>';
    }
    var availContainer = document.getElementById('schedule-available');
    if (availContainer) {
        availContainer.innerHTML = '<p class="empty-state">Select a student</p>';
    }
    var usedEl = document.getElementById('schedule-hours-used');
    var totalEl = document.getElementById('schedule-hours-total');
    if (usedEl) usedEl.textContent = '0';
    if (totalEl) totalEl.textContent = '0';
}

/**
 * Show add class modal with instructor selection
 */
function showAddScheduleClassModal(studentId, week, day, hour) {
    var available = getAvailableDisciplinesForStudent(studentId, week);
    
    if (available.length === 0) {
        alert('All disciplines are full for this week.');
        return;
    }
    
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
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
                    <label>Select Discipline:</label>
                    <select id="add-class-select" style="width:100%;padding:8px;margin-bottom:8px;">
                        ${available.map(function(item) {
                            var d = item.discipline;
                            var instructorDisplay = item.instructorNames.length > 0 ? 
                                item.instructorNames.join(', ') : 'No instructors assigned';
                            return '<option value="' + d.id + '">' + 
                                d.name + ' (' + instructorDisplay + ') - ' + 
                                item.used + '/' + item.maxHours + 'h (' + item.remaining + ' left)' + 
                            '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group" id="instructor-selection-group" style="display:none;">
                    <label>Select Instructor:</label>
                    <select id="add-class-instructor" style="width:100%;padding:8px;">
                        <option value="">Select instructor...</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate instructor selection when discipline changes
    var disciplineSelect = document.getElementById('add-class-select');
    var instructorGroup = document.getElementById('instructor-selection-group');
    var instructorSelect = document.getElementById('add-class-instructor');
    
    function updateInstructors() {
        var selectedId = disciplineSelect.value;
        if (!selectedId) {
            instructorGroup.style.display = 'none';
            return;
        }
        
        // Find the selected discipline from available list
        var selectedItem = available.find(function(item) { 
            return String(item.discipline.id) === String(selectedId); 
        });
        if (!selectedItem) {
            instructorGroup.style.display = 'none';
            return;
        }
        
        var instructorIds = selectedItem.instructorIds || [];
        if (instructorIds.length <= 1) {
            instructorGroup.style.display = 'none';
            return;
        }
        
        instructorGroup.style.display = 'block';
        instructorSelect.innerHTML = '<option value="">Select instructor...</option>';
        instructorIds.forEach(function(id) {
            var instructor = data.characters.find(function(c) { return String(c.id) === String(id); });
            if (instructor) {
                var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                var option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                instructorSelect.appendChild(option);
            }
        });
    }
    
    disciplineSelect.addEventListener('change', updateInstructors);
    // Initial update
    setTimeout(updateInstructors, 100);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-add-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-select').value;
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
        // Check if instructor selection is needed
        var selectedItem = available.find(function(item) { 
            return String(item.discipline.id) === String(disciplineId); 
        });
        var selectedInstructor = null;
        if (selectedItem && selectedItem.instructorIds && selectedItem.instructorIds.length > 1) {
            selectedInstructor = document.getElementById('add-class-instructor').value;
            if (!selectedInstructor) {
                alert('Please select an instructor for this class.');
                return;
            }
        } else if (selectedItem && selectedItem.instructorIds && selectedItem.instructorIds.length === 1) {
            selectedInstructor = selectedItem.instructorIds[0];
        }
        
        // Add the class
        var schedule = getStudentSchedule(studentId, week);
        if (!schedule[day]) schedule[day] = {};
        
        if (schedule[day][hour]) {
            alert('This slot is already occupied.');
            modal.remove();
            return;
        }
        
        schedule[day][hour] = disciplineId;
        
        // Store the instructor if selected
        if (selectedInstructor) {
            setClassInstructor(studentId, week, day, hour, selectedInstructor);
        }
        
        modal.remove();
        
        saveData().then(function() {
            var discipline = getDiscipline(disciplineId);
            if (typeof logActivity === 'function') {
                var instructorName = selectedInstructor ? 
                    (data.characters.find(function(c) { return String(c.id) === String(selectedInstructor); })?.firstName || '') : '';
                logActivity('Added class ' + (discipline ? discipline.name : '') + 
                    (instructorName ? ' taught by ' + instructorName : '') + ' to schedule');
            }
            renderSchedule();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            renderSchedule();
        });
    };
}

/**
 * Show class details with instructor info
 */
function showScheduleClassDetails(studentId, disciplineId, week, day, hour) {
    var discipline = getDiscipline(disciplineId);
    if (!discipline) return;
    
    var instructorId = getClassInstructor(studentId, week, day, hour);
    var instructorName = 'Not assigned';
    if (instructorId) {
        var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
        if (instructor) {
            instructorName = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
        }
    }
    
    var allInstructors = getInstructorNames(discipline);
    var allInstructorsDisplay = allInstructors.length > 0 ? allInstructors.join(', ') : 'None assigned';
    
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <h3>${discipline.name}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Type:</span> <span>${discipline.type === 'mandatory' ? '📚 Mandatory' : '🎯 Optional'}</span></div>
                <div class="detail-row"><span class="label">All Instructors:</span> <span>${allInstructorsDisplay}</span></div>
                <div class="detail-row"><span class="label">Current Instructor:</span> <span><strong>${instructorName}</strong></span></div>
                <div class="detail-row"><span class="label">Curriculum:</span> <span>${discipline.curriculum || 'N/A'}</span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm}</span></div>
                <div class="detail-row"><span class="label">Week:</span> <span>${week}</span></div>
                ${discipline.instructorIds && discipline.instructorIds.length > 1 ? `
                <div style="margin-top:12px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Change Instructor:</label>
                    <select id="change-instructor-select" style="width:100%;padding:6px;margin-top:4px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                        <option value="">Select instructor...</option>
                        ${discipline.instructorIds.map(function(id) {
                            var inst = data.characters.find(function(c) { return String(c.id) === String(id); });
                            if (inst) {
                                var name = [inst.firstName, inst.lastName].filter(function(n) { return n; }).join(' ');
                                var selected = String(id) === String(instructorId) ? 'selected' : '';
                                return '<option value="' + id + '" ' + selected + '>' + name + '</option>';
                            }
                            return '';
                        }).join('')}
                    </select>
                    <button id="change-instructor-btn" class="small primary" style="margin-top:4px;">Update Instructor</button>
                </div>
                ` : ''}
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-class-detail" class="danger small">Remove from Schedule</button>
                    <button type="button" id="close-detail" class="secondary small">Close</button>
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
    
    modal.querySelector('#remove-class-detail').onclick = function() {
        if (confirm('Remove this class from the schedule?')) {
            removeScheduleClass(studentId, week, day, hour);
            modal.remove();
        }
    };
    
    // Change instructor functionality
    var changeBtn = document.getElementById('change-instructor-btn');
    if (changeBtn) {
        changeBtn.addEventListener('click', function() {
            var newInstructorId = document.getElementById('change-instructor-select').value;
            if (!newInstructorId) {
                alert('Please select an instructor.');
                return;
            }
            setClassInstructor(studentId, week, day, hour, newInstructorId);
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Changed instructor for class ' + discipline.name);
                }
                modal.remove();
                renderSchedule();
            }).catch(function(err) {
                console.error('Failed to save:', err);
                alert('Failed to update instructor.');
            });
        });
    }
}

/**
 * Remove a class from the schedule
 */
function removeScheduleClass(studentId, week, day, hour) {
    var schedule = getStudentSchedule(studentId, week);
    if (schedule[day] && schedule[day][hour]) {
        delete schedule[day][hour];
        // Also remove instructor assignment
        setClassInstructor(studentId, week, day, hour, null);
        saveData().catch(function(err) { console.error('Failed to save:', err); });
        renderSchedule();
        if (typeof logActivity === 'function') {
            logActivity('Removed class from schedule');
        }
    }
}

/**
 * Duplicate schedule to next week
 */
function duplicateSchedule() {
    if (!scheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var currentWeek = scheduleState.currentWeek;
    var nextWeek = currentWeek + 1;
    
    if (nextWeek > 52) {
        alert('Cannot duplicate beyond week 52.');
        return;
    }
    
    var currentSchedule = getStudentSchedule(scheduleState.selectedStudentId, currentWeek);
    var nextSchedule = getStudentSchedule(scheduleState.selectedStudentId, nextWeek);
    
    // Deep copy the schedule
    for (var day in currentSchedule) {
        if (!nextSchedule[day]) nextSchedule[day] = {};
        for (var hour in currentSchedule[day]) {
            nextSchedule[day][hour] = currentSchedule[day][hour];
            // Also copy instructor assignments
            var instructorId = getClassInstructor(scheduleState.selectedStudentId, currentWeek, parseInt(day), parseInt(hour));
            if (instructorId) {
                setClassInstructor(scheduleState.selectedStudentId, nextWeek, parseInt(day), parseInt(hour), instructorId);
            }
        }
    }
    
    // Also copy rest days if they exist
    if (data.curriculum.restDays[currentWeek]) {
        data.curriculum.restDays[nextWeek] = data.curriculum.restDays[currentWeek].slice();
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Duplicated schedule from week ' + currentWeek + ' to ' + nextWeek);
        }
        // Move to the duplicated week
        scheduleState.currentWeek = nextWeek;
        renderSchedule();
        alert('Schedule duplicated to week ' + nextWeek);
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to duplicate schedule.');
    });
}

/**
 * Clear the current week's schedule
 */
function clearSchedule() {
    if (!scheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    if (!confirm('Clear all classes for week ' + scheduleState.currentWeek + '?')) return;
    
    var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
    for (var day in schedule) {
        delete schedule[day];
    }
    
    // Also clear instructor assignments for this week
    var week = scheduleState.currentWeek;
    for (var key in data.curriculum.classInstructors) {
        var parts = key.split('_');
        if (parts[1] == week) {
            delete data.curriculum.classInstructors[key];
        }
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Cleared schedule for week ' + scheduleState.currentWeek);
        }
        renderSchedule();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderSchedule();
    });
}

/**
 * Save rest days
 */
function saveRestDays() {
    if (!scheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var checkboxes = document.querySelectorAll('.rest-day-check');
    var restDays = [];
    checkboxes.forEach(function(cb) {
        if (cb.checked) {
            restDays.push(parseInt(cb.dataset.day));
        }
    });
    
    data.curriculum.restDays[scheduleState.currentWeek] = restDays;
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Saved rest days for week ' + scheduleState.currentWeek);
        }
        renderSchedule();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderSchedule();
    });
}

// Make functions globally available
window.renderScheduleView = renderScheduleView;
window.renderSchedule = renderSchedule;
window.initScheduleSystem = initScheduleSystem;
window.getStudentSchedule = getStudentSchedule;
window.getStudentDisciplineHours = getStudentDisciplineHours;
window.getAvailableDisciplinesForStudent = getAvailableDisciplinesForStudent;
window.getClassInstructor = getClassInstructor;
window.setClassInstructor = setClassInstructor;
window.duplicateSchedule = duplicateSchedule;
window.clearSchedule = clearSchedule;
window.saveRestDays = saveRestDays;
window.showAddScheduleClassModal = showAddScheduleClassModal;
window.showScheduleClassDetails = showScheduleClassDetails;
window.removeScheduleClass = removeScheduleClass;
