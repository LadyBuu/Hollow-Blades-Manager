/**
 * schedule.js - Per-Student Schedule Calendar
 * Handles individual student schedules, week by week
 * Updated to support multiple instructors per discipline
 * Added duplicate to specific week functionality
 * Added "Add Classmate" button
 * Rest days now remove classes from that day
 * Added class labels (A, B, etc.)
 * Added instructor conflict checking
 * Added class duration (1-4 hours) support
 * Added group labels for sections
 * Integrated with instructor calendar
 * Added "Add from Group" functionality
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
            classInstructors: {},
            classLabels: {},
            classGroupLabels: {},
            classDurations: {},
            instructorClasses: {},
            instructorTemplates: {},
            instructorBlocks: {},
            instructorGroups: {},
            disciplineGroups: {}
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
    if (!data.curriculum.classLabels) {
        data.curriculum.classLabels = {};
    }
    if (!data.curriculum.classGroupLabels) {
        data.curriculum.classGroupLabels = {};
    }
    if (!data.curriculum.classDurations) {
        data.curriculum.classDurations = {};
    }
    if (!data.curriculum.instructorClasses) {
        data.curriculum.instructorClasses = {};
    }
    if (!data.curriculum.instructorTemplates) {
        data.curriculum.instructorTemplates = {};
    }
    if (!data.curriculum.instructorBlocks) {
        data.curriculum.instructorBlocks = {};
    }
    if (!data.curriculum.instructorGroups) {
        data.curriculum.instructorGroups = {};
    }
    if (!data.curriculum.disciplineGroups) {
        data.curriculum.disciplineGroups = {};
    }
    
    // Ensure eliminatedWeeks exists on characters
    if (data.characters) {
        data.characters.forEach(function(char) {
            if (!char.eliminatedWeeks) {
                char.eliminatedWeeks = [];
            }
            if (!char.eliminations) {
                char.eliminations = [];
            }
        });
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
 * Get the label for a specific class slot
 */
function getClassLabel(studentId, week, day, hour) {
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    return data.curriculum.classLabels ? data.curriculum.classLabels[key] : null;
}

/**
 * Set the label for a specific class slot
 */
function setClassLabel(studentId, week, day, hour, label) {
    if (!data.curriculum.classLabels) {
        data.curriculum.classLabels = {};
    }
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    if (label) {
        data.curriculum.classLabels[key] = label;
    } else {
        delete data.curriculum.classLabels[key];
    }
}

/**
 * Get the group label for a specific class slot
 */
function getClassGroupLabel(studentId, week, day, hour) {
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    return data.curriculum.classGroupLabels ? data.curriculum.classGroupLabels[key] : null;
}

/**
 * Set the group label for a specific class slot
 */
function setClassGroupLabel(studentId, week, day, hour, groupLabel) {
    if (!data.curriculum.classGroupLabels) {
        data.curriculum.classGroupLabels = {};
    }
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    if (groupLabel) {
        data.curriculum.classGroupLabels[key] = groupLabel;
    } else {
        delete data.curriculum.classGroupLabels[key];
    }
}

/**
 * Get the duration for a specific class slot
 */
function getClassDuration(studentId, week, day, hour) {
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    return data.curriculum.classDurations ? data.curriculum.classDurations[key] : null;
}

/**
 * Set the duration for a specific class slot
 */
function setClassDuration(studentId, week, day, hour, duration) {
    if (!data.curriculum.classDurations) {
        data.curriculum.classDurations = {};
    }
    var key = studentId + '_' + week + '_' + day + '_' + hour;
    if (duration && duration > 0) {
        data.curriculum.classDurations[key] = duration;
    } else {
        delete data.curriculum.classDurations[key];
    }
}

/**
 * Check if an instructor is available at a specific time
 */
