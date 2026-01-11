import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu } from 'lucide-react';
import clsx from 'clsx';

const SwitchNode = ({ data, selected }) => {
    const ports = data.ports || [];
    const connectedPorts = data.connectedPorts || [];

    const renderPort = (port) => {
        const isConnected = connectedPorts.includes(`p-${port.id}`);
        const traffic = data.trafficMap?.[`p-${port.id}`] || { hasTX: false, hasRX: false };
        const { hasTX, hasRX } = traffic;

        return (
            <div key={port.id} className="relative group/port flex justify-center">
                <div className={clsx(
                    "rounded bg-[#050505] border border-slate-900 flex flex-col items-center justify-between p-1 shadow-inner",
                    "w-12 h-10",
                    isConnected && "ring-1 ring-green-500/20 border-green-900/40 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                )}>
                    <div className="w-full flex justify-between px-1">
                        <div className={clsx(
                            "w-1 h-1 rounded-full",
                            isConnected ? "bg-green-400 shadow-[0_0_8px_green]" : "bg-slate-900",
                            isConnected && "animate-pulse"
                        )} />

                        {/* Enhanced RX/TX on Main Canvas */}
                        {isConnected && (
                            <div className="flex gap-1 items-center bg-black/40 px-1 rounded-sm border border-white/5">
                                <div className="flex flex-col justify-center gap-[2px]">
                                    <div className={clsx("w-1.5 h-1.5 rounded-full border-[0.5px] border-white/10", hasTX ? "bg-amber-400 shadow-[0_0_4px_#fbbf24]" : "bg-slate-900")} />
                                    <div className={clsx("w-1.5 h-1.5 rounded-full border-[0.5px] border-white/10", hasRX ? "bg-green-400 shadow-[0_0_4px_#10b981]" : "bg-slate-900")} />
                                </div>
                                <div className="flex flex-col text-[5px] font-black leading-none tracking-tighter">
                                    <span className={hasTX ? "text-amber-400" : "text-slate-800"}>TX</span>
                                    <span className={hasRX ? "text-green-400" : "text-slate-800"}>RX</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-9 h-4 bg-black rounded shadow-[inset_0_2px_8px_rgba(0,0,0,1)] border-t border-white/5" />
                    <span className="text-[7px] font-mono text-slate-500 font-bold leading-none">{port.id}</span>
                </div>
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id={`p-${port.id}`}
                    className="!w-full !h-full !opacity-0 !border-none !rounded-none !bg-transparent !top-0 !left-0 !transform-none"
                    style={{ pointerEvents: 'all' }}
                />
            </div>
        );
    };

    return (
        <div className={clsx(
            "relative group transition-all duration-300",
            "w-[660px] h-[160px] bg-[#0c0c0c] rounded-xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden",
            selected ? "border-blue-500 shadow-blue-500/30" : "border-slate-800"
        )}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5 z-20" />
            <div className="h-9 bg-slate-900 border-b border-black flex items-center justify-between px-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1 bg-black rounded border border-white/5 shadow-inner">
                        <Cpu size={12} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black text-slate-200 uppercase tracking-tight">{data.label}</span>
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.2em] -mt-1">X-Engine All-Copper Pro</span>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-slate-700 font-mono text-[9px] font-black uppercase tracking-widest">
                    20-Port Gigabit Switch
                </div>
            </div>
            <div className="flex flex-1 h-[124px] p-3 gap-4 bg-[#0a0a0a]">
                <div className="flex-1 bg-[#121212] p-3 rounded-lg border border-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute -top-2 left-4 bg-[#121212] px-2 text-[6px] text-slate-600 font-black uppercase tracking-[0.3em] border border-white/5 z-20">Access Ports [1-16]</div>
                    <div className="grid grid-cols-8 grid-rows-2 gap-x-2 gap-y-3 mt-1 h-full content-center">
                        {ports.slice(0, 16).map((port) => renderPort(port))}
                    </div>
                </div>
                <div className="w-[180px] bg-[#161616] p-3 rounded-lg border border-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute -top-2 left-4 bg-[#161616] px-2 text-[6px] text-slate-600 font-black uppercase tracking-[0.3em] border border-white/5 z-20">Multi-Giga Uplinks [17-20]</div>
                    <div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-3 mt-1 h-full content-center">
                        {ports.slice(16, 20).map((port) => renderPort(port))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(SwitchNode);
