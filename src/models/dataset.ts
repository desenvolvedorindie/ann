export interface DataRow {
    inputs: number[];
    outputs: number[];
}

export interface Dataset {
    id: string;
    name: string;
    isReadOnly: boolean;
    inputColumns: string[];
    outputColumns: string[];
    rows: DataRow[];
}

export const defaultLogicGates: Dataset[] = [
    {
        id: 'AND',
        name: 'Logic Gate: AND',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [0] },
            { inputs: [0, 1], outputs: [0] },
            { inputs: [1, 0], outputs: [0] },
            { inputs: [1, 1], outputs: [1] }
        ]
    },
    {
        id: 'OR',
        name: 'Logic Gate: OR',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [0] },
            { inputs: [0, 1], outputs: [1] },
            { inputs: [1, 0], outputs: [1] },
            { inputs: [1, 1], outputs: [1] }
        ]
    },
    {
        id: 'NOT',
        name: 'Logic Gate: NOT',
        isReadOnly: true,
        inputColumns: ['X1'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0], outputs: [1] },
            { inputs: [1], outputs: [0] }
        ]
    },
    {
        id: 'NAND',
        name: 'Logic Gate: NAND',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [1] },
            { inputs: [0, 1], outputs: [1] },
            { inputs: [1, 0], outputs: [1] },
            { inputs: [1, 1], outputs: [0] }
        ]
    },
    {
        id: 'NOR',
        name: 'Logic Gate: NOR',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [1] },
            { inputs: [0, 1], outputs: [0] },
            { inputs: [1, 0], outputs: [0] },
            { inputs: [1, 1], outputs: [0] }
        ]
    },
    {
        id: 'XOR',
        name: 'Logic Gate: XOR',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [0] },
            { inputs: [0, 1], outputs: [1] },
            { inputs: [1, 0], outputs: [1] },
            { inputs: [1, 1], outputs: [0] }
        ]
    },
    {
        id: 'XNOR',
        name: 'Logic Gate: XNOR',
        isReadOnly: true,
        inputColumns: ['X1', 'X2'],
        outputColumns: ['Y'],
        rows: [
            { inputs: [0, 0], outputs: [1] },
            { inputs: [0, 1], outputs: [0] },
            { inputs: [1, 0], outputs: [0] },
            { inputs: [1, 1], outputs: [1] }
        ]
    }
];
