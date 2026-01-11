import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor, Server, Laptop, Tablet, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

/**
 * COMPONENT: TerminalNode
 * SIZE: w-11 h-7 (44px x 28px)
 * Designed to plug into the socket without covering the port ID text.
 */
const TerminalNode = ({ data, selected }) => {
    const direction = data.direction || 'both';
    const category = data.category || 'pc';

    const icons = {
        pc: Monitor,
        server: Server,
        laptop: Laptop,
        tablet: Tablet
    };

    const Icon = icons[category] || Monitor;

    const FlowIndicator = () => {
        if (direction === 'both') return (
            <div className="flex gap-0.5 items-center bg-black/40 px-1 rounded-full border border-white/10 shadow-inner">
                <ArrowRight size={10} className="text-amber-400 rotate-90 drop-shadow-[0_0_2px_#fbbf24]" strokeWidth={4} />
                <ArrowLeft size={10} className="text-green-400 rotate-90 drop-shadow-[0_0_2px_#10b981]" strokeWidth={4} />
            </div>
        );
        if (direction === 'a-to-b') return (
            <div className="bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                <ArrowRight size={11} className="text-amber-400 rotate-90" strokeWidth={4} />
            </div>
        );
        if (direction === 'b-to-a') return (
            <div className="bg-green-500/20 px-1.5 py-0.5 rounded-full border border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                <ArrowLeft size={11} className="text-green-400 rotate-90" strokeWidth={4} />
            </div>
        );
        return null;
    };

    return (
        <div className={clsx(
            "relative group flex flex-col items-center justify-center transition-all duration-200",
            "w-11 h-7 rounded shadow-2xl", // Slightly smaller than the slot
            data.isSnapped
                ? "bg-blue-600 border border-blue-400 ring-1 ring-blue-500/50 scale-100 z-50 rounded-sm"
                : "bg-slate-800 border border-slate-600 backdrop-blur-md scale-105",
            selected && "ring-2 ring-yellow-400 border-yellow-400 z-[100]"
        )}>
            {/* Plug Logic */}
            <div className="flex flex-col items-center pointer-events-none">
                <Icon size={12} className={clsx(data.isSnapped ? "text-white" : "text-slate-400")} />
                <div className="flex items-center mt-0.5">
                    <FlowIndicator />
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500 !border-white !opacity-0" />

            {/* Floating Label */}
            {(data.showLabel || !data.isSnapped || selected) && (
                <div className="absolute -top-7 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shadow-xl whitespace-nowrap pointer-events-none group-hover:opacity-100 opacity-100 transition-opacity">
                    <span className="text-[8px] font-black text-slate-300 font-mono tracking-tighter uppercase">
                        {data.label || 'TERMINAL'}
                    </span>
                </div>
            )}

            {/* Snapped "Lock" LED */}
            {data.isSnapped && (
                <div className="absolute -top-1 right-1 w-1 h-1 bg-white rounded-full shadow-[0_0_3px_white] animate-pulse" />
            )}
        </div>
    );
};

export default memo(TerminalNode);
