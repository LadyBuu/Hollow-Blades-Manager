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
    console.log('Initializing app...');
    
    // Use the global loadData function from database.js
    if (typeof loadData === 'function') {
        console.log('Loading data from IndexedDB...');
        loadData()
            .then(function() {
                console.log('Data loaded successfully');
                onDataLoaded();
            })
            .catch(function(err) {
                console.error('Failed to load data:', err);
                initEmptyData();
            });
    } else if (window.db && typeof window.db.loadData === 'function') {
        console.log('Loading data via db object...');
        window.db.loadData()
            .then(function() {
                console.log('Data loaded successfully');
                onDataLoaded();
            })
            .catch(function(err) {
                console.error('Failed to load data:', err);
                initEmptyData();
            });
    } else {
        console.error('loadData function not available');
        initEmptyData();
    }
}

function initEmptyData() {
    data = {
        characters: [],
        teams: [],
        tournaments: [],
        missions: [],
        activities: [],
        currentYear: new Date().getFullYear(),
        currentWeek: 1,
        curriculum: {
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
        },
        social: {
            relationships: [],
            relationshipTypes: [
                { id: 'familiar', label: 'Familiar', color: '#8cbb3a' },
                { id: 'professional', label: 'Professional', color: '#c9a24b' },
                { id: 'romantic', label: 'Romantic', color: '#c1453c' },
                { id: 'friendship', label: 'Friendship', color: '#4a9bc7' },
                { id: 'mentor', label: 'Mentor/Mentee', color: '#9b59b6' },
                { id: 'rivalry', label: 'Rivalry', color: '#e67e22' },
                { id: 'alliance', label: 'Alliance', color: '#27ae60' },
                { id: 'other', label: 'Other', color: '#7f8c8d' }
            ],
            nextId: 1
        }
    };
    console.warn('Using empty data fallback');
    onDataLoaded();
}

function onDataLoaded() {
    if (typeof initImportExport === 'function') {
        initImportExport();
    }
    if (typeof initMissionsSystem === 'function') {
        initMissionsSystem();
    }
    if (typeof initTeamManagerSystem === 'function') {
        initTeamManagerSystem();
    }
    if (typeof initScheduleSystem === 'function') {
        initScheduleSystem();
    }
    if (typeof initStudentScheduleSystem === 'function') {
        initStudentScheduleSystem();
    }
    if (typeof initSocialSystem === 'function') {
        initSocialSystem();
    }
    
    updateDashboardStats();
    
    var yearDisplay = document.getElementById('header-current-year');
    if (yearDisplay) {
        yearDisplay.addEventListener('click', function() {
            showYearModal();
        });
    }
    
    console.log('App initialized with:', {
        characters: data.characters ? data.characters.length : 0,
        teams: data.teams ? data.teams.length : 0,
        tournaments: data.tournaments ? data.tournaments.length : 0,
        missions: data.missions ? data.missions.length : 0,
        social: data.social ? data.social.relationships.length : 0
    });
    
    renderAll();
}

function updateDashboardStats() {
    var charCount = document.getElementById('char-count');
    var teamCount = document.getElementById('team-count');
    var tournCount = document.getElementById('tournament-count');
    var studentCount = document.getElementById('student-count');
    var disciplineCount = document.getElementById('discipline-count');
    var missionCount = document.getElementById('mission-count');
    var socialCount = document.getElementById('social-count');
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
    if (socialCount) {
        socialCount.textContent = data.social && data.social.relationships ? data.social.relationships.length : 0;
    }
    if (yearDisplay) yearDisplay.textContent = data.currentYear || new Date().getFullYear();
}

function showYearModal() {
    var currentYear = data.currentYear || new Date().getFullYear();
    var newYear = prompt('Enter the current year:', currentYear);
    if (newYear !== null && newYear !== '') {
        var yearNum = parseInt(newYear);
        if (!isNaN(yearNum) && yearNum > 0) {
            data.currentYear = yearNum;
            if (typeof saveData === 'function') {
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
                updateDashboardStats();
            }
        } else {
            alert('Please enter a valid year (positive number).');
        }
    }
}

