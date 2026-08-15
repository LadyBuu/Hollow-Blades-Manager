/**
 * app.js - Main Application Entry Point
 * Contains character elimination logic with standalone support
 */

// Global data reference
var data = null;

/**
 * Initialize the application
 */
function initApp() {
    loadData()
        .then(function() {
            // Initialize import/export
            if (typeof initImportExport === 'function') {
                initImportExport();
            }
            
            // Initialize missions system
            if (typeof initMissionsSystem === 'function') {
                initMissionsSystem();
            }
            
            // Initialize team manager system
            if (typeof initTeamManagerSystem === 'function') {
                initTeamManagerSystem();
            }
            
            // Initialize curriculum system
            if (typeof initScheduleSystem === 'function') {
                initScheduleSystem();
            }
            
            // Initialize student schedule system
            if (typeof initStudentScheduleSystem === 'function') {
                initStudentScheduleSystem();
            }
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Set up year click
            var yearDisplay = document.getElementById('header-current-year');
            if (yearDisplay) {
                yearDisplay.addEventListener('click', function() {
                    showYearModal();
                });
            }
        })
        .catch(function(err) {
            console.error('Failed to initialize application:', err);
            alert('Failed to load data. Please check console for details.');
        });
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    var charCount = document.getElementById('char-count');
    var teamCount = document.getElementById('team-count');
    var tournCount = document.getElementById('tournament-count');
    var studentCount = document.getElementById('student-count');
    var disciplineCount = document.getElementById('discipline-count');
    var missionCount = document.getElementById('mission-count');
    var yearDisplay = document.getElementById('header-current-year');
    
    if (charCount) charCount.textContent = data.characters ? data.characters.length : 0;
    if (teamCount) {
        var activeTeams = data.teams ? data.teams.filter(function(t) { return t.status !== 'deleted'; }).length : 0;
        teamCount.textContent = activeTeams;
    }
    if (tournCount) tournCount.textContent = data.tournaments ? data.tournaments.length : 0;
    if (studentCount) {
        var students = typeof getStudents === 'function' ? getStudents() : [];
        studentCount.textContent = students.length;
    }
    if (disciplineCount) {
        var count = data.curriculum && data.curriculum.disciplines ? data.curriculum.disciplines.length : 0;
        disciplineCount.textContent = count;
    }
    if (missionCount) {
        missionCount.textContent = data.missions ? data.missions.length : 0;
    }
    if (yearDisplay) yearDisplay.textContent = data.currentYear || new Date().getFullYear();
}

/**
 * Show year modal
 */
function showYearModal() {
    var currentYear = data.currentYear || new Date().getFullYear();
    var newYear = prompt('Enter the current year:', currentYear);
    if (newYear !== null && newYear !== '') {
        var yearNum = parseInt(newYear);
        if (!isNaN(yearNum) && yearNum > 0) {
            data.currentYear = yearNum;
            saveData().then(function() {
                if (typeof logActivity === 'function') {
                    logActivity('Set current year to ' + yearNum);
                }
                updateDashboardStats();
            }).catch(function(err) {
                console.error('Failed to save year:', err);
                alert('Failed to save year. Please try again.');
            });
        } else {
            alert('Please enter a valid year (positive number).');
        }
    }
}

/**
 * Re-render all views
 */
function renderAll() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    if (page === 'index.html' || page === '') {
        updateDashboardStats();
    } else if (page === 'characters.html') {
        if (typeof renderCharacters === 'function') {
            renderCharacters();
        }
        if (typeof initCharacterEvents === 'function') {
            initCharacterEvents();
        }
    } else if (page === 'tournaments.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderTournamentsView === 'function') {
            renderTournamentsView(container);
        }
    } else if (page === 'curriculum.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderCurriculumView === 'function') {
            renderCurriculumView(container);
        }
    } else if (page === 'missions.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderMissionsView === 'function') {
            renderMissionsView(container);
        }
    } else if (page === 'team-manager.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderTeamManagerView === 'function') {
            renderTeamManagerView(container);
        }
    }
}

// ============================================================
// CHARACTER FUNCTIONS - with standalone elimination support
// ============================================================

/**
 * Render characters (for characters.html page)
 */
