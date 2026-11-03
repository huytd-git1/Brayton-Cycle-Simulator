import { CycleInputs, CyclePerformance, ThermoState, ValidationResult } from '../types/thermo';
import { calculateGasConstantR } from '../utils/units';

export interface IdealBraytonResult {
  states: ThermoState[];
  performance: CyclePerformance;
  validation: ValidationResult;
  R: number; // Gas constant [kJ/(kg·K)]
}

export function validateIdealBraytonInputs(inputs: CycleInputs): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (inputs.T1 <= 0) errors.push('Nhiệt độ cửa vào T1 phải là số dương tuyệt đối (K).');
  if (inputs.P1 <= 0) errors.push('Áp suất cửa vào P1 phải lớn hơn 0 kPa.');
  if (inputs.rp <= 1) errors.push('Tỉ số nén rp phải lớn hơn 1 để máy nén sinh áp.');
  if (inputs.gamma <= 1) errors.push('Tỉ số nhiệt dung riêng γ phải lớn hơn 1.');
  if (inputs.cp <= 0) errors.push('Nhiệt dung đẳng áp cp phải lớn hơn 0.');
  if (inputs.m_dot <= 0) errors.push('Lưu lượng khối lượng ṁ phải lớn hơn 0.');

  const exponent = (inputs.gamma - 1) / inputs.gamma;
  const T2_est = inputs.T1 * Math.pow(inputs.rp, exponent);

  if (inputs.T3 <= T2_est) {
    errors.push(
      `Nhiệt độ vào tuabin T3 (${inputs.T3} K) phải lớn hơn nhiệt độ sau nén T2 (${T2_est.toFixed(1)} K) để có cấp nhiệt dương (qin > 0).`
    );
  }

  if (inputs.rp > 35) {
    warnings.push('Tỉ số nén rp rất cao (> 35), có thể vượt quá giới hạn thiết kế của máy nén khí một trục.');
  }

  if (inputs.T3 > 1900) {
    warnings.push('Nhiệt độ vào tuabin T3 rất cao (> 1900 K), đòi hỏi vật liệu siêu hợp kim hoặc làm mát màng phức tạp.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function solveIdealBrayton(inputs: CycleInputs): IdealBraytonResult {
  const validation = validateIdealBraytonInputs(inputs);
  const R = calculateGasConstantR(inputs.cp, inputs.gamma);
  const exponent = (inputs.gamma - 1) / inputs.gamma;

  // 1. State 1 (Compressor inlet)
  const P1 = Math.max(inputs.P1, 1e-4);
  const T1 = Math.max(inputs.T1, 1);
  const v1 = (R * T1) / P1;
  const s1 = 0; // Reference zero
  const h1 = inputs.cp * T1;

  // 2. State 2 (Compressor outlet, isentropic)
  const P2 = inputs.rp * P1;
  const T2 = T1 * Math.pow(inputs.rp, exponent);
  const v2 = (R * T2) / P2;
  const s2 = s1; // Isentropic: s2 = s1
  const h2 = inputs.cp * T2;

  // 3. State 3 (Combustor outlet, isobaric)
  const P3 = P2;
  const T3 = Math.max(inputs.T3, T2 + 1e-3);
  const v3 = (R * T3) / P3;
  // Entropy change from 2 to 3: s3 - s2 = cp * ln(T3/T2) - R * ln(P3/P2) = cp * ln(T3/T2)
  const s3 = s2 + inputs.cp * Math.log(T3 / T2);
  const h3 = inputs.cp * T3;

  // 4. State 4 (Turbine outlet, isentropic expansion to P4 = P1)
  const P4 = P1;
  const T4 = T3 * Math.pow(P4 / P3, exponent);
  const v4 = (R * T4) / P4;
  const s4 = s3; // Isentropic: s4 = s3
  const h4 = inputs.cp * T4;

  // Specific work & heat [kJ/kg]
  const wc = inputs.cp * (T2 - T1);
  const qin = inputs.cp * (T3 - T2);
  const wt = inputs.cp * (T3 - T4);
  const qout = inputs.cp * (T4 - T1);
  const wnet = wt - wc;

  // Efficiencies & metrics
  const eta_th = qin > 0 ? wnet / qin : 0;
  const eta_th_analytical = 1 - 1 / Math.pow(inputs.rp, exponent);
  const BWR = wt > 0 ? wc / wt : 0;

  // Optimum rp for maximum net work: rp_opt = (T3 / T1)^(gamma / (2 * (gamma - 1)))
  const opt_exp = inputs.gamma / (2 * (inputs.gamma - 1));
  const optimum_rp = Math.pow(T3 / T1, opt_exp);

  // Powers and rates [kW]
  const Wc_dot = inputs.m_dot * wc;
  const Wt_dot = inputs.m_dot * wt;
  const Wnet_dot = inputs.m_dot * wnet;
  const Qin_dot = inputs.m_dot * qin;
  const Qout_dot = inputs.m_dot * qout;

  // Energy balance residual
  const energy_residual = qin - qout - wnet;

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
      name: '2: Cửa ra máy nén (Compressor Outlet)',
      P: P2,
      T: T2,
      v: v2,
      s: s2,
      h: h2,
    },
    {
      id: '3',
      name: '3: Cửa vào tuabin / Ra buồng đốt (Turbine Inlet)',
      P: P3,
      T: T3,
      v: v3,
      s: s3,
      h: h3,
    },
    {
      id: '4',
      name: '4: Cửa ra tuabin / Thải nhiệt (Turbine Outlet)',
      P: P4,
      T: T4,
      v: v4,
      s: s4,
      h: h4,
    },
  ];

  const performance: CyclePerformance = {
    wc,
    wt,
    wnet,
    qin,
    qout,
    eta_th,
    eta_th_percent: eta_th * 100,
    eta_th_analytical,
    BWR,
    Wc_dot,
    Wt_dot,
    Wnet_dot,
    Qin_dot,
    Qout_dot,
    energy_residual,
    optimum_rp,
  };

  return {
    states,
    performance,
    validation,
    R,
  };
}

