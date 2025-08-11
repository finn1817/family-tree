/**
 * UI COMPONENTS FOR THE NEW FAMILY RELATIONSHIP SYSTEM
 */

class RelationshipSystemUI {
    constructor(relationshipSystem) {
        this.system = relationshipSystem;
        this.currentUser = null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    /**
     * MAIN DISPLAY METHODS
     */
    displayPeopleTab() {
        // Get the correct container based on where this is being called from
        let container = document.getElementById('relationshipsPeople');
        if (!container) {
            container = document.getElementById('family');
        }
        if (!container) return;

        const people = this.system.people.filter(p => p.isActive);
        
        container.innerHTML = `
            <div class="controls">
                <div class="search-controls">
                    <input type="text" id="peopleSearchInput" class="search-input" placeholder="Search people..." onkeyup="relationshipUI.filterPeople()">
                    <select id="peopleRoleFilter" class="filter-select" onchange="relationshipUI.filterPeople()">
                        <option value="">All Roles</option>
                        <option value="parent">Parents</option>
                        <option value="child">Children</option>
                        <option value="spouse">Spouses</option>
                        <option value="adult_child">Adult Children</option>
                    </select>
                    <select id="peopleFamilyFilter" class="filter-select" onchange="relationshipUI.filterPeople()">
                        <option value="">All Families</option>
                        ${this.system.families.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" onclick="relationshipUI.openAddPersonModal()">+ Add Person</button>
            </div>
            <div id="peopleGrid" class="family-grid">
                ${this.renderPeopleGrid(people)}
            </div>
        `;
    }

    displayFamiliesTab() {
        // Get the correct container based on where this is being called from
        let container = document.getElementById('relationshipsFamilies');
        if (!container) {
            container = document.getElementById('branches');
        }
        if (!container) return;

        container.innerHTML = `
            <div class="controls">
                <div class="search-controls">
                    <input type="text" id="familiesSearchInput" class="search-input" placeholder="Search families..." onkeyup="relationshipUI.filterFamilies()">
                    <select id="familyTypeFilter" class="filter-select" onchange="relationshipUI.filterFamilies()">
                        <option value="">All Types</option>
                        <option value="nuclear">Nuclear Families</option>
                        <option value="extended">Extended Families</option>
                        <option value="ancestral">Ancestral Lines</option>
                        <option value="mixed">Mixed Families</option>
                    </select>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="relationshipUI.openCreateFamilyModal()">+ Create Family</button>
                    <button class="btn" onclick="relationshipUI.showMigrationModal()" style="background: #ffc107; color: #000;">🔄 Migrate Old Data</button>
                </div>
            </div>
            <div id="familiesGrid" class="family-grid">
                ${this.system.renderFamiliesView()}
            </div>
        `;
    }

    /**
     * PEOPLE GRID RENDERING
     */
    renderPeopleGrid(people) {
        if (people.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666; grid-column: 1 / -1;">
                    <h3>No people found</h3>
                    <p>Add your first family member to get started!</p>
                </div>
            `;
        }

        return people.map(person => this.renderPersonCard(person)).join('');
    }

    renderPersonCard(person) {
        const age = this.system.calculateAge(person);
        const personFamilies = this.system.getPersonFamilies(person.id);
        const nextBirthday = this.system.getNextBirthday(person);
        const daysUntilBirthday = Math.ceil((nextBirthday - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="family-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="color: #667eea; margin-bottom: 0.5rem;">${person.firstName} ${person.lastName}</h3>
                        <p style="color: #666; font-size: 0.9rem;">Age: ${age} | Birthday: ${person.birthMonth} ${person.birthDay}</p>
                    </div>
                    ${daysUntilBirthday <= 30 ? `
                        <span style="background: #e74c3c20; color: #e74c3c; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                            🎂 ${daysUntilBirthday} days
                        </span>
                    ` : ''}
                </div>

                <div style="margin-bottom: 1rem;">
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: #333;">Families:</strong>
                        ${personFamilies.length > 0 ? `
                            <div style="margin-top: 0.25rem;">
                                ${personFamilies.map(pf => `
                                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 0.2rem;">
                                        • ${pf.family.name} (${pf.role})
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<span style="color: #999; font-style: italic;">No families assigned</span>'}
                    </div>
                    
                    ${person.mobilePhone ? `
                        <div style="font-size: 0.8rem; color: #666;">📱 ${person.mobilePhone}</div>
                    ` : ''}
                    
                    ${person.email ? `
                        <div style="font-size: 0.8rem; color: #666;">✉️ ${person.email}</div>
                    ` : ''}
                </div>

                <div style="display: flex; gap: 0.5rem; font-size: 0.8rem;">
                    <button class="btn btn-primary" onclick="relationshipUI.viewPersonDetails('${person.id}')" style="flex: 1;">
                        👁️ View
                    </button>
                    <button class="btn" onclick="relationshipUI.editPerson('${person.id}')" style="background: #17a2b8; color: white; flex: 1;">
                        ✏️ Edit
                    </button>
                    <button class="btn" onclick="relationshipUI.managePersonRelationships('${person.id}')" style="background: #28a745; color: white; flex: 1;">
                        👥 Families
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * FILTERING METHODS
     */
    filterPeople() {
        const searchTerm = document.getElementById('peopleSearchInput')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('peopleRoleFilter')?.value || '';
        const familyFilter = document.getElementById('peopleFamilyFilter')?.value || '';

        let filteredPeople = this.system.people.filter(person => {
            if (!person.isActive) return false;

            // Search filter
            const matchesSearch = !searchTerm || 
                person.firstName.toLowerCase().includes(searchTerm) ||
                person.lastName.toLowerCase().includes(searchTerm);

            // Role filter
            let matchesRole = true;
            if (roleFilter) {
                const personRelationships = this.system.getPersonRelationships(person.id);
                matchesRole = personRelationships.some(rel => rel.role === roleFilter);
            }

            // Family filter
            let matchesFamily = true;
            if (familyFilter) {
                const personRelationships = this.system.getPersonRelationships(person.id);
                matchesFamily = personRelationships.some(rel => rel.familyId === familyFilter);
            }

            return matchesSearch && matchesRole && matchesFamily;
        });

        const grid = document.getElementById('peopleGrid');
        if (grid) {
            grid.innerHTML = this.renderPeopleGrid(filteredPeople);
        }
    }

    filterFamilies() {
        const searchTerm = document.getElementById('familiesSearchInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('familyTypeFilter')?.value || '';

        let filteredFamilies = this.system.families.filter(family => {
            if (!family.isActive) return false;

            const matchesSearch = !searchTerm || 
                family.name.toLowerCase().includes(searchTerm) ||
                (family.description && family.description.toLowerCase().includes(searchTerm));

            const matchesType = !typeFilter || family.familyType === typeFilter;

            return matchesSearch && matchesType;
        });

        const grid = document.getElementById('familiesGrid');
        if (grid) {
            grid.innerHTML = filteredFamilies.map(family => this.system.renderFamilyCard(family)).join('');
        }
    }

    /**
     * MODAL METHODS
     */
    openAddPersonModal() {
        const modal = this.createModal('addPersonModal', 'Add New Person', this.getAddPersonForm());
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    openCreateFamilyModal() {
        const modal = this.createModal('createFamilyModal', 'Create New Family', this.getCreateFamilyForm());
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    showMigrationModal() {
        const modal = this.createModal('migrationModal', 'Migrate from Old System', this.getMigrationForm());
        document.body.appendChild(modal);
        modal.classList.add('active');
    }

    /**
     * FORM GENERATORS
     */
    getAddPersonForm() {
        return `
            <form id="addPersonForm" onsubmit="relationshipUI.addPerson(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="newPersonFirstName">First Name *</label>
                        <input type="text" id="newPersonFirstName" required>
                    </div>
                    <div class="form-group">
                        <label for="newPersonLastName">Last Name *</label>
                        <input type="text" id="newPersonLastName" required>
                    </div>
                    <div class="form-group">
                        <label for="newPersonBirthMonth">Birth Month *</label>
                        <select id="newPersonBirthMonth" required>
                            <option value="">Select Month</option>
                            ${this.getMonthOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newPersonBirthDay">Birth Day *</label>
                        <input type="number" id="newPersonBirthDay" min="1" max="31" required>
                    </div>
                    <div class="form-group">
                        <label for="newPersonBirthYear">Birth Year *</label>
                        <input type="number" id="newPersonBirthYear" min="1900" max="${new Date().getFullYear()}" required>
                    </div>
                    <div class="form-group">
                        <label for="newPersonMobile">Mobile Phone</label>
                        <input type="tel" id="newPersonMobile">
                    </div>
                    <div class="form-group">
                        <label for="newPersonEmail">Email</label>
                        <input type="email" id="newPersonEmail">
                    </div>
                    <div class="form-group">
                        <label for="newPersonAddress">Address</label>
                        <input type="text" id="newPersonAddress">
                    </div>
                    <div class="form-group">
                        <label for="newPersonCity">City</label>
                        <input type="text" id="newPersonCity">
                    </div>
                    <div class="form-group">
                        <label for="newPersonState">State</label>
                        <input type="text" id="newPersonState">
                    </div>
                    <div class="form-group">
                        <label for="newPersonZip">Zip Code</label>
                        <input type="text" id="newPersonZip">
                    </div>
                    <div class="form-group full-width">
                        <label for="newPersonNotes">Notes</label>
                        <textarea id="newPersonNotes" rows="3"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn" onclick="relationshipUI.closeModal('addPersonModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Person</button>
                </div>
            </form>
        `;
    }

    getCreateFamilyForm() {
        return `
            <form id="createFamilyForm" onsubmit="relationshipUI.createFamily(event)">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label for="newFamilyName">Family Name *</label>
                        <input type="text" id="newFamilyName" required placeholder="e.g., Smith Family, John & Mary Family">
                    </div>
                    <div class="form-group full-width">
                        <label for="newFamilyDescription">Description</label>
                        <textarea id="newFamilyDescription" rows="2" placeholder="Brief description of this family unit"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="newFamilyType">Family Type *</label>
                        <select id="newFamilyType" required>
                            <option value="">Select Type</option>
                            <option value="nuclear">Nuclear Family (Parents + Children)</option>
                            <option value="extended">Extended Family (Multiple Generations)</option>
                            <option value="ancestral">Ancestral Line (Historical)</option>
                            <option value="mixed">Mixed Family (Blended/Complex)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newFamilyGeneration">Generation Level</label>
                        <select id="newFamilyGeneration">
                            <option value="0">Current Generation</option>
                            <option value="1">Parent Generation</option>
                            <option value="2">Grandparent Generation</option>
                            <option value="3">Great-Grandparent Generation</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <h4>Add Initial Members (Optional)</h4>
                    <p style="color: #666; font-size: 0.9rem;">You can add members now or do it later from the family details page.</p>
                    
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;">
                        ${this.system.people.filter(p => p.isActive).map(person => `
                            <div style="margin-bottom: 0.5rem;">
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="checkbox" value="${person.id}" name="familyMembers" style="margin-right: 0.5rem;">
                                    <span>${person.firstName} ${person.lastName}</span>
                                    <select name="memberRole_${person.id}" style="margin-left: auto; padding: 0.25rem;">
                                        <option value="parent">Parent</option>
                                        <option value="child">Child</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="adult_child">Adult Child</option>
                                        <option value="grandparent">Grandparent</option>
                                        <option value="grandchild">Grandchild</option>
                                    </select>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn" onclick="relationshipUI.closeModal('createFamilyModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Family</button>
                </div>
            </form>
        `;
    }

    getMigrationForm() {
        return `
            <div style="text-align: center;">
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #856404; margin-bottom: 0.5rem;">⚠️ Important Migration Information</h4>
                    <p style="color: #856404; font-size: 0.9rem; margin: 0;">
                        This will create a new relationship-based system alongside your current branch system. 
                        Your existing data will not be modified until you choose to switch over completely.
                    </p>
                </div>

                <div style="text-align: left; margin-bottom: 1.5rem;">
                    <h4>What will happen:</h4>
                    <ul style="color: #666;">
                        <li>All family members will be copied to the new "People" system</li>
                        <li>Family branches will be converted to "Families" with relationships</li>
                        <li>People in the same branch will become family members with inferred roles</li>
                        <li>Unassigned people will be grouped by last name into new families</li>
                    </ul>
                </div>

                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #155724; margin-bottom: 0.5rem;">✅ Migration Preview</h4>
                    <div style="color: #155724; font-size: 0.9rem;">
                        <div>People to migrate: <strong>${window.familyMembers ? window.familyMembers.length : 0}</strong></div>
                        <div>Branches to convert: <strong>${window.familyBranches ? window.familyBranches.length : 0}</strong></div>
                        <div>Expected families: <strong>${this.estimateFamiliesFromMigration()}</strong></div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button type="button" class="btn" onclick="relationshipUI.closeModal('migrationModal')">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="relationshipUI.startMigration()">
                        🔄 Start Migration
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * EVENT HANDLERS
     */
    async addPerson(event) {
        event.preventDefault();
        
        try {
            const personData = {
                firstName: document.getElementById('newPersonFirstName').value,
                lastName: document.getElementById('newPersonLastName').value,
                birthMonth: document.getElementById('newPersonBirthMonth').value,
                birthDay: parseInt(document.getElementById('newPersonBirthDay').value),
                birthYear: parseInt(document.getElementById('newPersonBirthYear').value),
                mobilePhone: document.getElementById('newPersonMobile').value,
                email: document.getElementById('newPersonEmail').value,
                address: document.getElementById('newPersonAddress').value,
                city: document.getElementById('newPersonCity').value,
                state: document.getElementById('newPersonState').value,
                zipCode: document.getElementById('newPersonZip').value,
                notes: document.getElementById('newPersonNotes').value,
                createdBy: this.currentUser?.username || 'unknown'
            };

            await this.system.addPerson(personData);
            await this.system.loadPeople();
            
            this.closeModal('addPersonModal');
            this.displayPeopleTab();
            
            alert('Person added successfully!');
        } catch (error) {
            alert('Error adding person: ' + error.message);
        }
    }

    async createFamily(event) {
        event.preventDefault();
        
        try {
            const familyData = {
                name: document.getElementById('newFamilyName').value,
                description: document.getElementById('newFamilyDescription').value,
                familyType: document.getElementById('newFamilyType').value,
                generationLevel: parseInt(document.getElementById('newFamilyGeneration').value) || 0,
                createdBy: this.currentUser?.username || 'unknown'
            };

            const newFamily = await this.system.createFamily(familyData);
            
            // Add selected members to the family
            const selectedMembers = Array.from(document.querySelectorAll('input[name="familyMembers"]:checked'));
            for (const memberCheckbox of selectedMembers) {
                const personId = memberCheckbox.value;
                const roleSelect = document.querySelector(`select[name="memberRole_${personId}"]`);
                const role = roleSelect ? roleSelect.value : 'child';
                
                await this.system.addRelationship({
                    personId: personId,
                    familyId: newFamily.id,
                    role: role,
                    createdBy: this.currentUser?.username || 'unknown'
                });
            }

            await this.system.loadAllData();
            
            this.closeModal('createFamilyModal');
            this.displayFamiliesTab();
            
            alert('Family created successfully!');
        } catch (error) {
            alert('Error creating family: ' + error.message);
        }
    }

    async startMigration() {
        try {
            const oldFamilyMembers = window.familyMembers || [];
            const oldFamilyBranches = window.familyBranches || [];
            
            if (oldFamilyMembers.length === 0) {
                alert('No data to migrate. Please load your existing family data first.');
                return;
            }

            this.closeModal('migrationModal');
            
            // Show progress
            const progressModal = this.createModal('migrationProgressModal', 'Migration in Progress', `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                    <h4>Migrating your family data...</h4>
                    <p style="color: #666;">This may take a few moments. Please don't close the browser.</p>
                    <div style="margin-top: 1rem;">
                        <div id="migrationProgress" style="background: #f8f9fa; border-radius: 8px; padding: 1rem;">
                            Starting migration...
                        </div>
                    </div>
                </div>
            `);
            document.body.appendChild(progressModal);
            progressModal.classList.add('active');

            // Perform migration
            const result = await this.system.migrateFromOldSystem(oldFamilyMembers, oldFamilyBranches);
            
            this.closeModal('migrationProgressModal');
            
            // Show success
            alert(`Migration completed successfully!\n\nCreated:\n- ${result.peopleCreated} people\n- ${result.familiesCreated} families\n- ${result.relationshipsCreated} relationships\n\nYou can now use the new relationship system alongside your existing branch system.`);
            
            // Refresh displays
            this.displayPeopleTab();
            this.displayFamiliesTab();
            
        } catch (error) {
            this.closeModal('migrationProgressModal');
            alert('Migration failed: ' + error.message);
        }
    }

    /**
     * UTILITY METHODS
     */
    createModal(id, title, content) {
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>${title}</h2>
                    <button type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;" onclick="relationshipUI.closeModal('${id}')">&times;</button>
                </div>
                ${content}
            </div>
        `;

        return modal;
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    getMonthOptions() {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.map(month => `<option value="${month}">${month}</option>`).join('');
    }

    estimateFamiliesFromMigration() {
        if (!window.familyBranches || !window.familyMembers) return 0;
        
        const branchCount = window.familyBranches.length;
        const unassignedMembers = window.familyMembers.filter(m => !m.familyBranch || m.familyBranch.trim() === '');
        
        // Group unassigned by last name
        const lastNameGroups = {};
        unassignedMembers.forEach(member => {
            if (!lastNameGroups[member.lastName]) {
                lastNameGroups[member.lastName] = [];
            }
            lastNameGroups[member.lastName].push(member);
        });
        
        const newFamiliesFromUnassigned = Object.values(lastNameGroups).filter(group => group.length >= 2).length;
        
        return branchCount + newFamiliesFromUnassigned;
    }

    /**
     * UPCOMING BIRTHDAYS DISPLAY FOR NEW SYSTEM
     */
    displayUpcomingBirthdays() {
        const container = document.getElementById('upcomingBirthdays');
        if (!container) return;

        const upcomingBirthdays = this.system.getUpcomingBirthdays(30);
        
        if (upcomingBirthdays.length === 0) {
            container.innerHTML = '<p style="color: #999; font-style: italic;">No upcoming birthdays in the next 30 days</p>';
            return;
        }

        container.innerHTML = upcomingBirthdays.map(birthday => `
            <div class="birthday-item">
                <div>
                    <strong>${birthday.person.firstName} ${birthday.person.lastName}</strong>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8);">
                        ${birthday.families || 'No family assigned'} • Turning ${birthday.age + 1}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold;">
                        ${birthday.daysUntil === 0 ? 'Today!' : 
                          birthday.daysUntil === 1 ? 'Tomorrow' : 
                          `${birthday.daysUntil} days`}
                    </div>
                    <div style="font-size: 0.8rem; opacity: 0.8;">
                        ${birthday.person.birthMonth} ${birthday.person.birthDay}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Method stubs for future implementation
    viewPersonDetails(personId) {
        // TODO: Implement person details modal
        alert(`View details for person ${personId} - To be implemented`);
    }

    editPerson(personId) {
        // TODO: Implement edit person modal
        alert(`Edit person ${personId} - To be implemented`);
    }

    managePersonRelationships(personId) {
        // TODO: Implement relationship management modal
        alert(`Manage relationships for person ${personId} - To be implemented`);
    }

    viewFamilyDetails(familyId) {
        // TODO: Implement family details modal
        alert(`View family details ${familyId} - To be implemented`);
    }

    editFamily(familyId) {
        // TODO: Implement edit family modal
        alert(`Edit family ${familyId} - To be implemented`);
    }

    manageRelationships(familyId) {
        // TODO: Implement family relationship management modal
        alert(`Manage relationships for family ${familyId} - To be implemented`);
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RelationshipSystemUI;
} else if (typeof window !== 'undefined') {
    window.RelationshipSystemUI = RelationshipSystemUI;
}
