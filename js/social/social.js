/**
 * social.js - Social Network Manager
 * Manages relationships between characters with types, dates, and notes
 * Includes SVG visualization of the social network
 */

// Social state
var socialState = {
    selectedCharacterId: null,
    viewMode: 'list', // 'list' or 'graph'
    zoomLevel: 1,
    panX: 0,
    panY: 0
};

/**
 * Initialize social system
 */
function initSocialSystem() {
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
    if (!data.social.relationships) {
        data.social.relationships = [];
    }
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
    if (!data.social.nextId) {
        data.social.nextId = 1;
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); });
}

/**
 * Get all relationships for a character
 */
function getCharacterRelationships(charId) {
    initSocialSystem();
    return data.social.relationships.filter(function(r) {
        return String(r.character1) === String(charId) || String(r.character2) === String(charId);
    });
}

/**
 * Get relationship between two characters
 */
function getRelationship(charId1, charId2) {
    initSocialSystem();
    return data.social.relationships.find(function(r) {
        return (String(r.character1) === String(charId1) && String(r.character2) === String(charId2)) ||
               (String(r.character1) === String(charId2) && String(r.character2) === String(charId1));
    });
}

/**
 * Create a new relationship
 */
function createRelationship(charId1, charId2, typeId, startYear, endYear, clarification, notes) {
    initSocialSystem();
    
    // Check if relationship already exists
    var existing = getRelationship(charId1, charId2);
    if (existing) {
        return { success: false, message: 'Relationship already exists between these characters.' };
    }
    
    var relationship = {
        id: data.social.nextId++,
        character1: charId1,
        character2: charId2,
        typeId: typeId || 'other',
        startYear: startYear || '',
        endYear: endYear || '',
        clarification: clarification || '',
        notes: notes || '',
        createdAt: new Date().toISOString()
    };
    
    data.social.relationships.push(relationship);
    
    if (typeof logActivity === 'function') {
        var char1 = getCharacterName(charId1);
        var char2 = getCharacterName(charId2);
        var typeLabel = getRelationshipTypeLabel(typeId);
        logActivity('Created ' + typeLabel + ' relationship between ' + char1 + ' and ' + char2);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return { success: true, relationship: relationship };
}

/**
 * Update a relationship
 */
function updateRelationship(id, updates) {
    initSocialSystem();
    var rel = data.social.relationships.find(function(r) { return String(r.id) === String(id); });
    if (!rel) return null;
    
    Object.assign(rel, updates);
    
    if (typeof logActivity === 'function') {
        var char1 = getCharacterName(rel.character1);
        var char2 = getCharacterName(rel.character2);
        logActivity('Updated relationship between ' + char1 + ' and ' + char2);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return rel;
}

/**
 * Delete a relationship
 */
function deleteRelationship(id) {
    initSocialSystem();
    var rel = data.social.relationships.find(function(r) { return String(r.id) === String(id); });
    if (!rel) return false;
    
    data.social.relationships = data.social.relationships.filter(function(r) { return String(r.id) !== String(id); });
    
    if (typeof logActivity === 'function') {
        var char1 = getCharacterName(rel.character1);
        var char2 = getCharacterName(rel.character2);
        logActivity('Deleted relationship between ' + char1 + ' and ' + char2);
    }
    
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    return true;
}

/**
 * Get character name by ID
 */
function getCharacterName(charId) {
    if (!charId) return 'Unknown';
    var char = data.characters.find(function(c) { return String(c.id) === String(charId); });
    if (char) {
        return [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
    }
    return 'Unknown';
}

/**
 * Get character by ID
 */
function getCharacterById(charId) {
    return data.characters.find(function(c) { return String(c.id) === String(charId); });
}

/**
 * Get relationship type label
 */
function getRelationshipTypeLabel(typeId) {
    var type = data.social.relationshipTypes.find(function(t) { return t.id === typeId; });
    return type ? type.label : typeId || 'Other';
}

/**
 * Get relationship type color
 */
function getRelationshipTypeColor(typeId) {
    var type = data.social.relationshipTypes.find(function(t) { return t.id === typeId; });
    return type ? type.color : '#7f8c8d';
}

/**
 * Get relationship type by ID
 */
function getRelationshipType(typeId) {
    return data.social.relationshipTypes.find(function(t) { return t.id === typeId; });
}

/**
 * Get all relationship types
 */
function getRelationshipTypes() {
    initSocialSystem();
    return data.social.relationshipTypes;
}

/**
 * Get connected characters for a character
 */
function getConnectedCharacters(charId) {
    var rels = getCharacterRelationships(charId);
    var connected = [];
    rels.forEach(function(r) {
        var otherId = String(r.character1) === String(charId) ? r.character2 : r.character1;
        var char = getCharacterById(otherId);
        if (char) {
            connected.push({
                character: char,
                relationship: r
            });
        }
    });
    return connected;
}

/**
 * Render the social view
 */
function renderSocialView(container) {
    initSocialSystem();
    
    container.innerHTML = `
        <div class="page-header">
            <h2>Social Network</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button id="add-relationship-btn" class="primary">+ Add Relationship</button>
                <button id="view-graph-btn" class="secondary">◈ View Network</button>
                <button id="view-list-btn" class="secondary">☰ View List</button>
            </div>
        </div>

        <div id="social-content">
            <div id="social-list-view">
                <div class="filter-section">
                    <label for="social-character-filter">Character:</label>
                    <select id="social-character-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;min-width:150px;">
                        <option value="all">All Characters</option>
                    </select>
                    <label for="social-type-filter" style="margin-left:8px;">Type:</label>
                    <select id="social-type-filter" style="background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:4px 8px;font-size:0.75rem;">
                        <option value="all">All Types</option>
                    </select>
                    <button id="clear-social-filters" class="small secondary">Clear</button>
                    <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Relationships: <span id="relationship-count">0</span></span>
                </div>
                <div id="relationships-container">
                    <p class="empty-state">No relationships created yet. Add your first relationship!</p>
                </div>
            </div>
            <div id="social-graph-view" style="display:none;">
                <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <span style="font-size:0.75rem;color:var(--text-dim);">Zoom: <span id="zoom-display">100%</span></span>
                    <button id="zoom-in-btn" class="small secondary">+</button>
                    <button id="zoom-out-btn" class="small secondary">-</button>
                    <button id="reset-zoom-btn" class="small secondary">⟲</button>
                    <span style="font-size:0.75rem;color:var(--text-dim);margin-left:8px;">Click a node to view character details</span>
                </div>
                <div id="graph-container" style="width:100%;height:600px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;position:relative;cursor:grab;">
                    <svg id="social-svg" width="100%" height="100%" style="display:block;background:var(--bg);"></svg>
                </div>
                <div id="graph-legend" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;padding:8px;background:var(--panel-alt);border-radius:var(--radius);border:1px solid var(--border);">
                    <span style="font-size:0.7rem;color:var(--text-dim);font-weight:600;">Legend:</span>
                    <span id="legend-items"></span>
                </div>
            </div>
        </div>

        <!-- Relationship Form Modal -->
        <div id="relationship-form-modal" class="modal hidden">
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3 id="relationship-form-title">Add Relationship</h3>
                    <button class="close-modal" id="close-relationship-form">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="relationship-form-inner">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Character 1 *</label>
                                <select id="rel-char1" required style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                    <option value="">Select character...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Character 2 *</label>
                                <select id="rel-char2" required style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                    <option value="">Select character...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Relationship Type *</label>
                                <select id="rel-type" required style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                                    <option value="">Select type...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Clarification (e.g., aunt, sibling, boss)</label>
                                <input type="text" id="rel-clarification" placeholder="e.g., aunt, sibling, boss" style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            </div>
                            <div class="form-group">
                                <label>Start Year</label>
                                <input type="number" id="rel-start-year" placeholder="e.g., 1920" style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            </div>
                            <div class="form-group">
                                <label>End Year (optional)</label>
                                <input type="number" id="rel-end-year" placeholder="e.g., 1930" style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;">
                            </div>
                            <div class="form-group full-width">
                                <label>Notes</label>
                                <textarea id="rel-notes" rows="3" placeholder="Additional notes about this relationship..." style="width:100%;padding:6px;background:var(--panel-alt);border:1px solid var(--border);color:var(--text);border-radius:6px;resize:vertical;"></textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-relationship-form" class="secondary">Cancel</button>
                            <button type="submit" id="save-relationship-btn" class="primary">Save Relationship</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Character Detail Modal -->
        <div id="character-detail-modal" class="modal hidden">
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3 id="detail-char-name">Character</h3>
                    <button class="close-modal" id="close-char-detail">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="char-detail-content"></div>
                </div>
            </div>
        </div>
    `;

    populateSocialSelectors();
    renderRelationships();
    initSocialEvents();
}

/**
 * Populate social selectors
 */
function populateSocialSelectors() {
    // Character filter
    var filterSelect = document.getElementById('social-character-filter');
    if (filterSelect) {
        var chars = data.characters || [];
        var currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">All Characters</option>';
        chars.sort(function(a, b) {
            var nameA = [a.firstName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            var nameB = [b.firstName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        chars.forEach(function(c) {
            var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
            var option = document.createElement('option');
            option.value = c.id;
            option.textContent = name;
            filterSelect.appendChild(option);
        });
        if (currentValue) filterSelect.value = currentValue;
    }
    
    // Type filter
    var typeFilter = document.getElementById('social-type-filter');
    if (typeFilter) {
        var types = getRelationshipTypes();
        var currentValue = typeFilter.value;
        typeFilter.innerHTML = '<option value="all">All Types</option>';
        types.forEach(function(t) {
            var option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.label;
            typeFilter.appendChild(option);
        });
        if (currentValue) typeFilter.value = currentValue;
    }
    
    // Form selectors
    populateFormSelectors();
    populateTypeSelectors();
}

/**
 * Populate form selectors
 */
function populateFormSelectors() {
    var select1 = document.getElementById('rel-char1');
    var select2 = document.getElementById('rel-char2');
    if (!select1 || !select2) return;
    
    var chars = data.characters || [];
    var current1 = select1.value;
    var current2 = select2.value;
    
    select1.innerHTML = '<option value="">Select character...</option>';
    select2.innerHTML = '<option value="">Select character...</option>';
    
    chars.sort(function(a, b) {
        var nameA = [a.firstName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    chars.forEach(function(c) {
        var name = [c.firstName, c.lastName].filter(function(n) { return n; }).join(' ');
        var option1 = document.createElement('option');
        option1.value = c.id;
        option1.textContent = name;
        select1.appendChild(option1);
        
        var option2 = document.createElement('option');
        option2.value = c.id;
        option2.textContent = name;
        select2.appendChild(option2);
    });
    
    if (current1) select1.value = current1;
    if (current2) select2.value = current2;
}

/**
 * Populate type selectors
 */
function populateTypeSelectors() {
    var typeSelect = document.getElementById('rel-type');
    if (!typeSelect) return;
    
    var types = getRelationshipTypes();
    var currentValue = typeSelect.value;
    typeSelect.innerHTML = '<option value="">Select type...</option>';
    types.forEach(function(t) {
        var option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.label;
        typeSelect.appendChild(option);
    });
    if (currentValue) typeSelect.value = currentValue;
}

/**
 * Render relationships list
 */
function renderRelationships() {
    var container = document.getElementById('relationships-container');
    var count = document.getElementById('relationship-count');
    if (!container) return;
    
    var charFilter = document.getElementById('social-character-filter')?.value || 'all';
    var typeFilter = document.getElementById('social-type-filter')?.value || 'all';
    
    var relationships = data.social.relationships || [];
    
    // Apply filters
    if (charFilter !== 'all') {
        relationships = relationships.filter(function(r) {
            return String(r.character1) === String(charFilter) || String(r.character2) === String(charFilter);
        });
    }
    if (typeFilter !== 'all') {
        relationships = relationships.filter(function(r) { return r.typeId === typeFilter; });
    }
    
    // Sort by creation date (newest first)
    relationships.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (count) count.textContent = relationships.length;
    
    if (relationships.length === 0) {
        container.innerHTML = '<p class="empty-state">No relationships found. Add your first relationship!</p>';
        return;
    }
    
    var html = '';
    relationships.forEach(function(rel) {
        var char1 = getCharacterById(rel.character1);
        var char2 = getCharacterById(rel.character2);
        var name1 = char1 ? [char1.firstName, char1.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var name2 = char2 ? [char2.firstName, char2.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var typeLabel = getRelationshipTypeLabel(rel.typeId);
        var typeColor = getRelationshipTypeColor(rel.typeId);
        var period = '';
        if (rel.startYear && rel.endYear) {
            period = rel.startYear + ' - ' + rel.endYear;
        } else if (rel.startYear) {
            period = 'From ' + rel.startYear;
        }
        var clarificationDisplay = rel.clarification ? ' (' + rel.clarification + ')' : '';
        
        html += '<div class="list-item" style="grid-template-columns:1fr 1fr 0.8fr 1.2fr 1fr;border-left:3px solid ' + typeColor + ';" data-id="' + rel.id + '">';
        html += '<span><strong>' + name1 + '</strong></span>';
        html += '<span><strong>' + name2 + '</strong></span>';
        html += '<span style="color:' + typeColor + ';font-size:0.75rem;font-weight:600;">' + typeLabel + clarificationDisplay + '</span>';
        html += '<span style="font-size:0.75rem;color:var(--text-dim);">' + period + (rel.notes ? ' 📝' : '') + '</span>';
        html += '<span class="actions">' +
            '<button class="small edit-relationship" data-id="' + rel.id + '">Edit</button>' +
            '<button class="small danger delete-relationship" data-id="' + rel.id + '">Delete</button>' +
        '</span>';
        html += '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-relationship').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showRelationshipForm(this.dataset.id);
        });
    });
    container.querySelectorAll('.delete-relationship').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteRelationshipHandler(this.dataset.id);
        });
    });
}

/**
 * Show relationship form
 */
function showRelationshipForm(editId) {
    var modal = document.getElementById('relationship-form-modal');
    var title = document.getElementById('relationship-form-title');
    var form = document.getElementById('relationship-form-inner');
    
    populateFormSelectors();
    populateTypeSelectors();
    
    modal.classList.remove('hidden');
    
    if (editId) {
        title.textContent = 'Edit Relationship';
        var rel = data.social.relationships.find(function(r) { return String(r.id) === String(editId); });
        if (rel) {
            document.getElementById('rel-char1').value = rel.character1 || '';
            document.getElementById('rel-char2').value = rel.character2 || '';
            document.getElementById('rel-type').value = rel.typeId || 'other';
            document.getElementById('rel-clarification').value = rel.clarification || '';
            document.getElementById('rel-start-year').value = rel.startYear || '';
            document.getElementById('rel-end-year').value = rel.endYear || '';
            document.getElementById('rel-notes').value = rel.notes || '';
            form.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Relationship';
        form.reset();
        document.getElementById('rel-type').value = 'other';
        delete form.dataset.editId;
    }
}

/**
 * Save relationship from form
 */
function saveRelationship(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    var char1 = document.getElementById('rel-char1').value;
    var char2 = document.getElementById('rel-char2').value;
    var typeId = document.getElementById('rel-type').value;
    var clarification = document.getElementById('rel-clarification').value.trim();
    var startYear = document.getElementById('rel-start-year').value;
    var endYear = document.getElementById('rel-end-year').value;
    var notes = document.getElementById('rel-notes').value.trim();
    
    if (!char1 || !char2) {
        alert('Please select both characters.');
        return;
    }
    if (char1 === char2) {
        alert('Cannot create a relationship between the same character.');
        return;
    }
    if (!typeId) {
        alert('Please select a relationship type.');
        return;
    }
    
    if (editId) {
        var updated = updateRelationship(editId, {
            character1: char1,
            character2: char2,
            typeId: typeId,
            clarification: clarification,
            startYear: startYear,
            endYear: endYear,
            notes: notes
        });
        if (updated) {
            closeRelationshipForm();
            renderRelationships();
            if (document.getElementById('social-graph-view').style.display !== 'none') {
                renderGraph();
            }
        }
    } else {
        var result = createRelationship(char1, char2, typeId, startYear, endYear, clarification, notes);
        if (result.success) {
            closeRelationshipForm();
            renderRelationships();
            if (document.getElementById('social-graph-view').style.display !== 'none') {
                renderGraph();
            }
        } else {
            alert(result.message);
        }
    }
}

/**
 * Close relationship form
 */
function closeRelationshipForm() {
    document.getElementById('relationship-form-modal').classList.add('hidden');
}

/**
 * Delete relationship handler
 */
function deleteRelationshipHandler(id) {
    if (!confirm('Delete this relationship permanently?')) return;
    if (deleteRelationship(id)) {
        renderRelationships();
        if (document.getElementById('social-graph-view').style.display !== 'none') {
            renderGraph();
        }
    }
}

/**
 * Render the social graph
 */
function renderGraph() {
    var svg = document.getElementById('social-svg');
    if (!svg) return;
    
    var container = document.getElementById('graph-container');
    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;
    
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    
    var relationships = data.social.relationships || [];
    if (relationships.length === 0) {
        svg.innerHTML = '<text x="' + (width/2) + '" y="' + (height/2) + '" text-anchor="middle" fill="var(--text-dim)" font-size="16">No relationships to display</text>';
        return;
    }
    
    // Build node list (unique characters)
    var nodeMap = {};
    var nodes = [];
    relationships.forEach(function(r) {
        if (!nodeMap[r.character1]) {
            nodeMap[r.character1] = { id: r.character1, connections: 0 };
            nodes.push(nodeMap[r.character1]);
        }
        if (!nodeMap[r.character2]) {
            nodeMap[r.character2] = { id: r.character2, connections: 0 };
            nodes.push(nodeMap[r.character2]);
        }
        nodeMap[r.character1].connections++;
        nodeMap[r.character2].connections++;
    });
    
    if (nodes.length < 2) {
        svg.innerHTML = '<text x="' + (width/2) + '" y="' + (height/2) + '" text-anchor="middle" fill="var(--text-dim)" font-size="16">Need at least 2 characters with relationships</text>';
        return;
    }
    
    // Calculate node positions using a simple force-directed layout
    var positions = calculatePositions(nodes, relationships, width, height);
    
    // Build HTML
    var html = '';
    
    // Draw edges (lines)
    relationships.forEach(function(r) {
        var pos1 = positions[r.character1];
        var pos2 = positions[r.character2];
        if (!pos1 || !pos2) return;
        
        var color = getRelationshipTypeColor(r.typeId);
        var typeLabel = getRelationshipTypeLabel(r.typeId);
        var clarification = r.clarification ? ' (' + r.clarification + ')' : '';
        
        // Draw the line
        html += '<line x1="' + pos1.x + '" y1="' + pos1.y + '" x2="' + pos2.x + '" y2="' + pos2.y + '" ';
        html += 'stroke="' + color + '" stroke-width="2" opacity="0.6" />';
        
        // Draw a small label in the middle
        var midX = (pos1.x + pos2.x) / 2;
        var midY = (pos1.y + pos2.y) / 2;
        html += '<text x="' + midX + '" y="' + (midY - 5) + '" text-anchor="middle" fill="' + color + '" font-size="9" opacity="0.7">' + typeLabel + clarification + '</text>';
    });
    
    // Draw nodes (circles with labels)
    nodes.forEach(function(node) {
        var pos = positions[node.id];
        if (!pos) return;
        
        var char = getCharacterById(node.id);
        var name = char ? [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var status = char ? getCurrentStatus(char) : '';
        var radius = Math.max(20, Math.min(35, 20 + node.connections * 3));
        var color = getNodeColor(char);
        
        // Shadow
        html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + radius + '" fill="rgba(0,0,0,0.3)" opacity="0.3" />';
        
        // Main circle
        html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + radius + '" fill="' + color + '" stroke="var(--border)" stroke-width="2" cursor="pointer" class="graph-node" data-id="' + node.id + '" />';
        
        // Name label
        var fontSize = Math.max(9, Math.min(13, radius * 0.6));
        var displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
        html += '<text x="' + pos.x + '" y="' + (pos.y + 4) + '" text-anchor="middle" fill="var(--text)" font-size="' + fontSize + '" font-weight="600" pointer-events="none" class="graph-label">' + displayName + '</text>';
        
        // Status badge
        if (status) {
            var statusColor = status === 'Deceased' ? 'var(--danger)' : 'var(--text-dim)';
            html += '<text x="' + pos.x + '" y="' + (pos.y + radius + 14) + '" text-anchor="middle" fill="' + statusColor + '" font-size="8" pointer-events="none">' + status + '</text>';
        }
    });
    
    svg.innerHTML = html;
    
    // Add click handlers
    svg.querySelectorAll('.graph-node').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.dataset.id;
            showCharacterDetail(id);
        });
    });
    
    updateLegend();
}

/**
 * Calculate node positions using force-directed layout
 */
function calculatePositions(nodes, relationships, width, height) {
    var positions = {};
    var padding = 80;
    var centerX = width / 2;
    var centerY = height / 2;
    var radius = Math.min(width, height) * 0.35;
    
    // If only 2 nodes, place them opposite each other
    if (nodes.length === 2) {
        positions[nodes[0].id] = { x: centerX - radius * 0.6, y: centerY };
        positions[nodes[1].id] = { x: centerX + radius * 0.6, y: centerY };
        return positions;
    }
    
    // Place nodes in a circle for initial positions
    var angleStep = (2 * Math.PI) / nodes.length;
    nodes.forEach(function(node, index) {
        var angle = angleStep * index - Math.PI / 2;
        var dist = radius * (0.6 + 0.4 * (1 - node.connections / (nodes.length + 5)));
        positions[node.id] = {
            x: centerX + dist * Math.cos(angle),
            y: centerY + dist * Math.sin(angle)
        };
    });
    
    // Simple force-directed iteration
    var iterations = 50;
    var k = 0.1;
    var repulsionForce = 0.05;
    var attractionForce = 0.01;
    
    for (var iter = 0; iter < iterations; iter++) {
        var forces = {};
        nodes.forEach(function(n) { forces[n.id] = { x: 0, y: 0 }; });
        
        // Repulsion between all nodes
        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var n1 = nodes[i];
                var n2 = nodes[j];
                var p1 = positions[n1.id];
                var p2 = positions[n2.id];
                var dx = p1.x - p2.x;
                var dy = p1.y - p2.y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                var force = repulsionForce * k / (dist + 1);
                forces[n1.id].x += force * dx / dist;
                forces[n1.id].y += force * dy / dist;
                forces[n2.id].x -= force * dx / dist;
                forces[n2.id].y -= force * dy / dist;
            }
        }
        
        // Attraction along edges
        relationships.forEach(function(r) {
            var p1 = positions[r.character1];
            var p2 = positions[r.character2];
            if (!p1 || !p2) return;
            var dx = p1.x - p2.x;
            var dy = p1.y - p2.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var force = attractionForce * k * dist;
            forces[r.character1].x -= force * dx / dist;
            forces[r.character1].y -= force * dy / dist;
            forces[r.character2].x += force * dx / dist;
            forces[r.character2].y += force * dy / dist;
        });
        
        // Apply forces with damping
        nodes.forEach(function(n) {
            positions[n.id].x += forces[n.id].x * 0.9;
            positions[n.id].y += forces[n.id].y * 0.9;
            // Keep within bounds
            positions[n.id].x = Math.max(padding, Math.min(width - padding, positions[n.id].x));
            positions[n.id].y = Math.max(padding, Math.min(height - padding, positions[n.id].y));
        });
    }
    
    return positions;
}

/**
 * Get node color based on character status and relationship types
 */
function getNodeColor(char) {
    if (!char) return '#7f8c8d';
    if (char.deceased) return '#666666';
    
    var status = getCurrentStatus(char).toLowerCase();
    var colorMap = {
        'instructor': '#9b59b6',
        'senior': '#c9a24b',
        'junior': '#4a9bc7',
        'rookie': '#27ae60',
        'trainee': '#8cbb3a',
        'support': '#e67e22',
        'civilian': '#7f8c8d'
    };
    return colorMap[status] || '#7f8c8d';
}

/**
 * Update graph legend
 */
function updateLegend() {
    var container = document.getElementById('legend-items');
    if (!container) return;
    
    var types = getRelationshipTypes();
    var html = '';
    types.forEach(function(t) {
        html += '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;font-size:0.7rem;">';
        html += '<span style="display:inline-block;width:12px;height:4px;background:' + t.color + ';border-radius:2px;"></span>';
        html += t.label;
        html += '</span>';
    });
    container.innerHTML = html;
}

/**
 * Show character detail from graph click
 */
function showCharacterDetail(charId) {
    var char = getCharacterById(charId);
    if (!char) return;
    
    var modal = document.getElementById('character-detail-modal');
    var content = document.getElementById('char-detail-content');
    var title = document.getElementById('detail-char-name');
    
    var name = [char.firstName, char.lastName].filter(function(n) { return n; }).join(' ');
    title.textContent = name;
    
    var status = getCurrentStatus(char);
    var age = getCharacterAge(char);
    var connections = getConnectedCharacters(charId);
    
    var html = '<div style="margin-bottom:12px;">';
    html += '<div class="detail-row"><span class="label">Status:</span> <span>' + status + '</span></div>';
    html += '<div class="detail-row"><span class="label">Age:</span> <span>' + age + '</span></div>';
    if (char.deceased) {
        html += '<div class="detail-row"><span class="label">Deceased:</span> <span style="color:var(--danger);">Yes</span></div>';
    }
    html += '</div>';
    
    if (connections.length > 0) {
        html += '<h4 style="color:var(--accent);font-size:0.9rem;margin-bottom:8px;">Connections (' + connections.length + ')</h4>';
        html += '<div style="display:flex;flex-direction:column;gap:4px;">';
        connections.forEach(function(conn) {
            var rel = conn.relationship;
            var typeLabel = getRelationshipTypeLabel(rel.typeId);
            var typeColor = getRelationshipTypeColor(rel.typeId);
            var charName = [conn.character.firstName, conn.character.lastName].filter(function(n) { return n; }).join(' ');
            var period = '';
            if (rel.startYear && rel.endYear) {
                period = rel.startYear + ' - ' + rel.endYear;
            } else if (rel.startYear) {
                period = 'From ' + rel.startYear;
            }
            var clarification = rel.clarification ? ' (' + rel.clarification + ')' : '';
            var notes = rel.notes ? ' 📝' : '';
            
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg);border-radius:4px;border-left:3px solid ' + typeColor + ';">';
            html += '<span style="font-size:0.8rem;"><strong>' + charName + '</strong> <span style="color:' + typeColor + ';font-size:0.7rem;">' + typeLabel + clarification + '</span></span>';
            html += '<span style="font-size:0.7rem;color:var(--text-dim);">' + period + notes + '</span>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<p class="empty-state" style="padding:8px;font-size:0.8rem;">No connections</p>';
    }
    
    html += '<div style="margin-top:12px;">';
    html += '<button id="view-char-relationships" class="small primary" data-id="' + charId + '">View All Relationships</button>';
    html += '</div>';
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
    
    content.querySelector('#view-char-relationships')?.addEventListener('click', function() {
        var id = this.dataset.id;
        closeCharacterDetail();
        document.getElementById('social-character-filter').value = id;
        renderRelationships();
    });
}

/**
 * Close character detail modal
 */
function closeCharacterDetail() {
    document.getElementById('character-detail-modal').classList.add('hidden');
}

/**
 * Toggle view mode
 */
function setViewMode(mode) {
    socialState.viewMode = mode;
    var listView = document.getElementById('social-list-view');
    var graphView = document.getElementById('social-graph-view');
    
    if (mode === 'list') {
        listView.style.display = 'block';
        graphView.style.display = 'none';
    } else {
        listView.style.display = 'none';
        graphView.style.display = 'block';
        setTimeout(renderGraph, 100);
    }
}

/**
 * Initialize social events
 */
function initSocialEvents() {
    // Add relationship button
    var addBtn = document.getElementById('add-relationship-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() { showRelationshipForm(); });
    }
    
    // View toggle
    var graphBtn = document.getElementById('view-graph-btn');
    if (graphBtn) {
        graphBtn.addEventListener('click', function() { setViewMode('graph'); });
    }
    var listBtn = document.getElementById('view-list-btn');
    if (listBtn) {
        listBtn.addEventListener('click', function() { setViewMode('list'); });
    }
    
    // Form close buttons
    var closeFormBtn = document.getElementById('close-relationship-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeRelationshipForm);
    }
    var cancelFormBtn = document.getElementById('cancel-relationship-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', closeRelationshipForm);
    }
    var formModal = document.getElementById('relationship-form-modal');
    if (formModal) {
        formModal.addEventListener('click', function(e) {
            if (e.target === this) closeRelationshipForm();
        });
    }
    
    // Form submit
    var form = document.getElementById('relationship-form-inner');
    if (form) {
        form.addEventListener('submit', saveRelationship);
    }
    
    // Filters
    var charFilter = document.getElementById('social-character-filter');
    if (charFilter) {
        charFilter.addEventListener('change', renderRelationships);
    }
    var typeFilter = document.getElementById('social-type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', renderRelationships);
    }
    var clearFilters = document.getElementById('clear-social-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            document.getElementById('social-character-filter').value = 'all';
            document.getElementById('social-type-filter').value = 'all';
            renderRelationships();
        });
    }
    
    // Zoom controls
    var zoomInBtn = document.getElementById('zoom-in-btn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            socialState.zoomLevel = Math.min(2, socialState.zoomLevel + 0.1);
            applyZoom();
        });
    }
    var zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            socialState.zoomLevel = Math.max(0.5, socialState.zoomLevel - 0.1);
            applyZoom();
        });
    }
    var resetZoomBtn = document.getElementById('reset-zoom-btn');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', function() {
            socialState.zoomLevel = 1;
            socialState.panX = 0;
            socialState.panY = 0;
            applyZoom();
        });
    }
    
    // Character detail close
    var closeDetailBtn = document.getElementById('close-char-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeCharacterDetail);
    }
    var detailModal = document.getElementById('character-detail-modal');
    if (detailModal) {
        detailModal.addEventListener('click', function(e) {
            if (e.target === this) closeCharacterDetail();
        });
    }
    
    // Handle window resize for graph
    window.addEventListener('resize', function() {
        if (socialState.viewMode === 'graph') {
            setTimeout(renderGraph, 200);
        }
    });
}

