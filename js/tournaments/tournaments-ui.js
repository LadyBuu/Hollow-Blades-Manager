/**
 * tournaments-ui.js - Tournament UI Rendering
 * Main view rendering and event handling
 */

// ... (keep all the existing functions up to initTournamentEvents)

/**
 * Initialize tournament events
 */
function initTournamentEvents() {
    var addBtn = document.getElementById('add-tournament-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showTournamentForm(); });
    }
    
    var closeFormBtn = document.getElementById('close-tournament-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeTournamentForm);
    }
    var cancelFormBtn = document.getElementById('cancel-tournament-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeTournamentForm);
    }
    var formModal = document.getElementById('tournament-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentForm();
        });
    }
    
    var form = document.getElementById('tournament-form-inner');
    if (form) {
        form.addEventListener('submit', saveTournament);
    }
    
    var closeDetailBtn = document.getElementById('close-tournament-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeTournamentDetail);
    }
    var detailModal = document.getElementById('tournament-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
    }
    
    var teamsModeBtn = document.getElementById('switch-teams-mode');
    var indModeBtn = document.getElementById('switch-individuals-mode');
    if (teamsModeBtn) {
        teamsModeBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                tourn.mode = 'teams';
                viewTournament(tournId);
            }
        });
    }
    if (indModeBtn) {
        indModeBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                tourn.mode = 'individuals';
                viewTournament(tournId);
            }
        });
    }
    
    // FIXED: Add Round button
    var addRoundBtn = document.getElementById('add-round-btn');
    if (addRoundBtn) {
        // Remove any existing listeners by cloning
        var newAddRoundBtn = addRoundBtn.cloneNode(true);
        addRoundBtn.parentNode.replaceChild(newAddRoundBtn, addRoundBtn);
        newAddRoundBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Add Round button clicked');
            // Call addRound from tournaments-individuals.js
            if (typeof window.addRound === 'function') {
                window.addRound();
            } else if (typeof addRound === 'function') {
                addRound();
            } else {
                alert('Add Round function not available. Please refresh the page.');
                console.error('addRound function not found');
            }
        });
    }
    
    var autoGenBtn = document.getElementById('auto-generate-rounds-btn');
    if (autoGenBtn) {
        autoGenBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                autoGenerateRounds(tournId);
            }
        });
    }
    
    var addTeamBtn = document.getElementById('add-team-to-tournament');
    if (addTeamBtn) {
        addTeamBtn.addEventListener('click', addTeamToTournament);
    }
    
    var addCharBtn = document.getElementById('add-char-to-tournament');
    if (addCharBtn) {
        addCharBtn.addEventListener('click', addCharacterToTournament);
    }
    
    var refreshBtn = document.getElementById('refresh-teams-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                populateTeamSelector(tourn);
                populateEliminationSelector(tourn);
            }
        });
    }
    var refreshCharsBtn = document.getElementById('refresh-chars-btn');
    if (refreshCharsBtn) {
        refreshCharsBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (tourn) {
                populateCharacterSelector(tourn);
                populateEliminationSelector(tourn);
            }
        });
    }
    
    var addMatchBtn = document.getElementById('add-match-btn');
    if (addMatchBtn) {
        addMatchBtn.addEventListener('click', addTeamMatch);
    }
    
    var addElimBtn = document.getElementById('add-elimination-btn');
    if (addElimBtn) {
        addElimBtn.addEventListener('click', addElimination);
    }
    
    var removeElimBtn = document.getElementById('remove-elimination-btn');
    if (removeElimBtn) {
        removeElimBtn.addEventListener('click', function() {
            var modal = document.getElementById('tournament-detail-modal');
            var tournId = modal.dataset.tournamentId;
            var tourn = getTournament(tournId);
            if (!tourn || !tourn.eliminations) return;
            
            var select = document.getElementById('elim-character-select');
            var selectedValue = select.value;
            if (!selectedValue) { alert('Please select a character to remove from eliminations.'); return; }
            if (!confirm('Remove this character from eliminations?')) return;
            
            var index = tourn.eliminations.findIndex(function(e) { return String(e.characterId) === String(selectedValue); });
            if (index === -1) { alert('Character not found in eliminations.'); return; }
            
            removeElimination(tournId, index);
        });
    }
    
    // Match detail modal events
    var closeMatchDetail = document.getElementById('close-match-detail');
    if (closeMatchDetail) {
        closeMatchDetail.addEventListener('click', function() {
            document.getElementById('match-detail-modal').classList.add('hidden');
        });
    }
    var cancelMatchDetail = document.getElementById('cancel-match-detail');
    if (cancelMatchDetail) {
        cancelMatchDetail.addEventListener('click', function() {
            document.getElementById('match-detail-modal').classList.add('hidden');
        });
    }
}

// Make functions globally available
window.renderTournamentsView = renderTournamentsView;
window.renderTournamentsList = renderTournamentsList;
window.viewTournament = viewTournament;
window.initTournamentEvents = initTournamentEvents;
window.populateEliminationSelector = populateEliminationSelector;
window.renderEliminations = renderEliminations;
window.addElimination = addElimination;
window.removeElimination = removeElimination;
window.renderWinner = renderWinner;
window.deleteTournament = deleteTournament;