function renderCharacters() {
    var container = document.getElementById('characters-container');
    if (!container) return;
    
    if (!data.characters || data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }
    
    var sortedChars = data.characters.slice().sort(function(a, b) {
        if (a.deceased && !b.deceased) return 1;
        if (!a.deceased && b.deceased) return -1;
        return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase());
    });
    
    var html = '';
    sortedChars.forEach(function(char) {
        var fullName = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var age = calculateAge(char);
        var ageDisplay = age !== null ? age + ' yrs' : '-';
        var status = getCurrentStatus(char);
        var teamCount = getCharacterTeamCount(char.id);
        var isDead = char.deceased || false;
        var deadClass = isDead ? ' deceased' : '';
        var deadBadge = isDead ? ' <span class="deceased-badge">Deceased</span>' : '';
        
        // Check for eliminations (including standalone)
        var hasEliminations = char.eliminations && char.eliminations.length > 0;
        var hasStandalone = false;
        var latestElimWeek = null;
        if (hasEliminations) {
            char.eliminations.forEach(function(elim) {
                if (elim.standalone) hasStandalone = true;
                var week = parseInt(elim.week);
                if (!isNaN(week) && (latestElimWeek === null || week > latestElimWeek)) {
                    latestElimWeek = week;
                }
            });
        }
        var elimBadge = hasEliminations ? ' <span class="eliminated-badge">Eliminated' + (hasStandalone ? ' (Standalone)' : '') + '</span>' : '';
        var elimWeekBadge = latestElimWeek !== null ? ' <span class="warning-badge">Wk ' + latestElimWeek + '</span>' : '';
        
        html += '<div class="list-item char-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + elimBadge + elimWeekBadge + '</span>' +
            '<span>' + ageDisplay + '</span>' +
            '<span>' + status + '</span>' +
            '<span>' + teamCount + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-character" data-id="' + char.id + '">Edit</button>' +
                '<button class="small danger delete-character" data-id="' + char.id + '">Delete</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showCharacterForm(btn.dataset.id);
        });
    });
    container.querySelectorAll('.delete-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteCharacter(btn.dataset.id);
        });
    });
}

/**
 * Initialize character events
 */
