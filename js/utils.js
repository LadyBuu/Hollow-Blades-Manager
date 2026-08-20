/**
 * utils.js - Utility Functions
 * Shared helper functions used across the application
 */

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID string
 */
function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Get week block information for a given week number
 * @param {number} weekNum - Week number (1-52)
 * @returns {Object} Object containing start, end, and label
 */
function getWeekBlock(weekNum) {
    const num = parseInt(weekNum) || 1;
    const start = Math.floor((num - 1) / 2) * 2 + 1;
    return {
        start: start,
        end: start + 1,
        label: start + '-' + (start + 1)
    };
}

/**
 * Get ranking block from a period value
 * @param {string|number} period - Period value (week number)
 * @returns {Object|null} Block information or null if invalid
 */
function getRankingBlock(period) {
    const num = parseInt(period);
    if (isNaN(num)) return null;
    return getWeekBlock(num);
}

/**
 * Calculate character age
 * @param {Object} char - Character object
 * @returns {number|null} Age or null if cannot calculate
 */
function calculateAge(char) {
    if (!char || !char.birthYear) return null;
    const birthYear = parseInt(char.birthYear);
    if (isNaN(birthYear)) return null;
    
    if (char.deceased) {
        if (char.deathAge) return parseInt(char.deathAge);
        if (char.deathYear) {
            const deathYear = parseInt(char.deathYear);
            if (!isNaN(deathYear)) return deathYear - birthYear;
        }
        return null;
    }
    
    const currentYear = data.currentYear || new Date().getFullYear();
    return currentYear - birthYear;
}

/**
 * Get character age as display string
 * @param {Object} char - Character object
 * @returns {string} Age or '-' if unknown
 */
function getCharacterAge(char) {
    const age = calculateAge(char);
    return age !== null ? age + ' yrs' : '-';
}

/**
 * Get current career status for a character
 * @param {Object} char - Character object
 * @returns {string} Current status name
 */
function getCurrentStatus(char) {
    if (!char || !char.careerStatus || char.careerStatus.length === 0) {
        return 'Civilian';
    }
    
    const currentYear = data.currentYear || new Date().getFullYear();
    let currentStatus = 'Civilian';
    
    char.careerStatus.forEach(status => {
        const start = parseInt(status.startYear);
        const end = status.endYear ? parseInt(status.endYear) : null;
        
        if (!isNaN(start) && start <= currentYear && (end === null || currentYear <= end)) {
            currentStatus = status.status.charAt(0).toUpperCase() + status.status.slice(1);
        }
    });
    
    return currentStatus;
}

/**
 * Count teams a character belongs to
 * @param {string} charId - Character ID
 * @returns {number|string} Team count or '-' if none
 */
function getCharacterTeamCount(charId) {
    let count = 0;
    data.teams.forEach(team => {
        if (team.members && team.members.some(m => String(m.characterId) === String(charId))) {
            count++;
        }
    });
    return count > 0 ? count : '-';
}

/**
 * Get participant name from participant object
 * @param {Object} participant - Participant object with type and id
 * @param {Object} tourn - Tournament context (optional)
 * @returns {string} Display name
 */
function getParticipantName(participant, tourn) {
    if (!participant) return 'Unknown';
    
    // Handle string input
    if (typeof participant === 'string') {
        // Try to find as team
        var team = data.teams.find(function(t) { return t.name === participant; });
        if (team) return team.name;
        // Try to find as character
        var char = data.characters.find(function(c) {
            var fullName = [c.firstName, c.middleName, c.lastName]
                .filter(function(n) { return n; })
                .join(' ');
            return fullName === participant;
        });
        if (char) return [char.firstName, char.middleName, char.lastName]
            .filter(function(n) { return n; })
            .join(' ');
        return participant;
    }
    
    // Handle object participant
    if (participant.type === 'char') {
        var char = data.characters.find(function(c) { return String(c.id) === String(participant.id); });
        if (char) {
            return [char.firstName, char.middleName, char.lastName]
                .filter(function(n) { return n; })
                .join(' ');
        }
        // Try to find character by ID in any format
        for (var i = 0; i < data.characters.length; i++) {
            if (String(data.characters[i].id) === String(participant.id)) {
                var c = data.characters[i];
                return [c.firstName, c.middleName, c.lastName]
                    .filter(function(n) { return n; })
                    .join(' ');
            }
        }
        return 'Unknown Character';
    } else if (participant.type === 'team') {
        var team = data.teams.find(function(t) { return String(t.id) === String(participant.id); });
        if (team) return team.name;
        // Try to find team by ID in any format
        for (var i = 0; i < data.teams.length; i++) {
            if (String(data.teams[i].id) === String(participant.id)) {
                return data.teams[i].name;
            }
        }
        return 'Unknown Team';
    }
    
    return 'Unknown';
}

