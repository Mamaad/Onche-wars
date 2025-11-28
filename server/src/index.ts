
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 1000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for game state sync

// --- STATIC FILES (Frontend) ---
// On sert le dossier 'client/dist' construit par Vite
app.use(express.static(path.join(__dirname, '../../../client/dist')));

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
        newUser.password = password; // TODO: Hash password with bcrypt in V2
        newUser.email = email;
        newUser.isAdmin = username.toLowerCase() === 'admin';
        
        // Init Game State
        newUser.planets = [initialPlanet];
        newUser.currentPlanetId = initialPlanet.id; // Hack: add to json via any
        newUser.research = []; // TODO: Load default DB
        newUser.officers = [];
        newUser.missions = [];
        newUser.reports = [];
        newUser.talents = [];
        newUser.inventory = [];
        newUser.completedQuests = [];
        newUser.points = { total: 0, buildings: 0, fleet: 0, defense: 0, research: 0, economy: 0 };

        await userRepo.save(newUser);
        
        // Return user with ID but without password
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

    // Get State (Session Resume)
    app.get("/api/game/state", async (req, res) => {
        const id = req.headers['authorization'];
        if (!id) return res.status(401).send();

        const user = await userRepo.findOneBy({ id });
        if (!user) return res.status(404).send();

        const { password: _, ...userNoPass } = user;
        // Fix: Ensure basic arrays exist if JSON was null
        if(!userNoPass.planets) userNoPass.planets = [];
        
        res.json({ user: { ...userNoPass, currentPlanetId: userNoPass.planets[0]?.id } });
    });

    // Save State (Sync)
    app.post("/api/game/sync", async (req, res) => {
        const id = req.headers['authorization'];
        if (!id) return res.status(401).send();

        const user = await userRepo.findOneBy({ id });
        if (!user) return res.status(404).send();

        // Update fields from body
        // SECURITY WARNING: In V2, verify logic here instead of blindly saving
        const body = req.body;
        
        user.planets = body.planets;
        user.resources = body.resources; // Note: resources usually inside planets
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
        // Sort logic needs to handle JSON extraction or be done in JS for now
        users.sort((a, b) => (b.points?.total || 0) - (a.points?.total || 0));
        res.json(users);
    });

    // Fallback Galaxy Data (Mock for now)
    app.get("/api/galaxy", (req, res) => res.json({}));
    app.get("/api/alliance", (req, res) => res.json([]));
    app.get("/api/market", (req, res) => res.json([]));
    app.get("/api/chat", (req, res) => res.json([]));

    // Handle React Routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server started on port ${PORT}`);
    });

}).catch(error => console.log(error));
