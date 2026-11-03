import React, { useState } from 'react';
import {
  Sliders,
  Settings2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Plane,
  Gauge,
  Flame,
  Wind,
} from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';
import { calculateGasConstantR, convertTemp, formatTemp } from '../utils/units';

interface SliderInputProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  tooltip?: string;
  isTemp?: boolean;
}

const ParameterSlider: React.FC<SliderInputProps> = ({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  tooltip,
  isTemp,
}) => {
  const { tempUnit } = useSimulationStore();
  const displayVal = isTemp && tempUnit === 'C' ? convertTemp(value, 'C') : value;

  return (
    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
            {symbol}
          </span>
          <span className="text-xs font-medium text-slate-200">{label}</span>
          {tooltip && (
            <span className="group relative cursor-pointer text-slate-500 hover:text-slate-300">
              <Info className="h-3 w-3" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-950 text-slate-300 text-[11px] rounded shadow-xl border border-slate-800 z-50 pointer-events-none">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number(displayVal.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 1))}
            step={step}
            min={isTemp && tempUnit === 'C' ? convertTemp(min, 'C') : min}
            max={isTemp && tempUnit === 'C' ? convertTemp(max, 'C') : max}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) {
                if (isTemp && tempUnit === 'C') {
                  onChange(num + 273.15);
                } else {
                  onChange(num);
                }
              }
            }}
            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <span className="text-[11px] text-slate-400 font-mono w-10 text-left">
            {isTemp ? (tempUnit === 'C' ? '°C' : 'K') : unit}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

export const ParameterControls: React.FC = () => {
  const { mode, inputs, updateInput, idealResult, realResult, turbojetResult } =
    useSimulationStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTurbojetInputs, setShowTurbojetInputs] = useState(true);

  const R = calculateGasConstantR(inputs.cp, inputs.gamma);

  const currentValidation =
    mode === 'IDEAL'
      ? idealResult.validation
      : mode === 'REAL'
      ? realResult.validation
      : turbojetResult.validation;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-cyan-400" />
          <h2 className="font-semibold text-sm md:text-base text-white">
            Thông số Nhiệt động & Vận hành
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-950 border border-slate-800 rounded-md px-2 py-0.5 text-xs font-mono text-slate-300">
            <span className="text-slate-400 mr-1">R:</span>
            <span className="text-amber-400 font-semibold">{R.toFixed(4)}</span>
            <span className="text-[10px] text-slate-500 ml-0.5">kJ/kg·K</span>
          </div>
        </div>
      </div>

      {/* Validation banner */}
      {(!currentValidation.isValid || currentValidation.warnings.length > 0) && (
        <div className="mb-3 space-y-1.5">
          {currentValidation.errors.map((err, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-red-950/70 border border-red-800/80 rounded-lg p-2 text-xs text-red-200"
            >
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
          {currentValidation.warnings.map((warn, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-amber-950/60 border border-amber-800/70 rounded-lg p-2 text-xs text-amber-200"
            >
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable controls list */}
      <div className="overflow-y-auto space-y-3 pr-1 flex-1">
        {/* Basic Parameters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Thông số Cơ bản (Basic Inputs)</span>
            <span className="text-[10px] lowercase text-slate-500">Kéo thanh hoặc nhập số</span>
          </div>

          <ParameterSlider
            label="Nhiệt độ vào máy nén"
            symbol="T1"
            value={inputs.T1}
            min={200}
            max={500}
            step={1}
            unit="K"
            isTemp={true}
            onChange={(v) => updateInput('T1', v)}
            tooltip="Nhiệt độ không khí tại cửa vào của máy nén (Compressor inlet temperature)"
          />

          <ParameterSlider
            label="Áp suất vào máy nén"
            symbol="P1"
            value={inputs.P1}
            min={50}
            max={200}
            step={1}
            unit="kPa"
            onChange={(v) => updateInput('P1', v)}
            tooltip="Áp suất tĩnh cửa vào máy nén (Compressor inlet pressure)"
          />

          <ParameterSlider
            label="Tỉ số tăng áp máy nén"
            symbol="rp"
            value={inputs.rp}
            min={1.1}
            max={40}
            step={0.1}
            unit="—"
            onChange={(v) => updateInput('rp', v)}
            tooltip="Tỉ số nén áp suất rp = P2 / P1 (Compressor pressure ratio)"
          />

          <ParameterSlider
            label="Nhiệt độ vào tuabin"
            symbol="T3"
            value={inputs.T3}
            min={700}
            max={2000}
            step={5}
            unit="K"
            isTemp={true}
            onChange={(v) => updateInput('T3', v)}
            tooltip="Nhiệt độ khí cháy cực đại tại cửa vào tuabin (Turbine inlet temperature - TIT)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ParameterSlider
              label="Hệ số dãn nở"
              symbol="γ"
              value={inputs.gamma}
              min={1.2}
              max={1.67}
              step={0.01}
              unit="—"
              onChange={(v) => updateInput('gamma', v)}
              tooltip="Tỉ số nhiệt dung cp / cv (Specific heat ratio, gamma)"
            />

            <ParameterSlider
              label="Nhiệt dung đẳng áp"
              symbol="cp"
              value={inputs.cp}
              min={0.8}
              max={1.3}
              step={0.005}
              unit="kJ/kg·K"
              onChange={(v) => updateInput('cp', v)}
              tooltip="Nhiệt dung riêng ở áp suất không đổi của không khí (cp)"
            />
          </div>

          <ParameterSlider
            label="Lưu lượng khối lượng khí"
            symbol="ṁ"
            value={inputs.m_dot}
            min={0.1}
            max={100}
            step={0.5}
            unit="kg/s"
            onChange={(v) => updateInput('m_dot', v)}
            tooltip="Lưu lượng dòng không khí qua động cơ (Mass flow rate)"
          />
        </div>

        {/* Advanced Parameters (Collapsible or visible in REAL / TURBOJET) */}
        <div className="border-t border-slate-800 pt-2.5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition py-1"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-sky-400" />
              Thông số Nâng cao & Tổn thất thực tế
              <span className="text-[10px] text-slate-500 font-normal">
                {mode === 'IDEAL' ? '(Tự động bỏ qua ở chế độ Lý tưởng)' : '(Đang kích hoạt)'}
              </span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-2 mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/70">
              <ParameterSlider
                label="Hiệu suất đẳng biến máy nén"
                symbol="ηc"
                value={inputs.eta_c}
                min={0.5}
                max={1.0}
                step={0.01}
                unit="—"
                onChange={(v) => updateInput('eta_c', v)}
                tooltip="Hiệu suất đẳng biến máy nén (Compressor isentropic efficiency): T2 = T1 + (T2s - T1)/eta_c"
              />

              <ParameterSlider
                label="Hiệu suất đẳng biến tuabin"
                symbol="ηt"
                value={inputs.eta_t}
                min={0.5}
                max={1.0}
                step={0.01}
                unit="—"
                onChange={(v) => updateInput('eta_t', v)}
                tooltip="Hiệu suất đẳng biến tuabin (Turbine isentropic efficiency): T4 = T3 - eta_t*(T3 - T4s)"
              />

              <ParameterSlider
                label="Tổn thất áp suất buồng đốt"
                symbol="Δp/P2"
                value={inputs.delta_p}
                min={0}
                max={0.15}
                step={0.005}
                unit="—"
                onChange={(v) => updateInput('delta_p', v)}
                tooltip="Tỉ lệ sụt áp suất trong buồng đốt do ma sát & xoáy lốc: P3 = P2 * (1 - delta_p)"
              />

              <ParameterSlider
                label="Hiệu suất cơ khí truyền động"
                symbol="ηm"
                value={inputs.eta_m}
                min={0.8}
                max={1.0}
                step={0.005}
                unit="—"
                onChange={(v) => updateInput('eta_m', v)}
                tooltip="Hiệu suất truyền động cơ khí trục tuabin - máy nén (Mechanical efficiency)"
              />
            </div>
          )}
        </div>

        {/* Turbojet Specific Parameters (Visible when mode === TURBOJET) */}
        {mode === 'TURBOJET' && (
          <div className="border-t border-slate-800 pt-2.5">
            <button
              onClick={() => setShowTurbojetInputs(!showTurbojetInputs)}
              className="w-full flex items-center justify-between text-xs font-semibold text-amber-300 hover:text-amber-200 transition py-1"
            >
              <span className="flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-amber-400" />
                Thông số Bay & Động cơ Phản lực (Turbojet Propulsion)
              </span>
              {showTurbojetInputs ? (
                <ChevronUp className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-400" />
              )}
            </button>

            {showTurbojetInputs && (
              <div className="space-y-2 mt-2 bg-amber-950/20 p-2.5 rounded-xl border border-amber-800/40">
                <ParameterSlider
                  label="Số Mach bay"
                  symbol="M0"
                  value={inputs.M0}
                  min={0}
                  max={2.5}
                  step={0.05}
                  unit="—"
                  onChange={(v) => updateInput('M0', v)}
                  tooltip="Số Mach của máy bay (Flight Mach number M0)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ParameterSlider
                    label="Nhiệt độ tĩnh môi trường"
                    symbol="T0"
                    value={inputs.T0}
                    min={180}
                    max={320}
                    step={1}
                    unit="K"
                    isTemp={true}
                    onChange={(v) => updateInput('T0', v)}
                    tooltip="Nhiệt độ không khí tĩnh tại độ cao bay (Ambient static temperature T0)"
                  />

                  <ParameterSlider
                    label="Áp suất tĩnh môi trường"
                    symbol="P0"
                    value={inputs.P0}
                    min={5}
                    max={105}
                    step={1}
                    unit="kPa"
                    onChange={(v) => updateInput('P0', v)}
                    tooltip="Áp suất khí quyển tại độ cao bay (Ambient static pressure P0)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ParameterSlider
                    label="Hiệu suất nón khuếch tán"
                    symbol="ηd"
                    value={inputs.eta_diffuser}
                    min={0.8}
                    max={1.0}
                    step={0.01}
                    unit="—"
                    onChange={(v) => updateInput('eta_diffuser', v)}
                    tooltip="Độ phục hồi áp suất toàn phần qua cửa hút khí (Diffuser ram recovery)"
                  />

                  <ParameterSlider
                    label="Hiệu suất cháy buồng đốt"
                    symbol="ηb"
                    value={inputs.eta_b}
                    min={0.85}
                    max={1.0}
                    step={0.005}
                    unit="—"
                    onChange={(v) => updateInput('eta_b', v)}
                    tooltip="Hiệu suất cháy nhiên liệu trong buồng đốt (Combustor burner efficiency)"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ParameterSlider
                    label="Hiệu suất vòi phun"
                    symbol="ηn"
                    value={inputs.eta_n}
                    min={0.85}
                    max={1.0}
                    step={0.005}
                    unit="—"
                    onChange={(v) => updateInput('eta_n', v)}
                    tooltip="Hiệu suất dãn nở đẳng biến của loa phụt (Exhaust nozzle efficiency)"
                  />

                  <ParameterSlider
                    label="Nhiệt trị nhiên liệu LHV"
                    symbol="LHV"
                    value={inputs.LHV}
                    min={20000}
                    max={50000}
                    step={500}
                    unit="kJ/kg"
                    onChange={(v) => updateInput('LHV', v)}
                    tooltip="Nhiệt trị thấp của nhiên liệu phản lực (Lower Heating Value, ~43000 kJ/kg cho Jet-A)"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
