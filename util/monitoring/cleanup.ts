// Minimal internal telemetry/queue placeholders for cleanup failures.
// Replace with your real logger/metrics/queue integrations as needed.

export type CleanupFailureEvent = {
  userId: string;
  bucket: string;
  object: string;
  error: string;
  context: string; // e.g., 'avatar-remove', 'avatar-replace', 'banner-remove'
  time?: string; // ISO timestamp
};

export function incrementCleanupMetric(labels: {
  bucket: string;
  context: string;
}) {
  try {
    // Hook into your metrics system here (StatsD/Prom, etc.)
    // eslint-disable-next-line no-console
    console.info("[metrics] cleanup_failure_total", labels);
  } catch {}
}

export async function recordCleanupFailure(event: CleanupFailureEvent) {
  const withTime = { ...event, time: event.time ?? new Date().toISOString() };
  try {
    // Send to your log drain / SIEM / APM here
    // eslint-disable-next-line no-console
    console.warn("[cleanup-failures]", withTime);
  } catch {}
}

export async function enqueueCleanupTask(task: {
  bucket: string;
  object: string;
  reason: string;
  attempts?: number;
}) {
  try {
    // Push to your background queue here for retry (e.g., Edge Function, Job Queue)
    // eslint-disable-next-line no-console
    console.info("[enqueue-cleanup]", {
      ...task,
      enqueuedAt: new Date().toISOString(),
    });
  } catch {}
}
