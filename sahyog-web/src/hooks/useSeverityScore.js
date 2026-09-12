export function calculateSeverityScore({
  activeNeeds = 0,
  avgPriority = 0,
  avgDelayMinutes = 0,
}) {
  const score =
    Number(activeNeeds) * 0.5 +
    Number(avgPriority) * 0.3 +
    Number(avgDelayMinutes) * 0.2;

  return Number.isFinite(score) ? Number(score.toFixed(2)) : 0;
}

export function severityBand(score) {
  const value = Number(score) || 0;
  if (value <= 30) return { label: 'Green', color: 'green' };
  if (value <= 60) return { label: 'Yellow', color: 'yellow' };
  return { label: 'Red', color: 'red' };
}

export function resolveSeverityScore(zone = {}) {
  const precomputed = Number(zone.severity_score);
  if (Number.isFinite(precomputed) && precomputed > 0) return precomputed;

  return calculateSeverityScore({
    activeNeeds: zone.active_needs_count ?? zone.active_needs ?? 0,
    avgPriority: zone.avg_priority ?? zone.average_priority ?? 0,
    avgDelayMinutes: zone.avg_delay_minutes ?? zone.average_delay_minutes ?? 0,
  });
}