function isInstructorAvailable(instructorId, week, day, hour, excludeStudentId, duration) {
    var students = getStudents();
    var dur = duration || 1;
    for (var i = 0; i < students.length; i++) {
        var student = students[i];
        if (excludeStudentId && String(student.id) === String(excludeStudentId)) continue;
        
        var schedule = getStudentSchedule(student.id, week);
        for (var h = hour; h < hour + dur && h <= 23; h++) {
            if (schedule[day] && schedule[day][h]) {
                var disciplineId = schedule[day][h];
                var discipline = getDiscipline(disciplineId);
                if (discipline) {
                    var classInstructorId = null;
                    if (typeof getClassInstructor === 'function') {
                        classInstructorId = getClassInstructor(student.id, week, day, h);
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
                        return false;
                    }
                }
            }
        }
    }
    return true;
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
 * Get all students except the current one
 */
function getOtherStudents(currentStudentId) {
    var students = getStudents();
    return students.filter(function(s) { return String(s.id) !== String(currentStudentId); });
}

/**
 * Get groups a student belongs to
 */
function getGroupsForStudent(studentId) {
    var groups = [];
    if (!data.curriculum.instructorGroups) return groups;
    
    for (var instructorId in data.curriculum.instructorGroups) {
        var instructorGroups = data.curriculum.instructorGroups[instructorId];
        for (var groupLabel in instructorGroups) {
            if (instructorGroups[groupLabel].students && instructorGroups[groupLabel].students[studentId]) {
                var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
                var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                groups.push({
                    instructorId: instructorId,
                    instructorName: instructorName,
                    groupLabel: groupLabel,
                    students: Object.keys(instructorGroups[groupLabel].students)
                });
            }
        }
    }
    return groups;
}

/**
 * Check if any students in a group have conflicts at a given time
 */
function checkGroupConflicts(week, day, hour, duration, groupStudents, excludeStudentId) {
    var conflicts = [];
    var dur = duration || 1;
    
    groupStudents.forEach(function(studentId) {
        if (excludeStudentId && String(studentId) === String(excludeStudentId)) return;
        
        var schedule = getStudentSchedule(studentId, week);
        var hasConflict = false;
        var conflictDiscipline = null;
        for (var h = hour; h < hour + dur && h <= 23; h++) {
            if (schedule[day] && schedule[day][h]) {
                hasConflict = true;
                var discId = schedule[day][h];
                var discipline = getDiscipline(discId);
                if (discipline) {
                    conflictDiscipline = discipline.name;
                }
                break;
            }
        }
        if (hasConflict) {
            var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
            var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
            conflicts.push({
                studentId: studentId,
                studentName: studentName,
                discipline: conflictDiscipline || 'Unknown'
            });
        }
    });
    
    return conflicts;
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
                <button id="duplicate-schedule-btn" class="primary small">▣ Duplicate to Specific Week</button>
                <button id="clear-schedule-btn" class="danger small">✕ Clear Week</button>
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

    populateScheduleStudentSelector();
    initScheduleEvents();
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
    var studentSelect = document.getElementById('schedule-student');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            scheduleState.selectedStudentId = this.value;
            renderSchedule();
        });
    }
    
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
    
    var duplicateBtn = document.getElementById('duplicate-schedule-btn');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', showDuplicateModal);
    }
    
    var clearBtn = document.getElementById('clear-schedule-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSchedule);
    }
    
    var saveRestBtn = document.getElementById('save-rest-days-btn');
    if (saveRestBtn) {
        saveRestBtn.addEventListener('click', saveRestDays);
    }
    
    if (studentSelect && studentSelect.options.length > 1) {
        studentSelect.selectedIndex = 1;
        scheduleState.selectedStudentId = studentSelect.value;
        renderSchedule();
    }
}

/**
 * Show duplicate modal with target week selection
 */
function showDuplicateModal() {
    if (!scheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var currentWeek = scheduleState.currentWeek;
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Duplicate Schedule</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;">
                    Copy schedule from <strong>Week ${currentWeek}</strong> to:
                </p>
                <div class="form-group">
                    <label>Target Week:</label>
                    <input type="number" id="duplicate-target-week" min="1" max="52" value="${currentWeek + 1}" style="width:100%;padding:8px;">
                </div>
                <div style="margin-top:8px;font-size:0.75rem;color:var(--text-dim);">
                    <label><input type="checkbox" id="duplicate-overwrite" checked> Overwrite existing schedule</label>
                </div>
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-duplicate" class="secondary">Cancel</button>
                    <button type="button" id="confirm-duplicate" class="primary">Duplicate</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-duplicate').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-duplicate').onclick = function() {
        var targetWeek = parseInt(document.getElementById('duplicate-target-week').value);
        var overwrite = document.getElementById('duplicate-overwrite').checked;
        
        if (isNaN(targetWeek) || targetWeek < 1 || targetWeek > 52) {
            alert('Please enter a valid week (1-52).');
            return;
        }
        
        if (targetWeek === currentWeek) {
            alert('Target week cannot be the same as the current week.');
            return;
        }
        
        duplicateScheduleToWeek(currentWeek, targetWeek, overwrite);
        modal.remove();
    };
}

