export type NeuronType = 'input' | 'output';

export interface INeuron extends Record<string, unknown> {
    id: string;
    label: string;
    type: NeuronType;
    activationFunction?: string;
    state?: number;
    bias?: number;
    position?: { x: number; y: number };
}

export interface ISynapse {
    id: string;
    sourceId: string;
    targetId: string;
    weight: number;
}
