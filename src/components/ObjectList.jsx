import React, { useState } from 'react';
import {
    Server,
    Cable,
    Trash2,
    Crosshair,
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Link2,
    Monitor
} from 'lucide-react';
import clsx from 'clsx';

export default function ObjectList({ nodes, edges, onDeleteNode, onDeleteEdge, onFocusNode, onFocusEdge }) {
    const [isDevicesExpanded, setIsDevicesExpanded] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    const q = searchQuery.toLowerCase();

    // Helper to find and filter edges connected to a specific node
    const getFilteredNodeEdges = (nodeId) => {
        const nodeEdges = edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
        if (!q) return nodeEdges;

        return nodeEdges.filter(edge => {
            const cableName = edge.data?.cableName?.toLowerCase() || '';
            const ports = `${edge.data?.sourceLabel} ${edge.data?.targetLabel}`.toLowerCase();
            return cableName.includes(q) || ports.includes(q);
        });
    };

    // Helper to find terminals snapped to a node
    const getSnappedTerminals = (nodeId) => {
        return nodes.filter(n => n.type === 'terminalNode' && n.data.attachedSwitch === nodeId);
    };

    const switches = nodes.filter(n => n.type === 'switchNode');
    const floatingTerminals = nodes.filter(n => n.type === 'terminalNode' && !n.data.attachedSwitch);

    // Filter switches: show if switch matches OR any of its children (edges/terminals) match
    const filteredSwitches = switches.filter(node => {
        if (!q) return true;

        const nodeMatches = (node.data?.label?.toLowerCase().includes(q) || node.id.includes(q));
        const matchingEdges = getFilteredNodeEdges(node.id);
        const matchingTerms = getSnappedTerminals(node.id).filter(t => t.data?.label?.toLowerCase().includes(q));

        return nodeMatches || matchingEdges.length > 0 || matchingTerms.length > 0;
    });

    const filteredFloating = floatingTerminals.filter(t => !q || t.data?.label?.toLowerCase().includes(q));

    return (
        <div className="flex flex-col h-full max-h-[85vh] w-72 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Search Header */}
            <div className="p-3 bg-slate-950/50 border-b border-slate-800">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search nodes, links or terms..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-8 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-2.5 text-slate-600 hover:text-slate-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">

                {/* Switches & Snapped Objects */}
                <div className="rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsDevicesExpanded(!isDevicesExpanded)}
                        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-800 transition-colors rounded group"
                    >
                        <div className="flex items-center gap-2">
                            <div className={clsx("transition-transform duration-200", !isDevicesExpanded && "-rotate-90")}>
                                <ChevronDown size={14} className="text-slate-500" />
                            </div>
                            <Server size={14} className="text-blue-500" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-[10px]">Chassis Catalog</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1.5 rounded">{filteredSwitches.length}</span>
                    </button>

                    {isDevicesExpanded && (
                        <div className="mt-1 space-y-1 ml-1 pl-1 border-l border-slate-800/50">
                            {filteredSwitches.map(node => {
                                const nodeEdges = getFilteredNodeEdges(node.id);
                                const terminals = getSnappedTerminals(node.id);
                                const isExpanded = expandedNodes[node.id] || (searchQuery && (nodeEdges.length > 0 || terminals.length > 0));

                                return (
                                    <div key={node.id} className="flex flex-col">
                                        <div
                                            className={clsx(
                                                "group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border",
                                                isExpanded ? "bg-slate-800 border-slate-700" : "hover:bg-slate-800/40 border-transparent"
                                            )}
                                            onClick={() => toggleNode(node.id)}
                                        >
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <div className={clsx("transition-transform", isExpanded && "rotate-90")}>
                                                    <ChevronRight size={12} className="text-slate-600" />
                                                </div>
                                                <div className={clsx(
                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                    node.data.connectedPorts?.length > 0 ? "bg-green-500 shadow-[0_0_4px_green]" : "bg-slate-600"
                                                )} />
                                                <span className="text-xs font-semibold text-slate-300 truncate">{node.data?.label || `SW-${node.id}`}</span>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); onFocusNode(node.id); }} className="p-1 hover:bg-blue-500/20 text-blue-400 rounded"><Crosshair size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }} className="p-1 hover:bg-red-500/20 text-red-500 rounded"><Trash2 size={12} /></button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="ml-5 mt-1 pb-2 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                                {/* Terminals Sub-List */}
                                                {terminals.map(term => (
                                                    <div key={term.id} onClick={(e) => { e.stopPropagation(); onFocusNode(term.id); }} className="flex items-center justify-between p-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:border-blue-400/40 group/item cursor-pointer">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Monitor size={10} className="text-blue-400" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-blue-200 font-bold">{term.data.label}</span>
                                                                <span className="text-[8px] text-slate-500 uppercase tracking-tighter">Plugin at {term.data.attachedPort}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteNode(term.id); }} className="p-1 opacity-0 group-hover/item:opacity-100 text-red-500/60 hover:text-red-500"><Trash2 size={10} /></button>
                                                    </div>
                                                ))}

                                                {/* Cables Sub-List */}
                                                {nodeEdges.map(edge => (
                                                    <div key={edge.id} onClick={(e) => { e.stopPropagation(); onFocusEdge(edge.id); }} className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-800/30 hover:border-green-500/30 group/edge cursor-pointer">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Link2 size={10} className="text-slate-600 group-hover/edge:text-green-500 shrink-0" />
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="text-[9px] text-slate-300 font-mono truncate">{edge.data?.cableName}</span>
                                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Link {edge.data?.sourceLabel} ↔ {edge.data?.targetLabel}</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteEdge(edge.id); }} className="p-1 opacity-0 group-hover/edge:opacity-100 text-red-500"><Trash2 size={10} /></button>
                                                    </div>
                                                ))}

                                                {terminals.length === 0 && nodeEdges.length === 0 && (
                                                    <div className="text-[9px] text-slate-600 italic px-2 py-1">No children linked</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Floating Terminals Section */}
                {filteredFloating.length > 0 && (
                    <div className="rounded-lg overflow-hidden mt-4">
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-500">
                            <Monitor size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Floating Terminals</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 mt-1">
                            {filteredFloating.map(term => (
                                <div key={term.id} onClick={() => onFocusNode(term.id)} className="flex items-center justify-between p-2 rounded bg-slate-800/20 border border-dashed border-slate-700 hover:border-blue-500/50 cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        <Monitor size={12} className="text-slate-600" />
                                        <span className="text-[10px] text-slate-400 font-bold">{term.data.label}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteNode(term.id); }} className="p-1 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Status Bar */}
            <div className="bg-slate-950 p-2 border-t border-slate-800 flex justify-between items-center px-4">
                <span className="text-[8px] opacity-40 font-black tracking-widest uppercase italic">X-Terminal System v2</span>
                <div className="flex items-center gap-2 font-mono">
                    <span className="text-[8px] text-slate-600">{switches.length} Chassis</span>
                    <span className="text-[8px] text-slate-600">{nodes.filter(n => n.type === 'terminalNode').length} Devices</span>
                </div>
            </div>
        </div>
    );
}
