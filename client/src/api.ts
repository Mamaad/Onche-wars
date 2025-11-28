
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Alliance, Planet, AllianceRecruitmentState, AllianceApplication, TradeOffer, ChatMessage, War, Talent, Artifact } from './types';
import { INITIAL_RESOURCES, BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB, OFFICER_DB, TALENT_TREE } from './constants';
import { calculateUserPoints } from './utils';

// CONFIGURATION API
const API_URL = (import.meta as any).env?.PROD ? '' : 'http://localhost:1000'; // En prod, url relative. En dev, localhost.

// --- STRUCTURES PAR DÉFAUT (Pour l'initialisation client si besoin) ---
const createPlanet = (id: string, name: string, g: number, s: number, p: number, isMoon: boolean = false): Planet => {
    const baseTemp = 140 - (p * 10);
    const variation = Math.floor(Math.random() * 40) - 20;
    const maxTemp = baseTemp + variation;
    const minTemp = maxTemp - 40;

    let baseFields = 163;
    if (p <= 3 || p >= 13) baseFields = 100;
    if (isMoon) baseFields = 15; 
    
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

export const api = {
    // --- AUTHENTICATION ---
    
    login: async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('onche_token', data.token); // Store JWT if we implement it later, or ID
                return { success: true, user: data.user };
            }
            return { success: false, error: data.message };
        } catch (e) {
            return { success: false, error: "Erreur de connexion au serveur." };
        }
    },

    register: async (username: string, password: string, email?: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        try {
            // On pré-génère la planète côté client pour simplifier la logique serveur pour l'instant
            // Idéalement, tout ça bouge côté serveur V2.
            const initialPlanet = createPlanet('p-' + Date.now(), 'Colonie', 1, Math.floor(Math.random()*499)+1, Math.floor(Math.random()*12)+1);
            
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, initialPlanet })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('onche_token', data.token);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.message };
        } catch (e) {
            return { success: false, error: "Impossible de joindre le serveur." };
        }
    },

    logout: () => {
        localStorage.removeItem('onche_token');
    },

    getSession: async (): Promise<User | null> => {
        const token = localStorage.getItem('onche_token');
        if (!token) return null;
        
        try {
            // Dans cette version simple, on envoie l'ID utilisateur stocké ou le token
            // Le serveur renvoie l'état complet
            const res = await fetch(`${API_URL}/api/game/state`, {
                headers: { 'Authorization': token }
            });
            if (res.ok) {
                const data = await res.json();
                return data.user;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    // --- GAME STATE SYNC ---
    
    saveGameState: async (user: User) => {
        try {
            const token = localStorage.getItem('onche_token');
            if(!token) return;

            // Recalcul des points avant envoi
            user.points = calculateUserPoints(user);
            user.lastUpdate = Date.now();

            await fetch(`${API_URL}/api/game/sync`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token 
                },
                body: JSON.stringify(user)
            });
        } catch (e) {
            console.error("Save failed", e);
        }
    },

    // --- ACTIONS QUI REQUIERENT DES REQUETES SPECIFIQUES ---
    // Pour l'instant, pour simplifier la migration massive, 
    // la plupart des actions modifient l'objet User localement puis appellent saveGameState.
    // Les fonctions ci-dessous simulent encore des interactions globales en attendant une refonte serveur complète.

    colonizePlanet: async (user: User, coords: {g: number, s: number, p: number}) => {
        const newPlanet = createPlanet('p-' + Date.now() + Math.random(), 'Nouvelle Colonie', coords.g, coords.s, coords.p);
        user.planets.push(newPlanet);
        await api.saveGameState(user);
    },

    // GALAXY & SYSTEM (Read-only from server basically)
    getGalaxyData: async () => {
        // Fetch global galaxy state
        try {
            const res = await fetch(`${API_URL}/api/galaxy`);
            if(res.ok) return await res.json();
        } catch(e) {}
        return {};
    },

    updateGalaxyDebris: async (coords: string, debris: Resources) => {
        // Push to server
        try {
            await fetch(`${API_URL}/api/galaxy/debris`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coords, debris })
            });
        } catch(e) {}
    },

    harvestDebris: async (coords: string, capacity: number): Promise<Resources> => {
        try {
            const res = await fetch(`${API_URL}/api/galaxy/harvest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coords, capacity })
            });
            if(res.ok) return await res.json();
        } catch(e) {}
        return { risitasium:0, stickers:0, sel:0, karma:0, karmaMax:0, redpills:0 };
    },

    // --- INTERACTIONS ---

    canAttack: async (attacker: User, targetCoords: string): Promise<{allowed: boolean, reason?: string}> => {
        // TODO: Server check logic
        if (attacker.isAdmin) return { allowed: true };
        return { allowed: true };
    },

    getAlliances: async (): Promise<Alliance[]> => {
        try {
            const res = await fetch(`${API_URL}/api/alliance`);
            if(res.ok) return await res.json();
        } catch(e) {}
        return [];
    },

    // Les fonctions d'alliance modifient l'état global, donc doivent passer par des endpoints spécifiques
    createAlliance: async (founder: User, tag: string, name: string): Promise<{ success: boolean, error?: string }> => {
        const res = await fetch(`${API_URL}/api/alliance/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('onche_token') || '' },
            body: JSON.stringify({ tag, name })
        });
        return await res.json();
    },

    joinAlliance: async (user: User, allianceId: string): Promise<{ success: boolean, error?: string }> => {
        const res = await fetch(`${API_URL}/api/alliance/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('onche_token') || '' },
            body: JSON.stringify({ allianceId })
        });
        return await res.json();
    },
    
    // Fallbacks pour éviter de casser le build si les endpoints ne sont pas encore tous là
    leaveAlliance: async (user: User) => {
        user.allianceId = undefined;
        await api.saveGameState(user);
        return { success: true };
    },
    
    // --- CHAT ---
    sendMessage: async (user: User, channel: 'global' | 'alliance' | 'trade', content: string): Promise<void> => {
        await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('onche_token') || '' },
            body: JSON.stringify({ channel, content })
        });
    },

    getMessages: async (): Promise<ChatMessage[]> => {
        try {
            const res = await fetch(`${API_URL}/api/chat`);
            if(res.ok) return await res.json();
        } catch(e) {}
        return [];
    },

    // --- MARKET ---
    getMarketOffers: async (): Promise<TradeOffer[]> => {
        try {
            const res = await fetch(`${API_URL}/api/market`);
            if(res.ok) return await res.json();
        } catch(e) {}
        return [];
    },

    createTradeOffer: async (user: User, offer: any): Promise<{success: boolean, error?: string}> => {
        const res = await fetch(`${API_URL}/api/market/offer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('onche_token') || '' },
            body: JSON.stringify(offer)
        });
        return await res.json();
    },

    acceptTradeOffer: async (buyer: User, offerId: string): Promise<{success: boolean, error?: string}> => {
        const res = await fetch(`${API_URL}/api/market/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('onche_token') || '' },
            body: JSON.stringify({ offerId })
        });
        
        // Si succès, le serveur a mis à jour le vendeur, mais on doit mettre à jour l'acheteur (local)
        // Note: Dans une version V2, le serveur renvoie le nouvel état user complet.
        if (res.ok) {
            const data = await res.json();
            // Simple re-sync
            return { success: true };
        }
        return { success: false, error: "Erreur" };
    },

    // --- PLACEHOLDERS ---
    // Ces fonctions sont complexes à migrer en 1 coup, on garde une implémentation minimale ou mockée
    // qui pourra être remplacée par de vrais appels serveur.
    
    scanPhalanx: async (user: User, target: string): Promise<{ success: boolean, error?: string, missions?: FleetMission[] }> => ({ success: false, error: "Serveur requis (WIP)" }),
    fireMissiles: async (user: User, coords: string, amount: number, target: string): Promise<{ success: boolean, report?: string, error?: string }> => ({ success: true, report: "Simulation désactivée temporairement." }),
    declareWar: async (allianceId: string, targetId: string): Promise<{ success: boolean, error?: string }> => ({ success: true }),
    manageWar: async (allianceId: string, warId: string, accept: boolean): Promise<{ success: boolean, error?: string }> => ({ success: true }),
    manageApplication: async (allianceId: string, appId: string, accept: boolean): Promise<{ success: boolean, error?: string }> => ({ success: true }),
    updateAllianceDetails: async (allianceId: string, details: any): Promise<{ success: boolean, error?: string }> => ({ success: true }),
    applyToAlliance: async (user: User, allianceId: string, message: string): Promise<{ success: boolean, error?: string }> => ({ success: true }),
    adminUpdateUser: async (userId: string, data: any): Promise<void> => {},
    recalculateAlliancePoints: async (): Promise<void> => {},
    
    // --- RANKING ---
    getHighscores: async (): Promise<User[]> => {
        try {
            const res = await fetch(`${API_URL}/api/highscores`);
            if(res.ok) return await res.json();
        } catch(e) {}
        return [];
    },
    
    getAllUsers: async (): Promise<User[]> => {
        // Admin only
        return [];
    },
    
    // --- SCRAP ---
    scrapShips: async (user: User, shipId: string, count: number) => {
        // Logic should be server side, for now optimistic UI handled in View, verify save
        await api.saveGameState(user);
        return { success: true, resources: { risitasium: 0, stickers: 0, sel: 0, karma: 0, karmaMax: 0, redpills: 0 }};
    },
    
    learnTalent: async (user: User, id: string): Promise<{ success: boolean, error?: string }> => {
        await api.saveGameState(user);
        return { success: true };
    }
};

// Helpers exportés pour compatibilité
export const getGalaxyDB = () => ({});
