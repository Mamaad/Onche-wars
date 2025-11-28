
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// PORT INTERNE : 3000 (Nginx écoutera le 1000 et redirigera ici)
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }) as any);

// --- STATIC FILES (Frontend) ---
app.use(express.static(path.join(__dirname, '../../client/dist')) as any);

AppDataSource.initialize().then(async () => {
    console.log("Database connected.");

    const userRepo = AppDataSource.getRepository(User);

    // --- API ROUTES ---

    // Register
    app.post("/api/auth/register", async (req, res) => {
        const { username, password, email, initialPlanet } = req.body;
        
        const existing = await userRepo.findOneBy({ username });
        if (existing) return res.status(400).json({ message: "Pseudo pris." });

        const newUser = new User();
        newUser.username = username;
        newUser.password = password; 
        newUser.email = email;
        newUser.isAdmin = username.toLowerCase() === 'admin';
        
        // Init Game State
        newUser.planets = [initialPlanet];
        newUser.currentPlanetId = initialPlanet.id; 
        newUser.research = []; 
        newUser.officers = [];
        newUser.missions = [];
        newUser.reports = [];
        newUser.talents = [];
        newUser.inventory = [];
        newUser.completedQuests = [];
        newUser.points = { total: 0, buildings: 0, fleet: 0, defense: 0, research: 0, economy: 0 };

        await userRepo.save(newUser);
        
        const { password: _, ...userNoPass } = newUser;
        res.json({ success: true, user: { ...userNoPass, id: newUser.id }, token: newUser.id });
    });

    // Login
    app.post("/api/auth/login", async (req, res) => {
        const { username, password } = req.body;
        const user = await userRepo.findOneBy({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        const { password: _, ...userNoPass } = user;
        res.json({ success: true, user: { ...userNoPass, id: user.id }, token: user.id });
    });

    // Get State
    app.get("/api/game/state", async (req, res) => {
        const id = req.headers['authorization'];
        if (!id) return res.status(401).send();

        const user = await userRepo.findOneBy({ id });
        if (!user) return res.status(404).send();

        const { password: _, ...userNoPass } = user;
        if(!userNoPass.planets) userNoPass.planets = [];
        
        res.json({ user: { ...userNoPass, currentPlanetId: userNoPass.planets[0]?.id } });
    });

    // Save State
    app.post("/api/game/sync", async (req, res) => {
        const id = req.headers['authorization'];
        if (!id) return res.status(401).send();

        const user = await userRepo.findOneBy({ id });
        if (!user) return res.status(404).send();

        const body = req.body;
        user.planets = body.planets;
        user.resources = body.resources;
        user.research = body.research;
        user.fleet = body.fleet;
        user.defenses = body.defenses;
        user.buildings = body.buildings;
        user.missions = body.missions;
        user.reports = body.reports;
        user.points = body.points;
        user.lastUpdate = Date.now();
        user.commanderXp = body.commanderXp;
        user.commanderLevel = body.commanderLevel;
        user.skillPoints = body.skillPoints;
        user.talents = body.talents;
        user.inventory = body.inventory;
        user.theme = body.theme;
        user.vacationMode = body.vacationMode;
        user.completedQuests = body.completedQuests;
        user.allianceId = body.allianceId;

        await userRepo.save(user);
        res.json({ success: true });
    });

    // Highscores
    app.get("/api/highscores", async (req, res) => {
        const users = await userRepo.find({
            select: ["id", "username", "points", "allianceId", "isAdmin"],
            take: 100
        });
        users.sort((a, b) => (b.points?.total || 0) - (a.points?.total || 0));
        res.json(users);
    });

    // Fallbacks
    app.get("/api/galaxy", (req, res) => res.json({}));
    app.get("/api/alliance", (req, res) => res.json([]));
    app.get("/api/market", (req, res) => res.json([]));
    app.get("/api/chat", (req, res) => res.json([]));

    // React Routing (SPA)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });

    app.listen(PORT, "127.0.0.1", () => {
        console.log(`Server started internally on port ${PORT}`);
    });

}).catch(error => console.log(error));
