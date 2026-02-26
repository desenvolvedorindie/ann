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
        // Se houver conexões de entrada, a matriz atua como receptora e renderiza o estado delas.
        if (incomingSynapses.length > 0) {
            this.output.fill(0);
            for (const syn of incomingSynapses) {
                // Previne NaN, assume 0 caso pré-sinaptico não tenha um número válido
                const inVal = typeof syn.preSynaptic.output === 'number'
                    ? syn.preSynaptic.output
                    : 0;

                const val = inVal * syn.weight;
                if (val > 0 && syn.targetHandle?.startsWith('pixel-in-')) {
                    const idxStr = syn.targetHandle.replace('pixel-in-', '');
                    const idx = parseInt(idxStr, 10);
                    if (!isNaN(idx) && idx >= 0 && idx < this.output.length) {
                        this.output[idx] = 1; // Ou val se a intenção for matiz, mas pixels usam 0 ou 1
                    }
                }
            }
        }
        return this.output;
    }
}
