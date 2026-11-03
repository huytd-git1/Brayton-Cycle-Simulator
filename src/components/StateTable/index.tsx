import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { convertTemp, formatTemp } from '../../utils/units';
import { Table, Download, Info, CheckCircle2 } from 'lucide-react';
import { ThermoState } from '../../types/thermo';

export const StateTable: React.FC = () => {
  const {
    mode,
    idealResult,
    realResult,
    turbojetResult,
    tempUnit,
    selectedStateId,
    setSelectedStateId,
    exportStateTableCsv,
  } = useSimulationStore();

  let states: ThermoState[] = [];
  if (mode === 'IDEAL') {
    states = idealResult.states;
  } else if (mode === 'REAL') {
    states = [
      realResult.states[0],
      realResult.referenceStates.state2s,
      realResult.states[1],
      realResult.states[2],
      realResult.referenceStates.state4s,
      realResult.states[3],
    ];
  } else {
    states = turbojetResult.stations;
  }

  const handleExportCsv = () => {
    const csv = exportStateTableCsv();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brayton-state-table-${mode.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-cyan-400" />
          <h2 className="font-semibold text-sm md:text-base text-white">
            Bảng Thông số Trạng thái Nhiệt động (Thermodynamic State Table)
          </h2>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
          title="Tải bảng thông số dưới dạng tệp CSV"
        >
          <Download className="h-3.5 w-3.5 text-cyan-400" />
          <span>Xuất CSV</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1 rounded-xl border border-slate-800/80 bg-slate-950/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Điểm</th>
              <th className="py-2.5 px-3">Mô tả Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Áp suất P (kPa)</th>
              <th className="py-2.5 px-3 text-right">
                Nhiệt độ T ({tempUnit === 'C' ? '°C' : 'K'})
              </th>
              <th className="py-2.5 px-3 text-right">Thể tích v (m³/kg)</th>
              <th className="py-2.5 px-3 text-right">Entropy s (kJ/kg·K)</th>
              <th className="py-2.5 px-3 text-right">Entanpi h (kJ/kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {states.map((s) => {
              const isSelected = selectedStateId === s.id;
              const isRef = s.isReference;
              const displayTemp = convertTemp(s.T, tempUnit).toFixed(1);

              return (
                <tr
                  key={s.id}
                  onClick={() => setSelectedStateId(s.id)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? 'bg-cyan-950/70 border-l-4 border-l-cyan-400'
                      : isRef
                      ? 'bg-slate-950/70 text-slate-400 italic hover:bg-slate-800/50'
                      : 'hover:bg-slate-900/60 text-slate-200'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-cyan-400">
                    <span className="flex items-center gap-1.5">
                      {s.id}
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-300">
                    {s.name}
                    {isRef && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 not-italic">
                        Tham chiếu đẳng biến
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sky-300">{s.P.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right text-amber-300">{displayTemp}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">{s.v.toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-right text-purple-300">{s.s.toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-300">{s.h.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reference Convention Explanation */}
      <div className="mt-3 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Quy ước chuẩn mốc nhiệt động học:</span> Điểm
          vào máy nén được chọn làm mốc quy chiếu entropy <code className="text-cyan-300">s1 = 0</code> và entanpi tính theo nhiệt dung không đổi{' '}
          <code className="text-rose-300">h = cp × T</code>. Giá trị tuyệt đối của h và s phụ thuộc
          vào hệ quy chiếu được chọn, trong khi các đại lượng sai phân{' '}
          <code className="text-amber-300">Δh = w, q</code> và{' '}
          <code className="text-purple-300">Δs</code> mang bản chất vật lý bất biến.
        </div>
      </div>
    </div>
  );
};
