import { TemperatureUnit } from '../types/thermo';

/**
 * Calculates consistent gas constant R in kJ/(kg·K)
 * R = cp * (gamma - 1) / gamma
 */
export function calculateGasConstantR(cp: number, gamma: number): number {
  if (gamma <= 1) return 0.287; // fallback air
  return (cp * (gamma - 1)) / gamma;
}

/**
 * Convert Kelvin to target unit
 */
export function convertTemp(k: number, unit: TemperatureUnit): number {
  if (unit === 'C') {
    return k - 273.15;
  }
  return k;
}

/**
 * Convert target unit to Kelvin
 */
export function toKelvin(val: number, unit: TemperatureUnit): number {
  if (unit === 'C') {
    return val + 273.15;
  }
  return val;
}

/**
 * Format temperature with unit
 */
export function formatTemp(k: number, unit: TemperatureUnit, decimals: number = 1): string {
  if (isNaN(k) || !isFinite(k)) return '—';
  const val = convertTemp(k, unit);
  return `${val.toFixed(decimals)} ${unit === 'C' ? '°C' : 'K'}`;
}

/**
 * Format power dynamically to kW or MW
 */
export function formatPower(kw: number): { value: string; unit: string } {
  if (isNaN(kw) || !isFinite(kw)) return { value: '—', unit: 'kW' };
  if (Math.abs(kw) >= 10000) {
    return { value: (kw / 1000).toFixed(2), unit: 'MW' };
  }
  return { value: kw.toFixed(1), unit: 'kW' };
}

/**
 * Format general number with fallback
 */
export function formatNum(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return '—';
  return val.toFixed(decimals);
}

