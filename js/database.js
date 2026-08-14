/**
 * database.js - IndexedDB Operations
 * Handles all persistent storage for the Tournament Manager application
 */

const DB_NAME = 'TournamentManagerDB';
const DB_VERSION = 6;
const STORE_NAME = 'tournamentData';

let db = null;

/**
 * Open or create the IndexedDB database
 * @returns {Promise} Resolves with database instance
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Load all application data from IndexedDB
 * @returns {Promise} Resolves with the loaded data object
 */
function loadData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            return openDatabase()
                .then(() => loadData())
                .then(resolve)
                .catch(reject);
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('mainData');
        
        request.onsuccess = () => {
            if (request.result && request.result.data) {
                const loadedData = request.result.data;
                // Ensure curriculum object exists
                if (!loadedData.curriculum) {
                    loadedData.curriculum = {
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
                // Ensure missions exists
                if (!loadedData.missions) {
                    loadedData.missions = [];
                }
                data = loadedData;
                migrateData();
                resolve(data);
            } else {
                // Initialize with default empty data
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
                    }
                };
                resolve(data);
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save all application data to IndexedDB
 * @returns {Promise} Resolves when save is complete
 */
function saveData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            return openDatabase()
                .then(() => saveData())
                .then(resolve)
                .catch(reject);
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const record = {
            id: 'mainData',
            data: data,
            updatedAt: new Date().toISOString()
        };
        const request = store.put(record);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Migrate existing data to current structure
 * Ensures all required fields exist
 */
function migrateData() {
    // Ensure curriculum exists with all required sub-objects
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
    
    // Ensure all curriculum sub-objects exist
    if (!data.curriculum.schedules) data.curriculum.schedules = {};
    if (!data.curriculum.restDays) data.curriculum.restDays = {};
    if (!data.curriculum.examDays) data.curriculum.examDays = {};
    if (!data.curriculum.grades) data.curriculum.grades = {};
    if (!data.curriculum.rankings) data.curriculum.rankings = {};
    if (!data.curriculum.classInstructors) data.curriculum.classInstructors = {};
    if (!data.curriculum.classLabels) data.curriculum.classLabels = {};
    if (!data.curriculum.classGroupLabels) data.curriculum.classGroupLabels = {};
    if (!data.curriculum.classDurations) data.curriculum.classDurations = {};
    if (!data.curriculum.instructorClasses) data.curriculum.instructorClasses = {};
    if (!data.curriculum.instructorTemplates) data.curriculum.instructorTemplates = {};
    if (!data.curriculum.instructorBlocks) data.curriculum.instructorBlocks = {};
    if (!data.curriculum.instructorGroups) data.curriculum.instructorGroups = {};
    if (!data.curriculum.disciplineGroups) data.curriculum.disciplineGroups = {};
    if (!data.curriculum.autoGroups) data.curriculum.autoGroups = {};
    if (!data.curriculum.currentWeek) data.curriculum.currentWeek = 1;
    
    // Ensure disciplines array exists
    if (!data.curriculum.disciplines) data.curriculum.disciplines = [];
    
    // Migrate disciplines - ensure each has all required fields
    data.curriculum.disciplines.forEach(function(discipline) {
        if (!discipline.type) discipline.type = 'mandatory';
        if (!discipline.instructorIds) discipline.instructorIds = [];
        if (!discipline.weight) discipline.weight = 1;
        if (!discipline.gradingSystem) discipline.gradingSystem = [];
        if (!discipline.curriculum) discipline.curriculum = '';
        if (!discipline.startWeek) discipline.startWeek = '';
        if (!discipline.endWeek) discipline.endWeek = '';
        if (!discipline.weeklyHours) discipline.weeklyHours = '';
        if (!discipline.maxStudents) discipline.maxStudents = '';
        // Convert old instructorId to instructorIds array if needed
        if (discipline.instructorId && !discipline.instructorIds.length) {
            discipline.instructorIds = [discipline.instructorId];
        }
    });
    
    // Ensure missions exists
    if (!data.missions) {
        data.missions = [];
    }
    
    // Migrate missions
    data.missions.forEach(function(mission) {
        if (!mission.status) mission.status = 'active';
        if (!mission.createdAt) mission.createdAt = new Date().toISOString();
        if (!mission.completedAt) mission.completedAt = null;
        if (!mission.assignedTeamId) mission.assignedTeamId = null;
        if (!mission.priority) mission.priority = 'medium';
        if (!mission.tags) mission.tags = [];
        if (!mission.objectives) mission.objectives = [];
        if (!mission.progress) mission.progress = 0;
        if (!mission.log) mission.log = [];
        if (!mission.notes) mission.notes = '';
        if (!mission.location) mission.location = '';
        if (!mission.duration) mission.duration = '';
        if (!mission.difficulty) mission.difficulty = 'medium';
        if (!mission.pay) mission.pay = '';
        if (!mission.objective) mission.objective = '';
    });
    
    // Migrate characters
    data.characters.forEach(function(char) {
        if (char.deceased === undefined) char.deceased = false;
        if (!char.careerStatus) char.careerStatus = [];
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
        if (!char.eliminations) char.eliminations = [];
        if (!char.middleName) char.middleName = '';
        if (!char.lastName) char.lastName = '';
        if (!char.associatedNames) char.associatedNames = '';
        if (!char.eyes) char.eyes = '';
        if (!char.hair) char.hair = '';
        if (!char.skin) char.skin = '';
        if (!char.height) char.height = '';
        if (!char.build) char.build = '';
        if (!char.appearanceNotes) char.appearanceNotes = '';
        if (!char.specialty) char.specialty = '';
        if (!char.deathYear) char.deathYear = '';
        if (!char.deathCause) char.deathCause = '';
        if (!char.deathAge) char.deathAge = '';
        // Ensure career status entries have all fields
        char.careerStatus.forEach(function(status) {
            if (!status.status) status.status = 'civilian';
            if (!status.startYear) status.startYear = '';
            if (!status.endYear) status.endYear = '';
        });
        // Ensure elimination entries have all fields
        char.eliminations.forEach(function(elim) {
            if (!elim.tournamentId) elim.tournamentId = '';
            if (!elim.week) elim.week = '';
            if (!elim.reason) elim.reason = 'Eliminated from tournament';
        });
    });
    
    // Migrate teams
    data.teams.forEach(function(team) {
        if (!team.nameHistory) team.nameHistory = [];
        if (!team.rankingHistory) team.rankingHistory = [];
        if (!team.members) team.members = [];
        if (!team.status) team.status = 'active';
        if (!team.currentRank) team.currentRank = '';
        if (!team.startPeriod) team.startPeriod = '';
        if (!team.endPeriod) team.endPeriod = '';
        if (!team.type) team.type = 'academic';
        if (!team.temporaryMission) team.temporaryMission = null;
        // Ensure members have all fields
        team.members.forEach(function(member) {
            if (!member.role) member.role = 'Member';
            if (!member.joinPeriod) member.joinPeriod = '';
            if (!member.leavePeriod) member.leavePeriod = '';
        });
        // Ensure name history entries have all fields
        team.nameHistory.forEach(function(entry) {
            if (!entry.name) entry.name = '';
            if (!entry.startPeriod) entry.startPeriod = '';
            if (!entry.endPeriod) entry.endPeriod = '';
        });
        // Ensure ranking history entries have all fields
        team.rankingHistory.forEach(function(entry) {
            if (!entry.period) entry.period = '';
            if (!entry.rank) entry.rank = '';
        });
    });
    
    // Migrate tournaments - COMPLETE MIGRATION for new structure
    data.tournaments.forEach(function(tourn) {
        // Basic fields
        if (!tourn.status) tourn.status = 'active';
        if (!tourn.createdAt) tourn.createdAt = new Date().toISOString();
        if (!tourn.startWeek) tourn.startWeek = '1';
        if (!tourn.endWeek) tourn.endWeek = '4';
        if (!tourn.academicYear) tourn.academicYear = '';
        if (!tourn.winner) tourn.winner = null;
        
        // Teams array - convert old format if needed
        if (!tourn.teams) tourn.teams = [];
        tourn.teams = tourn.teams.map(function(entry) {
            if (typeof entry === 'string') {
                return { teamId: entry };
            }
            if (!entry.teamId) return null;
            return { teamId: entry.teamId };
        }).filter(function(entry) { return entry !== null; });
        
        // Matches array - convert old format if needed
        if (!tourn.matches) tourn.matches = [];
        tourn.matches = tourn.matches.map(function(match) {
            // Handle old format with participant1/participant2
            if (match.participant1 && match.participant2) {
                var team1Id = null;
                var team2Id = null;
                if (match.participant1.type === 'team') team1Id = match.participant1.id;
                if (match.participant2.type === 'team') team2Id = match.participant2.id;
                if (team1Id && team2Id) {
                    return {
                        team1Id: team1Id,
                        team2Id: team2Id,
                        winner: match.winner ? match.winner.id : null
                    };
                }
                return null;
            }
            // New format
            if (!match.team1Id || !match.team2Id) return null;
            return {
                team1Id: match.team1Id,
                team2Id: match.team2Id,
                winner: match.winner || null
            };
        }).filter(function(match) { return match !== null; });
        
        // Eliminations array - convert old format if needed
        if (!tourn.eliminations) tourn.eliminations = [];
        tourn.eliminations = tourn.eliminations.map(function(elim) {
            // Handle old format with participantId/participantType
            if (elim.participantId && elim.participantType === 'char') {
                return {
                    characterId: elim.participantId,
                    week: parseInt(elim.week) || 1,
                    teamId: elim.teamId || null
                };
            }
            // Handle old format with characterId
            if (elim.characterId) {
                return {
                    characterId: elim.characterId,
                    week: parseInt(elim.week) || 1,
                    teamId: elim.teamId || null
                };
            }
            return null;
        }).filter(function(elim) { return elim !== null && elim.characterId; });
        
        // Remove old fields
        delete tourn.mode;
        delete tourn.eliminationsPerRound;
        delete tourn.description;
        delete tourn.participants;
        delete tourn.winners;
        delete tourn.bracket;
    });
    
    // Ensure activities exists
    if (!data.activities) data.activities = [];
    
    // Ensure current year and week exist
    if (!data.currentYear) data.currentYear = new Date().getFullYear();
    if (!data.currentWeek) data.currentWeek = 1;
}

// Export for use in other files
window.db = {
    openDatabase,
    loadData,
    saveData,
    migrateData
};
