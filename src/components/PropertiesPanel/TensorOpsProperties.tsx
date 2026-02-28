import React from 'react';
import type { NeuronPartialUpdate } from '../../models/neural';
import type { TensorElementWiseOp, ElementWiseOperation } from '../../models/TensorElementWiseOp';
import type { TensorReductionOp, ReductionOperation } from '../../models/TensorReductionOp';
import type { TensorMatrixOp, MatrixOperation } from '../../models/TensorMatrixOp';
import type { TensorReshapeOp, ReshapeOperation } from '../../models/TensorReshapeOp';
import { NativeNumberInput } from './SharedComponents';

interface TensorOpsPropertiesProps {
    node: TensorElementWiseOp | TensorReductionOp | TensorMatrixOp | TensorReshapeOp;
    onUpdateNeuron: (id: string, updates: NeuronPartialUpdate) => void;
}

export const TensorOpsProperties: React.FC<TensorOpsPropertiesProps> = ({ node, onUpdateNeuron }) => {

    const renderElemOpConfig = (elemNode: TensorElementWiseOp) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operation</label>
            <select
                value={elemNode.operationType}
                onChange={(e) => onUpdateNeuron(elemNode.id, { operationType: e.target.value as ElementWiseOperation } as any)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
                <option value="add">Add (+)</option>
                <option value="sub">Subtract (-)</option>
                <option value="mul">Multiply (*)</option>
                <option value="div">Divide (/)</option>
                <option value="relu">ReLU (Activation)</option>
                <option value="sigmoid">Sigmoid (Activation)</option>
            </select>
        </div>
    );

    const renderReduceOpConfig = (reduceNode: TensorReductionOp) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operation</label>
            <select
                value={reduceNode.operationType}
                onChange={(e) => onUpdateNeuron(reduceNode.id, { operationType: e.target.value as ReductionOperation } as any)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
                <option value="sum">Sum</option>
                <option value="mean">Mean (Average)</option>
                <option value="max">Max</option>
                <option value="min">Min</option>
                <option value="argmax">Argmax</option>
            </select>
            {/* Axis could be added here in future if needed */}
        </div>
    );

    const renderMatrixOpConfig = (matrixNode: TensorMatrixOp) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operation</label>
            <select
                value={matrixNode.operationType}
                onChange={(e) => onUpdateNeuron(matrixNode.id, { operationType: e.target.value as MatrixOperation } as any)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-pink-500 transition-colors cursor-pointer"
            >
                <option value="matmul">Matrix Multiplication (Matmul)</option>
                <option value="dot">Dot Product</option>
                <option value="outer">Outer Product</option>
            </select>
        </div>
    );

    const renderReshapeOpConfig = (reshapeNode: TensorReshapeOp) => (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operation</label>
                <select
                    value={reshapeNode.operationType}
                    onChange={(e) => onUpdateNeuron(reshapeNode.id, { operationType: e.target.value as ReshapeOperation } as any)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                    <option value="reshape">Reshape (Change dims)</option>
                    <option value="transpose">Transpose</option>
                    <option value="squeeze">Squeeze (Drop 1-dims)</option>
                    <option value="unsqueeze">Unsqueeze (Add 1-dim)</option>
                    <option value="concat">Concat</option>
                    <option value="stack">Stack</option>
                </select>
            </div>

            {reshapeNode.operationType === 'reshape' && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target Shape (comma separated)</label>
                    <input
                        value={reshapeNode.targetShape?.join(',') || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            const arr = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                            onUpdateNeuron(reshapeNode.id, { targetShape: arr.length > 0 ? arr : undefined } as any);
                        }}
                        placeholder="e.g. 2,5"
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono focus:border-cyan-500"
                    />
                </div>
            )}

            {(reshapeNode.operationType === 'concat' || reshapeNode.operationType === 'stack' || reshapeNode.operationType === 'squeeze' || reshapeNode.operationType === 'unsqueeze') && (
                <NativeNumberInput
                    label="Axis"
                    value={reshapeNode.axis || 0}
                    onChange={(val) => onUpdateNeuron(reshapeNode.id, { axis: val } as any)}
                    focusColor="cyan"
                />
            )}
        </div>
    );

    return (
        <div className="flex flex-col gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-1 border-b border-slate-700 pb-2">
                <div className={`w-2 h-2 rounded-full ${node.type === 'tensor-elem-op' ? 'bg-indigo-400' : node.type === 'tensor-reduce-op' ? 'bg-orange-400' : node.type === 'tensor-matrix-op' ? 'bg-pink-400' : 'bg-cyan-400'}`} />
                <h4 className="font-semibold text-slate-300 text-sm">Op Configuration</h4>
            </div>

            {node.type === 'tensor-elem-op' && renderElemOpConfig(node as TensorElementWiseOp)}
            {node.type === 'tensor-reduce-op' && renderReduceOpConfig(node as TensorReductionOp)}
            {node.type === 'tensor-matrix-op' && renderMatrixOpConfig(node as TensorMatrixOp)}
            {node.type === 'tensor-reshape-op' && renderReshapeOpConfig(node as TensorReshapeOp)}
        </div>
    );
};