/**
 * Duplicate schedule from one week to another
 */
function duplicateScheduleToWeek(sourceWeek, targetWeek, overwrite) {
    if (!scheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var studentId = scheduleState.selectedStudentId;
    
    var targetSchedule = getStudentSchedule(studentId, targetWeek);
    var hasData = false;
    for (var day in targetSchedule) {
        for (var hour in targetSchedule[day]) {
            if (targetSchedule[day][hour]) {
                hasData = true;
                break;
            }
        }
        if (hasData) break;
    }
    
    if (hasData && !overwrite) {
        if (!confirm('Week ' + targetWeek + ' already has classes. Overwrite?')) {
            return;
        }
    }
    
    var sourceSchedule = getStudentSchedule(studentId, sourceWeek);
    var destSchedule = getStudentSchedule(studentId, targetWeek);
    
    if (overwrite) {
        for (var day in destSchedule) {
            delete destSchedule[day];
        }
    }
    
    var copiedCount = 0;
    for (var day in sourceSchedule) {
        if (!destSchedule[day]) destSchedule[day] = {};
        for (var hour in sourceSchedule[day]) {
            if (!destSchedule[day][hour] || overwrite) {
                destSchedule[day][hour] = sourceSchedule[day][hour];
                var instructorId = getClassInstructor(studentId, sourceWeek, parseInt(day), parseInt(hour));
                if (instructorId) {
                    setClassInstructor(studentId, targetWeek, parseInt(day), parseInt(hour), instructorId);
                }
                var label = getClassLabel(studentId, sourceWeek, parseInt(day), parseInt(hour));
                if (label) {
                    setClassLabel(studentId, targetWeek, parseInt(day), parseInt(hour), label);
                }
                var groupLabel = getClassGroupLabel(studentId, sourceWeek, parseInt(day), parseInt(hour));
                if (groupLabel) {
                    setClassGroupLabel(studentId, targetWeek, parseInt(day), parseInt(hour), groupLabel);
                }
                var duration = getClassDuration(studentId, sourceWeek, parseInt(day), parseInt(hour));
                if (duration) {
                    setClassDuration(studentId, targetWeek, parseInt(day), parseInt(hour), duration);
                }
                copiedCount++;
            }
        }
    }
    
    if (data.curriculum.restDays[sourceWeek]) {
        if (overwrite || !data.curriculum.restDays[targetWeek]) {
            data.curriculum.restDays[targetWeek] = data.curriculum.restDays[sourceWeek].slice();
        }
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Duplicated schedule from week ' + sourceWeek + ' to ' + targetWeek + ' (' + copiedCount + ' classes)');
        }
        scheduleState.currentWeek = targetWeek;
        renderSchedule();
        alert('Schedule duplicated from week ' + sourceWeek + ' to week ' + targetWeek + ' (' + copiedCount + ' classes copied)');
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to duplicate schedule.');
    });
}

/**
 * Render the schedule grid
 */
