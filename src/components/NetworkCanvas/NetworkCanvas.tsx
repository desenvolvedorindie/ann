import { forwardRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Flow } from './Flow';
import type { NetworkCanvasProps, NetworkCanvasRef } from './types';

export const NetworkCanvas = forwardRef<NetworkCanvasRef, NetworkCanvasProps>((props, ref) => {
    return (
        <ReactFlowProvider>
            <Flow {...props} ref={ref} />
        </ReactFlowProvider>
    );
});