function renderAll() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    console.log('Rendering page:', page);
    
    if (!data) {
        console.warn('Data not initialized yet, waiting...');
        return;
    }
    
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
        } else {
            console.error('renderTournamentsView not found');
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
    } else if (page === 'social.html') {
        var container = document.getElementById('app-container');
        if (container && typeof renderSocialView === 'function') {
            renderSocialView(container);
        } else {
            console.error('renderSocialView not found');
        }
    }
}

// ============================================================
// CHARACTER FUNCTIONS
// ============================================================

function renderCharacters() {
    var container = document.getElementById('characters-container');
    if (!container) return;
    
    if (!data || !data.characters) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }
    
    var statusFilter = document.getElementById('char-status-filter')?.value || 'all';
    var nameFilter = document.getElementById('char-name-filter')?.value?.toLowerCase() || '';
    var hideEliminatedDeceased = document.getElementById('hide-eliminated-deceased')?.checked || false;
    
    if (data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }
    
    var sortedChars = data.characters.slice().sort(function(a, b) {
        if (a.deceased && !b.deceased) return 1;
        if (!a.deceased && b.deceased) return -1;
        return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase());
    });
    
    var filteredChars = sortedChars.filter(function(char) {
        // Hide eliminated/deceased if checkbox is checked
        if (hideEliminatedDeceased) {
            if (char.deceased) return false;
            if (char.eliminations && char.eliminations.length > 0) return false;
        }
        
        if (nameFilter) {
            var fullName = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            if (fullName.indexOf(nameFilter) === -1) return false;
        }
        if (statusFilter !== 'all') {
            if (statusFilter === 'deceased') {
                if (!char.deceased) return false;
            } else if (statusFilter === 'eliminated') {
                var hasElimination = char.eliminations && char.eliminations.length > 0;
                if (!hasElimination) return false;
            } else {
                var status = getCurrentStatus(char).toLowerCase();
                // Check if the status matches or starts with the filter (for "Former" statuses)
                if (status !== statusFilter && !status.startsWith(statusFilter + ' ')) {
                    return false;
                }
            }
        }
        return true;
    });
    
    if (filteredChars.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters match the current filters.</p>';
        return;
    }
    
    var html = '';
    filteredChars.forEach(function(char) {
        var fullName = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var age = calculateAge(char);
        var ageDisplay = age !== null ? age + ' yrs' : '-';
        var status = getCurrentStatus(char);
        var teamCount = getCharacterTeamCount(char.id);
        var isDead = char.deceased || false;
        var deadClass = isDead ? ' deceased' : '';
        var deadBadge = isDead ? ' <span class="deceased-badge">Deceased</span>' : '';
        
        var hasTournamentElim = false;
        var hasStandalone = false;
        var latestElimWeek = null;
        var tournamentNames = [];
        
        if (char.eliminations && char.eliminations.length > 0) {
            char.eliminations.forEach(function(elim) {
                if (elim.standalone) {
                    hasStandalone = true;
                } else {
                    hasTournamentElim = true;
                    if (elim.tournamentId) {
                        var tourn = data.tournaments ? data.tournaments.find(function(t) { return String(t.id) === String(elim.tournamentId); }) : null;
                        if (tourn) {
                            tournamentNames.push(tourn.name);
                        }
                    }
                }
                var week = parseInt(elim.week);
                if (!isNaN(week) && (latestElimWeek === null || week > latestElimWeek)) {
                    latestElimWeek = week;
                }
            });
        }
        
        var elimBadges = '';
        if (hasStandalone) {
            elimBadges += ' <span class="eliminated-badge">Standalone Eliminated</span>';
        }
        if (hasTournamentElim) {
            var tournDisplay = tournamentNames.length > 0 ? ' (' + tournamentNames.slice(0, 2).join(', ') + (tournamentNames.length > 2 ? ' +' + (tournamentNames.length - 2) : '') + ')' : '';
            elimBadges += ' <span class="eliminated-badge">Tournament Eliminated' + tournDisplay + '</span>';
        }
        var elimWeekBadge = latestElimWeek !== null ? ' <span class="warning-badge">Wk ' + latestElimWeek + '</span>' : '';
        
        html += '<div class="list-item char-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + elimBadges + elimWeekBadge + '</span>' +
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
    
    var statusFilter = document.getElementById('char-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            renderCharacters();
        });
    }
    
    var nameFilter = document.getElementById('char-name-filter');
    if (nameFilter) {
        nameFilter.addEventListener('input', function() {
            renderCharacters();
        });
    }
    
    var hideCheckbox = document.getElementById('hide-eliminated-deceased');
    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', function() {
            renderCharacters();
        });
    }
    
    var clearFilter = document.getElementById('clear-char-filter');
    if (clearFilter) {
        clearFilter.addEventListener('click', function() {
            var statusFilter = document.getElementById('char-status-filter');
            var nameFilter = document.getElementById('char-name-filter');
            var hideCheckbox = document.getElementById('hide-eliminated-deceased');
            if (statusFilter) statusFilter.value = 'all';
            if (nameFilter) nameFilter.value = '';
            if (hideCheckbox) hideCheckbox.checked = false;
            renderCharacters();
        });
    }
}

