
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Alliance, Planet, AllianceRecruitmentState, AllianceApplication, TradeOffer, ChatMessage, War, Talent, Artifact } from './types';
import { INITIAL_RESOURCES, BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB, OFFICER_DB, TALENT_TREE, ARTIFACT_DB } from './constants';
import { calculateUserPoints } from './utils';

// SIMULATION D'UN BACKEND API VIA LOCALSTORAGE

const DB_KEY = 'onche_wars_db_users';
const ALLIANCE_KEY = 'onche_wars_db_alliances';
const GALAXY_KEY = 'onche_wars_db_galaxy';
const MARKET_KEY = 'onche_wars_db_market'; 
const CHAT_KEY = 'onche_wars_db_chat'; // NEW
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

const getMarketDB = (): TradeOffer[] => {
    const data = localStorage.getItem(MARKET_KEY);
    if (!data || JSON.parse(data).length === 0) {
        const mocks: TradeOffer[] = [
            { id: 'm1', sellerId: 'ai_1', sellerName: 'Marchand_IA', type: 'sell', offeredResource: 'risitasium', offeredAmount: 5000, requestedResource: 'stickers', requestedAmount: 2500, date: Date.now() },
            { id: 'm2', sellerId: 'ai_2', sellerName: 'Empire_Stark', type: 'sell', offeredResource: 'sel', offeredAmount: 1000, requestedResource: 'risitasium', requestedAmount: 4000, date: Date.now() - 100000 },
        ];
        localStorage.setItem(MARKET_KEY, JSON.stringify(mocks));
        return mocks;
    }
    return JSON.parse(data);
};

const saveMarketDB = (offers: TradeOffer[]) => {
    localStorage.setItem(MARKET_KEY, JSON.stringify(offers));
};

const getChatDB = (): ChatMessage[] => {
    const data = localStorage.getItem(CHAT_KEY);
    return data ? JSON.parse(data) : [];
};

const saveChatDB = (messages: ChatMessage[]) => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
};

// --- PLANET GENERATION LOGIC ---
const createPlanet = (id: string, name: string, g: number, s: number, p: number, isMoon: boolean = false): Planet => {
    const baseTemp = 140 - (p * 10);
    const variation = Math.floor(Math.random() * 40) - 20;
    const maxTemp = baseTemp + variation;
    const minTemp = maxTemp - 40;

    let baseFields = 163;
    if (p <= 3 || p >= 13) baseFields = 100;
    if (isMoon) baseFields = 15; // Moons start small
    
    const fields = Math.floor(baseFields + (Math.random() * 60) - 20);

    return {
        id,
        name,
        coords: { g, s, p },
        resources: isMoon ? { risitasium: 0, stickers: 0, sel: 0, karma: 0, karmaMax: 0, redpills: 0 } : { ...INITIAL_RESOURCES, redpills: 0 }, 
        buildings: JSON.parse(JSON.stringify(BUILDING_DB)),
        fleet: JSON.parse(JSON.stringify(SHIP_DB)),
        defenses: JSON.parse(JSON.stringify(DEFENSE_DB)),
        queue: [],
        lastUpdate: Date.now(),
        temperature: { min: minTemp, max: maxTemp },
        fields: { current: 0, max: fields },
        isMoon
    };
};

const createInitialUser = (username: string, email?: string): User => {
    const planetId = 'p-' + Date.now();
    const planet = createPlanet(planetId, 'Colonie', 1, 42, 6); 
    
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
        completedQuests: [],
        commanderLevel: 1,
        commanderXp: 0,
        skillPoints: 0,
        talents: JSON.parse(JSON.stringify(TALENT_TREE)),
        inventory: [],
        theme: 'default'
    }
};

