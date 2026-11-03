import React from 'react';
import { Header } from './components/Header';
import { EngineVisualization } from './components/EngineVisualization';
import { ParameterControls } from './components/ParameterControls';
import { ThermodynamicCharts } from './components/ThermodynamicCharts';
import { StateTable } from './components/StateTable';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { ExperimentSweepChart } from './components/ThermodynamicCharts/ExperimentSweepChart';
import { EquationPanel } from './components/EquationPanel';
import { useSimulationStore } from './store/simulationStore';

export const App: React.FC = () => {
  const { isDarkMode } = useSimulationStore();

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* 1. TOP HEADER */}
      <Header />

      {/* MAIN SINGLE-PAGE DASHBOARD CONTENT */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 md:p-5 space-y-5">
        {/* UPPER SECTION: Engine Visualization (65%) + Parameter Controls (35%) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-8 flex flex-col">
            <EngineVisualization />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <ParameterControls />
          </div>
        </section>

        {/* PERFORMANCE DASHBOARD CARDS */}
        <section>
          <PerformanceDashboard />
        </section>

        {/* MIDDLE SECTION: Synchronized T-s, P-v Diagrams and State Table */}
        <section className="space-y-4">
          <ThermodynamicCharts />
          <div className="w-full">
            <StateTable />
          </div>
        </section>

        {/* LOWER SECTION: Parametric Sweep Experiment + Equation/Pedagogy Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <ExperimentSweepChart />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <EquationPanel />
          </div>
        </section>

        {/* ENGINEERING FOOTER */}
        <footer className="border-t border-slate-800/80 pt-4 pb-6 mt-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400">
            Brayton Cycle Simulator – Phòng thí nghiệm Động cơ Tuabin khí & Động cơ Phản lực
          </p>
          <p>
            Phát triển phục vụ giảng dạy môn Nhiệt động lực học Kỹ thuật (Engineering Thermodynamics), Tuabin khí (Gas Turbines) và Lực đẩy Hàng không (Aerospace Propulsion).
          </p>
          <p className="text-[11px] text-slate-600">
            Tất cả các đại lượng nhiệt động lực học và thông số luồng khí được tính toán theo thời gian thực trên trình duyệt người dùng.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
