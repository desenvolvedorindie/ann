import { useState, useRef, useEffect, useCallback } from 'react';
import { Unplug, Hand, MousePointer2, AlignVerticalSpaceAround, AlignHorizontalSpaceAround, AlignCenterHorizontal, AlignCenterVertical, Play, Square, RefreshCcw, Network } from 'lucide-react';
import { NetworkCanvas, type NetworkCanvasRef, type HistoryState } from './components/NetworkCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { DatabaseWorkspace } from './components/DatabaseWorkspace';
import { TrainingWorkspace, type TrainingDataPoint } from './components/TrainingWorkspace';
import { TrainingTimeline } from './components/TrainingTimeline';
import type { INeuron, ISynapse, NeuronPartialUpdate } from './models/neural';
import type { Dataset } from './models/dataset';
import { defaultLogicGates } from './models/dataset';
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
  const [workspace, setWorkspace] = useState<'data' | 'architecture' | 'training' | 'execution'>('architecture');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [layerChildIds, setLayerChildIds] = useState<string[]>([]);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [historyState, setHistoryState] = useState<HistoryState | null>(null);
  const [showRawConnections, setShowRawConnections] = useState(false);

  // Global Dataset State
  const [datasets, setDatasets] = useState<Dataset[]>(defaultLogicGates);

  // Training State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingExpanded, setTrainingExpanded] = useState(false);
  const [trainingDatasetId, setTrainingDatasetId] = useState<string>(defaultLogicGates[0].id);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [trainingData, setTrainingData] = useState<TrainingDataPoint[]>([]);

  // Refs to track mutable frame/epoch synchronously inside the interval
  // (avoids React StrictMode double-invocation of functional updaters)
  const currentFrameRef = useRef(0);
  const trainingEpochRef = useRef(0);
  // Random-walk position on the error surface
  const x1Ref = useRef((Math.random() * 6) - 3);
  const x2Ref = useRef((Math.random() * 6) - 3);

  // Refs to access latest training state inside the interval without re-creating it
  const datasetsRef = useRef<Dataset[]>(defaultLogicGates);
  const trainingDatasetIdRef = useRef<string>(defaultLogicGates[0].id);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { datasetsRef.current = datasets; }, [datasets]);
  useEffect(() => { trainingDatasetIdRef.current = trainingDatasetId; }, [trainingDatasetId]);

  const canvasRef = useRef<NetworkCanvasRef>(null);

  const onHistoryChange = useCallback((state: HistoryState) => {
    setHistoryState(state);
  }, []);

  const onSelectNode = useCallback((node: INeuron | null, childIds?: string[]) => {
    setSelectedNode(node);
    setLayerChildIds(childIds || []);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') setIsSpaceDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Simulate training process
  useEffect(() => {
    if (isTraining) {
      // Clear any existing interval first to be safe
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        const activeDataset = datasetsRef.current.find(d => d.id === trainingDatasetIdRef.current)
          || datasetsRef.current[0];

        const nextFrame = currentFrameRef.current + 1;

        if (nextFrame >= activeDataset.rows.length) {
          // End of epoch — use ref values to avoid StrictMode double-invocation
          const nextEpoch = trainingEpochRef.current + 1;
          const newError = Math.max(0.01, 1.0 * Math.exp(-0.05 * nextEpoch) + (Math.random() * 0.05));
          // Random walk on the error surface (drift ±0.3 per epoch, clamped to [-3, 3])
          const newX1 = Math.max(-3, Math.min(3, x1Ref.current + (Math.random() - 0.5) * 0.6));
          const newX2 = Math.max(-3, Math.min(3, x2Ref.current + (Math.random() - 0.5) * 0.6));
          x1Ref.current = newX1;
          x2Ref.current = newX2;
          const surfaceZ = newX1 ** 2 + newX2 ** 2 + newX1 * newX2 + newX1 + newX2 + 5;
          currentFrameRef.current = 0;
          trainingEpochRef.current = nextEpoch;
          setCurrentFrame(0);
          setTrainingEpoch(nextEpoch);
          setTrainingData(prev => [...prev, { epoch: nextEpoch, error: Number(newError.toFixed(4)), x1: newX1, x2: newX2, z: surfaceZ }].slice(-50));
        } else {
          currentFrameRef.current = nextFrame;
          setCurrentFrame(nextFrame);
        }
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTraining]);

  const handleStartStopTraining = () => {
    setIsTraining(!isTraining);
  };

  const handleResetTraining = () => {
    setIsTraining(false);
    currentFrameRef.current = 0;
    trainingEpochRef.current = 0;
    x1Ref.current = (Math.random() * 6) - 3;
    x2Ref.current = (Math.random() * 6) - 3;
    setTrainingEpoch(0);
    setCurrentFrame(0);
    setTrainingData([]);
  };

  const onUpdateNeuron = (id: string, updates: NeuronPartialUpdate) => {
    // Determine target nodes for bulk update
    const isSelected = selectedNodeIds.includes(id);
    const targetIds = isSelected && selectedNodeIds.length > 0 ? selectedNodeIds : [id];

    // Check for auto-increment pattern in label
    let baseLabel = '';
    let startNumber = 1;
    let hasNumberSuffix = false;

    if (updates.label !== undefined) {
      const match = updates.label.match(/^(.*?)(\d+)$/);
      if (match) {
        baseLabel = match[1];
        startNumber = parseInt(match[2], 10);
        hasNumberSuffix = true;
      }
    }

    let changed = false;

    targetIds.forEach((targetId, index) => {
      const neuron = neuronsRef.current.get(targetId);
      if (neuron) {
        if (updates.label !== undefined) {
          if (hasNumberSuffix) {
            neuron.label = `${baseLabel}${startNumber + index}`;
          } else {
            neuron.label = updates.label;
          }
        }
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

        changed = true;

        // Update the panel for the specifically interacted node
        if (targetId === id) {
          setSelectedNode({ ...neuron } as INeuron);
        }
      }
    });

    if (changed) {
      setTick(t => t + 1); // trigger canvas re-render to show updated labels
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

    // Now evaluate M-P, Output, and Pixel-Matrix neurons in sorted order
    sorted.forEach(n => {
      if (n.type === 'mcculloch-pitts' || n.type === 'output' || n.type === 'pixel-matrix') {
        const incomingEdges = edges.filter(e => e.postSynaptic.id === n.id);
        n.calculateOutput(incomingEdges);
      }
    });

    setTick(t => t + 1);
  };

  const isExecutionMode = workspace === 'execution';
  const isTrainingMode = workspace === 'training';
  const isDatabaseMode = workspace === 'data';
  const isArchitectureMode = workspace === 'architecture';

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 overflow-hidden relative">
      {/* Workspace Switcher Header (Premiere Style) */}
      <div className="h-10 bg-[#1e1e1e] border-b border-slate-800 flex items-center justify-center shrink-0 z-50">
        <div className="flex space-x-1 p-1 bg-[#121212] rounded-md">
          {(['data', 'architecture', 'training', 'execution'] as const).map((ws) => (
            <button
              key={ws}
              onClick={() => setWorkspace(ws)}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors duration-200 capitalize ${workspace === ws
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {ws}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full h-full relative flex-1">
        {/* Render Workspace Content conditionally but keep Network Canvas mounted to prevent state loss */}
        {isDatabaseMode && (
          <div className="absolute inset-0 z-40 bg-slate-900">
            <DatabaseWorkspace datasets={datasets} setDatasets={setDatasets} />
          </div>
        )}

        <div className="w-full h-full relative flex flex-col" style={{ display: isDatabaseMode ? 'none' : 'flex' }}>
          {/* Top action bar (Execution) - Only in Architecture/Execution mode */}
          {(isArchitectureMode || isExecutionMode) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
              <button
                onClick={executeNetwork}
                className="px-6 py-2 font-bold rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 hover:shadow-emerald-500/25"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z" /></svg>
                Executar
              </button>
            </div>
          )}

          {/* Top action bar (Training Controls) - Only in Training mode */}
          {isTrainingMode && !trainingExpanded && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-2 py-1.5 rounded-full border border-slate-700 shadow-xl">
              <button
                onClick={handleStartStopTraining}
                className={`px-6 py-1.5 font-bold rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${isTraining
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white hover:shadow-red-500/25'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white hover:shadow-purple-500/25'
                  }`}
              >
                {isTraining ? (
                  <>
                    <Square className="w-4 h-4 fill-current" /> Parar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> {trainingEpoch === 0 ? 'Treinar' : 'Continuar'}
                  </>
                )}
              </button>

              <div className="w-px h-6 bg-slate-600 mx-1"></div>

              <button
                onClick={handleResetTraining}
                disabled={isTraining || trainingEpoch === 0}
                className="px-4 py-1.5 rounded-full text-slate-400 font-semibold hover:text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center gap-2"
                title="Zerar Treinamento"
              >
                <RefreshCcw className="w-4 h-4" />
                Zerar
              </button>
            </div>
          )}
          {/* Bottom Toolbar - Only visible in Architecture mode */}
          {isArchitectureMode && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setToolMode('pan')}
                className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'pan' || isSpaceDown
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                  }`}
                title="Mover Tela (Hand)"
              >
                <Hand className="w-5 h-5" />
              </button>

              <button
                onClick={() => setToolMode('select')}
                className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'select' && !isSpaceDown
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                  }`}
                title="Selecionar Nós"
              >
                <MousePointer2 className="w-5 h-5" />
              </button>

              {selectedNodeIds.length > 1 && (
                <>
                  <div className="w-px h-6 bg-slate-700 mx-1"></div>

                  <button
                    onClick={() => canvasRef.current?.alignNodes('vertical-center', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Centralizar Verticalmente"
                  >
                    <AlignCenterVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('horizontal-center', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Centralizar Horizontalmente"
                  >
                    <AlignCenterHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('distribute-horizontal', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Distribuir Horizontalmente"
                  >
                    <AlignHorizontalSpaceAround className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('distribute-vertical', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Distribuir Verticalmente"
                  >
                    <AlignVerticalSpaceAround className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="w-px h-8 bg-slate-700 mx-2"></div>

              <button
                onClick={() => setShowRawConnections(!showRawConnections)}
                className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${showRawConnections
                  ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                title="Mostrar Conexões Brutas (Layers)"
              >
                <Network className="w-5 h-5" />
              </button>

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
          )}

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden relative">
            <div className="flex flex-col flex-1 h-full w-full relative">
              {/* View toolbar — visible in training and execution workspaces */}
              {(workspace === 'training' || workspace === 'execution') && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
                  <button
                    onClick={() => setShowRawConnections(!showRawConnections)}
                    className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${showRawConnections
                      ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                      }`}
                    title="Mostrar Conexões Brutas (Layers)"
                  >
                    <Network className="w-5 h-5" />
                  </button>
                </div>
              )}
              <NetworkCanvas
                ref={canvasRef}
                showRawConnections={showRawConnections}
                showMatrixHandles={showMatrixHandles}
                toolMode={toolMode}
                onSetToolMode={setToolMode}
                onSelectNode={onSelectNode}
                onSelectEdge={setSelectedEdge}
                onSelectedNodesChange={setSelectedNodeIds}
                onHistoryChange={onHistoryChange}
                neuronsRef={neuronsRef}
                synapsesRef={synapsesRef}
                tick={tick}
                workspace={workspace}
              />
            </div>
            {/* Side Panels - Only visible in Architecture mode */}
            {isArchitectureMode && (
              <div className="flex flex-col flex-shrink-0 h-full overflow-hidden">
                {historyState && (
                  <HistoryPanel
                    commands={historyState.commands}
                    pointer={historyState.pointer}
                    onGoTo={historyState.goTo}
                    onUndo={historyState.undo}
                    onRedo={historyState.redo}
                    canUndo={historyState.canUndo}
                    canRedo={historyState.canRedo}
                  />
                )}
                <PropertiesPanel
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  onUpdateNeuron={onUpdateNeuron}
                  onUpdateSynapse={onUpdateSynapse}
                  onSelectNodeById={(id) => canvasRef.current?.selectNode(id)}
                  layerChildIds={layerChildIds}
                  neuronsRef={neuronsRef}
                  synapses={Array.from(synapsesRef.current.values())}
                />
              </div>
            )}

            {/* Training Dashboard - Only visible in Training mode */}
            {isTrainingMode && (
              <div className="flex flex-col flex-shrink-0 h-full overflow-hidden shadow-2xl z-20">
                <TrainingWorkspace
                  epoch={trainingEpoch}
                  data={trainingData}
                  expanded={trainingExpanded}
                  onExpandChange={setTrainingExpanded}
                />
              </div>
            )}
          </div>

          {/* Bottom Timeline Panel - Full width, only in Training mode */}
          {isTrainingMode && (
            <TrainingTimeline
              datasets={datasets}
              trainingDatasetId={trainingDatasetId}
              onTrainingDatasetChange={(id) => {
                setTrainingDatasetId(id);
                setCurrentFrame(0);
              }}
              currentFrame={currentFrame}
              onFrameSelect={(frame) => { currentFrameRef.current = frame; setCurrentFrame(frame); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
