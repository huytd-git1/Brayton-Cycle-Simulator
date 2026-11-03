import { CycleInputs, ThermoState, TurbojetPerformance, ValidationResult } from '../types/thermo';
import { calculateGasConstantR } from '../utils/units';

export interface TurbojetResult {
  stations: ThermoState[];
  performance: TurbojetPerformance;
  validation: ValidationResult;
  R: number;
}

export function validateTurbojetInputs(inputs: CycleInputs): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (inputs.M0 < 0 || inputs.M0 > 3.0) {
    errors.push('Số Mach bay M0 phải nằm trong khoảng từ 0 đến 3.0.');
  }
  if (inputs.T0 <= 150 || inputs.T0 > 350) {
    errors.push('Nhiệt độ môi trường T0 phải nằm trong khoảng thực tế 150 K – 350 K.');
  }
  if (inputs.P0 <= 5 || inputs.P0 > 150) {
    errors.push('Áp suất môi trường P0 phải nằm trong khoảng 5 kPa – 150 kPa.');
  }
  if (inputs.rp <= 1) errors.push('Tỉ số nén rp phải lớn hơn 1.');
  if (inputs.gamma <= 1) errors.push('Tỉ số nhiệt dung γ phải lớn hơn 1.');
  if (inputs.cp <= 0) errors.push('Nhiệt dung cp phải lớn hơn 0.');
  if (inputs.m_dot <= 0) errors.push('Lưu lượng khí ṁ phải lớn hơn 0.');

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function solveTurbojet(inputs: CycleInputs): TurbojetResult {
  const validation = validateTurbojetInputs(inputs);
  const R = calculateGasConstantR(inputs.cp, inputs.gamma); // kJ/(kg·K)
  const R_J = R * 1000; // J/(kg·K)
  const cp_J = inputs.cp * 1000; // J/(kg·K)
  const gamma = inputs.gamma;
  const exp = (gamma - 1) / gamma;
  const invExp = gamma / (gamma - 1);

  // 1. Flight condition (Station 0)
  const M0 = Math.max(inputs.M0, 0);
  const T0 = inputs.T0;
  const P0 = inputs.P0;
  const a0 = Math.sqrt(gamma * R_J * T0); // Speed of sound [m/s]
  const V0 = M0 * a0; // Flight speed [m/s]

  // Flight stagnation properties
  const ramFactor = 1 + ((gamma - 1) / 2) * M0 * M0;
  const Tt0 = T0 * ramFactor;
  const Pt0 = P0 * Math.pow(ramFactor, invExp);

  // 2. Diffuser / Inlet (Station 2)
  const eta_d = Math.min(Math.max(inputs.eta_diffuser || 0.98, 0.5), 1.0);
  const Tt2 = Tt0;
  const Pt2 = Pt0 * eta_d;

  // 3. Compressor (Station 3)
  const rp = Math.max(inputs.rp, 1.05);
  const Pt3 = Pt2 * rp;
  const Tt3s = Tt2 * Math.pow(rp, exp);
  const eta_c = Math.min(Math.max(inputs.eta_c, 0.1), 1.0);
  const Tt3 = Tt2 + (Tt3s - Tt2) / eta_c;
  const wc = inputs.cp * (Tt3 - Tt2); // Compressor specific work [kJ/kg air]

  // 4. Combustor (Station 4)
  const delta_p = Math.min(Math.max(inputs.delta_p, 0), 0.3);
  const Pt4 = Pt3 * (1 - delta_p);
  const Tt4 = Math.max(inputs.T3, Tt3 + 50); // Turbine inlet total temp

  const eta_b = Math.min(Math.max(inputs.eta_b || 0.99, 0.5), 1.0);
  const LHV = Math.max(inputs.LHV || 43000, 10000); // kJ/kg

  // Fuel-air ratio f: cp * (Tt4 - Tt3) / (eta_b * LHV - cp * Tt4)
  const f_denom = eta_b * LHV - inputs.cp * Tt4;
  let f = 0.02; // typical default
  if (f_denom > 0) {
    f = (inputs.cp * (Tt4 - Tt3)) / f_denom;
    if (f < 0.001) f = 0.001;
    if (f > 0.08) {
      f = 0.08;
      validation.warnings.push('Tỉ lệ nhiên liệu/không khí f đạt ngưỡng cháy giàu tối đa (0.08).');
    }
  } else {
    validation.warnings.push('Nhiệt độ Tt4 quá cao so với nhiệt trị nhiên liệu LHV.');
  }

  const m_dot_fuel = inputs.m_dot * f;
  const m_dot_exit = inputs.m_dot * (1 + f);

  // 5. Turbine (Station 5)
  // Turbine drives compressor: (1 + f) * wt = wc / eta_m
  const eta_m = Math.min(Math.max(inputs.eta_m, 0.5), 1.0);
  const delta_Tt_turb = (Tt3 - Tt2) / (eta_m * (1 + f));
  const Tt5 = Tt4 - delta_Tt_turb;

  if (Tt5 <= 0) {
    validation.errors.push('Công suất yêu cầu của máy nén vượt quá toàn bộ entanpi của dòng khí tại tuabin!');
  }

  const eta_t = Math.min(Math.max(inputs.eta_t, 0.1), 1.0);
  const delta_Tt_turb_ideal = delta_Tt_turb / eta_t;
  const Tt5s = Tt4 - delta_Tt_turb_ideal;
  const turb_pr = Math.max(Tt5s / Tt4, 0.01);
  const Pt5 = Pt4 * Math.pow(turb_pr, invExp);
  const wt = inputs.cp * delta_Tt_turb;

  // 6. Exhaust Nozzle (Station 9 / Exit)
  const eta_n = Math.min(Math.max(inputs.eta_n || 0.98, 0.5), 1.0);
  const Tt9 = Tt5;

  // Critical pressure ratio for sonic nozzle exit:
  // (P_crit / Pt5) = (2 / (gamma + 1))^(gamma / (gamma - 1))
  const crit_ratio = Math.pow(2 / (gamma + 1), invExp);
  const P_critical = Pt5 * crit_ratio;

  let isChoked = false;
  let P_exit = P0;
  let T_exit = T0;
  let V_exit = 0;

  if (P0 <= P_critical) {
    // Nozzle is CHOKED: exit Mach = 1.0, P_exit = P_critical
    isChoked = true;
    P_exit = P_critical;
    T_exit = Tt9 * (2 / (gamma + 1));
    V_exit = Math.sqrt(gamma * R_J * T_exit);
  } else {
    // Nozzle is UNCHOKED: expands completely to P0
    isChoked = false;
    P_exit = P0;
    const expansionRatio = Math.max(P0 / Pt5, 1e-4);
    const T_ideal = Tt9 * Math.pow(expansionRatio, exp);
    T_exit = Tt9 - eta_n * (Tt9 - T_ideal);
    const delta_h_J = 2 * cp_J * Math.max(Tt9 - T_exit, 0);
    V_exit = Math.sqrt(delta_h_J);
  }

  // Exhaust density and exit area
  const rho_exit = Math.max((P_exit * 1000) / (R_J * T_exit), 1e-4); // kg/m^3
  const A_exit = Math.max(m_dot_exit / (rho_exit * Math.max(V_exit, 1)), 1e-5); // m^2

  // 7. Thrust and Efficiencies
  // Momentum thrust: m_dot_exit * V_exit - m_dot_air * V0
  const F_momentum = m_dot_exit * V_exit - inputs.m_dot * V0;
  // Pressure thrust: (P_exit - P0) * A_exit
  const F_pressure = (P_exit - P0) * 1000 * A_exit; // [N]
  const F_net = F_momentum + F_pressure; // [N]

  const specific_thrust = F_net / inputs.m_dot; // [N/(kg/s)]
  const TSFC = F_net > 0 ? m_dot_fuel / F_net : 0; // [kg/(N·s)]
  const TSFC_g_per_kNs = TSFC * 1e6; // [g/(kN·s)]

  // Useful propulsive power
  const P_thrust = F_net * V0; // [W]
  // Kinetic power added to jet
  const delta_KE = 0.5 * m_dot_exit * V_exit * V_exit - 0.5 * inputs.m_dot * V0 * V0; // [W]
  // Fuel chemical energy rate
  const Q_fuel_W = m_dot_fuel * LHV * 1000; // [W]

  let eta_prop = 0;
  if (V0 > 0 && (delta_KE + F_pressure * V0) > 0) {
    eta_prop = Math.min(Math.max(P_thrust / (delta_KE + F_pressure * V0), 0), 1.0);
  }

  const eta_thermal = Q_fuel_W > 0 ? Math.min(Math.max(delta_KE / Q_fuel_W, 0), 1.0) : 0;
  const eta_overall = Q_fuel_W > 0 ? Math.min(Math.max(P_thrust / Q_fuel_W, 0), 1.0) : 0;

  // Station representations for UI
  const stations: ThermoState[] = [
    {
      id: '0',
      name: '0: Không khí môi trường (Ambient Freestream)',
      P: P0,
      T: T0,
      v: (R * T0) / P0,
      s: 0,
      h: inputs.cp * T0,
    },
    {
      id: 't0',
      name: 't0: Trạng thái hãm dòng bay (Stagnation Freestream)',
      P: Pt0,
      T: Tt0,
      v: (R * Tt0) / Pt0,
      s: 0,
      h: inputs.cp * Tt0,
    },
    {
      id: '2',
      name: '2: Sau nón khuếch tán (Diffuser Exit / Comp Inlet)',
      P: Pt2,
      T: Tt2,
      v: (R * Tt2) / Pt2,
      s: 0,
      h: inputs.cp * Tt2,
    },
    {
      id: '3',
      name: '3: Sau máy nén (Compressor Exit)',
      P: Pt3,
      T: Tt3,
      v: (R * Tt3) / Pt3,
      s: inputs.cp * Math.log(Tt3 / Tt2) - R * Math.log(Pt3 / Pt2),
      h: inputs.cp * Tt3,
    },
    {
      id: '4',
      name: '4: Cửa vào tuabin (Combustor Exit / Turbine Inlet)',
      P: Pt4,
      T: Tt4,
      v: (R * Tt4) / Pt4,
      s: inputs.cp * Math.log(Tt4 / Tt3) - R * Math.log(Pt4 / Pt3),
      h: inputs.cp * Tt4,
    },
    {
      id: '5',
      name: '5: Sau tuabin (Turbine Exit / Nozzle Inlet)',
      P: Pt5,
      T: Tt5,
      v: (R * Tt5) / Pt5,
      s: inputs.cp * Math.log(Tt5 / Tt4) - R * Math.log(Pt5 / Pt4),
      h: inputs.cp * Tt5,
    },
    {
      id: '9',
      name: '9: Luồng phụt tại miệng phun (Exhaust Nozzle Exit)',
      P: P_exit,
      T: T_exit,
      v: (R * T_exit) / P_exit,
      s: inputs.cp * Math.log(T_exit / Tt5) - R * Math.log(P_exit / Pt5),
      h: inputs.cp * T_exit,
    },
  ];

  const performance: TurbojetPerformance = {
    M0,
    V0,
    T0,
    P0,
    Tt0,
    Pt0,
    Tt2,
    Pt2,
    Tt3,
    Pt3,
    Tt4,
    Pt4,
    Tt5,
    Pt5,
    isChoked,
    P_critical,
    P_exit,
    T_exit,
    V_exit,
    A_exit,
    f,
    m_dot_fuel,
    F_momentum,
    F_pressure,
    F_net,
    specific_thrust,
    TSFC,
    TSFC_g_per_kNs,
    eta_prop,
    eta_thermal,
    eta_overall,
  };

  return {
    stations,
    performance,
    validation,
    R,
  };
}
