/**
 * database.js - IndexedDB Operations
 * Handles all persistent storage for the Tournament Manager application
 */

const DB_NAME = 'TournamentManagerDB';
const DB_VERSION = 4;
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
                        currentWeek: 1
                    };
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
                        currentWeek: 1
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
    // Ensure curriculum exists
    if (!data.curriculum) {
        data.curriculum = {
            disciplines: [],
            schedules: {},
            restDays: {},
            examDays: {},
            grades: {},
            rankings: {},
            currentWeek: 1
        };
    }
    
    // Migrate characters
    data.characters.forEach(char => {
        if (char.deceased === undefined) char.deceased = false;
        if (!char.careerStatus) char.careerStatus = [];
        if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
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
    });
    
    // Migrate teams
    data.teams.forEach(team => {
        if (!team.nameHistory) team.nameHistory = [];
        if (!team.rankingHistory) team.rankingHistory = [];
        if (!team.members) team.members = [];
        if (!team.status) team.status = 'active';
        if (!team.currentRank) team.currentRank = '';
        if (!team.startPeriod) team.startPeriod = '';
        if (!team.endPeriod) team.endPeriod = '';
        if (!team.type) team.type = 'academic';
    });
    
    // Migrate tournaments
    data.tournaments.forEach(tourn => {
        if (!tourn.eliminations) tourn.eliminations = [];
        if (!tourn.matches) tourn.matches = [];
        if (!tourn.participants) tourn.participants = [];
        if (!tourn.teams) tourn.teams = [];
        if (!tourn.mode) tourn.mode = 'team';
        if (!tourn.eliminationsPerRound) tourn.eliminationsPerRound = 4;
        if (!tourn.status) tourn.status = 'draft';
        if (!tourn.academicYear) tourn.academicYear = '';
        if (!tourn.description) tourn.description = '';
        if (!tourn.winners) tourn.winners = [];
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