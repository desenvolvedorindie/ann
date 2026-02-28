import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export class Tensor implements INeuron {
    id: string;
    type: NeuronType = 'tensor';
    label: string;

    order: number;
    shape: number[];
    output: number[];

    constructor(label: string = 'Tensor', order: number = 1, shape: number[] = [3]) {
        this.id = uuidv4();
        this.label = label;
        this.order = order;
        this.shape = [...shape];

        // Ensure shapes map to order correctly
        while (this.shape.length < this.order) {
            this.shape.push(1);
        }
        if (this.shape.length > this.order) {
            this.shape = this.shape.slice(0, this.order);
        }
        if (this.order === 0) {
            this.shape = [];
        }

        const initialSize = this.shape.reduce((acc, val) => acc * val, 1) || 1;
        this.output = new Array(this.order === 0 ? 1 : initialSize).fill(0);
    }

    get size(): number {
        if (this.order === 0) return 1;
        return this.shape.reduce((acc, val) => acc * val, 1);
    }

    calculateOutput(incomingSynapses: ISynapse[] = []): number[] {
        if (incomingSynapses.length > 0) {
            for (const syn of incomingSynapses) {
                if (syn.targetIndex !== undefined && syn.targetIndex >= 0 && syn.targetIndex < this.output.length) {
                    let inVal = 0;
                    if (Array.isArray(syn.preSynaptic.output)) {
                        if (syn.sourceIndex !== undefined && syn.sourceIndex >= 0 && syn.sourceIndex < syn.preSynaptic.output.length) {
                            inVal = syn.preSynaptic.output[syn.sourceIndex];
                        }
                    } else {
                        inVal = typeof syn.preSynaptic.output === 'number' ? syn.preSynaptic.output : 0;
                    }

                    // For generic Tensor, update value, ignoring connection weight
                    const val = inVal;
                    this.output[syn.targetIndex] = val;
                }
            }
        }
        return this.output;
    }

    setShape(newShape: number[]) {
        this.shape = [...newShape];
        this.order = newShape.length;
        const newSize = this.shape.reduce((acc, val) => acc * val, 1) || 1;

        // Resize array preserving existing data up to size limit
        const newOutput = new Array(this.order === 0 ? 1 : newSize).fill(0);
        for (let i = 0; i < Math.min(this.output.length, newOutput.length); i++) {
            newOutput[i] = this.output[i];
        }
        this.output = newOutput;
    }

    setOrder(newOrder: number) {
        if (newOrder < 0) return;
        this.order = newOrder;

        if (newOrder === 0) {
            this.shape = [];
        } else {
            const newShape = [...this.shape];
            while (newShape.length < this.order) {
                newShape.push(1);
            }
            if (newShape.length > this.order) {
                this.shape = newShape.slice(0, this.order);
            } else {
                this.shape = newShape;
            }
        }

        const newSize = this.shape.reduce((acc, val) => acc * val, 1) || 1;
        const newOutput = new Array(this.order === 0 ? 1 : newSize).fill(0);
        for (let i = 0; i < Math.min(this.output.length, newOutput.length); i++) {
            newOutput[i] = this.output[i];
        }
        this.output = newOutput;
    }
}