function showCharacterForm(editId) {
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');
    form.classList.remove('hidden');
    
    // Find the character list item and scroll to it, not the top
    var targetElement = form;
    if (editId) {
        // Try to find the list item for this character
        var listItem = document.querySelector('.char-item[data-id="' + editId + '"]');
        if (listItem) {
            targetElement = listItem;
        }
    }
    
    // Scroll to the target element with smooth behavior
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
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
            
            var container = document.getElementById('career-status-container');
            container.innerHTML = '';
            if (char.careerStatus && char.careerStatus.length > 0) {
                char.careerStatus.forEach(function(status) {
                    addCareerStatusEntry(container, status.status, status.startYear, status.endYear);
                });
            } else {
                addCareerStatusEntry(container);
            }
            
            renderStandaloneEliminations(char);
            renderTournamentEliminations(char);
            
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
        
        document.getElementById('char-specialty').value = '';
        var specialtyField = document.getElementById('specialty-field');
        if (specialtyField) specialtyField.style.display = 'none';
        
        var standaloneContainer = document.getElementById('standalone-eliminations-container');
        if (standaloneContainer) standaloneContainer.innerHTML = '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No standalone eliminations recorded.</p>';
        document.getElementById('standalone-char-id').value = '';
        document.getElementById('standalone-elim-week').value = 1;
        document.getElementById('standalone-elim-reason').value = '';
        
        var tournContainer = document.getElementById('tournament-eliminations-view');
        if (tournContainer) {
            tournContainer.innerHTML = '<p class="empty-state" style="padding:6px;font-size:0.75rem;">No tournament eliminations recorded.</p>';
        }
    }
    setTimeout(function() {
        var firstName = document.getElementById('char-firstname');
        if (firstName) firstName.focus();
    }, 300);
}

function renderTournamentEliminations(char) {
    var container = document.getElementById('tournament-eliminations-view');
    if (!container) return;
    
    var tournElims = [];
    if (char.eliminations) {
        tournElims = char.eliminations.filter(function(e) { return !e.standalone; });
    }
    
    if (tournElims.length === 0) {
        container.innerHTML = '<p class="empty-state" style="padding:6px;font-size:0.75rem;">No tournament eliminations recorded.</p>';
        return;
    }
    
    var html = '';
    tournElims.forEach(function(elim) {
        var tournName = 'Unknown Tournament';
        if (elim.tournamentId && data.tournaments) {
            var tourn = data.tournaments.find(function(t) { return String(t.id) === String(elim.tournamentId); });
            if (tourn) tournName = tourn.name;
        }
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--info-soft);border-radius:4px;margin-bottom:2px;border-left:3px solid var(--info);">';
        html += '<span style="font-size:0.75rem;"><strong>' + tournName + '</strong> - Week ' + elim.week + (elim.reason ? ' (' + elim.reason + ')' : '') + '</span>';
        html += '</div>';
    });
    container.innerHTML = html;
}

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
    
    if (typeof saveData === 'function') {
        saveData().then(function() {
            renderCharacters();
            var form = document.getElementById('character-form');
            if (form && !form.classList.contains('hidden')) {
                showCharacterForm(charId);
            }
            alert('Character eliminated successfully!');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to save elimination.');
        });
    } else {
        renderCharacters();
        alert('Character eliminated successfully! (Data not saved to IndexedDB)');
    }
}

