import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { useSimulationStore } from '../../store/simulationStore';
import { BookOpen, HelpCircle, Layers, ChevronRight, Check } from 'lucide-react';

// KaTeX LaTeX renderer helper
const MathView: React.FC<{ math: string; block?: boolean }> = ({ math, block = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX render error:', err);
      }
    }
  }, [math, block]);

  return <span ref={containerRef} />;
};

export const EquationPanel: React.FC = () => {
  const { mode, selectedProcess, setSelectedProcess } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'equations' | 'processes'>('equations');

  const isIdeal = mode === 'IDEAL';
  const isReal = mode === 'REAL';
  const isTurbojet = mode === 'TURBOJET';

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      {/* Header with Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h2 className="font-semibold text-sm md:text-base text-white">
            Cơ sở Lý thuyết & Phương trình Nhiệt động (Physics & Equations)
          </h2>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('equations')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'equations'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hệ phương trình (Formulas)
          </button>
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'processes'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Giải thích 4 Quá trình (Processes)
          </button>
        </div>
      </div>

      {/* Tab 1: Equations based on current mode */}
      {activeTab === 'equations' && (
        <div className="space-y-4 overflow-y-auto pr-1 text-xs text-slate-300">
          {isIdeal && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-cyan-300">1. Quá trình nén đoạn nhiệt thuận nghịch 1 → 2:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    Áp suất và nhiệt độ sau nén:{' '}
                    <MathView math="P_2 = r_p P_1, \quad T_2 = T_1 \cdot r_p^{\frac{\gamma - 1}{\gamma}}" />
                  </div>
                  <div>
                    Công tiêu tốn của máy nén:{' '}
                    <MathView math="w_c = c_p (T_2 - T_1) = h_2 - h_1" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-orange-300">2. Cấp nhiệt đẳng áp trong buồng đốt 2 → 3:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    Áp suất không đổi:{' '}
                    <MathView math="P_3 = P_2" />
                  </div>
                  <div>
                    Nhiệt lượng cấp vào:{' '}
                    <MathView math="q_{in} = c_p (T_3 - T_2) = h_3 - h_2" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-red-300">3. Quá trình dãn nở đoạn nhiệt thuận nghịch 3 → 4:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    Nhiệt độ sau dãn nở:{' '}
                    <MathView math="P_4 = P_1, \quad T_4 = T_3 \left(\frac{P_4}{P_3}\right)^{\frac{\gamma - 1}{\gamma}} = \frac{T_3}{r_p^{\frac{\gamma - 1}{\gamma}}}" />
                  </div>
                  <div>
                    Công sinh ra bởi tuabin:{' '}
                    <MathView math="w_t = c_p (T_3 - T_4) = h_3 - h_4" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-amber-300">4. Hiệu suất nhiệt & Tỉ số nén tối ưu:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    Hiệu suất nhiệt giải tích:{' '}
                    <MathView math="\eta_{th} = \frac{w_{net}}{q_{in}} = 1 - \frac{1}{r_p^{\frac{\gamma - 1}{\gamma}}}" />
                  </div>
                  <div>
                    Tỉ số nén cho công có ích cực đại:{' '}
                    <MathView math="r_{p,opt} = \left(\frac{T_3}{T_1}\right)^{\frac{\gamma}{2(\gamma - 1)}}" />
                  </div>
                  <div>
                    Định luật bảo toàn năng lượng:{' '}
                    <MathView math="\epsilon = (q_{in} - q_{out}) - w_{net} \equiv 0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isReal && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-sky-300">1. Hiệu suất đẳng biến máy nén ηc & Nhiệt độ thực T2:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="T_{2s} = T_1 \cdot r_p^{\frac{\gamma - 1}{\gamma}}, \quad T_2 = T_1 + \frac{T_{2s} - T_1}{\eta_c}" />
                  </div>
                  <div>
                    Độ tăng entropy không thuận nghịch:{' '}
                    <MathView math="s_2 - s_1 = c_p \ln\left(\frac{T_2}{T_1}\right) - R \ln(r_p) = c_p \ln\left(\frac{T_2}{T_{2s}}\right) > 0" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-orange-300">2. Tổn thất áp suất buồng đốt Δp:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="P_3 = P_2 (1 - \Delta p), \quad q_{in} = c_p (T_3 - T_2)" />
                  </div>
                  <div>
                    Sinh entropy do ma sát và sụt áp:{' '}
                    <MathView math="s_3 - s_2 = c_p \ln\left(\frac{T_3}{T_2}\right) - R \ln(1 - \Delta p)" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-red-300">3. Hiệu suất đẳng biến tuabin ηt & Nhiệt độ thực T4:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="T_{4s} = T_3 \left(\frac{P_1}{P_3}\right)^{\frac{\gamma - 1}{\gamma}}, \quad T_4 = T_3 - \eta_t (T_3 - T_{4s})" />
                  </div>
                  <div>
                    Sinh entropy trong dãn nở thực:{' '}
                    <MathView math="s_4 - s_3 = c_p \ln\left(\frac{T_4}{T_{4s}}\right) > 0" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-300">4. Cân bằng công suất trục thực tế:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="P_{shaft} = \dot{m} (\eta_m w_t - w_c), \quad \eta_{shaft} = \frac{P_{shaft}}{\dot{Q}_{in}}" />
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Tuabin dẫn động máy nén trực tiếp; phần công dư phát ra tải trục chịu tổn thất cơ học ma sát ổ trục ηm.
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTurbojet && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-sky-300">1. Trạng thái hãm dòng bay (Stagnation Conditions):</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="T_{t0} = T_0 \left(1 + \frac{\gamma - 1}{2} M_0^2\right), \quad P_{t0} = P_0 \left(1 + \frac{\gamma - 1}{2} M_0^2\right)^{\frac{\gamma}{\gamma - 1}}" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-orange-300">2. Cân bằng năng lượng buồng đốt & Tỉ lệ hòa khí f:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="f = \frac{\dot{m}_{fuel}}{\dot{m}_{air}} = \frac{c_p (T_{t4} - T_{t3})}{\eta_b \cdot LHV - c_p T_{t4}}" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-red-300">3. Cân bằng công suất tuabin lái máy nén:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    <MathView math="T_{t4} - T_{t5} = \frac{T_{t3} - T_{t2}}{\eta_m (1 + f)}" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-semibold text-amber-300">4. Loa phụt & Lực đẩy phản lực:</span>
                <div className="pl-2 space-y-1 text-slate-200">
                  <div>
                    Áp suất tới hạn nghẽn dòng:{' '}
                    <MathView math="P_{crit} = P_{t5} \left(\frac{2}{\gamma + 1}\right)^{\frac{\gamma}{\gamma - 1}}" />
                  </div>
                  <div>
                    Lực đẩy phản lực thực F_net:{' '}
                    <MathView math="F_{net} = \dot{m}_{exit} V_{exit} - \dot{m}_{air} V_0 + (P_{exit} - P_0) A_{exit}" />
                  </div>
                  <div>
                    Suất tiêu hao nhiên liệu:{' '}
                    <MathView math="TSFC = \frac{\dot{m}_{fuel}}{F_{net}}, \quad \eta_p = \frac{2 V_0}{V_{exit} + V_0}" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive Process Explanation */}
      {activeTab === 'processes' && (
        <div className="space-y-2.5 overflow-y-auto pr-1 text-xs">
          {/* Process 1 -> 2 */}
          <div
            onClick={() => setSelectedProcess(1)}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProcess === 1
                ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-sky-400 mb-1">
              <span>Quá trình 1 → 2: Nén đoạn nhiệt (Compression)</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Không khí từ cửa vào được nén lên áp suất P2. Trong mô hình lý tưởng, quá trình là đẳng
              biến (s2 = s1) và không có ma sát. Trong động cơ thực, ma sát khí động và xoáy lốc
              sinh entropy khiến T2 &gt; T2s, đòi hỏi công nén wc lớn hơn.
            </p>
          </div>

          {/* Process 2 -> 3 */}
          <div
            onClick={() => setSelectedProcess(2)}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProcess === 2
                ? 'bg-orange-950/70 border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-orange-400 mb-1">
              <span>Quá trình 2 → 3: Cấp nhiệt đẳng áp (Combustion / Heat Addition)</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Nhiên liệu được phun và đốt cháy trong buồng đốt. Áp suất được giả định không đổi (P3 =
              P2) trong chu trình lý tưởng. Trong thực tế xảy ra sụt áp ma sát Δp khiến P3 &lt; P2.
              Nhiệt độ đạt đỉnh T3 tại cửa vào tuabin.
            </p>
          </div>

          {/* Process 3 -> 4 */}
          <div
            onClick={() => setSelectedProcess(3)}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProcess === 3
                ? 'bg-red-950/70 border-red-500 shadow-md shadow-red-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-red-400 mb-1">
              <span>Quá trình 3 → 4: Dãn nở đoạn nhiệt (Expansion / Turbine)</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Khí cháy nhiệt độ và áp suất cao dãn nở qua các tầng cánh tuabin để sinh công wt. Một phần
              công này dùng để quay máy nén khí, phần còn lại sinh công hữu ích phát điện hoặc tạo
              dòng phụt tốc độ cao trong động cơ phản lực.
            </p>
          </div>

          {/* Process 4 -> 1 */}
          <div
            onClick={() => setSelectedProcess(4)}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              selectedProcess === 4
                ? 'bg-amber-950/70 border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-amber-400 mb-1">
              <span>
                Quá trình 4 → 1:{' '}
                {isTurbojet ? 'Thải khí phản lực ra khí quyển' : 'Thải nhiệt đẳng áp (Heat Rejection)'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {isTurbojet
                ? 'Động cơ phản lực là hệ hở dòng liên tục. Khí xả mang nhiệt lượng và động lượng cao thoát thẳng ra khí quyển, không hề quay ngược lại cửa nạp của động cơ.'
                : 'Trong chu trình kín tương đương lý tưởng, môi chất trao đổi nhiệt với môi trường làm nguội về trạng thái ban đầu P1, T1 để hoàn tất chu trình.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

