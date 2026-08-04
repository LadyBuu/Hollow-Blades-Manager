/**
 * curriculum-main.js - Main Curriculum Module
 * Entry point for all curriculum features
 */

// Global state
var currentGradeWeek = 1;
var currentRankWeek = 1;
var selectedGradeStudentId = null;
var classViewState = { currentWeek: 1, filterDiscipline: 'all' };
var instructorCalendarState = { currentWeek: 1, selectedInstructorId: null };

/**
 * Render the full curriculum view
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
                <div id="tab-disciplines" class="tab-panel active">
                    <div id="disciplines-content"></div>
                </div>
                <div id="tab-class-view" class="tab-panel">
                    <div id="class-view-content"></div>
                </div>
                <div id="tab-instructor-calendar" class="tab-panel">
                    <div id="instructor-calendar-content"></div>
                </div>
                <div id="tab-schedule" class="tab-panel">
                    <div id="schedule-content"></div>
                </div>
                <div id="tab-grades" class="tab-panel">
                    <div id="grades-content"></div>
                </div>
                <div id="tab-ranking" class="tab-panel">
                    <div id="ranking-content"></div>
                </div>
            </div>
        </div>
    `;

    // Initialize tabs
    initCurriculumTabs();
    
    // Render each section
    if (typeof renderDisciplinesView === 'function') {
        renderDisciplinesView(document.getElementById('disciplines-content'));
    }
    if (typeof renderClassView === 'function') {
        renderClassView(document.getElementById('class-view-content'));
    }
    if (typeof renderInstructorCalendar === 'function') {
        renderInstructorCalendar(document.getElementById('instructor-calendar-content'));
    }
    if (typeof renderScheduleView === 'function') {
        renderScheduleView(document.getElementById('schedule-content'));
    }
    if (typeof renderGradesView === 'function') {
        renderGradesView(document.getElementById('grades-content'));
    }
    if (typeof renderRankingView === 'function') {
        renderRankingView(document.getElementById('ranking-content'));
    }
    
    // Initialize events
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
        if (panels.disciplines) {
            panels.disciplines.style.display = 'block';
            panels.disciplines.classList.add('active');
        }
    }

    // Add click handlers
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            
            var tabName = this.dataset.tab;
            
            for (var key in panels) {
                if (panels[key]) {
                    panels[key].style.display = 'none';
                    panels[key].classList.remove('active');
                }
            }
            
            if (panels[tabName]) {
                panels[tabName].style.display = 'block';
                panels[tabName].classList.add('active');
            }
            
            // Refresh content when switching tabs
            if (tabName === 'disciplines' && typeof renderDisciplinesView === 'function') {
                renderDisciplinesView(document.getElementById('disciplines-content'));
            } else if (tabName === 'class-view' && typeof renderClassView === 'function') {
                renderClassView(document.getElementById('class-view-content'));
            } else if (tabName === 'instructor-calendar' && typeof renderInstructorCalendar === 'function') {
                renderInstructorCalendar(document.getElementById('instructor-calendar-content'));
            } else if (tabName === 'schedule' && typeof renderScheduleView === 'function') {
                renderScheduleView(document.getElementById('schedule-content'));
            } else if (tabName === 'grades' && typeof renderGradesView === 'function') {
                renderGradesView(document.getElementById('grades-content'));
            } else if (tabName === 'ranking' && typeof renderRankingView === 'function') {
                renderRankingView(document.getElementById('ranking-content'));
            }
        });
    });
}

/**
 * Initialize curriculum events
 */
function initCurriculumEvents() {
    // Delegate to individual modules
    if (typeof initDisciplineEvents === 'function') initDisciplineEvents();
    if (typeof initClassViewEvents === 'function') initClassViewEvents();
    if (typeof initInstructorCalendarEvents === 'function') initInstructorCalendarEvents();
    if (typeof initGradesEvents === 'function') initGradesEvents();
    if (typeof initRankingEvents === 'function') initRankingEvents();
}

/**
 * Populate student selector dropdown - SHARED UTILITY
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

/**
 * Get instructor names for a discipline - SHARED UTILITY
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

// Make functions globally available
window.renderCurriculumView = renderCurriculumView;
window.initCurriculumTabs = initCurriculumTabs;
window.initCurriculumEvents = initCurriculumEvents;
window.populateStudentSelector = populateStudentSelector;
window.getInstructorNames = getInstructorNames;
window.currentGradeWeek = currentGradeWeek;
window.currentRankWeek = currentRankWeek;
window.selectedGradeStudentId = selectedGradeStudentId;
window.classViewState = classViewState;
window.instructorCalendarState = instructorCalendarState;
