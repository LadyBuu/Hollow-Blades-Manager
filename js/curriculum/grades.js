/**
 * grades.js - Grade Management
 */

function renderGradesView(container) {
    container.innerHTML = `
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
    `;
    
    // Use the shared populateStudentSelector function
    if (typeof populateStudentSelector === 'function') {
        populateStudentSelector('grades-student');
    } else {
        // Fallback: define locally
        var select = document.getElementById('grades-student');
        if (select) {
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
    }
    
    initGradesEvents();
    renderGrades();
}

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

function initGradesEvents() {
    var studentSelect = document.getElementById('grades-student');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            selectedGradeStudentId = this.value;
            renderGrades();
        });
    }
    
    var prevBtn = document.getElementById('prev-grade-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentGradeWeek > 1) {
                currentGradeWeek--;
                renderGrades();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-grade-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (currentGradeWeek < 52) {
                currentGradeWeek++;
                renderGrades();
            }
        });
    }
    
    // Set initial student
    if (studentSelect && studentSelect.options.length > 1) {
        studentSelect.selectedIndex = 1;
        selectedGradeStudentId = studentSelect.value;
        renderGrades();
    }
}

// Make functions globally available
window.renderGradesView = renderGradesView;
window.renderGrades = renderGrades;
window.saveGrades = saveGrades;
window.getGradeLetter = getGradeLetter;
window.initGradesEvents = initGradesEvents;
