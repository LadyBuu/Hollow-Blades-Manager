/**
 * student-schedule.js - Student Schedule Calendar
 * Handles individual student schedules with auto-group sync
 */

// Student schedule state
var studentScheduleState = {
    currentWeek: 1,
    selectedStudentId: null
};

/**
 * Initialize the student schedule system
 */
function initStudentScheduleSystem() {
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
}

/**
 * Get a student's schedule for a specific week
 */
function getStudentSchedule(studentId, week) {
    initStudentScheduleSystem();
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
 * Get instructor templates for a specific week
 */
function getInstructorTemplatesForWeek(instructorId, week) {
    var templateKey = instructorId + '_' + week;
    if (data.curriculum.instructorTemplates && data.curriculum.instructorTemplates[templateKey]) {
        return data.curriculum.instructorTemplates[templateKey];
    }
    return {};
}

/**
 * Get all instructor templates for a week across all instructors
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
 * Get all available slots for a discipline from instructor templates
 */
function getAvailableSlotsForDiscipline(disciplineId, week, studentId) {
    var weekNum = parseInt(week) || 1;
    var slots = [];
    var existingSlots = {};
    var discipline = getDiscipline(disciplineId);
    var maxStudents = discipline ? discipline.maxStudents : 10;
    var students = getStudents();
    
    // Get all instructor templates for this week
    var templates = getAllInstructorTemplatesForWeek(weekNum);
    
    for (var instructorId in templates) {
        var template = templates[instructorId];
        for (var slotKey in template) {
            var slotData = template[slotKey];
            // Check if this slot is for the requested discipline
            if (String(slotData.disciplineId) === String(disciplineId)) {
                var slotParts = slotKey.split('_');
                var day = parseInt(slotParts[0]);
                var hour = parseInt(slotParts[1]);
                var key = day + '_' + hour;
                
                // Count assigned students
                var currentCount = 0;
                var assignedStudents = slotData.assignedStudents || [];
                if (assignedStudents.length > 0) {
                    currentCount = assignedStudents.length;
                } else {
                    students.forEach(function(s) {
                        var schedule = getStudentSchedule(s.id, weekNum);
                        if (schedule[day] && schedule[day][hour] && String(schedule[day][hour]) === String(disciplineId)) {
                            currentCount++;
                        }
                    });
                }
                
                var isFull = currentCount >= maxStudents;
                var studentAssigned = false;
                var hasConflict = false;
                var duration = slotData.duration || 1;
                
                if (studentId) {
                    var schedule = getStudentSchedule(studentId, weekNum);
                    for (var h = hour; h < hour + duration && h <= 23; h++) {
                        if (schedule[day] && schedule[day][h]) {
                            hasConflict = true;
                            break;
                        }
                    }
                    if (schedule[day] && schedule[day][hour] && String(schedule[day][hour]) === String(disciplineId)) {
                        studentAssigned = true;
                    }
                }
                
                // Check if instructor has a block at this time
                var isBlocked = false;
                if (data.curriculum.instructorBlocks) {
                    var blockKey = instructorId + '_' + weekNum;
                    if (data.curriculum.instructorBlocks[blockKey]) {
                        if (data.curriculum.instructorBlocks[blockKey][day] && 
                            data.curriculum.instructorBlocks[blockKey][day][hour]) {
                            isBlocked = true;
                        }
                    }
                }
                
                var instructor = data.characters.find(function(c) { return String(c.id) === String(instructorId); });
                var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                
                if (!existingSlots[key]) {
                    existingSlots[key] = {
                        day: day,
                        hour: hour,
                        duration: duration,
                        instructorId: instructorId,
                        instructorName: instructorName,
                        label: slotData.label || '',
                        groupLabel: slotData.groupLabel || '',
                        assignedStudents: assignedStudents,
                        currentCount: currentCount,
                        maxStudents: maxStudents,
                        isFull: isFull,
                        studentAssigned: studentAssigned,
                        hasConflict: hasConflict,
                        isBlocked: isBlocked,
                        isTemplate: true,
                        slotKey: slotKey
                    };
                }
            }
        }
    }
    
    var slotArray = Object.values(existingSlots);
    slotArray.sort(function(a, b) {
        if (a.day !== b.day) return a.day - b.day;
        return a.hour - b.hour;
    });
    
    return slotArray;
}

/**
 * Add a class to a student's schedule
 */
function addClassToStudent(studentId, disciplineId, week, day, hour, duration, instructorId) {
    var schedule = getStudentSchedule(studentId, week);
    var dur = duration || 1;
    
    // Check for conflicts
    for (var h = hour; h < hour + dur && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            var conflictId = schedule[day][h];
            var conflictDisc = getDiscipline(conflictId);
            return {
                success: false,
                message: 'Student has a conflict at ' + h + ':00' + (conflictDisc ? ' (' + conflictDisc.name + ')' : '')
            };
        }
    }
    
    // Add the class
    for (var h = hour; h < hour + dur && h <= 23; h++) {
        if (!schedule[day]) schedule[day] = {};
        schedule[day][h] = disciplineId;
        if (instructorId) {
            setClassInstructor(studentId, week, day, h, instructorId);
        }
        if (h === hour) {
            setClassDuration(studentId, week, day, h, dur);
        }
        setClassGroupLabel(studentId, week, day, h, 'auto-group');
    }
    
    return { success: true, message: 'Class added successfully.' };
}

