import { create } from 'zustand';
import {
  CycleInputs,
  SimulationMode,
  TemperatureUnit,
  ThermoState,
} from '../types/thermo';
import { IdealBraytonResult, solveIdealBrayton } from '../physics/braytonIdeal';
import { RealBraytonResult, solveRealBrayton } from '../physics/braytonReal';
import { solveTurbojet, TurbojetResult } from '../physics/propulsion';
import { convertTemp } from '../utils/units';

export interface SweepPoint {
  x: number;
  eta_th: number;
  wnet: number;
  wc: number;
  wt: number;
}

export type SweepVariable = 'rp' | 'T3' | 'eta_c' | 'eta_t' | 'T1';

export interface SimulationState {
  mode: SimulationMode;
  inputs: CycleInputs;
  tempUnit: TemperatureUnit;
  showIdealReference: boolean;
  showProcessArrows: boolean;
  showStateLabels: boolean;
  selectedProcess: number; // 0: None, 1: 1->2, 2: 2->3, 3: 3->4, 4: 4->1
  selectedStateId: string | null;
  isPlaying: boolean;
  animSpeed: number;
  animProgress: number; // 0 to 4
  isDarkMode: boolean;
  view2D: boolean; // 2D schematic fallback / toggle

  // Calculated Results
  idealResult: IdealBraytonResult;
  realResult: RealBraytonResult;
  turbojetResult: TurbojetResult;

  // Experiment sweep
  sweepVar: SweepVariable;
  sweepData: SweepPoint[];
  optimumRp: number;

  // Actions
  setMode: (mode: SimulationMode) => void;
  updateInput: <K extends keyof CycleInputs>(key: K, value: CycleInputs[K]) => void;
  updateInputs: (partial: Partial<CycleInputs>) => void;
  resetToDefaults: () => void;
  setTempUnit: (unit: TemperatureUnit) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setAnimSpeed: (speed: number) => void;
  setAnimProgress: (progress: number) => void;
  setSelectedProcess: (proc: number) => void;
  setSelectedStateId: (id: string | null) => void;
  toggleDarkMode: () => void;
  toggleView2D: () => void;
  toggleIdealReference: () => void;
  toggleProcessArrows: () => void;
  toggleStateLabels: () => void;
  setSweepVar: (v: SweepVariable) => void;
  recalculateSweep: () => void;
  exportConfigJson: () => string;
  importConfigJson: (jsonStr: string) => boolean;
  exportStateTableCsv: () => string;
  exportExperimentCsv: () => string;
}

export const defaultCycleInputs: CycleInputs = {
  // Basic parameters
  T1: 300,
  P1: 100,
  rp: 8,
  T3: 1400,
  gamma: 1.4,
  cp: 1.005,
  m_dot: 10,

  // Advanced parameters
  eta_c: 0.85,
  eta_t: 0.88,
  delta_p: 0.04,
  eta_m: 0.98,

  // Turbojet parameters
  M0: 0.8,
  T0: 216.65, // Standard flight altitude (~11,000m)
  P0: 22.63,
  eta_diffuser: 0.98,
  eta_b: 0.99,
  eta_n: 0.98,
  LHV: 43000,
};

function computeSweep(inputs: CycleInputs, sweepVar: SweepVariable, mode: SimulationMode): { data: SweepPoint[]; optimumRp: number } {
  const points: SweepPoint[] = [];
  const currentInputs = { ...inputs };
  let minVal = 1.5;
  let maxVal = 35;
  const steps = 40;

  if (sweepVar === 'rp') {
    minVal = 1.2;
    maxVal = 36;
  } else if (sweepVar === 'T3') {
    minVal = 800;
    maxVal = 2000;
  } else if (sweepVar === 'eta_c') {
    minVal = 0.55;
    maxVal = 1.0;
  } else if (sweepVar === 'eta_t') {
    minVal = 0.55;
    maxVal = 1.0;
  } else if (sweepVar === 'T1') {
    minVal = 220;
    maxVal = 350;
  }

  const dx = (maxVal - minVal) / steps;
  for (let i = 0; i <= steps; i++) {
    const val = minVal + i * dx;
    const testInputs = { ...currentInputs, [sweepVar]: val };

    if (mode === 'IDEAL') {
      const res = solveIdealBrayton(testInputs);
      points.push({
        x: val,
        eta_th: res.performance.eta_th * 100,
        wnet: Math.max(res.performance.wnet, 0),
        wc: res.performance.wc,
        wt: res.performance.wt,
      });
    } else {
      const res = solveRealBrayton(testInputs);
      points.push({
        x: val,
        eta_th: res.performance.eta_th * 100,
        wnet: res.performance.wnet,
        wc: res.performance.wc,
        wt: res.performance.wt,
      });
    }
  }

  const optExp = inputs.gamma / (2 * (inputs.gamma - 1));
  const optimumRp = Math.pow(inputs.T3 / inputs.T1, optExp);

  return { data: points, optimumRp };
}

