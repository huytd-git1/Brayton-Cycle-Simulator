import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { formatTemp } from '../../utils/units';
import { ArrowRight, Flame, Wind, Gauge } from 'lucide-react';

export const Engine2DSchematic: React.FC = () => {
  const {
    mode,
    selectedProcess,
    setSelectedProcess,
    idealResult,
    realResult,
    turbojetResult,
    tempUnit,
    isPlaying,
  } = useSimulationStore();

  const isIdeal = mode === 'IDEAL';
  const isReal = mode === 'REAL';
  const isTurbojet = mode === 'TURBOJET';

  const s1 = isTurbojet ? turbojetResult.stations[1] : idealResult.states[0];
  const s2 = isIdeal
    ? idealResult.states[1]
    : isReal
    ? realResult.states[1]
    : turbojetResult.stations[2];
  const s3 = isIdeal
    ? idealResult.states[2]
    : isReal
    ? realResult.states[2]
    : turbojetResult.stations[3];
  const s4 = isIdeal
    ? idealResult.states[3]
    : isReal
    ? realResult.states[3]
    : turbojetResult.stations[5];

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 rounded-2xl p-4 flex flex-col justify-between border border-slate-800 shadow-2xl overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {isTurbojet
              ? 'Sơ đồ luồng khí Động cơ phản lực (Turbojet Flowpath Schematic)'
              : 'Sơ đồ nguyên lý chu trình nhiệt động (Thermodynamic Schematic)'}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Nhấp chuột vào từng bộ phận để xem chi tiết
        </span>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="flex-1 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 880 380"
          className="w-full max-w-4xl h-auto select-none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id="combGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <linearGradient id="turbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <linearGradient id="nozzleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            {/* Arrow Marker */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
            </marker>

            <marker
              id="arrowhead-orange"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#ea580c" />
            </marker>
          </defs>

          {/* Central Rotating Drive Shaft */}
          <rect
            x="240"
            y="180"
            width="380"
            height="18"
            rx="4"
            fill="#475569"
            stroke="#64748b"
            strokeWidth="2"
          />
          {/* Work Out Shaft Extension */}
          <line
            x1="620"
            y1="189"
            x2="780"
            y2="189"
            stroke="#94a3b8"
            strokeWidth="4"
            strokeDasharray="6,4"
          />

          {/* Work Output Curved Arrow */}
          <path
            d="M 740,165 A 25 25 0 1 1 740,213"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          <text x="755" y="155" fill="#38bdf8" fontSize="13" fontWeight="bold">
            {isTurbojet ? 'Công dẫn động (Shaft Work)' : 'Công ra W_net'}
          </text>

          {/* 1. Fresh Air Inlet Duct */}
          <g>
            <path
              d="M 60,189 L 140,189"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              markerEnd="url(#arrowhead)"
            />
            <text x="60" y="160" fill="#38bdf8" fontSize="13" fontWeight="bold">
              Không khí vào (Air Inlet)
            </text>
            <text x="60" y="225" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              {`P1=${s1.P.toFixed(0)} kPa`}
            </text>
            <text x="60" y="245" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              {`T1=${formatTemp(s1.T, tempUnit, 0)}`}
            </text>
            <circle cx="140" cy="189" r="6" fill="#0284c7" />
            <text x="135" y="215" fill="#38bdf8" fontSize="14" fontWeight="bold">
              1
            </text>
          </g>

          {/* 2. Compressor (Trapezoid convergent geometry) */}
          <g
            onClick={() => setSelectedProcess(1)}
            className="cursor-pointer group"
          >
            <polygon
              points="145,100 250,135 250,245 145,280"
              fill="url(#compGrad)"
              stroke={selectedProcess === 1 ? '#38bdf8' : '#0369a1'}
              strokeWidth={selectedProcess === 1 ? '4' : '2'}
              className="transition duration-300 group-hover:brightness-110"
            />
            <text
              x="195"
              y="195"
              fill="#ffffff"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
            >
              MÁY NÉN
            </text>
            <text
              x="195"
              y="215"
              fill="#e0f2fe"
              fontSize="11"
              textAnchor="middle"
            >
              (Compressor)
            </text>

            {/* Compressor Work In Arrow */}
            <path
              d="M 195,330 L 195,285"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
            />
            <text x="155" y="350" fill="#06b6d4" fontSize="13" fontWeight="bold">
              Công nén W_c
            </text>
          </g>

          {/* Station 2: Between Compressor & Combustor */}
          <g>
            <path
              d="M 250,140 Q 280,140 280,85 L 340,85"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              markerEnd="url(#arrowhead)"
            />
            <circle cx="280" cy="115" r="5" fill="#06b6d4" />
            <text x="290" y="115" fill="#06b6d4" fontSize="14" fontWeight="bold">
              2
            </text>
            <text x="260" y="50" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`P2=${s2.P.toFixed(0)} kPa`}
            </text>
            <text x="260" y="65" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`T2=${formatTemp(s2.T, tempUnit, 0)}`}
            </text>
          </g>

          {/* 3. Combustion Chamber */}
          <g
            onClick={() => setSelectedProcess(2)}
            className="cursor-pointer group"
          >
            <rect
              x="340"
              y="45"
              width="180"
              height="80"
              rx="16"
              fill="url(#combGrad)"
              stroke={selectedProcess === 2 ? '#fb923c' : '#c2410c'}
              strokeWidth={selectedProcess === 2 ? '4' : '2'}
              className="transition duration-300 group-hover:brightness-110"
            />
            <text
              x="430"
              y="85"
              fill="#ffffff"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
            >
              BUỒNG ĐỐT
            </text>
            <text
              x="430"
              y="105"
              fill="#ffedd5"
              fontSize="11"
              textAnchor="middle"
            >
              (Combustor)
            </text>

            {/* Fuel / Heat In Arrow */}
            <path
              d="M 430,0 L 430,40"
              fill="none"
              stroke="#ea580c"
              strokeWidth="3.5"
              markerEnd="url(#arrowhead-orange)"
            />
            <text x="440" y="25" fill="#ea580c" fontSize="13" fontWeight="bold">
              {isTurbojet ? 'Nhiên liệu + Cấp nhiệt Q_in' : 'Nhiệt cấp q_in (Q_A)'}
            </text>
          </g>

          {/* Station 3: Combustor Outlet to Turbine */}
          <g>
            <path
              d="M 520,85 L 560,85 Q 580,85 580,140"
              fill="none"
              stroke="#ea580c"
              strokeWidth="4"
              markerEnd="url(#arrowhead-orange)"
            />
            <circle cx="560" cy="85" r="5" fill="#ea580c" />
            <text x="545" y="70" fill="#ea580c" fontSize="14" fontWeight="bold">
              3
            </text>
            <text x="590" y="70" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`P3=${s3.P.toFixed(0)} kPa`}
            </text>
            <text x="590" y="85" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`T3=${formatTemp(s3.T, tempUnit, 0)}`}
            </text>
          </g>

          {/* 4. Turbine (Trapezoid expanding geometry) */}
          <g
            onClick={() => setSelectedProcess(3)}
            className="cursor-pointer group"
          >
            <polygon
              points="580,135 660,100 660,280 580,245"
              fill="url(#turbGrad)"
              stroke={selectedProcess === 3 ? '#ef4444' : '#991b1b'}
              strokeWidth={selectedProcess === 3 ? '4' : '2'}
              className="transition duration-300 group-hover:brightness-110"
            />
            <text
              x="620"
              y="195"
              fill="#ffffff"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
            >
              TUABIN
            </text>
            <text
              x="620"
              y="215"
              fill="#fee2e2"
              fontSize="11"
              textAnchor="middle"
            >
              (Turbine)
            </text>
          </g>

          {/* Station 4: Turbine Outlet / Exhaust */}
          <g>
            <circle cx="660" cy="240" r="5" fill="#f59e0b" />
            <text x="670" y="245" fill="#f59e0b" fontSize="14" fontWeight="bold">
              4
            </text>
            <text x="680" y="265" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`P4=${s4.P.toFixed(0)} kPa`}
            </text>
            <text x="680" y="280" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
              {`T4=${formatTemp(s4.T, tempUnit, 0)}`}
            </text>
          </g>

          {/* 5. Exhaust / Closed Cycle Heat Exchanger Rejection (Process 4 -> 1) */}
          {isTurbojet ? (
            /* Open Exhaust Jet */
            <g>
              <polygon
                points="660,140 730,155 730,225 660,240"
                fill="url(#nozzleGrad)"
                stroke="#d97706"
                strokeWidth="2"
              />
              <text x="695" y="195" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                LOA PHỤT
              </text>
              <path
                d="M 730,190 L 820,190"
                fill="none"
                stroke="#eab308"
                strokeWidth="5"
                markerEnd="url(#arrowhead-orange)"
              />
              <text x="740" y="175" fill="#eab308" fontSize="13" fontWeight="bold">
                Luồng khí phản lực (Jet Thrust)
              </text>
            </g>
          ) : (
            /* Closed Cycle Equivalent Rejection Duct */
            <g
              onClick={() => setSelectedProcess(4)}
              className="cursor-pointer group"
            >
              <path
                d="M 640,280 L 640,320 Q 640,335 625,335 L 180,335 Q 165,335 165,310 L 165,280"
                fill="none"
                stroke={selectedProcess === 4 ? '#38bdf8' : '#334155'}
                strokeWidth={selectedProcess === 4 ? '4' : '2'}
                strokeDasharray="8,5"
                className="transition group-hover:stroke-sky-400"
              />
              {/* Heat Out Arrow */}
              <path
                d="M 400,335 L 400,375"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                markerEnd="url(#arrowhead)"
              />
              <text x="415" y="365" fill="#38bdf8" fontSize="13" fontWeight="bold">
                Thải nhiệt q_out (Q_R)
              </text>
              <text x="400" y="325" fill="#94a3b8" fontSize="11" textAnchor="middle">
                Quá trình làm mát tương đương 4 → 1
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Footer Notes */}
      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200">
            {isTurbojet
              ? 'Hệ thống hở dòng liên tục:'
              : 'Mô hình chu trình kín tương đương:'}
          </span>{' '}
          {isTurbojet
            ? 'Khí nạp từ môi trường qua máy nén, buồng đốt, tuabin và dãn nở qua miệng phụt sinh lực đẩy F.'
            : 'Môi chất tuần hoàn qua 4 quá trình nhiệt động học: Nén (1-2), Cấp nhiệt (2-3), Dãn nở (3-4), Thải nhiệt (4-1).'}
        </div>
      </div>
    </div>
  );
};
