
import React from 'react';
import { LucideHelpCircle, LucideShield, LucideZap, LucideCoins, LucidePackage, LucideRadar } from 'lucide-react';
import { TechCard } from '../components/TechCard';

export const HelpView = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CENTRE D'AIDE & TUTORIELS</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Manuel de survie pour Khey Galactique v0.2.0</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-tech-gold mb-4 flex items-center gap-2">
                <LucideCoins /> ÉCONOMIE & STOCKAGE
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><span className="text-white font-bold">Capacité :</span> Vos mines ne produisent plus si vos hangars sont pleins. Construisez des Hangars !</li>
                <li><span className="text-white font-bold">Sel (Deutérium) :</span> Le carburant de votre flotte. Consommé à chaque déplacement. Produit par le Raffineur.</li>
                <li><span className="text-white font-bold">Commerce :</span> Utilisez le nouvel onglet "Commerce" pour échanger avec d'autres joueurs ou vendre au Syndicat (Taxe 30%).</li>
            </ul>
        </TechCard>

        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-tech-blue mb-4 flex items-center gap-2">
                <LucideZap /> ÉNERGIE (KARMA)
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><span className="text-white font-bold">Centrale Solaire :</span> Base de la production.</li>
                <li><span className="text-white font-bold">Satellites Solaires :</span> Unités construites dans le Chantier Spatial. Produisent de l'énergie selon la température de la planète (plus il fait chaud, mieux c'est).</li>
                <li><span className="text-white font-bold">Fusion :</span> Produit énormément d'énergie mais consomme du Sel en continu.</li>
            </ul>
        </TechCard>

        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-red-500 mb-4 flex items-center gap-2">
                <LucideShield /> COMBAT & DÉFENSE
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><span className="text-white font-bold">Rapid Fire :</span> Certains vaisseaux (ex: Croiseur) tirent plusieurs fois par tour sur des cibles faibles.</li>
                <li><span className="text-white font-bold">Missiles :</span> Les Missiles Interplanétaires détruisent les défenses sans combat spatial. Construisez des Missiles d'Interception pour vous protéger.</li>
                <li><span className="text-white font-bold">Phalange de Capteur :</span> Permet de voir les mouvements de flotte ennemis sur les planètes voisines (Coût: 5000 Sel).</li>
            </ul>
        </TechCard>

        <TechCard className="p-6">
             <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2"><LucidePackage/> ASTUCES DE PRO</h3>
             <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300">
                 <li>Ne laissez jamais votre flotte à quai la nuit (Ghosting). Envoyez-la en mission "Transport" ou "Recyclage" vers un champ de débris.</li>
                 <li>Utilisez le simulateur de combat avant d'attaquer une cible défendue.</li>
                 <li>Rejoignez une Alliance pour bénéficier de la protection de groupe.</li>
                 <li>Le "Terraformeur" sera bientôt disponible pour augmenter la taille des planètes.</li>
             </ol>
        </TechCard>
      </div>
    </div>
  );
};