export const useSimulationStore = create<SimulationState>((set, get) => {
  const initialIdeal = solveIdealBrayton(defaultCycleInputs);
  const initialReal = solveRealBrayton(defaultCycleInputs);
  const initialTurbojet = solveTurbojet(defaultCycleInputs);
  const initialSweep = computeSweep(defaultCycleInputs, 'rp', 'IDEAL');

  return {
    mode: 'IDEAL',
    inputs: { ...defaultCycleInputs },
    tempUnit: 'K',
    showIdealReference: true,
    showProcessArrows: true,
    showStateLabels: true,
    selectedProcess: 0,
    selectedStateId: null,
    isPlaying: true,
    animSpeed: 1.0,
    animProgress: 0,
    isDarkMode: true,
    view2D: false,

    idealResult: initialIdeal,
    realResult: initialReal,
    turbojetResult: initialTurbojet,

    sweepVar: 'rp',
    sweepData: initialSweep.data,
    optimumRp: initialSweep.optimumRp,

    setMode: (mode) => {
      set({ mode, selectedProcess: 0 });
      get().recalculateSweep();
    },

    updateInput: (key, value) => {
      const newInputs = { ...get().inputs, [key]: value };
      const idealResult = solveIdealBrayton(newInputs);
      const realResult = solveRealBrayton(newInputs);
      const turbojetResult = solveTurbojet(newInputs);
      const sweep = computeSweep(newInputs, get().sweepVar, get().mode);

      set({
        inputs: newInputs,
        idealResult,
        realResult,
        turbojetResult,
        sweepData: sweep.data,
        optimumRp: sweep.optimumRp,
      });
    },

    updateInputs: (partial) => {
      const newInputs = { ...get().inputs, ...partial };
      const idealResult = solveIdealBrayton(newInputs);
      const realResult = solveRealBrayton(newInputs);
      const turbojetResult = solveTurbojet(newInputs);
      const sweep = computeSweep(newInputs, get().sweepVar, get().mode);

      set({
        inputs: newInputs,
        idealResult,
        realResult,
        turbojetResult,
        sweepData: sweep.data,
        optimumRp: sweep.optimumRp,
      });
    },

    resetToDefaults: () => {
      const newInputs = { ...defaultCycleInputs };
      const idealResult = solveIdealBrayton(newInputs);
      const realResult = solveRealBrayton(newInputs);
      const turbojetResult = solveTurbojet(newInputs);
      const sweep = computeSweep(newInputs, 'rp', get().mode);

      set({
        inputs: newInputs,
        idealResult,
        realResult,
        turbojetResult,
        sweepVar: 'rp',
        sweepData: sweep.data,
        optimumRp: sweep.optimumRp,
        selectedProcess: 0,
        selectedStateId: null,
      });
    },

    setTempUnit: (tempUnit) => set({ tempUnit }),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

    setIsPlaying: (isPlaying) => set({ isPlaying }),

    setAnimSpeed: (animSpeed) => set({ animSpeed }),

    setAnimProgress: (animProgress) => set({ animProgress }),

    setSelectedProcess: (selectedProcess) => set({ selectedProcess }),

    setSelectedStateId: (selectedStateId) => set({ selectedStateId }),

    toggleDarkMode: () => {
      set((state) => {
        const nextDark = !state.isDarkMode;
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: nextDark };
      });
    },

    toggleView2D: () => set((state) => ({ view2D: !state.view2D })),

    toggleIdealReference: () => set((state) => ({ showIdealReference: !state.showIdealReference })),

    toggleProcessArrows: () => set((state) => ({ showProcessArrows: !state.showProcessArrows })),

    toggleStateLabels: () => set((state) => ({ showStateLabels: !state.showStateLabels })),

    setSweepVar: (sweepVar) => {
      set({ sweepVar });
      get().recalculateSweep();
    },

    recalculateSweep: () => {
      const sweep = computeSweep(get().inputs, get().sweepVar, get().mode);
      set({ sweepData: sweep.data, optimumRp: sweep.optimumRp });
    },

    exportConfigJson: () => {
      const data = {
        mode: get().mode,
        inputs: get().inputs,
        tempUnit: get().tempUnit,
        timestamp: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    },

    importConfigJson: (jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.inputs) {
          get().updateInputs(parsed.inputs);
        }
        if (parsed.mode) {
          get().setMode(parsed.mode);
        }
        if (parsed.tempUnit) {
          get().setTempUnit(parsed.tempUnit);
        }
        return true;
      } catch (e) {
        console.error('Failed to parse config JSON', e);
        return false;
      }
    },

    exportStateTableCsv: () => {
      const { mode, idealResult, realResult, turbojetResult, tempUnit } = get();
      const unitLabel = tempUnit === 'C' ? 'T (°C)' : 'T (K)';
      let csv = `State ID,Tên trạng thái,P (kPa),${unitLabel},v (m3/kg),s (kJ/kg.K),h (kJ/kg)\n`;

      let activeStates: ThermoState[] = [];
      if (mode === 'IDEAL') {
        activeStates = idealResult.states;
      } else if (mode === 'REAL') {
        activeStates = [
          realResult.states[0],
          realResult.referenceStates.state2s,
          realResult.states[1],
          realResult.states[2],
          realResult.referenceStates.state4s,
          realResult.states[3],
        ];
      } else {
        activeStates = turbojetResult.stations;
      }

      activeStates.forEach((s) => {
        const temp = convertTemp(s.T, tempUnit).toFixed(2);
        csv += `"${s.id}","${s.name}",${s.P.toFixed(2)},${temp},${s.v.toFixed(4)},${s.s.toFixed(4)},${s.h.toFixed(2)}\n`;
      });

      return csv;
    },

    exportExperimentCsv: () => {
      const { sweepVar, sweepData } = get();
      let csv = `Biến độc lập (${sweepVar}),Hiệu suất nhiệt eta_th (%),Công có ích w_net (kJ/kg),Công máy nén w_c (kJ/kg),Công tuabin w_t (kJ/kg)\n`;
      sweepData.forEach((pt) => {
        csv += `${pt.x.toFixed(3)},${pt.eta_th.toFixed(3)},${pt.wnet.toFixed(3)},${pt.wc.toFixed(3)},${pt.wt.toFixed(3)}\n`;
      });
      return csv;
    },
  };
});