/**
 * Apply zoom to graph
 */
function applyZoom() {
    var display = document.getElementById('zoom-display');
    if (display) display.textContent = Math.round(socialState.zoomLevel * 100) + '%';
    
    var svg = document.getElementById('social-svg');
    if (!svg) return;
    
    var container = document.getElementById('graph-container');
    var width = container.clientWidth || 800;
    var height = container.clientHeight || 600;
    
    var transform = 'scale(' + socialState.zoomLevel + ')';
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.style.transform = transform;
    svg.style.transformOrigin = 'center center';
}

// Make functions globally available
window.renderSocialView = renderSocialView;
window.initSocialSystem = initSocialSystem;
window.getCharacterRelationships = getCharacterRelationships;
window.getRelationship = getRelationship;
window.createRelationship = createRelationship;
window.updateRelationship = updateRelationship;
window.deleteRelationship = deleteRelationship;
window.getCharacterName = getCharacterName;
window.getCharacterById = getCharacterById;
window.getRelationshipTypeLabel = getRelationshipTypeLabel;
window.getRelationshipTypeColor = getRelationshipTypeColor;
window.getRelationshipType = getRelationshipType;
window.getRelationshipTypes = getRelationshipTypes;
window.getConnectedCharacters = getConnectedCharacters;
window.renderRelationships = renderRelationships;
window.renderGraph = renderGraph;
window.showCharacterDetail = showCharacterDetail;
window.closeCharacterDetail = closeCharacterDetail;
window.setViewMode = setViewMode;
window.populateSocialSelectors = populateSocialSelectors;
window.populateFormSelectors = populateFormSelectors;
window.populateTypeSelectors = populateTypeSelectors;
window.socialState = socialState;

console.log('social.js loaded');
