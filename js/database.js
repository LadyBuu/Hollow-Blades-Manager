/**
 * database.js - IndexedDB Operations
 * Handles all persistent storage for the Tournament Manager application
 */

const DB_NAME = 'TournamentManagerDB';
const DB_VERSION = 8;
const STORE_NAME = 'tournamentData';

let db = null;

/**
 * Open or create the IndexedDB database
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
 */
function loadData() {
    console.log('loadData called');
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
                
                // Ensure ALL required top-level properties exist
                if (!loadedData.tournaments) loadedData.tournaments = [];
                if (!loadedData.characters) loadedData.characters = [];
                if (!loadedData.teams) loadedData.teams = [];
                if (!loadedData.missions) loadedData.missions = [];
                if (!loadedData.activities) loadedData.activities = [];
                if (!loadedData.currentYear) loadedData.currentYear = new Date().getFullYear();
                if (!loadedData.currentWeek) loadedData.currentWeek = 1;
                
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
                
                // Ensure social data exists
                if (!loadedData.social) {
                    loadedData.social = {
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
                    };
                }
                if (!loadedData.social.relationships) {
                    loadedData.social.relationships = [];
                }
                if (!loadedData.social.relationshipTypes) {
                    loadedData.social.relationshipTypes = [
                        { id: 'familiar', label: 'Familiar', color: '#8cbb3a' },
                        { id: 'professional', label: 'Professional', color: '#c9a24b' },
                        { id: 'romantic', label: 'Romantic', color: '#c1453c' },
                        { id: 'friendship', label: 'Friendship', color: '#4a9bc7' },
                        { id: 'mentor', label: 'Mentor/Mentee', color: '#9b59b6' },
                        { id: 'rivalry', label: 'Rivalry', color: '#e67e22' },
                        { id: 'alliance', label: 'Alliance', color: '#27ae60' },
                        { id: 'other', label: 'Other', color: '#7f8c8d' }
                    ];
                }
                if (!loadedData.social.nextId) {
                    loadedData.social.nextId = 1;
                }
                
                // Make sure global data is set
                window.data = loadedData;
                data = loadedData;
                
                console.log('Data loaded successfully:', {
                    tournaments: data.tournaments ? data.tournaments.length : 0,
                    characters: data.characters ? data.characters.length : 0,
                    teams: data.teams ? data.teams.length : 0,
                    social: data.social ? data.social.relationships.length : 0
                });
                
                migrateData();
                resolve(data);
            } else {
                console.log('No data found in IndexedDB, initializing empty data');
                window.data = {
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
                data = window.data;
                resolve(data);
            }
        };
        request.onerror = () => {
            console.error('IndexedDB load error:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Save all application data to IndexedDB
 */
function saveData() {
    console.log('saveData called');
    return new Promise((resolve, reject) => {
        if (!db) {
            return openDatabase()
                .then(() => saveData())
                .then(resolve)
                .catch(reject);
        }
        
        // Ensure data is the global data
        if (window.data) {
            data = window.data;
        }
        
        // Ensure ALL required top-level properties exist
        if (!data.tournaments) data.tournaments = [];
        if (!data.characters) data.characters = [];
        if (!data.teams) data.teams = [];
        if (!data.missions) data.missions = [];
        if (!data.activities) data.activities = [];
        if (!data.currentYear) data.currentYear = new Date().getFullYear();
        if (!data.currentWeek) data.currentWeek = 1;
        
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
        
        if (!data.social) {
            data.social = {
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
            };
        }
        if (!data.social.relationships) data.social.relationships = [];
        if (!data.social.relationshipTypes) {
            data.social.relationshipTypes = [
                { id: 'familiar', label: 'Familiar', color: '#8cbb3a' },
                { id: 'professional', label: 'Professional', color: '#c9a24b' },
                { id: 'romantic', label: 'Romantic', color: '#c1453c' },
                { id: 'friendship', label: 'Friendship', color: '#4a9bc7' },
                { id: 'mentor', label: 'Mentor/Mentee', color: '#9b59b6' },
                { id: 'rivalry', label: 'Rivalry', color: '#e67e22' },
                { id: 'alliance', label: 'Alliance', color: '#27ae60' },
                { id: 'other', label: 'Other', color: '#7f8c8d' }
            ];
        }
        if (!data.social.nextId) data.social.nextId = 1;
        
        // Ensure all tournaments have required fields
        data.tournaments.forEach(function(t) {
            if (!t.participants) t.participants = [];
            if (!t.rounds) t.rounds = [];
            if (!t.eliminations) t.eliminations = [];
            if (!t.winners) t.winners = [];
            if (!t.mode) t.mode = 'teams';
            if (!t.status) t.status = 'draft';
            if (!t.totalRounds) t.totalRounds = 1;
            if (!t.startWeek) t.startWeek = 1;
            if (!t.endWeek) t.endWeek = 52;
            if (!t.winner) t.winner = null;
        });
        
        console.log('Saving data to IndexedDB:', {
            tournaments: data.tournaments.length,
            characters: data.characters.length,
            teams: data.teams.length,
            social: data.social.relationships.length
        });
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const record = {
            id: 'mainData',
            data: data,
            updatedAt: new Date().toISOString()
        };
        const request = store.put(record);
        
        request.onsuccess = () => {
            console.log('Data saved successfully to IndexedDB');
            resolve();
        };
        request.onerror = () => {
            console.error('IndexedDB save error:', request.error);
            reject(request.error);
        };
        transaction.onerror = function(event) {
            console.error('Transaction error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Migrate existing data to current structure
 */
function migrateData() {
    console.log('Migrating data...');
    
    if (!data.tournaments) data.tournaments = [];
    if (!data.characters) data.characters = [];
    if (!data.teams) data.teams = [];
    if (!data.missions) data.missions = [];
    if (!data.activities) data.activities = [];
    
    // Migrate tournaments - ensure arrays
    data.tournaments.forEach(function(tourn) {
        if (!tourn.mode) tourn.mode = 'teams';
        if (!tourn.status) tourn.status = 'draft';
        if (!tourn.participants || !Array.isArray(tourn.participants)) tourn.participants = [];
        if (!tourn.rounds || !Array.isArray(tourn.rounds)) tourn.rounds = [];
        if (!tourn.eliminations || !Array.isArray(tourn.eliminations)) tourn.eliminations = [];
        if (!tourn.winners || !Array.isArray(tourn.winners)) tourn.winners = [];
        if (!tourn.totalRounds) tourn.totalRounds = 1;
        if (!tourn.startWeek) tourn.startWeek = 1;
        if (!tourn.endWeek) tourn.endWeek = 52;
        if (!tourn.winner) tourn.winner = null;
        if (!tourn.currentRound) tourn.currentRound = 0;
        if (!tourn.createdAt) tourn.createdAt = new Date().toISOString();
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
        if (!char.notes) char.notes = '';
        if (!char.gender) char.gender = '';
        char.careerStatus.forEach(function(status) {
            if (!status.status) status.status = 'civilian';
            if (!status.startYear) status.startYear = '';
            if (!status.endYear) status.endYear = '';
        });
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
        team.members.forEach(function(member) {
            if (!member.role) member.role = 'Member';
            if (!member.joinPeriod) member.joinPeriod = '';
            if (!member.leavePeriod) member.leavePeriod = '';
        });
    });
    
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
    
    // Curriculum migration
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
    if (!data.curriculum.disciplines) data.curriculum.disciplines = [];
    if (!data.curriculum.schedules) data.curriculum.schedules = {};
    if (!data.curriculum.restDays) data.curriculum.restDays = {};
    if (!data.curriculum.examDays) data.curriculum.examDays = {};
    if (!data.curriculum.grades) data.curriculum.grades = {};
    if (!data.curriculum.rankings) data.curriculum.rankings = {};
    if (!data.curriculum.currentWeek) data.curriculum.currentWeek = 1;
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
    
    // Social migration
    if (!data.social) {
        data.social = {
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
        };
    }
    if (!data.social.relationships) data.social.relationships = [];
    if (!data.social.relationshipTypes) {
        data.social.relationshipTypes = [
            { id: 'familiar', label: 'Familiar', color: '#8cbb3a' },
            { id: 'professional', label: 'Professional', color: '#c9a24b' },
            { id: 'romantic', label: 'Romantic', color: '#c1453c' },
            { id: 'friendship', label: 'Friendship', color: '#4a9bc7' },
            { id: 'mentor', label: 'Mentor/Mentee', color: '#9b59b6' },
            { id: 'rivalry', label: 'Rivalry', color: '#e67e22' },
            { id: 'alliance', label: 'Alliance', color: '#27ae60' },
            { id: 'other', label: 'Other', color: '#7f8c8d' }
        ];
    }
    if (!data.social.nextId) data.social.nextId = 1;
    
    console.log('Migration complete');
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================

// Make loadData, saveData globally available
window.loadData = loadData;
window.saveData = saveData;
window.openDatabase = openDatabase;
window.migrateData = migrateData;

// Also export via db object
window.db = {
    openDatabase: openDatabase,
    loadData: loadData,
    saveData: saveData,
    migrateData: migrateData
};

console.log('database.js loaded');