/**
 * Join a student to a slot (with group sync)
 */
function joinStudentToSlot(studentId, disciplineId, weekNum, day, hour, duration, instructorId, modal) {
    // Check if the student already has a class at this time
    var schedule = getStudentSchedule(studentId, weekNum);
    var hasConflict = false;
    for (var h = hour; h < hour + duration && h <= 23; h++) {
        if (schedule[day] && schedule[day][h]) {
            hasConflict = true;
            break;
        }
    }
    
    if (hasConflict) {
        alert('Student already has a class at this time.');
        return;
    }
    
    // First, get or create the group for this student
    var group = null;
    if (typeof getOrCreateGroupForStudent === 'function') {
        group = getOrCreateGroupForStudent(disciplineId, studentId, weekNum, day, hour, instructorId);
    }
    
    if (!group) {
        // Fallback: just add the student
        var result = addClassToStudent(studentId, disciplineId, weekNum, day, hour, duration, instructorId);
        if (result.success) {
            if (modal) modal.remove();
            saveData().then(function() {
                renderStudentSchedule();
                if (typeof renderAutoGroups === 'function') renderAutoGroups();
                alert('✅ Added ' + getDiscipline(disciplineId).name + '!');
            });
        } else {
            alert('❌ ' + result.message);
        }
        return;
    }
    
    // Add the class to ALL students in the group
    var addedCount = 0;
    var conflictStudents = [];
    
    group.students.forEach(function(otherStudentId) {
        if (String(otherStudentId) === String(studentId)) return;
        
        var otherSchedule = getStudentSchedule(otherStudentId, weekNum);
        var hasConflict = false;
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            if (otherSchedule[day] && otherSchedule[day][h]) {
                hasConflict = true;
                break;
            }
        }
        
        if (hasConflict) {
            var student = data.characters.find(function(c) { return String(c.id) === String(otherStudentId); });
            var name = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
            conflictStudents.push(name);
        } else {
            var addResult = addClassToStudent(otherStudentId, disciplineId, weekNum, day, hour, duration, instructorId);
            if (addResult.success) {
                addedCount++;
            }
        }
    });
    
    if (modal) {
        modal.remove();
    }
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Added ' + getDiscipline(disciplineId).name + ' to ' + addedCount + ' students in group ' + group.displayName);
        }
        renderStudentSchedule();
        if (typeof renderAutoGroups === 'function') {
            renderAutoGroups();
        }
        
        var msg = '✅ Added ' + getDiscipline(disciplineId).name + ' to ' + (addedCount + 1) + ' student(s)!';
        msg += '\nGroup: ' + group.displayName;
        
        if (conflictStudents.length > 0) {
            msg += '\n\n⚠ Could not add to these students (conflicts):\n' + conflictStudents.join('\n');
        }
        alert(msg);
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderStudentSchedule();
        alert('Class added but failed to save data.');
    });
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
 * Get available disciplines for a student in a week with instructor info
 */
function getAvailableDisciplinesForStudent(studentId, week) {
    var allDisciplines = getAvailableDisciplines(week);
    var used = getStudentDisciplineHours(studentId, week);
    var available = [];
    var weekNum = parseInt(week) || 1;
    
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
            
            // Check if this discipline has any slots in instructor templates for this week
            var hasSlots = false;
            var slotCount = 0;
            var templates = getAllInstructorTemplatesForWeek(weekNum);
            for (var instructorId in templates) {
                var template = templates[instructorId];
                for (var slotKey in template) {
                    var slotData = template[slotKey];
                    if (String(slotData.disciplineId) === String(d.id)) {
                        hasSlots = true;
                        slotCount++;
                    }
                }
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
                groupInfo: groupInfo,
                hasSlots: hasSlots,
                slotCount: slotCount
            });
        }
    });
    return available;
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
 * Show available time slots modal for a discipline
 */
