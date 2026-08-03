/**
 * curriculum.js - Curriculum Management
 * Handles disciplines, grades, and ranking tabs (schedule is now in schedule.js)
 */

// Curriculum state
var currentGradeWeek = 1;
var currentRankWeek = 1;
var selectedGradeStudentId = null;

/**
 * Render the curriculum view with tabs
 */
function renderCurriculumView(container) {
    container.innerHTML = `
        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-btn active" data-tab="disciplines">Disciplines</button>
                <button class="tab-btn" data-tab="class-view">👨‍🏫 Class View</button>
                <button class="tab-btn" data-tab="instructor-calendar">🧑‍🏫 Instructor Calendar</button>
                <button class="tab-btn" data-tab="schedule">📅 Schedule</button>
                <button class="tab-btn" data-tab="grades">Grades</button>
                <button class="tab-btn" data-tab="ranking">Ranking</button>
            </div>
            <div class="tab-content">
                <!-- TAB 1: Disciplines -->
                <div id="tab-disciplines" class="tab-panel active">
                    <div class="page-header">
                        <h2>Disciplines</h2>
                        <button id="add-discipline-btn" class="primary">+ Add Discipline</button>
                    </div>
                    <div id="discipline-list">
                        <div class="list-header">
                            <span>Discipline</span>
                            <span>Type</span>
                            <span>Instructors</span>
                            <span>Weeks</span>
                            <span>Hours/Week</span>
                            <span>Students</span>
                            <span>Actions</span>
                        </div>
                        <div id="disciplines-container"></div>
                    </div>
                    <!-- Discipline Form -->
                    <div id="discipline-form" class="form-container hidden">
                        <h3 id="discipline-form-title">Add Discipline</h3>
                        <form id="discipline-form-inner">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Discipline Name *</label>
                                    <input type="text" id="discipline-name" required>
                                </div>
                                <div class="form-group">
                                    <label>Discipline Type *</label>
                                    <select id="discipline-type" required>
                                        <option value="">Select type...</option>
                                        <option value="mandatory">Mandatory / Common</option>
                                        <option value="optional">Optional / Choice</option>
                                    </select>
                                </div>
                                <div class="form-group full-width">
                                    <label>Instructors *</label>
                                    <div id="instructors-container">
                                        <div class="instructor-entry">
                                            <select class="instructor-select">
                                                <option value="">Select instructor...</option>
                                            </select>
                                            <button type="button" class="small danger remove-instructor">✕</button>
                                        </div>
                                    </div>
                                    <button type="button" id="add-instructor-btn" class="small" style="margin-top:8px;">+ Add Instructor</button>
                                </div>
                                <div class="form-group">
                                    <label>Curriculum (free text)</label>
                                    <input type="text" id="discipline-curriculum" placeholder="e.g., Mathematics, Physics...">
                                </div>
                                <div class="form-group">
                                    <label>Start Week</label>
                                    <input type="number" id="discipline-start-week" min="1" max="52">
                                </div>
                                <div class="form-group">
                                    <label>End Week</label>
                                    <input type="number" id="discipline-end-week" min="1" max="52">
                                </div>
                                <div class="form-group">
                                    <label>Weekly Hours</label>
                                    <input type="number" id="discipline-hours" min="1" max="40" step="0.5">
                                </div>
                                <div class="form-group">
                                    <label>Max Students per Class</label>
                                    <input type="number" id="discipline-students" min="1" max="100">
                                </div>
                                <div class="form-group">
                                    <label>Weight (for grade calculation)</label>
                                    <input type="number" id="discipline-weight" min="0.1" max="10" step="0.1" value="1">
                                </div>
                                <div class="form-group full-width">
                                    <label>Grading System</label>
                                    <div id="grading-system-container">
                                        <div class="grading-entry">
                                            <input type="text" class="grading-letter" placeholder="Letter" style="width:80px;">
                                            <input type="number" class="grading-min" placeholder="Min %" min="0" max="100" style="width:80px;">
                                            <input type="number" class="grading-max" placeholder="Max %" min="0" max="100" style="width:80px;">
                                            <button type="button" class="small danger remove-grading">✕</button>
                                        </div>
                                    </div>
                                    <button type="button" id="add-grading-btn" class="small" style="margin-top:8px;">+ Add Grade Level</button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="cancel-discipline-btn" class="secondary">Cancel</button>
                                <button type="submit" id="save-discipline-btn" class="primary">Save Discipline</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- TAB 2: Class View -->
                <div id="tab-class-view" class="tab-panel">
                    <div class="page-header">
                        <h2>Class View</h2>
                        <div class="header-actions">
                            <button id="export-class-view-btn" class="small primary">📊 Export</button>
                        </div>
                    </div>
                    <div class="calendar-controls">
                        <div class="week-nav">
                            <button id="prev-class-week" class="small">← Prev</button>
                            <span id="class-week-display" style="font-weight:600;min-width:80px;text-align:center;">Week 1</span>
                            <button id="next-class-week" class="small">Next →</button>
                            <button id="goto-class-week" class="small primary">Go to Week</button>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <label for="class-discipline-filter" style="font-size:0.75rem;color:var(--text-dim);">Filter:</label>
                            <select id="class-discipline-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                                <option value="all">All Disciplines</option>
                                <option value="mandatory">Mandatory Only</option>
                                <option value="optional">Optional Only</option>
                            </select>
                        </div>
                    </div>
                    <div id="class-view-container">
                        <p class="empty-state">Loading class data...</p>
                    </div>
                </div>

                <!-- TAB 3: Instructor Calendar -->
                <div id="tab-instructor-calendar" class="tab-panel">
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
                </div>

                <!-- TAB 4: Schedule -->
                <div id="tab-schedule" class="tab-panel">
                    <div id="schedule-container"></div>
                </div>

                <!-- TAB 5: Grades -->
                <div id="tab-grades" class="tab-panel">
                    <div id="grades-view">
                        <div class="page-header">
                            <h2>Grades</h2>
                        </div>
                        <div class="grades-controls">
                            <div class="student-selector">
                                <label for="grades-student">Student:</label>
                                <select id="grades-student">
                                    <option value="">Select a student...</option>
                                </select>
                            </div>
                            <div class="week-nav">
                                <button id="prev-grade-week" class="small">← Prev</button>
                                <span id="grade-week-display" style="font-weight:600;min-width:80px;text-align:center;">Week 1</span>
                                <button id="next-grade-week" class="small">Next →</button>
                            </div>
                        </div>
                        <div id="grades-container">
                            <p class="empty-state">Select a student to view and manage grades</p>
                        </div>
                        <div class="grades-summary">
                            <h3>Weekly Summary</h3>
                            <div id="grades-summary-content">
                                <p class="empty-state">No grades data available</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 6: Ranking -->
                <div id="tab-ranking" class="tab-panel">
                    <div id="ranking-view">
                        <div class="page-header">
                            <h2>Ranking</h2>
                        </div>
                        <div class="ranking-controls">
                            <div class="week-nav">
                                <button id="prev-rank-week" class="small">← Prev</button>
                                <span id="rank-week-display" style="font-weight:600;min-width:80px;text-align:center;">Week 1</span>
                                <button id="next-rank-week" class="small">Next →</button>
                            </div>
                            <button id="auto-rank-btn" class="small primary">Auto-Rank</button>
                            <button id="save-rankings-btn" class="small primary">Save Rankings</button>
                        </div>
                        <div id="ranking-container">
                            <p class="empty-state">No ranking data available for this week</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize tabs
    initCurriculumTabs();
    
    // Render content
    renderDisciplines();
    renderClassView();
    renderInstructorCalendar();
    
    // Render schedule (if schedule.js is loaded)
    var scheduleContainer = document.getElementById('schedule-container');
    if (scheduleContainer && typeof renderScheduleView === 'function') {
        renderScheduleView(scheduleContainer);
    }
    
    renderGrades();
    renderRanking();
    initCurriculumEvents();
}

/**
 * Initialize curriculum tabs
 */
function initCurriculumTabs() {
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = {
        disciplines: document.getElementById('tab-disciplines'),
        'class-view': document.getElementById('tab-class-view'),
        'instructor-calendar': document.getElementById('tab-instructor-calendar'),
        schedule: document.getElementById('tab-schedule'),
        grades: document.getElementById('tab-grades'),
        ranking: document.getElementById('tab-ranking')
    };

    // Hide all panels first
    for (var key in panels) {
        if (panels[key]) {
            panels[key].style.display = 'none';
            panels[key].classList.remove('active');
        }
    }

    // Show the active tab's panel
    var activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        var activeTabName = activeTab.dataset.tab;
        if (panels[activeTabName]) {
            panels[activeTabName].style.display = 'block';
            panels[activeTabName].classList.add('active');
        }
    } else {
        // Default to disciplines
        if (panels.disciplines) {
            panels.disciplines.style.display = 'block';
            panels.disciplines.classList.add('active');
        }
    }

    // Add click handlers
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update tab buttons
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            
            var tabName = this.dataset.tab;
            
            // Hide all panels
            for (var key in panels) {
                if (panels[key]) {
                    panels[key].style.display = 'none';
                    panels[key].classList.remove('active');
                }
            }
            
            // Show the selected panel
            if (panels[tabName]) {
                panels[tabName].style.display = 'block';
                panels[tabName].classList.add('active');
            }
            
            // Refresh content when switching tabs
            if (tabName === 'disciplines') {
                renderDisciplines();
            } else if (tabName === 'class-view') {
                renderClassView();
            } else if (tabName === 'instructor-calendar') {
                renderInstructorCalendar();
            } else if (tabName === 'schedule') {
                var container = document.getElementById('schedule-container');
                if (container && typeof renderScheduleView === 'function') {
                    renderScheduleView(container);
                }
            } else if (tabName === 'grades') {
                renderGrades();
            } else if (tabName === 'ranking') {
                renderRanking();
            }
        });
    });
}

// ============================================================
// INSTRUCTOR CALENDAR
// ============================================================

var instructorCalendarState = {
    currentWeek: 1,
    selectedInstructorId: null
};

/**
 * Render instructor calendar
 */
function renderInstructorCalendar() {
    var container = document.getElementById('instructor-calendar-container');
    if (!container) return;
    
    var weekDisplay = document.getElementById('instructor-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + instructorCalendarState.currentWeek;
    
    // Populate instructor selector
    populateInstructorSelector();
    
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
                    if (discipline && discipline.instructorIds && discipline.instructorIds.indexOf(instructorCalendarState.selectedInstructorId) !== -1) {
                        classes.push({
                            student: student,
                            discipline: discipline,
                            day: parseInt(day),
                            hour: parseInt(hour)
                        });
                    }
                }
            }
        }
    });
    
    if (classes.length === 0) {
        container.innerHTML = '<p class="empty-state">' + instructorName + ' has no classes scheduled for week ' + instructorCalendarState.currentWeek + '</p>';
        return;
    }
    
    // Build the calendar grid
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hours = [];
    for (var h = 5; h <= 23; h++) {
        hours.push(h);
    }
    
    var html = '<div class="schedule-grid" style="display:grid;grid-template-columns:60px repeat(7,1fr);gap:2px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:8px;overflow-x:auto;min-width:700px;">';
    
    // Header row
    html += '<div style="padding:4px;font-weight:600;color:var(--text-dim);font-size:0.65rem;text-align:center;">Time</div>';
    for (var d = 1; d <= 7; d++) {
        html += '<div style="padding:4px;font-weight:600;color:var(--text-dim);font-size:0.65rem;text-align:center;background:var(--panel-alt);border-radius:4px;">' + dayNames[d].substring(0, 3) + '</div>';
    }
    
    // Time slots
    hours.forEach(function(hour) {
        var hourDisplay = hour > 12 ? hour - 12 : hour;
        var ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
        if (hour === 12) { ampm = 'PM'; }
        html += '<div style="padding:4px;font-size:0.6rem;color:var(--text-dim);text-align:right;">' + hourDisplay + ':00</div>';
        
        for (var d = 1; d <= 7; d++) {
            var classAtSlot = classes.filter(function(c) { return c.day === d && c.hour === hour; });
            if (classAtSlot.length > 0) {
                html += '<div style="background:var(--accent-soft);border-radius:4px;padding:4px;font-size:0.6rem;border-left:3px solid var(--accent);">';
                classAtSlot.forEach(function(c) {
                    var studentName = [c.student.firstName, c.student.lastName].filter(function(n) { return n; }).join(' ');
                    html += '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">' + c.discipline.name + '</div>';
                    html += '<div style="font-size:0.5rem;color:var(--text-dim);">' + studentName + '</div>';
                });
                html += '</div>';
            } else {
                html += '<div style="padding:4px;opacity:0.2;font-size:0.5rem;color:var(--text-dim);text-align:center;">·</div>';
            }
        }
    });
    
    html += '</div>';
    
    // Legend and summary
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
}

/**
 * Populate instructor selector
 */
function populateInstructorSelector() {
    var select = document.getElementById('instructor-calendar-select');
    if (!select) return;
    
    var instructors = getInstructors();
    select.innerHTML = '<option value="">Select an instructor...</option>';
    instructors.forEach(function(instructor) {
        var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
        var option = document.createElement('option');
        option.value = instructor.id;
        option.textContent = name;
        select.appendChild(option);
    });
    
    // Set selected value
    if (instructorCalendarState.selectedInstructorId) {
        select.value = instructorCalendarState.selectedInstructorId;
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
            renderInstructorCalendar();
        });
    }
    
    var prevBtn = document.getElementById('prev-instructor-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (instructorCalendarState.currentWeek > 1) {
                instructorCalendarState.currentWeek--;
                renderInstructorCalendar();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-instructor-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (instructorCalendarState.currentWeek < 52) {
                instructorCalendarState.currentWeek++;
                renderInstructorCalendar();
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
                    renderInstructorCalendar();
                } else {
                    alert('Please enter a valid week (1-52).');
                }
            }
        });
    }
}

// ============================================================
// CLASS VIEW
// ============================================================

var classViewState = {
    currentWeek: 1,
    filterDiscipline: 'all'
};

/**
 * Render the class view
 */
function renderClassView() {
    var container = document.getElementById('class-view-container');
    if (!container) return;
    
    var weekDisplay = document.getElementById('class-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + classViewState.currentWeek;
    
    // Populate discipline filter
    populateDisciplineFilter();
    
    var students = getStudents();
    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">No students found. Add some students first.</p>';
        return;
    }
    
    // Get all disciplines available this week
    var allDisciplines = getAvailableDisciplines(classViewState.currentWeek);
    if (allDisciplines.length === 0) {
        container.innerHTML = '<p class="empty-state">No disciplines available for week ' + classViewState.currentWeek + '. Add some disciplines first.</p>';
        return;
    }
    
    // Filter disciplines if needed
    var disciplines = allDisciplines;
    if (classViewState.filterDiscipline === 'mandatory') {
        disciplines = disciplines.filter(function(d) { return d.type === 'mandatory'; });
    } else if (classViewState.filterDiscipline === 'optional') {
        disciplines = disciplines.filter(function(d) { return d.type === 'optional'; });
    }
    
    // Build class schedule for each discipline
    var classData = [];
    disciplines.forEach(function(discipline) {
        var classGroups = {}; // key: day_hour, value: array of students
        
        students.forEach(function(student) {
            var schedule = getStudentSchedule(student.id, classViewState.currentWeek);
            for (var day in schedule) {
                for (var hour in schedule[day]) {
                    if (String(schedule[day][hour]) === String(discipline.id)) {
                        var key = day + '_' + hour;
                        if (!classGroups[key]) classGroups[key] = [];
                        classGroups[key].push(student);
                    }
                }
            }
        });
        
        // Only include disciplines that have classes
        if (Object.keys(classGroups).length > 0) {
            classData.push({
                discipline: discipline,
                groups: classGroups
            });
        }
    });
    
    if (classData.length === 0) {
        container.innerHTML = '<p class="empty-state">No classes scheduled for week ' + classViewState.currentWeek + '</p>';
        return;
    }
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var html = '';
    classData.forEach(function(data) {
        var disc = data.discipline;
        var instructors = getInstructorNames(disc);
        var instructorDisplay = instructors.length > 0 ? instructors.join(', ') : 'Not assigned';
        
        var typeLabel = disc.type === 'mandatory' ? '📚 Mandatory' : '🎯 Optional';
        var typeColor = disc.type === 'mandatory' ? 'var(--accent)' : 'var(--warning)';
        
        html += '<div class="class-view-discipline" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px;box-shadow:var(--shadow);">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
        html += '<h3 style="color:var(--accent);margin-bottom:4px;">' + disc.name + '</h3>';
        html += '<span style="font-size:0.75rem;padding:2px 12px;border-radius:12px;background:' + typeColor + '33;color:' + typeColor + ';border:1px solid ' + typeColor + ';">' + typeLabel + '</span>';
        html += '</div>';
        html += '<p style="color:var(--text-dim);font-size:0.8rem;margin-bottom:12px;">Instructors: ' + instructorDisplay + ' | Week: ' + classViewState.currentWeek + ' | Max Students: ' + (disc.maxStudents || 'Unlimited') + '</p>';
        
        // Sort groups by day then hour
        var sortedKeys = Object.keys(data.groups).sort(function(a, b) {
            var aParts = a.split('_');
            var bParts = b.split('_');
            if (parseInt(aParts[0]) !== parseInt(bParts[0])) {
                return parseInt(aParts[0]) - parseInt(bParts[0]);
            }
            return parseInt(aParts[1]) - parseInt(bParts[1]);
        });
        
        sortedKeys.forEach(function(key) {
            var parts = key.split('_');
            var day = parseInt(parts[0]);
            var hour = parseInt(parts[1]);
            var studentsList = data.groups[key];
            
            var hourDisplay = hour > 12 ? hour - 12 : hour;
            var ampm = hour >= 12 ? 'PM' : 'AM';
            if (hour === 0) { hourDisplay = 12; ampm = 'AM'; }
            if (hour === 12) { ampm = 'PM'; }
            
            var isFull = disc.maxStudents && studentsList.length >= disc.maxStudents;
            
            html += '<div class="class-group" style="background:var(--bg);border-radius:var(--radius);padding:10px 12px;margin-bottom:8px;border-left:3px solid ' + (isFull ? 'var(--danger)' : typeColor) + ';">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;">';
            html += '<span style="font-weight:600;">' + dayNames[day] + ' at ' + hourDisplay + ':00 ' + ampm + '</span>';
            html += '<span style="font-size:0.75rem;color:var(--text-dim);">' + studentsList.length + ' student' + (studentsList.length > 1 ? 's' : '') + (isFull ? ' <span style="color:var(--danger);">(FULL)</span>' : '') + '</span>';
            html += '</div>';
            
            // Show students
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
            studentsList.forEach(function(student) {
                var name = [student.firstName, student.middleName, student.lastName].filter(function(n) { return n; }).join(' ');
                var status = getCurrentStatus(student);
                var isDeceased = student.deceased || false;
                html += '<span style="background:var(--panel-alt);padding:2px 10px;border-radius:12px;font-size:0.75rem;' + (isDeceased ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + name + ' <span style="color:var(--text-dim);font-size:0.6rem;">(' + status + ')</span></span>';
            });
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

/**
 * Get instructor names for a discipline
 */
function getInstructorNames(discipline) {
    var names = [];
    if (discipline.instructorIds && discipline.instructorIds.length > 0) {
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
 * Populate discipline filter dropdown
 */
function populateDisciplineFilter() {
    var select = document.getElementById('class-discipline-filter');
    if (!select) return;
    
    select.innerHTML = `
        <option value="all">All Disciplines</option>
        <option value="mandatory">📚 Mandatory Only</option>
        <option value="optional">🎯 Optional Only</option>
    `;
    
    if (classViewState.filterDiscipline !== 'all') {
        select.value = classViewState.filterDiscipline;
    }
}

/**
 * Initialize class view events
 */
function initClassViewEvents() {
    var prevBtn = document.getElementById('prev-class-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (classViewState.currentWeek > 1) {
                classViewState.currentWeek--;
                renderClassView();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-class-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (classViewState.currentWeek < 52) {
                classViewState.currentWeek++;
                renderClassView();
            }
        });
    }
    
    var gotoBtn = document.getElementById('goto-class-week');
    if (gotoBtn) {
        gotoBtn.addEventListener('click', function() {
            var week = prompt('Enter week number (1-52):', classViewState.currentWeek);
            if (week) {
                var w = parseInt(week);
                if (!isNaN(w) && w >= 1 && w <= 52) {
                    classViewState.currentWeek = w;
                    renderClassView();
                } else {
                    alert('Please enter a valid week (1-52).');
                }
            }
        });
    }
    
    var filterSelect = document.getElementById('class-discipline-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            classViewState.filterDiscipline = this.value;
            renderClassView();
        });
    }
    
    var exportBtn = document.getElementById('export-class-view-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportClassView);
    }
}

/**
 * Export class view
 */
function exportClassView() {
    var container = document.getElementById('class-view-container');
    if (!container) return;
    
    var week = classViewState.currentWeek;
    
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>Class View - Week ' + week + '</title>');
    win.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;background:#fff;color:#333;}');
    win.document.write('.class-view-discipline{border:1px solid #ccc;border-radius:8px;padding:16px;margin-bottom:16px;}');
    win.document.write('.class-group{background:#f5f5f5;border-radius:6px;padding:10px 12px;margin-bottom:8px;border-left:3px solid #4CAF50;}');
    win.document.write('.class-group .student{display:inline-block;background:#e0e0e0;padding:2px 10px;border-radius:12px;font-size:12px;margin:2px;}');
    win.document.write('h3{color:#2E7D32;}');
    win.document.write('.meta{color:#666;font-size:13px;}');
    win.document.write('.full{color:#d32f2f;}');
    win.document.write('</style></head><body>');
    win.document.write('<h1>Class View - Week ' + week + '</h1>');
    win.document.write('<p>Generated: ' + new Date().toLocaleString() + '</p>');
    win.document.write('<hr>');
    
    var disciplineDivs = container.querySelectorAll('.class-view-discipline');
    disciplineDivs.forEach(function(div) {
        var clone = div.cloneNode(true);
        win.document.write(clone.outerHTML);
    });
    
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

// ============================================================
// DISCIPLINE MANAGEMENT
// ============================================================

/**
 * Render disciplines list
 */
function renderDisciplines() {
    var container = document.getElementById('disciplines-container');
    if (!container) return;
    
    if (!data.curriculum) {
        data.curriculum = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
    }
    if (!data.curriculum.disciplines) {
        data.curriculum.disciplines = [];
    }
    
    if (data.curriculum.disciplines.length === 0) {
        container.innerHTML = '<p class="empty-state">No disciplines created yet. Add your first discipline!</p>';
        return;
    }
    
    var html = '';
    data.curriculum.disciplines.forEach(function(d) {
        var instructors = getInstructorNames(d);
        var instructorDisplay = instructors.length > 0 ? instructors.join(', ') : 'Not assigned';
        var weekDisplay = d.startWeek ? 'Wk ' + d.startWeek : '?';
        if (d.endWeek) weekDisplay += ' - Wk ' + d.endWeek;
        
        var typeLabel = d.type === 'mandatory' ? '📚 Mandatory' : (d.type === 'optional' ? '🎯 Optional' : '—');
        var typeColor = d.type === 'mandatory' ? 'var(--accent)' : (d.type === 'optional' ? 'var(--warning)' : 'var(--text-dim)');
        
        html += '<div class="list-item" data-id="' + d.id + '">' +
            '<span><strong>' + d.name + '</strong></span>' +
            '<span style="color:' + typeColor + ';font-size:0.75rem;">' + typeLabel + '</span>' +
            '<span style="font-size:0.75rem;">' + instructorDisplay + '</span>' +
            '<span>' + weekDisplay + '</span>' +
            '<span>' + (d.weeklyHours || '-') + 'h</span>' +
            '<span>' + (d.maxStudents || '-') + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-discipline" data-id="' + d.id + '">Edit</button>' +
                '<button class="small danger delete-discipline" data-id="' + d.id + '">Delete</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-discipline').forEach(function(btn) {
        btn.addEventListener('click', function() { showDisciplineForm(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-discipline').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteDiscipline(btn.dataset.id); });
    });
}

/**
 * Show discipline form
 */
function showDisciplineForm(editId) {
    var form = document.getElementById('discipline-form');
    var title = document.getElementById('discipline-form-title');
    var formElement = document.getElementById('discipline-form-inner');
    form.classList.remove('hidden');
    
    // Populate instructor selects
    populateInstructorSelects();
    
    if (editId) {
        title.textContent = 'Edit Discipline';
        var discipline = data.curriculum.disciplines.find(function(d) { return String(d.id) === String(editId); });
        if (discipline) {
            document.getElementById('discipline-name').value = discipline.name || '';
            document.getElementById('discipline-type').value = discipline.type || '';
            document.getElementById('discipline-curriculum').value = discipline.curriculum || '';
            document.getElementById('discipline-start-week').value = discipline.startWeek || '';
            document.getElementById('discipline-end-week').value = discipline.endWeek || '';
            document.getElementById('discipline-hours').value = discipline.weeklyHours || '';
            document.getElementById('discipline-students').value = discipline.maxStudents || '';
            document.getElementById('discipline-weight').value = discipline.weight || 1;
            
            // Populate instructors
            var container = document.getElementById('instructors-container');
            container.innerHTML = '';
            if (discipline.instructorIds && discipline.instructorIds.length > 0) {
                discipline.instructorIds.forEach(function(id) {
                    addInstructorEntry(container, id);
                });
            } else {
                addInstructorEntry(container);
            }
            
            var gradingContainer = document.getElementById('grading-system-container');
            gradingContainer.innerHTML = '';
            if (discipline.gradingSystem && discipline.gradingSystem.length > 0) {
                discipline.gradingSystem.forEach(function(g) {
                    addGradingEntry(gradingContainer, g.letter, g.min, g.max);
                });
            } else {
                addGradingEntry(gradingContainer);
            }
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Discipline';
        formElement.reset();
        document.getElementById('discipline-weight').value = 1;
        
        var container = document.getElementById('instructors-container');
        container.innerHTML = '';
        addInstructorEntry(container);
        
        var gradingContainer = document.getElementById('grading-system-container');
        gradingContainer.innerHTML = '';
        addGradingEntry(gradingContainer);
        delete formElement.dataset.editId;
    }
    form.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Populate all instructor select dropdowns
 */
function populateInstructorSelects() {
    var selects = document.querySelectorAll('.instructor-select');
    var instructors = getInstructors();
    
    selects.forEach(function(select) {
        var currentValue = select.value;
        select.innerHTML = '<option value="">Select instructor...</option>';
        instructors.forEach(function(instructor) {
            var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
            var option = document.createElement('option');
            option.value = instructor.id;
            option.textContent = name;
            select.appendChild(option);
        });
        if (currentValue) select.value = currentValue;
    });
}

/**
 * Add instructor entry to the form
 */
function addInstructorEntry(container, selectedId) {
    var entry = document.createElement('div');
    entry.className = 'instructor-entry';
    entry.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;align-items:center;';
    
    var select = document.createElement('select');
    select.className = 'instructor-select';
    select.style.cssText = 'flex:1;min-width:120px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;font-family:Inter,sans-serif;';
    select.innerHTML = '<option value="">Select instructor...</option>';
    
    var instructors = getInstructors();
    instructors.forEach(function(instructor) {
        var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
        var option = document.createElement('option');
        option.value = instructor.id;
        option.textContent = name;
        if (selectedId && String(instructor.id) === String(selectedId)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'small danger remove-instructor';
    removeBtn.textContent = '✕';
    removeBtn.style.cssText = 'padding:4px 8px;font-size:0.65rem;';
    removeBtn.onclick = function() {
        if (container.children.length > 1) {
            entry.remove();
        } else {
            alert('You need at least one instructor.');
        }
    };
    
    entry.appendChild(select);
    entry.appendChild(removeBtn);
    container.appendChild(entry);
}

/**
 * Hide discipline form
 */
function hideDisciplineForm() {
    document.getElementById('discipline-form').classList.add('hidden');
}

/**
 * Add grading entry
 */
function addGradingEntry(container, letter, min, max) {
    var entry = document.createElement('div');
    entry.className = 'grading-entry';
    entry.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;align-items:center;';
    entry.innerHTML = `
        <input type="text" class="grading-letter" placeholder="Letter" value="${letter || ''}" style="width:80px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;">
        <input type="number" class="grading-min" placeholder="Min %" value="${min || ''}" style="width:80px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;" min="0" max="100">
        <input type="number" class="grading-max" placeholder="Max %" value="${max || ''}" style="width:80px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;" min="0" max="100">
        <button type="button" class="small danger remove-grading" style="padding:4px 8px;font-size:0.65rem;">✕</button>
    `;
    container.appendChild(entry);
    entry.querySelector('.remove-grading').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one grade level.');
    };
}

/**
 * Save discipline
 */
function saveDiscipline(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    // Collect instructors
    var instructorIds = [];
    document.querySelectorAll('.instructor-select').forEach(function(select) {
        if (select.value) {
            instructorIds.push(select.value);
        }
    });
    
    if (instructorIds.length === 0) {
        alert('Please select at least one instructor.');
        return;
    }
    
    var gradingSystem = [];
    document.querySelectorAll('.grading-entry').forEach(function(entry) {
        var letter = entry.querySelector('.grading-letter').value.trim();
        var min = entry.querySelector('.grading-min').value;
        var max = entry.querySelector('.grading-max').value;
        if (letter && min && max) {
            gradingSystem.push({ letter: letter, min: parseFloat(min), max: parseFloat(max) });
        }
    });
    
    var disciplineData = {
        name: document.getElementById('discipline-name').value.trim(),
        type: document.getElementById('discipline-type').value,
        instructorIds: instructorIds,
        curriculum: document.getElementById('discipline-curriculum').value.trim(),
        startWeek: document.getElementById('discipline-start-week').value || '',
        endWeek: document.getElementById('discipline-end-week').value || '',
        weeklyHours: parseFloat(document.getElementById('discipline-hours').value) || '',
        maxStudents: parseInt(document.getElementById('discipline-students').value) || '',
        weight: parseFloat(document.getElementById('discipline-weight').value) || 1,
        gradingSystem: gradingSystem
    };
    
    if (!disciplineData.name) { alert('Discipline name is required.'); return; }
    if (!disciplineData.type) { alert('Please select a discipline type.'); return; }
    
    if (!data.curriculum) {
        data.curriculum = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
    }
    
    if (editId) {
        var index = data.curriculum.disciplines.findIndex(function(d) { return String(d.id) === String(editId); });
        if (index !== -1) {
            data.curriculum.disciplines[index] = Object.assign({}, data.curriculum.disciplines[index], disciplineData);
            if (typeof logActivity === 'function') {
                logActivity('Updated discipline: ' + disciplineData.name);
            }
        }
    } else {
        var newDiscipline = {
            id: generateId('disc'),
            name: disciplineData.name,
            type: disciplineData.type,
            instructorIds: disciplineData.instructorIds,
            curriculum: disciplineData.curriculum,
            startWeek: disciplineData.startWeek,
            endWeek: disciplineData.endWeek,
            weeklyHours: disciplineData.weeklyHours,
            maxStudents: disciplineData.maxStudents,
            weight: disciplineData.weight,
            gradingSystem: disciplineData.gradingSystem,
            createdAt: new Date().toISOString()
        };
        data.curriculum.disciplines.push(newDiscipline);
        if (typeof logActivity === 'function') {
            logActivity('Added discipline: ' + disciplineData.name + ' (' + disciplineData.type + ')');
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderDisciplines();
    hideDisciplineForm();
}

/**
 * Delete discipline
 */
function deleteDiscipline(id) {
    if (!confirm('Delete this discipline permanently? This will remove it from all schedules.')) return;
    
    var discipline = data.curriculum.disciplines.find(function(d) { return String(d.id) === String(id); });
    if (!discipline) return;
    
    // Remove from all schedules
    if (data.curriculum.schedules) {
        for (var studentId in data.curriculum.schedules) {
            for (var week in data.curriculum.schedules[studentId]) {
                var schedule = data.curriculum.schedules[studentId][week];
                for (var day in schedule) {
                    for (var hour in schedule[day]) {
                        if (String(schedule[day][hour]) === String(id)) {
                            delete schedule[day][hour];
                        }
                    }
                }
            }
        }
    }
    
    data.curriculum.disciplines = data.curriculum.disciplines.filter(function(d) { return String(d.id) !== String(id); });
    if (typeof logActivity === 'function') {
        logActivity('Deleted discipline: ' + discipline.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderDisciplines();
}

// ============================================================
// GRADES VIEW
// ============================================================

/**
 * Render grades view
 */
function renderGrades() {
    var container = document.getElementById('grades-container');
    var summary = document.getElementById('grades-summary-content');
    
    var weekDisplay = document.getElementById('grade-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + currentGradeWeek;
    
    if (!selectedGradeStudentId) {
        if (container) container.innerHTML = '<p class="empty-state">Select a student to view and manage grades</p>';
        if (summary) summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    var student = data.characters.find(function(c) { return String(c.id) === String(selectedGradeStudentId); });
    if (!student) {
        if (container) container.innerHTML = '<p class="empty-state">Student not found</p>';
        return;
    }
    
    var disciplines = getAvailableDisciplines(currentGradeWeek);
    if (disciplines.length === 0) {
        if (container) container.innerHTML = '<p class="empty-state">No disciplines available for week ' + currentGradeWeek + '</p>';
        if (summary) summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    // Get student's schedule for this week
    var schedule = getStudentSchedule(selectedGradeStudentId, currentGradeWeek);
    var studentDisciplines = [];
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            var disciplineId = schedule[day][hour];
            if (disciplineId && studentDisciplines.indexOf(disciplineId) === -1) {
                studentDisciplines.push(disciplineId);
            }
        }
    }
    
    if (!data.curriculum.grades) data.curriculum.grades = {};
    if (!data.curriculum.grades[selectedGradeStudentId]) {
        data.curriculum.grades[selectedGradeStudentId] = {};
    }
    if (!data.curriculum.grades[selectedGradeStudentId][currentGradeWeek]) {
        data.curriculum.grades[selectedGradeStudentId][currentGradeWeek] = {};
    }
    var grades = data.curriculum.grades[selectedGradeStudentId][currentGradeWeek];
    
    var html = '<table class="grades-table">';
    html += '<thead><tr>';
    html += '<th>Discipline</th>';
    html += '<th>Type</th>';
    html += '<th>Instructor</th>';
    html += '<th>Weight</th>';
    html += '<th>Score</th>';
    html += '<th>Grade</th>';
    html += '<th>Weighted Score</th>';
    html += '</tr></thead><tbody>';
    
    var totalWeighted = 0;
    var totalWeight = 0;
    
    disciplines.sort(function(a, b) { return a.name.localeCompare(b.name); });
    
    disciplines.forEach(function(d) {
        var isInSchedule = studentDisciplines.indexOf(d.id) !== -1;
        var score = grades[d.id] !== undefined ? grades[d.id] : '';
        var letter = getGradeLetter(d, score);
        var weighted = score && d.weight ? score * d.weight : 0;
        
        if (score && d.weight) {
            totalWeighted += weighted;
            totalWeight += d.weight;
        }
        
        var typeLabel = d.type === 'mandatory' ? '📚' : (d.type === 'optional' ? '🎯' : '—');
        var typeColor = d.type === 'mandatory' ? 'var(--accent)' : (d.type === 'optional' ? 'var(--warning)' : 'var(--text-dim)');
        var instructors = getInstructorNames(d);
        var instructorDisplay = instructors.length > 0 ? instructors[0] : '—';
        
        html += '<tr' + (isInSchedule ? '' : ' style="opacity:0.4;"') + '>';
        html += '<td>' + d.name + (isInSchedule ? '' : ' (not scheduled)') + '</td>';
        html += '<td style="color:' + typeColor + ';font-size:0.7rem;">' + typeLabel + '</td>';
        html += '<td style="font-size:0.7rem;">' + instructorDisplay + '</td>';
        html += '<td class="weight">' + d.weight + '</td>';
        html += '<td><input type="number" class="grade-input" data-discipline="' + d.id + '" value="' + score + '" min="0" max="100" step="0.1"></td>';
        html += '<td class="grade-letter">' + (letter || '—') + '</td>';
        html += '<td>' + (weighted ? weighted.toFixed(1) : '—') + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '<div style="margin-top:12px;"><button id="save-grades-btn" class="primary small">Save Grades</button></div>';
    if (container) container.innerHTML = html;
    
    if (container) {
        container.querySelectorAll('.grade-input').forEach(function(input) {
            input.addEventListener('change', function() {
                var disciplineId = this.dataset.discipline;
                var value = parseFloat(this.value);
                var discipline = getDiscipline(disciplineId);
                var letter = getGradeLetter(discipline, value);
                var row = this.closest('tr');
                if (row) {
                    row.querySelector('.grade-letter').textContent = letter || '—';
                }
            });
        });
        
        var saveBtn = container.querySelector('#save-grades-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveGrades();
            });
        }
    }
    
    updateGradeSummary();
}

/**
 * Get grade letter for a score
 */
function getGradeLetter(discipline, score) {
    if (!discipline || !discipline.gradingSystem || discipline.gradingSystem.length === 0 || score === undefined || score === null || score === '') {
        return '';
    }
    var numScore = parseFloat(score);
    if (isNaN(numScore)) return '';
    
    var sorted = discipline.gradingSystem.slice().sort(function(a, b) { return b.min - a.min; });
    for (var i = 0; i < sorted.length; i++) {
        var grade = sorted[i];
        if (numScore >= grade.min && numScore <= grade.max) {
            return grade.letter;
        }
    }
    return '';
}

/**
 * Save grades
 */
function saveGrades() {
    if (!selectedGradeStudentId) return;
    
    var grades = {};
    document.querySelectorAll('.grade-input').forEach(function(input) {
        var disciplineId = input.dataset.discipline;
        var value = parseFloat(input.value);
        if (!isNaN(value)) {
            grades[disciplineId] = value;
        }
    });
    
    if (!data.curriculum.grades) data.curriculum.grades = {};
    if (!data.curriculum.grades[selectedGradeStudentId]) {
        data.curriculum.grades[selectedGradeStudentId] = {};
    }
    data.curriculum.grades[selectedGradeStudentId][currentGradeWeek] = grades;
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderGrades();
    if (typeof logActivity === 'function') {
        logActivity('Saved grades for student week ' + currentGradeWeek);
    }
}

/**
 * Update grade summary
 */
function updateGradeSummary() {
    var summary = document.getElementById('grades-summary-content');
    if (!summary) return;
    
    if (!selectedGradeStudentId) {
        summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    var grades = data.curriculum.grades && data.curriculum.grades[selectedGradeStudentId] && data.curriculum.grades[selectedGradeStudentId][currentGradeWeek] ? 
        data.curriculum.grades[selectedGradeStudentId][currentGradeWeek] : {};
    
    var disciplines = getAvailableDisciplines(currentGradeWeek);
    var totalWeighted = 0;
    var totalWeight = 0;
    var count = 0;
    var mandatoryCount = 0;
    var optionalCount = 0;
    
    disciplines.forEach(function(d) {
        var score = grades[d.id];
        if (score !== undefined && score !== null && score !== '' && d.weight) {
            totalWeighted += parseFloat(score) * d.weight;
            totalWeight += d.weight;
            count++;
            if (d.type === 'mandatory') mandatoryCount++;
            else if (d.type === 'optional') optionalCount++;
        }
    });
    
    var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;">' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Average</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--accent);">' + average.toFixed(1) + '</span></div>' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Disciplines</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--text);">' + count + '/' + disciplines.length + '</span></div>' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">📚 Mandatory</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--accent);">' + mandatoryCount + '</span></div>' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">🎯 Optional</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--warning);">' + optionalCount + '</span></div>' +
    '</div>';
    html += '<div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;">' +
        '<span style="color:var(--text-dim);">Status: </span>' +
        '<span style="font-weight:700;' + (average >= 70 ? 'color:var(--accent);' : 'color:var(--danger);') + '">' + (average >= 70 ? '✅ Passing' : '⚠️ Needs Work') + '</span>' +
    '</div>';
    summary.innerHTML = html;
}

// ============================================================
// RANKING VIEW
// ============================================================

/**
 * Render ranking view
 */
function renderRanking() {
    var container = document.getElementById('ranking-container');
    var weekDisplay = document.getElementById('rank-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + currentRankWeek;
    
    if (!container) return;
    
    var students = getStudents();
    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">No students found</p>';
        return;
    }
    
    // Calculate averages for each student
    var rankings = [];
    students.forEach(function(student) {
        var grades = data.curriculum.grades && data.curriculum.grades[student.id] && data.curriculum.grades[student.id][currentRankWeek] ? 
            data.curriculum.grades[student.id][currentRankWeek] : {};
        
        var disciplines = getAvailableDisciplines(currentRankWeek);
        var totalWeighted = 0;
        var totalWeight = 0;
        var count = 0;
        var mandatoryCount = 0;
        var optionalCount = 0;
        
        disciplines.forEach(function(d) {
            var score = grades[d.id];
            if (score !== undefined && score !== null && score !== '' && d.weight) {
                totalWeighted += parseFloat(score) * d.weight;
                totalWeight += d.weight;
                count++;
                if (d.type === 'mandatory') mandatoryCount++;
                else if (d.type === 'optional') optionalCount++;
            }
        });
        
        var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        rankings.push({
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName || '',
            average: average,
            count: count,
            total: disciplines.length,
            mandatoryCount: mandatoryCount,
            optionalCount: optionalCount
        });
    });
    
    // Sort by average (descending)
    rankings.sort(function(a, b) {
        if (b.average !== a.average) return b.average - a.average;
        return a.firstName.localeCompare(b.firstName);
    });
    
    // Get existing rankings for this week
    if (!data.curriculum.rankings) data.curriculum.rankings = {};
    var existingRankings = data.curriculum.rankings[currentRankWeek] || [];
    
    // If no rankings exist, create them
    if (existingRankings.length === 0) {
        rankings.forEach(function(r, index) {
            existingRankings.push({
                studentId: r.studentId,
                rank: index + 1,
                average: r.average
            });
        });
        data.curriculum.rankings[currentRankWeek] = existingRankings;
        saveData().catch(function(err) { console.error('Failed to save:', err); });
    }
    
    if (rankings.length === 0) {
        container.innerHTML = '<p class="empty-state">No ranking data available for this week</p>';
        return;
    }
    
    var previousRankings = data.curriculum.rankings[currentRankWeek - 1] || [];
    
    var html = '<table class="ranking-table">';
    html += '<thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Student</th>';
    html += '<th>Average</th>';
    html += '<th>📚 Mandatory</th>';
    html += '<th>🎯 Optional</th>';
    html += '<th>Change</th>';
    html += '</tr></thead><tbody>';
    
    rankings.forEach(function(r) {
        var existing = existingRankings.find(function(e) { return String(e.studentId) === String(r.studentId); });
        var rank = existing ? existing.rank : '-';
        var previous = previousRankings.find(function(e) { return String(e.studentId) === String(r.studentId); });
        var prevRank = previous ? previous.rank : null;
        
        var change = '';
        var changeClass = '';
        if (prevRank !== null && prevRank !== undefined) {
            var diff = prevRank - rank;
            if (diff > 0) {
                change = '↑' + diff;
                changeClass = 'up';
            } else if (diff < 0) {
                change = '↓' + Math.abs(diff);
                changeClass = 'down';
            } else {
                change = '—';
                changeClass = 'same';
            }
        }
        
        html += '<tr>';
        html += '<td class="rank-number"><input type="number" class="rank-input" data-student="' + r.studentId + '" value="' + rank + '" min="1" max="' + rankings.length + '"></td>';
        html += '<td>' + r.firstName + (r.lastName ? ' ' + r.lastName : '') + '</td>';
        html += '<td style="font-weight:700;color:var(--accent);">' + (r.average > 0 ? r.average.toFixed(1) : '—') + '</td>';
        html += '<td>' + r.mandatoryCount + '</td>';
        html += '<td>' + r.optionalCount + '</td>';
        html += '<td><span class="rank-change ' + changeClass + '">' + change + '</span></td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Rank input change handler
    container.querySelectorAll('.rank-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var studentId = this.dataset.student;
            var newRank = parseInt(this.value);
            var maxRank = parseInt(this.max);
            
            if (isNaN(newRank) || newRank < 1 || newRank > maxRank) {
                alert('Please enter a rank between 1 and ' + maxRank);
                this.value = this.defaultValue;
                return;
            }
            
            var existing = existingRankings.find(function(e) { return String(e.studentId) === String(studentId); });
            if (existing) {
                var oldRank = existing.rank;
                existing.rank = newRank;
                
                existingRankings.forEach(function(e) {
                    if (String(e.studentId) === String(studentId)) return;
                    if (oldRank < newRank && e.rank > oldRank && e.rank <= newRank) {
                        e.rank--;
                    } else if (oldRank > newRank && e.rank >= newRank && e.rank < oldRank) {
                        e.rank++;
                    }
                });
                
                var usedRanks = existingRankings.map(function(e) { return e.rank; });
                var current = 1;
                var sorted = existingRankings.slice().sort(function(a, b) { return a.rank - b.rank; });
                sorted.forEach(function(e) {
                    while (usedRanks.indexOf(current) !== -1 && usedRanks.indexOf(current) !== usedRanks.indexOf(e.rank)) {
                        current++;
                    }
                    e.rank = current;
                    current++;
                });
                
                saveData().catch(function(err) { console.error('Failed to save:', err); });
                renderRanking();
                if (typeof logActivity === 'function') {
                    logActivity('Updated rankings for week ' + currentRankWeek);
                }
            }
        });
    });
}

/**
 * Auto-rank students
 */
function autoRank() {
    var students = getStudents();
    var rankings = [];
    
    students.forEach(function(student) {
        var grades = data.curriculum.grades && data.curriculum.grades[student.id] && data.curriculum.grades[student.id][currentRankWeek] ? 
            data.curriculum.grades[student.id][currentRankWeek] : {};
        
        var disciplines = getAvailableDisciplines(currentRankWeek);
        var totalWeighted = 0;
        var totalWeight = 0;
        
        disciplines.forEach(function(d) {
            var score = grades[d.id];
            if (score !== undefined && score !== null && score !== '' && d.weight) {
                totalWeighted += parseFloat(score) * d.weight;
                totalWeight += d.weight;
            }
        });
        
        var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        rankings.push({
            studentId: student.id,
            average: average
        });
    });
    
    rankings.sort(function(a, b) {
        if (b.average !== a.average) return b.average - a.average;
        var aName = data.characters.find(function(c) { return String(c.id) === String(a.studentId); });
        var bName = data.characters.find(function(c) { return String(c.id) === String(b.studentId); });
        var aFirstName = aName ? aName.firstName : '';
        var bFirstName = bName ? bName.firstName : '';
        return aFirstName.localeCompare(bFirstName);
    });
    
    var newRankings = [];
    rankings.forEach(function(r, index) {
        newRankings.push({
            studentId: r.studentId,
            rank: index + 1,
            average: r.average
        });
    });
    
    if (!data.curriculum.rankings) data.curriculum.rankings = {};
    data.curriculum.rankings[currentRankWeek] = newRankings;
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRanking();
    if (typeof logActivity === 'function') {
        logActivity('Auto-ranked students for week ' + currentRankWeek);
    }
}

// ============================================================
// SCHEDULE INTEGRATION (needs to work with schedule.js)
// ============================================================

/**
 * Override the add class function to include instructor selection
 * This function is called from schedule.js when adding a class
 */
function getAvailableDisciplinesForStudentWithInstructors(studentId, week) {
    var allDisciplines = getAvailableDisciplines(week);
    var used = getStudentDisciplineHours(studentId, week);
    var available = [];
    allDisciplines.forEach(function(d) {
        var usedCount = used[d.id] || 0;
        var maxHours = d.weeklyHours || 1;
        if (usedCount < maxHours) {
            var instructors = getInstructorNames(d);
            available.push({
                discipline: d,
                used: usedCount,
                maxHours: maxHours,
                remaining: maxHours - usedCount,
                instructors: instructors
            });
        }
    });
    return available;
}

// Override the showAddScheduleClassModal to include instructor selection
// This is called from schedule.js

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize curriculum events
 */
function initCurriculumEvents() {
    // Discipline events
    var addDisciplineBtn = document.getElementById('add-discipline-btn');
    if (addDisciplineBtn) {
        addDisciplineBtn.addEventListener('click', function() { showDisciplineForm(); });
    }
    
    var cancelDisciplineBtn = document.getElementById('cancel-discipline-btn');
    if (cancelDisciplineBtn) {
        cancelDisciplineBtn.addEventListener('click', hideDisciplineForm);
    }
    
    var disciplineForm = document.getElementById('discipline-form-inner');
    if (disciplineForm) {
        disciplineForm.addEventListener('submit', saveDiscipline);
    }
    
    var addGradingBtn = document.getElementById('add-grading-btn');
    if (addGradingBtn) {
        addGradingBtn.addEventListener('click', function() {
            var container = document.getElementById('grading-system-container');
            addGradingEntry(container);
        });
    }
    
    var addInstructorBtn = document.getElementById('add-instructor-btn');
    if (addInstructorBtn) {
        addInstructorBtn.addEventListener('click', function() {
            var container = document.getElementById('instructors-container');
            addInstructorEntry(container);
        });
    }

    // Class View events
    initClassViewEvents();
    
    // Instructor Calendar events
    initInstructorCalendarEvents();

    // Grades events
    populateStudentSelector('grades-student');
    
    var gradeStudent = document.getElementById('grades-student');
    if (gradeStudent) {
        gradeStudent.addEventListener('change', function() {
            selectedGradeStudentId = this.value;
            renderGrades();
        });
    }
    
    var prevGradeBtn = document.getElementById('prev-grade-week');
    if (prevGradeBtn) {
        prevGradeBtn.addEventListener('click', function() {
            if (currentGradeWeek > 1) {
                currentGradeWeek--;
                var display = document.getElementById('grade-week-display');
                if (display) display.textContent = 'Week ' + currentGradeWeek;
                renderGrades();
            }
        });
    }
    
    var nextGradeBtn = document.getElementById('next-grade-week');
    if (nextGradeBtn) {
        nextGradeBtn.addEventListener('click', function() {
            if (currentGradeWeek < 52) {
                currentGradeWeek++;
                var display = document.getElementById('grade-week-display');
                if (display) display.textContent = 'Week ' + currentGradeWeek;
                renderGrades();
            }
        });
    }

    // Ranking events
    var prevRankBtn = document.getElementById('prev-rank-week');
    if (prevRankBtn) {
        prevRankBtn.addEventListener('click', function() {
            if (currentRankWeek > 1) {
                currentRankWeek--;
                renderRanking();
            }
        });
    }
    
    var nextRankBtn = document.getElementById('next-rank-week');
    if (nextRankBtn) {
        nextRankBtn.addEventListener('click', function() {
            if (currentRankWeek < 52) {
                currentRankWeek++;
                renderRanking();
            }
        });
    }
    
    var autoRankBtn = document.getElementById('auto-rank-btn');
    if (autoRankBtn) {
        autoRankBtn.addEventListener('click', autoRank);
    }
    
    var saveRankBtn = document.getElementById('save-rankings-btn');
    if (saveRankBtn) {
        saveRankBtn.addEventListener('click', function() {
            saveData().then(function() {
                alert('Rankings saved successfully!');
            }).catch(function(err) {
                alert('Failed to save rankings: ' + err.message);
            });
        });
    }
    
    // Set initial student for grades
    var gradeSelect = document.getElementById('grades-student');
    if (gradeSelect && gradeSelect.options.length > 1) {
        gradeSelect.selectedIndex = 1;
        selectedGradeStudentId = gradeSelect.value;
        renderGrades();
    }
}

/**
 * Populate student selector dropdown
 */
function populateStudentSelector(id) {
    var select = document.getElementById(id);
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

// Make functions globally available
window.renderCurriculumView = renderCurriculumView;
window.renderDisciplines = renderDisciplines;
window.renderClassView = renderClassView;
window.renderInstructorCalendar = renderInstructorCalendar;
window.renderGrades = renderGrades;
window.renderRanking = renderRanking;
window.showDisciplineForm = showDisciplineForm;
window.hideDisciplineForm = hideDisciplineForm;
window.addGradingEntry = addGradingEntry;
window.addInstructorEntry = addInstructorEntry;
window.saveDiscipline = saveDiscipline;
window.deleteDiscipline = deleteDiscipline;
window.populateStudentSelector = populateStudentSelector;
window.saveGrades = saveGrades;
window.getGradeLetter = getGradeLetter;
window.autoRank = autoRank;
window.initCurriculumTabs = initCurriculumTabs;
window.initCurriculumEvents = initCurriculumEvents;
window.exportClassView = exportClassView;
window.getInstructorNames = getInstructorNames;
window.getAvailableDisciplinesForStudentWithInstructors = getAvailableDisciplinesForStudentWithInstructors;
