import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export class PixelMatrix implements INeuron {
    id: string;
    type: NeuronType = 'pixel-matrix';
    label: string;
    output: number[] = [];

    width: number;
    height: number;

    constructor(label: string = 'Pixel Matrix', width: number = 30, height: number = 30) {
        this.id = uuidv4();
        this.label = label;
        this.width = width;
        this.height = height;
        this.output = new Array(width * height).fill(0);
    }

    get size(): number {
        return this.width * this.height;
    }

    calculateOutput(incomingSynapses: ISynapse[] = []): number[] {
        // If there are incoming connections, the matrix acts as a receiver and renders their state.
        if (incomingSynapses.length > 0) {
            this.output.fill(0);
            for (const syn of incomingSynapses) {
                // Handle tensor array connections via sourceIndex, or regular number output
                let inVal = 0;
                if (Array.isArray(syn.preSynaptic.output)) {
                    if (syn.sourceIndex !== undefined && syn.sourceIndex >= 0 && syn.sourceIndex < syn.preSynaptic.output.length) {
                        inVal = syn.preSynaptic.output[syn.sourceIndex];
                    }
                } else {
                    inVal = typeof syn.preSynaptic.output === 'number' ? syn.preSynaptic.output : 0;
                }

                const val = inVal; // Ignore connection weight for Pixel Matrix
                if (syn.targetHandle?.startsWith('pixel-in-')) {
                    const idxStr = syn.targetHandle.replace('pixel-in-', '');
                    const idx = parseInt(idxStr, 10);
                    if (!isNaN(idx) && idx >= 0 && idx < this.output.length) {
                        this.output[idx] = val; // Set the actual value
                    }
                }
            }
        }
        return this.output;
    }
}