function showAvailableTimeSlotsModal(disciplineId, studentId, week) {
    var discipline = getDiscipline(disciplineId);
    if (!discipline) {
        alert('Discipline not found.');
        return;
    }
    
    var weekNum = parseInt(week) || studentScheduleState.currentWeek || 1;
    var slots = getAvailableSlotsForDiscipline(disciplineId, weekNum, studentId);
    
    // Filter slots
    var availableSlots = slots.filter(function(s) {
        return !s.isBlocked && !s.isFull && !s.studentAssigned && !s.hasConflict;
    });
    
    var assignedSlots = slots.filter(function(s) {
        return s.studentAssigned;
    });
    
    var conflictSlots = slots.filter(function(s) {
        return !s.isBlocked && s.hasConflict && !s.studentAssigned;
    });
    
    var fullSlots = slots.filter(function(s) {
        return !s.isBlocked && s.isFull && !s.studentAssigned;
    });
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h3>${discipline.name} - Available Time Slots</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom:12px;">
                    <span style="color:var(--text-dim);font-size:0.85rem;">Week ${weekNum}</span>
                    ${typeof getStudentAutoGroup === 'function' && getStudentAutoGroup(studentId, disciplineId) ? 
                        '<span style="margin-left:12px;color:var(--accent);font-size:0.8rem;">Group: ' + getStudentAutoGroup(studentId, disciplineId).displayName + '</span>' : 
                        '<span style="margin-left:12px;color:var(--warning);font-size:0.8rem;">Not in any group</span>'}
                    <span style="margin-left:12px;font-size:0.7rem;color:var(--text-dim);">Instructors: ${getInstructorNames(discipline).join(', ') || 'None'}</span>
                </div>
                
                <div style="margin-bottom:12px;padding:8px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">
                    <p style="font-size:0.75rem;color:var(--text-dim);">
                        💡 Click "Join" on any available slot. The system will:
                        <br>• Add the student to the class
                        <br>• Add ALL students in the group to the same slot
                        <br>• Handle conflicts automatically
                    </p>
                </div>
                
                ${availableSlots.length === 0 && assignedSlots.length === 0 && conflictSlots.length === 0 && fullSlots.length === 0 ? 
                    '<p class="empty-state">No time slots available for this discipline in week ' + weekNum + '</p>' : ''}
                
                ${availableSlots.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <h4 style="color:var(--accent);font-size:0.85rem;">✓ Available Slots (${availableSlots.length})</h4>
                    ${availableSlots.map(function(slot) {
                        var hourDisplay = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                        var ampm = slot.hour >= 12 ? 'PM' : 'AM';
                        if (slot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                        if (slot.hour === 12) { ampm = 'PM'; }
                        var durationDisplay = slot.duration > 1 ? ' (' + slot.duration + 'h)' : '';
                        var labelDisplay = slot.label ? ' [' + slot.label + ']' : '';
                        var groupDisplay = slot.groupLabel ? ' (G' + slot.groupLabel + ')' : '';
                        var capacityDisplay = slot.currentCount + '/' + slot.maxStudents + ' students';
                        
                        return '<div class="available-slot" style="background:var(--panel-alt);border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
                            '<div><strong>' + dayNames[slot.day] + ' ' + hourDisplay + ':00 ' + ampm + '</strong>' + durationDisplay + labelDisplay + groupDisplay + 
                            '<br><span style="font-size:0.7rem;color:var(--text-dim);">Instructor: ' + slot.instructorName + ' | ' + capacityDisplay + '</span></div>' +
                            '<button class="join-slot-btn primary small" data-day="' + slot.day + '" data-hour="' + slot.hour + '" data-duration="' + slot.duration + '" data-instructor="' + slot.instructorId + '">Join</button>' +
                        '</div>';
                    }).join('')}
                </div>
                ` : ''}
                
                ${assignedSlots.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <h4 style="color:var(--info);font-size:0.85rem;">✓ Already Assigned (${assignedSlots.length})</h4>
                    ${assignedSlots.map(function(slot) {
                        var hourDisplay = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                        var ampm = slot.hour >= 12 ? 'PM' : 'AM';
                        if (slot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                        if (slot.hour === 12) { ampm = 'PM'; }
                        var durationDisplay = slot.duration > 1 ? ' (' + slot.duration + 'h)' : '';
                        var labelDisplay = slot.label ? ' [' + slot.label + ']' : '';
                        var groupDisplay = slot.groupLabel ? ' (G' + slot.groupLabel + ')' : '';
                        
                        return '<div style="background:var(--info-soft);border:1px solid var(--info);border-radius:6px;padding:8px 12px;margin-bottom:6px;color:var(--text-dim);">' +
                            dayNames[slot.day] + ' ' + hourDisplay + ':00 ' + ampm + durationDisplay + labelDisplay + groupDisplay +
                            ' <span style="color:var(--info);font-size:0.7rem;">(already assigned)</span>' +
                        '</div>';
                    }).join('')}
                </div>
                ` : ''}
                
                ${conflictSlots.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <h4 style="color:var(--danger);font-size:0.85rem;">⚠ Conflicts (${conflictSlots.length})</h4>
                    ${conflictSlots.map(function(slot) {
                        var hourDisplay = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                        var ampm = slot.hour >= 12 ? 'PM' : 'AM';
                        if (slot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                        if (slot.hour === 12) { ampm = 'PM'; }
                        var durationDisplay = slot.duration > 1 ? ' (' + slot.duration + 'h)' : '';
                        var labelDisplay = slot.label ? ' [' + slot.label + ']' : '';
                        var groupDisplay = slot.groupLabel ? ' (G' + slot.groupLabel + ')' : '';
                        
                        return '<div style="background:var(--danger-soft);border:1px solid var(--danger);border-radius:6px;padding:8px 12px;margin-bottom:6px;">' +
                            '<strong>' + dayNames[slot.day] + ' ' + hourDisplay + ':00 ' + ampm + '</strong>' + durationDisplay + labelDisplay + groupDisplay +
                            '<br><span style="font-size:0.7rem;color:var(--text-dim);">Instructor: ' + slot.instructorName + '</span>' +
                            ' <span style="color:var(--danger);font-size:0.7rem;">(conflict)</span>' +
                            '<br><button class="resolve-conflict-btn small warning-btn" data-day="' + slot.day + '" data-hour="' + slot.hour + '" data-duration="' + slot.duration + '" data-instructor="' + slot.instructorId + '">Resolve & Join</button>' +
                        '</div>';
                    }).join('')}
                </div>
                ` : ''}
                
                ${fullSlots.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <h4 style="color:var(--warning);font-size:0.85rem;">⚠ Full Slots (${fullSlots.length})</h4>
                    ${fullSlots.map(function(slot) {
                        var hourDisplay = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                        var ampm = slot.hour >= 12 ? 'PM' : 'AM';
                        if (slot.hour === 0) { hourDisplay = 12; ampm = 'AM'; }
                        if (slot.hour === 12) { ampm = 'PM'; }
                        var durationDisplay = slot.duration > 1 ? ' (' + slot.duration + 'h)' : '';
                        var labelDisplay = slot.label ? ' [' + slot.label + ']' : '';
                        var groupDisplay = slot.groupLabel ? ' (G' + slot.groupLabel + ')' : '';
                        
                        return '<div style="background:var(--warning-soft);border:1px solid var(--warning);border-radius:6px;padding:8px 12px;margin-bottom:6px;color:var(--text-dim);">' +
                            dayNames[slot.day] + ' ' + hourDisplay + ':00 ' + ampm + durationDisplay + labelDisplay + groupDisplay +
                            ' <span style="color:var(--warning);font-size:0.7rem;">(FULL - ' + slot.currentCount + '/' + slot.maxStudents + ')</span>' +
                            '<br><span style="font-size:0.7rem;color:var(--text-dim);">Instructor: ' + slot.instructorName + '</span>' +
                        '</div>';
                    }).join('')}
                </div>
                ` : ''}
                
                <div class="form-actions" style="margin-top:12px;">
                    <button type="button" id="close-slots-modal" class="secondary">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#close-slots-modal').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Join slot buttons
    modal.querySelectorAll('.join-slot-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var day = parseInt(this.dataset.day);
            var hour = parseInt(this.dataset.hour);
            var duration = parseInt(this.dataset.duration) || 1;
            var instructorId = this.dataset.instructor || null;
            
            // Close the modal
            modal.remove();
            
            // Call joinStudentToSlot
            joinStudentToSlot(studentId, disciplineId, weekNum, day, hour, duration, instructorId, null);
        });
    });
    
    // Resolve conflict buttons
    modal.querySelectorAll('.resolve-conflict-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var day = parseInt(this.dataset.day);
            var hour = parseInt(this.dataset.hour);
            var duration = parseInt(this.dataset.duration) || 1;
            var instructorId = this.dataset.instructor || null;
            
            // Check what the conflict is
            var schedule = getStudentSchedule(studentId, weekNum);
            var conflictInfo = [];
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    var conflictId = schedule[day][h];
                    var conflictDisc = getDiscipline(conflictId);
                    conflictInfo.push({
                        hour: h,
                        discipline: conflictDisc ? conflictDisc.name : 'Unknown'
                    });
                }
            }
            
            var conflictMsg = 'This student has conflicts at:\n';
            conflictInfo.forEach(function(c) {
                conflictMsg += '  • ' + c.hour + ':00 - ' + c.discipline + '\n';
            });
            conflictMsg += '\nDo you want to remove the conflicting classes and join this slot?';
            
            if (!confirm(conflictMsg)) {
                return;
            }
            
            // Remove conflicting classes
            for (var h = hour; h < hour + duration && h <= 23; h++) {
                if (schedule[day] && schedule[day][h]) {
                    delete schedule[day][h];
                    setClassInstructor(studentId, weekNum, day, h, null);
                    setClassLabel(studentId, weekNum, day, h, null);
                    setClassGroupLabel(studentId, weekNum, day, h, null);
                    setClassDuration(studentId, weekNum, day, h, null);
                }
            }
            
            // Close the modal and join
            modal.remove();
            joinStudentToSlot(studentId, disciplineId, weekNum, day, hour, duration, instructorId, null);
        });
    });
}

