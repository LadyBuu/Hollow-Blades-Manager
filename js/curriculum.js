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
                            <span>Instructor</span>
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
                                    <label>Instructor</label>
                                    <select id="discipline-instructor">
                                        <option value="">Select instructor...</option>
                                    </select>
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
                            </select>
                        </div>
                    </div>
                    <div id="class-view-container">
                        <p class="empty-state">Loading class data...</p>
                    </div>
                </div>

                <!-- TAB 3: Schedule -->
                <div id="tab-schedule" class="tab-panel">
                    <div id="schedule-container"></div>
                </div>

                <!-- TAB 4: Grades -->
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

                <!-- TAB 5: Ranking -->
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
    if (classViewState.filterDiscipline !== 'all') {
        disciplines = disciplines.filter(function(d) {
            return String(d.id) === String(classViewState.filterDiscipline);
        });
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
        var instructor = data.characters ? data.characters.find(function(c) { 
            return String(c.id) === String(disc.instructorId); 
        }) : null;
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Not assigned';
        
        html += '<div class="class-view-discipline" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px;box-shadow:var(--shadow);">';
        html += '<h3 style="color:var(--accent);margin-bottom:4px;">' + disc.name + '</h3>';
        html += '<p style="color:var(--text-dim);font-size:0.8rem;margin-bottom:12px;">Instructor: ' + instructorName + ' | Week: ' + classViewState.currentWeek + ' | Max Students: ' + (disc.maxStudents || 'Unlimited') + '</p>';
        
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
            
            html += '<div class="class-group" style="background:var(--bg);border-radius:var(--radius);padding:10px 12px;margin-bottom:8px;border-left:3px solid ' + (isFull ? 'var(--danger)' : 'var(--accent)') + ';">';
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
 * Populate discipline filter dropdown
 */
function populateDisciplineFilter() {
    var select = document.getElementById('class-discipline-filter');
    if (!select) return;
    
    var disciplines = getAvailableDisciplines(classViewState.currentWeek);
    select.innerHTML = '<option value="all">All Disciplines</option>';
    disciplines.forEach(function(d) {
        var option = document.createElement('option');
        option.value = d.id;
        option.textContent = d.name;
        select.appendChild(option);
    });
    
    // Set selected value
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
    
    var content = container.innerHTML;
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
    
    // Parse and reformat the content for printing
    var disciplineDivs = container.querySelectorAll('.class-view-discipline');
    disciplineDivs.forEach(function(div) {
        var clone = div.cloneNode(true);
        // Clean up any event listeners or unnecessary elements
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
    
    // Make sure curriculum and disciplines exist
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
        var instructor = data.characters ? data.characters.find(function(c) { return String(c.id) === String(d.instructorId); }) : null;
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Not assigned';
        var weekDisplay = d.startWeek ? 'Wk ' + d.startWeek : '?';
        if (d.endWeek) weekDisplay += ' - Wk ' + d.endWeek;
        
        html += '<div class="list-item" data-id="' + d.id + '">' +
            '<span><strong>' + d.name + '</strong></span>' +
            '<span>' + instructorName + '</span>' +
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
    
    // Populate instructors
    var select = document.getElementById('discipline-instructor');
    if (select) {
        select.innerHTML = '<option value="">Select instructor...</option>';
        var instructors = getInstructors();
        if (instructors && instructors.length > 0) {
            instructors.forEach(function(instructor) {
                var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                var option = document.createElement('option');
                option.value = instructor.id;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    }
    
    if (editId) {
        title.textContent = 'Edit Discipline';
        var discipline = data.curriculum.disciplines.find(function(d) { return String(d.id) === String(editId); });
        if (discipline) {
            document.getElementById('discipline-name').value = discipline.name || '';
            document.getElementById('discipline-curriculum').value = discipline.curriculum || '';
            document.getElementById('discipline-start-week').value = discipline.startWeek || '';
            document.getElementById('discipline-end-week').value = discipline.endWeek || '';
            document.getElementById('discipline-hours').value = discipline.weeklyHours || '';
            if (select) select.value = discipline.instructorId || '';
            document.getElementById('discipline-students').value = discipline.maxStudents || '';
            document.getElementById('discipline-weight').value = discipline.weight || 1;
            
            var container = document.getElementById('grading-system-container');
            container.innerHTML = '';
            if (discipline.gradingSystem && discipline.gradingSystem.length > 0) {
                discipline.gradingSystem.forEach(function(g) {
                    addGradingEntry(container, g.letter, g.min, g.max);
                });
            } else {
                addGradingEntry(container);
            }
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Discipline';
        formElement.reset();
        document.getElementById('discipline-weight').value = 1;
        var container = document.getElementById('grading-system-container');
        container.innerHTML = '';
        addGradingEntry(container);
        delete formElement.dataset.editId;
    }
    form.scrollIntoView({ behavior: 'smooth' });
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
    entry.innerHTML = `
        <input type="text" class="grading-letter" placeholder="Letter" value="${letter || ''}" style="width:80px;">
        <input type="number" class="grading-min" placeholder="Min %" value="${min || ''}" style="width:80px;" min="0" max="100">
        <input type="number" class="grading-max" placeholder="Max %" value="${max || ''}" style="width:80px;" min="0" max="100">
        <button type="button" class="small danger remove-grading">✕</button>
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
        curriculum: document.getElementById('discipline-curriculum').value.trim(),
        startWeek: document.getElementById('discipline-start-week').value || '',
        endWeek: document.getElementById('discipline-end-week').value || '',
        weeklyHours: parseFloat(document.getElementById('discipline-hours').value) || '',
        instructorId: document.getElementById('discipline-instructor').value || '',
        maxStudents: parseInt(document.getElementById('discipline-students').value) || '',
        weight: parseFloat(document.getElementById('discipline-weight').value) || 1,
        gradingSystem: gradingSystem
    };
    
    if (!disciplineData.name) { alert('Discipline name is required.'); return; }
    
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
            curriculum: disciplineData.curriculum,
            startWeek: disciplineData.startWeek,
            endWeek: disciplineData.endWeek,
            weeklyHours: disciplineData.weeklyHours,
            instructorId: disciplineData.instructorId,
            maxStudents: disciplineData.maxStudents,
            weight: disciplineData.weight,
            gradingSystem: disciplineData.gradingSystem,
            createdAt: new Date().toISOString()
        };
        data.curriculum.disciplines.push(newDiscipline);
        if (typeof logActivity === 'function') {
            logActivity('Added discipline: ' + disciplineData.name);
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

// ... (keep existing grades functions - renderGrades, getGradeLetter, saveGrades, updateGradeSummary)

// ============================================================
// RANKING VIEW
// ============================================================

// ... (keep existing ranking functions - renderRanking, autoRank)

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

    // Class View events
    initClassViewEvents();

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
window.renderGrades = renderGrades;
window.renderRanking = renderRanking;
window.showDisciplineForm = showDisciplineForm;
window.hideDisciplineForm = hideDisciplineForm;
window.addGradingEntry = addGradingEntry;
window.saveDiscipline = saveDiscipline;
window.deleteDiscipline = deleteDiscipline;
window.populateStudentSelector = populateStudentSelector;
window.saveGrades = saveGrades;
window.getGradeLetter = getGradeLetter;
window.autoRank = autoRank;
window.initCurriculumTabs = initCurriculumTabs;
window.initCurriculumEvents = initCurriculumEvents;
window.exportClassView = exportClassView;
