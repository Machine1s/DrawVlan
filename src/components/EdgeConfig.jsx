import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, ArrowRight, ArrowLeft, Trash2, Tag, Check, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

export default function EdgeConfig({ edge, onClose, onUpdate, onDelete }) {
    const [tempName, setTempName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (edge) {
            setTempName(edge.data?.cableName || '');
        }
    }, [edge]);

    if (!edge) return null;

    const currentDir = edge.data?.direction || 'both';

    const handleConfirmName = () => {
        onUpdate(edge.id, { cableName: tempName });
        setIsEditing(false);
    };

    const handleCancelName = () => {
        setTempName(edge.data?.cableName || '');
        setIsEditing(false);
    };

    const directions = [
        { id: 'both', label: 'Bi-directional (Full Duplex)', icon: ArrowRightLeft, desc: 'Traffic can flow both ways (Default)' },
        { id: 'a-to-b', label: `${edge.data?.sourceLabel} → ${edge.data?.targetLabel}`, icon: ArrowRight, desc: 'Uni-directional transmitter' },
        { id: 'b-to-a', label: `${edge.data?.targetLabel} → ${edge.data?.sourceLabel}`, icon: ArrowLeft, desc: 'Uni-directional receiver' },
    ];

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
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Tag size={18} className="text-blue-400" />
                            Cable Configuration
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col gap-5">
                        {/* Name Configuration */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-2">
                                <Tag size={10} /> Cable Name
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
                                    placeholder="Enter custom label..."
                                />

                                <AnimatePresence>
                                    {isEditing && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="flex gap-2 overflow-hidden"
                                        >
                                            <button
                                                onClick={handleConfirmName}
                                                className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-colors shadow-lg shadow-blue-500/20"
                                            >
                                                <Check size={12} /> Confirm Change
                                            </button>
                                            <button
                                                onClick={handleCancelName}
                                                className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition-colors border border-slate-700"
                                            >
                                                <RotateCcw size={12} /> Cancel
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="h-px bg-slate-800" />

                        {/* Flow Direction */}
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Flow Direction</div>
                            <div className="flex flex-col gap-2">
                                {directions.map((dir) => {
                                    const Icon = dir.icon;
                                    const isActive = currentDir === dir.id;
                                    return (
                                        <button
                                            key={dir.id}
                                            onClick={() => onUpdate(edge.id, { direction: dir.id })}
                                            className={clsx(
                                                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                                                isActive
                                                    ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800"
                                            )}
                                        >
                                            <div className={clsx("p-2 rounded ", isActive ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-500")}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{dir.label}</div>
                                                <div className="text-[10px] opacity-60 leading-tight mt-1">{dir.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-2 pt-4 border-t border-slate-800 flex justify-between gap-3">
                            <button
                                onClick={() => onDelete(edge.id)}
                                className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-500/30"
                            >
                                <Trash2 size={14} /> Remove Cable
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg text-xs font-bold transition-all shadow-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
