import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { Engine3DScene } from './Engine3DScene';
import { Engine2DSchematic } from './Engine2DSchematic';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const EngineVisualization: React.FC = () => {
  const {
    view2D,
    toggleView2D,
    isPlaying,
    togglePlay,
    animSpeed,
    setAnimSpeed,
    selectedProcess,
    setSelectedProcess,
  } = useSimulationStore();

  const handleNextStep = () => {
    const next = selectedProcess >= 4 ? 1 : selectedProcess + 1;
    setSelectedProcess(next);
  };

  const handlePrevStep = () => {
    const prev = selectedProcess <= 1 ? 4 : selectedProcess - 1;
    setSelectedProcess(prev);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl relative overflow-hidden">
      {/* Top Bar inside Engine Visualization */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <h2 className="font-semibold text-sm md:text-base text-white flex items-center gap-2">
            Mô hình Động cơ Tuabin khí & Phản lực
            <span className="text-xs font-normal text-slate-400 hidden sm:inline">
              (Gas Turbine Cutaway Visualization)
            </span>
          </h2>
        </div>

        {/* View mode & speed controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Step through processes */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={handlePrevStep}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
              title="Quá trình trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-cyan-300">
              {selectedProcess === 0 ? 'Toàn bộ' : `Giai đoạn ${selectedProcess}/4`}
            </span>
            <button
              onClick={handleNextStep}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
              title="Quá trình kế tiếp"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setAnimSpeed(spd)}
                className={`px-1.5 py-0.5 text-[11px] font-mono rounded transition ${
                  animSpeed === spd
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* 2D / 3D Toggle */}
          <button
            onClick={toggleView2D}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
              view2D
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>{view2D ? 'Xem 3D' : 'Xem 2D'}</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display (3D Scene or 2D Schematic) */}
      <div className="flex-1 w-full min-h-[400px]">
        {view2D ? <Engine2DSchematic /> : <Engine3DScene />}
      </div>
    </div>
  );
};

