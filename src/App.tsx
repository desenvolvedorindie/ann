import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Network, Unplug, RefreshCcw, Hand, MousePointer2, AlignCenterVertical, AlignCenterHorizontal, AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Check, BrainCircuit, Info, X } from 'lucide-react';
import { NetworkCanvas, type NetworkCanvasRef, type HistoryState } from './components/NetworkCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { DatabaseWorkspace } from './components/DatabaseWorkspace';
import { TrainingWorkspace } from './components/TrainingWorkspace';
import { TrainingTimeline } from './components/TrainingTimeline';
import { RandomizePanel } from './components/RandomizePanel';
import type { INeuron, ISynapse } from './models/neural';
import { usePanelContext } from './contexts/PanelContext';
import './index.css';

import { useTrainingEngine } from './hooks/useTrainingEngine';
import { useNetworkUpdater } from './hooks/useNetworkUpdater';
import { useNetworkExecutor } from './hooks/useNetworkExecutor';
import { useNetworkRandomizer } from './hooks/useNetworkRandomizer';

function App() {
  const [selectedNode, setSelectedNode] = useState<INeuron | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ISynapse | null>(null);

  // Domain object master copies
  const neuronsRef = useRef<Map<string, INeuron>>(new Map());
  const synapsesRef = useRef<Map<string, ISynapse>>(new Map());

  const [tick, setTick] = useState(0);
  const [showMatrixHandles, setShowMatrixHandles] = useState(false);
  const [toolMode, setToolMode] = useState<'pan' | 'select'>('pan');
  const [workspace, setWorkspace] = useState<'data' | 'build' | 'train' | 'execute'>('build');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [layerChildIds, setLayerChildIds] = useState<string[]>([]);
  const [parentLayerId, setParentLayerId] = useState<string | undefined>(undefined);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [historyState, setHistoryState] = useState<HistoryState | null>(null);
  const [showRawConnections, setShowRawConnections] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showWindowMenu, setShowWindowMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const { panels, togglePanel, resetPanels } = usePanelContext();

  const {
    datasets, setDatasets,
    isTraining, trainingExpanded, setTrainingExpanded,
    trainingDatasetId, setTrainingDatasetId,
    trainingEpoch, currentFrame, setCurrentFrame, currentFrameRef,
    trainingData,
    handleStartStopTraining, handleResetTraining
  } = useTrainingEngine();

  const { onUpdateNeuron, onUpdateSynapse } = useNetworkUpdater({
    neuronsRef, synapsesRef, selectedNodeIds, setTick, setSelectedNode, setSelectedEdge
  });

  const { executeNetwork } = useNetworkExecutor({
    neuronsRef, synapsesRef, setTick
  });

  const { handleRandomize } = useNetworkRandomizer({
    neuronsRef, synapsesRef, setTick
  });

  useEffect(() => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    document.title = `${capitalize(workspace)} - Artificial Neural Network`;
  }, [workspace]);

  const canvasRef = useRef<NetworkCanvasRef>(null);

  const onHistoryChange = useCallback((state: HistoryState) => {
    setHistoryState(state);
  }, []);

  const onSelectNode = useCallback((node: INeuron | null, childIds?: string[], parentId?: string) => {
    setSelectedNode(node);
    setLayerChildIds(childIds || []);
    setParentLayerId(parentId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const isExecuteMode = workspace === 'execute';
  const isTrainMode = workspace === 'train';
  const isDatabaseMode = workspace === 'data';
  const isBuildMode = workspace === 'build';

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 overflow-hidden relative">
      {/* Top Menu Bar */}
      <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-[60] px-4 relative">
        {/* Left side: Menus */}
        <div className="flex items-center space-x-2">
          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowEditMenu(!showEditMenu); setShowSelectionMenu(false); setShowWindowMenu(false); setShowHelpMenu(false); }}
              className="text-slate-300 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Edit
            </button>

            {showEditMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEditMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#2d2d2d] border border-[#454545] rounded shadow-xl z-50 py-1 overflow-hidden font-sans">
                  <button onClick={() => { historyState?.undo(); setShowEditMenu(false); }} disabled={!historyState?.canUndo} className="w-full text-left px-4 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#cccccc]">
                    Undo
                  </button>
                  <button onClick={() => { historyState?.redo(); setShowEditMenu(false); }} disabled={!historyState?.canRedo} className="w-full text-left px-4 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#cccccc]">
                    Redo
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Selection Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowSelectionMenu(!showSelectionMenu); setShowEditMenu(false); setShowWindowMenu(false); setShowHelpMenu(false); }}
              className="text-slate-300 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Selection
            </button>

            {showSelectionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSelectionMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#2d2d2d] border border-[#454545] rounded shadow-xl z-50 py-1 overflow-hidden font-sans">
                  <button onClick={() => { canvasRef.current?.selectAll(); setShowSelectionMenu(false); }} className="w-full text-left px-4 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    Select all
                  </button>
                  <button onClick={() => { canvasRef.current?.invertSelection(); setShowSelectionMenu(false); }} className="w-full text-left px-4 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    Invert
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Window Menu dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowWindowMenu(!showWindowMenu); setShowEditMenu(false); setShowSelectionMenu(false); setShowHelpMenu(false); }}
              className="text-slate-300 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Window
            </button>

            {showWindowMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWindowMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#2d2d2d] border border-[#454545] rounded shadow-xl z-50 py-1 overflow-hidden font-sans">
                  <button onClick={() => { togglePanel('history'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center group">
                    <span className={panels.history ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    History
                  </button>
                  <button onClick={() => { togglePanel('properties'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    <span className={panels.properties ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    Properties
                  </button>
                  <div className="h-px bg-[#454545] my-1 mx-2" />
                  <button onClick={() => { togglePanel('randomize'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    <span className={panels.randomize ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    Randomize
                  </button>
                  <div className="h-px bg-[#454545] my-1 mx-2" />
                  <button onClick={() => { togglePanel('timeline'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    <span className={panels.timeline ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    Timeline
                  </button>
                  <button onClick={() => { togglePanel('epoch'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    <span className={panels.epoch ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    Epoch Chart
                  </button>
                  <button onClick={() => { togglePanel('errorSurface'); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center">
                    <span className={panels.errorSurface ? "w-6 flex justify-center opacity-100" : "w-6 flex justify-center opacity-0"}>
                      <Check className="w-4 h-4 text-[#cccccc]" />
                    </span>
                    Error Surface
                  </button>
                  <div className="h-px bg-[#454545] my-1 mx-2" />
                  <button onClick={() => { resetPanels(); setShowWindowMenu(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex items-center pl-9">
                    Reset Workspaces
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Help Menu dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowHelpMenu(!showHelpMenu); setShowEditMenu(false); setShowSelectionMenu(false); setShowWindowMenu(false); }}
              className="text-slate-300 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Help
            </button>

            {showHelpMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHelpMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#2d2d2d] border border-[#454545] rounded shadow-xl z-50 py-1 overflow-hidden font-sans">
                  <button
                    onClick={() => { setShowAboutModal(true); setShowHelpMenu(false); }}
                    className="w-full text-left px-4 py-1.5 text-sm text-[#cccccc] hover:bg-[#04395e] hover:text-white flex flex-row items-center gap-2"
                  >
                    <Info className="w-4 h-4" /> About
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 text-sm font-bold tracking-wide pointer-events-none">
          Artificial Neural Network
        </div>

        {/* Spacer for Right side to keep title centered if left grows */}
        <div className="w-[10px]"></div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
                <span>About</span>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-slate-300 text-sm space-y-4">
              <p className="text-base text-slate-200 font-semibold">Artificial Neural Network Editor</p>
              <p>
                A visual nodal editor for designing and training multilayer perceptrons and tensor operations inside the browser.
              </p>
              <p className="text-slate-400 text-xs">Version 1.0.0</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-10 bg-[#1e1e1e] border-b border-slate-800 flex items-center shrink-0 z-50 px-4">
        {/* Workspace Switcher */}
        <div className="flex space-x-1 p-1 bg-[#121212] rounded-md mx-auto">
          {(['data', 'build', 'train', 'execute'] as const).map((ws) => (
            <button
              key={ws}
              onClick={() => setWorkspace(ws)}
              className={`px-4 py-1 text-xs font-semibold rounded transition-colors duration-200 capitalize ${workspace === ws
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
          {/* Top action bar (Execution) - Only in Build/Execution mode */}
          {(isBuildMode || isExecuteMode) && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
              <button
                onClick={executeNetwork}
                className="px-6 py-2 font-bold rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 hover:shadow-emerald-500/25"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z" /></svg>
                Execute
              </button>
            </div>
          )}

          {/* Top action bar (Training Controls) - Only in Training mode */}
          {isTrainMode && !trainingExpanded && (
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
                    <Square className="w-4 h-4 fill-current" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> {trainingEpoch === 0 ? 'Train' : 'Continue'}
                  </>
                )}
              </button>

              <div className="w-px h-6 bg-slate-600 mx-1"></div>

              <button
                onClick={handleResetTraining}
                disabled={isTraining || trainingEpoch === 0}
                className="px-4 py-1.5 rounded-full text-slate-400 font-semibold hover:text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center gap-2"
                title="Reset Training"
              >
                <RefreshCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
          {/* Bottom Toolbar - Only visible in Build mode */}
          {isBuildMode && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setToolMode('pan')}
                className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'pan' || isSpaceDown
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                  }`}
                title="Move Canvas (Hand)"
              >
                <Hand className="w-5 h-5" />
              </button>

              <button
                onClick={() => setToolMode('select')}
                className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${toolMode === 'select' && !isSpaceDown
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                  }`}
                title="Select Nodes"
              >
                <MousePointer2 className="w-5 h-5" />
              </button>

              {selectedNodeIds.length > 1 && (
                <>
                  <div className="w-px h-6 bg-slate-700 mx-1"></div>

                  <button
                    onClick={() => canvasRef.current?.alignNodes('vertical-center', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Center Vertically"
                  >
                    <AlignCenterVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('horizontal-center', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Center Horizontally"
                  >
                    <AlignCenterHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('distribute-horizontal', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Distribute Horizontally"
                  >
                    <AlignHorizontalSpaceAround className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => canvasRef.current?.alignNodes('distribute-vertical', selectedNodeIds)}
                    className="p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-all"
                    title="Distribute Vertically"
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
                title="Show Raw Connections (Layers)"
              >
                <Network className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowMatrixHandles(!showMatrixHandles)}
                className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${showMatrixHandles
                  ? "bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                title="Enable Pixel Routing"
              >
                <Unplug className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden relative">
            {/* Training Dashboard - Only visible in Training mode, mapped left */}
            {isTrainMode && (panels.epoch || panels.errorSurface) && (
              <div className="flex flex-col flex-shrink-0 h-full overflow-hidden shadow-2xl z-20 border-r border-slate-700">
                <TrainingWorkspace
                  epoch={trainingEpoch}
                  data={trainingData}
                  expanded={trainingExpanded}
                  onExpandChange={setTrainingExpanded}
                  showEpoch={panels.epoch}
                  showErrorSurface={panels.errorSurface}
                />
              </div>
            )}

            <div className="flex flex-col flex-1 h-full w-full relative">
              {/* View toolbar — visible in training and execution workspaces */}
              {(workspace === 'train' || workspace === 'execute') && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
                  <button
                    onClick={() => setShowRawConnections(!showRawConnections)}
                    className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${showRawConnections
                      ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                      }`}
                    title="Show Raw Connections (Layers)"
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
                selectedEdgeId={selectedEdge?.id || null}
              />
            </div>
            {/* Side Panels - Shared between Build and Train modes where applicable */}
            <div className="flex flex-col flex-shrink-0 h-full max-h-screen overflow-hidden w-[280px] bg-slate-800 border-l border-slate-700 shadow-xl z-20">
              {isBuildMode && panels.history && historyState && (
                <div className="w-full shrink-0 flex flex-col max-h-[35%] overflow-hidden">
                  <HistoryPanel
                    commands={historyState.commands}
                    pointer={historyState.pointer}
                    onGoTo={historyState.goTo}
                    onUndo={historyState.undo}
                    onRedo={historyState.redo}
                    canUndo={historyState.canUndo}
                    canRedo={historyState.canRedo}
                  />
                </div>
              )}

              {panels.randomize && (isBuildMode || isTrainMode) && (
                <div className="w-full shrink-0 flex flex-col border-t border-slate-700">
                  <RandomizePanel onRandomize={handleRandomize} />
                </div>
              )}

              {isBuildMode && panels.properties && (
                <div className="w-full flex-grow bg-slate-800 shadow-inner relative min-h-0">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                    <PropertiesPanel
                      selectedNode={selectedNode}
                      selectedEdge={selectedEdge}
                      onUpdateNeuron={onUpdateNeuron}
                      onUpdateSynapse={onUpdateSynapse}
                      onSelectNodeById={(id) => canvasRef.current?.selectNode(id)}
                      onSelectEdgeById={(id) => canvasRef.current?.selectEdge(id)}
                      layerChildIds={layerChildIds}
                      parentLayerId={parentLayerId}
                      neuronsRef={neuronsRef}
                      synapses={Array.from(synapsesRef.current.values())}
                    />
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Bottom Timeline Panel - Full width, only in Training mode */}
          {isTrainMode && panels.timeline && (
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
