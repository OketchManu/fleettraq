/** Poll interval for fleet lists — avoids constant onSnapshot reads on Spark plan. */
export const FLEET_POLL_MS = 3 * 60 * 1000;
/** Slower poll while quota pause is active. */
export const FLEET_POLL_QUOTA_MS = 10 * 60 * 1000;
