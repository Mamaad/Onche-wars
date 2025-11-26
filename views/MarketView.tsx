
import React, { useState, useEffect } from 'react';
import { LucideArrowRightLeft, LucideCoins, LucideScale, LucideShoppingCart, LucidePackage, LucideUser, LucideRefreshCcw } from 'lucide-react';
import { Resources, TradeOffer, User } from '../types';
import { TechCard } from '../components/TechCard';
import { TechButton } from '../components/TechButton';
import { formatNumber } from '../utils';
import { api } from '../api';

export const MarketView = ({ resources, onTrade, user }: { resources: Resources, onTrade: (cost: Partial<Resources>, gain: Partial<Resources>) => void, user: User }) => {
    const [activeTab, setActiveTab] = useState<'p2p' | 'blackmarket'>('p2p');
    
    // P2P State
    const [offers, setOffers] = useState<TradeOffer[]>([]);
    const [offerType, setOfferType] = useState<'risitasium' | 'stickers' | 'sel'>('risitasium');
    const [requestType, setRequestType] = useState<'risitasium' | 'stickers' | 'sel'>('stickers');
    const [offerAmount, setOfferAmount] = useState(0);
    const [requestAmount, setRequestAmount] = useState(0);

    // Black Market State
    const [sellType, setSellType] = useState<'risitasium' | 'stickers' | 'sel'>('risitasium');
    const [buyType, setBuyType] = useState<'risitasium' | 'stickers' | 'sel'>('stickers');
    const [bmAmount, setBmAmount] = useState(0);
    const TAX_RATE = 0.3; 
    const ratios = { risitasium: 1, stickers: 1.5, sel: 3 };

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        const data = await api.getMarketOffers();
        setOffers(data);
    };

    // P2P Logic
    const handleCreateOffer = async () => {
        if (offerAmount <= 0 || requestAmount <= 0) return;
        const res = await api.createTradeOffer(user, {
            type: 'sell',
            offeredResource: offerType,
            offeredAmount: offerAmount,
            requestedResource: requestType,
            requestedAmount: requestAmount
        });
        if (res.success) {
            setOfferAmount(0);
            setRequestAmount(0);
            loadOffers();
            alert("Offre créée ! Les ressources ont été placées sous séquestre.");
        } else {
            alert(res.error);
        }
    };

    const handleAcceptOffer = async (id: string) => {
        const res = await api.acceptTradeOffer(user, id);
        if (res.success) {
            loadOffers();
            alert("Transaction effectuée.");
        } else {
            alert(res.error);
        }
    };

    // Black Market Logic
    const getBmOutput = () => {
        if (sellType === buyType) return bmAmount;
        const inputVal = bmAmount * ratios[sellType];
        const outputVal = inputVal * (1 - TAX_RATE);
        return Math.floor(outputVal / ratios[buyType]);
    };

    const handleBmTrade = () => {
        const cost = { [sellType]: bmAmount };
        const gain = { [buyType]: getBmOutput() };
        if (bmAmount > 0 && resources[sellType] >= bmAmount) {
            onTrade(cost, gain);
            setBmAmount(0);
            alert("Echange terminé avec le Syndicat.");
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white tracking-widest text-glow">COMMERCE INTERGALACTIQUE</h2>
                    <p className="text-slate-500 font-mono text-sm mt-1">Échangez avec d'autres joueurs ou traitez avec le Syndicat.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('p2p')} 
                        className={`px-4 py-2 font-display uppercase text-sm border ${activeTab === 'p2p' ? 'bg-tech-blue text-black border-tech-blue' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                    >
                        Place du Marché
                    </button>
                    <button 
                        onClick={() => setActiveTab('blackmarket')} 
                        className={`px-4 py-2 font-display uppercase text-sm border ${activeTab === 'blackmarket' ? 'bg-red-500 text-black border-red-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}
                    >
                        Marché Noir
                    </button>
                </div>
            </div>

            {/* P2P MARKET */}
            {activeTab === 'p2p' && (
                <div className="space-y-6">
                    {/* CREATE OFFER */}
                    <TechCard className="p-6 border-tech-blue/30">
                        <h3 className="text-tech-blue font-bold mb-4 flex items-center gap-2"><LucidePackage/> CRÉER UNE OFFRE</h3>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-slate-400 block mb-1">Je vends</label>
                                <div className="flex gap-2">
                                    <input type="number" value={offerAmount} onChange={e => setOfferAmount(parseInt(e.target.value)||0)} className="bg-black border border-slate-700 p-2 text-white w-full"/>
                                    <select value={offerType} onChange={e => setOfferType(e.target.value as any)} className="bg-slate-900 text-white border border-slate-700 p-2">
                                        <option value="risitasium">Risitasium</option>
                                        <option value="stickers">Stickers</option>
                                        <option value="sel">Sel</option>
                                    </select>
                                </div>
                            </div>
                            <LucideArrowRightLeft className="text-slate-500 mb-3"/>
                            <div className="flex-1">
                                <label className="text-xs text-slate-400 block mb-1">Je demande</label>
                                <div className="flex gap-2">
                                    <input type="number" value={requestAmount} onChange={e => setRequestAmount(parseInt(e.target.value)||0)} className="bg-black border border-slate-700 p-2 text-white w-full"/>
                                    <select value={requestType} onChange={e => setRequestType(e.target.value as any)} className="bg-slate-900 text-white border border-slate-700 p-2">
                                        <option value="risitasium">Risitasium</option>
                                        <option value="stickers">Stickers</option>
                                        <option value="sel">Sel</option>
                                    </select>
                                </div>
                            </div>
                            <TechButton onClick={handleCreateOffer} disabled={offerAmount <= 0 || requestAmount <= 0}>PUBLIER</TechButton>
                        </div>
                    </TechCard>

                    {/* OFFERS LIST */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded overflow-hidden">
                        <div className="p-4 bg-black/50 border-b border-slate-800 flex justify-between items-center">
                            <span className="font-bold text-white">OFFRES DISPONIBLES</span>
                            <button onClick={loadOffers} className="text-tech-blue hover:text-white"><LucideRefreshCcw size={16}/></button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 uppercase text-xs bg-black">
                                <tr>
                                    <th className="p-4">Vendeur</th>
                                    <th className="p-4">Offre</th>
                                    <th className="p-4">Demande</th>
                                    <th className="p-4 text-right">Taux</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {offers.length === 0 && <tr><td colSpan={5} className="p-8 text-center italic text-slate-500">Aucune offre sur le marché.</td></tr>}
                                {offers.map(offer => {
                                    const rate = (offer.requestedAmount / offer.offeredAmount).toFixed(2);
                                    const isMyOffer = offer.sellerId === user.id;
                                    return (
                                        <tr key={offer.id} className="hover:bg-white/5">
                                            <td className="p-4 font-bold text-blue-300 flex items-center gap-2">
                                                <LucideUser size={14}/> {offer.sellerName}
                                            </td>
                                            <td className="p-4 text-green-400 font-mono">{formatNumber(offer.offeredAmount)} {offer.offeredResource.substr(0,3).toUpperCase()}</td>
                                            <td className="p-4 text-red-400 font-mono">{formatNumber(offer.requestedAmount)} {offer.requestedResource.substr(0,3).toUpperCase()}</td>
                                            <td className="p-4 text-right text-slate-500 font-mono">1:{rate}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleAcceptOffer(offer.id)}
                                                    className={`px-3 py-1 rounded text-xs border ${isMyOffer ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500 hover:bg-green-900'}`}
                                                >
                                                    {isMyOffer ? 'ANNULER' : 'ACHETER'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BLACK MARKET */}
            {activeTab === 'blackmarket' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center animate-fade-in">
                    <TechCard className="p-6 bg-red-900/10 border-red-900/30">
                        <h3 className="text-red-400 font-bold mb-4 uppercase text-center">Vendre</h3>
                        <div className="flex flex-col gap-2">
                            {['risitasium', 'stickers', 'sel'].map((res) => (
                                <button key={res} onClick={() => setSellType(res as any)} className={`p-3 border rounded uppercase font-mono text-sm transition-all ${sellType === res ? 'bg-red-500 text-black border-red-500 font-bold' : 'bg-transparent border-slate-700 text-slate-400'}`}>{res}</button>
                            ))}
                        </div>
                        <div className="mt-4">
                            <input type="number" value={bmAmount} onChange={e => setBmAmount(Math.max(0, parseInt(e.target.value) || 0))} className="w-full bg-black border border-red-900/50 p-2 text-white font-mono text-right"/>
                            <div className="text-xs text-right mt-1 text-slate-500">Dispo: {formatNumber(resources[sellType])}</div>
                        </div>
                    </TechCard>

                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="bg-tech-gold p-4 rounded-full text-black mb-4 shadow-[0_0_20px_rgba(251,191,36,0.5)]"><LucideScale size={32} /></div>
                        <div className="text-tech-gold font-display font-bold text-xl mb-1">TAXE SYNDICAT</div>
                        <div className="text-red-500 font-mono text-lg font-bold">{(TAX_RATE * 100)}%</div>
                        <p className="text-slate-500 text-xs max-w-[200px] mt-2">"Le prix de l'immédiateté."</p>
                        <TechButton onClick={handleBmTrade} disabled={bmAmount <= 0 || resources[sellType] < bmAmount || sellType === buyType} className="mt-4 w-full">ÉCHANGER</TechButton>
                    </div>

                    <TechCard className="p-6 bg-green-900/10 border-green-900/30">
                        <h3 className="text-green-400 font-bold mb-4 uppercase text-center">Recevoir</h3>
                        <div className="flex flex-col gap-2">
                            {['risitasium', 'stickers', 'sel'].map((res) => (
                                <button key={res} onClick={() => setBuyType(res as any)} disabled={sellType === res} className={`p-3 border rounded uppercase font-mono text-sm transition-all ${buyType === res ? 'bg-green-500 text-black border-green-500 font-bold' : 'bg-transparent border-slate-700 text-slate-400 disabled:opacity-30'}`}>{res}</button>
                            ))}
                        </div>
                        <div className="mt-4 p-2 border border-green-900/50 bg-black/50 text-right">
                            <span className="text-2xl font-mono text-white">{formatNumber(getBmOutput())}</span>
                        </div>
                    </TechCard>
                </div>
            )}
        </div>
    );
};