function removeStandaloneElimination(charId, index) {
    if (!confirm('Remove this standalone elimination?')) return;
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char || !char.eliminations) return;
    
    var elim = char.eliminations[index];
    if (!elim || !elim.standalone) return;
    
    if (char.eliminatedWeeks) {
        var weekIdx = char.eliminatedWeeks.indexOf(parseInt(elim.week));
        if (weekIdx !== -1) {
            char.eliminatedWeeks.splice(weekIdx, 1);
        }
    }
    
    char.eliminations.splice(index, 1);
    
    if (typeof saveData === 'function') {
        saveData().then(function() {
            renderCharacters();
            showCharacterForm(charId);
            alert('Standalone elimination removed.');
        }).catch(function(err) {
            console.error('Failed to save:', err);
            alert('Failed to remove elimination.');
        });
    } else {
        renderCharacters();
        showCharacterForm(charId);
        alert('Standalone elimination removed.');
    }
}

function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
    var list = document.getElementById('character-list');
    if (list) {
        // Scroll to the character list header instead of the top
        var header = list.querySelector('.list-header');
        if (header) {
            header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

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

function saveCharacter(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var isDeceased = document.getElementById('char-deceased').checked;
    var deathYear = document.getElementById('char-death-year').value.trim();
    var deathCause = document.getElementById('char-death-cause').value.trim();
    var deathAge = document.getElementById('char-death-age').value.trim();
    
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
    
    if (editId) {
        var existing = data.characters.find(function(c) { return String(c.id) === String(editId); });
        if (existing && existing.eliminations) {
            charData.eliminations = existing.eliminations.slice();
        }
    }
    
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
            var existing = data.characters[index];
            if (!charData.eliminations) {
                charData.eliminations = existing.eliminations || [];
            }
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
            eliminations: [],
            eliminatedWeeks: [],
            createdAt: new Date().toISOString()
        };
        data.characters.push(newChar);
        if (typeof logActivity === 'function') {
            logActivity('Added character: ' + charData.firstName);
        }
    }
    
    if (typeof saveData === 'function') {
        saveData().catch(function(err) { console.error('Failed to save:', err); });
    }
    renderCharacters();
    updateDashboardStats();
    hideCharacterForm();
}

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
    if (typeof saveData === 'function') {
        saveData().catch(function(err) { console.error('Failed to save:', err); });
    }
    renderCharacters();
    updateDashboardStats();
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function calculateAge(char) {
    if (!char || !char.birthYear) return null;
    var birthYear = parseInt(char.birthYear);
    if (isNaN(birthYear)) return null;
    
    if (char.deceased) {
        if (char.deathAge) return parseInt(char.deathAge);
        if (char.deathYear) {
            var deathYear = parseInt(char.deathYear);
            if (!isNaN(deathYear)) return deathYear - birthYear;
        }
        return null;
    }
    
    var currentYear = data.currentYear || new Date().getFullYear();
    return currentYear - birthYear;
}

function getCharacterAge(char) {
    var age = calculateAge(char);
    return age !== null ? age + ' yrs' : '-';
}

/**
 * Get current career status for a character
 * Returns the most recent status based on the career status history
 * @param {Object} char - Character object
 * @returns {string} Current status name
 */
