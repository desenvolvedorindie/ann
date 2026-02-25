import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { X, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { PixelMatrix, INeuron } from '../models/neural';

export type PixelMatrixNodeData = Record<string, unknown> & {
    neuron: INeuron;
    showHandles?: boolean;
};

export const PixelMatrixNode: React.FC<NodeProps<Node<PixelMatrixNodeData>>> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const matrix = data.neuron as PixelMatrix;
    const showHandles = !!data.showHandles;

    // Manage grid visual state reactively so divs can re-render colors
    const [pixels, setPixels] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isErasing, setIsErasing] = useState(false);

    useEffect(() => {
        setPixels([...matrix.output]);
    }, [matrix, matrix.width, matrix.height]);

    const onDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    const handleDraw = (index: number) => {
        if (!isDrawing || showHandles) return;
        const targetValue = isErasing ? 0 : 1;
        if (matrix.output[index] !== targetValue) {
            matrix.output[index] = targetValue;
            setPixels([...matrix.output]);
        }
    };

    const handlePointerDown = (index: number, e: React.PointerEvent) => {
        if (showHandles) return; // Prevent drawing overrides when attempting to drag handles
        e.preventDefault();
        // React Flow drag is intercepted via CSS class, but we need to track our painting intent
        setIsDrawing(true);

        // Determine mode by what is currently hovered: if it's already painted, we activate erase mode.
        const shouldErase = matrix.output[index] === 1;
        setIsErasing(shouldErase);

        const targetValue = shouldErase ? 0 : 1;
        if (matrix.output[index] !== targetValue) {
            matrix.output[index] = targetValue;
            setPixels([...matrix.output]);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        setIsErasing(false); // Reset erasing state on pointer up
    };

    const clearMatrix = (e: React.MouseEvent) => {
        e.stopPropagation();
        matrix.output.fill(0);
        setPixels([...matrix.output]);
    };

    // Calculate fixed physical dimensions to prevent infinite node growth
    const MAX_NODE_SIZE = 140; // Reduced from 180 to make it smaller on the canvas
    const aspectRatio = matrix.width / matrix.height;
    const canvasWidth = aspectRatio >= 1 ? MAX_NODE_SIZE : MAX_NODE_SIZE * aspectRatio;
    const canvasHeight = aspectRatio <= 1 ? MAX_NODE_SIZE : MAX_NODE_SIZE / aspectRatio;

    return (
        <div
            className={clsx(
                'relative group rounded-xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg flex flex-col',
                {
                    'bg-slate-900 border-slate-700': !selected,
                    'bg-slate-800 border-pink-500 shadow-pink-500/20 scale-[1.02]': selected,
                }
            )}
            style={{
                width: Math.max(canvasWidth + 16, 180),
                opacity: showHandles ? 0.35 : 1
            }}
        >
            {/* When routing, we still need the handles to be interactive, so we lift them out of the pointer-events-none cascade */}
            <button
                onClick={onDelete}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Deletar Matriz"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between p-2 border-b border-slate-700/50 drag-handle cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider">{matrix.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">{matrix.width}x{matrix.height}</span>
                    <button
                        onClick={clearMatrix}
                        className="p-1 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Limpar Desenho"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div
                className="p-2 flex justify-center items-center bg-slate-800/50 rounded-b-xl overflow-hidden"
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* The 'nodrag' and 'nowheel' classes tell React Flow to let events pass to us */}
                <div
                    className={clsx(
                        "grid nodrag nowheel border border-slate-400 bg-white touch-none relative",
                        { "pointer-events-none": showHandles }
                    )}
                    style={{
                        zIndex: 20, // Keep matrix visually above standard connection edges
                        gridTemplateColumns: `repeat(${matrix.width}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${matrix.height}, minmax(0, 1fr))`,
                        width: canvasWidth,
                        height: canvasHeight
                    }}
                >
                    {pixels.map((val, i) => (
                        <div
                            key={i}
                            onPointerDown={(e) => handlePointerDown(i, e)}
                            onPointerEnter={() => handleDraw(i)}
                            className={clsx(
                                "relative w-full h-full border-[0.5px] border-slate-200/50 flex items-center justify-center",
                                val > 0 ? "bg-slate-900" : "bg-transparent"
                            )}
                            style={{ userSelect: 'none' }}
                        >
                            {/* Inner Handles overlay */}
                            <div className={clsx(
                                "absolute inset-0 flex items-center justify-center",
                                showHandles ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={`pixel-${i}`}
                                    className="!relative !transform-none !right-auto !top-auto !w-1.5 !h-1.5 !min-w-0 !min-h-0 !bg-pink-500 !border-0 hover:!bg-white hover:!scale-150 transition-transform"
                                    style={{ zIndex: 110 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
