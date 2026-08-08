/**
 * schedule.js - Schedule Compatibility Wrapper
 * Exports student schedule functions for use in curriculum-main.js
 * All actual logic is in student-schedule.js
 */

// Re-export student schedule functions
window.renderScheduleView = window.renderStudentScheduleView || function(container) {
    if (typeof renderStudentScheduleView === 'function') {
        renderStudentScheduleView(container);
    } else {
        container.innerHTML = '<p class="empty-state">Student schedule module not loaded.</p>';
    }
};

window.renderSchedule = window.renderStudentSchedule || function() {
    if (typeof renderStudentSchedule === 'function') {
        renderStudentSchedule();
    }
};

window.scheduleState = window.studentScheduleState || { currentWeek: 1, selectedStudentId: null };

// Re-export all student schedule functions for compatibility
window.getStudentSchedule = window.getStudentSchedule;
window.getClassInstructor = window.getClassInstructor;
window.setClassInstructor = window.setClassInstructor;
window.getClassLabel = window.getClassLabel;
window.setClassLabel = window.setClassLabel;
window.getClassGroupLabel = window.getClassGroupLabel;
window.setClassGroupLabel = window.setClassGroupLabel;
window.getClassDuration = window.getClassDuration;
window.setClassDuration = window.setClassDuration;
window.addClassToStudent = window.addClassToStudent;
window.joinStudentToSlot = window.joinStudentToSlot;
window.getAvailableSlotsForDiscipline = window.getAvailableSlotsForDiscipline;
window.getAvailableDisciplinesForStudent = window.getAvailableDisciplinesForStudent;
window.showAvailableTimeSlotsModal = window.showAvailableTimeSlotsModal;
window.showAddScheduleClassModal = window.showAddScheduleClassModal;
window.showScheduleClassDetails = window.showScheduleClassDetails;
window.removeScheduleClass = window.removeScheduleClass;
window.duplicateScheduleToWeek = window.duplicateScheduleToWeek;
window.clearSchedule = window.clearSchedule;
window.saveRestDays = window.saveRestDays;
