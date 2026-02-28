import { useState, useRef, useEffect } from 'react';
import type { Dataset } from '../models/dataset';
import { defaultLogicGates } from '../models/dataset';
import type { TrainingDataPoint } from '../components/TrainingWorkspace';

export function useTrainingEngine() {
    const [datasets, setDatasets] = useState<Dataset[]>(defaultLogicGates);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingExpanded, setTrainingExpanded] = useState(false);
    const [trainingDatasetId, setTrainingDatasetId] = useState<string>(defaultLogicGates[0].id);
    const [trainingEpoch, setTrainingEpoch] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [trainingData, setTrainingData] = useState<TrainingDataPoint[]>([]);

    const currentFrameRef = useRef(0);
    const trainingEpochRef = useRef(0);
    const x1Ref = useRef((Math.random() * 6) - 3);
    const x2Ref = useRef((Math.random() * 6) - 3);
    const datasetsRef = useRef<Dataset[]>(defaultLogicGates);
    const trainingDatasetIdRef = useRef<string>(defaultLogicGates[0].id);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { datasetsRef.current = datasets; }, [datasets]);
    useEffect(() => { trainingDatasetIdRef.current = trainingDatasetId; }, [trainingDatasetId]);

    useEffect(() => {
        if (isTraining) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                const activeDataset = datasetsRef.current.find(d => d.id === trainingDatasetIdRef.current) || datasetsRef.current[0];
                const nextFrame = currentFrameRef.current + 1;
                if (nextFrame >= activeDataset.rows.length) {
                    const nextEpoch = trainingEpochRef.current + 1;
                    const newError = Math.max(0.01, 1.0 * Math.exp(-0.05 * nextEpoch) + (Math.random() * 0.05));
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

    const handleStartStopTraining = () => setIsTraining(!isTraining);

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

    return {
        datasets, setDatasets,
        isTraining, trainingExpanded, setTrainingExpanded,
        trainingDatasetId, setTrainingDatasetId,
        trainingEpoch, currentFrame, setCurrentFrame, currentFrameRef,
        trainingData,
        handleStartStopTraining, handleResetTraining
    };
}
