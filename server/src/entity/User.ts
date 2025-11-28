
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ default: false })
    isAdmin!: boolean;

    @Column({ nullable: true })
    allianceId!: string;

    @Column({ nullable: true })
    currentPlanetId!: string;

    // --- JSON STORAGE ---
    // Pour migrer rapidement sans créer 50 tables, on stocke la structure complexe en JSON
    // MariaDB supporte très bien le JSON.
    
    @Column("simple-json", { nullable: true })
    points!: any;

    @Column("simple-json", { nullable: true })
    research!: any;

    @Column("simple-json", { nullable: true })
    officers!: any;

    @Column("simple-json", { nullable: true })
    planets!: any;

    @Column("simple-json", { nullable: true })
    missions!: any;

    @Column("simple-json", { nullable: true })
    reports!: any;

    @Column({ type: "bigint", default: 0 })
    lastUpdate!: number;

    @Column("simple-json", { nullable: true })
    talents!: any;

    @Column("simple-json", { nullable: true })
    inventory!: any;

    @Column({ default: 1 })
    commanderLevel!: number;

    @Column({ default: 0 })
    commanderXp!: number;

    @Column({ default: 0 })
    skillPoints!: number;

    @Column({ default: 'default' })
    theme!: string;

    @Column({ default: false })
    vacationMode!: boolean;

    @Column("simple-json", { nullable: true })
    completedQuests!: string[];

    // Additional fields for sync compatibility
    @Column("simple-json", { nullable: true })
    resources!: any;

    @Column("simple-json", { nullable: true })
    fleet!: any;

    @Column("simple-json", { nullable: true })
    defenses!: any;

    @Column("simple-json", { nullable: true })
    buildings!: any;
}
