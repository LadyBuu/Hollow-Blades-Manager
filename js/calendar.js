/**
 * calendar.js - Calendar and Weekly View
 * Handles weekly team view, calendar rendering, and schedule management
 */

// Weekly view state
let currentStartWeek = 1;
const visibleWeeks = 8;

/**
 * Render the weekly view (teams, unassigned characters, eliminations, rankings)
 */
function renderWeeklyView() {
    renderWeeklyTable();
    renderUnassignedCharacters();
    renderEliminatedCharacters();
    renderTeamRankings();
    updateWeeklyRangeDisplay();
}

/**
 * Render the weekly table with team memberships
 */
function renderWeeklyTable() {
    const tbody = document.getElementById('weekly-teams-body');
    if (!tbody) return;

    const teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    
    teams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    if (teams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="27" class="empty-state">No teams created yet. Add your first team!</td></tr>';
        return;
    }

    const endWeek = Math.min(currentStartWeek + visibleWeeks * 2 - 1, 52);
    
    let html = '';
    teams.forEach(function(team) {
        html += '<tr class="team-row" data-team-id="' + team.id + '">';
        html += '<td class="team-name-cell"><strong>' + team.name + '</strong></td>';
        
        for (let w = currentStartWeek; w <= endWeek; w += 2) {
            const blockStart = w;
            const blockEnd = w + 1;
            const membersInBlock = getTeamMembersInBlock(team, blockStart, blockEnd);
            const isActive = isTeamActiveInBlock(team, blockStart, blockEnd);
            
            if (!isActive) {
                html += '<td class="week-cell inactive-team">—</td>';
                continue;
            }
            
            if (membersInBlock.length === 0) {
                html += '<td class="week-cell empty">—</td>';
                continue;
            }
            
            let memberHtml = '<div class="week-members">';
            membersInBlock.forEach(function(member) {
                const char = data.characters.find(function(c) { return String(c.id) === String(member.characterId); });
                const name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                const isEliminated = checkIfEliminatedInWeek(char, blockStart, blockEnd);
                const isDeceased = char && char.deceased;
                const memberClass = 'member-name' + (isEliminated ? ' eliminated' : '') + (isDeceased ? ' deceased' : '');
                memberHtml += '<span class="' + memberClass + '" title="' + (member.role || 'Member') + '">' + name + '</span>';
            });
            memberHtml += '</div>';
            
            html += '<td class="week-cell">' + memberHtml + '</td>';
        }
        
        html += '</tr>';
    });

    tbody.innerHTML = html;

    // Update week headers visibility
    const headers = document.querySelectorAll('.week-header');
    headers.forEach(function(th) {
        const weekNum = parseInt(th.dataset.week);
        if (weekNum >= currentStartWeek && weekNum <= endWeek) {
            th.style.display = '';
        } else {
            th.style.display = 'none';
        }
    });
}

/**
 * Get team members active in a specific week block
 */
function getTeamMembersInBlock(team, blockStart, blockEnd) {
    if (!team.members) return [];
    return team.members.filter(function(member) {
        const join = parseInt(member.joinPeriod);
        const leave = parseInt(member.leavePeriod);
        if (isNaN(join)) return false;
        return join <= blockEnd && (isNaN(leave) || leave >= blockStart);
    });
}

/**
 * Check if a team is active in a week block
 */
function isTeamActiveInBlock(team, blockStart, blockEnd) {
    const start = parseInt(team.startPeriod);
    const end = parseInt(team.endPeriod);
    if (isNaN(start)) return true;
    return start <= blockEnd && (isNaN(end) || end >= blockStart);
}

/**
 * Check if a character is eliminated in a week block
 */
function checkIfEliminatedInWeek(char, blockStart, blockEnd) {
    if (!char) return false;
    if (char.deceased) return true;
    if (!char.eliminatedWeeks) return false;
    return char.eliminatedWeeks.some(function(week) {
        const w = parseInt(week);
        return !isNaN(w) && w >= blockStart && w <= blockEnd;
    });
}

/**
 * Update the weekly range display
 */
function updateWeeklyRangeDisplay() {
    const rangeDisplay = document.getElementById('weekly-range-display');
    if (!rangeDisplay) return;
    
    const endWeek = Math.min(currentStartWeek + visibleWeeks * 2 - 1, 52);
    const startLabel = getWeekBlock(currentStartWeek).label;
    const endLabel = getWeekBlock(endWeek).label;
    rangeDisplay.textContent = 'Weeks ' + startLabel + ' - ' + endLabel;
}

/**
 * Navigate to previous weeks
 */
function prevWeeks() {
    if (currentStartWeek > 1) {
        currentStartWeek = Math.max(1, currentStartWeek - 2);
        renderWeeklyView();
    }
}

/**
 * Navigate to next weeks
 */
function nextWeeks() {
    if (currentStartWeek < 52) {
        currentStartWeek = Math.min(52, currentStartWeek + 2);
        renderWeeklyView();
    }
}

/**
 * Render unassigned characters for the current week block
 */
function renderUnassignedCharacters() {
    const container = document.getElementById('unassigned-characters');
    if (!container) return;

    const block = getWeekBlock(currentStartWeek || 1);
    const weekStart = block.start;
    const weekEnd = block.end;

    const assignedIds = [];
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members.forEach(function(member) {
                const join = parseInt(member.joinPeriod);
                const leave = parseInt(member.leavePeriod);
                if (!isNaN(join)) {
                    if (join <= weekEnd) {
                        if (isNaN(leave) || leave >= weekStart) {
                            assignedIds.push(member.characterId);
                        }
                    }
                }
            });
        }
    });

    const unassigned = data.characters.filter(function(char) {
        if (char.deceased) return false;
        // Check if eliminated during this block
        const isEliminated = checkIfEliminatedInWeek(char, weekStart, weekEnd);
        if (isEliminated) return false;
        return assignedIds.indexOf(char.id) === -1;
    });

    if (unassigned.length === 0) {
        container.innerHTML = '<p class="empty-state">All available characters assigned to teams</p>';
        return;
    }

    let html = '';
    unassigned.forEach(function(char) {
        const name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        const status = getCurrentStatus(char);
        html += '<div class="activity-item">' + name + ' <span style="color:var(--text-dim);font-size:0.75rem;">(' + status + ')</span></div>';
    });
    container.innerHTML = html;
}