/**
 * Get active academic teams for a given week
 * @param {number} week - Week number
 * @param {string} excludeTournamentId - Optional tournament ID to exclude
 * @returns {Array} Array of active academic teams
 */
function getActiveTeamsForWeek(week, excludeTournamentId) {
    const weekNum = parseInt(week) || 1;
    const block = getWeekBlock(weekNum);
    
    return data.teams.filter(team => {
        if (team.status === 'deleted' || team.status === 'inactive') return false;
        if (team.type !== 'academic') return false;
        
        const start = parseInt(team.startPeriod);
        const end = parseInt(team.endPeriod);
        if (isNaN(start)) return false;
        
        return start <= block.end && (isNaN(end) || end >= block.start);
    }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all active teams (all types)
 * @param {string} excludeTournamentId - Optional tournament ID to exclude
 * @returns {Array} Array of all active teams
 */
function getAllActiveTeams(excludeTournamentId) {
    return data.teams.filter(team => {
        if (team.status === 'deleted' || team.status === 'inactive') return false;
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get teams of a specific type
 * @param {string} type - Team type (academic, professional, temporary)
 * @param {string} status - Status filter (active, inactive, all)
 * @returns {Array} Array of filtered teams
 */
function getTeamsByType(type, status) {
    var teams = data.teams.filter(function(t) {
        if (t.status === 'deleted') return false;
        if (t.type !== type) return false;
        return true;
    });
    
    if (status === 'active') {
        teams = teams.filter(function(t) { return t.status === 'active'; });
    } else if (status === 'inactive') {
        teams = teams.filter(function(t) { return t.status === 'inactive' || t.status === 'deprecated'; });
    }
    
    return teams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
}

/**
 * Log an activity entry
 * @param {string} message - Activity message
 * @param {string} type - Activity type (info, warning, etc.)
 */
function logActivity(message, type = 'info') {
    if (!data.activities) data.activities = [];
    data.activities.unshift({
        id: generateId(),
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    });
    
    if (data.activities.length > 100) {
        data.activities = data.activities.slice(0, 100);
    }
    
    saveData().catch(err => console.warn('Failed to save activity:', err));
}

/**
 * Get students (trainees, rookies, juniors from character list)
 * @returns {Array} Array of student characters
 */
function getStudents() {
    if (!data.characters) return [];
    return data.characters.filter(c => {
        if (c.deceased) return false;
        const status = getCurrentStatus(c).toLowerCase();
        return status === 'trainee' || status === 'rookie' || 
               status === 'junior' || status === 'student';
    }).sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/**
 * Get non-civilian characters (trainee, rookie, junior, senior, instructor, support)
 * @returns {Array} Array of non-civilian characters
 */
function getNonCivilianCharacters() {
    if (!data.characters) return [];
    return data.characters.filter(c => {
        if (c.deceased) return false;
        const status = getCurrentStatus(c).toLowerCase();
        return status !== 'civilian' && status !== '';
    }).sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/**
 * Get instructors from character list
 * @returns {Array} Array of instructor characters
 */
function getInstructors() {
    if (!data.characters) return [];
    return data.characters.filter(c => {
        if (c.deceased) return false;
        const status = getCurrentStatus(c).toLowerCase();
        return status === 'instructor' || status === 'teacher' || 
               status === 'professor' || status === 'senior';
    }).sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/**
 * Get a discipline by ID
 * @param {string} id - Discipline ID
 * @returns {Object|null} Discipline object or null
 */
function getDiscipline(id) {
    if (!data.curriculum || !data.curriculum.disciplines) return null;
    return data.curriculum.disciplines.find(d => String(d.id) === String(id));
}

/**
 * Get available disciplines for a week
 * @param {number} week - Week number
 * @returns {Array} Array of available disciplines
 */
function getAvailableDisciplines(week) {
    if (!data.curriculum || !data.curriculum.disciplines) return [];
    const weekNum = parseInt(week) || 1;
    return data.curriculum.disciplines.filter(d => {
        const start = parseInt(d.startWeek);
        const end = parseInt(d.endWeek);
        return !isNaN(start) && start <= weekNum && (isNaN(end) || end >= weekNum);
    });
}

/**
 * Get student schedule for a week
 * @param {string} studentId - Student ID
 * @param {number} week - Week number
 * @returns {Object} Schedule object
 */
function getStudentSchedule(studentId, week) {
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
    if (!data.curriculum.schedules[studentId]) {
        data.curriculum.schedules[studentId] = {};
    }
    if (!data.curriculum.schedules[studentId][week]) {
        data.curriculum.schedules[studentId][week] = {};
    }
    return data.curriculum.schedules[studentId][week];
}

/**
 * Get total hours for a student in a week
 * @param {string} studentId - Student ID
 * @param {number} week - Week number
 * @returns {number} Total hours
 */
function getTotalHours(studentId, week) {
    const schedule = getStudentSchedule(studentId, week);
    let total = 0;
    for (const day in schedule) {
        for (const hour in schedule[day]) {
            if (schedule[day][hour]) total++;
        }
    }
    return total;
}

/**
 * Get hours used per discipline for a student in a week
 * @param {string} studentId - Student ID
 * @param {number} week - Week number
 * @returns {Object} Object mapping discipline IDs to hours used
 */
function getDisciplineHours(studentId, week) {
    const schedule = getStudentSchedule(studentId, week);
    const hours = {};
    for (const day in schedule) {
        for (const hour in schedule[day]) {
            const disciplineId = schedule[day][hour];
            if (disciplineId) {
                if (!hours[disciplineId]) hours[disciplineId] = 0;
                hours[disciplineId]++;
            }
        }
    }
    return hours;
}

/**
 * Check if a character is eliminated in a specific week
 * @param {string} charId - Character ID
 * @param {number} week - Week number
 * @returns {boolean} True if eliminated
 */
function isCharacterEliminated(charId, week) {
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (!char) return false;
    if (char.deceased) return true;
    
    if (char.eliminatedWeeks && char.eliminatedWeeks.length > 0) {
        var weekNum = parseInt(week) || 1;
        for (var i = 0; i < char.eliminatedWeeks.length; i++) {
            var elimWeek = parseInt(char.eliminatedWeeks[i]);
            if (!isNaN(elimWeek) && elimWeek <= weekNum) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Get all characters eliminated in a specific week
 * @param {number} week - Week number
 * @returns {Array} Array of eliminated character IDs
 */
function getEliminatedCharacters(week) {
    var weekNum = parseInt(week) || 1;
    var result = [];
    data.characters.forEach(function(char) {
        if (isCharacterEliminated(char.id, weekNum)) {
            result.push(char.id);
        }
    });
    return result;
}

/**
 * Get team member count (active members only)
 * @param {Object} team - Team object
 * @param {number} week - Week to check
 * @returns {number} Number of active members
 */
function getActiveTeamMemberCount(team, week) {
    if (!team || !team.members) return 0;
    var weekNum = parseInt(week) || 1;
    var count = 0;
    team.members.forEach(function(member) {
        var join = parseInt(member.joinPeriod);
        var leave = parseInt(member.leavePeriod);
        if (!isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum)) {
            count++;
        }
    });
    return count;
}

/**
 * Get active members of a team
 * @param {Object} team - Team object
 * @param {number} week - Week to check
 * @returns {Array} Array of active members
 */
function getActiveTeamMembers(team, week) {
    if (!team || !team.members) return [];
    var weekNum = parseInt(week) || 1;
    var result = [];
    team.members.forEach(function(member) {
        var join = parseInt(member.joinPeriod);
        var leave = parseInt(member.leavePeriod);
        if (!isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum)) {
            result.push(member);
        }
    });
    return result;
}

/**
 * Get character name by ID
 * @param {string} charId - Character ID
 * @returns {string} Character name or 'Unknown'
 */
function getCharacterNameById(charId) {
    if (!charId) return 'Unknown';
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (char) {
        return [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    return 'Unknown';
}

/**
 * Get character by ID
 * @param {string} charId - Character ID
 * @returns {Object|null} Character object or null
 */
function getCharacterById(charId) {
    if (!charId) return null;
    return data.characters.find(function(c) { return String(c.id) === String(charId); });
}

/**
 * Get character's current team(s) during a specific week
 * @param {string} charId - Character ID
 * @param {number} week - Week number
 * @returns {Array} Array of team names the character is in
 */
function getCharacterCurrentTeams(charId, week) {
    var weekNum = parseInt(week) || 1;
    var teams = [];
    data.teams.forEach(function(team) {
        if (team.status === 'deleted') return;
        if (team.members) {
            team.members.forEach(function(member) {
                if (String(member.characterId) === String(charId)) {
                    var join = parseInt(member.joinPeriod);
                    var leave = parseInt(member.leavePeriod);
                    if (!isNaN(join) && join <= weekNum && (isNaN(leave) || leave >= weekNum)) {
                        teams.push(team.name);
                    }
                }
            });
        }
    });
    return teams;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    return date.toLocaleDateString();
}

/**
 * Truncate a string to a certain length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Make utils available globally
window.utils = {
    generateId,
    getWeekBlock,
    getRankingBlock,
    calculateAge,
    getCharacterAge,
    getCurrentStatus,
    getCharacterTeamCount,
    getParticipantName,
    getActiveTeamsForWeek,
    getAllActiveTeams,
    getTeamsByType,
    logActivity,
    getStudents,
    getNonCivilianCharacters,
    getInstructors,
    getDiscipline,
    getAvailableDisciplines,
    getStudentSchedule,
    getTotalHours,
    getDisciplineHours,
    isCharacterEliminated,
    getEliminatedCharacters,
    getActiveTeamMemberCount,
    getActiveTeamMembers,
    getCharacterNameById,
    getCharacterById,
    getCharacterCurrentTeams,
    formatDate,
    truncateString,
    debounce
};

// Also expose individual functions globally for convenience
window.generateId = generateId;
window.getWeekBlock = getWeekBlock;
window.getRankingBlock = getRankingBlock;
window.calculateAge = calculateAge;
window.getCharacterAge = getCharacterAge;
window.getCurrentStatus = getCurrentStatus;
window.getCharacterTeamCount = getCharacterTeamCount;
window.getParticipantName = getParticipantName;
window.getActiveTeamsForWeek = getActiveTeamsForWeek;
window.getAllActiveTeams = getAllActiveTeams;
window.getTeamsByType = getTeamsByType;
window.logActivity = logActivity;
window.getStudents = getStudents;
window.getNonCivilianCharacters = getNonCivilianCharacters;
window.getInstructors = getInstructors;
window.getDiscipline = getDiscipline;
window.getAvailableDisciplines = getAvailableDisciplines;
window.getStudentSchedule = getStudentSchedule;
window.getTotalHours = getTotalHours;
window.getDisciplineHours = getDisciplineHours;
window.isCharacterEliminated = isCharacterEliminated;
window.getEliminatedCharacters = getEliminatedCharacters;
window.getActiveTeamMemberCount = getActiveTeamMemberCount;
window.getActiveTeamMembers = getActiveTeamMembers;
window.getCharacterNameById = getCharacterNameById;
window.getCharacterById = getCharacterById;
window.getCharacterCurrentTeams = getCharacterCurrentTeams;
window.formatDate = formatDate;
window.truncateString = truncateString;
window.debounce = debounce;
