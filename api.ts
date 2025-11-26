
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Alliance, Planet, AllianceRecruitmentState, AllianceApplication } from './types';
import { INITIAL_RESOURCES, BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB, OFFICER_DB } from './constants';
import { calculateUserPoints } from './utils';

// SIMULATION D'UN BACKEND API VIA LOCALSTORAGE

const DB_KEY = 'onche_wars_db_users';
const ALLIANCE_KEY = 'onche_wars_db_alliances';
const GALAXY_KEY = 'onche_wars_db_galaxy'; // Stores debris, etc.
const SESSION_KEY = 'onche_wars_session';

const getDB = (): User[] => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
};

const saveDB = (users: User[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
};

const getAlliancesDB = (): Alliance[] => {
    const data = localStorage.getItem(ALLIANCE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveAlliancesDB = (alliances: Alliance[]) => {
    localStorage.setItem(ALLIANCE_KEY, JSON.stringify(alliances));
};

export const getGalaxyDB = (): any => {
    const data = localStorage.getItem(GALAXY_KEY);
    return data ? JSON.parse(data) : {};
};

export const saveGalaxyDB = (data: any) => {
    localStorage.setItem(GALAXY_KEY, JSON.stringify(data));
};

// --- PLANET GENERATION LOGIC ---
const createPlanet = (id: string, name: string, g: number, s: number, p: number): Planet => {
    // Temperature Formula based on Position
    // Pos 1: Hot (~200°C), Pos 15: Cold (~-100°C)
    // Avg Temp = 140 - 10 * pos + random variation
    const baseTemp = 140 - (p * 10);
    const variation = Math.floor(Math.random() * 40) - 20;
    const maxTemp = baseTemp + variation;
    const minTemp = maxTemp - 40;

    // Fields Formula
    // Gaussian distribution around 163 fields + random
    // Simplified: Base 163 + random(-30, +60)
    // Specific positions (1, 2, 3, 13, 14, 15) are smaller
    let baseFields = 163;
    if (p <= 3 || p >= 13) baseFields = 100;
    const fields = Math.floor(baseFields + (Math.random() * 60) - 20);

    return {
        id,
        name,
        coords: { g, s, p },
        resources: { ...INITIAL_RESOURCES, redpills: 0 }, 
        buildings: JSON.parse(JSON.stringify(BUILDING_DB)),
        fleet: JSON.parse(JSON.stringify(SHIP_DB)),
        defenses: JSON.parse(JSON.stringify(DEFENSE_DB)),
        queue: [],
        lastUpdate: Date.now(),
        temperature: { min: minTemp, max: maxTemp },
        fields: { current: 0, max: fields }
    };
};

const createInitialUser = (username: string, email?: string): User => {
    const planetId = 'p-' + Date.now();
    const planet = createPlanet(planetId, 'Colonie', 1, 42, 6); // Pos 6 is balanced
    
    return {
        id: Date.now().toString(),
        username,
        email,
        isAdmin: username.toLowerCase() === 'admin',
        points: { total: 0, buildings: 0, research: 0, fleet: 0, defense: 0, economy: 0 },
        research: RESEARCH_DB,
        officers: OFFICER_DB,
        planets: [planet],
        currentPlanetId: planetId,
        missions: [],
        reports: [],
        lastUpdate: Date.now(),
        vacationMode: false,
        completedQuests: []
    }
};

export const api = {
    // AUTHENTICATION
    login: async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        await new Promise(r => setTimeout(r, 500));
        const users = getDB();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
            // MIGRATION HELPER
            const legacyUser = user as any;
            if (!user.planets || user.planets.length === 0) {
                 user.planets = [createPlanet('p-'+user.id, legacyUser.planetName || 'Colonie', 1, 42, 6)];
                 if (legacyUser.resources) user.planets[0].resources = legacyUser.resources;
                 if (legacyUser.buildings) user.planets[0].buildings = legacyUser.buildings;
                 if (legacyUser.fleet) user.planets[0].fleet = legacyUser.fleet;
                 if (legacyUser.defenses) user.planets[0].defenses = legacyUser.defenses;
                 user.currentPlanetId = user.planets[0].id;
            }
            
            localStorage.setItem(SESSION_KEY, user.id);
            return { success: true, user };
        }
        return { success: false, error: "Utilisateur inconnu." };
    },

    register: async (username: string, password: string, email?: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        await new Promise(r => setTimeout(r, 500));
        const users = getDB();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, error: "Pseudo déjà pris." };
        }
        const newUser = createInitialUser(username, email);
        users.push(newUser);
        saveDB(users);
        localStorage.setItem(SESSION_KEY, newUser.id);
        return { success: true, user: newUser };
    },

    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    },

    getSession: async (): Promise<User | null> => {
        const id = localStorage.getItem(SESSION_KEY);
        if (!id) return null;
        const users = getDB();
        return users.find(u => u.id === id) || null;
    },

    // GAME STATE
    saveGameState: async (user: User) => {
        const users = getDB();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            // Update fields count usage
            user.planets.forEach(p => {
                p.fields.current = p.buildings.reduce((acc, b) => acc + b.level, 0);
            });
            // Recalculate points on save
            const points = calculateUserPoints(user);
            users[index] = { ...user, points, lastUpdate: Date.now() };
            saveDB(users);
            
            // Also update alliance points if in alliance
            if (user.allianceId) {
                api.recalculateAlliancePoints(user.allianceId);
            }
        }
    },

    colonizePlanet: async (user: User, coords: {g: number, s: number, p: number}) => {
        const newPlanet = createPlanet('p-' + Date.now() + Math.random(), 'Nouvelle Colonie', coords.g, coords.s, coords.p);
        user.planets.push(newPlanet);
        await api.saveGameState(user);
    },

    updateGalaxyDebris: async (coords: string, debris: Resources) => {
        const gal = getGalaxyDB();
        if (!gal[coords]) gal[coords] = {};
        if (!gal[coords].debris) gal[coords].debris = { risitasium: 0, stickers: 0, sel: 0 };
        
        gal[coords].debris.risitasium += debris.risitasium;
        gal[coords].debris.stickers += debris.stickers;
        gal[coords].debris.sel += debris.sel;
        saveGalaxyDB(gal);
    },

    harvestDebris: async (coords: string, capacity: number): Promise<Resources> => {
        const gal = getGalaxyDB();
        if (!gal[coords] || !gal[coords].debris) return { risitasium:0, stickers:0, sel:0, karma:0, karmaMax:0, redpills:0 };
        
        const d = gal[coords].debris;
        const total = d.risitasium + d.stickers + d.sel;
        
        if (total <= capacity) {
            const harvested = { ...d };
            gal[coords].debris = { risitasium:0, stickers:0, sel:0 };
            saveGalaxyDB(gal);
            return { ...harvested, karma:0, karmaMax:0, redpills:0 };
        } else {
            // Partial harvest
            const ratio = capacity / total;
            const harvested = {
                risitasium: Math.floor(d.risitasium * ratio),
                stickers: Math.floor(d.stickers * ratio),
                sel: Math.floor(d.sel * ratio),
            };
            d.risitasium -= harvested.risitasium;
            d.stickers -= harvested.stickers;
            d.sel -= harvested.sel;
            saveGalaxyDB(gal);
            return { ...harvested, karma:0, karmaMax:0, redpills:0 };
        }
    },

    // --- NEW MECHANICS ---
    
    // NOOB PROTECTION CHECK
    canAttack: async (attacker: User, targetCoords: string): Promise<{allowed: boolean, reason?: string}> => {
        const users = getDB();
        const targetPlanet = users.flatMap(u => u.planets).find(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords);
        if (!targetPlanet) return { allowed: true }; // Attack empty space or aliens?

        const defender = users.find(u => u.planets.some(p => p.id === targetPlanet.id));
        if (!defender) return { allowed: true };

        if (defender.vacationMode) return { allowed: false, reason: "Mode Vacances actif." };
        if (attacker.isAdmin) return { allowed: true }; // Admin bypass

        const ratio = attacker.points.total / Math.max(1, defender.points.total);
        if (attacker.points.total > 5000 && defender.points.total < 5000) {
             if (ratio > 5) return { allowed: false, reason: "Protection des débutants active (Joueur trop faible)." };
        }
        if (defender.points.total > 5000 && attacker.points.total < 5000) {
             if (1/ratio > 5) return { allowed: false, reason: "Protection des débutants active (Joueur trop fort)." };
        }

        return { allowed: true };
    },

    // SENSOR PHALANX
    scanPhalanx: async (user: User, targetCoords: string): Promise<{success: boolean, missions?: FleetMission[], error?: string}> => {
        // Check if user has Phalanx on current planet
        const currentP = user.planets.find(p => p.id === user.currentPlanetId);
        if (!currentP) return { success: false, error: "Planète erreur" };
        
        const phalanx = currentP.buildings.find(b => b.id === 'phalange_capteur');
        if (!phalanx || phalanx.level === 0) return { success: false, error: "Pas de Phalange de Capteur." };

        const [tG, tS] = targetCoords.split(':').map(Number);
        
        // Range check: (Level)^2 - 1 systems
        const range = Math.pow(phalanx.level, 2) - 1;
        if (currentP.coords.g !== tG || Math.abs(currentP.coords.s - tS) > range) {
            return { success: false, error: "Hors de portée." };
        }

        // Cost
        if (currentP.resources.sel < 5000) return { success: false, error: "Pas assez de Sel (5000)." };
        
        // Deduct cost and save
        user.planets = user.planets.map(p => p.id === currentP.id ? {...p, resources: {...p.resources, sel: p.resources.sel - 5000}} : p);
        api.saveGameState(user);

        // Find missions
        const users = getDB();
        const allMissions = users.flatMap(u => u.missions);
        const relevantMissions = allMissions.filter(m => m.target === targetCoords || m.source === targetCoords);
        
        return { success: true, missions: relevantMissions };
    },

    // MISSILE ATTACK
    fireMissiles: async (attacker: User, targetCoords: string, amount: number, primaryTarget: string): Promise<{success: boolean, report?: string, error?: string}> => {
        const currentP = attacker.planets.find(p => p.id === attacker.currentPlanetId);
        if (!currentP) return { success: false, error: "Planète erreur" };

        const silo = currentP.buildings.find(b => b.id === 'silo_missiles');
        if (!silo || silo.level === 0) return { success: false, error: "Pas de Silo." };

        const mip = currentP.defenses.find(d => d.id === 'missile_interplanetaire');
        if (!mip || mip.count < amount) return { success: false, error: "Pas assez de missiles." };

        // Range Formula: (Impulse Drive Level * 5) - 1 
        const impulse = attacker.research.find(r => r.id === 'moteur_impulsion')?.level || 0;
        const range = (impulse * 5) - 1;
        
        const [tG, tS] = targetCoords.split(':').map(Number);
        if (currentP.coords.g !== tG || Math.abs(currentP.coords.s - tS) > range) {
            return { success: false, error: "Cible hors de portée." };
        }

        // EXECUTE ATTACK
        const users = getDB();
        const defender = users.find(u => u.planets.some(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords));
        
        // Consume missiles
        attacker.planets.find(p => p.id === currentP.id)!.defenses.find(d => d.id === 'missile_interplanetaire')!.count -= amount;
        
        if (!defender) {
            api.saveGameState(attacker);
            return { success: true, report: "Cible introuvable, missiles perdus dans le vide." };
        }

        const targetPlanet = defender.planets.find(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords)!;
        
        // Interceptors?
        const interceptors = targetPlanet.defenses.find(d => d.id === 'missile_interception');
        let intercepted = 0;
        if (interceptors && interceptors.count > 0) {
            intercepted = Math.min(amount, interceptors.count);
            interceptors.count -= intercepted;
        }

        const hits = amount - intercepted;
        let damageLog = `Missiles lancés: ${amount}. Interceptés: ${intercepted}.\n`;

        if (hits > 0) {
            // Damage calculation: simplified. Each missile destroys X structure points of defense.
            // Say 1 missile = 50 structure damage (low for testing).
            // Actually OGame formula: MIP destroys structure. 
            // Let's say 1 MIP destroys 20 units of 'lanceur_pls' equiv.
            let damageBudget = hits * 2000; // arbitrary damage points
            
            // Prioritize primary target
            const primaryDef = targetPlanet.defenses.find(d => d.id === primaryTarget);
            if (primaryDef && primaryDef.count > 0) {
                const destroyed = Math.min(primaryDef.count, Math.floor(damageBudget / (primaryDef.baseCost.risitasium / 100))); // approx cost
                primaryDef.count -= destroyed;
                damageBudget -= destroyed * (primaryDef.baseCost.risitasium / 100);
                damageLog += `${destroyed} ${primaryDef.name} détruits.\n`;
            }
            
            // Splash damage
            if (damageBudget > 0) {
                targetPlanet.defenses.forEach(d => {
                    if (damageBudget <= 0 || d.id === primaryTarget) return;
                    const destroyed = Math.min(d.count, Math.floor(damageBudget / (d.baseCost.risitasium / 100)));
                    d.count -= destroyed;
                    damageBudget -= destroyed * (d.baseCost.risitasium / 100);
                    if(destroyed > 0) damageLog += `${destroyed} ${d.name} détruits.\n`;
                });
            }
        } else {
            damageLog += "Tous les missiles ont été interceptés.";
        }

        // Save states
        api.saveGameState(attacker);
        api.saveGameState(defender); // Need to save defender too (we are simulating backend here)

        // Send Report to Defender
        const defReport: Report = {
            id: Date.now().toString() + 'def',
            type: 'missile',
            title: 'Attaque de Missiles',
            content: `Une attaque de missiles venant de [${currentP.coords.g}:${currentP.coords.s}:${currentP.coords.p}] a frappé votre planète.\n${damageLog}`,
            date: Date.now(),
            read: false
        };
        defender.reports.unshift(defReport);
        api.saveGameState(defender);

        return { success: true, report: damageLog };
    },


    // ALLIANCE SYSTEM
    getAlliances: async (): Promise<Alliance[]> => {
        return getAlliancesDB();
    },

    recalculateAlliancePoints: (allianceId: string) => {
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return;

        const users = getDB();
        const members = users.filter(u => u.allianceId === allianceId);
        const totalPoints = members.reduce((acc, curr) => acc + curr.points.total, 0);

        alliances[allyIdx].points = totalPoints;
        saveAlliancesDB(alliances);
    },

    createAlliance: async (founder: User, tag: string, name: string): Promise<{ success: boolean, error?: string }> => {
        const users = getDB();
        const freshFounder = users.find(u => u.id === founder.id);
        if (!freshFounder) return { success: false, error: "Utilisateur introuvable." };
        if (freshFounder.allianceId) return { success: false, error: "Vous êtes déjà dans une alliance." };
        
        // STRICT POINTS CHECK
        if (freshFounder.points.total < 1000) return { success: false, error: "1000 points requis." };

        const alliances = getAlliancesDB();
        if (alliances.some(a => a.tag === tag || a.name === name)) {
            return { success: false, error: "Tag ou Nom déjà pris." };
        }
        
        const newAlly: Alliance = {
            id: tag.toUpperCase(),
            tag: tag.toUpperCase(),
            name,
            founderId: founder.id,
            members: [founder.id],
            description: "Bienvenue dans notre alliance. Modifiez cette description dans l'administration.",
            creationDate: Date.now(),
            points: freshFounder.points.total,
            recruitment: 'open',
            applications: []
        };

        alliances.push(newAlly);
        saveAlliancesDB(alliances);

        // Update User
        const uIdx = users.findIndex(u => u.id === founder.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = newAlly.id;
            saveDB(users);
        }

        return { success: true };
    },

    updateAllianceDetails: async (allianceId: string, updates: Partial<Alliance>): Promise<{ success: boolean }> => {
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return { success: false };

        alliances[allyIdx] = { ...alliances[allyIdx], ...updates };
        saveAlliancesDB(alliances);
        return { success: true };
    },

    applyToAlliance: async (user: User, allianceId: string, message: string): Promise<{ success: boolean, error?: string }> => {
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return { success: false, error: "Alliance introuvable." };

        if (alliances[allyIdx].recruitment === 'closed') return { success: false, error: "Recrutement clos." };
        if (alliances[allyIdx].applications.some(app => app.userId === user.id)) return { success: false, error: "Candidature déjà envoyée." };

        const application: AllianceApplication = {
            id: Date.now().toString(),
            userId: user.id,
            username: user.username,
            points: user.points.total,
            message,
            date: Date.now()
        };

        alliances[allyIdx].applications.push(application);
        saveAlliancesDB(alliances);
        return { success: true };
    },

    manageApplication: async (allianceId: string, applicationId: string, accept: boolean): Promise<{ success: boolean }> => {
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return { success: false };

        const appIdx = alliances[allyIdx].applications.findIndex(a => a.id === applicationId);
        if (appIdx === -1) return { success: false };

        const application = alliances[allyIdx].applications[appIdx];

        if (accept) {
            // Add user to alliance
            alliances[allyIdx].members.push(application.userId);
            alliances[allyIdx].points += application.points; // Approx update, real calc later
            
            // Update User
            const users = getDB();
            const uIdx = users.findIndex(u => u.id === application.userId);
            if (uIdx !== -1) {
                users[uIdx].allianceId = allianceId;
                saveDB(users);
            }
        }

        // Remove application in both cases
        alliances[allyIdx].applications.splice(appIdx, 1);
        saveAlliancesDB(alliances);
        
        // Recalc exact points
        api.recalculateAlliancePoints(allianceId);
        return { success: true };
    },

    joinAlliance: async (user: User, allianceId: string): Promise<{ success: boolean, error?: string }> => {
        const users = getDB();
        const freshUser = users.find(u => u.id === user.id);
        if (!freshUser) return { success: false, error: "Utilisateur introuvable." };
        if (freshUser.allianceId) return { success: false, error: "Vous êtes déjà dans une alliance." };

        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return { success: false, error: "Alliance introuvable." };
        
        if (alliances[allyIdx].recruitment === 'closed') return { success: false, error: "Recrutement clos." };
        if (alliances[allyIdx].recruitment === 'application') return { success: false, error: "Candidature requise." };

        alliances[allyIdx].members.push(user.id);
        alliances[allyIdx].points += user.points.total;
        saveAlliancesDB(alliances);

        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = allianceId;
            saveDB(users);
        }
        return { success: true };
    },

    leaveAlliance: async (user: User): Promise<{ success: boolean }> => {
        const users = getDB();
        const freshUser = users.find(u => u.id === user.id);
        if (!freshUser || !freshUser.allianceId) return { success: false };
        
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === freshUser.allianceId);
        
        if (allyIdx !== -1) {
            alliances[allyIdx].members = alliances[allyIdx].members.filter(id => id !== user.id);
            alliances[allyIdx].points -= user.points.total;
            // if last member, delete alliance logic could go here
            saveAlliancesDB(alliances);
        }

        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = undefined;
            saveDB(users);
        }
        return { success: true };
    },

    getHighscores: async (): Promise<User[]> => {
        const users = getDB();
        const updatedUsers = users.map(u => ({...u, points: calculateUserPoints(u)}));
        saveDB(updatedUsers);
        return updatedUsers.sort((a, b) => b.points.total - a.points.total);
    },

    getAllUsers: async (): Promise<User[]> => {
        return getDB();
    },

    adminUpdateUser: async (userId: string, data: Partial<User>) => {
        const users = getDB();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...data };
            saveDB(users);
        }
    }
};
