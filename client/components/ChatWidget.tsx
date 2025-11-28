
import React, { useState, useEffect, useRef } from 'react';
import { LucideMessageCircle, LucideX, LucideSend, LucideChevronUp } from 'lucide-react';
import { User, ChatMessage } from '../types';
import { api } from '../api';

export const ChatWidget = ({ user }: { user: User | null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [channel, setChannel] = useState<'global' | 'alliance' | 'trade'>('global');
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !isOpen) return;
        
        const fetch = async () => {
            const msgs = await api.getMessages();
            setMessages(msgs);
        };
        fetch();
        
        const interval = setInterval(fetch, 2000);
        return () => clearInterval(interval);
    }, [user, isOpen, lastRefresh]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;
        await api.sendMessage(user, channel, newMessage);
        setNewMessage('');
        setLastRefresh(Date.now());
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {!isOpen ? (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="bg-tech-blue/90 text-black p-4 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] hover:scale-110 transition-transform border-2 border-white"
                >
                    <LucideMessageCircle size={24} />
                </button>
            ) : (
                <div className="bg-slate-900/95 border border-slate-700 rounded-lg w-80 h-96 flex flex-col shadow-2xl overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="bg-black p-3 border-b border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-white text-sm flex items-center gap-2"><LucideMessageCircle size={16}/> COMMS</span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><LucideChevronUp size={16} className="rotate-180"/></button>
                    </div>

                    {/* Channels */}
                    <div className="flex text-xs border-b border-slate-800">
                        <button onClick={() => setChannel('global')} className={`flex-1 py-2 ${channel === 'global' ? 'bg-tech-blue/20 text-tech-blue font-bold' : 'text-slate-500 hover:bg-white/5'}`}>GLOBAL</button>
                        <button onClick={() => setChannel('alliance')} className={`flex-1 py-2 ${channel === 'alliance' ? 'bg-green-900/20 text-green-400 font-bold' : 'text-slate-500 hover:bg-white/5'}`}>ALLIANCE</button>
                        <button onClick={() => setChannel('trade')} className={`flex-1 py-2 ${channel === 'trade' ? 'bg-yellow-900/20 text-yellow-400 font-bold' : 'text-slate-500 hover:bg-white/5'}`}>COMMERCE</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black/40">
                        {messages.filter(m => {
                            if (channel === 'global') return m.channel === 'global';
                            if (channel === 'trade') return m.channel === 'trade';
                            if (channel === 'alliance') return m.channel === 'alliance' && user.allianceId && (getAlliances(user.allianceId, m)); // Complex check needed normally, simplified: assume chat stores tag
                            return false;
                        }).map(msg => (
                            <div key={msg.id} className="text-xs break-words">
                                <span className="text-slate-500 font-mono">[{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}] </span>
                                {msg.allianceTag && <span className="text-tech-gold font-bold">[{msg.allianceTag}] </span>}
                                <span className={`font-bold ${msg.sender === user.username ? 'text-green-400' : 'text-blue-300'}`}>{msg.sender}: </span>
                                <span className="text-slate-300">{msg.content}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-2 bg-black border-t border-slate-800 flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 text-white text-xs focus:border-tech-blue outline-none"
                            placeholder="Message..."
                        />
                        <button type="submit" className="text-tech-blue hover:text-white"><LucideSend size={16}/></button>
                    </form>
                </div>
            )}
        </div>
    );
    
    function getAlliances(id: string, msg: ChatMessage) {
       // Simplification: In real app, backend filters. Here client filters.
       // We check if message sender has same alliance ID in DB (expensive) or rely on tag match.
       // For this demo: Show all alliance messages (Global Alliance Channel simulation)
       return true; 
    }
};
