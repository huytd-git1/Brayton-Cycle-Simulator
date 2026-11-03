import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useSimulationStore, SweepVariable } from '../../store/simulationStore';
import { Download, Sparkles, HelpCircle } from 'lucide-react';

export const ExperimentSweepChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    sweepVar,
    setSweepVar,
    sweepData,
    optimumRp,
    inputs,
    isDarkMode,
  } = useSimulationStore();

  useEffect(() => {
    if (!containerRef.current || sweepData.length === 0) return;

    const xVals = sweepData.map((d) => d.x);
    const etaVals = sweepData.map((d) => d.eta_th);
    const wnetVals = sweepData.map((d) => d.wnet);
    const wcVals = sweepData.map((d) => d.wc);
    const wtVals = sweepData.map((d) => d.wt);

    const sweepNames: Record<SweepVariable, string> = {
      rp: 'Tỉ số nén máy nén rp [—]',
      T3: 'Nhiệt độ vào tuabin T3 [K]',
      eta_c: 'Hiệu suất đẳng biến máy nén ηc [—]',
      eta_t: 'Hiệu suất đẳng biến tuabin ηt [—]',
      T1: 'Nhiệt độ vào máy nén T1 [K]',
    };

    const plotData: any[] = [
      {
        x: xVals,
        y: etaVals,
        name: 'Hiệu suất nhiệt ηth (%)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#06b6d4', width: 3 },
        yaxis: 'y1',
        hoverinfo: 'text',
        hovertext: sweepData.map(
          (d) => `Biến: ${d.x.toFixed(2)}<br>Hiệu suất ηth: ${d.eta_th.toFixed(2)}%`
        ),
      },
      {
        x: xVals,
        y: wnetVals,
        name: 'Công có ích w_net (kJ/kg)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f59e0b', width: 3.5 },
        yaxis: 'y2',
        hoverinfo: 'text',
        hovertext: sweepData.map(
          (d) => `Biến: ${d.x.toFixed(2)}<br>Công có ích w_net: ${d.wnet.toFixed(1)} kJ/kg`
        ),
      },
      {
        x: xVals,
        y: wtVals,
        name: 'Công tuabin wt (kJ/kg)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ef4444', width: 1.8, dash: 'dash' },
        yaxis: 'y2',
        hoverinfo: 'skip',
      },
      {
        x: xVals,
        y: wcVals,
        name: 'Công máy nén wc (kJ/kg)',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#38bdf8', width: 1.8, dash: 'dot' },
        yaxis: 'y2',
        hoverinfo: 'skip',
      },
    ];

    // Highlight optimum rp if sweeping rp
    const shapes: any[] = [];
    const annotations: any[] = [];

    if (sweepVar === 'rp' && optimumRp > 0) {
      shapes.push({
        type: 'line',
        x0: optimumRp,
        x1: optimumRp,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: '#fbbf24',
          width: 2,
          dash: 'dashdot',
        },
      });

      annotations.push({
        x: optimumRp,
        y: 0.95,
        yref: 'paper',
        text: `<b>rp,opt = ${optimumRp.toFixed(2)}</b><br>(w_net cực đại)`,
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#fbbf24',
        font: {
          family: 'JetBrains Mono, monospace',
          size: 11,
          color: '#fbbf24',
        },
        bgcolor: isDarkMode ? '#0f172a' : '#ffffff',
        bordercolor: '#fbbf24',
        borderwidth: 1,
      });
    }

    const layout: any = {
      title: {
        text: `<b>Thực nghiệm quét thông số: Ảnh hưởng của ${sweepNames[sweepVar]}</b>`,
        font: {
          family: 'Inter, sans-serif',
          size: 13,
          color: isDarkMode ? '#f1f5f9' : '#0f172a',
        },
        x: 0.05,
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 55, r: 60, t: 40, b: 45 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: -0.22,
        font: {
          family: 'Inter, sans-serif',
          size: 10,
          color: isDarkMode ? '#94a3b8' : '#475569',
        },
      },
      xaxis: {
        title: {
          text: sweepNames[sweepVar],
          font: { size: 11, color: isDarkMode ? '#94a3b8' : '#475569' },
        },
        gridcolor: isDarkMode ? '#1e293b' : '#e2e8f0',
        zerolinecolor: isDarkMode ? '#334155' : '#cbd5e1',
        tickfont: { color: isDarkMode ? '#94a3b8' : '#475569', size: 10 },
      },
      yaxis: {
        title: {
          text: 'Hiệu suất nhiệt, η_th [%]',
          font: { size: 11, color: '#06b6d4' },
        },
        tickfont: { color: '#06b6d4', size: 10 },
        gridcolor: isDarkMode ? '#1e293b' : '#e2e8f0',
      },
      yaxis2: {
        title: {
          text: 'Công khối lượng riêng, w [kJ/kg]',
          font: { size: 11, color: '#f59e0b' },
        },
        tickfont: { color: '#f59e0b', size: 10 },
        overlaying: 'y',
        side: 'right',
        gridcolor: 'transparent',
      },
      shapes,
      annotations,
      hoverlabel: {
        bgcolor: isDarkMode ? '#0f172a' : '#ffffff',
        bordercolor: '#06b6d4',
        font: { family: 'Inter, sans-serif', size: 11, color: isDarkMode ? '#ffffff' : '#000000' },
      },
      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `brayton-sweep-${sweepVar}-${Date.now()}`,
        height: 600,
        width: 800,
        scale: 2,
      },
    };

    Plotly.react(containerRef.current, plotData, layout, config);
  }, [sweepVar, sweepData, optimumRp, inputs, isDarkMode]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 shadow-xl flex flex-col h-full">
      {/* Sweep Variable Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Chế độ Thực nghiệm Quét biến (Parametric Sweep Experiment)
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 font-medium px-1">Biến quét:</span>
          {(
            [
              { id: 'rp', label: 'Tỉ số nén rp' },
              { id: 'T3', label: 'Nhiệt độ T3' },
              { id: 'eta_c', label: 'Hiệu suất ηc' },
              { id: 'eta_t', label: 'Hiệu suất ηt' },
              { id: 'T1', label: 'Nhiệt độ T1' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setSweepVar(item.id)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                sweepVar === item.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="w-full flex-1 min-h-[300px]" />

      {/* Educational Insight Note */}
      {sweepVar === 'rp' && (
        <div className="mt-2 p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Bài học nhiệt động lực học cốt lõi:</span>{' '}
            Hiệu suất nhiệt chu trình lý tưởng tăng đơn điệu theo tỉ số nén{' '}
            <code className="text-cyan-300 font-mono">η_th = 1 - 1/rp^((γ-1)/γ)</code>. Tuy nhiên,
            công khối lượng riêng có ích <code className="text-amber-300 font-mono">w_net</code>{' '}
            <strong>không tăng vô hạn</strong> mà đạt đỉnh cực đại tại{' '}
            <code className="text-amber-300 font-mono font-bold">
              rp,opt = (T3/T1)^(γ / [2(γ-1)]) = {optimumRp.toFixed(2)}
            </code>
            . Sau điểm này, công nén tăng nhanh hơn công dãn nở tuabin làm giảm công có ích!
          </div>
        </div>
      )}
    </div>
  );
};