/**
 * Show add class modal (with duration and instructor selection)
 */
function showAddScheduleClassModal(studentId, week, day, hour) {
    var available = getAvailableDisciplinesForStudent(studentId, week);
    
    // Filter to disciplines that have slots
    var hasSlots = available.filter(function(item) { return item.hasSlots; });
    
    if (available.length === 0) {
        alert('All disciplines are full for this week.');
        return;
    }
    
    if (hasSlots.length === 0) {
        alert('No disciplines have available time slots this week. Check instructor schedules first.');
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
                        ${hasSlots.map(function(item) {
                            var d = item.discipline;
                            var instructorDisplay = item.instructorNames.length > 0 ? 
                                item.instructorNames.join(', ') : 'No instructors assigned';
                            var groupInfo = item.groupInfo || '';
                            var slotsInfo = ' (' + item.slotCount + ' slots available)';
                            return '<option value="' + d.id + '" data-instructors="' + d.instructorIds.join(',') + '">' + 
                                d.name + ' (' + instructorDisplay + ')' + groupInfo + slotsInfo +
                            '</option>';
                        }).join('')}
                    </select>
                </div>
                
                <div class="form-group" id="instructor-select-group" style="display:none;">
                    <label>Select Instructor:</label>
                    <select id="add-class-instructor" style="width:100%;padding:8px;">
                        <option value="">Select instructor...</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Duration (hours):</label>
                    <select id="add-class-duration" style="width:100%;padding:8px;">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                    </select>
                </div>
                
                <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border-soft);">
                    <p style="font-size:0.75rem;color:var(--text-dim);">
                        💡 <strong>Auto-Group:</strong> When you add a student to a class, ALL students in their group will be added to the same slot.
                        <br>If the student is not in a group yet, a new group will be created.
                    </p>
                </div>
                
                <div class="form-actions" style="margin-top:16px;">
                    <button type="button" id="view-all-slots-btn" class="info-btn small">📋 View All Slots</button>
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate instructor dropdown based on selected discipline
    var disciplineSelect = document.getElementById('add-class-select');
    var instructorGroup = document.getElementById('instructor-select-group');
    var instructorSelect = document.getElementById('add-class-instructor');
    
    function updateInstructors() {
        var selectedOption = disciplineSelect.options[disciplineSelect.selectedIndex];
        var instructorIds = selectedOption ? selectedOption.dataset.instructors : '';
        
        if (instructorIds) {
            var ids = instructorIds.split(',');
            if (ids.length > 1) {
                instructorGroup.style.display = 'block';
                instructorSelect.innerHTML = '<option value="">Select instructor...</option>';
                ids.forEach(function(id) {
                    if (!id) return;
                    var instructor = data.characters.find(function(c) { return String(c.id) === String(id); });
                    if (instructor) {
                        var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                        var option = document.createElement('option');
                        option.value = id;
                        option.textContent = name;
                        instructorSelect.appendChild(option);
                    }
                });
                return;
            }
        }
        instructorGroup.style.display = 'none';
    }
    
    disciplineSelect.addEventListener('change', updateInstructors);
    setTimeout(updateInstructors, 100);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // View all slots button
    modal.querySelector('#view-all-slots-btn').onclick = function() {
        var disciplineId = document.getElementById('add-class-select').value;
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        modal.remove();
        showAvailableTimeSlotsModal(disciplineId, studentId, week);
    };
    
    modal.querySelector('#confirm-add-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-select').value;
        if (!disciplineId) {
            alert('Please select a discipline.');
            return;
        }
        
        // Get selected instructor
        var instructorId = document.getElementById('add-class-instructor').value;
        if (!instructorId) {
            // If only one instructor, use it
            var selectedOption = disciplineSelect.options[disciplineSelect.selectedIndex];
            var instructorIds = selectedOption ? selectedOption.dataset.instructors : '';
            if (instructorIds) {
                var ids = instructorIds.split(',');
                if (ids.length === 1 && ids[0]) {
                    instructorId = ids[0];
                } else {
                    alert('Please select an instructor for this class.');
                    return;
                }
            } else {
                alert('No instructor available for this discipline.');
                return;
            }
        }
        
        var duration = parseInt(document.getElementById('add-class-duration').value) || 1;
        var weekNum = parseInt(week) || 1;
        
        // Check if student already has a class at this time
        var schedule = getStudentSchedule(studentId, weekNum);
        var hasConflict = false;
        for (var h = hour; h < hour + duration && h <= 23; h++) {
            if (schedule[day] && schedule[day][h]) {
                hasConflict = true;
                break;
            }
        }
        
        if (hasConflict) {
            alert('Student already has a class at this time.');
            return;
        }
        
        // Check if instructor has a template at this time
        var templates = getInstructorTemplatesForWeek(instructorId, weekNum);
        var slotKey = day + '_' + hour;
        if (!templates[slotKey]) {
            alert('This instructor does not have a class scheduled at this time. Please check the instructor calendar first.');
            return;
        }
        
        var template = templates[slotKey];
        
        // Check if the template has the right discipline
        if (String(template.disciplineId) !== String(disciplineId)) {
            alert('The instructor has a different discipline scheduled at this time.');
            return;
        }
        
        // Add the class to the student
        var result = addClassToStudent(studentId, disciplineId, weekNum, day, hour, duration, instructorId);
        
        if (result.success) {
            var addedCount = 0;
            var conflictStudents = [];
            var group = null;
            
            // Create or update the group for this student
            if (typeof getOrCreateGroupForStudent === 'function') {
                group = getOrCreateGroupForStudent(disciplineId, studentId, weekNum, day, hour, instructorId);
                
                // Also add the class to all other students in the group
                if (group && group.students) {
                    group.students.forEach(function(otherStudentId) {
                        if (String(otherStudentId) === String(studentId)) return;
                        
                        var otherSchedule = getStudentSchedule(otherStudentId, weekNum);
                        var hasConflict = false;
                        for (var h = hour; h < hour + duration && h <= 23; h++) {
                            if (otherSchedule[day] && otherSchedule[day][h]) {
                                hasConflict = true;
                                break;
                            }
                        }
                        
                        if (hasConflict) {
                            var student = data.characters.find(function(c) { return String(c.id) === String(otherStudentId); });
                            var name = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                            conflictStudents.push(name);
                        } else {
                            var addResult = addClassToStudent(otherStudentId, disciplineId, weekNum, day, hour, duration, instructorId);
                            if (addResult.success) {
                                addedCount++;
                            }
                        }
                    });
                }
            }
            
            modal.remove();
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Added ' + getDiscipline(disciplineId).name + ' to schedule (auto-group)');
                }
                renderStudentSchedule();
                if (typeof renderAutoGroups === 'function') {
                    renderAutoGroups();
                }
                var msg = '✅ Added ' + getDiscipline(disciplineId).name + '!';
                if (group) {
                    msg += '\nGroup: ' + group.displayName;
                }
                msg += '\nAdded to ' + (addedCount + 1) + ' student(s) in the group.';
                if (conflictStudents.length > 0) {
                    msg += '\n\n⚠ Could not add to these students (conflicts):\n' + conflictStudents.join('\n');
                }
                alert(msg);
            }).catch(function(err) {
                console.error('Failed to save:', err);
                renderStudentSchedule();
                alert('Class added but failed to save data.');
            });
        } else {
            alert('❌ ' + result.message);
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
                    <button type="button" id="view-slots-from-detail" class="info-btn small">🔍 View Other Slots</button>
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
            if (instructorId && typeof getOrCreateGroupForStudent === 'function') {
                var group = getStudentAutoGroup(studentId, disciplineId);
                if (group && group.students && group.students.indexOf(studentId) !== -1) {
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
    
    modal.querySelector('#view-slots-from-detail').onclick = function() {
        modal.remove();
        showAvailableTimeSlotsModal(disciplineId, studentId, week);
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
    renderStudentSchedule();
    if (typeof logActivity === 'function') {
        logActivity('Removed class from schedule');
    }
}

/**
 * Render the student schedule view
 */
function renderStudentScheduleView(container) {
    initStudentScheduleSystem();
    
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

    populateStudentSelector();
    initStudentScheduleEvents();
    renderStudentSchedule();
}

/**
 * Populate student selector
 */
function populateStudentSelector() {
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
 * Initialize student schedule events
 */
function initStudentScheduleEvents() {
    var studentSelect = document.getElementById('schedule-student');
    if (studentSelect) {
        studentSelect.addEventListener('change', function() {
            studentScheduleState.selectedStudentId = this.value;
            renderStudentSchedule();
        });
    }
    
    var prevBtn = document.getElementById('prev-schedule-week');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (studentScheduleState.currentWeek > 1) {
                studentScheduleState.currentWeek--;
                renderStudentSchedule();
            }
        });
    }
    
    var nextBtn = document.getElementById('next-schedule-week');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (studentScheduleState.currentWeek < 52) {
                studentScheduleState.currentWeek++;
                renderStudentSchedule();
            }
        });
    }
    
    var gotoBtn = document.getElementById('goto-schedule-week');
    if (gotoBtn) {
        gotoBtn.addEventListener('click', function() {
            var week = prompt('Enter week number (1-52):', studentScheduleState.currentWeek);
            if (week) {
                var w = parseInt(week);
                if (!isNaN(w) && w >= 1 && w <= 52) {
                    studentScheduleState.currentWeek = w;
                    renderStudentSchedule();
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
        studentScheduleState.selectedStudentId = studentSelect.value;
        renderStudentSchedule();
    }
}

/**
 * Show duplicate modal
 */
function showDuplicateModal() {
    if (!studentScheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var currentWeek = studentScheduleState.currentWeek;
    
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
    if (!studentScheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var studentId = studentScheduleState.selectedStudentId;
    
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
        studentScheduleState.currentWeek = targetWeek;
        renderStudentSchedule();
        alert('Schedule duplicated from week ' + sourceWeek + ' to week ' + targetWeek + ' (' + copiedCount + ' classes copied)');
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to duplicate schedule.');
    });
}

/**
 * Render the student schedule grid
 */
function renderStudentSchedule() {
    var grid = document.getElementById('schedule-grid');
    if (!grid) return;
    
    var weekDisplay = document.getElementById('schedule-week-display');
    if (weekDisplay) weekDisplay.textContent = 'Week ' + studentScheduleState.currentWeek;
    
    if (!studentScheduleState.selectedStudentId) {
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
    
    var schedule = getStudentSchedule(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek);
    var restDays = data.curriculum.restDays[studentScheduleState.currentWeek] || [];
    var availableDisciplines = getAvailableDisciplinesForStudent(
        studentScheduleState.selectedStudentId, 
        studentScheduleState.currentWeek
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
                    var duration = getClassDuration(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek, day, hour) || 1;
                    
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
                        studentScheduleState.selectedStudentId, 
                        studentScheduleState.currentWeek, 
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
                        studentScheduleState.selectedStudentId, 
                        studentScheduleState.currentWeek, 
                        day, 
                        hour
                    );
                    var groupLabel = getClassGroupLabel(
                        studentScheduleState.selectedStudentId, 
                        studentScheduleState.currentWeek, 
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
                                studentScheduleState.selectedStudentId, 
                                discId, 
                                studentScheduleState.currentWeek, 
                                d, 
                                h
                            );
                        };
                    })(disciplineId, day, hour));
                    
                    slot.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (confirm('Remove this class from the schedule?')) {
                            removeScheduleClass(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek, day, hour);
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
                        studentScheduleState.selectedStudentId,
                        studentScheduleState.currentWeek,
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
    if (!studentScheduleState.selectedStudentId) {
        updateSidebarEmpty();
        return;
    }
    
    var schedule = getStudentSchedule(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek);
    var available = getAvailableDisciplinesForStudent(
        studentScheduleState.selectedStudentId,
        studentScheduleState.currentWeek
    );
    var restDays = data.curriculum.restDays[studentScheduleState.currentWeek] || [];
    
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
                            studentScheduleState.selectedStudentId, 
                            studentScheduleState.currentWeek, 
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
                            studentScheduleState.selectedStudentId, 
                            studentScheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var groupLabel = getClassGroupLabel(
                            studentScheduleState.selectedStudentId, 
                            studentScheduleState.currentWeek, 
                            parseInt(day), 
                            parseInt(hour)
                        );
                        var labelDisplay = label ? ' [' + label + ']' : '';
                        var groupDisplay = groupLabel ? ' (G' + groupLabel + ')' : '';
                        var duration = getClassDuration(
                            studentScheduleState.selectedStudentId, 
                            studentScheduleState.currentWeek, 
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
                var slotsInfo = item.hasSlots ? 
                    ' <span style="color:var(--info);font-size:0.6rem;">✓ ' + item.slotCount + ' slots</span>' : 
                    ' <span style="color:var(--warning);font-size:0.6rem;">no slots</span>';
                
                html += '<div class="available-discipline' + (isFull ? ' full' : '') + '" style="cursor:pointer;" data-discipline="' + disc.id + '">' +
                    '<span>' + disc.name + ' <span style="font-size:0.6rem;color:var(--text-dim);">(' + instructorDisplay + ')</span>' + groupInfo + '</span>' +
                    '<span class="hours">' + item.used + '/' + item.maxHours + 'h ' + slotsInfo + '</span>' +
                '</div>';
            });
            availContainer.innerHTML = html;
            
            // Click on available discipline to show time slots
            availContainer.querySelectorAll('.available-discipline').forEach(function(el) {
                el.addEventListener('click', function() {
                    var disciplineId = this.dataset.discipline;
                    if (studentScheduleState.selectedStudentId) {
                        showAvailableTimeSlotsModal(
                            disciplineId,
                            studentScheduleState.selectedStudentId,
                            studentScheduleState.currentWeek
                        );
                    }
                });
            });
        }
    }
    
    var usedEl = document.getElementById('schedule-hours-used');
    var totalEl = document.getElementById('schedule-hours-total');
    if (usedEl && totalEl) {
        var totalHours = 0;
        var usedHours = 0;
        var allDisciplines = getAvailableDisciplines(studentScheduleState.currentWeek);
        allDisciplines.forEach(function(d) {
            totalHours += d.weeklyHours || 0;
        });
        var schedule = getStudentSchedule(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek);
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
 * Clear the current week's schedule
 */
function clearSchedule() {
    if (!studentScheduleState.selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    if (!confirm('Clear all classes for week ' + studentScheduleState.currentWeek + '?')) return;
    
    var schedule = getStudentSchedule(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek);
    for (var day in schedule) {
        delete schedule[day];
    }
    
    var week = studentScheduleState.currentWeek;
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
            logActivity('Cleared schedule for week ' + studentScheduleState.currentWeek);
        }
        renderStudentSchedule();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderStudentSchedule();
    });
}

