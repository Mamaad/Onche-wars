
import { User, Resources, Building, Research, Ship, Defense, Officer, ConstructionItem, FleetMission, Report, Alliance } from './types';
import { INITIAL_RESOURCES, BUILDING_DB, RESEARCH_DB, SHIP_DB, DEFENSE_DB, OFFICER_DB } from './constants';
import { calculateUserPoints } from './utils';

// SIMULATION D'UN BACKEND API VIA LOCALSTORAGE

const DB_KEY = 'onche_wars_db_users';
const ALLIANCE_KEY = 'onche_wars_db_alliances';
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

const createInitialUser = (username: string, email?: string): User => ({
    id: Date.now().toString(),
    username,
    email,
    planetName: 'Colonie',
    isAdmin: username.toLowerCase() === 'admin',
    points: { total: 0, buildings: 0, research: 0, fleet: 0, defense: 0, economy: 0 },
    resources: INITIAL_RESOURCES,
    buildings: BUILDING_DB,
    research: RESEARCH_DB,
    fleet: SHIP_DB,
    defenses: DEFENSE_DB,
    officers: OFFICER_DB,
    queue: [],
    missions: [],
    reports: [],
    lastUpdate: Date.now()
});

export const api = {
    // AUTHENTICATION
    login: async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
        await new Promise(r => setTimeout(r, 500));
        const users = getDB();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
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
            // Recalculate points on save
            const points = calculateUserPoints(user);
            users[index] = { ...user, points, lastUpdate: Date.now() };
            saveDB(users);
        }
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

    // ALLIANCE SYSTEM
    getAlliances: async (): Promise<Alliance[]> => {
        return getAlliancesDB();
    },

    createAlliance: async (founder: User, tag: string, name: string): Promise<{ success: boolean, error?: string }> => {
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
            description: "Nouvelle alliance.",
            creationDate: Date.now()
        };

        alliances.push(newAlly);
        saveAlliancesDB(alliances);

        // Update User
        const users = getDB();
        const uIdx = users.findIndex(u => u.id === founder.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = newAlly.id;
            saveDB(users);
        }

        return { success: true };
    },

    joinAlliance: async (user: User, allianceId: string): Promise<{ success: boolean, error?: string }> => {
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === allianceId);
        if (allyIdx === -1) return { success: false, error: "Alliance introuvable." };

        alliances[allyIdx].members.push(user.id);
        saveAlliancesDB(alliances);

        const users = getDB();
        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = allianceId;
            saveDB(users);
        }
        return { success: true };
    },

    leaveAlliance: async (user: User): Promise<{ success: boolean }> => {
        if (!user.allianceId) return { success: false };
        
        const alliances = getAlliancesDB();
        const allyIdx = alliances.findIndex(a => a.id === user.allianceId);
        
        if (allyIdx !== -1) {
            alliances[allyIdx].members = alliances[allyIdx].members.filter(id => id !== user.id);
            // If empty, delete alliance? Or if founder leaves? (Simplified: alliance persists)
            saveAlliancesDB(alliances);
        }

        const users = getDB();
        const uIdx = users.findIndex(u => u.id === user.id);
        if (uIdx !== -1) {
            users[uIdx].allianceId = undefined;
            saveDB(users);
        }
        return { success: true };
    }
};
