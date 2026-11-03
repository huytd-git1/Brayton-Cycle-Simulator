import { CycleInputs, CyclePerformance, ThermoState, ValidationResult } from '../types/thermo';
import { calculateGasConstantR } from '../utils/units';

export interface RealBraytonResult {
  states: ThermoState[];
  referenceStates: {
    state2s: ThermoState;
    state4s: ThermoState;
  };
  performance: CyclePerformance;
  validation: ValidationResult;
  R: number;
}

export function validateRealBraytonInputs(inputs: CycleInputs): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (inputs.T1 <= 0) errors.push('Nhiệt độ T1 phải là số dương tuyệt đối (K).');
  if (inputs.P1 <= 0) errors.push('Áp suất P1 phải lớn hơn 0 kPa.');
  if (inputs.rp <= 1) errors.push('Tỉ số nén rp phải lớn hơn 1.');
  if (inputs.gamma <= 1) errors.push('Hệ số dãn nở γ phải lớn hơn 1.');
  if (inputs.cp <= 0) errors.push('Nhiệt dung đẳng áp cp phải lớn hơn 0.');
  if (inputs.m_dot <= 0) errors.push('Lưu lượng ṁ phải lớn hơn 0.');

  if (inputs.eta_c <= 0 || inputs.eta_c > 1) {
    errors.push('Hiệu suất đẳng biến máy nén ηc phải nằm trong khoảng (0, 1].');
  }
  if (inputs.eta_t <= 0 || inputs.eta_t > 1) {
    errors.push('Hiệu suất đẳng biến tuabin ηt phải nằm trong khoảng (0, 1].');
  }
  if (inputs.delta_p < 0 || inputs.delta_p >= 0.5) {
    errors.push('Tổn thất áp suất buồng đốt Δp phải nằm trong khoảng [0, 0.5).');
  }
  if (inputs.eta_m <= 0 || inputs.eta_m > 1) {
    errors.push('Hiệu suất cơ khí ηm phải nằm trong khoảng (0, 1].');
  }

  const exponent = (inputs.gamma - 1) / inputs.gamma;
  const T2s_est = inputs.T1 * Math.pow(inputs.rp, exponent);
  const eta_c = Math.max(inputs.eta_c, 0.1);
  const T2_est = inputs.T1 + (T2s_est - inputs.T1) / eta_c;

  if (inputs.T3 <= T2_est) {
    errors.push(
      `Nhiệt độ vào tuabin T3 (${inputs.T3} K) phải lớn hơn nhiệt độ thực sau nén T2 (${T2_est.toFixed(1)} K).`
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function solveRealBrayton(inputs: CycleInputs): RealBraytonResult {
  const validation = validateRealBraytonInputs(inputs);
  const R = calculateGasConstantR(inputs.cp, inputs.gamma);
  const exponent = (inputs.gamma - 1) / inputs.gamma;

  // 1. State 1 (Compressor inlet)
  const P1 = Math.max(inputs.P1, 1e-4);
  const T1 = Math.max(inputs.T1, 1);
  const v1 = (R * T1) / P1;
  const s1 = 0; // Reference zero
  const h1 = inputs.cp * T1;

  // 2. State 2s (Ideal isentropic compression)
  const P2 = inputs.rp * P1;
  const T2s = T1 * Math.pow(inputs.rp, exponent);
  const v2s = (R * T2s) / P2;
  const s2s = s1;
  const h2s = inputs.cp * T2s;

  // 3. State 2 (Actual compressor outlet with isentropic efficiency eta_c)
  const eta_c = Math.min(Math.max(inputs.eta_c, 0.01), 1.0);
  const T2 = T1 + (T2s - T1) / eta_c;
  const v2 = (R * T2) / P2;
  // s2 - s1 = cp * ln(T2/T1) - R * ln(P2/P1) = cp * ln(T2 / T2s)
  const s2 = s1 + inputs.cp * Math.log(T2 / T1) - R * Math.log(P2 / P1);
  const h2 = inputs.cp * T2;
  const wc = inputs.cp * (T2 - T1);

  // 4. State 3 (Combustor outlet with combustor pressure loss delta_p)
  const delta_p = Math.min(Math.max(inputs.delta_p, 0), 0.4);
  const P3 = P2 * (1 - delta_p);
  const T3 = Math.max(inputs.T3, T2 + 1e-3);
  const v3 = (R * T3) / P3;
  // s3 - s2 = cp * ln(T3/T2) - R * ln(P3/P2)
  const s3 = s2 + inputs.cp * Math.log(T3 / T2) - R * Math.log(P3 / P2);
  const h3 = inputs.cp * T3;
  const qin = inputs.cp * (T3 - T2);

  // 5. State 4s (Ideal isentropic expansion from 3 to P4 = P1)
  const P4 = P1;
  const expansionRatio = Math.max(P4 / P3, 1e-6);
  const T4s = T3 * Math.pow(expansionRatio, exponent);
  const v4s = (R * T4s) / P4;
  const s4s = s3; // Isentropic from 3
  const h4s = inputs.cp * T4s;

  // 6. State 4 (Actual turbine outlet with isentropic efficiency eta_t)
  const eta_t = Math.min(Math.max(inputs.eta_t, 0.01), 1.0);
  const T4 = T3 - eta_t * (T3 - T4s);
  const v4 = (R * T4) / P4;
  // s4 - s3 = cp * ln(T4/T3) - R * ln(P4/P3)
  const s4 = s3 + inputs.cp * Math.log(T4 / T3) - R * Math.log(P4 / P3);
  const h4 = inputs.cp * T4;
  const wt = inputs.cp * (T3 - T4);

  // 7. Equivalent heat rejection to close the loop
  const qout = inputs.cp * (T4 - T1);

  // Thermodynamic net work & efficiency
  const wnet = wt - wc;
  const eta_th = qin > 0 ? wnet / qin : 0;
  const BWR = wt > 0 ? wc / wt : 0;

  // Mechanical efficiency & shaft power:
  // Mechanical loss model: P_shaft = m_dot * (eta_m * wt - wc)
  // Turbine drives compressor directly; excess shaft output delivered to load with eta_m
  const eta_m = Math.min(Math.max(inputs.eta_m, 0.01), 1.0);
  const shaft_power = inputs.m_dot * (eta_m * wt - wc);
  const Qin_dot = inputs.m_dot * qin;
  const shaft_efficiency = Qin_dot > 0 ? shaft_power / Qin_dot : 0;

  // Powers and rates [kW]
  const Wc_dot = inputs.m_dot * wc;
  const Wt_dot = inputs.m_dot * wt;
  const Wnet_dot = inputs.m_dot * wnet;
  const Qout_dot = inputs.m_dot * qout;

  // Energy residual
  const energy_residual = qin - qout - wnet;

  if (wnet <= 0) {
    validation.warnings.push(
      'Công có ích thực tế w_net ≤ 0! Tổn thất máy nén và tuabin quá lớn khiến động cơ không thể tự duy trì hoặc phát công.'
    );
  }

  const states: ThermoState[] = [
    {
      id: '1',
      name: '1: Cửa vào máy nén (Compressor Inlet)',
      P: P1,
      T: T1,
      v: v1,
      s: s1,
      h: h1,
    },
    {
      id: '2',
      name: '2: Cửa ra thực máy nén (Actual Compressor Outlet)',
      P: P2,
      T: T2,
      v: v2,
      s: s2,
      h: h2,
    },
    {
      id: '3',
      name: '3: Cửa ra buồng đốt (Combustor Outlet / Turbine Inlet)',
      P: P3,
      T: T3,
      v: v3,
      s: s3,
      h: h3,
    },
    {
      id: '4',
      name: '4: Cửa ra thực tuabin (Actual Turbine Outlet)',
      P: P4,
      T: T4,
      v: v4,
      s: s4,
      h: h4,
    },
  ];

  const referenceStates = {
    state2s: {
      id: '2s',
      name: '2s: Điểm nén đẳng biến lý tưởng (Ideal Isentropic Compressor Exit)',
      P: P2,
      T: T2s,
      v: v2s,
      s: s2s,
      h: h2s,
      isReference: true,
    },
    state4s: {
      id: '4s',
      name: '4s: Điểm giãn nở đẳng biến lý tưởng (Ideal Isentropic Turbine Exit)',
      P: P4,
      T: T4s,
      v: v4s,
      s: s4s,
      h: h4s,
      isReference: true,
    },
  };

  const performance: CyclePerformance = {
    wc,
    wt,
    wnet,
    qin,
    qout,
    eta_th,
    eta_th_percent: eta_th * 100,
    BWR,
    Wc_dot,
    Wt_dot,
    Wnet_dot,
    Qin_dot,
    Qout_dot,
    energy_residual,
    shaft_power,
    shaft_efficiency,
    entropy_gen_c: s2 - s1,
    entropy_gen_t: s4 - s3,
  };

  return {
    states,
    referenceStates,
    performance,
    validation,
    R,
  };
}
