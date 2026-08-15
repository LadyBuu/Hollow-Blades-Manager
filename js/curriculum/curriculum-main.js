/**
 * curriculum-main.js - Main Curriculum Module
 * Entry point for all curriculum features
 * Loads all sub-modules: disciplines, auto-groups, class-view, instructor-calendar, student-schedule, grades, ranking
 */

// Global state
var currentGradeWeek = 1;
var currentRankWeek = 1;
var selectedGradeStudentId = null;
var classViewState = { currentWeek: 1, filterDiscipline: 'all' };
var instructorCalendarState = { currentWeek: 1, selectedInstructorId: null, expandedGroups: {} };

// Student schedule state
if (typeof studentScheduleState === 'undefined') {
    var studentScheduleState = { currentWeek: 1, selectedStudentId: null };
}

/**
 * Render the full curriculum view
 */
function renderCurriculumView(container) {
    container.innerHTML = `
        <div class="tab-container">
            <div class="tab-nav">
                <button class="tab-btn active" data-tab="disciplines">Disciplines</button>
                <button class="tab-btn" data-tab="groups">▣ Auto-Groups</button>
                <button class="tab-btn" data-tab="class-view">▤ Class View</button>
                <button class="tab-btn" data-tab="instructor-calendar">◷ Instructor Calendar</button>
                <button class="tab-btn" data-tab="schedule">◷ Schedule</button>
                <button class="tab-btn" data-tab="grades">Grades</button>
                <button class="tab-btn" data-tab="ranking">Ranking</button>
            </div>
            <div class="tab-content">
                <div id="tab-disciplines" class="tab-panel active">
                    <div id="disciplines-content"></div>
                </div>
                <div id="tab-groups" class="tab-panel">
                    <div id="groups-content"></div>
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
    renderAllCurriculumSections();
    
    // Initialize events
    initCurriculumEvents();
}

/**
 * Render all curriculum sections
 */
function renderAllCurriculumSections() {
    // Disciplines
    var disciplinesContent = document.getElementById('disciplines-content');
    if (disciplinesContent) {
        if (typeof renderDisciplinesView === 'function') {
            renderDisciplinesView(disciplinesContent);
        } else {
            disciplinesContent.innerHTML = '<p class="empty-state">Disciplines module not loaded.</p>';
        }
    }
    
    // Auto-Groups
    var groupsContent = document.getElementById('groups-content');
    if (groupsContent) {
        if (typeof renderAutoGroupsView === 'function') {
            renderAutoGroupsView(groupsContent);
        } else {
            groupsContent.innerHTML = '<p class="empty-state">Auto-Groups module not loaded.</p>';
        }
    }
    
    // Class View
    var classViewContent = document.getElementById('class-view-content');
    if (classViewContent) {
        if (typeof renderClassView === 'function') {
            renderClassView(classViewContent);
        } else {
            classViewContent.innerHTML = '<p class="empty-state">Class View module not loaded.</p>';
        }
    }
    
    // Instructor Calendar
    var instructorCalendarContent = document.getElementById('instructor-calendar-content');
    if (instructorCalendarContent) {
        if (typeof renderInstructorCalendar === 'function') {
            renderInstructorCalendar(instructorCalendarContent);
        } else {
            instructorCalendarContent.innerHTML = '<p class="empty-state">Instructor Calendar module not loaded. Check that instructor-calendar.js is included.</p>';
        }
    }
    
    // Student Schedule
    var scheduleContent = document.getElementById('schedule-content');
    if (scheduleContent) {
        if (typeof renderStudentScheduleView === 'function') {
            renderStudentScheduleView(scheduleContent);
        } else if (typeof renderScheduleView === 'function') {
            renderScheduleView(scheduleContent);
        } else {
            scheduleContent.innerHTML = '<p class="empty-state">Schedule module not loaded. Check that student-schedule.js is included.</p>';
        }
    }
    
    // Grades
    var gradesContent = document.getElementById('grades-content');
    if (gradesContent) {
        if (typeof renderGradesView === 'function') {
            renderGradesView(gradesContent);
        } else {
            gradesContent.innerHTML = '<p class="empty-state">Grades module not loaded.</p>';
        }
    }
    
    // Ranking
    var rankingContent = document.getElementById('ranking-content');
    if (rankingContent) {
        if (typeof renderRankingView === 'function') {
            renderRankingView(rankingContent);
        } else {
            rankingContent.innerHTML = '<p class="empty-state">Ranking module not loaded.</p>';
        }
    }
}

/**
 * Initialize curriculum tabs
 */
function initCurriculumTabs() {
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = {
        disciplines: document.getElementById('tab-disciplines'),
        groups: document.getElementById('tab-groups'),
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
            refreshTabContent(tabName);
        });
    });
}

/**
 * Refresh tab content
 */
function refreshTabContent(tabName) {
    if (tabName === 'disciplines') {
        var content = document.getElementById('disciplines-content');
        if (content && typeof renderDisciplinesView === 'function') {
            renderDisciplinesView(content);
        }
    } else if (tabName === 'groups') {
        var content = document.getElementById('groups-content');
        if (content && typeof renderAutoGroupsView === 'function') {
            renderAutoGroupsView(content);
        }
    } else if (tabName === 'class-view') {
        var content = document.getElementById('class-view-content');
        if (content && typeof renderClassView === 'function') {
            renderClassView(content);
        }
    } else if (tabName === 'instructor-calendar') {
        var content = document.getElementById('instructor-calendar-content');
        if (content && typeof renderInstructorCalendar === 'function') {
            renderInstructorCalendar(content);
        } else {
            content.innerHTML = '<p class="empty-state">Instructor Calendar module not loaded. Check that instructor-calendar.js is included.</p>';
        }
    } else if (tabName === 'schedule') {
        var content = document.getElementById('schedule-content');
        if (content && typeof renderStudentScheduleView === 'function') {
            renderStudentScheduleView(content);
        } else if (content && typeof renderScheduleView === 'function') {
            renderScheduleView(content);
        } else {
            content.innerHTML = '<p class="empty-state">Schedule module not loaded. Check that student-schedule.js is included.</p>';
        }
    } else if (tabName === 'grades') {
        var content = document.getElementById('grades-content');
        if (content && typeof renderGradesView === 'function') {
            renderGradesView(content);
        }
    } else if (tabName === 'ranking') {
        var content = document.getElementById('ranking-content');
        if (content && typeof renderRankingView === 'function') {
            renderRankingView(content);
        }
    }
}

/**
 * Initialize curriculum events - calls init functions from all sub-modules
 */
function initCurriculumEvents() {
    // Disciplines
    if (typeof initDisciplineEvents === 'function') {
        initDisciplineEvents();
    }
    
    // Auto-Groups
    if (typeof initAutoGroupsEvents === 'function') {
        initAutoGroupsEvents();
    }
    
    // Class View
    if (typeof initClassViewEvents === 'function') {
        initClassViewEvents();
    }
    
    // Instructor Calendar
    if (typeof initInstructorCalendarEvents === 'function') {
        initInstructorCalendarEvents();
    }
    
    // Student Schedule - use the student-schedule init
    if (typeof initStudentScheduleEvents === 'function') {
        initStudentScheduleEvents();
    }
    
    // Grades
    if (typeof initGradesEvents === 'function') {
        initGradesEvents();
    }
    
    // Ranking
    if (typeof initRankingEvents === 'function') {
        initRankingEvents();
    }
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

/**
 * Get all instructor templates for a week - SHARED UTILITY
 */
function getAllInstructorTemplatesForWeek(week) {
    var results = {};
    var weekNum = parseInt(week) || 1;
    if (data.curriculum.instructorTemplates) {
        for (var templateKey in data.curriculum.instructorTemplates) {
            var parts = templateKey.split('_');
            var instructorId = parts[0];
            var templateWeek = parseInt(parts[1]);
            if (templateWeek === weekNum) {
                results[instructorId] = data.curriculum.instructorTemplates[templateKey];
            }
        }
    }
    return results;
}

/**
 * Get instructor templates for a specific instructor and week - SHARED UTILITY
 */
function getInstructorTemplatesForWeek(instructorId, week) {
    var templateKey = instructorId + '_' + week;
    if (data.curriculum.instructorTemplates && data.curriculum.instructorTemplates[templateKey]) {
        return data.curriculum.instructorTemplates[templateKey];
    }
    return {};
}

// Make functions globally available
window.renderCurriculumView = renderCurriculumView;
window.renderAllCurriculumSections = renderAllCurriculumSections;
window.initCurriculumTabs = initCurriculumTabs;
window.initCurriculumEvents = initCurriculumEvents;
window.refreshTabContent = refreshTabContent;
window.populateStudentSelector = populateStudentSelector;
window.getInstructorNames = getInstructorNames;
window.getAllInstructorTemplatesForWeek = getAllInstructorTemplatesForWeek;
window.getInstructorTemplatesForWeek = getInstructorTemplatesForWeek;
window.currentGradeWeek = currentGradeWeek;
window.currentRankWeek = currentRankWeek;
window.selectedGradeStudentId = selectedGradeStudentId;
window.classViewState = classViewState;
window.instructorCalendarState = instructorCalendarState;
window.studentScheduleState = studentScheduleState;
