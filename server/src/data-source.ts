
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "onchewars_user",
    password: "Onchewars94,",
    database: "onchewars_db",
    synchronize: true, // IMPORTANT: Garder à true pour que les tables se créent automatiquement
    logging: false,
    entities: [User],
    subscribers: [],
    migrations: [],
});
