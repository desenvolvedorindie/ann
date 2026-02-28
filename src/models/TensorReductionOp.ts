import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export type ReductionOperation = 'sum' | 'mean' | 'max' | 'min' | 'argmax';

export class TensorReductionOp implements INeuron {
    id: string;
    type: NeuronType = 'tensor-reduce-op';
    label: string;
    output: number[] = [];

    operationType: ReductionOperation;

    constructor(
        label: string = 'Reduction Op',
        operationType: ReductionOperation = 'sum'
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

        // Collect all incoming values into a single array
        let values: number[] = [];

        for (const syn of incomingSynapses) {
            let inVal = 0;
            if (Array.isArray(syn.preSynaptic.output)) {
                if (syn.sourceIndex !== undefined && syn.sourceIndex >= 0 && syn.sourceIndex < syn.preSynaptic.output.length) {
                    inVal = syn.preSynaptic.output[syn.sourceIndex];
                } else {
                    // If no explicit source index is specified, grab the whole 1D array?
                    // According to our Tensor logic, we should probably grab what's mapped, but let's take all if it's connected without sourceIndex.
                    values.push(...syn.preSynaptic.output);
                }
            } else {
                inVal = typeof syn.preSynaptic.output === 'number' ? syn.preSynaptic.output : 0;
            }

            if (syn.sourceIndex !== undefined || !Array.isArray(syn.preSynaptic.output)) {
                values.push(inVal * (syn.weight ?? 1));
            }
        }

        if (values.length === 0) {
            this.output = [];
            return this.output;
        }

        let result = 0;

        switch (this.operationType) {
            case 'sum':
                result = values.reduce((acc, curr) => acc + curr, 0);
                break;
            case 'mean':
                result = values.reduce((acc, curr) => acc + curr, 0) / values.length;
                break;
            case 'max':
                result = Math.max(...values);
                break;
            case 'min':
                result = Math.min(...values);
                break;
            case 'argmax':
                let maxIdx = 0;
                let maxVal = values[0];
                for (let i = 1; i < values.length; i++) {
                    if (values[i] > maxVal) {
                        maxVal = values[i];
                        maxIdx = i;
                    }
                }
                result = maxIdx;
                break;
        }

        // Output of a full reduction is a single scalar in a 1D array
        this.output = [result];
        return this.output;
    }
}
