/**
 * Show add class modal - UPDATED with instructor selection
 */
function showAddScheduleClassModal(studentId, week, day, hour) {
    var available = getAvailableDisciplinesForStudentWithInstructors ? 
        getAvailableDisciplinesForStudentWithInstructors(studentId, week) : 
        getAvailableDisciplinesForStudent(studentId, week);
    
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
        <div class="modal-content" style="max-width:450px;">
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
                            var instructorDisplay = item.instructors && item.instructors.length > 0 ? 
                                item.instructors.join(', ') : 'No instructors assigned';
                            return '<option value="' + d.id + '">' + 
                                d.name + ' (' + instructorDisplay + ') - ' + 
                                item.used + '/' + item.maxHours + 'h (' + item.remaining + ' left)' + 
                            '</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-group" id="instructor-selection-group" style="display:none;">
                    <label>Select Instructor:</label>
                    <select id="add-class-instructor" style="width:100%;padding:8px;">
                        <option value="">Select instructor...</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate instructor selection when discipline changes
    var disciplineSelect = document.getElementById('add-class-select');
    var instructorGroup = document.getElementById('instructor-selection-group');
    var instructorSelect = document.getElementById('add-class-instructor');
    
    function updateInstructors() {
        var selectedId = disciplineSelect.value;
        if (!selectedId) {
            instructorGroup.style.display = 'none';
            return;
        }
        
        var discipline = getDiscipline(selectedId);
        if (!discipline || !discipline.instructorIds || discipline.instructorIds.length <= 1) {
            instructorGroup.style.display = 'none';
            return;
        }
        
        instructorGroup.style.display = 'block';
        instructorSelect.innerHTML = '<option value="">Select instructor...</option>';
        discipline.instructorIds.forEach(function(id) {
            var instructor = data.characters.find(function(c) { return String(c.id) === String(id); });
            if (instructor) {
                var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                var option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                instructorSelect.appendChild(option);
            }
        });
    }
    
    disciplineSelect.addEventListener('change', updateInstructors);
    // Initial update
    setTimeout(updateInstructors, 100);
    
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
        
        // Check if instructor selection is needed
        var discipline = getDiscipline(disciplineId);
        var selectedInstructor = null;
        if (discipline && discipline.instructorIds && discipline.instructorIds.length > 1) {
            selectedInstructor = document.getElementById('add-class-instructor').value;
            if (!selectedInstructor) {
                alert('Please select an instructor for this class.');
                return;
            }
        }
        
        // Add the class with instructor info
        var schedule = getStudentSchedule(studentId, week);
        if (!schedule[day]) schedule[day] = {};
        
        if (schedule[day][hour]) {
            alert('This slot is already occupied.');
            modal.remove();
            return;
        }
        
        // Store the discipline ID and optionally the instructor ID
        // We store it as the discipline ID, but we could also store instructor info
        schedule[day][hour] = disciplineId;
        
        // If we want to track which instructor is teaching, we could store in a separate structure
        if (selectedInstructor) {
            if (!data.curriculum.classInstructors) data.curriculum.classInstructors = {};
            var key = studentId + '_' + week + '_' + day + '_' + hour;
            data.curriculum.classInstructors[key] = selectedInstructor;
        }
        
        modal.remove();
        
        saveData().then(function() {
            var discipline = getDiscipline(disciplineId);
            if (typeof logActivity === 'function') {
                var instructorName = selectedInstructor ? 
                    (data.characters.find(function(c) { return String(c.id) === String(selectedInstructor); })?.firstName || '') : '';
                logActivity('Added class ' + (discipline ? discipline.name : '') + 
                    (instructorName ? ' taught by ' + instructorName : '') + ' to schedule');
            }
            renderSchedule();
        }).catch(function(err) {
            console.error('Failed to save:', err);
            renderSchedule();
        });
    };
}
