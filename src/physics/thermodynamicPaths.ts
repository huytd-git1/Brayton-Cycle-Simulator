import { ThermoState } from '../types/thermo';

export interface CurvePoint2D {
  x: number;
  y: number;
  label?: string;
}

export interface CyclePaths {
  tsPath: CurvePoint2D[];
  pvPath: CurvePoint2D[];
  idealTsPath?: CurvePoint2D[];
  idealPvPath?: CurvePoint2D[];
  isobarsTs: { p: number; points: CurvePoint2D[] }[];
}

/**
 * Generate smooth continuous isobar curve on T-s plane:
 * s(T) = s_ref + cp * ln(T / T_ref)
 */
export function generateIsobarTs(
  T_start: number,
  T_end: number,
  s_start: number,
  cp: number,
  steps: number = 30
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  const dt = (T_end - T_start) / steps;
  for (let i = 0; i <= steps; i++) {
    const T = T_start + i * dt;
    const s = s_start + cp * Math.log(T / T_start);
    points.push({ x: s, y: T });
  }
  return points;
}

/**
 * Generate smooth isentropic line on T-s plane: vertical line s = constant
 */
export function generateIsentropicTs(
  T_start: number,
  T_end: number,
  s_const: number,
  steps: number = 20
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  const dt = (T_end - T_start) / steps;
  for (let i = 0; i <= steps; i++) {
    const T = T_start + i * dt;
    points.push({ x: s_const, y: T });
  }
  return points;
}

/**
 * Generate real irreversible path on T-s plane (entropy increases smoothly):
 * Uses quadratic / smooth monotonic progression from (s_start, T_start) to (s_end, T_end).
 */
export function generateIrreversibleTs(
  s_start: number,
  T_start: number,
  s_end: number,
  T_end: number,
  steps: number = 30
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 to 1
    // Smooth monotonic Hermite or power blend
    const smoothT = t * t * (3 - 2 * t);
    const T = T_start + t * (T_end - T_start);
    const s = s_start + smoothT * (s_end - s_start);
    points.push({ x: s, y: T });
  }
  return points;
}

/**
 * Generate isentropic curve on P-v plane:
 * P * v^gamma = const => P(v) = P_start * (v_start / v)^gamma
 */
export function generateIsentropicPv(
  v_start: number,
  v_end: number,
  P_start: number,
  gamma: number,
  steps: number = 30
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  const dv = (v_end - v_start) / steps;
  for (let i = 0; i <= steps; i++) {
    const v = v_start + i * dv;
    const P = P_start * Math.pow(v_start / v, gamma);
    points.push({ x: v, y: P });
  }
  return points;
}

/**
 * Generate isobaric horizontal line on P-v plane:
 * P = constant, v goes from v_start to v_end
 */
export function generateIsobarPv(
  v_start: number,
  v_end: number,
  P_const: number,
  steps: number = 20
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  const dv = (v_end - v_start) / steps;
  for (let i = 0; i <= steps; i++) {
    const v = v_start + i * dv;
    points.push({ x: v, y: P_const });
  }
  return points;
}

/**
 * Generate real irreversible path on P-v plane:
 * Uses polytropic equivalent P * v^n = const fitted to endpoints (v_start, P_start) and (v_end, P_end)
 */
export function generatePolytropicPv(
  v_start: number,
  v_end: number,
  P_start: number,
  P_end: number,
  steps: number = 30
): CurvePoint2D[] {
  const points: CurvePoint2D[] = [];
  let n = 1.35;
  if (Math.abs(v_end - v_start) > 1e-5 && Math.abs(P_end - P_start) > 1e-5) {
    const ratioV = v_start / v_end;
    const ratioP = P_end / P_start;
    if (ratioV > 0 && ratioP > 0 && Math.abs(Math.log(ratioV)) > 1e-4) {
      n = Math.log(ratioP) / Math.log(ratioV);
    }
  }

  const dv = (v_end - v_start) / steps;
  for (let i = 0; i <= steps; i++) {
    const v = v_start + i * dv;
    const P = P_start * Math.pow(v_start / v, n);
    points.push({ x: v, y: P });
  }
  return points;
}

/**
 * Construct full cycle closed paths for Ideal Brayton
 */
