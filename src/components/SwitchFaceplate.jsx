import React, { useState, useMemo } from 'react';
import { X, Save, Settings, Trash2, Edit3, Check, Code, Monitor, Plus, Cable, Layers, Server, Laptop, Tablet, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * COMPONENT: SwitchFaceplate
 * PURPOSE: Data-driven UI for configuring individual switch nodes with per-port tabbed actions.
 * Optimized with Reciprocal Traffic Logic: Port status reflects Switch-centric perspective.
 */
export default function SwitchFaceplate({
    switchId,
    data,
    onClose,
    onUpdateSwitchData,
    onDeleteSwitch,
    allSwitches = [],
    onAddTerminalToPort,
    onAddCable,
    existingTerminals = [],
    existingEdges = [],
    onDeleteCable
}) {
    const ports = data?.ports || [];
    const connectedPorts = data?.connectedPorts || [];

    const [selectedPortId, setSelectedPortId] = useState(null);
    const [activeTab, setActiveTab] = useState('vlan');
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [tempLabel, setTempLabel] = useState(data?.label || '');

    // Form states
    const [termLabel, setTermLabel] = useState('');
    const [termCategory, setTermCategory] = useState('pc');
    const [termDirection, setTermDirection] = useState('both');
    const [cableDirection, setCableDirection] = useState('both');
    const [targetSwId, setTargetSwId] = useState('');
    const [targetPortId, setTargetPortId] = useState('');
    const [termPvid, setTermPvid] = useState(1);

    const selectedPort = ports.find(p => p.id === selectedPortId);
    const isPortOccupied = useMemo(() => selectedPortId ? connectedPorts.includes(`p-${selectedPortId}`) : false, [selectedPortId, connectedPorts]);

    // DETECTION: Attached Terminal
    const attachedTerminal = useMemo(() => {
        if (!selectedPortId) return null;
        return existingTerminals.find(t => t.parentId === switchId && t.data.attachedPort === `p-${selectedPortId}`);
    }, [selectedPortId, existingTerminals, switchId]);

    // DETECTION: Attached Cable
    const attachedCable = useMemo(() => {
        if (!selectedPortId) return null;
        return existingEdges.find(e =>
            (e.source === switchId && e.sourceHandle === `p-${selectedPortId}`) ||
            (e.target === switchId && e.targetHandle === `p-${selectedPortId}`)
        );
    }, [selectedPortId, existingEdges, switchId]);

    const handlePortClick = (port) => {
        setSelectedPortId(port.id);

        // Intelligent Tab Switching
        const term = existingTerminals.find(t => t.parentId === switchId && t.data.attachedPort === `p-${port.id}`);
        const cable = existingEdges.find(e =>
            (e.source === switchId && e.sourceHandle === `p-${port.id}`) ||
            (e.target === switchId && e.targetHandle === `p-${port.id}`)
        );

        if (term) {
            setActiveTab('terminal-config');
            setTermDirection(term.data.direction || 'both');
        } else if (cable) {
            setActiveTab('cable-config');
            setCableDirection(cable.data.direction || 'both');
        } else if (connectedPorts.includes(`p-${port.id}`)) {
            setActiveTab('vlan');
        } else {
            if (activeTab === 'terminal-config') setActiveTab('terminal');
            if (activeTab === 'cable-config') setActiveTab('cable');
        }

        if (!termLabel || termLabel.startsWith('PC-')) {
            setTermLabel(`PC-${Math.floor(Math.random() * 1000)}`);
        }
        setTargetPortId('');
        setTermPvid(port.pvid || 1);
    };

    const updateTerminalConfig = (key, value) => {
        if (!attachedTerminal) return;
        onUpdateSwitchData(attachedTerminal.id, { [key]: value });
    };

    const updateCableConfig = (key, value) => {
        if (!attachedCable) return;
        onUpdateSwitchData(attachedCable.id, { [key]: value });
    };

    const updatePortConfig = (key, value) => {
        if (!selectedPort) return;
        let val = value;
        if (key === 'pvid') val = parseInt(value) || 1;
        const newPorts = ports.map(p => p.id === selectedPort.id ? { ...p, [key]: val } : p);
        onUpdateSwitchData(switchId, { ports: newPorts });
    };

    const handleLabelSave = () => {
        onUpdateSwitchData(switchId, { label: tempLabel });
        setIsEditingLabel(false);
    };

    const handleAddTerminal = () => {
        if (!selectedPort) return;

        // Sync PVID if changed
        if (parseInt(termPvid) !== selectedPort.pvid) {
            updatePortConfig('pvid', termPvid);
        }

        onAddTerminalToPort(switchId, selectedPort.id, {
            label: termLabel,
            category: termCategory,
            direction: termDirection
        });
    };

    const handleAddCable = () => {
        if (!selectedPort || !targetSwId || !targetPortId) return;
        onAddCable(switchId, selectedPort.id, targetSwId, targetPortId, { direction: cableDirection });
    };

    const isSource = attachedCable?.source === switchId;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.98, y: 10 }} animate={{ scale: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-[940px] flex flex-col overflow-hidden max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/80">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="bg-blue-600/20 p-2 rounded border border-blue-500/30">
                                <Code size={20} className="text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-mono font-bold border border-slate-700">SWITCH_ID: {switchId}</span>
                                    {isEditingLabel ? (
                                        <div className="flex items-center gap-2">
                                            <input autoFocus className="bg-black border border-blue-500 rounded px-3 py-1 text-sm text-white focus:outline-none font-mono" value={tempLabel} onChange={(e) => setTempLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLabelSave()} />
                                            <button onClick={handleLabelSave} className="bg-green-600 p-1 rounded text-white"><Check size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group cursor-pointer hover:bg-slate-800 px-2 py-1 rounded transition-colors" onClick={() => setIsEditingLabel(true)}>
                                            <h2 className="text-lg font-mono font-bold text-white tracking-tight">{data?.label}</h2>
                                            <Edit3 size={12} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Config Panel [Advanced Lifecycle]</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition"><X size={24} /></button>
                    </div>

                    <div className="p-6 flex flex-col gap-6 bg-slate-900 overflow-y-auto">
                        <div className="w-full bg-black rounded-xl p-6 border border-slate-800 shadow-2xl flex items-center gap-10">
                            <div className="flex-1">
                                <div className="grid grid-cols-8 gap-2 bg-[#111] p-3 rounded-lg border border-white/5 shadow-inner">
                                    {ports.slice(0, 16).map((port) => {
                                        const isConnected = connectedPorts.includes(`p-${port.id}`);
                                        const isSelected = selectedPortId === port.id;

                                        // Reciprocal Traffic Logic (Switch-centric)
                                        const term = existingTerminals.find(t => t.parentId === switchId && t.data.attachedPort === `p-${port.id}`);
                                        const cable = existingEdges.find(e => (e.source === switchId && e.sourceHandle === `p-${port.id}`) || (e.target === switchId && e.targetHandle === `p-${port.id}`));

                                        let hasTX = false;
                                        let hasRX = false;

                                        if (term) {
                                            const dir = term.data.direction || 'both';
                                            if (dir === 'both') { hasTX = true; hasRX = true; }
                                            else if (dir === 'a-to-b') hasRX = true; // Term TX -> Switch RX
                                            else if (dir === 'b-to-a') hasTX = true; // Term RX -> Switch TX
                                        } else if (cable) {
                                            const dir = cable.data.direction || 'both';
                                            const isSrc = cable.source === switchId;
                                            if (dir === 'both') { hasTX = true; hasRX = true; }
                                            else if (isSrc) {
                                                if (dir === 'a-to-b') hasTX = true; else hasRX = true;
                                            } else {
                                                if (dir === 'a-to-b') hasRX = true; else hasTX = true;
                                            }
                                        }

                                        return (
                                            <div key={port.id} onClick={() => handlePortClick(port)} className={clsx(
                                                "w-11 h-11 rounded border flex flex-col items-center justify-between p-1 cursor-pointer transition-all relative group shadow-sm",
                                                isSelected ? "border-blue-500 bg-blue-500/20 ring-1 ring-blue-500/50" : "border-slate-800 bg-black hover:border-slate-600",
                                                isConnected && !isSelected && "border-green-500/40 bg-green-500/5"
                                            )}>
                                                <div className={clsx("w-1 h-1 rounded-full", isConnected ? "bg-green-400 shadow-[0_0_8px_green]" : "bg-slate-900")} />

                                                <div className={clsx("w-6 h-5 border-t border-x rounded-t-sm relative flex items-center justify-center gap-1", isConnected ? "bg-green-950/20 border-green-500/40" : "bg-slate-950 border-slate-800")}>
                                                    {isConnected && (
                                                        <div className="flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded-sm ring-1 ring-white/5">
                                                            <div className="flex flex-col gap-[1.5px]">
                                                                <div className={clsx("w-1 h-1 rounded-full", hasTX ? "bg-amber-400 shadow-[0_0_4px_#fbbf24]" : "bg-slate-800")} />
                                                                <div className={clsx("w-1 h-1 rounded-full", hasRX ? "bg-green-400 shadow-[0_0_4px_#10b981]" : "bg-slate-800")} />
                                                            </div>
                                                            <div className="flex flex-col text-[5px] font-black leading-none text-slate-500 items-start tracking-tighter">
                                                                <span className={hasTX ? "text-amber-400" : ""}>TX</span>
                                                                <span className={hasRX ? "text-green-400" : ""}>RX</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-[7px] font-mono text-slate-500 font-black">{port.id}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="w-[180px]">
                                <div className="grid grid-cols-2 gap-3 bg-[#111] p-3 rounded-lg border border-white/5 shadow-inner">
                                    {ports.slice(16, 20).map((port) => {
                                        const isConnected = connectedPorts.includes(`p-${port.id}`);
                                        const isSelected = selectedPortId === port.id;

                                        // Reciprocal Traffic Logic (Switch-centric)
                                        const cable = existingEdges.find(e => (e.source === switchId && e.sourceHandle === `p-${port.id}`) || (e.target === switchId && e.targetHandle === `p-${port.id}`));
                                        let hasTX = false;
                                        let hasRX = false;
                                        if (cable) {
                                            const dir = cable.data.direction || 'both';
                                            const isSrc = cable.source === switchId;
                                            if (dir === 'both') { hasTX = true; hasRX = true; }
                                            else if (isSrc) {
                                                if (dir === 'a-to-b') hasTX = true; else hasRX = true;
                                            } else {
                                                if (dir === 'a-to-b') hasRX = true; else hasTX = true;
                                            }
                                        }

                                        return (
                                            <div key={port.id} onClick={() => handlePortClick(port)} className={clsx(
                                                "w-11 h-11 rounded border flex flex-col items-center justify-between p-1 cursor-pointer transition-all relative group shadow-sm",
                                                isSelected ? "border-blue-500 bg-blue-500/20 ring-1 ring-blue-500/50" : "border-slate-800 bg-black hover:border-slate-600",
                                                isConnected && !isSelected && "border-green-500/40 bg-green-500/5"
                                            )}>
                                                <div className={clsx("w-1 h-1 rounded-full", isConnected ? "bg-green-400 shadow-[0_0_8px_green]" : "bg-slate-900")} />

                                                <div className={clsx("w-6 h-5 border-t border-x rounded-t-sm relative flex items-center justify-center gap-1", isConnected ? "bg-green-950/20 border-green-500/40" : "bg-slate-950 border-slate-800")}>
                                                    {isConnected && (
                                                        <div className="flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded-sm ring-1 ring-white/5">
                                                            <div className="flex flex-col gap-[1.5px]">
                                                                <div className={clsx("w-1 h-1 rounded-full", hasTX ? "bg-amber-400 shadow-[0_0_4px_#fbbf24]" : "bg-slate-800")} />
                                                                <div className={clsx("w-1 h-1 rounded-full", hasRX ? "bg-green-400 shadow-[0_0_4px_#10b981]" : "bg-slate-800")} />
                                                            </div>
                                                            <div className="flex flex-col text-[5px] font-black leading-none text-slate-500 tracking-tighter">
                                                                <span className={hasTX ? "text-amber-400" : ""}>TX</span>
                                                                <span className={hasRX ? "text-green-400" : ""}>RX</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-[7px] font-mono text-slate-500 font-black">{port.id}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-[300px] shadow-2xl">
                            {selectedPort ? (
                                <>
                                    <div className="flex bg-slate-900/50 border-b border-slate-800">
                                        {[
                                            { id: 'vlan', label: 'VLAN Settings', icon: Layers },
                                            attachedTerminal ? { id: 'terminal-config', label: 'Port Status (Term)', icon: Settings } : { id: 'terminal', label: 'Add Terminal', icon: Monitor },
                                            attachedCable ? { id: 'cable-config', label: 'Port Status (Cable)', icon: Cable } : { id: 'cable', label: 'Add Cable', icon: ArrowRightLeft },
                                        ].map(tab => (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2", activeTab === tab.id ? "bg-slate-900 border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50")}>
                                                <tab.icon size={14} /> {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-6 flex-1">
                                        <div className="mb-6 flex justify-between items-center bg-slate-900 shadow-inner p-3 rounded border border-white/5">
                                            <div className="flex items-center gap-3"><div className="w-1.5 h-4 bg-blue-500 rounded-full" /><span className="text-xs font-mono font-bold text-white uppercase tracking-tight">PORT_{selectedPort.id} - {selectedPort.label}</span></div>
                                            <div className={clsx("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border", isPortOccupied ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-slate-800 text-slate-500 border-slate-700")}>{isPortOccupied ? 'OCCUPIED' : 'IDLE'}</div>
                                        </div>

                                        {activeTab === 'vlan' && (
                                            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PVID</label>
                                                    <input type="number" value={selectedPort.pvid} onChange={(e) => updatePortConfig('pvid', e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-blue-400 text-3xl font-mono rounded-lg px-4 py-3 outline-none focus:border-blue-500 shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px) font-black text-slate-500 uppercase tracking-widest">VLAN List</label>
                                                    <input type="text" value={selectedPort.vlan} onChange={(e) => updatePortConfig('vlan', e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-green-400 text-3xl font-mono rounded-lg px-4 py-3 outline-none focus:border-green-500 shadow-inner" placeholder="1-4094" />
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'terminal-config' && attachedTerminal && (
                                            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="space-y-4">
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono">Terminal Name</label>
                                                            <input type="text" value={attachedTerminal.data.label} onChange={(e) => updateTerminalConfig('label', e.target.value)} className="w-full bg-slate-900 border border-blue-500/30 text-white font-mono rounded-lg px-4 py-3 outline-none focus:border-blue-500" />
                                                        </div>
                                                        <div className="w-32 space-y-2">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono">Port PVID</label>
                                                            <input type="number" value={selectedPort.pvid || 1} onChange={(e) => updatePortConfig('pvid', e.target.value)} className="w-full bg-slate-900 border border-blue-500/30 text-blue-400 text-2xl font-mono font-bold rounded-lg px-4 py-3 outline-none focus:border-blue-500 text-center" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Physical Port Traffic Mode</label>
                                                        <div className="flex gap-2">
                                                            {[
                                                                { id: 'both', icon: ArrowRightLeft, label: 'Full Duplex' },
                                                                { id: 'a-to-b', icon: ArrowLeft, label: 'Port RX (Input)' },
                                                                { id: 'b-to-a', icon: ArrowRight, label: 'Port TX (Output)' },
                                                            ].map(dir => (
                                                                <button key={dir.id} onClick={() => updateTerminalConfig('direction', dir.id)} className={clsx("flex-1 flex flex-col items-center gap-1 p-2 rounded border transition-all", attachedTerminal.data.direction === dir.id ? "bg-amber-600 border-amber-400 text-white shadow-lg" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600")}>
                                                                    <dir.icon size={12} /> <span className="text-[8px] font-bold uppercase">{dir.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/50 rounded-lg border border-white/5 p-6 flex flex-col items-center justify-center gap-4 text-center">
                                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Switch Port Interface</div>
                                                    <div className="p-4 bg-black rounded border border-white/10 w-full font-mono flex flex-col gap-2">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="text-slate-500">Local Port ID:</span>
                                                            <span className="text-blue-400 font-bold">P{selectedPort.id}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="text-slate-500">Traffic Status:</span>
                                                            <span className={attachedTerminal.data.direction === 'both' ? "text-green-400" : attachedTerminal.data.direction === 'a-to-b' ? "text-green-400" : "text-amber-400"}>
                                                                {attachedTerminal.data.direction === 'both' ? 'ESTABLISHED (FULL)' : attachedTerminal.data.direction === 'a-to-b' ? 'RX_ACTIVE (IN)' : 'TX_ACTIVE (OUT)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { if (confirm(`Remove ${attachedTerminal.data.label}?`)) { onDeleteSwitch(attachedTerminal.id); setActiveTab('terminal'); } }} className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                                        <Trash2 size={12} /> Remove Terminal
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'cable-config' && attachedCable && (
                                            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Cable Label</label>
                                                        <input type="text" value={attachedCable.data.cableName} onChange={(e) => updateCableConfig('cableName', e.target.value)} className="w-full bg-slate-900 border border-indigo-500/30 text-white font-mono rounded-lg px-4 py-3 outline-none focus:border-indigo-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Port Signal Direction</label>
                                                        <div className="flex gap-2">
                                                            {[
                                                                { id: 'both', icon: ArrowRightLeft, label: 'Bidirectional' },
                                                                {
                                                                    id: isSource ? 'b-to-a' : 'a-to-b',
                                                                    icon: ArrowLeft,
                                                                    label: 'RX (From Remote)'
                                                                },
                                                                {
                                                                    id: isSource ? 'a-to-b' : 'b-to-a',
                                                                    icon: ArrowRight,
                                                                    label: 'TX (To Remote)'
                                                                },
                                                            ].map(dir => (
                                                                <button key={dir.id} onClick={() => updateCableConfig('direction', dir.id)} className={clsx("flex-1 flex flex-col items-center gap-1 p-2 rounded border transition-all", attachedCable.data.direction === dir.id ? "bg-amber-600 border-amber-400 text-white shadow-lg" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600")}>
                                                                    <dir.icon size={12} /> <span className="text-[8px] font-bold uppercase">{dir.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/50 rounded-lg border border-white/5 p-6 flex flex-col items-center justify-center gap-4">
                                                    <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center border border-amber-500/30">
                                                        <Cable size={40} className="text-amber-400 rotate-45" />
                                                    </div>
                                                    <div className="text-center font-mono text-[10px]">
                                                        <p className="text-slate-500 uppercase">LINK INTERFACE STATUS</p>
                                                        <p className="text-white mt-2 truncate max-w-[200px]">{attachedCable.data.cableName}</p>
                                                        <p className="text-amber-400 font-bold mt-1 uppercase">
                                                            {attachedCable.data.direction === 'both' ? 'FULL_DUPLEX' : (isSource ? (attachedCable.data.direction === 'a-to-b' ? 'PORT_TX_ACTIVE' : 'PORT_RX_ACTIVE') : (attachedCable.data.direction === 'a-to-b' ? 'PORT_RX_ACTIVE' : 'PORT_TX_ACTIVE'))}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => { if (confirm(`Disconnect and remove this link?`)) { onDeleteCable(attachedCable.id); setActiveTab('cable'); } }} className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                                        <Trash2 size={12} /> Sever Cable Link
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'terminal' && (
                                            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="space-y-4">
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Terminal Label</label>
                                                            <input type="text" value={termLabel} onChange={(e) => setTermLabel(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-amber-400 font-mono rounded-lg px-4 py-3 outline-none focus:border-amber-500/50" />
                                                        </div>
                                                        <div className="w-24 space-y-2">
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Port PVID</label>
                                                            <input type="number" value={termPvid} onChange={(e) => setTermPvid(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-blue-400 font-mono rounded-lg px-4 py-3 outline-none focus:border-blue-500/50" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-xs">Init Port Mode</label>
                                                        <div className="flex gap-2">
                                                            {[{ id: 'both', label: 'Full' }, { id: 'a-to-b', label: 'Port RX' }, { id: 'b-to-a', label: 'Port TX' }].map(dir => (
                                                                <button key={dir.id} onClick={() => setTermDirection(dir.id)} className={clsx("flex-1 p-2 rounded border text-[9px] font-bold transition-all", termDirection === dir.id ? "bg-amber-600 border-amber-400 text-white" : "bg-slate-800 border-slate-700 text-slate-500")}>{dir.label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">{[{ id: 'pc', icon: Monitor, label: 'Standard PC' }, { id: 'server', icon: Server, label: 'Data Server' }, { id: 'laptop', icon: Laptop, label: 'Laptop' }, { id: 'tablet', icon: Tablet, label: 'Tablet' }].map(cat => (<button key={cat.id} onClick={() => setTermCategory(cat.id)} className={clsx("flex items-center gap-2 p-2 rounded border transition-all", termCategory === cat.id ? "bg-amber-600 border-amber-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600")}><cat.icon size={12} /> <span className="text-[9px] font-bold">{cat.label}</span></button>))}</div>
                                                </div>
                                                <button disabled={isPortOccupied} onClick={handleAddTerminal} className="w-full h-full bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-black rounded-lg flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"><Monitor size={32} /><div className="text-center"><div className="text-sm">PLUG TERMINAL</div><div className="text-[9px] opacity-60 font-mono tracking-widest">Targeting Port {selectedPort.id}</div></div></button>
                                            </div>
                                        )}

                                        {activeTab === 'cable' && (
                                            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <div className="space-y-4">
                                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link Remote Hub</label><select value={targetSwId} onChange={(e) => { setTargetSwId(e.target.value); setTargetPortId(''); }} className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-3 outline-none font-mono text-xs"><option value="">-- Choose Switch --</option>{allSwitches.filter(s => s.id !== switchId).map(sw => <option key={sw.id} value={sw.id}>{sw.data.label}</option>)}</select></div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-xs">Port Signal Mode</label>
                                                        <div className="flex gap-2">
                                                            {[{ id: 'both', label: 'Bidirectional' }, { id: 'b-to-a', label: 'Port RX (Input)' }, { id: 'a-to-b', label: 'Port TX (Output)' }].map(dir => (
                                                                <button key={dir.id} onClick={() => setCableDirection(dir.id)} className={clsx("flex-1 p-1 rounded border text-[8px] font-bold transition-all", cableDirection === dir.id ? "bg-amber-600 border-amber-400 text-white" : "bg-slate-800 border-slate-700 text-slate-500")}>{dir.label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900/50 rounded-lg border border-slate-800 max-h-[140px] overflow-y-auto">{targetSwId ? allSwitches.find(s => s.id === targetSwId)?.data.ports.map(p => { const targetIsConnected = allSwitches.find(s => s.id === targetSwId)?.data.connectedPorts?.includes(`p-${p.id}`); return (<button key={p.id} disabled={targetIsConnected} onClick={() => setTargetPortId(p.id)} className={clsx("aspect-square rounded border flex items-center justify-center text-[8px] font-bold transition-all", targetPortId === p.id ? "bg-amber-600 border-amber-400 text-white" : targetIsConnected ? "bg-red-900/20 border-red-500/20 text-red-900" : "bg-black border-slate-800 text-slate-600")}>{p.id}</button>); }) : <div className="col-span-4 text-center py-8 text-[9px] text-slate-700 italic">Select Remote First</div>}</div>
                                                </div>
                                                <button disabled={!targetPortId || isPortOccupied} onClick={handleAddCable} className="w-full h-full bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-black rounded-lg flex flex-col items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"><Cable size={32} /><div className="text-center"><div className="text-sm">ESTABLISH LINK</div><div className="text-[9px] opacity-60 font-mono">P{selectedPort.id} ↔ P{targetPortId}</div></div></button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                                    <Layers size={48} className="text-slate-500 mb-3" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select physical port to configure</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
