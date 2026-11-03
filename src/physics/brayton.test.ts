import { describe, it, expect } from 'vitest';
import { solveIdealBrayton } from './braytonIdeal';
import { solveRealBrayton } from './braytonReal';
import { solveTurbojet } from './propulsion';
import { CycleInputs } from '../types/thermo';

describe('Brayton Thermodynamic Cycle Tests', () => {
  const defaultInputs: CycleInputs = {
    T1: 300,
    P1: 100,
    rp: 8,
    T3: 1400,
    gamma: 1.4,
    cp: 1.005,
    m_dot: 10,
    eta_c: 0.85,
    eta_t: 0.88,
    delta_p: 0.04,
    eta_m: 0.98,
    M0: 0.8,
    T0: 216.65, // Standard stratosphere 11km
    P0: 22.63,
    eta_diffuser: 0.98,
    eta_b: 0.99,
    eta_n: 0.98,
    LHV: 43000,
  };

  it('TEST A: Ideal Cycle Baseline (T1=300, P1=100, rp=8, T3=1400, gamma=1.4, cp=1.005)', () => {
    const result = solveIdealBrayton(defaultInputs);
    const { states, performance } = result;

    const s1 = states.find((s) => s.id === '1')!;
    const s2 = states.find((s) => s.id === '2')!;
    const s3 = states.find((s) => s.id === '3')!;
    const s4 = states.find((s) => s.id === '4')!;

    // Pressures
    expect(s1.P).toBeCloseTo(100, 1);
    expect(s2.P).toBeCloseTo(800, 1);
    expect(s3.P).toBeCloseTo(800, 1);
    expect(s4.P).toBeCloseTo(100, 1);

    // Temperatures: T2 ~ 543.4 K, T4 ~ 772.8 K
    expect(s2.T).toBeGreaterThan(542);
    expect(s2.T).toBeLessThan(545);
    expect(s4.T).toBeGreaterThan(771);
    expect(s4.T).toBeLessThan(775);

    // Efficiency ~ 44.8%
    expect(performance.eta_th_percent).toBeGreaterThan(44.5);
    expect(performance.eta_th_percent).toBeLessThan(45.1);

    // Positive net specific work
    expect(performance.wnet).toBeGreaterThan(0);
    expect(performance.wt).toBeGreaterThan(performance.wc);

    // Energy balance residual ~ 0
    expect(Math.abs(performance.energy_residual)).toBeLessThan(1e-5);
  });

  it('TEST B: Ideal Efficiency matches analytical relation 1 - 1/rp^((gamma-1)/gamma)', () => {
    const rps = [2, 4, 8, 16, 25];
    for (const rp of rps) {
      const inputs = { ...defaultInputs, rp };
      const res = solveIdealBrayton(inputs);
      const analytical = 1 - 1 / Math.pow(rp, (inputs.gamma - 1) / inputs.gamma);
      expect(res.performance.eta_th).toBeCloseTo(analytical, 5);
    }
  });

  it('TEST C: Real Compressor Outlet T2_actual > T2_isentropic for eta_c < 1', () => {
    const res = solveRealBrayton(defaultInputs);
    const s2 = res.states.find((s) => s.id === '2')!;
    const s2s = res.referenceStates.state2s;

    expect(s2.T).toBeGreaterThan(s2s.T);
    expect(res.performance.wc).toBeGreaterThan(defaultInputs.cp * (s2s.T - defaultInputs.T1));
  });

  it('TEST D: Real Turbine Outlet T4_actual > T4_isentropic for eta_t < 1', () => {
    const res = solveRealBrayton(defaultInputs);
    const s4 = res.states.find((s) => s.id === '4')!;
    const s4s = res.referenceStates.state4s;

    expect(s4.T).toBeGreaterThan(s4s.T);
  });

  it('TEST E: Entropy increases in real compression & expansion, constant in ideal', () => {
    // Ideal
    const idealRes = solveIdealBrayton(defaultInputs);
    const [is1, is2, is3, is4] = idealRes.states;
    expect(is2.s).toBeCloseTo(is1.s, 6);
    expect(is4.s).toBeCloseTo(is3.s, 6);

    // Real
    const realRes = solveRealBrayton(defaultInputs);
    const [rs1, rs2, rs3, rs4] = realRes.states;
    expect(rs2.s).toBeGreaterThan(rs1.s);
    expect(rs4.s).toBeGreaterThan(rs3.s);
  });

  it('TEST F: Limiting & Edge Conditions (Zero Mach, rp=1.01, extreme rp)', () => {
    // Zero Mach Turbojet
    const tjStatic = solveTurbojet({ ...defaultInputs, M0: 0, T0: 288.15, P0: 101.3 });
    expect(tjStatic.performance.V0).toBe(0);
    expect(tjStatic.performance.F_net).toBeGreaterThan(0);
    expect(tjStatic.performance.eta_prop).toBe(0); // Zero useful propulsive power at standstill
    expect(isNaN(tjStatic.performance.F_net)).toBe(false);

    // Low rp = 1.01
    const lowRp = solveIdealBrayton({ ...defaultInputs, rp: 1.01 });
    expect(lowRp.performance.wnet).toBeGreaterThan(0);
    expect(isNaN(lowRp.performance.eta_th)).toBe(false);

    // Combustor delta_p pressure loss decreases turbine inlet pressure
    const realRes = solveRealBrayton(defaultInputs);
    const s2 = realRes.states.find((s) => s.id === '2')!;
    const s3 = realRes.states.find((s) => s.id === '3')!;
    expect(s3.P).toBeCloseTo(s2.P * (1 - defaultInputs.delta_p), 2);
  });
});
