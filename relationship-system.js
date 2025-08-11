/**
 * NEW FAMILY RELATIONSHIP SYSTEM
 * 
 * This is a complete redesign of the family tree system from branch-based to relationship-based.
 * 
 * Core Concepts:
 * - People are individuals with basic info
 * - Families are groups of people with specific relationships
 * - Relationships define how people are connected (parent, child, spouse, etc.)
 * - One person can have multiple relationships in different families
 * 
 * Example: John can be:
 * - Child in "Smith Grandparents Family" 
 * - Spouse in "John & Mary Family"
 * - Parent in "John & Mary's Children Family"
 */

// Import Firebase (will be injected when this is integrated)
let db, collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, updateDoc;

class FamilyRelationshipSystem {
    constructor(firebaseDb, firebaseModules) {
        this.db = firebaseDb;
        // Inject Firebase modules
        Object.assign(this, firebaseModules);
        
        // Data stores
        this.people = [];
        this.families = [];
        this.relationships = [];
        
        // Collection names for the new system
        this.COLLECTIONS = {
            PEOPLE: 'people_v2',
            FAMILIES: 'families_v2', 
            RELATIONSHIPS: 'family_relationships_v2'
        };
    }

    /**
     * PERSON MANAGEMENT
     */
    async addPerson(personData) {
        const person = {
            firstName: personData.firstName,
            lastName: personData.lastName,
            birthMonth: personData.birthMonth,
            birthDay: personData.birthDay,
            birthYear: personData.birthYear,
            // Contact info
            mobilePhone: personData.mobilePhone || '',
            homePhone: personData.homePhone || '',
            workPhone: personData.workPhone || '',
            email: personData.email || '',
            // Address
            address: personData.address || '',
            city: personData.city || '',
            state: personData.state || '',
            zipCode: personData.zipCode || '',
            // Other
            anniversaryDate: personData.anniversaryDate || '',
            notes: personData.notes || '',
            // Metadata
            createdAt: new Date(),
            createdBy: personData.createdBy,
            isActive: true
        };

        const docRef = await addDoc(collection(this.db, this.COLLECTIONS.PEOPLE), person);
        person.id = docRef.id;
        return person;
    }

    async updatePerson(personId, updateData) {
        updateData.updatedAt = new Date();
        await updateDoc(doc(this.db, this.COLLECTIONS.PEOPLE, personId), updateData);
    }

    async deletePerson(personId) {
        // Mark as inactive instead of deleting to preserve relationship history
        await this.updatePerson(personId, { isActive: false, deletedAt: new Date() });
    }

    /**
     * FAMILY MANAGEMENT
     */
    async createFamily(familyData) {
        const family = {
            name: familyData.name,
            description: familyData.description || '',
            familyType: familyData.familyType || 'nuclear', // nuclear, extended, ancestral, mixed
            generationLevel: familyData.generationLevel || 0,
            // Metadata
            createdAt: new Date(),
            createdBy: familyData.createdBy,
            isActive: true
        };

        const docRef = await addDoc(collection(this.db, this.COLLECTIONS.FAMILIES), family);
        family.id = docRef.id;
        return family;
    }

    async updateFamily(familyId, updateData) {
        updateData.updatedAt = new Date();
        await updateDoc(doc(this.db, this.COLLECTIONS.FAMILIES, familyId), updateData);
    }

    async deleteFamily(familyId) {
        // Mark as inactive and remove all relationships
        await this.updateFamily(familyId, { isActive: false, deletedAt: new Date() });
        // Remove all relationships in this family
        const familyRelationships = this.relationships.filter(r => r.familyId === familyId);
        for (const relationship of familyRelationships) {
            await this.removeRelationship(relationship.id);
        }
    }

    /**
     * RELATIONSHIP MANAGEMENT
     */
    async addRelationship(relationshipData) {
        const relationship = {
            personId: relationshipData.personId,
            familyId: relationshipData.familyId,
            role: relationshipData.role, // parent, child, spouse, partner, guardian, etc.
            relationshipToOthers: relationshipData.relationshipToOthers || '', // "father of", "mother of", "child of", etc.
            startDate: relationshipData.startDate || null, // When this relationship began
            endDate: relationshipData.endDate || null, // When it ended (divorce, death, etc.)
            // Metadata
            createdAt: new Date(),
            createdBy: relationshipData.createdBy,
            isActive: true
        };

        const docRef = await addDoc(collection(this.db, this.COLLECTIONS.RELATIONSHIPS), relationship);
        relationship.id = docRef.id;
        return relationship;
    }

