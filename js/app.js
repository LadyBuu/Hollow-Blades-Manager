/**
 * app.js - Main Application Entry Point
 * Initializes the application and handles dashboard functionality
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
            
            // Update dashboard stats
            updateDashboardStats();
            renderActivityLog();
            
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
    var yearDisplay = document.getElementById('header-current-year');
    
    if (charCount) charCount.textContent = data.characters ? data.characters.length : 0;
    if (teamCount) teamCount.textContent = data.teams ? data.teams.length : 0;
    if (tournCount) tournCount.textContent = data.tournaments ? data.tournaments.length : 0;
    if (studentCount) {
        var students = typeof getStudents === 'function' ? getStudents() : [];
        studentCount.textContent = students.length;
    }
    if (disciplineCount) {
        var count = data.curriculum && data.curriculum.disciplines ? data.curriculum.disciplines.length : 0;
        disciplineCount.textContent = count;
    }
    if (yearDisplay) yearDisplay.textContent = data.currentYear || new Date().getFullYear();
}

/**
 * Render activity log
 */
function renderActivityLog() {
    var log = document.getElementById('activity-log');
    if (!log) return;
    
    if (!data.activities || data.activities.length === 0) {
        log.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    var html = '';
    data.activities.slice(0, 10).forEach(function(a) {
        html += '<div class="activity-item">' + a.message + '</div>';
    });
    log.innerHTML = html;
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
        renderActivityLog();
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
            setTimeout(function() {
                if (typeof initWeeklyEvents === 'function') {
                    initWeeklyEvents();
                }
            }, 100);
        }
    } else if (page === 'curriculum.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderCurriculumView === 'function') {
            renderCurriculumView(container);
        }
    }
}

// ============================================================
// CHARACTER FUNCTIONS
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
        
        html += '<div class="list-item char-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + '</span>' +
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
 * Initialize character events (for characters.html page)
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
 * Show character form for add or edit
 */
function showCharacterForm(editId) {
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');
    form.classList.remove('hidden');
    
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
        var char = data.characters.find(function(c) { return c.id === editId; });
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
            var container = document.getElementById('career-status-container');
            container.innerHTML = '';
            if (char.careerStatus && char.careerStatus.length > 0) {
                char.careerStatus.forEach(function(status) {
                    addCareerStatusEntry(container, status.status, status.startYear, status.endYear);
                });
            } else {
                addCareerStatusEntry(container);
            }
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
        if (deathFields) deathFields.style.display = 'none';
        var container = document.getElementById('career-status-container');
        container.innerHTML = '';
        addCareerStatusEntry(container);
        document.getElementById('char-specialty').value = '';
        var specialtyField = document.getElementById('specialty-field');
        if (specialtyField) specialtyField.style.display = 'none';
    }
    form.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide character form
 */
function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
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
 * Save character from form - FIXED to properly save career status
 */
function saveCharacter(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var isDeceased = document.getElementById('char-deceased').checked;
    var deathYear = document.getElementById('char-death-year').value.trim();
    var deathCause = document.getElementById('char-death-cause').value.trim();
    var deathAge = document.getElementById('char-death-age').value.trim();
    
    // Collect career status - FIXED to get all entries
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
        specialty: document.getElementById('char-specialty').value.trim()
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
        var index = data.characters.findIndex(function(c) { return c.id === editId; });
        if (index !== -1) {
            data.characters[index] = Object.assign({}, data.characters[index], charData);
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
 * @param {string} id - Character ID
 */
function deleteCharacter(id) {
    if (!confirm('Delete this character permanently?')) return;
    var char = data.characters.find(function(c) { return c.id === id; });
    if (!char) return;
    
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members = team.members.filter(function(m) { return m.characterId !== id; });
        }
    });
    
    data.characters = data.characters.filter(function(c) { return c.id !== id; });
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
window.renderActivityLog = renderActivityLog;
window.showYearModal = showYearModal;
window.renderCharacters = renderCharacters;
window.initCharacterEvents = initCharacterEvents;
window.showCharacterForm = showCharacterForm;
window.hideCharacterForm = hideCharacterForm;
window.addCareerStatusEntry = addCareerStatusEntry;
window.saveCharacter = saveCharacter;
window.deleteCharacter = deleteCharacter;

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
