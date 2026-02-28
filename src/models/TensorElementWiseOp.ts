import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export type ElementWiseOperation = 'add' | 'sub' | 'mul' | 'div' | 'relu' | 'sigmoid';

export class TensorElementWiseOp implements INeuron {
    id: string;
    type: NeuronType = 'tensor-elem-op';
    label: string;
    output: number[] = [];

    operationType: ElementWiseOperation;

    constructor(
        label: string = 'Element-wise Op',
        operationType: ElementWiseOperation = 'add'
    ) {
        this.id = uuidv4();
        this.label = label;
        this.operationType = operationType;
    }

    get size(): number {
        return this.output.length || 1;
    }

    calculateOutput(incomingSynapses: ISynapse[] = []): number[] {
        if (incomingSynapses.length === 0) {
            this.output = [];
            return this.output;
        }

        // Group inputs by target index if needed, or assume we receive full tensors
        // Since synapses pass numbers, and we are working with tensors, we need to adapt.
        // Wait, if we use the synapse to pass individual values, we just need to iterate output elements?
        // Actually, the new architecture states that Tensor connections pass values index-to-index.
        // So this node will receive multiple values on its 'input' handle, each mapped to a targetIndex.

        // Find the maximum targetIndex to determine the output shape
        let maxTargetIndex = -1;

        // For element-wise operations with two inputs, we might receive multiple connections to the same targetIndex.
        // Let's group incoming values by targetIndex.
        const valuesByIndex: Record<number, number[]> = {};

        for (const syn of incomingSynapses) {
            if (syn.targetIndex !== undefined) {
                if (syn.targetIndex > maxTargetIndex) maxTargetIndex = syn.targetIndex;

                let inVal = 0;
                if (Array.isArray(syn.preSynaptic.output)) {
                    if (syn.sourceIndex !== undefined && syn.sourceIndex >= 0 && syn.sourceIndex < syn.preSynaptic.output.length) {
                        inVal = syn.preSynaptic.output[syn.sourceIndex];
                    }
                } else {
                    inVal = typeof syn.preSynaptic.output === 'number' ? syn.preSynaptic.output : 0;
                }

                const val = inVal * (syn.weight ?? 1); // using weight if applicable, though tensor connections ignore it often

                if (!valuesByIndex[syn.targetIndex]) {
                    valuesByIndex[syn.targetIndex] = [];
                }
                valuesByIndex[syn.targetIndex].push(val);
            }
        }

        if (maxTargetIndex === -1 && incomingSynapses.length > 0) {
            // fallback for scalars
            maxTargetIndex = 0;
            let sum = 0;
            for (const syn of incomingSynapses) {
                let inVal = 0;
                if (Array.isArray(syn.preSynaptic.output)) {
                    inVal = syn.preSynaptic.output[0] || 0;
                } else {
                    inVal = typeof syn.preSynaptic.output === 'number' ? syn.preSynaptic.output : 0;
                }
                sum += inVal * (syn.weight ?? 1);
            }
            valuesByIndex[0] = [sum];
        }

        const newOutput = new Array(maxTargetIndex + 1).fill(0);

        // Apply operation for each index
        for (let i = 0; i <= maxTargetIndex; i++) {
            const vals = valuesByIndex[i] || [];

            if (vals.length === 0) {
                newOutput[i] = 0;
                continue;
            }

            let result = vals[0];

            switch (this.operationType) {
                case 'add':
                    result = vals.reduce((acc, curr) => acc + curr, 0);
                    break;
                case 'sub':
                    if (vals.length > 1) {
                        result = vals[0];
                        for (let v = 1; v < vals.length; v++) result -= vals[v];
                    }
                    break;
                case 'mul':
                    result = vals.reduce((acc, curr) => acc * curr, 1);
                    break;
                case 'div':
                    if (vals.length > 1) {
                        result = vals[0];
                        for (let v = 1; v < vals.length; v++) result /= (vals[v] === 0 ? 1 : vals[v]);
                    }
                    break;
                case 'relu':
                    result = vals[0] > 0 ? vals[0] : 0;
                    // Note: If multiple inputs arrive at the same index for relu, we sum them first usually, but here we just process the first or sum. Let's sum for safety.
                    if (vals.length > 1) {
                        let sum = vals.reduce((acc, curr) => acc + curr, 0);
                        result = sum > 0 ? sum : 0;
                    }
                    break;
                case 'sigmoid':
                    if (vals.length > 1) {
                        let sum = vals.reduce((acc, curr) => acc + curr, 0);
                        result = 1 / (1 + Math.exp(-sum));
                    } else {
                        result = 1 / (1 + Math.exp(-vals[0]));
                    }
                    break;
            }
            newOutput[i] = result;
        }

        this.output = newOutput;
        return this.output;
    }
}