function getCurrentStatus(char) {
    if (!char || !char.careerStatus || char.careerStatus.length === 0) {
        return 'Civilian';
    }
    
    var currentYear = data.currentYear || new Date().getFullYear();
    var mostRecentStatus = 'Civilian';
    var mostRecentStart = -Infinity;
    var hasExactMatch = false;
    
    // First, check if any status exactly matches the current year
    char.careerStatus.forEach(function(status) {
        var start = parseInt(status.startYear);
        var end = status.endYear ? parseInt(status.endYear) : null;
        
        if (!isNaN(start)) {
            if (start <= currentYear && (end === null || currentYear <= end)) {
                mostRecentStatus = status.status.charAt(0).toUpperCase() + status.status.slice(1);
                hasExactMatch = true;
            }
        }
    });
    
    if (hasExactMatch) {
        return mostRecentStatus;
    }
    
    // Otherwise, find the most recent status by start year
    char.careerStatus.forEach(function(status) {
        var start = parseInt(status.startYear);
        var end = status.endYear ? parseInt(status.endYear) : null;
        
        if (!isNaN(start) && start <= currentYear) {
            if (start > mostRecentStart) {
                mostRecentStart = start;
                mostRecentStatus = status.status.charAt(0).toUpperCase() + status.status.slice(1);
            }
        }
    });
    
    // Check if all roles have ended
    var allEnded = true;
    char.careerStatus.forEach(function(status) {
        var start = parseInt(status.startYear);
        var end = status.endYear ? parseInt(status.endYear) : null;
        if (!isNaN(start) && start <= currentYear && (end === null || end >= currentYear)) {
            allEnded = false;
        }
    });
    
    if (allEnded && mostRecentStatus !== 'Civilian' && mostRecentStart > -Infinity) {
        return mostRecentStatus + ' (Former)';
    }
    
    return mostRecentStatus;
}

function getCharacterTeamCount(charId) {
    var count = 0;
    data.teams.forEach(function(team) {
        if (team.members && team.members.some(function(m) { return String(m.characterId) === String(charId); })) {
            count++;
        }
    });
    return count > 0 ? count : '-';
}

function getStudents() {
    if (!data.characters) return [];
    return data.characters.filter(function(c) {
        if (c.deceased) return false;
        var status = getCurrentStatus(c).toLowerCase();
        return status === 'trainee' || status === 'rookie' || 
               status === 'junior' || status === 'student' ||
               status.startsWith('trainee') || status.startsWith('rookie') || 
               status.startsWith('junior') || status.startsWith('student');
    }).sort(function(a, b) { return a.firstName.localeCompare(b.firstName); });
}

function getCharacterNameById(charId) {
    if (!charId) return 'Unknown';
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (char) {
        return [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    return 'Unknown';
}

function getCharacterById(charId) {
    if (!charId) return null;
    return data.characters.find(function(c) { return String(c.id) === String(charId); });
}

function logActivity(message) {
    console.log('[Activity]', message);
}

function getWeekBlock(weekNum) {
    var num = parseInt(weekNum) || 1;
    var start = Math.floor((num - 1) / 2) * 2 + 1;
    return {
        start: start,
        end: start + 1,
        label: start + '-' + (start + 1)
    };
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
window.saveCharacter = saveCharacter;
window.deleteCharacter = deleteCharacter;
window.addStandaloneElimination = addStandaloneElimination;
window.renderStandaloneEliminations = renderStandaloneEliminations;
window.renderTournamentEliminations = renderTournamentEliminations;
window.removeStandaloneElimination = removeStandaloneElimination;
window.getStudents = getStudents;
window.getCurrentStatus = getCurrentStatus;
window.getCharacterAge = getCharacterAge;
window.calculateAge = calculateAge;
window.getCharacterTeamCount = getCharacterTeamCount;
window.generateId = generateId;
window.getWeekBlock = getWeekBlock;
window.logActivity = logActivity;
window.getCharacterNameById = getCharacterNameById;
window.getCharacterById = getCharacterById;

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', initApp);

window.addEventListener('load', function() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    if (page !== 'index.html' && page !== '') {
        setTimeout(function() {
            renderAll();
        }, 300);
    }
});