function renderSchedule() {
    var grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    var weekDisplay = document.getElementById('schedule-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + scheduleState.currentWeek;
    
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
    
    var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
    var restDays = data.curriculum.restDays[scheduleState.currentWeek] || [];
    var availableDisciplines = getAvailableDisciplinesForStudent(
        scheduleState.selectedStudentId, 
        scheduleState.currentWeek
    );
    
    var hours = [];
    for (var h = 5; h <= 23; h++) {
        hours.push(h);
    }
    
    var dayColumns = grid.querySelectorAll('.day-column');
    dayColumns.forEach(function(column, index) {
        var day = index + 1;
        var slots = column.querySelector('.day-slots');
        if (!slots) return;
        
        var isRestDay = restDays.indexOf(day) !== -1;
        column.classList.toggle('rest-day', isRestDay);
        
        slots.innerHTML = '';
        
        if (isRestDay) {
            var restMsg = document.createElement('div');
            restMsg.className = 'empty-state';
            restMsg.style.padding = '20px';
            restMsg.style.textAlign = 'center';
            restMsg.textContent = '🛑 Rest Day';
            slots.appendChild(restMsg);
            if (schedule[day]) {
                delete schedule[day];
            }
            return;
        }
        
        var occupiedHours = {};
        
        hours.forEach(function(hour) {
            if (occupiedHours[hour]) {
                return;
            }
            
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
            
            var disciplineId = null;
            if (schedule[day] && schedule[day][hour]) {
                disciplineId = schedule[day][hour];
            }
            
            if (disciplineId) {
                var discipline = getDiscipline(disciplineId);
                if (discipline) {
                    var duration = getClassDuration(scheduleState.selectedStudentId, scheduleState.currentWeek, day, hour) || 1;
                    
                    for (var h = hour; h < hour + duration && h <= 23; h++) {
                        occupiedHours[h] = true;
                    }
                    
                    slot.classList.add('occupied');
                    slot.style.minHeight = (30 * duration) + 'px';
                    slot.style.height = (30 * duration) + 'px';
                    if (duration > 1) {
                        slot.classList.add('duration-' + duration);
                    }
                    
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
                    
                    var label = getClassLabel(
                        scheduleState.selectedStudentId, 
                        scheduleState.currentWeek, 
                        day, 
                        hour
                    );
                    var groupLabel = getClassGroupLabel(
                        scheduleState.selectedStudentId, 
                        scheduleState.currentWeek, 
                        day, 
                        hour
                    );
                    
                    var labelDisplay = label ? ' [' + label + ']' : '';
                    var groupDisplay = groupLabel ? ' (G' + groupLabel + ')' : '';
                    var durationDisplay = duration > 1 ? ' (' + duration + 'h)' : '';
                    
                    var labelEl = document.createElement('span');
                    labelEl.className = 'slot-label';
                    labelEl.textContent = discipline.name + labelDisplay + groupDisplay + durationDisplay + (instructorName ? ' (' + instructorName + ')' : '');
                    slot.appendChild(labelEl);
                    
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
                    
                    slot.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (confirm('Remove this class from the schedule?')) {
                            removeScheduleClass(scheduleState.selectedStudentId, scheduleState.currentWeek, day, hour);
                        }
                    });
                } else {
                    slot.classList.add('empty');
                    var labelEl = document.createElement('span');
                    labelEl.className = 'slot-label';
                    labelEl.textContent = '❓';
                    slot.appendChild(labelEl);
                    occupiedHours[hour] = true;
                }
            } else {
                slot.classList.add('empty');
                var labelEl = document.createElement('span');
                labelEl.className = 'slot-label';
                labelEl.textContent = '+';
                slot.appendChild(labelEl);
                
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
                        var label = getClassLabel(
                            scheduleState.selectedStudentId, 
                            scheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var groupLabel = getClassGroupLabel(
                            scheduleState.selectedStudentId, 
                            scheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var labelDisplay = label ? ' [' + label + ']' : '';
                        var groupDisplay = groupLabel ? ' (G' + groupLabel + ')' : '';
                        var duration = getClassDuration(
                            scheduleState.selectedStudentId, 
                            scheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var durationDisplay = duration && duration > 1 ? ' (' + duration + 'h)' : '';
                        classList.push({
                            day: parseInt(day),
                            hour: parseInt(hour),
                            name: discipline.name + labelDisplay + groupDisplay + durationDisplay,
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
 * Show add class modal - UPDATED with group support
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
    
    // Get groups this student belongs to
    var studentGroups = getGroupsForStudent(studentId);
    var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
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
                <div class="form-group">
                    <label>Class Label (optional):</label>
                    <input type="text" id="add-class-label" placeholder="e.g., A, B, Group 1..." style="width:100%;padding:6px;">
                </div>
                <div class="form-group">
                    <label>Duration (hours):</label>
                    <select id="add-class-duration" style="width:100%;padding:6px;">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                    </select>
                </div>
                
                <!-- Add from Group -->
                ${studentGroups.length > 0 ? `
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Add from Group:</label>
                    <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;">
                        <select id="add-from-group-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            <option value="">Select a group...</option>
                            ${studentGroups.map(function(g) {
                                var count = g.students.length;
                                return '<option value="' + g.instructorId + '_' + g.groupLabel + '">Group ' + g.groupLabel + ' (' + g.instructorName + ') - ' + count + ' students</option>';
                            }).join('')}
                        </select>
                        <button id="add-from-group-btn" class="primary small">Add All</button>
                    </div>
                    <span style="font-size:0.6rem;color:var(--text-dim);">Adds all students from the selected group to this class</span>
                </div>
                ` : '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);"><span style="font-size:0.75rem;color:var(--text-dim);">You are not in any groups. Join a group first.</span></div>'}
                
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    var disciplineSelect = document.getElementById('add-class-select');
    var instructorGroup = document.getElementById('instructor-selection-group');
    var instructorSelect = document.getElementById('add-class-instructor');
    
    function updateInstructors() {
        var selectedId = disciplineSelect.value;
        if (!selectedId) {
            instructorGroup.style.display = 'none';
            return;
        }
        
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
    setTimeout(updateInstructors, 100);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Add from group
    var addFromGroupBtn = document.getElementById('add-from-group-btn');
    if (addFromGroupBtn) {
        addFromGroupBtn.addEventListener('click', function() {
            var groupSelect = document.getElementById('add-from-group-select');
            var selectedValue = groupSelect.value;
            if (!selectedValue) {
                alert('Please select a group.');
                return;
            }
            
            var parts = selectedValue.split('_');
            var instructorId = parts[0];
            var groupLabel = parts[1];
            
            var groups = getInstructorGroups ? getInstructorGroups(instructorId) : null;
            if (!groups || !groups[groupLabel] || !groups[groupLabel].students) {
                alert('Group not found.');
                return;
            }
            
            var groupStudents = Object.keys(groups[groupLabel].students);
            var currentStudentId = scheduleState.selectedStudentId;
            
            // Check if any students in the group have conflicts
            var duration = parseInt(document.getElementById('add-class-duration').value) || 1;
            var conflicts = checkGroupConflicts(week, day, hour, duration, groupStudents, currentStudentId);
            
            if (conflicts.length > 0) {
                var conflictMsg = '⚠ The following students in this group have conflicts at this time:\n\n';
                conflicts.forEach(function(c) {
                    conflictMsg += '• ' + c.studentName + ' (already has ' + c.discipline + ')\n';
                });
                conflictMsg += '\nAdding this class will overwrite their existing classes. Continue?';
                if (!confirm(conflictMsg)) {
                    return;
                }
            }
            
            // Add the class to all students in the group
            var selectedItem = available.find(function(item) { 
                return String(item.discipline.id) === String(disciplineSelect.value); 
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
            
            var label = document.getElementById('add-class-label').value.trim();
            
            var addedCount = 0;
            groupStudents.forEach(function(studentId) {
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
                var disciplineId = disciplineSelect.value;
                for (var h = hour; h < hour + duration && h <= 23; h++) {
                    if (!schedule[day]) schedule[day] = {};
                    schedule[day][h] = disciplineId;
                    if (selectedInstructor) {
                        setClassInstructor(studentId, week, day, h, selectedInstructor);
                    }
                    if (label) {
                        setClassLabel(studentId, week, day, h, label);
                    }
                    if (groupLabel) {
                        setClassGroupLabel(studentId, week, day, h, groupLabel);
                    }
                    if (h === hour) {
                        setClassDuration(studentId, week, day, h, duration);
                    }
                }
                addedCount++;
            });
            
            modal.remove();
            
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Added class from group ' + groupLabel + ' to ' + addedCount + ' students');
                }
                renderSchedule();
                alert('Class added to ' + addedCount + ' students from Group ' + groupLabel + '!');
            }).catch(function(err) {
                console.error('Failed to save:', err);
                renderSchedule();
                alert('Failed to add class to all students.');
            });
        });
    }
    
    modal.querySelector('#confirm-add-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-select').value;
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
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
        
        var duration = parseInt(document.getElementById('add-class-duration').value) || 1;
        
        if (selectedInstructor) {
            var instructorBusy = !isInstructorAvailable(selectedInstructor, week, day, hour, studentId, duration);
            if (instructorBusy) {
                var instructor = data.characters.find(function(c) { return String(c.id) === String(selectedInstructor); });
                var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                if (!confirm('⚠ ' + instructorName + ' already has a class at this time.\n\nAdd anyway?')) {
                    return;
                }
            }
        }
        
        var schedule = getStudentSchedule(studentId, week);
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            if (schedule[day] && schedule[day][h]) {
                alert('This slot or a later slot is already occupied. Please choose a different time or shorter duration.');
                return;
            }
        }
        
        var label = document.getElementById('add-class-label').value.trim();
        
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            if (!schedule[day]) schedule[day] = {};
            schedule[day][h] = disciplineId;
            
            if (selectedInstructor) {
                setClassInstructor(studentId, week, day, h, selectedInstructor);
            }
            if (label) {
                setClassLabel(studentId, week, day, h, label);
            }
            if (h === hour) {
                setClassDuration(studentId, week, day, h, duration);
            }
        }
        
        modal.remove();
        
        saveData().then(function() {
            var discipline = getDiscipline(disciplineId);
            if (typeof logActivity === 'function') {
                var instructorName = selectedInstructor ? 
                    (data.characters.find(function(c) { return String(c.id) === String(selectedInstructor); })?.firstName || '') : '';
                logActivity('Added class ' + (discipline ? discipline.name : '') + 
                    (label ? ' [' + label + ']' : '') +
                    ' (' + duration + 'h)' +
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
 * Show class details
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
    
    var currentLabel = getClassLabel(studentId, week, day, hour) || '';
    var currentGroupLabel = getClassGroupLabel(studentId, week, day, hour) || '';
    var currentDuration = getClassDuration(studentId, week, day, hour) || 1;
    
    var hourDisplay = hour > 12 ? hour - 12 : hour;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
    if (hour === 12) { ampm = 'PM'; }
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var otherStudents = getOtherStudents(studentId);
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <h3>${discipline.name} ${currentLabel ? '[' + currentLabel + ']' : ''} ${currentGroupLabel ? '(G' + currentGroupLabel + ')' : ''}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Type:</span> <span>${discipline.type === 'mandatory' ? '▣ Mandatory' : '▢ Optional'}</span></div>
                <div class="detail-row"><span class="label">All Instructors:</span> <span>${allInstructorsDisplay}</span></div>
                <div class="detail-row"><span class="label">Current Instructor:</span> <span><strong>${instructorName}</strong></span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${dayNames[day]} at ${hourDisplay}:00 ${ampm}</span></div>
                <div class="detail-row"><span class="label">Duration:</span> <span><strong>${currentDuration} hour${currentDuration > 1 ? 's' : ''}</strong></span></div>
                <div class="detail-row"><span class="label">Group:</span> <span><strong>${currentGroupLabel || 'None'}</strong></span></div>
                <div class="detail-row"><span class="label">Week:</span> <span>${week}</span></div>
                
                <div style="margin-top:12px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Duration:</label>
                    <div style="display:flex;gap:6px;margin-top:4px;align-items:center;">
                        <select id="edit-class-duration" style="flex:1;padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            <option value="1" ${currentDuration === 1 ? 'selected' : ''}>1 hour</option>
                            <option value="2" ${currentDuration === 2 ? 'selected' : ''}>2 hours</option>
                            <option value="3" ${currentDuration === 3 ? 'selected' : ''}>3 hours</option>
                            <option value="4" ${currentDuration === 4 ? 'selected' : ''}>4 hours</option>
                        </select>
                        <button id="update-class-duration-btn" class="small primary">Update</button>
                    </div>
                </div>
                
                <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Class Label:</label>
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <input type="text" id="edit-class-label" value="${currentLabel}" placeholder="e.g., A, B, Group 1..." style="flex:1;padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                        <button id="update-class-label-btn" class="small primary">Update</button>
                    </div>
                </div>
                
                <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Group Label:</label>
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <input type="text" id="edit-group-label" value="${currentGroupLabel}" placeholder="e.g., 1, 2, 3..." style="flex:1;padding:4px 8px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                        <button id="update-group-label-btn" class="small primary">Update</button>
                    </div>
                </div>
                
                ${discipline.instructorIds && discipline.instructorIds.length > 1 ? `
                <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
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
                
                ${otherStudents.length > 0 ? `
                <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
                    <label style="font-size:0.75rem;color:var(--text-dim);">Add Classmate:</label>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                        <select id="add-classmate-select" style="flex:1;min-width:120px;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            <option value="">Select a student...</option>
                            ${otherStudents.map(function(s) {
                                var name = [s.firstName, s.lastName].filter(function(n) { return n; }).join(' ');
                                var schedule = getStudentSchedule(s.id, week);
                                var hasClass = false;
                                if (schedule[day] && schedule[day][hour] === disciplineId) {
                                    hasClass = true;
                                }
                                var instructorAvailable = true;
                                if (instructorId) {
                                    instructorAvailable = isInstructorAvailable(instructorId, week, day, hour, s.id, currentDuration);
                                }
                                var disabled = hasClass || !instructorAvailable;
                                var reason = hasClass ? ' (already has this class)' : (!instructorAvailable ? ' (instructor busy)' : '');
                                return '<option value="' + s.id + '" ' + (disabled ? 'disabled style="opacity:0.4;"' : '') + '>' + name + reason + '</option>';
                            }).join('')}
                        </select>
                        <button id="add-classmate-btn" class="primary small">Add Classmate</button>
                    </div>
                </div>
                ` : '<div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border);"><span style="color:var(--text-dim);font-size:0.75rem;">No other students available to add as classmates.</span></div>'}
                
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-class-detail" class="danger small">✕ Remove from Schedule</button>
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
    
    modal.querySelector('#update-class-duration-btn').onclick = function() {
        var newDuration = parseInt(document.getElementById('edit-class-duration').value);
        var oldDuration = currentDuration;
        
        if (newDuration === oldDuration) {
            alert('Duration is already ' + newDuration + ' hour(s).');
            return;
        }
        
        var schedule = getStudentSchedule(studentId, week);
        if (newDuration > oldDuration) {
            for (var h = hour + oldDuration; h < hour + newDuration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    alert('Cannot extend duration. Slot at ' + h + ':00 is already occupied.');
                    return;
                }
            }
            
            for (var h = hour + oldDuration; h < hour + newDuration && h <= 23; h++) {
                if (!schedule[day]) schedule[day] = {};
                schedule[day][h] = disciplineId;
                if (instructorId) {
                    setClassInstructor(studentId, week, day, h, instructorId);
                }
                if (currentLabel) {
                    setClassLabel(studentId, week, day, h, currentLabel);
                }
                if (currentGroupLabel) {
                    setClassGroupLabel(studentId, week, day, h, currentGroupLabel);
                }
            }
        } else {
            for (var h = hour + newDuration; h < hour + oldDuration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    delete schedule[day][h];
                    setClassInstructor(studentId, week, day, h, null);
                    setClassLabel(studentId, week, day, h, null);
                    setClassGroupLabel(studentId, week, day, h, null);
                    setClassDuration(studentId, week, day, h, null);
                }
            }
        }
        
        setClassDuration(studentId, week, day, hour, newDuration);
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Updated class duration to ' + newDuration + ' hours for ' + discipline.name);
            }
            modal.remove();
            renderSchedule();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to update duration.');
        });
    };
    
    modal.querySelector('#update-class-label-btn').onclick = function() {
        var newLabel = document.getElementById('edit-class-label').value.trim();
        var duration = getClassDuration(studentId, week, day, hour) || 1;
        
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            setClassLabel(studentId, week, day, h, newLabel || null);
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Updated class label to ' + (newLabel || 'none') + ' for ' + discipline.name);
            }
            modal.remove();
            renderSchedule();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to update label.');
        });
    };
    
    modal.querySelector('#update-group-label-btn').onclick = function() {
        var newGroupLabel = document.getElementById('edit-group-label').value.trim();
        var duration = getClassDuration(studentId, week, day, hour) || 1;
        
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            setClassGroupLabel(studentId, week, day, h, newGroupLabel || null);
        }
        
        saveData().then(function() {
            if (typeof logActivity === 'function') {
                logActivity('Updated group label to ' + (newGroupLabel || 'none') + ' for ' + discipline.name);
            }
            modal.remove();
            renderSchedule();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to update group label.');
        });
    };
    
    var changeBtn = document.getElementById('change-instructor-btn');
    if (changeBtn) {
        changeBtn.addEventListener('click', function() {
            var newInstructorId = document.getElementById('change-instructor-select').value;
            if (!newInstructorId) {
                alert('Please select an instructor.');
                return;
            }
            
            var duration = getClassDuration(studentId, week, day, hour) || 1;
            var instructorAvailable = isInstructorAvailable(newInstructorId, week, day, hour, studentId, duration);
            if (!instructorAvailable) {
                var instructor = data.characters.find(function(c) { return String(c.id) === String(newInstructorId); });
                var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                if (!confirm('⚠ ' + instructorName + ' already has a class at this time.\n\nAssign anyway?')) {
                    return;
                }
            }
            
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                setClassInstructor(studentId, week, day, h, newInstructorId);
            }
            
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
    
    modal.querySelector('#remove-class-detail').onclick = function() {
        if (confirm('Remove this class from the schedule?')) {
            removeScheduleClass(studentId, week, day, hour);
            modal.remove();
        }
    };
    
    var addClassmateBtn = document.getElementById('add-classmate-btn');
    if (addClassmateBtn) {
        addClassmateBtn.addEventListener('click', function() {
            var targetStudentId = document.getElementById('add-classmate-select').value;
            if (!targetStudentId) {
                alert('Please select a student to add as a classmate.');
                return;
            }
            
            var duration = getClassDuration(studentId, week, day, hour) || 1;
            var targetSchedule = getStudentSchedule(targetStudentId, week);
            
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (targetSchedule[day] && targetSchedule[day][h]) {
                    alert('This student already has a class at ' + h + ':00.');
                    return;
                }
            }
            
            if (instructorId) {
                var instructorAvailable = isInstructorAvailable(instructorId, week, day, hour, targetStudentId, duration);
                if (!instructorAvailable) {
                    var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
                    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    if (!confirm('⚠ ' + instructorName + ' already has a class at this time with another student.\n\nAdd anyway?')) {
                        return;
                    }
                }
            }
            
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (!targetSchedule[day]) targetSchedule[day] = {};
                targetSchedule[day][h] = disciplineId;
                if (instructorId) {
                    setClassInstructor(targetStudentId, week, day, h, instructorId);
                }
                var label = getClassLabel(studentId, week, day, hour);
                if (label) {
                    setClassLabel(targetStudentId, week, day, h, label);
                }
                var groupLabel = getClassGroupLabel(studentId, week, day, hour);
                if (groupLabel) {
                    setClassGroupLabel(targetStudentId, week, day, h, groupLabel);
                }
                if (h === hour) {
                    setClassDuration(targetStudentId, week, day, h, duration);
                }
            }
            
            saveData().then(function() {
                var targetStudent = data.characters.find(function(c) { return String(c.id) === String(targetStudentId); });
                var targetName = targetStudent ? [targetStudent.firstName, targetStudent.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                if (typeof logActivity === 'function') {
                    logActivity('Added classmate ' + targetName + ' to ' + discipline.name + ' (' + duration + 'h)');
                }
                modal.remove();
                renderSchedule();
                alert('Class added to ' + targetName + '\'s schedule!');
            }).catch(function(err) {
                console.error('Failed to save:', err);
                alert('Failed to add classmate.');
            });
        });
    }
}

/**
 * Remove a class from the schedule
 */
function removeScheduleClass(studentId, week, day, hour) {
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
    renderSchedule();
    if (typeof logActivity === 'function') {
        logActivity('Removed class from schedule');
    }
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
    
    var week = scheduleState.currentWeek;
    for (var key in data.curriculum.classInstructors) {
        var parts = key.split('_');
        if (parts[1] == week) {
            delete data.curriculum.classInstructors[key];
        }
    }
    for (var key in data.curriculum.classLabels) {
        var parts = key.split('_');
        if (parts[1] == week) {
            delete data.curriculum.classLabels[key];
        }
    }
    for (var key in data.curriculum.classGroupLabels) {
        var parts = key.split('_');
        if (parts[1] == week) {
            delete data.curriculum.classGroupLabels[key];
        }
    }
    for (var key in data.curriculum.classDurations) {
        var parts = key.split('_');
        if (parts[1] == week) {
            delete data.curriculum.classDurations[key];
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
    
    var schedule = getStudentSchedule(scheduleState.selectedStudentId, scheduleState.currentWeek);
    restDays.forEach(function(day) {
        if (schedule[day]) {
            delete schedule[day];
        }
    });
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Saved rest days for week ' + scheduleState.currentWeek + ' and removed classes on rest days');
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
window.getClassLabel = getClassLabel;
window.setClassLabel = setClassLabel;
window.getClassGroupLabel = getClassGroupLabel;
window.setClassGroupLabel = setClassGroupLabel;
window.getClassDuration = getClassDuration;
window.setClassDuration = setClassDuration;
window.isInstructorAvailable = isInstructorAvailable;
window.duplicateScheduleToWeek = duplicateScheduleToWeek;
window.showDuplicateModal = showDuplicateModal;
window.clearSchedule = clearSchedule;
window.saveRestDays = saveRestDays;
window.showAddScheduleClassModal = showAddScheduleClassModal;
window.showScheduleClassDetails = showScheduleClassDetails;
window.removeScheduleClass = removeScheduleClass;
window.getOtherStudents = getOtherStudents;
window.getGroupsForStudent = getGroupsForStudent;
window.checkGroupConflicts = checkGroupConflicts;
