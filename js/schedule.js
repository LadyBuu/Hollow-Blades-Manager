/**
 * schedule.js - Per-Student Schedule Calendar
 * Handles individual student schedules, week by week
 * Updated with auto-group assignment
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
            disciplineGroups: {},
            autoGroups: {}
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
    if (!data.curriculum.autoGroups) {
        data.curriculum.autoGroups = {};
    }
    
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
            // Check if student is in an auto-group for this discipline
            var groupInfo = '';
            if (typeof getStudentAutoGroup === 'function') {
                var group = getStudentAutoGroup(studentId, d.id);
                if (group) {
                    groupInfo = ' ✓ Group: ' + group.displayName;
                }
            }
            available.push({
                discipline: d,
                used: usedCount,
                maxHours: maxHours,
                remaining: maxHours - usedCount,
                instructorIds: d.instructorIds || [],
                instructorNames: instructors,
                groupInfo: groupInfo
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
 * Show duplicate modal
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
 * Duplicate schedule to another week
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
                var groupInfo = item.groupInfo || '';
                
                html += '<div class="available-discipline' + (isFull ? ' full' : '') + '" style="cursor:pointer;" data-discipline="' + disc.id + '">' +
                    '<span>' + disc.name + ' <span style="font-size:0.6rem;color:var(--text-dim);">(' + instructorDisplay + ')</span>' + groupInfo + '</span>' +
                    '<span class="hours">' + item.used + '/' + item.maxHours + 'h</span>' +
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
 * Show add class modal (updated with auto-group)
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
                            var groupInfo = item.groupInfo || '';
                            return '<option value="' + d.id + '">' + 
                                d.name + ' (' + instructorDisplay + ') - ' + 
                                item.used + '/' + item.maxHours + 'h' + groupInfo +
                            '</option>';
                        }).join('')}
                    </select>
                </div>
                
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">
                    <p style="font-size:0.75rem;color:var(--text-dim);">
                        💡 <strong>Auto-Group:</strong> Students in the same group share the same time slot.
                        When you add a student to a class, they join the group for that time slot.
                        All students in the group will have the same class at the same time.
                    </p>
                </div>
                
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class (Auto-Group)</button>
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
        var disciplineId = document.getElementById('add-class-select').value;
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
        var discipline = getDiscipline(disciplineId);
        if (!discipline) {
            alert('Discipline not found.');
            return;
        }
        
        // Find an instructor for this discipline
        var instructorId = null;
        if (discipline.instructorIds && discipline.instructorIds.length > 0) {
            instructorId = discipline.instructorIds[0];
        }
        
        if (!instructorId) {
            alert('No instructor assigned to this discipline.');
            return;
        }
        
        var duration = 1;
        var weekNum = parseInt(week) || 1;
        
        // Use the auto-group system
        if (typeof autoAssignStudentToGroupAndClass === 'function') {
            var result = autoAssignStudentToGroupAndClass(
                studentId,
                disciplineId,
                instructorId,
                weekNum,
                day,
                hour,
                duration
            );
            
            if (result.success) {
                modal.remove();
                saveData().then(function() {
                    if (typeof logActivity === 'function') {
                        logActivity('Added ' + discipline.name + ' to ' + getStudentName(studentId) + ' via auto-group');
                    }
                    renderSchedule();
                    if (typeof renderAutoGroups === 'function') {
                        renderAutoGroups();
                    }
                    alert('✅ ' + result.message + '\nGroup: ' + (result.group ? result.group.displayName : 'N/A'));
                }).catch(function(err) {
                    console.error('Failed to save:', err);
                    renderSchedule();
                    alert('Class added but failed to save data.');
                });
            } else {
                if (result.needsMoveConfirmation) {
                    // Student is in another group - ask to move
                    if (confirm(result.message + '\n\nMove student to new group?')) {
                        // Force move: remove from old group, add to new
                        var existingGroup = result.existingGroup;
                        if (existingGroup) {
                            var idx = existingGroup.students.indexOf(studentId);
                            if (idx !== -1) {
                                existingGroup.students.splice(idx, 1);
                            }
                        }
                        
                        // Try again
                        var retryResult = autoAssignStudentToGroupAndClass(
                            studentId,
                            disciplineId,
                            instructorId,
                            weekNum,
                            day,
                            hour,
                            duration
                        );
                        
                        if (retryResult.success) {
                            modal.remove();
                            saveData().then(function() {
                                renderSchedule();
                                if (typeof renderAutoGroups === 'function') {
                                    renderAutoGroups();
                                }
                                alert('✅ Student moved to new group and class assigned!');
                            }).catch(function(err) {
                                console.error('Failed to save:', err);
                                renderSchedule();
                            });
                        } else {
                            alert('❌ Failed to move student: ' + retryResult.message);
                        }
                    }
                } else if (result.hasConflicts) {
                    // Conflicts in the group
                    var conflictMsg = '⚠ ' + result.message + '\n\n';
                    if (result.conflicts) {
                        conflictMsg += 'Students with conflicts:\n';
                        result.conflicts.forEach(function(c) {
                            conflictMsg += '  • ' + c.studentName + ' (' + c.conflictDiscipline + ')\n';
                        });
                    }
                    conflictMsg += '\nOptions:\n1. Remove conflicting students from group\n2. Keep student (add anyway, conflicts remain)';
                    
                    var choice = confirm(conflictMsg + '\n\nClick OK to remove conflicting students, Cancel to add anyway.');
                    
                    if (choice) {
                        // Remove conflicting students
                        if (typeof resolveAutoGroupConflicts === 'function') {
                            var resolveResult = resolveAutoGroupConflicts(
                                disciplineId,
                                instructorId,
                                day,
                                hour,
                                weekNum,
                                'remove_conflicting'
                            );
                            if (resolveResult.success) {
                                // Try again
                                var retryResult = autoAssignStudentToGroupAndClass(
                                    studentId,
                                    disciplineId,
                                    instructorId,
                                    weekNum,
                                    day,
                                    hour,
                                    duration
                                );
                                if (retryResult.success) {
                                    modal.remove();
                                    saveData().then(function() {
                                        renderSchedule();
                                        if (typeof renderAutoGroups === 'function') {
                                            renderAutoGroups();
                                        }
                                        alert('✅ Conflicts resolved, student added!');
                                    }).catch(function(err) {
                                        console.error('Failed to save:', err);
                                        renderSchedule();
                                    });
                                } else {
                                    alert('❌ ' + retryResult.message);
                                }
                            }
                        }
                    } else {
                        // Add anyway - force add to group
                        var group = getAutoGroupForSlot(disciplineId, instructorId, day, hour);
                        if (group) {
                            if (group.students.indexOf(studentId) === -1) {
                                group.students.push(studentId);
                            }
                            var addResult = addClassToStudent(studentId, disciplineId, weekNum, day, hour, duration, instructorId);
                            if (addResult.success) {
                                modal.remove();
                                saveData().then(function() {
                                    renderSchedule();
                                    if (typeof renderAutoGroups === 'function') {
                                        renderAutoGroups();
                                    }
                                    alert('✅ Student added despite conflicts.');
                                }).catch(function(err) {
                                    console.error('Failed to save:', err);
                                    renderSchedule();
                                });
                            } else {
                                alert('❌ ' + addResult.message);
                            }
                        }
                    }
                } else if (result.hasConflict) {
                    alert('⚠ ' + result.message);
                } else {
                    alert('❌ ' + result.message);
                }
            }
        } else {
            // Fallback to old method if auto-group not available
            alert('Auto-group system not available. Please check the groups module.');
        }
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
    
    // Check if this student is in an auto-group
    var groupInfo = '';
    if (typeof getStudentAutoGroup === 'function' && instructorId) {
        var group = getStudentAutoGroup(studentId, disciplineId);
        if (group) {
            groupInfo = '<div class="detail-row"><span class="label">Auto-Group:</span> <span><strong>' + group.displayName + '</strong> (' + group.students.length + ' students)</span></div>';
        }
    }
    
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
                ${groupInfo}
                
                <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
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
    
    modal.querySelector('#remove-class-detail').onclick = function() {
        if (confirm('Remove this class from the schedule?')) {
            // Also remove from auto-group if applicable
            if (instructorId && typeof removeStudentFromAutoGroup === 'function') {
                var group = getAutoGroupForSlot(disciplineId, instructorId, day, hour);
                if (group && group.students.indexOf(studentId) !== -1) {
                    if (confirm('This student is in an auto-group. Remove from group as well?')) {
                        var idx = group.students.indexOf(studentId);
                        if (idx !== -1) {
                            group.students.splice(idx, 1);
                        }
                    }
                }
            }
            removeScheduleClass(studentId, week, day, hour);
            modal.remove();
            if (typeof renderAutoGroups === 'function') {
                renderAutoGroups();
            }
        }
    };
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
    
    // Also clear auto-groups for this week (optional - might want to keep)
    // For now, we'll keep auto-groups
    
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
window.duplicateScheduleToWeek = duplicateScheduleToWeek;
window.showDuplicateModal = showDuplicateModal;
window.clearSchedule = clearSchedule;
window.saveRestDays = saveRestDays;
window.showAddScheduleClassModal = showAddScheduleClassModal;
window.showScheduleClassDetails = showScheduleClassDetails;
window.removeScheduleClass = removeScheduleClass;
window.getOtherStudents = getOtherStudents;
window.scheduleState = scheduleState;
