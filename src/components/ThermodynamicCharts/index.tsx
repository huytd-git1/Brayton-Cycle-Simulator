import React from 'react';
import { TsDiagram } from './TsDiagram';
import { PvDiagram } from './PvDiagram';
import { ExperimentSweepChart } from './ExperimentSweepChart';
import { useSimulationStore } from '../../store/simulationStore';
import { LineChart, CheckSquare, Square, Eye } from 'lucide-react';

export const ThermodynamicCharts: React.FC = () => {
  const {
    mode,
    showIdealReference,
    toggleIdealReference,
    showStateLabels,
    toggleStateLabels,
  } = useSimulationStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Biểu đồ Nhiệt động lực học Đồng bộ (Synchronized Diagrams)
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {mode !== 'IDEAL' && (
            <button
              onClick={toggleIdealReference}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
            >
              {showIdealReference ? (
                <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <Square className="h-3.5 w-3.5 text-slate-500" />
              )}
              <span>Hiện đường tham chiếu lý tưởng (Ideal Reference)</span>
            </button>
          )}

          <button
            onClick={toggleStateLabels}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
          >
            {showStateLabels ? (
              <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>Hiển thị nhãn điểm trạng thái (1, 2, 3, 4)</span>
          </button>
        </div>
      </div>

      {/* Main Two Diagrams (T-s and P-v) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TsDiagram />
        <PvDiagram />
      </div>
    </div>
  );
};