export function buildIdealPaths(
  states: ThermoState[],
  cp: number,
  gamma: number
): CyclePaths {
  if (states.length < 4) {
    return { tsPath: [], pvPath: [], isobarsTs: [] };
  }
  const [s1, s2, s3, s4] = states;

  // T-s segments
  // 1 -> 2: Isentropic compression (vertical)
  const ts_1_2 = generateIsentropicTs(s1.T, s2.T, s1.s, 20);
  // 2 -> 3: Isobaric heat addition
  const ts_2_3 = generateIsobarTs(s2.T, s3.T, s2.s, cp, 30);
  // 3 -> 4: Isentropic expansion (vertical)
  const ts_3_4 = generateIsentropicTs(s3.T, s4.T, s3.s, 20);
  // 4 -> 1: Isobaric heat rejection
  const ts_4_1 = generateIsobarTs(s4.T, s1.T, s4.s, cp, 30);

  const tsPath = [...ts_1_2, ...ts_2_3, ...ts_3_4, ...ts_4_1];

  // P-v segments
  // 1 -> 2: Isentropic compression
  const pv_1_2 = generateIsentropicPv(s1.v, s2.v, s1.P, gamma, 25);
  // 2 -> 3: Isobaric heating (P2 = const)
  const pv_2_3 = generateIsobarPv(s2.v, s3.v, s2.P, 20);
  // 3 -> 4: Isentropic expansion
  const pv_3_4 = generateIsentropicPv(s3.v, s4.v, s3.P, gamma, 25);
  // 4 -> 1: Isobaric cooling (P1 = const)
  const pv_4_1 = generateIsobarPv(s4.v, s1.v, s1.P, 20);

  const pvPath = [...pv_1_2, ...pv_2_3, ...pv_3_4, ...pv_4_1];

  // Background isobars
  const T_min = Math.max(s1.T * 0.8, 150);
  const T_max = Math.min(s3.T * 1.15, 2500);
  const isobarsTs = [
    { p: s1.P, points: generateIsobarTs(T_min, T_max, 0, cp, 40) },
    {
      p: s2.P,
      points: generateIsobarTs(
        T_min,
        T_max,
        -((cp * (gamma - 1)) / gamma) * Math.log(s2.P / s1.P),
        cp,
        40
      ),
    },
  ];

  return { tsPath, pvPath, isobarsTs };
}

/**
 * Construct full cycle paths for Real Brayton
 */
export function buildRealPaths(
  states: ThermoState[],
  refStates: { state2s: ThermoState; state4s: ThermoState },
  cp: number,
  gamma: number
): CyclePaths {
  const [s1, s2, s3, s4] = states;
  const { state2s, state4s } = refStates;

  // Real T-s path
  const ts_1_2 = generateIrreversibleTs(s1.s, s1.T, s2.s, s2.T, 25);
  const ts_2_3 = generateIsobarTs(s2.T, s3.T, s2.s, cp, 30);
  const ts_3_4 = generateIrreversibleTs(s3.s, s3.T, s4.s, s4.T, 25);
  const ts_4_1 = generateIsobarTs(s4.T, s1.T, s4.s, cp, 30);
  const tsPath = [...ts_1_2, ...ts_2_3, ...ts_3_4, ...ts_4_1];

  // Ideal reference T-s path
  const ideal_ts_1_2 = generateIsentropicTs(s1.T, state2s.T, s1.s, 20);
  const ideal_ts_2_3 = generateIsobarTs(state2s.T, s3.T, state2s.s, cp, 25);
  const ideal_ts_3_4 = generateIsentropicTs(s3.T, state4s.T, s3.s, 20);
  const ideal_ts_4_1 = generateIsobarTs(state4s.T, s1.T, state4s.s, cp, 25);
  const idealTsPath = [...ideal_ts_1_2, ...ideal_ts_2_3, ...ideal_ts_3_4, ...ideal_ts_4_1];

  // Real P-v path
  const pv_1_2 = generatePolytropicPv(s1.v, s2.v, s1.P, s2.P, 25);
  const pv_2_3 = generateIsobarPv(s2.v, s3.v, s3.P, 20);
  const pv_3_4 = generatePolytropicPv(s3.v, s4.v, s3.P, s4.P, 25);
  const pv_4_1 = generateIsobarPv(s4.v, s1.v, s1.P, 20);
  const pvPath = [...pv_1_2, ...pv_2_3, ...pv_3_4, ...pv_4_1];

  // Ideal reference P-v path
  const ideal_pv_1_2 = generateIsentropicPv(s1.v, state2s.v, s1.P, gamma, 25);
  const ideal_pv_2_3 = generateIsobarPv(state2s.v, s3.v, s2.P, 20);
  const ideal_pv_3_4 = generateIsentropicPv(s3.v, state4s.v, s3.P, gamma, 25);
  const ideal_pv_4_1 = generateIsobarPv(state4s.v, s1.v, s1.P, 20);
  const idealPvPath = [...ideal_pv_1_2, ...ideal_pv_2_3, ...ideal_pv_3_4, ...ideal_pv_4_1];

  const T_min = Math.max(s1.T * 0.8, 150);
  const T_max = Math.min(s3.T * 1.15, 2500);
  const isobarsTs = [
    { p: s1.P, points: generateIsobarTs(T_min, T_max, 0, cp, 40) },
    {
      p: s2.P,
      points: generateIsobarTs(
        T_min,
        T_max,
        -((cp * (gamma - 1)) / gamma) * Math.log(s2.P / s1.P),
        cp,
        40
      ),
    },
  ];

  return { tsPath, pvPath, idealTsPath, idealPvPath, isobarsTs };
}
