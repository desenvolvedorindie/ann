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

    calculateOutput(_incomingSynapses: ISynapse[] = []): number[] {
        return this.output;
    }
}