    async updateRelationship(relationshipId, updateData) {
        updateData.updatedAt = new Date();
        await updateDoc(doc(this.db, this.COLLECTIONS.RELATIONSHIPS, relationshipId), updateData);
    }

    async removeRelationship(relationshipId) {
        await updateDoc(doc(this.db, this.COLLECTIONS.RELATIONSHIPS, relationshipId), {
            isActive: false,
            deletedAt: new Date()
        });
    }

    /**
     * DATA LOADING
     */
    async loadAllData() {
        await Promise.all([
            this.loadPeople(),
            this.loadFamilies(),
            this.loadRelationships()
        ]);
    }

    async loadPeople() {
        try {
            const q = query(
                collection(this.db, this.COLLECTIONS.PEOPLE),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            this.people = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading people:', error);
        }
    }

    async loadFamilies() {
        try {
            const q = query(
                collection(this.db, this.COLLECTIONS.FAMILIES),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            this.families = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading families:', error);
        }
    }

    async loadRelationships() {
        try {
            const q = query(
                collection(this.db, this.COLLECTIONS.RELATIONSHIPS),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            this.relationships = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading relationships:', error);
        }
    }

    /**
     * QUERY METHODS
     */
    getPerson(personId) {
        return this.people.find(p => p.id === personId);
    }

    getFamily(familyId) {
        return this.families.find(f => f.id === familyId);
    }

    getPersonRelationships(personId) {
        return this.relationships.filter(r => r.personId === personId && r.isActive);
    }

    getFamilyMembers(familyId) {
        const familyRelationships = this.relationships.filter(r => r.familyId === familyId && r.isActive);
        return familyRelationships.map(rel => ({
            person: this.getPerson(rel.personId),
            role: rel.role,
            relationshipToOthers: rel.relationshipToOthers,
            relationship: rel
        }));
    }

    getPersonFamilies(personId) {
        const personRelationships = this.getPersonRelationships(personId);
        return personRelationships.map(rel => ({
            family: this.getFamily(rel.familyId),
            role: rel.role,
            relationshipToOthers: rel.relationshipToOthers,
            relationship: rel
        }));
    }

    /**
     * RELATIONSHIP SUGGESTIONS
     */
    suggestRelationships(personId) {
        const person = this.getPerson(personId);
        if (!person) return [];

        const suggestions = [];
        const personFamilies = this.getPersonFamilies(personId);

        // Suggest family creation based on last name
        const sameLastNamePeople = this.people.filter(p => 
            p.id !== personId && 
            p.lastName === person.lastName &&
            p.isActive
        );

        if (sameLastNamePeople.length > 0) {
            suggestions.push({
                type: 'create_family',
                title: `Create ${person.lastName} Family`,
                description: `Create a family with ${sameLastNamePeople.length + 1} ${person.lastName} members`,
                people: [person, ...sameLastNamePeople]
            });
        }

        // Suggest nuclear family if person has no families
        if (personFamilies.length === 0) {
            suggestions.push({
                type: 'create_nuclear_family',
                title: `Create Nuclear Family for ${person.firstName}`,
                description: 'Start a nuclear family where this person can be a parent or child',
                person: person
            });
        }

        return suggestions;
    }

    /**
     * MIGRATION FROM OLD SYSTEM
     */
    async migrateFromOldSystem(oldFamilyMembers, oldFamilyBranches) {
        console.log('Starting migration from old branch system to new relationship system...');
        
        // Step 1: Migrate all people
        const personIdMap = new Map(); // oldMemberId -> newPersonId
        
        for (const oldMember of oldFamilyMembers) {
            const newPerson = await this.addPerson({
                firstName: oldMember.firstName,
                lastName: oldMember.lastName,
                birthMonth: oldMember.birthMonth,
                birthDay: oldMember.birthDay,
                birthYear: oldMember.birthYear,
                mobilePhone: oldMember.mobilePhone,
                homePhone: oldMember.homePhone,
                workPhone: oldMember.workPhone,
                address: oldMember.address,
                city: oldMember.city,
                state: oldMember.state,
                zipCode: oldMember.zipCode,
                anniversaryDate: oldMember.anniversaryDate,
                notes: oldMember.notes,
                createdBy: 'migration_from_old_system'
            });
            
            personIdMap.set(oldMember.id, newPerson.id);
        }

        // Step 2: Convert branches to families and create relationships
        const familyIdMap = new Map(); // oldBranchName -> newFamilyId

        for (const oldBranch of oldFamilyBranches) {
            // Create new family from old branch
            const newFamily = await this.createFamily({
                name: oldBranch.name,
                description: oldBranch.description || '',
                familyType: this.convertBranchTypeToFamilyType(oldBranch.branchType),
                generationLevel: oldBranch.generationLevel || 0,
                createdBy: 'migration_from_old_system'
            });

            familyIdMap.set(oldBranch.name, newFamily.id);

            // Find all people who were in this branch
            const branchMembers = oldFamilyMembers.filter(m => m.familyBranch === oldBranch.name);

            // Create relationships for each member
            for (const member of branchMembers) {
                const newPersonId = personIdMap.get(member.id);
                if (newPersonId) {
                    await this.addRelationship({
                        personId: newPersonId,
                        familyId: newFamily.id,
                        role: this.inferRoleFromOldData(member, branchMembers),
                        relationshipToOthers: member.relationship || '',
                        createdBy: 'migration_from_old_system'
                    });
                }
            }
        }

        // Step 3: Handle people without branches (create individual families or suggest groupings)
        const unassignedMembers = oldFamilyMembers.filter(m => !m.familyBranch || m.familyBranch.trim() === '');
        
        if (unassignedMembers.length > 0) {
            // Group by last name
            const lastNameGroups = {};
            unassignedMembers.forEach(member => {
                if (!lastNameGroups[member.lastName]) {
                    lastNameGroups[member.lastName] = [];
                }
                lastNameGroups[member.lastName].push(member);
            });

            // Create families for each last name group
            for (const [lastName, members] of Object.entries(lastNameGroups)) {
                if (members.length >= 2) {
                    const newFamily = await this.createFamily({
                        name: `${lastName} Family`,
                        description: `Auto-created family for unassigned ${lastName} members`,
                        familyType: 'nuclear',
                        generationLevel: 2,
                        createdBy: 'migration_auto_grouping'
                    });

                    // Add all members to this family
                    for (const member of members) {
                        const newPersonId = personIdMap.get(member.id);
                        if (newPersonId) {
                            await this.addRelationship({
                                personId: newPersonId,
                                familyId: newFamily.id,
                                role: this.inferRoleFromAge(member),
                                relationshipToOthers: '',
                                createdBy: 'migration_auto_grouping'
                            });
                        }
                    }
                }
            }
        }

        console.log('Migration completed!');
        await this.loadAllData();
        
        return {
            peopleCreated: personIdMap.size,
            familiesCreated: familyIdMap.size,
            relationshipsCreated: this.relationships.length
        };
    }

    /**
     * HELPER METHODS FOR MIGRATION
     */
    convertBranchTypeToFamilyType(branchType) {
        const typeMap = {
            'nuclear_family': 'nuclear',
            'grandparent_branch': 'extended',
            'ancestral_branch': 'ancestral',
            'extended_family': 'extended'
        };
        return typeMap[branchType] || 'nuclear';
    }

    inferRoleFromOldData(member, allBranchMembers) {
        // Use old relationship data if available
        if (member.relationship) {
            const rel = member.relationship.toLowerCase();
            if (rel.includes('parent') || rel.includes('father') || rel.includes('mother')) {
                return 'parent';
            }
            if (rel.includes('child') || rel.includes('son') || rel.includes('daughter')) {
                return 'child';
            }
            if (rel.includes('spouse') || rel.includes('husband') || rel.includes('wife')) {
                return 'spouse';
            }
        }

        // Fallback to age-based inference
        return this.inferRoleFromAge(member);
    }

    inferRoleFromAge(member) {
        const age = this.calculateAge(member);
        if (age >= 50) return 'parent';
        if (age >= 18) return 'adult_child';
        return 'child';
    }

    calculateAge(member) {
        if (!member.birthYear) return 25; // Default age
        return new Date().getFullYear() - member.birthYear;
    }

    /**
     * DISPLAY METHODS
     */
    renderFamiliesView() {
        const families = this.families.filter(f => f.isActive);
        
        if (families.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h3>No families yet</h3>
                    <p>Create your first family to get started!</p>
                    <button class="btn btn-primary" onclick="relationshipSystem.openCreateFamilyModal()">
                        + Create Family
                    </button>
                </div>
            `;
        }

        return families.map(family => this.renderFamilyCard(family)).join('');
    }

    renderFamilyCard(family) {
        const members = this.getFamilyMembers(family.id);
        const membersByRole = this.groupMembersByRole(members);
        
        return `
            <div class="family-card" style="border-left: 4px solid ${this.getFamilyTypeColor(family.familyType)};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="color: ${this.getFamilyTypeColor(family.familyType)}; margin-bottom: 0.5rem;">
                            ${this.getFamilyTypeIcon(family.familyType)} ${family.name}
                        </h3>
                        <p style="color: #666; font-size: 0.9rem;">${family.description}</p>
                    </div>
                    <span style="background: ${this.getFamilyTypeColor(family.familyType)}20; color: ${this.getFamilyTypeColor(family.familyType)}; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                        ${this.formatFamilyType(family.familyType)}
                    </span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    ${Object.entries(membersByRole).map(([role, roleMembers]) => `
                        <div style="margin-bottom: 0.5rem;">
                            <strong style="color: #333; text-transform: capitalize;">${role}s:</strong>
                            <span style="color: #666;">${roleMembers.map(m => m.person.firstName + ' ' + m.person.lastName).join(', ')}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 0.5rem; font-size: 0.8rem;">
                    <button class="btn btn-primary" onclick="relationshipSystem.viewFamilyDetails('${family.id}')" style="flex: 1;">
                        👁️ View Details
                    </button>
                    <button class="btn" onclick="relationshipSystem.editFamily('${family.id}')" style="background: #17a2b8; color: white; flex: 1;">
                        ✏️ Edit
                    </button>
                    <button class="btn" onclick="relationshipSystem.manageRelationships('${family.id}')" style="background: #28a745; color: white; flex: 1;">
                        👥 Manage
                    </button>
                </div>
            </div>
        `;
    }

    groupMembersByRole(members) {
        const grouped = {};
        members.forEach(member => {
            if (!grouped[member.role]) {
                grouped[member.role] = [];
            }
            grouped[member.role].push(member);
        });
        return grouped;
    }

    getFamilyTypeColor(familyType) {
        const colors = {
            'nuclear': '#28a745',
            'extended': '#007bff',
            'ancestral': '#6f42c1',
            'mixed': '#fd7e14'
        };
        return colors[familyType] || '#6c757d';
    }

    getFamilyTypeIcon(familyType) {
        const icons = {
            'nuclear': '👨‍👩‍👧‍👦',
            'extended': '👪',
            'ancestral': '🌳',
            'mixed': '🏠'
        };
        return icons[familyType] || '👥';
    }

    formatFamilyType(familyType) {
        const names = {
            'nuclear': 'Nuclear Family',
            'extended': 'Extended Family',
            'ancestral': 'Ancestral Line',
            'mixed': 'Mixed Family'
        };
        return names[familyType] || 'Family';
    }

    /**
     * UPCOMING BIRTHDAYS (NEW SYSTEM)
     */
    getUpcomingBirthdays(daysAhead = 30) {
        const today = new Date();
        const upcomingBirthdays = [];

        this.people.forEach(person => {
            if (!person.isActive || !person.birthMonth || !person.birthDay) return;

            const nextBirthday = this.getNextBirthday(person);
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

            if (daysUntil >= 0 && daysUntil <= daysAhead) {
                // Get the person's families for context
                const personFamilies = this.getPersonFamilies(person.id);
                
                upcomingBirthdays.push({
                    person: person,
                    nextBirthday: nextBirthday,
                    daysUntil: daysUntil,
                    age: this.calculateAge(person),
                    families: personFamilies.map(f => f.family.name).join(', ')
                });
            }
        });

        return upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    }

    getNextBirthday(person) {
        if (!person.birthMonth || !person.birthDay) return new Date(9999, 11, 31);
        
        const today = new Date();
        const currentYear = today.getFullYear();
        const monthIndex = this.getMonthIndex(person.birthMonth);
        
        let birthday = new Date(currentYear, monthIndex, person.birthDay);
        
        if (birthday < today) {
            birthday = new Date(currentYear + 1, monthIndex, person.birthDay);
        }
        
        return birthday;
    }

    getMonthIndex(monthName) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.indexOf(monthName);
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FamilyRelationshipSystem;
} else if (typeof window !== 'undefined') {
    window.FamilyRelationshipSystem = FamilyRelationshipSystem;
}
