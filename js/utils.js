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
        if (team.members && team.members.some(m => m.characterId === charId)) {
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
 * Get active teams for a given week
 * @param {number} week - Week number
 * @param {string} excludeTournamentId - Optional tournament ID to exclude
 * @returns {Array} Array of active teams
 */
function getActiveTeamsForWeek(week, excludeTournamentId) {
    const weekNum = parseInt(week) || 1;
    const block = getWeekBlock(weekNum);
    
    return data.teams.filter(team => {
        if (team.status === 'deleted') return false;
        if (team.type !== 'academic') return false;
        
        const start = parseInt(team.startPeriod);
        const end = parseInt(team.endPeriod);
        if (isNaN(start)) return false;
        
        return start <= block.end && (isNaN(end) || end >= block.start);
    }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all teams (both academic and professional)
 * @param {string} excludeTournamentId - Optional tournament ID to exclude
 * @returns {Array} Array of all active teams
 */
function getAllActiveTeams(excludeTournamentId) {
    return data.teams.filter(team => {
        if (team.status === 'deleted') return false;
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Log an activity entry
 * @param {string} message - Activity message
 * @param {string} type - Activity type (info, warning, etc.)
 */
function logActivity(message, type = 'info') {
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
        data.curriculum = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
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
    logActivity,
    getStudents,
    getNonCivilianCharacters,
    getInstructors,
    getDiscipline,
    getAvailableDisciplines,
    getStudentSchedule,
    getTotalHours,
    getDisciplineHours
};
