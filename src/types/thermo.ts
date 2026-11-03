export type SimulationMode = 'IDEAL' | 'REAL' | 'TURBOJET';

export type TemperatureUnit = 'K' | 'C';

export interface ThermoState {
  id: string; // "1", "2", "2s", "3", "4", "4s", "0", "9"
  name: string; // Vietnamese name with English terminology
  P: number; // [kPa]
  T: number; // [K]
  v: number; // [m^3/kg]
  s: number; // [kJ/(kg·K)]
  h: number; // [kJ/kg]
  isReference?: boolean; // For ideal reference states like 2s, 4s
}

export interface CyclePerformance {
  wc: number; // [kJ/kg]
  wt: number; // [kJ/kg]
  wnet: number; // [kJ/kg]
  qin: number; // [kJ/kg]
  qout: number; // [kJ/kg]
  eta_th: number; // Fraction 0 - 1
  eta_th_percent: number; // 0 - 100%
  eta_th_analytical?: number; // For ideal cycle
  BWR: number; // Back work ratio
  Wc_dot: number; // [kW]
  Wt_dot: number; // [kW]
  Wnet_dot: number; // [kW]
  Qin_dot: number; // [kW]
  Qout_dot: number; // [kW]
  energy_residual: number; // epsilon = (qin - qout) - wnet [kJ/kg]
  optimum_rp?: number; // rp for maximum net specific work
  // Real cycle parameters
  shaft_power?: number; // [kW]
  shaft_efficiency?: number; // Fraction
  entropy_gen_c?: number; // [kJ/(kg·K)]
  entropy_gen_t?: number; // [kJ/(kg·K)]
}

export interface TurbojetPerformance {
  M0: number; // Mach number
  V0: number; // Flight velocity [m/s]
  T0: number; // Static ambient temp [K]
  P0: number; // Static ambient pressure [kPa]
  Tt0: number; // Flight stagnation temp [K]
  Pt0: number; // Flight stagnation press [kPa]
  Tt2: number; // Compressor inlet stagnation temp [K]
  Pt2: number; // Compressor inlet stagnation press [kPa]
  Tt3: number; // Compressor outlet stagnation temp [K]
  Pt3: number; // Compressor outlet stagnation press [kPa]
  Tt4: number; // Combustor outlet stagnation temp [K]
  Pt4: number; // Combustor outlet stagnation press [kPa]
  Tt5: number; // Turbine outlet stagnation temp [K]
  Pt5: number; // Turbine outlet stagnation press [kPa]
  isChoked: boolean;
  P_critical: number; // [kPa]
  P_exit: number; // [kPa]
  T_exit: number; // [K]
  V_exit: number; // [m/s]
  A_exit: number; // [m^2]
  f: number; // Fuel-air ratio
  m_dot_fuel: number; // [kg/s]
  F_momentum: number; // [N]
  F_pressure: number; // [N]
  F_net: number; // [N]
  specific_thrust: number; // [N/(kg/s)]
  TSFC: number; // [kg/(N·s)]
  TSFC_g_per_kNs: number; // [g/(kN·s)]
  eta_prop: number; // Propulsive efficiency
  eta_thermal: number; // Thermal efficiency
  eta_overall: number; // Overall efficiency
}

export interface CycleInputs {
  // Basic
  T1: number; // [K]
  P1: number; // [kPa]
  rp: number; // Pressure ratio
  T3: number; // [K]
  gamma: number; // Specific heat ratio
  cp: number; // [kJ/(kg·K)]
  m_dot: number; // [kg/s]
  // Advanced
  eta_c: number; // Compressor isentropic efficiency
  eta_t: number; // Turbine isentropic efficiency
  delta_p: number; // Combustor pressure loss fraction
  eta_m: number; // Mechanical efficiency
  // Turbojet specific
  M0: number; // Flight Mach
  T0: number; // Ambient T [K]
  P0: number; // Ambient P [kPa]
  eta_diffuser: number; // Diffuser ram recovery
  eta_b: number; // Combustor burner efficiency
  eta_n: number; // Nozzle isentropic efficiency
  LHV: number; // Fuel lower heating value [kJ/kg] (default 43000 kJ/kg for Jet-A)
  nozzle_A_exit?: number; // Optional specified area [m^2]
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

