import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Monitor, Server, Laptop, Tablet, Check, RotateCcw, Tag, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function TerminalConfig({ terminal, onClose, onUpdate, onDelete }) {
    const [tempName, setTempName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (terminal) {
            setTempName(terminal.data?.label || '');
        }
    }, [terminal]);

    if (!terminal) return null;

    const currentCategory = terminal.data?.category || 'pc';
    const currentDir = terminal.data?.direction || 'both';

    const categories = [
        { id: 'pc', label: 'Workstation / PC', icon: Monitor },
        { id: 'server', label: 'Data Server', icon: Server },
        { id: 'laptop', label: 'Notebook', icon: Laptop },
        { id: 'tablet', label: 'Mobile / Tablet', icon: Tablet },
    ];

    const directions = [
        { id: 'both', label: 'Full Duplex', icon: ArrowRightLeft, desc: 'Send & Receive (Default)' },
        { id: 'a-to-b', label: 'TX Only', icon: ArrowRight, desc: 'Transmit towards switch' },
        { id: 'b-to-a', label: 'RX Only', icon: ArrowLeft, desc: 'Receive from switch' },
    ];

    const handleConfirmName = () => {
        onUpdate(terminal.id, { label: tempName });
        setIsEditing(false);
    };

    const handleCancelName = () => {
        setTempName(terminal.data?.label || '');
        setIsEditing(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[400px] overflow-hidden"
                >
                    <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
                        <h3 className="text-white font-bold flex items-center gap-2 italic font-mono">
                            [Terminal.Config]
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col gap-5">
                        {/* Label Config */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                                <Tag size={10} /> data.label
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    className={clsx(
                                        "w-full bg-slate-950 border rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none transition-all font-mono",
                                        isEditing ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-800"
                                    )}
                                    value={tempName}
                                    onFocus={() => setIsEditing(true)}
                                    onChange={(e) => setTempName(e.target.value)}
                                />
                                <AnimatePresence>
                                    {isEditing && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex gap-2 mt-2"
                                        >
                                            <button onClick={handleConfirmName} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded transition-all">
                                                Update Label
                                            </button>
                                            <button onClick={handleCancelName} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1.5 rounded transition-all border border-slate-700">
                                                Discard
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Category Config */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">data.category (Icon)</div>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = currentCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => onUpdate(terminal.id, { category: cat.id })}
                                            className={clsx(
                                                "flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                                                isActive ? "bg-blue-600 border-blue-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                            )}
                                        >
                                            <Icon size={14} />
                                            <span className="text-[10px] font-bold">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Direction Config */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">data.direction</div>
                            <div className="space-y-2">
                                {directions.map((dir) => {
                                    const Icon = dir.icon;
                                    const isActive = currentDir === dir.id;
                                    return (
                                        <button
                                            key={dir.id}
                                            onClick={() => onUpdate(terminal.id, { direction: dir.id })}
                                            className={clsx(
                                                "w-full flex items-center justify-between p-2.5 rounded-lg border transition-all",
                                                isActive ? "bg-blue-600/10 border-blue-500 text-blue-400" : "bg-slate-800/40 border-slate-800 text-slate-500 hover:border-slate-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("p-1.5 rounded", isActive ? "bg-blue-500 text-white" : "bg-slate-700")}>
                                                    <Icon size={12} className={dir.id !== 'both' ? 'rotate-90' : ''} />
                                                </div>
                                                <span className="text-xs font-bold">{dir.label}</span>
                                            </div>
                                            <span className="text-[9px] opacity-40">{dir.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-2 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <button
                                onClick={() => onDelete(terminal.id)}
                                className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-500/20 transition-all"
                            >
                                <Trash2 size={12} /> Remove [Node]
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