function initCharacterEvents() {
    var addBtn = document.getElementById('add-character-btn');
    if (addBtn) {
        var newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.addEventListener('click', function() { showCharacterForm(); });
    }
    
    var cancelBtn = document.getElementById('cancel-char-btn');
    if (cancelBtn) {
        var newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', hideCharacterForm);
    }
    
    var form = document.getElementById('char-form');
    if (form) {
        var newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', saveCharacter);
    }
    
    var addStatusBtn = document.getElementById('add-status-btn');
    if (addStatusBtn) {
        var newStatusBtn = addStatusBtn.cloneNode(true);
        addStatusBtn.parentNode.replaceChild(newStatusBtn, addStatusBtn);
        newStatusBtn.addEventListener('click', function() {
            var container = document.getElementById('career-status-container');
            addCareerStatusEntry(container);
        });
    }
    
    // Standalone elimination events
    var addStandaloneElimBtn = document.getElementById('add-standalone-elim-btn');
    if (addStandaloneElimBtn) {
        var newElimBtn = addStandaloneElimBtn.cloneNode(true);
        addStandaloneElimBtn.parentNode.replaceChild(newElimBtn, addStandaloneElimBtn);
        newElimBtn.addEventListener('click', function() {
            addStandaloneElimination();
        });
    }
    
    var deceasedCheck = document.getElementById('char-deceased');
    if (deceasedCheck) {
        deceasedCheck.addEventListener('change', function() {
            var deathFields = document.getElementById('death-fields');
            if (deathFields) {
                deathFields.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
}

/**
 * Add standalone elimination to a character
 */
function addStandaloneElimination() {
    var charId = document.getElementById('standalone-char-id')?.value;
    if (!charId) {
        alert('Please select a character first.');
        return;
    }
    
    var week = parseInt(document.getElementById('standalone-elim-week')?.value) || 1;
    var reason = document.getElementById('standalone-elim-reason')?.value || 'Dropped out';
    
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char) {
        alert('Character not found.');
        return;
    }
    
    // Check if already eliminated at or before this week
    var alreadyEliminated = false;
    if (char.eliminatedWeeks) {
        char.eliminatedWeeks.forEach(function(w) {
            if (parseInt(w) <= week) {
                alreadyEliminated = true;
            }
        });
    }
    
    if (alreadyEliminated) {
        alert('This character is already eliminated at or before week ' + week + '.');
        return;
    }
    
    if (!char.eliminations) char.eliminations = [];
    if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
    
    char.eliminations.push({
        tournamentId: null,
        week: week,
        reason: reason,
        standalone: true
    });
    
    char.eliminatedWeeks.push(week);
    char.eliminatedWeeks.sort(function(a, b) { return a - b; });
    
    if (typeof logActivity === 'function') {
        logActivity('Eliminated ' + char.firstName + ' (standalone, Week ' + week + '): ' + reason);
    }
    
    saveData().then(function() {
        renderCharacters();
        // Re-render character form if open
        var form = document.getElementById('character-form');
        if (form && !form.classList.contains('hidden')) {
            showCharacterForm(charId);
        }
        alert('Character eliminated successfully!');
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to save elimination.');
    });
}

/**
 * Show character form for add or edit
 */
function showCharacterForm(editId) {
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');
    form.classList.remove('hidden');
    
    // Scroll to the form smoothly
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    var deceasedCheck = document.getElementById('char-deceased');
    var deathFields = document.getElementById('death-fields');
    if (deceasedCheck) {
        deceasedCheck.onchange = function() {
            if (deathFields) {
                deathFields.style.display = this.checked ? 'block' : 'none';
            }
        };
    }
    
    if (editId) {
        title.textContent = 'Edit Character';
        var char = data.characters.find(function(c) { return String(c.id) === String(editId); });
        if (char) {
            document.getElementById('char-firstname').value = char.firstName || '';
            document.getElementById('char-middlename').value = char.middleName || '';
            document.getElementById('char-lastname').value = char.lastName || '';
            document.getElementById('char-birthyear').value = char.birthYear || '';
            document.getElementById('char-gender').value = char.gender || '';
            document.getElementById('char-associated-names').value = char.associatedNames || '';
            document.getElementById('char-eyes').value = char.eyes || '';
            document.getElementById('char-hair').value = char.hair || '';
            document.getElementById('char-skin').value = char.skin || '';
            document.getElementById('char-height').value = char.height || '';
            document.getElementById('char-build').value = char.build || '';
            document.getElementById('char-appearance-notes').value = char.appearanceNotes || '';
            document.getElementById('char-notes').value = char.notes || '';
            document.getElementById('char-specialty').value = char.specialty || '';
            document.getElementById('char-deceased').checked = char.deceased || false;
            document.getElementById('char-death-year').value = char.deathYear || '';
            document.getElementById('char-death-cause').value = char.deathCause || '';
            document.getElementById('char-death-age').value = char.deathAge || '';
            if (deathFields) {
                deathFields.style.display = char.deceased ? 'block' : 'none';
            }
            
            // Career status
            var container = document.getElementById('career-status-container');
            container.innerHTML = '';
            if (char.careerStatus && char.careerStatus.length > 0) {
                char.careerStatus.forEach(function(status) {
                    addCareerStatusEntry(container, status.status, status.startYear, status.endYear);
                });
            } else {
                addCareerStatusEntry(container);
            }
            
            // Tournament eliminations
            var elimContainer = document.getElementById('elimination-container');
            elimContainer.innerHTML = '';
            if (char.eliminations) {
                var tournamentElims = char.eliminations.filter(function(e) { return !e.standalone; });
                if (tournamentElims.length > 0) {
                    tournamentElims.forEach(function(elim) {
                        addEliminationEntry(elimContainer, elim.tournamentId, elim.week, elim.reason);
                    });
                }
            }
            if (elimContainer.children.length === 0) {
                addEliminationEntry(elimContainer);
            }
            
            // Standalone eliminations - show as list
            renderStandaloneEliminations(char);
            
            formElement.dataset.editId = editId;
            document.getElementById('standalone-char-id').value = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
        if (deathFields) deathFields.style.display = 'none';
        
        var container = document.getElementById('career-status-container');
        container.innerHTML = '';
        addCareerStatusEntry(container);
        
        var elimContainer = document.getElementById('elimination-container');
        elimContainer.innerHTML = '';
        addEliminationEntry(elimContainer);
        
        document.getElementById('char-specialty').value = '';
        var specialtyField = document.getElementById('specialty-field');
        if (specialtyField) specialtyField.style.display = 'none';
        
        // Hide standalone eliminations
        var standaloneContainer = document.getElementById('standalone-eliminations-container');
        if (standaloneContainer) standaloneContainer.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No standalone eliminations recorded.</p>';
        document.getElementById('standalone-char-id').value = '';
        document.getElementById('standalone-elim-week').value = 1;
        document.getElementById('standalone-elim-reason').value = '';
    }
    // Focus the first input
    setTimeout(function() {
        var firstName = document.getElementById('char-firstname');
        if (firstName) firstName.focus();
    }, 300);
}

/**
 * Render standalone eliminations for a character
 */
function renderStandaloneEliminations(char) {
    var container = document.getElementById('standalone-eliminations-container');
    if (!container) return;
    
    var standaloneElims = [];
    if (char.eliminations) {
        standaloneElims = char.eliminations.filter(function(e) { return e.standalone; });
    }
    
    if (standaloneElims.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No standalone eliminations recorded.</p>';
        return;
    }
    
    var html = '';
    standaloneElims.forEach(function(elim, index) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--warning-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid var(--warning);">';
        html += '<span style="font-size:0.75rem;">Week ' + elim.week + (elim.reason ? ' - ' + elim.reason : '') + ' <span style="color:var(--warning);font-size:0.6rem;">[Standalone]</span></span>';
        html += '<button class="remove-standalone-elim small" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.6rem;padding:0 4px;" data-index="' + index + '">✕</button>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.remove-standalone-elim').forEach(function(btn) {
        btn.addEventListener('click', function() {
            removeStandaloneElimination(char.id, parseInt(this.dataset.index));
        });
    });
}

/**
 * Remove standalone elimination
 */
function removeStandaloneElimination(charId, index) {
    if (!confirm('Remove this standalone elimination?')) return;
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char || !char.eliminations) return;
    
    var elim = char.eliminations[index];
    if (!elim || !elim.standalone) return;
    
    // Remove from eliminatedWeeks
    if (char.eliminatedWeeks) {
        var weekIdx = char.eliminatedWeeks.indexOf(parseInt(elim.week));
        if (weekIdx !== -1) {
            char.eliminatedWeeks.splice(weekIdx, 1);
        }
    }
    
    char.eliminations.splice(index, 1);
    
    saveData().then(function() {
        renderCharacters();
        showCharacterForm(charId);
        alert('Standalone elimination removed.');
    }).catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to remove elimination.');
    });
}

/**
 * Hide character form
 */
function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
    // Scroll back to the top of the character list
    var list = document.getElementById('character-list');
    if (list) {
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Add a career status entry to the container
 */
function addCareerStatusEntry(container, status, startYear, endYear) {
    var entry = document.createElement('div');
    entry.className = 'career-status-entry';
    entry.innerHTML = `
        <select class="career-status-select">
            <option value="">Select status...</option>
            <option value="civilian" ${status === 'civilian' ? 'selected' : ''}>Civilian</option>
            <option value="trainee" ${status === 'trainee' ? 'selected' : ''}>Trainee</option>
            <option value="rookie" ${status === 'rookie' ? 'selected' : ''}>Rookie</option>
            <option value="junior" ${status === 'junior' ? 'selected' : ''}>Junior</option>
            <option value="senior" ${status === 'senior' ? 'selected' : ''}>Senior</option>
            <option value="instructor" ${status === 'instructor' ? 'selected' : ''}>Instructor</option>
            <option value="support" ${status === 'support' ? 'selected' : ''}>Support</option>
        </select>
        <input type="number" class="career-start-year" placeholder="Start Year" value="${startYear || ''}">
        <input type="number" class="career-end-year" placeholder="End Year (or leave blank)" value="${endYear || ''}">
        <button type="button" class="small danger remove-status">✕</button>
    `;
    container.appendChild(entry);
    var select = entry.querySelector('.career-status-select');
    var specialtyField = document.getElementById('specialty-field');
    select.onchange = function() {
        if (specialtyField) {
            specialtyField.style.display = (this.value === 'instructor' || this.value === 'support') ? 'block' : 'none';
        }
    };
    entry.querySelector('.remove-status').onclick = function() {
        if (container.children.length > 1) {
            entry.remove();
        } else {
            alert('You need at least one status entry.');
        }
    };
}

/**
 * Add elimination entry to the form
 */
function addEliminationEntry(container, tournamentId, week, reason) {
    var entry = document.createElement('div');
    entry.className = 'elimination-entry-form';
    entry.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;';
    
    // Tournament dropdown
    var select = document.createElement('select');
    select.className = 'elimination-tournament';
    select.style.cssText = 'flex:1;min-width:120px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;';
    select.innerHTML = '<option value="">Select tournament...</option>';
    
    if (data.tournaments) {
        data.tournaments.forEach(function(t) {
            var option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            if (tournamentId && String(t.id) === String(tournamentId)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    var weekInput = document.createElement('input');
    weekInput.type = 'number';
    weekInput.className = 'elimination-week';
    weekInput.placeholder = 'Week';
    weekInput.style.cssText = 'width:70px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;';
    if (week) weekInput.value = week;
    
    var reasonInput = document.createElement('input');
    reasonInput.type = 'text';
    reasonInput.className = 'elimination-reason';
    reasonInput.placeholder = 'Reason (e.g., Defeated by...)';
    reasonInput.style.cssText = 'flex:1;min-width:100px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:5px 8px;font-size:0.78rem;';
    if (reason) reasonInput.value = reason;
    
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'small danger remove-elimination';
    removeBtn.textContent = '✕';
    removeBtn.style.cssText = 'padding:4px 8px;font-size:0.65rem;';
    removeBtn.onclick = function() {
        if (container.children.length > 1) {
            entry.remove();
        } else {
            alert('You need at least one elimination entry.');
        }
    };
    
    entry.appendChild(select);
    entry.appendChild(weekInput);
    entry.appendChild(reasonInput);
    entry.appendChild(removeBtn);
    container.appendChild(entry);
}

/**
 * Save character from form
 */
function saveCharacter(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var isDeceased = document.getElementById('char-deceased').checked;
    var deathYear = document.getElementById('char-death-year').value.trim();
    var deathCause = document.getElementById('char-death-cause').value.trim();
    var deathAge = document.getElementById('char-death-age').value.trim();
    
    // Collect career status
    var careerStatus = [];
    document.querySelectorAll('.career-status-entry').forEach(function(entry) {
        var select = entry.querySelector('.career-status-select');
        var startInput = entry.querySelector('.career-start-year');
        var endInput = entry.querySelector('.career-end-year');
        if (select && select.value) {
            careerStatus.push({
                status: select.value,
                startYear: startInput ? startInput.value || '' : '',
                endYear: endInput ? endInput.value || '' : ''
            });
        }
    });
    
    // Collect tournament eliminations (only non-standalone)
    var eliminations = [];
    document.querySelectorAll('.elimination-entry-form').forEach(function(entry) {
        var select = entry.querySelector('.elimination-tournament');
        var weekInput = entry.querySelector('.elimination-week');
        var reasonInput = entry.querySelector('.elimination-reason');
        if (select && select.value && weekInput && weekInput.value) {
            eliminations.push({
                tournamentId: select.value,
                week: weekInput.value,
                reason: reasonInput ? reasonInput.value.trim() || 'Eliminated from tournament' : 'Eliminated from tournament',
                standalone: false
            });
        }
    });
    
    var charData = {
        firstName: document.getElementById('char-firstname').value.trim(),
        middleName: document.getElementById('char-middlename').value.trim(),
        lastName: document.getElementById('char-lastname').value.trim(),
        birthYear: document.getElementById('char-birthyear').value || '',
        gender: document.getElementById('char-gender').value.trim(),
        associatedNames: document.getElementById('char-associated-names').value.trim(),
        eyes: document.getElementById('char-eyes').value.trim(),
        hair: document.getElementById('char-hair').value.trim(),
        skin: document.getElementById('char-skin').value.trim(),
        height: document.getElementById('char-height').value.trim(),
        build: document.getElementById('char-build').value.trim(),
        appearanceNotes: document.getElementById('char-appearance-notes').value.trim(),
        notes: document.getElementById('char-notes').value.trim(),
        deceased: isDeceased,
        deathYear: deathYear,
        deathCause: deathCause,
        deathAge: deathAge,
        careerStatus: careerStatus,
        specialty: document.getElementById('char-specialty').value.trim(),
        eliminations: eliminations
    };
    
    if (!charData.firstName) {
        alert('First name is required.');
        return;
    }
    
    if (isDeceased && !deathYear && !deathAge) {
        alert('Please enter either Death Year or Death Age for deceased characters.');
        return;
    }
    
    if (editId) {
        var index = data.characters.findIndex(function(c) { return String(c.id) === String(editId); });
        if (index !== -1) {
            // Preserve standalone eliminations
            var existing = data.characters[index];
            var standaloneElims = [];
            if (existing.eliminations) {
                standaloneElims = existing.eliminations.filter(function(e) { return e.standalone; });
            }
            charData.eliminations = charData.eliminations.concat(standaloneElims);
            charData.id = existing.id;
            charData.createdAt = existing.createdAt;
            data.characters[index] = Object.assign({}, existing, charData);
            if (typeof logActivity === 'function') {
                logActivity('Updated character: ' + charData.firstName);
            }
        }
    } else {
        var newChar = {
            id: generateId('char'),
            firstName: charData.firstName,
            middleName: charData.middleName,
            lastName: charData.lastName,
            birthYear: charData.birthYear,
            gender: charData.gender,
            associatedNames: charData.associatedNames,
            eyes: charData.eyes,
            hair: charData.hair,
            skin: charData.skin,
            height: charData.height,
            build: charData.build,
            appearanceNotes: charData.appearanceNotes,
            notes: charData.notes,
            deceased: charData.deceased,
            deathYear: charData.deathYear,
            deathCause: charData.deathCause,
            deathAge: charData.deathAge,
            careerStatus: charData.careerStatus,
            specialty: charData.specialty,
            eliminations: charData.eliminations,
            eliminatedWeeks: [],
            createdAt: new Date().toISOString()
        };
        data.characters.push(newChar);
        if (typeof logActivity === 'function') {
            logActivity('Added character: ' + charData.firstName);
        }
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderCharacters();
    updateDashboardStats();
    hideCharacterForm();
}

/**
 * Delete a character
 */
function deleteCharacter(id) {
    if (!confirm('Delete this character permanently?')) return;
    var char = data.characters.find(function(c) { return String(c.id) === String(id); });
    if (!char) return;
    
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members = team.members.filter(function(m) { return String(m.characterId) !== String(id); });
        }
    });
    
    data.characters = data.characters.filter(function(c) { return String(c.id) !== String(id); });
    if (typeof logActivity === 'function') {
        logActivity('Deleted character: ' + char.firstName);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderCharacters();
    updateDashboardStats();
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================

window.renderAll = renderAll;
window.updateDashboardStats = updateDashboardStats;
window.showYearModal = showYearModal;
window.renderCharacters = renderCharacters;
window.initCharacterEvents = initCharacterEvents;
window.showCharacterForm = showCharacterForm;
window.hideCharacterForm = hideCharacterForm;
window.addCareerStatusEntry = addCareerStatusEntry;
window.addEliminationEntry = addEliminationEntry;
window.saveCharacter = saveCharacter;
window.deleteCharacter = deleteCharacter;
window.addStandaloneElimination = addStandaloneElimination;
window.renderStandaloneEliminations = renderStandaloneEliminations;
window.removeStandaloneElimination = removeStandaloneElimination;

// ============================================================
// INITIALIZE
// ============================================================

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Also re-run when page is fully loaded (for pages that load after)
window.addEventListener('load', function() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    if (page !== 'index.html' && page !== '') {
        setTimeout(function() {
            renderAll();
        }, 200);
    }
});
