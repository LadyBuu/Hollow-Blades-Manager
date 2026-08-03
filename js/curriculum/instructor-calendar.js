/**
 * instructor-calendar.js - Instructor Calendar Module
 * Shows all classes for a selected instructor
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
    var classes = [];
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
                        
                        // If class has specific instructor, use that. Otherwise check if instructor is in the discipline's instructors list
                        var isTeaching = false;
                        if (classInstructorId) {
                            isTeaching = String(classInstructorId) === String(instructorCalendarState.selectedInstructorId);
                        } else if (discipline.instructorIds) {
                            isTeaching = discipline.instructorIds.some(function(id) { 
                                return String(id) === String(instructorCalendarState.selectedInstructorId); 
                            });
                        }
                        
                        if (isTeaching) {
                            classes.push({
                                student: student,
                                discipline: discipline,
                                day: parseInt(day),
                                hour: parseInt(hour),
                                instructorId: classInstructorId || instructorCalendarState.selectedInstructorId
                            });
                        }
                    }
                }
            }
        }
    });
    
    if (classes.length === 0) {
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
            var classAtSlot = classes.filter(function(c) { return c.day === d && c.hour === hour; });
            if (classAtSlot.length > 0) {
                html += '<div class="class-cell" title="Click to view details">';
                classAtSlot.forEach(function(c) {
                    var studentName = [c.student.firstName, c.student.lastName].filter(function(n) { return n; }).join(' ');
                    html += '<div class="class-name">' + c.discipline.name + '</div>';
                    html += '<div class="student-name">' + studentName + '</div>';
                    
                    // Add click handler via data attributes
                    html += '<div style="display:none;" class="class-data" data-student="' + c.student.id + '" data-discipline="' + c.discipline.id + '" data-day="' + c.day + '" data-hour="' + c.hour + '"></div>';
                });
                html += '</div>';
            } else {
                html += '<div class="empty-cell">·</div>';
            }
        }
    });
    
    html += '</div>';
    html += '</div>';
    
    // Summary
    html += '<div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
    html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Summary</h4>';
    html += '<p style="font-size:0.8rem;">Total Classes: <strong>' + classes.length + '</strong></p>';
    
    // Group by discipline
    var disciplineCounts = {};
    classes.forEach(function(c) {
        if (!disciplineCounts[c.discipline.name]) disciplineCounts[c.discipline.name] = 0;
        disciplineCounts[c.discipline.name]++;
    });
    html += '<div style="margin-top:4px;font-size:0.75rem;color:var(--text-dim);">';
    for (var name in disciplineCounts) {
        html += '<div>' + name + ': ' + disciplineCounts[name] + ' class(es)</div>';
    }
    html += '</div>';
    html += '</div>';
    
    html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">';
    html += '<h4 style="color:var(--accent);font-size:0.85rem;margin-bottom:8px;">Students</h4>';
    var studentSet = {};
    classes.forEach(function(c) {
        var name = [c.student.firstName, c.student.lastName].filter(function(n) { return n; }).join(' ');
        studentSet[name] = true;
    });
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
    for (var s in studentSet) {
        html += '<span style="background:var(--bg);padding:2px 8px;border-radius:12px;font-size:0.7rem;">' + s + '</span>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Add click handlers to class cells for details
    container.querySelectorAll('.class-cell').forEach(function(cell) {
        cell.addEventListener('click', function() {
            var dataEl = this.querySelector('.class-data');
            if (dataEl) {
                var studentId = dataEl.dataset.student;
                var disciplineId = dataEl.dataset.discipline;
                var day = parseInt(dataEl.dataset.day);
                var hour = parseInt(dataEl.dataset.hour);
                var week = instructorCalendarState.currentWeek;
                
                // Find and show the class details
                if (typeof showScheduleClassDetails === 'function') {
                    showScheduleClassDetails(studentId, disciplineId, week, day, hour);
                } else {
                    // Fallback: show alert with class info
                    var discipline = getDiscipline(disciplineId);
                    var student = data.characters.find(function(c) { return String(c.id) === String(studentId); });
                    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    var hourDisplay = hour > 12 ? hour - 12 : hour;
                    var ampm = hour >= 12 ? 'PM' : 'AM';
                    if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                    if (hour === 12) { ampm = 'PM'; }
                    alert(discipline.name + ' with ' + studentName + ' at ' + dayNames[day] + ' ' + hourDisplay + ':00 ' + ampm);
                }
            }
        });
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
}

// Make functions globally available
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderInstructorCalendarData = renderInstructorCalendarData;
window.populateInstructorCalendarSelector = populateInstructorCalendarSelector;
window.initInstructorCalendarEvents = initInstructorCalendarEvents;
window.instructorCalendarState = instructorCalendarState;
