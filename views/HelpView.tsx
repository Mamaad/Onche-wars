
import React from 'react';
import { LucideHelpCircle, LucideShield, LucideZap, LucideCoins } from 'lucide-react';
import { TechCard } from '../components/TechCard';

export const HelpView = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">CENTRE D'AIDE</h2>
        <p className="text-slate-500 font-mono text-sm mt-1">Guide de survie pour Khey Galactique.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-tech-gold mb-4 flex items-center gap-2">
                <LucideCoins /> GAGNER DES REDPILLS
            </h3>
            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                Les Redpills sont la monnaie premium de l'univers. Elles permettent de recruter des Officiers puissants.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><span className="text-white font-bold">Expéditions :</span> En envoyant votre flotte en "Expédition 410" (Slot 16), vous avez une chance de trouver des stocks cachés.</li>
                <li><span className="text-white font-bold">Succès :</span> Atteindre certains niveaux de bâtiments.</li>
                <li><span className="text-white font-bold">Rareté :</span> C'est une ressource rare, ne la gâchez pas !</li>
            </ul>
        </TechCard>

        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-tech-blue mb-4 flex items-center gap-2">
                <LucideZap /> ÉNERGIE & KARMA
            </h3>
            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                Le Karma représente l'énergie de votre empire. Si votre Karma est négatif (rouge), vos mines et usines tourneront au ralenti !
            </p>
            <div className="bg-slate-900/50 p-3 rounded border border-slate-800 text-xs font-mono">
                <p className="text-green-400 mb-1">Production Karma: Centrale Solaire, Fusion</p>
                <p className="text-red-400">Consommation: Mines, Synthétiseurs</p>
            </div>
        </TechCard>

        <TechCard className="p-6">
            <h3 className="text-xl font-display font-bold text-red-500 mb-4 flex items-center gap-2">
                <LucideShield /> SYSTÈME DE COMBAT
            </h3>
            <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                Les combats se déroulent en 6 tours. Chaque vaisseau tire sur une cible aléatoire.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
                <li><span className="text-white font-bold">Bouclier :</span> Se régénère à chaque tour. Absorbe les dégâts légers.</li>
                <li><span className="text-white font-bold">Coque :</span> Si elle tombe à 0, le vaisseau est détruit.</li>
                <li><span className="text-white font-bold">Rapid Fire :</span> Certains vaisseaux tirent plusieurs fois sur des cibles spécifiques (ex: Le Croiseur contre les Chasseurs Légers).</li>
            </ul>
        </TechCard>

        <TechCard className="p-6">
             <h3 className="text-xl font-display font-bold text-white mb-4">ASTUCES DE DÉPART</h3>
             <ol className="list-decimal list-inside space-y-3 text-sm text-slate-300">
                 <li>Commencez par monter vos <strong>Mines de Risitium</strong> et <strong>Stickers</strong> au niveau 5.</li>
                 <li>Construisez rapidement une <strong>Centrale Solaire</strong> pour ne pas manquer d'énergie.</li>
                 <li>Débloquez le <strong>Chantier Spatial</strong> pour construire des Transporteurs et piller des planètes inactives (marquées 'i' dans la galaxie).</li>
                 <li>Ne laissez jamais vos ressources à quai la nuit ! Faites voler votre flotte (Ghosting).</li>
             </ol>
        </TechCard>
      </div>
    </div>
  );
};