export const api = {
    // AUTHENTICATION
    login: async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        await new Promise(r => setTimeout(r, 500));
        const users = getDB();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
            const legacyUser = user as any;
            if (!user.planets || user.planets.length === 0) {
                 user.planets = [createPlanet('p-'+user.id, legacyUser.planetName || 'Colonie', 1, 42, 6)];
                 if (legacyUser.resources) user.planets[0].resources = legacyUser.resources;
                 if (legacyUser.buildings) user.planets[0].buildings = legacyUser.buildings;
                 if (legacyUser.fleet) user.planets[0].fleet = legacyUser.fleet;
                 if (legacyUser.defenses) user.planets[0].defenses = legacyUser.defenses;
                 user.currentPlanetId = user.planets[0].id;
            }
            // Migration check for new props
            if (!user.talents) user.talents = JSON.parse(JSON.stringify(TALENT_TREE));
            if (!user.inventory) user.inventory = [];
            if (!user.theme) user.theme = 'default'; // THEME MIGRATION
            
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
            user.planets.forEach(p => {
                // Add terraformer bonus
                const terraformer = p.buildings.find(b => b.id === 'terraformeur')?.level || 0;
                const moonBase = p.buildings.find(b => b.id === 'base_lunaire')?.level || 0;
                let baseMax = p.isMoon ? 15 : (163 + (Math.random() * 20)); // Simplified
                if(p.isMoon) baseMax = 15 + (moonBase * 3);
                else baseMax = baseMax + (terraformer * 5);
                
                p.fields.current = p.buildings.reduce((acc, b) => acc + b.level, 0);
                p.fields.max = Math.floor(baseMax);
            });
            const points = calculateUserPoints(user);
            
            // Check Commander Level Up
            const nextLevelXp = user.commanderLevel * 1000;
            if (user.commanderXp >= nextLevelXp) {
                user.commanderLevel++;
                user.commanderXp -= nextLevelXp;
                user.skillPoints += 1;
            }

            users[index] = { ...user, points, lastUpdate: Date.now() };
            saveDB(users);
            
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

    canAttack: async (attacker: User, targetCoords: string): Promise<{allowed: boolean, reason?: string}> => {
        const users = getDB();
        const targetPlanet = users.flatMap(u => u.planets).find(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords);
        if (!targetPlanet) return { allowed: true };

        const defender = users.find(u => u.planets.some(p => p.id === targetPlanet.id));
        if (!defender) return { allowed: true };

        if (defender.vacationMode) return { allowed: false, reason: "Mode Vacances actif." };
        
        // Check Alliance War
        if (attacker.allianceId && defender.allianceId) {
            const alliances = getAlliancesDB();
            const attAlly = alliances.find(a => a.id === attacker.allianceId);
            const war = attAlly?.wars?.find(w => w.status === 'active' && (w.attackerId === defender.allianceId || w.defenderId === defender.allianceId));
            if (war) return { allowed: true }; // WAR OVERRIDES BASHING
        }

        if (attacker.isAdmin) return { allowed: true };

        const ratio = attacker.points.total / Math.max(1, defender.points.total);
        if (attacker.points.total > 5000 && defender.points.total < 5000) {
             if (ratio > 5) return { allowed: false, reason: "Protection des débutants active (Joueur trop faible)." };
        }
        if (defender.points.total > 5000 && attacker.points.total < 5000) {
             if (1/ratio > 5) return { allowed: false, reason: "Protection des débutants active (Joueur trop fort)." };
        }

        return { allowed: true };
    },

    scanPhalanx: async (user: User, targetCoords: string): Promise<{success: boolean, missions?: FleetMission[], error?: string}> => {
        const currentP = user.planets.find(p => p.id === user.currentPlanetId);
        if (!currentP) return { success: false, error: "Planète erreur" };
        if (!currentP.isMoon) return { success: false, error: "La phalange ne peut être utilisée que sur une Lune." };
        
        const phalanx = currentP.buildings.find(b => b.id === 'phalange_capteur');
        if (!phalanx || phalanx.level === 0) return { success: false, error: "Pas de Phalange de Capteur." };

        const [tG, tS] = targetCoords.split(':').map(Number);
        const range = Math.pow(phalanx.level, 2) - 1;
        if (currentP.coords.g !== tG || Math.abs(currentP.coords.s - tS) > range) {
            return { success: false, error: "Hors de portée." };
        }

        if (currentP.resources.sel < 5000) return { success: false, error: "Pas assez de Sel (5000)." };
        
        user.planets = user.planets.map(p => p.id === currentP.id ? {...p, resources: {...p.resources, sel: p.resources.sel - 5000}} : p);
        api.saveGameState(user);

        const users = getDB();
        const allMissions = users.flatMap(u => u.missions);
        const relevantMissions = allMissions.filter(m => m.target === targetCoords || m.source === targetCoords);
        
        return { success: true, missions: relevantMissions };
    },

    fireMissiles: async (attacker: User, targetCoords: string, amount: number, primaryTarget: string): Promise<{success: boolean, report?: string, error?: string}> => {
        const currentP = attacker.planets.find(p => p.id === attacker.currentPlanetId);
        if (!currentP) return { success: false, error: "Planète erreur" };

        const silo = currentP.buildings.find(b => b.id === 'silo_missiles');
        if (!silo || silo.level === 0) return { success: false, error: "Pas de Silo." };

        const mip = currentP.defenses.find(d => d.id === 'missile_interplanetaire');
        if (!mip || mip.count < amount) return { success: false, error: "Pas assez de missiles." };

        const impulse = attacker.research.find(r => r.id === 'moteur_impulsion')?.level || 0;
        const range = (impulse * 5) - 1;
        
        const [tG, tS] = targetCoords.split(':').map(Number);
        if (currentP.coords.g !== tG || Math.abs(currentP.coords.s - tS) > range) {
            return { success: false, error: "Cible hors de portée." };
        }

        const users = getDB();
        const defender = users.find(u => u.planets.some(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords));
        
        attacker.planets.find(p => p.id === currentP.id)!.defenses.find(d => d.id === 'missile_interplanetaire')!.count -= amount;
        
        if (!defender) {
            api.saveGameState(attacker);
            return { success: true, report: "Cible introuvable, missiles perdus dans le vide." };
        }

        const targetPlanet = defender.planets.find(p => `${p.coords.g}:${p.coords.s}:${p.coords.p}` === targetCoords)!;
        
        const interceptors = targetPlanet.defenses.find(d => d.id === 'missile_interception');
        let intercepted = 0;
        if (interceptors && interceptors.count > 0) {
            intercepted = Math.min(amount, interceptors.count);
            interceptors.count -= intercepted;
        }

        const hits = amount - intercepted;
        let damageLog = `Missiles lancés: ${amount}. Interceptés: ${intercepted}.\n`;

        if (hits > 0) {
            let damageBudget = hits * 2000; 
            const primaryDef = targetPlanet.defenses.find(d => d.id === primaryTarget);
            if (primaryDef && primaryDef.count > 0) {
                const destroyed = Math.min(primaryDef.count, Math.floor(damageBudget / (primaryDef.baseCost.risitasium / 100)));
                primaryDef.count -= destroyed;
                damageBudget -= destroyed * (primaryDef.baseCost.risitasium / 100);
                damageLog += `${destroyed} ${primaryDef.name} détruits.\n`;
            }
            
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

        api.saveGameState(attacker);
        api.saveGameState(defender); 

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
            description: "Bienvenue dans notre alliance.",
            creationDate: Date.now(),
            points: freshFounder.points.total,
            recruitment: 'open',
            applications: [],
            wars: [] // NEW
        };

        alliances.push(newAlly);
        saveAlliancesDB(alliances);

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
            alliances[allyIdx].members.push(application.userId);
            alliances[allyIdx].points += application.points; 
            
            const users = getDB();
            const uIdx = users.findIndex(u => u.id === application.userId);
            if (uIdx !== -1) {
                users[uIdx].allianceId = allianceId;
                saveDB(users);
            }
        }

        alliances[allyIdx].applications.splice(appIdx, 1);
        saveAlliancesDB(alliances);
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
            saveAlliancesDB(alliances);
        }

        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = undefined;
            saveDB(users);
        }
        return { success: true };
    },

    // --- WAR SYSTEM ---
    declareWar: async (attackerAllyId: string, defenderAllyId: string): Promise<{ success: boolean, error?: string }> => {
        const alliances = getAlliancesDB();
        const attIdx = alliances.findIndex(a => a.id === attackerAllyId);
        const defIdx = alliances.findIndex(a => a.id === defenderAllyId);

        if (attIdx === -1 || defIdx === -1) return { success: false, error: "Alliance introuvable" };
        if (attackerAllyId === defenderAllyId) return { success: false, error: "Impossible de se déclarer la guerre." };

        const newWar: War = {
            id: Date.now().toString(),
            attackerId: attackerAllyId,
            defenderId: defenderAllyId,
            attackerName: alliances[attIdx].name,
            defenderName: alliances[defIdx].name,
            startDate: Date.now(),
            status: 'pending',
            scoreAttacker: 0,
            scoreDefender: 0
        };

        if (!alliances[attIdx].wars) alliances[attIdx].wars = [];
        if (!alliances[defIdx].wars) alliances[defIdx].wars = [];

        alliances[attIdx].wars.push(newWar);
        alliances[defIdx].wars.push(newWar); // Shared object in local storage simulation needs care, simplified here by duplicating

        saveAlliancesDB(alliances);

        // Send mail to defender leader
        const users = getDB();
        const defLeader = users.find(u => u.id === alliances[defIdx].founderId);
        if (defLeader) {
            defLeader.reports.unshift({
                id: Date.now() + '_war',
                type: 'war',
                title: 'DÉCLARATION DE GUERRE',
                content: `L'alliance ${alliances[attIdx].name} [${alliances[attIdx].tag}] vous a déclaré la guerre. Vous devez accepter ou refuser dans le menu Alliance.`,
                date: Date.now(),
                read: false
            });
            saveDB(users);
        }

        return { success: true };
    },

    manageWar: async (allyId: string, warId: string, accept: boolean): Promise<{success: boolean}> => {
        const alliances = getAlliancesDB();
        
        // Update all alliances having this war (simulation limitation fix)
        const updatedAlliances = alliances.map(a => {
            if (a.wars) {
                const warIdx = a.wars.findIndex(w => w.id === warId);
                if (warIdx !== -1) {
                    if (accept) {
                        a.wars[warIdx].status = 'active';
                        a.wars[warIdx].startDate = Date.now();
                    } else {
                        a.wars.splice(warIdx, 1); // Remove pending war
                    }
                }
            }
            return a;
        });
        
        saveAlliancesDB(updatedAlliances);
        return { success: true };
    },

    // --- CHAT SYSTEM ---
    sendMessage: async (user: User, channel: 'global' | 'alliance' | 'trade', content: string): Promise<void> => {
        const msgs = getChatDB();
        const ally = user.allianceId ? (getAlliancesDB().find(a => a.id === user.allianceId)?.tag || '') : '';
        
        msgs.push({
            id: Date.now().toString(),
            sender: user.username,
            senderId: user.id,
            channel,
            content: content.substring(0, 200), // Limit length
            timestamp: Date.now(),
            allianceTag: ally
        });
        
        // Keep last 100 messages
        if (msgs.length > 100) msgs.shift();
        saveChatDB(msgs);
    },

    getMessages: async (): Promise<ChatMessage[]> => {
        return getChatDB();
    },

    // --- TALENTS ---
    learnTalent: async (user: User, talentId: string): Promise<{success: boolean, error?: string}> => {
        if (user.skillPoints <= 0) return { success: false, error: "Pas de points de compétence." };
        
        const talent = user.talents.find(t => t.id === talentId);
        if (!talent) return { success: false, error: "Talent introuvable." };
        if (talent.currentLevel >= talent.maxLevel) return { success: false, error: "Niveau max atteint." };

        // Check Reqs
        if (talent.reqs) {
            const reqsMet = Object.entries(talent.reqs).every(([reqId, lvl]) => {
                const t = user.talents.find(x => x.id === reqId);
                return t && t.currentLevel >= lvl;
            });
            if (!reqsMet) return { success: false, error: "Prérequis non remplis." };
        }

        talent.currentLevel++;
        user.skillPoints--;
        
        await api.saveGameState(user);
        return { success: true };
    },

    // --- SCRAPYARD ---
    scrapShips: async (user: User, shipId: string, count: number): Promise<{success: boolean, resources?: Resources}> => {
        const planet = user.planets.find(p => p.id === user.currentPlanetId);
        if (!planet) return { success: false };
        
        const ship = planet.fleet.find(s => s.id === shipId);
        if (!ship || ship.count < count) return { success: false };

        // Remove ships
        ship.count -= count;

        // Calculate refund (50%)
        const dbShip = SHIP_DB.find(s => s.id === shipId)!;
        const refundRis = (dbShip.baseCost.risitasium * count) * 0.5;
        const refundSti = (dbShip.baseCost.stickers * count) * 0.5;
        const refundSel = (dbShip.baseCost.sel * count) * 0.5;

        planet.resources.risitasium += refundRis;
        planet.resources.stickers += refundSti;
        planet.resources.sel += refundSel;

        await api.saveGameState(user);
        
        return { success: true, resources: { risitasium: refundRis, stickers: refundSti, sel: refundSel, karma:0, karmaMax:0, redpills:0 }};
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
    },

    // --- MARKET API ---
    getMarketOffers: async (): Promise<TradeOffer[]> => {
        return getMarketDB();
    },

    createTradeOffer: async (user: User, offer: Omit<TradeOffer, 'id' | 'sellerId' | 'sellerName' | 'date'>): Promise<{success: boolean, error?: string}> => {
        const currentP = user.planets.find(p => p.id === user.currentPlanetId);
        if (!currentP) return { success: false, error: "Erreur planète." };

        // Check resources
        if (currentP.resources[offer.offeredResource] < offer.offeredAmount) {
            return { success: false, error: "Ressources insuffisantes." };
        }

        // Deduct resources immediately (Escrow)
        currentP.resources[offer.offeredResource] -= offer.offeredAmount;
        
        const newOffer: TradeOffer = {
            id: Date.now().toString(),
            sellerId: user.id,
            sellerName: user.username,
            date: Date.now(),
            ...offer
        };

        const offers = getMarketDB();
        offers.push(newOffer);
        saveMarketDB(offers);
        
        // Save user state with deducted resources
        await api.saveGameState(user);

        return { success: true };
    },

    acceptTradeOffer: async (buyer: User, offerId: string): Promise<{success: boolean, error?: string}> => {
        const offers = getMarketDB();
        const offerIdx = offers.findIndex(o => o.id === offerId);
        if (offerIdx === -1) return { success: false, error: "Offre expirée." };
        const offer = offers[offerIdx];

        if (offer.sellerId === buyer.id) {
            // Cancel offer logic
            const currentP = buyer.planets.find(p => p.id === buyer.currentPlanetId);
            if (currentP) {
                currentP.resources[offer.offeredResource] += offer.offeredAmount;
                offers.splice(offerIdx, 1);
                saveMarketDB(offers);
                await api.saveGameState(buyer);
                return { success: true };
            }
            return { success: false, error: "Erreur ref." };
        }

        const currentP = buyer.planets.find(p => p.id === buyer.currentPlanetId);
        if (!currentP) return { success: false, error: "Erreur planète." };

        // Check buyer funds
        if (currentP.resources[offer.requestedResource] < offer.requestedAmount) {
            return { success: false, error: "Fonds insuffisants." };
        }

        // TRANSACTION
        // 1. Deduct from Buyer
        currentP.resources[offer.requestedResource] -= offer.requestedAmount;
        // 2. Add goods to Buyer
        currentP.resources[offer.offeredResource] += offer.offeredAmount;
        
        // 3. Credit Seller (Simulated, normally async)
        const users = getDB();
        const seller = users.find(u => u.id === offer.sellerId);
        if (seller) {
            // Ideally find which planet posted it, simplified: give to first planet
            seller.planets[0].resources[offer.requestedResource] += offer.requestedAmount;
            
            // Send message to seller
            const report: Report = {
                id: Date.now().toString(),
                type: 'transport',
                title: 'Commerce terminé',
                content: `Votre offre a été acceptée par ${buyer.username}. Vous avez reçu ${offer.requestedAmount} ${offer.requestedResource}.`,
                date: Date.now(),
                read: false
            };
            seller.reports.unshift(report);
            saveDB(users); // Save seller update
        }

        // Remove offer
        offers.splice(offerIdx, 1);
        saveMarketDB(offers);
        await api.saveGameState(buyer);

        return { success: true };
    }
};
