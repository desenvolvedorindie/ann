import { useState, useRef } from 'react';
import { NetworkCanvas } from './components/NetworkCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import type { INeuron, ISynapse } from './models/neural';
import './index.css';

function App() {
  const [selectedNode, setSelectedNode] = useState<INeuron | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ISynapse | null>(null);

  // Storing the master copies of domain objects here allows the UI
  // to reference and update them.
  const neuronsRef = useRef<Map<string, INeuron>>(new Map());
  const synapsesRef = useRef<Map<string, ISynapse>>(new Map());

  const [tick, setTick] = useState(0);

  const onUpdateNeuron = (id: string, updates: Partial<INeuron>) => {
    const neuron = neuronsRef.current.get(id);
    if (neuron) {
      if (updates.label !== undefined) neuron.label = updates.label;
      if (updates.output !== undefined && neuron.type === 'input') {
        neuron.output = updates.output;
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
        inDegree.set(tgt, inDegree.get(tgt)! - 1);
        if (inDegree.get(tgt) === 0) {
          queue.push(e.postSynaptic);
        }
      });
    }

    // Now evaluate M-P neurons in sorted order
    sorted.forEach(n => {
      if (n.type === 'mcculloch-pitts') {
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
      <NetworkCanvas
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
