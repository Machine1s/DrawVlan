import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap,
    Panel,
    ConnectionMode,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Undo, Redo, Cable, Eye, EyeOff, ListFilter, Monitor } from 'lucide-react';
import SwitchFaceplate from './SwitchFaceplate';
import SwitchNode from './SwitchNode';
import TerminalNode from './TerminalNode';
import NetworkEdge from './NetworkEdge';
import EdgeConfig from './EdgeConfig';
import TerminalConfig from './TerminalConfig';
import ObjectList from './ObjectList';

const nodeTypes = { switchNode: SwitchNode, terminalNode: TerminalNode };
const edgeTypes = { networkEdge: NetworkEdge };

const NORMAL_PORTS_COUNT = 16;
const UPLINK_PORTS_COUNT = 4;
const TOTAL_PORTS = NORMAL_PORTS_COUNT + UPLINK_PORTS_COUNT;

const generatePorts = () => Array.from({ length: TOTAL_PORTS }, (_, i) => ({
    id: i + 1,
    pvid: 1,
    vlan: '1',
    label: i < NORMAL_PORTS_COUNT ? `GE1/0/${i + 1}` : `XGE1/0/${i - NORMAL_PORTS_COUNT + 1}`
}));

const initialNodes = [
    { id: 'sw-1', type: 'switchNode', data: { label: 'Core-01', ports: generatePorts(), connectedPorts: ['p-1'] }, position: { x: 300, y: 50 } },
    { id: 'sw-2', type: 'switchNode', data: { label: 'Agg-01', ports: generatePorts(), connectedPorts: ['p-1'] }, position: { x: 100, y: 350 } },
];

const initialEdges = [
    { id: 'e1-2', type: 'networkEdge', source: 'sw-1', target: 'sw-2', sourceHandle: 'p-1', targetHandle: 'p-1', data: { sourceLabel: 'P1', targetLabel: 'P1', direction: 'both', cableName: 'Core-01 P1 ↔ Agg-01 P1' } },
];

