import { v4 as uuidv4 } from 'uuid';
import type { ILayer, NeuronType } from './types';

/**
 * Visual grouping concept for React Flow
 * Doesn't participate in calculation logic.
 */
export class NeuralLayer implements ILayer {
    id: string;
    label: string;
    type: NeuronType = 'layer';

    constructor(label: string) {
        this.id = uuidv4();
        this.label = label;
    }
}
