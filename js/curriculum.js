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

                <!-- TAB 2: Schedule -->
                <div id="tab-schedule" class="tab-panel">
                    <div id="schedule-container"></div>
                </div>

                <!-- TAB 3: Grades -->
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

                <!-- TAB 4: Ranking -->
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
        
        html += '<tr' + (isInSchedule ? '' : ' style="opacity:0.4;"') + '>';
        html += '<td>' + d.name + (isInSchedule ? '' : ' (not scheduled)') + '</td>';
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
    
    disciplines.forEach(function(d) {
        var score = grades[d.id];
        if (score !== undefined && score !== null && score !== '' && d.weight) {
            totalWeighted += parseFloat(score) * d.weight;
            totalWeight += d.weight;
            count++;
        }
    });
    
    var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Average</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--accent);">' + average.toFixed(1) + '</span></div>' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Disciplines</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--text);">' + count + '/' + disciplines.length + '</span></div>' +
        '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Status</span><br><span style="font-size:1.8rem;font-weight:700;' + (average >= 70 ? 'color:var(--accent);' : 'color:var(--danger);') + '">' + (average >= 70 ? 'Passing' : 'Needs Work') + '</span></div>' +
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
        
        disciplines.forEach(function(d) {
            var score = grades[d.id];
            if (score !== undefined && score !== null && score !== '' && d.weight) {
                totalWeighted += parseFloat(score) * d.weight;
                totalWeight += d.weight;
                count++;
            }
        });
        
        var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        rankings.push({
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName || '',
            average: average,
            count: count,
            total: disciplines.length
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
    html += '<th>Disciplines</th>';
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
        html += '<td>' + r.count + '/' + r.total + '</td>';
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

// Make functions globally available
window.renderCurriculumView = renderCurriculumView;
window.renderDisciplines = renderDisciplines;
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
