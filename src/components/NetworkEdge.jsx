import React, { memo, useState } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSimpleBezierPath,
} from '@xyflow/react';
import { X, Settings2, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-react';

const NetworkEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    selected,
}) => {
    const [hovered, setHovered] = useState(false);
    const direction = data?.direction || 'both';
    const labelMode = data?.labelMode || 'hover';

    const sLabel = data?.sourceLabel || 'P?';
    const tLabel = data?.targetLabel || 'P?';

    // Custom cable name from configuration
    const cableName = data?.cableName || `${sLabel} ↔ ${tLabel}`;

    const sPortAttr = parseInt(sLabel.replace('P', '')) || 0;
    const tPortAttr = parseInt(tLabel.replace('P', '')) || 0;

    const curvature = 0.1 + ((sPortAttr + tPortAttr) % 4) * 0.05;

    const [pathBoth, labelX, labelY] = getSimpleBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        curvature: curvature
    });

    const offset = 5;
    const [pathA2B] = getSimpleBezierPath({
        sourceX, sourceY: sourceY - offset,
        targetX, targetY: targetY - offset,
        sourcePosition, targetPosition,
        curvature: curvature
    });
    const [pathB2A] = getSimpleBezierPath({
        sourceX, sourceY: sourceY + offset,
        targetX, targetY: targetY + offset,
        sourcePosition, targetPosition,
        curvature: curvature
    });

    const shiftX = (sPortAttr % 3 - 1) * 35;
    const shiftY = (sPortAttr % 2 === 0) ? -30 : 30;

    const isFocus = hovered || selected;
    const isLabelVisible = data.showLabel || isFocus;

    return (
        <>
            <style>{`
        @keyframes dashdraw { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        @keyframes dashdraw-reverse { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 20; } }
      `}</style>

            <g
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="cursor-pointer"
                style={{ pointerEvents: 'all' }}
            >
                {(direction === 'both' || direction === 'a-to-b') && (
                    <BaseEdge
                        path={pathA2B}
                        style={{
                            ...style,
                            strokeWidth: isFocus ? 5 : 2.5,
                            stroke: '#f59e0b',
                            strokeDasharray: isFocus ? '5,5' : 'None',
                            animation: isFocus ? 'dashdraw 0.4s linear infinite' : 'none',
                            opacity: isFocus ? 1 : 0.6,
                            transition: 'all 0.2s ease',
                        }}
                    />
                )}

                {(direction === 'both' || direction === 'b-to-a') && (
                    <BaseEdge
                        path={pathB2A}
                        style={{
                            ...style,
                            strokeWidth: isFocus ? 5 : 2.5,
                            stroke: '#10b981',
                            strokeDasharray: isFocus ? '5,5' : 'None',
                            animation: isFocus ? 'dashdraw-reverse 0.4s linear infinite' : 'none',
                            opacity: isFocus ? 1 : 0.6,
                            transition: 'all 0.2s ease',
                        }}
                    />
                )}

                <BaseEdge path={pathBoth} style={{ strokeWidth: 30, stroke: 'transparent', cursor: 'pointer' }} />
            </g>

            <EdgeLabelRenderer>
                {isLabelVisible && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX + shiftX}px,${labelY + shiftY}px)`,
                            pointerEvents: 'all',
                            zIndex: 1000,
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        className="flex flex-col items-center gap-1 pointer-events-auto"
                    >
                        <div
                            className={`px-3 py-1.5 rounded-full border text-[10px] font-black flex items-center gap-2 transition-all shadow-2xl backdrop-blur-xl ring-2 whitespace-nowrap
                ${isFocus
                                    ? 'bg-amber-600 border-amber-300 text-white scale-125 shadow-amber-500/60 ring-white/20'
                                    : 'bg-slate-900/95 border-slate-700 text-slate-400 ring-transparent opacity-95'}
              `}
                        >
                            <span className="font-mono tracking-tighter">
                                {cableName}
                            </span>
                        </div>

                        {isFocus && (
                            <div className="flex gap-2 mt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <button onClick={(e) => { e.stopPropagation(); data?.onConfigClick?.(id); }} className="p-1.5 bg-slate-900 hover:bg-blue-600 text-blue-400 hover:text-white border border-slate-700 rounded-lg shadow-xl"><Settings2 size={12} strokeWidth={3} /></button>
                                <button onClick={(e) => { e.stopPropagation(); data?.onDeleteClick?.(id); }} className="p-1.5 bg-slate-900 hover:bg-red-600 text-red-500 hover:text-white border border-slate-700 rounded-lg shadow-xl"><X size={12} strokeWidth={3} /></button>
                            </div>
                        )}
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(NetworkEdge);
