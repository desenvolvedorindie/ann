import { useState, useRef } from 'react';
import { Unplug, Hand, MousePointer2 } from 'lucide-react';
import { NetworkCanvas } from './components/NetworkCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import type { INeuron, ISynapse, NeuronPartialUpdate } from './models/neural';
import './index.css';

function App() {
  const [selectedNode, setSelectedNode] = useState<INeuron | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ISynapse | null>(null);

  // Storing the master copies of domain objects here allows the UI
  // to reference and update them.
  const neuronsRef = useRef<Map<string, INeuron>>(new Map());
  const synapsesRef = useRef<Map<string, ISynapse>>(new Map());

  const [tick, setTick] = useState(0);
  const [showMatrixHandles, setShowMatrixHandles] = useState(false);
  const [toolMode, setToolMode] = useState<'pan' | 'select'>('pan');

  const onUpdateNeuron = (id: string, updates: NeuronPartialUpdate) => {
    const neuron = neuronsRef.current.get(id);
    if (neuron) {
      if (updates.label !== undefined) neuron.label = updates.label;
      if (updates.output !== undefined && neuron.type === 'input') {
        neuron.output = updates.output;
      }
      if (neuron.type === 'pixel-matrix') {
        let resized = false;
        const matrix = neuron as any;
        if (updates.width !== undefined && updates.width !== matrix.width) {
          matrix.width = updates.width;
          resized = true;
        }
        if (updates.height !== undefined && updates.height !== matrix.height) {
          matrix.height = updates.height;
          resized = true;
        }
        if (resized) {
          matrix.output = new Array(matrix.width * matrix.height).fill(0);
        }
      }
      setSelectedNode({ ...neuron } as INeuron); // trigger panel re-render
      setTick(t => t + 1); // trigger canvas re-render to show updated label
    }
  };

  const onUpdateSynapse = (id: string, updates: Partial<ISynapse>) => {
    const synapse = synapsesRef.current.get(id);
    if (synapse) {
      if (updates.weight !== undefined) synapse.weight = updates.weight;
      setSelectedEdge({ ...synapse } as ISynapse);
      setTick(t => t + 1);
    }
  };

  const executeNetwork = () => {
    const edges = Array.from(synapsesRef.current.values());
    const neurons = Array.from(neuronsRef.current.values());

    // Kahn's algorithm for topological sort to evaluate feedforward network correctly
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, ISynapse[]>();

    neurons.forEach(n => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
    });

    edges.forEach(e => {
      adjList.get(e.preSynaptic.id)?.push(e);
      inDegree.set(e.postSynaptic.id, (inDegree.get(e.postSynaptic.id) || 0) + 1);
    });

    const queue: INeuron[] = [];
    neurons.forEach(n => {
      if (inDegree.get(n.id) === 0) {
        queue.push(n);
      }
    });

    const sorted: INeuron[] = [];
    while (queue.length > 0) {
      const n = queue.shift()!;
      sorted.push(n);
      adjList.get(n.id)?.forEach(e => {
        const tgt = e.postSynaptic.id;
        // Decrease inDegree only to trigger topology order, don't mutate graph edges
        const currentDegree = inDegree.get(tgt) || 0;
        inDegree.set(tgt, currentDegree - 1);
        if (inDegree.get(tgt) === 0) {
          queue.push(e.postSynaptic);
        }
      });
    }

    // Now evaluate M-P and Output neurons in sorted order
    sorted.forEach(n => {
      if (n.type === 'mcculloch-pitts' || n.type === 'output') {
        const incomingEdges = edges.filter(e => e.postSynaptic.id === n.id);
        n.calculateOutput(incomingEdges);
      }
    });

    setTick(t => t + 1);
  };

  return (
    <div className="flex w-full h-full relative">
      {/* Top action bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={executeNetwork}
          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-bold rounded-full shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z" /></svg>
          Executar
        </button>
      </div>
      {/* Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
        <button
          onClick={() => setToolMode('pan')}
          className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'pan'
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
            }`}
          title="Mover Tela (Hand)"
        >
          <Hand className="w-5 h-5" />
        </button>

        <button
          onClick={() => setToolMode('select')}
          className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'select'
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
              : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
            }`}
          title="Selecionar Nós"
        >
          <MousePointer2 className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-slate-700 mx-2"></div>

        <button
          onClick={() => setShowMatrixHandles(!showMatrixHandles)}
          className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${showMatrixHandles
            ? "bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
            }`}
          title="Ativar Roteamento de Pixels"
        >
          <Unplug className="w-5 h-5" />
        </button>
      </div>

      <NetworkCanvas
        showMatrixHandles={showMatrixHandles}
        toolMode={toolMode}
        onSelectNode={setSelectedNode}
        onSelectEdge={setSelectedEdge}
        neuronsRef={neuronsRef}
        synapsesRef={synapsesRef}
        tick={tick}
      />
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNeuron={onUpdateNeuron}
        onUpdateSynapse={onUpdateSynapse}
      />
    </div>
  );
}

export default App;