/**
 * Save rest days
 */
function saveRestDays() {
    if (!studentScheduleState.selectedStudentId) {
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
    
    data.curriculum.restDays[studentScheduleState.currentWeek] = restDays;
    
    var schedule = getStudentSchedule(studentScheduleState.selectedStudentId, studentScheduleState.currentWeek);
    restDays.forEach(function(day) {
        if (schedule[day]) {
            delete schedule[day];
        }
    });
    
    saveData().then(function() {
        if (typeof logActivity === 'function') {
            logActivity('Saved rest days for week ' + studentScheduleState.currentWeek + ' and removed classes on rest days');
        }
        renderStudentSchedule();
    }).catch(function(err) {
        console.error('Failed to save:', err);
        renderStudentSchedule();
    });
}

// Make functions globally available
window.renderStudentScheduleView = renderStudentScheduleView;
window.renderStudentSchedule = renderStudentSchedule;
window.getStudentSchedule = getStudentSchedule;
window.getClassInstructor = getClassInstructor;
window.setClassInstructor = setClassInstructor;
window.getClassLabel = getClassLabel;
window.setClassLabel = setClassLabel;
window.getClassGroupLabel = getClassGroupLabel;
window.setClassGroupLabel = setClassGroupLabel;
window.getClassDuration = getClassDuration;
window.setClassDuration = setClassDuration;
window.addClassToStudent = addClassToStudent;
window.joinStudentToSlot = joinStudentToSlot;
window.getAvailableSlotsForDiscipline = getAvailableSlotsForDiscipline;
window.getAvailableDisciplinesForStudent = getAvailableDisciplinesForStudent;
window.getStudentDisciplineHours = getStudentDisciplineHours;
window.showAvailableTimeSlotsModal = showAvailableTimeSlotsModal;
window.showAddScheduleClassModal = showAddScheduleClassModal;
window.showScheduleClassDetails = showScheduleClassDetails;
window.removeScheduleClass = removeScheduleClass;
window.duplicateScheduleToWeek = duplicateScheduleToWeek;
window.clearSchedule = clearSchedule;
window.saveRestDays = saveRestDays;
window.getInstructorTemplatesForWeek = getInstructorTemplatesForWeek;
window.getAllInstructorTemplatesForWeek = getAllInstructorTemplatesForWeek;
window.getInstructorNames = getInstructorNames;
window.studentScheduleState = studentScheduleState;
