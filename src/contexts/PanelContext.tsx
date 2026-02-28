import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type PanelConfig = {
    history: boolean;
    properties: boolean;
    randomize: boolean;
    timeline: boolean;
    epoch: boolean;
    errorSurface: boolean;
};

const DEFAULT_PANELS: PanelConfig = {
    history: true,
    properties: true,
    randomize: true,
    timeline: true,
    epoch: true,
    errorSurface: true,
};

type PanelContextType = {
    panels: PanelConfig;
    togglePanel: (panel: keyof PanelConfig) => void;
    resetPanels: () => void;
};

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const PanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [panels, setPanels] = useState<PanelConfig>(() => {
        const stored = localStorage.getItem('ann_panel_config');
        if (stored) {
            try {
                return { ...DEFAULT_PANELS, ...JSON.parse(stored) };
            } catch (e) {
                console.error("Failed to parse panel config", e);
            }
        }
        return DEFAULT_PANELS;
    });

    useEffect(() => {
        localStorage.setItem('ann_panel_config', JSON.stringify(panels));
    }, [panels]);

    const togglePanel = (panel: keyof PanelConfig) => {
        setPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    const resetPanels = () => {
        setPanels(DEFAULT_PANELS);
    };

    return (
        <PanelContext.Provider value={{ panels, togglePanel, resetPanels }}>
            {children}
        </PanelContext.Provider>
    );
};

export const usePanelContext = () => {
    const context = useContext(PanelContext);
    if (!context) {
        throw new Error('usePanelContext must be used within a PanelProvider');
    }
    return context;
};