function useUndoHistory() {
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const takeSnapshot = (nodes, edges) => {
        setPast(current => [...current, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
        setFuture([]);
    };
    const undo = (setNodes, setEdges, currentNodes, currentEdges) => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        setPast(past.slice(0, past.length - 1));
        setFuture(current => [{ nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }, ...current]);
        setNodes(previous.nodes);
        setEdges(previous.edges);
    };
    const redo = (setNodes, setEdges, currentNodes, currentEdges) => {
        if (future.length === 0) return;
        const next = future[0];
        setFuture(future.slice(1));
        setPast(current => [...current, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }]);
        setNodes(next.nodes);
        setEdges(next.edges);
    };
    return { takeSnapshot, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

export default function TopologyMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedSwitchId, setSelectedSwitchId] = useState(null);
    const [activeEdgeConfigId, setActiveEdgeConfigId] = useState(null);
    const [activeTerminalConfigId, setActiveTerminalConfigId] = useState(null);
    const [labelConfig, setLabelConfig] = useState({
        showCableLabels: false,
        showTerminalLabels: false
    });
    const [showList, setShowList] = useState(true);
    const [showLabelMenu, setShowLabelMenu] = useState(false);

    const { setCenter, fitView, getInternalNode } = useReactFlow();
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoHistory();

    // Close label menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showLabelMenu && !event.target.closest('.label-menu-container')) {
                setShowLabelMenu(false);
            }
        };

        if (showLabelMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showLabelMenu]);

    const onNodeDragStop = useCallback((evt, node) => {
        if (node.type !== 'terminalNode') return;

        const SNAP_DIST = 40;
        const switches = nodes.filter(n => n.type === 'switchNode');

        let bestSnap = null;
        let minDist = SNAP_DIST;

        switches.forEach(sw => {
            const internalNode = getInternalNode(sw.id);
            if (!internalNode || !internalNode.internals?.handleBounds) return;
            const sourceHandles = internalNode.internals.handleBounds.source || [];

            // Get all occupied ports for this switch (except the one current terminal might be on)
            const occupiedPorts = sw.data.connectedPorts || [];

            sourceHandles.forEach(handle => {
                // If the port is already occupied by a cable or ANOTHER terminal, skip it
                const isExecutingTerminalOnThisPort = node.parentId === sw.id && node.data.attachedPort === handle.id;
                if (occupiedPorts.includes(handle.id) && !isExecutingTerminalOnThisPort) return;

                const handleAbsX = sw.position.x + handle.x;
                const handleAbsY = sw.position.y + handle.y;
                const portCenterX = handleAbsX + handle.width / 2;
                const portTopY = handleAbsY;

                const d = Math.sqrt(Math.pow(node.position.x + 22 - portCenterX, 2) + Math.pow(node.position.y - portTopY, 2));

                if (d < minDist) {
                    minDist = d;
                    bestSnap = { relX: handle.x + (handle.width / 2) - 22, relY: handle.y, swId: sw.id, portId: handle.id };
                }
            });
        });

        if (bestSnap) {
            setNodes(nds => nds.map(n => n.id === node.id ? {
                ...n,
                parentId: bestSnap.swId,
                position: { x: bestSnap.relX, y: bestSnap.relY },
                extent: 'parent',
                data: { ...n.data, isSnapped: true, attachedSwitch: bestSnap.swId, attachedPort: bestSnap.portId }
            } : n));
        } else {
            const parentNode = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
            const absX = parentNode ? parentNode.position.x + node.position.x : node.position.x;
            const absY = parentNode ? parentNode.position.y + node.position.y : node.position.y;

            setNodes(nds => nds.map(n => n.id === node.id ? {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: { x: absX, y: absY },
                data: { ...n.data, isSnapped: false, attachedSwitch: null, attachedPort: null }
            } : n));
        }
    }, [nodes, getInternalNode, setNodes]);

    // --- PORT STATUS SYNCHRONIZATION ---
    // This effect ensures switch 'connectedPorts' always reflects cables AND snapped terminals
    const terminalMappingState = useMemo(() => {
        return nodes
            .filter(n => n.type === 'terminalNode' && n.data.isSnapped)
            .map(n => `${n.id}:${n.parentId}:${n.data.attachedPort}`)
            .join('|');
    }, [nodes]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.type !== 'switchNode') return node;

                const cablePorts = edges
                    .filter((edge) => edge.source === node.id || edge.target === node.id)
                    .map((edge) => edge.source === node.id ? edge.sourceHandle : edge.targetHandle)
                    .filter(Boolean);

                const terminalPorts = nds
                    .filter(n => n.parentId === node.id && n.data.isSnapped)
                    .map(n => n.data.attachedPort);

                const connectedPorts = [...new Set([...cablePorts, ...terminalPorts])];

                if (JSON.stringify(node.data.connectedPorts) !== JSON.stringify(connectedPorts)) {
                    return { ...node, data: { ...node.data, connectedPorts } };
                }
                return node;
            })
        );
    }, [edges, terminalMappingState, setNodes]);

    const onNodeDoubleClick = useCallback((evt, node) => {
        if (node.type === 'switchNode') {
            setSelectedSwitchId(node.id);
        } else if (node.type === 'terminalNode') {
            setActiveTerminalConfigId(node.id);
        }
    }, []);

    const handleUpdateData = (id, newData) => {
        takeSnapshot(nodes, edges);
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
        setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, ...newData } } : e));
    };

    const onAddTerminalToPort = useCallback((swId, portId, config) => {
        takeSnapshot(nodes, edges);
        const sw = nodes.find(n => n.id === swId);
        if (!sw) return;

        const internalNode = getInternalNode(swId);
        if (!internalNode || !internalNode.internals?.handleBounds) return;

        const handle = (internalNode.internals.handleBounds.source || []).find(h => h.id === `p-${portId}`);
        if (!handle) return;

        const nextId = (Math.max(0, ...nodes.filter(n => n.type === 'terminalNode').map(n => parseInt(n.id.split('-')[1]) || 0)) + 1);

        setNodes(nds => [...nds, {
            id: `term-${nextId}`,
            type: 'terminalNode',
            parentId: swId,
            position: { x: handle.x + (handle.width / 2) - 22, y: handle.y },
            extent: 'parent',
            data: {
                label: config.label || `PC-${nextId}`,
                isSnapped: true,
                attachedSwitch: swId,
                attachedPort: `p-${portId}`,
                direction: config.direction || 'both',
                category: config.category || 'pc'
            }
        }]);
    }, [nodes, getInternalNode, takeSnapshot, setNodes]);

    const onAddCable = useCallback((sourceSwId, sourcePortId, targetSwId, targetPortId, config = {}) => {
        takeSnapshot(nodes, edges);
        const sNode = nodes.find(n => n.id === sourceSwId);
        if (!sNode) return;
        const sName = sNode.data?.label || `SW-${sourceSwId}`;
        const tNode = nodes.find(n => n.id === targetSwId);
        const tName = tNode?.data?.label || `SW-${targetSwId}`;

        setEdges((eds) => addEdge({
            source: sourceSwId, target: targetSwId,
            sourceHandle: `p-${sourcePortId}`, targetHandle: `p-${targetPortId}`,
            type: 'networkEdge',
            data: {
                sourceLabel: `P${sourcePortId}`,
                targetLabel: `P${targetPortId}`,
                direction: config.direction || 'both',
                cableName: `${sName} P${sourcePortId} ↔ ${tName} P${targetPortId}`
            }
        }, eds));
    }, [nodes, takeSnapshot, setEdges]);

    const addSwitch = () => {
        takeSnapshot(nodes, edges);
        const newId = `sw-${(Math.max(0, ...nodes.filter(n => n.type === 'switchNode').map(n => parseInt(n.id.split('-')[1]) || 0)) + 1)}`;
        setNodes((nds) => [...nds, { id: newId, type: 'switchNode', data: { label: `SW-${newId.split('-')[1]}`, ports: generatePorts(), connectedPorts: [] }, position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 } }]);
    };

    const addTerminal = () => {
        takeSnapshot(nodes, edges);
        const nextId = (Math.max(0, ...nodes.filter(n => n.type === 'terminalNode').map(n => parseInt(n.id.split('-')[1]) || 0)) + 1);
        setNodes((nds) => [...nds, {
            id: `term-${nextId}`,
            type: 'terminalNode',
            data: { label: `PC-${nextId}`, isSnapped: false, direction: 'both', category: 'pc' },
            position: { x: 50, y: 50 }
        }]);
    };

    const handleDeleteNode = (id) => {
        takeSnapshot(nodes, edges);
        setNodes((nds) => nds.filter((node) => node.id !== id && node.parentId !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        if (selectedSwitchId === id) setSelectedSwitchId(null);
        if (activeTerminalConfigId === id) setActiveTerminalConfigId(null);
    };

    const handleDeleteEdge = (edgeId) => {
        takeSnapshot(nodes, edges);
        setEdges((eds) => eds.filter(e => e.id !== edgeId));
        setActiveEdgeConfigId(null);
    };

    const onFocusNode = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            const parent = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
            const absX = parent ? parent.position.x + node.position.x : node.position.x;
            const absY = parent ? parent.position.y + node.position.y : node.position.y;
            setCenter(absX + 50, absY + 50, { zoom: 1.5, duration: 800 });
            setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
        }
    };

    const onFocusEdge = (edgeId) => {
        setEdges(eds => eds.map(e => ({ ...e, selected: e.id === edgeId })));
        fitView({ padding: 0.5, duration: 800, includeHiddenNodes: false });
    };

    const edgesWithData = useMemo(() => {
        return edges.map(edge => ({
            ...edge,
            data: { ...edge.data, showLabel: labelConfig.showCableLabels, onConfigClick: (id) => setActiveEdgeConfigId(id), onDeleteClick: (id) => handleDeleteEdge(id) }
        }));
    }, [edges, labelConfig.showCableLabels]);

    const nodesWithData = useMemo(() => {
        const terminals = nodes.filter(n => n.type === 'terminalNode');

        return nodes.map(node => {
            if (node.type !== 'switchNode') {
                return { ...node, data: { ...node.data, showLabel: labelConfig.showTerminalLabels } };
            }

            // Calculate traffic map for this switch
            const trafficMap = {};
            (node.data.connectedPorts || []).forEach(portId => {
                const term = terminals.find(t => t.parentId === node.id && t.data.attachedPort === portId);
                const cable = edges.find(e => (e.source === node.id && e.sourceHandle === portId) || (e.target === node.id && e.targetHandle === portId));

                let hasTX = false;
                let hasRX = false;

                if (term) {
                    const dir = term.data.direction || 'both';
                    if (dir === 'both') { hasTX = true; hasRX = true; }
                    else if (dir === 'a-to-b') hasRX = true; // Term TX -> Switch RX
                    else if (dir === 'b-to-a') hasTX = true; // Term RX -> Switch TX
                } else if (cable) {
                    const dir = cable.data.direction || 'both';
                    const isSrc = cable.source === node.id;
                    if (dir === 'both') { hasTX = true; hasRX = true; }
                    else if (isSrc) {
                        if (dir === 'a-to-b') hasTX = true; else hasRX = true;
                    } else {
                        if (dir === 'a-to-b') hasRX = true; else hasTX = true;
                    }
                }
                trafficMap[portId] = { hasTX, hasRX };
            });

            return {
                ...node,
                data: { ...node.data, trafficMap }
            };
        });
    }, [nodes, edges, labelConfig.showTerminalLabels]);

    const allSwitches = useMemo(() => nodes.filter(n => n.type === 'switchNode'), [nodes]);
    const liveSelectedNode = useMemo(() => nodes.find(n => n.id === selectedSwitchId), [nodes, selectedSwitchId]);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <ReactFlow
                nodes={nodesWithData}
                edges={edgesWithData}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                onNodeDoubleClick={onNodeDoubleClick}
                onConnect={useCallback((params) => {
                    const sNode = nodes.find(n => n.id === params.source);
                    const tNode = nodes.find(n => n.id === params.target);

                    // Exclusivity Check: Is the source or target port already occupied?
                    const isSourceOccupied = sNode?.data?.connectedPorts?.includes(params.sourceHandle);
                    const isTargetOccupied = tNode?.data?.connectedPorts?.includes(params.targetHandle);

                    if (isSourceOccupied || isTargetOccupied) {
                        console.warn('Connection rejected: One of the ports is already occupied.');
                        return;
                    }

                    takeSnapshot(nodes, edges);
                    if (sNode?.type === 'terminalNode') return;
                    const sPort = params.sourceHandle?.split('-')[1] || '?';
                    const tPort = params.targetHandle?.split('-')[1] || '?';
                    const sName = sNode?.data?.label || `SW-${params.source}`;
                    const tName = tNode?.data?.label || `SW-${params.target}`;
                    setEdges((eds) => addEdge({ ...params, type: 'networkEdge', data: { sourceLabel: `P${sPort}`, targetLabel: `P${tPort}`, direction: 'both', cableName: `${sName} P${sPort} ↔ ${tName} P${tPort}` } }, eds));
                }, [nodes, edges, takeSnapshot])}
                fitView
                colorMode="dark"
                connectionMode={ConnectionMode.Loose}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#111" gap={40} size={1} variant="lines" />
                <Controls className="bg-slate-800 border-slate-700" />
                <MiniMap style={{ background: '#0a0a0a', border: '1px solid #1e293b' }} nodeColor={() => '#1e293b'} maskColor="rgba(0, 0, 0, 0.5)" />
                <Panel position="top-left" className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-2 rounded-xl flex items-center gap-3 shadow-2xl m-4 ring-1 ring-white/5">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 pr-4"><Cable size={18} className="text-blue-400" /><span className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">VLAN PRO</span></div>
                    <div className="flex gap-2">
                        <button onClick={addSwitch} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg border border-blue-400/20"><Plus size={18} /> Switch</button>
                        <button onClick={addTerminal} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-sm font-bold transition-all border border-slate-700 shadow-xl"><Monitor size={18} /> Terminal</button>
                    </div>
                    <div className="relative label-menu-container">
                        <button
                            onClick={() => setShowLabelMenu(!showLabelMenu)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all border ${(labelConfig.showCableLabels || labelConfig.showTerminalLabels) ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {(labelConfig.showCableLabels || labelConfig.showTerminalLabels) ? <Eye size={18} /> : <EyeOff size={18} />}
                            <span className="text-xs">Labels</span>
                        </button>
                        {showLabelMenu && (
                            <div className="absolute top-full mt-2 left-0 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-3 min-w-[200px] z-[9999] ring-1 ring-white/5">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={labelConfig.showCableLabels}
                                            onChange={(e) => setLabelConfig(prev => ({ ...prev, showCableLabels: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Cable size={14} className="text-amber-400" />
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white">Cable Labels</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={labelConfig.showTerminalLabels}
                                            onChange={(e) => setLabelConfig(prev => ({ ...prev, showTerminalLabels: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Monitor size={14} className="text-green-400" />
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white">Terminal Labels</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowList(!showList)} className={`p-2 rounded-lg transition-all border ${showList ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}><ListFilter size={18} /></button>
                    <div className="flex gap-1 border-l border-slate-800 pl-2">
                        <button onClick={() => undo(setNodes, setEdges, nodes, edges)} disabled={!canUndo} className="p-1 px-2 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-20" title="Undo (Ctrl+Z)"><Undo size={16} /></button>
                        <button onClick={() => redo(setNodes, setEdges, nodes, edges)} disabled={!canRedo} className="p-1 px-2 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-20" title="Redo (Ctrl+Y)"><Redo size={16} /></button>
                    </div>
                </Panel>
                {showList && (
                    <Panel position="top-right" className="m-4">
                        <ObjectList nodes={nodes} edges={edges} onDeleteNode={handleDeleteNode} onDeleteEdge={handleDeleteEdge} onFocusNode={onFocusNode} onFocusEdge={onFocusEdge} />
                    </Panel>
                )}
            </ReactFlow>

            {liveSelectedNode && (
                <SwitchFaceplate
                    switchId={liveSelectedNode.id}
                    data={liveSelectedNode.data}
                    onClose={() => setSelectedSwitchId(null)}
                    onUpdateSwitchData={handleUpdateData}
                    onDeleteSwitch={handleDeleteNode}
                    allSwitches={allSwitches}
                    onAddTerminalToPort={onAddTerminalToPort}
                    onAddCable={onAddCable}
                    existingTerminals={nodes.filter(n => n.type === 'terminalNode')}
                    existingEdges={edges}
                    onDeleteCable={handleDeleteEdge}
                />
            )}

            {activeEdgeConfigId && <EdgeConfig edge={edges.find(e => e.id === activeEdgeConfigId)} onClose={() => setActiveEdgeConfigId(null)} onUpdate={(id, data) => {
                handleUpdateData(id, data);
                setActiveEdgeConfigId(null);
            }} onDelete={handleDeleteEdge} />}

            {activeTerminalConfigId && <TerminalConfig terminal={nodes.find(n => n.id === activeTerminalConfigId)} onClose={() => setActiveTerminalConfigId(null)} onUpdate={handleUpdateData} onDelete={handleDeleteNode} />}
        </div>
    );
}
