import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { formatNum, formatPower, formatTemp } from '../../utils/units';
import {
  Zap,
  Gauge,
  Flame,
  Snowflake,
  TrendingUp,
  Scale,
  CheckCircle,
  AlertCircle,
  Plane,
  Fuel,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  sublabel?: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  accentColor?: string;
  badge?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  sublabel,
  value,
  unit,
  icon,
  accentColor = 'border-slate-800',
  badge,
}) => {
  return (
    <div
      className={`bg-slate-900/90 rounded-xl p-3.5 border ${accentColor} shadow-lg hover:border-slate-700 transition flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400 font-medium truncate">{label}</span>
        <div className="flex items-center gap-1">
          {badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              {badge}
            </span>
          )}
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl md:text-2xl font-bold font-mono tracking-tight text-white">
            {value}
          </span>
          <span className="text-xs font-mono text-slate-400">{unit}</span>
        </div>
        {sublabel && (
          <p className="text-[11px] text-slate-500 mt-1 truncate">{sublabel}</p>
        )}
      </div>
    </div>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const {
    mode,
    idealResult,
    realResult,
    turbojetResult,
    tempUnit,
  } = useSimulationStore();

  const isIdeal = mode === 'IDEAL';
  const isReal = mode === 'REAL';
  const isTurbojet = mode === 'TURBOJET';

  const perf = isIdeal
    ? idealResult.performance
    : isReal
    ? realResult.performance
    : null;

  const tjPerf = isTurbojet ? turbojetResult.performance : null;

  // Temperatures
  const T2 = isIdeal
    ? idealResult.states[1].T
    : isReal
    ? realResult.states[1].T
    : turbojetResult.performance.Tt3;
  const T4 = isIdeal
    ? idealResult.states[3].T
    : isReal
    ? realResult.states[3].T
    : turbojetResult.performance.Tt5;

  return (
    <div className="space-y-4">
      {/* Thermodynamic Performance Section (Modes A & B) */}
      {!isTurbojet && perf && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              Chỉ số Năng lượng & Hiệu suất Chu trình (Cycle Performance Metrics)
            </h3>
            {/* Energy Balance Residual Verification */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono">
              <span className="text-slate-400">Sai số cân bằng ε:</span>
              <span
                className={`font-bold ${
                  Math.abs(perf.energy_residual) < 1e-4
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {Math.abs(perf.energy_residual) < 1e-5
                  ? '0.0000 kJ/kg'
                  : `${perf.energy_residual.toExponential(2)} kJ/kg`}
              </span>
              {Math.abs(perf.energy_residual) < 1e-4 ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Thermal Efficiency */}
            <MetricCard
              label="Hiệu suất nhiệt (Thermal Eff.)"
              sublabel={
                isIdeal && perf.eta_th_analytical
                  ? `Giải tích: ${(perf.eta_th_analytical * 100).toFixed(2)}%`
                  : 'η_th = w_net / q_in'
              }
              value={perf.eta_th_percent.toFixed(2)}
              unit="%"
              icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}
              accentColor="border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-900/90"
              badge="η_th"
            />

            {/* 2. Net Specific Work */}
            <MetricCard
              label="Công riêng có ích (Net Work)"
              sublabel={`Công suất phát: ${formatPower(perf.Wnet_dot).value} ${
                formatPower(perf.Wnet_dot).unit
              }`}
              value={perf.wnet.toFixed(1)}
              unit="kJ/kg"
              icon={<Zap className="h-4 w-4 text-amber-400" />}
              accentColor="border-amber-500/40"
              badge="w_net"
            />

            {/* 3. Heat Input */}
            <MetricCard
              label="Nhiệt lượng cấp (Heat In)"
              sublabel={`Nhiệt lượng: ${formatPower(perf.Qin_dot).value} ${
                formatPower(perf.Qin_dot).unit
              }`}
              value={perf.qin.toFixed(1)}
              unit="kJ/kg"
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              accentColor="border-orange-500/40"
              badge="q_in"
            />

            {/* 4. Heat Rejected */}
            <MetricCard
              label="Nhiệt lượng thải (Heat Out)"
              sublabel={`Thải ra môi trường: ${formatPower(perf.Qout_dot).value} ${
                formatPower(perf.Qout_dot).unit
              }`}
              value={perf.qout.toFixed(1)}
              unit="kJ/kg"
              icon={<Snowflake className="h-4 w-4 text-sky-400" />}
              badge="q_out"
            />

            {/* 5. Back Work Ratio */}
            <MetricCard
              label="Tỉ số công ngược (BWR)"
              sublabel={`wc: ${perf.wc.toFixed(1)} / wt: ${perf.wt.toFixed(1)}`}
              value={(perf.BWR * 100).toFixed(1)}
              unit="%"
              icon={<Scale className="h-4 w-4 text-purple-400" />}
              badge="BWR"
            />
          </div>

          {/* Secondary Row: Components work & Shaft info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Công tiêu tốn máy nén"
              sublabel={`Công suất nén: ${formatPower(perf.Wc_dot).value} ${
                formatPower(perf.Wc_dot).unit
              }`}
              value={perf.wc.toFixed(1)}
              unit="kJ/kg"
              icon={<Gauge className="h-4 w-4 text-sky-400" />}
              badge="w_c"
            />

            <MetricCard
              label="Công sinh ra bởi tuabin"
              sublabel={`Công suất tuabin: ${formatPower(perf.Wt_dot).value} ${
                formatPower(perf.Wt_dot).unit
              }`}
              value={perf.wt.toFixed(1)}
              unit="kJ/kg"
              icon={<Zap className="h-4 w-4 text-red-400" />}
              badge="w_t"
            />

            <MetricCard
              label="Nhiệt độ sau nén T2"
              sublabel="Cửa ra máy nén khí"
              value={formatTemp(T2, tempUnit, 1)}
              unit=""
              icon={<Gauge className="h-4 w-4 text-cyan-400" />}
              badge="T2"
            />

            <MetricCard
              label="Nhiệt độ sau dãn nở T4"
              sublabel="Cửa thoát khí tuabin"
              value={formatTemp(T4, tempUnit, 1)}
              unit=""
              icon={<Flame className="h-4 w-4 text-amber-400" />}
              badge="T4"
            />
          </div>

          {/* Real Cycle Shaft Power accounting */}
          {isReal && perf.shaft_power !== undefined && (
            <div className="bg-sky-950/30 border border-sky-800/50 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <span className="font-semibold text-sky-200">
                  Cân bằng truyền động cơ khí (Shaft Power Accounting):
                </span>
                <span className="text-slate-300">
                  P_shaft = ṁ · (η_m · w_t - w_c) ={' '}
                  <strong className="text-white font-mono">
                    {formatPower(perf.shaft_power).value} {formatPower(perf.shaft_power).unit}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-300 font-mono">
                <span>
                  Hiệu suất trục phát: <strong className="text-cyan-300">{((perf.shaft_efficiency || 0) * 100).toFixed(2)}%</strong>
                </span>
                <span>
                  Sinh entropy máy nén Δsc: <strong className="text-purple-300">{perf.entropy_gen_c?.toFixed(4)}</strong> kJ/kg·K
                </span>
                <span>
                  Sinh entropy tuabin Δst: <strong className="text-rose-300">{perf.entropy_gen_t?.toFixed(4)}</strong> kJ/kg·K
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Turbojet Propulsion Metrics (Mode C) */}
      {isTurbojet && tjPerf && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-amber-400" />
              Chỉ số Lực đẩy & Hiệu suất Động cơ Phản lực (Turbojet Propulsion Laboratory)
            </h3>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono">
              <span className="text-slate-400">Trạng thái loa phụt:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded ${
                  tjPerf.isChoked
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                {tjPerf.isChoked ? 'Nghẽn dòng (Choked M=1)' : 'Không nghẽn (Unchoked)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Net Thrust */}
            <MetricCard
              label="Lực đẩy phản lực thực (F_net)"
              sublabel={`Động lượng: ${(tjPerf.F_momentum / 1000).toFixed(1)} kN | Áp suất: ${(
                tjPerf.F_pressure / 1000
              ).toFixed(1)} kN`}
              value={(tjPerf.F_net / 1000).toFixed(2)}
              unit="kN"
              icon={<Rocket className="h-4 w-4 text-amber-400" />}
              accentColor="border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-900/90"
              badge="F_net"
            />

            {/* 2. Specific Thrust */}
            <MetricCard
              label="Lực đẩy riêng (Specific Thrust)"
              sublabel="F_net / Lưu lượng khí ṁ_air"
              value={tjPerf.specific_thrust.toFixed(1)}
              unit="N/(kg/s)"
              icon={<Plane className="h-4 w-4 text-cyan-400" />}
              badge="Fs"
            />

            {/* 3. Exhaust Jet Velocity */}
            <MetricCard
              label="Vận tốc luồng phụt (Jet Velocity)"
              sublabel={`Vận tốc bay V0: ${tjPerf.V0.toFixed(0)} m/s`}
              value={tjPerf.V_exit.toFixed(1)}
              unit="m/s"
              icon={<Gauge className="h-4 w-4 text-sky-400" />}
              badge="V_9"
            />

            {/* 4. TSFC */}
            <MetricCard
              label="Suất tiêu hao NL (TSFC)"
              sublabel={`ṁ_fuel = ${(tjPerf.m_dot_fuel * 3600).toFixed(1)} kg/h`}
              value={tjPerf.TSFC_g_per_kNs.toFixed(2)}
              unit="g/(kN·s)"
              icon={<Fuel className="h-4 w-4 text-rose-400" />}
              badge="TSFC"
            />

            {/* 5. Fuel-air ratio */}
            <MetricCard
              label="Tỉ lệ hòa khí (Fuel-Air ratio)"
              sublabel="f = ṁ_fuel / ṁ_air"
              value={(tjPerf.f * 100).toFixed(2)}
              unit="%"
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              badge="f"
            />
          </div>

          {/* Secondary Propulsion Row: Efficiencies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Hiệu suất đẩy (Propulsive Efficiency)"
              sublabel="η_p = Công sinh lực đẩy hữu ích / Động năng gia tốc luồng"
              value={(tjPerf.eta_prop * 100).toFixed(2)}
              unit="%"
              icon={<Plane className="h-4 w-4 text-sky-400" />}
              badge="η_p"
            />

            <MetricCard
              label="Hiệu suất nhiệt động học (Thermal Eff.)"
              sublabel="η_th = Gia số động năng luồng khí / Năng lượng hóa học nhiên liệu"
              value={(tjPerf.eta_thermal * 100).toFixed(2)}
              unit="%"
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              badge="η_th"
            />

            <MetricCard
              label="Hiệu suất tổng thể (Overall Eff.)"
              sublabel="η_o = η_p × η_th = Lực đẩy × V0 / Nhiệt năng nhiên liệu"
              value={(tjPerf.eta_overall * 100).toFixed(2)}
              unit="%"
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              badge="η_overall"
            />
          </div>
        </div>
      )}
    </div>
  );
};

