import HeatmapMap from '../components/HeatmapMap';

export function PublicHeatmap() {
  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26 }}>Public Citizen Live Heatmap</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)' }}>
          Privacy-safe density view with shelter pins. Exact incident coordinates are not shown.
        </p>
      </div>

      <HeatmapMap viewMode="public" height="calc(100vh - 190px)" />
    </div>
  );
}
