import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useSimulationStore } from '../../store/simulationStore';
import { buildIdealPaths, buildRealPaths, CurvePoint2D } from '../../physics/thermodynamicPaths';
import { Download } from 'lucide-react';

export const PvDiagram: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    mode,
    idealResult,
    realResult,
    inputs,
    showIdealReference,
    showStateLabels,
    isDarkMode,
    selectedStateId,
    setSelectedStateId,
  } = useSimulationStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const isIdeal = mode === 'IDEAL';
    const states = isIdeal ? idealResult.states : realResult.states;
    const refStates = realResult.referenceStates;

    const paths = isIdeal
      ? buildIdealPaths(states, inputs.cp, inputs.gamma)
      : buildRealPaths(states, refStates, inputs.cp, inputs.gamma);

    const { pvPath, idealPvPath } = paths;

    const plotData: any[] = [];

    // 1. Ideal Reference Path (if Real mode and enabled)
    if (!isIdeal && showIdealReference && idealPvPath) {
      plotData.push({
        x: idealPvPath.map((p: CurvePoint2D) => p.x),
        y: idealPvPath.map((p: CurvePoint2D) => p.y),
        type: 'scatter',
        mode: 'lines',
        line: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          width: 2,
          dash: 'dash',
        },
        hoverinfo: 'text',
        hovertext: idealPvPath.map(
          (p: CurvePoint2D) => `Chu trình lý tưởng: v = ${p.x.toFixed(4)} m³/kg, P = ${p.y.toFixed(1)} kPa`
        ),
        name: 'Chu trình Lý tưởng (Reference)',
      });
    }

    // 2. Main Active Cycle Path
    plotData.push({
      x: pvPath.map((p: CurvePoint2D) => p.x),
      y: pvPath.map((p: CurvePoint2D) => p.y),
      type: 'scatter',
      mode: 'lines',
      fill: 'toself',
      fillcolor: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.15)',
      line: {
        color: '#38bdf8',
        width: 3.5,
      },
      hoverinfo: 'skip',
      name: isIdeal ? 'Chu trình Brayton Lý tưởng' : 'Chu trình Brayton Thực tế',
    });

    // 3. State Points Markers
    const activeStates = isIdeal
      ? states
      : [
          states[0],
          refStates.state2s,
          states[1],
          states[2],
          refStates.state4s,
          states[3],
        ];

    const stateX = activeStates.map((s) => s.v);
    const stateY = activeStates.map((s) => s.P);
    const stateLabels = activeStates.map((s) => s.id);
    const stateColors = activeStates.map((s) =>
      s.isReference
        ? '#94a3b8'
        : s.id === '1'
        ? '#38bdf8'
        : s.id === '2'
        ? '#06b6d4'
        : s.id === '3'
        ? '#f97316'
        : '#eab308'
    );

    plotData.push({
      x: stateX,
      y: stateY,
      type: 'scatter',
      mode: showStateLabels ? 'markers+text' : 'markers',
      text: stateLabels,
      textposition: 'top center',
      textfont: {
        family: 'JetBrains Mono, monospace',
        size: 13,
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      },
      marker: {
        size: activeStates.map((s) => (s.id === selectedStateId ? 14 : 10)),
        color: stateColors,
        line: {
          color: isDarkMode ? '#ffffff' : '#0f172a',
          width: 2,
        },
      },
      hoverinfo: 'text',
      hovertext: activeStates.map(
        (s) =>
          `<b>${s.name}</b><br>v: ${s.v.toFixed(4)} m³/kg<br>P: ${s.P.toFixed(1)} kPa<br>T: ${s.T.toFixed(
            1
          )} K`
      ),
      name: 'Điểm trạng thái',
    });

    const layout: any = {
      title: {
        text: '<b>Đồ thị Áp suất – Thể tích riêng (P – v)</b>',
        font: {
          family: 'Inter, sans-serif',
          size: 14,
          color: isDarkMode ? '#f1f5f9' : '#0f172a',
        },
        x: 0.05,
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 55, r: 25, t: 40, b: 45 },
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
          text: 'Thể tích riêng, v [m³/kg]',
          font: {
            size: 11,
            color: isDarkMode ? '#94a3b8' : '#475569',
          },
        },
        gridcolor: isDarkMode ? '#1e293b' : '#e2e8f0',
        zerolinecolor: isDarkMode ? '#334155' : '#cbd5e1',
        tickfont: {
          color: isDarkMode ? '#94a3b8' : '#475569',
          size: 10,
        },
      },
      yaxis: {
        title: {
          text: 'Áp suất, P [kPa]',
          font: {
            size: 11,
            color: isDarkMode ? '#94a3b8' : '#475569',
          },
        },
        gridcolor: isDarkMode ? '#1e293b' : '#e2e8f0',
        zerolinecolor: isDarkMode ? '#334155' : '#cbd5e1',
        tickfont: {
          color: isDarkMode ? '#94a3b8' : '#475569',
          size: 10,
        },
      },
      hoverlabel: {
        bgcolor: isDarkMode ? '#0f172a' : '#ffffff',
        bordercolor: '#38bdf8',
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
        filename: `brayton-pv-diagram-${Date.now()}`,
        height: 600,
        width: 800,
        scale: 2,
      },
    };

    Plotly.react(containerRef.current, plotData, layout, config);

    (containerRef.current as any).on('plotly_click', (data: any) => {
      if (data && data.points && data.points.length > 0) {
        const pt = data.points[0];
        if (pt.text) {
          setSelectedStateId(pt.text);
        }
      }
    });
  }, [
    mode,
    idealResult,
    realResult,
    inputs,
    showIdealReference,
    showStateLabels,
    isDarkMode,
    selectedStateId,
    setSelectedStateId,
  ]);

  const handleExportSvg = () => {
    if (containerRef.current) {
      Plotly.downloadImage(containerRef.current, {
        format: 'svg',
        filename: `brayton-pv-diagram-${Date.now()}`,
        height: 600,
        width: 800,
      });
    }
  };

  return (
    <div className="relative bg-slate-900/90 rounded-2xl border border-slate-800 p-3 shadow-xl flex flex-col h-full min-h-[360px]">
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={handleExportSvg}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs flex items-center gap-1"
          title="Tải ảnh vector SVG của đồ thị P-v"
        >
          <Download className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px]">SVG</span>
        </button>
      </div>
      <div ref={containerRef} className="w-full flex-1 min-h-[300px]" />
    </div>
  );
};
