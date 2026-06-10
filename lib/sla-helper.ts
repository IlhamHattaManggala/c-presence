/**
 * Helper to calculate SLA scores for KCI C-Presence
 */

/**
 * Calculates Nilai Awal Dinas (max 40) based on minutes late.
 * @param minutesLate Minutes late (positive if late, negative/0 if on time)
 */
export function calculateAwalDinas(minutesLate: number): number {
  if (minutesLate <= 0) {
    return 50; // 100% of 50
  } else if (minutesLate <= 5) {
    return 47.5; // 95% of 50
  } else if (minutesLate <= 10) {
    return 45; // 90% of 50
  } else if (minutesLate <= 15) {
    return 42.5; // 85% of 50
  } else if (minutesLate <= 20) {
    return 40; // 80% of 50
  } else if (minutesLate <= 60) {
    return 37.5; // 75% of 50
  } else {
    return 0; // > 60 minutes late = 0
  }
}

/**
 * Calculates Nilai Akhir Dinas (max 50) based on minutes early departure.
 * @param minutesEarly Minutes early (positive if left early, negative/0 if on time)
 */
export function calculateAkhirDinas(minutesEarly: number): number {
  if (minutesEarly <= 0) {
    return 50; // 100% of 50
  } else if (minutesEarly <= 5) {
    return 47.5; // 95% of 50
  } else if (minutesEarly <= 10) {
    return 45; // 90% of 50
  } else if (minutesEarly <= 15) {
    return 42.5; // 85% of 50
  } else if (minutesEarly <= 20) {
    return 40; // 80% of 50
  } else if (minutesEarly <= 60) {
    return 37.5; // 75% of 50
  } else {
    return 0; // > 60 minutes early = 0
  }
}

/**
 * Parses time string like "HH:mm:ss" or "HH:mm" into total minutes from start of day.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Calculates difference in minutes between actual time and scheduled time.
 */
export function getMinutesDifference(actualTime: string, scheduledTime: string): number {
  const actualMin = timeToMinutes(actualTime);
  const scheduledMin = timeToMinutes(scheduledTime);
  return actualMin - scheduledMin;
}