/**
 * Render eliminated characters for the current week block
 */
function renderEliminatedCharacters() {
    var container = document.getElementById('eliminated-characters');
    if (!container) return;
    
    var block = getWeekBlock(currentStartWeek || 1);
    var weekStart = block.start;
    var weekEnd = block.end;
    
    var eliminatedEntries = [];
    
    data.tournaments.forEach(function(tourn) {
        if (tourn.eliminations) {
            tourn.eliminations.forEach(function(elim) {
                var week = parseInt(elim.week);
                if (!isNaN(week) && week >= weekStart && week <= weekEnd) {
                    var participant = { 
                        type: 'char', 
                        id: elim.characterId 
                    };
                    var name = getParticipantName(participant, tourn);
                    var teamName = '';
                    
                    var char = data.characters.find(function(c) { return String(c.id) === String(elim.characterId); });
                    if (char) {
                        // Find what team this character was in during this week
                        data.teams.forEach(function(team) {
                            if (team.members) {
                                team.members.forEach(function(member) {
                                    if (String(member.characterId) === String(char.id)) {
                                        var join = parseInt(member.joinPeriod);
                                        var leave = parseInt(member.leavePeriod);
                                        if (!isNaN(join) && join <= weekEnd && (isNaN(leave) || leave >= weekStart)) {
                                            teamName = team.name;
                                        }
                                    }
                                });
                            }
                        });
                    }
                    
                    eliminatedEntries.push({
                        name: name || 'Unknown',
                        team: teamName,
                        tournament: tourn.name || 'Unknown Tournament',
                        week: week,
                        round: elim.matchRound || '?'
                    });
                }
            });
        }
    });
    
    if (eliminatedEntries.length === 0) {
        container.innerHTML = '<p class="empty-state">No eliminations this block</p>';
        return;
    }
    
    var html = '';
    eliminatedEntries.forEach(function(entry) {
        var teamDisplay = entry.team ? ' (' + entry.team + ')' : '';
        var tournamentDisplay = entry.tournament || 'Unknown Tournament';
        html += '<div class="activity-item" style="color:var(--danger);">' +
            entry.name + teamDisplay + 
            ' <span style="font-size:0.75rem;">eliminated in ' + tournamentDisplay + 
            ' (Wk ' + entry.week + ', Round ' + entry.round + ')</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

/**
 * Render team rankings for the current week block
 */
function renderTeamRankings() {
    const container = document.getElementById('team-rankings');
    if (!container) return;

    const block = getWeekBlock(currentStartWeek || 1);
    const weekStart = block.start;
    const weekEnd = block.end;

    // Update label
    const label = document.getElementById('ranking-week-label');
    if (label) {
        label.textContent = 'Weeks ' + block.label;
    }

    const teams = data.teams.filter(function(t) { 
        return t.type === 'academic' && t.status !== 'deleted'; 
    });

    const ranked = [];
    teams.forEach(function(team) {
        if (team.rankingHistory) {
            team.rankingHistory.forEach(function(rank) {
                const period = parseInt(rank.period);
                if (!isNaN(period)) {
                    const rankBlock = getRankingBlock(period);
                    if (rankBlock && rankBlock.start <= weekEnd && rankBlock.end >= weekStart) {
                        ranked.push({
                            team: team,
                            rank: parseInt(rank.rank),
                            period: period,
                            blockLabel: rankBlock.label
                        });
                    }
                }
            });
        }
    });

    teams.forEach(function(team) {
        if (team.currentRank && !ranked.some(function(r) { return r.team.id === team.id; })) {
            const start = parseInt(team.startPeriod);
            const end = parseInt(team.endPeriod);
            if (!isNaN(start) && start <= weekEnd && (isNaN(end) || end >= weekStart)) {
                ranked.push({
                    team: team,
                    rank: parseInt(team.currentRank),
                    period: null,
                    blockLabel: 'Current'
                });
            }
        }
    });

    ranked.sort(function(a, b) { return a.rank - b.rank; });

    if (ranked.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams ranked for this block</p>';
        return;
    }

    let html = '';
    ranked.forEach(function(item) {
        const periodDisplay = item.blockLabel || 'Wk ' + item.period;
        html += '<div class="team-ranking-item">' +
            '<span class="rank">#' + item.rank + '</span>' +
            '<span class="team-name">' + item.team.name + '</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + periodDisplay + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

// Make weekly navigation functions globally available
window.prevWeeks = prevWeeks;
window.nextWeeks = nextWeeks;

/**
 * Initialize weekly view events
 */
function initWeeklyEvents() {
    const prevBtn = document.getElementById('prev-weeks-btn');
    const nextBtn = document.getElementById('next-weeks-btn');
    
    if (prevBtn) {
        // Remove any existing listeners by cloning
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', prevWeeks);
    }
    if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', nextWeeks);
    }
}

// Export for use in other files
window.renderWeeklyView = renderWeeklyView;
window.initWeeklyEvents = initWeeklyEvents;
window.prevWeeks = prevWeeks;
window.nextWeeks = nextWeeks;
window.currentStartWeek = currentStartWeek;
window.visibleWeeks = visibleWeeks;
