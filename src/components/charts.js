// GlassERP Pro V2 Pure SVG Chart Utilities

export function renderLineChart(container, labels, values, options = {}) {
  const width = options.width || 500;
  const height = options.height || 220;
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const maxVal = Math.max(...values, 1000) * 1.1;
  const minVal = 0;

  // Grid lines and coordinates
  let gridLinesHtml = '';
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const ratio = i / gridSteps;
    const y = padding + graphHeight * (1 - ratio);
    const val = minVal + (maxVal - minVal) * ratio;
    
    // Horizontal gridline
    gridLinesHtml += `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-glass)" stroke-width="1" stroke-dasharray="4" />
      <text x="${padding - 8}" y="${y + 4}" fill="var(--text-secondary)" font-size="10" text-anchor="end" font-family="var(--font-body)">₹${Math.round(val / 1000)}k</text>
    `;
  }

  // Points & Path calculations
  let points = [];
  let pointsHtml = '';
  labels.forEach((label, i) => {
    const x = padding + (i / (labels.length - 1 || 1)) * graphWidth;
    const y = padding + graphHeight * (1 - (values[i] - minVal) / (maxVal - minVal));
    points.push({ x, y, label, val: values[i] });

    pointsHtml += `
      <circle cx="${x}" cy="${y}" r="4" fill="var(--accent-color)" stroke="var(--bg-app)" stroke-width="2" class="chart-point" style="cursor: pointer;">
        <title>${label}: ₹${values[i].toLocaleString()}</title>
      </circle>
      <text x="${x}" y="${height - padding + 18}" fill="var(--text-secondary)" font-size="10" text-anchor="middle" font-family="var(--font-body)">${label}</text>
    `;
  });

  // Calculate SVG polyline path
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <!-- Background Area Gradient -->
      <defs>
        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-color)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--accent-color)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Grid and labels -->
      ${gridLinesHtml}

      <!-- Fill area under curve -->
      ${points.length > 0 ? `<path d="${areaD}" fill="url(#chart-area-grad)" />` : ''}

      <!-- Line path -->
      ${points.length > 0 ? `<path d="${pathD}" fill="none" stroke="var(--accent-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}

      <!-- Points nodes -->
      ${pointsHtml}
    </svg>
  `;
}

export function renderDoughnutChart(container, labels, values, colors = []) {
  const width = 300;
  const height = 220;
  const cx = 110;
  const cy = 110;
  const r = 65;
  const w = 22; // stroke width

  const total = values.reduce((sum, v) => sum + v, 0);

  let arcsHtml = '';
  let legendHtml = '<div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; font-size: 0.85rem;">';
  
  if (total === 0) {
    arcsHtml = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-glass)" stroke-width="${w}" />`;
    legendHtml += `<div style="color: var(--text-muted);">No records available</div>`;
  } else {
    let accumulatedAngle = -90; // start at top

    labels.forEach((label, i) => {
      const val = values[i];
      if (val <= 0) return;
      
      const pct = val / total;
      const angle = pct * 360;
      
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const rad = Math.PI / 180;
      const x1 = cx + r * Math.cos(startAngle * rad);
      const y1 = cy + r * Math.sin(startAngle * rad);
      const x2 = cx + r * Math.cos(endAngle * rad);
      const y2 = cy + r * Math.sin(endAngle * rad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

      const color = colors[i] || `hsl(${220 + i * 40}, 70%, 60%)`;

      arcsHtml += `
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" style="cursor: pointer; transition: stroke-width 0.2s;">
          <title>${label}: ₹${val.toLocaleString()} (${Math.round(pct * 100)}%)</title>
        </path>
      `;

      legendHtml += `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 3px; background-color: ${color};"></span>
          <span style="font-weight: 500; color: var(--text-primary); flex: 1;">${label}</span>
          <span style="font-weight: 600; color: var(--text-secondary);">${Math.round(pct * 100)}%</span>
        </div>
      `;
    });
  }

  legendHtml += '</div>';

  container.style.display = 'flex';
  container.style.gap = '20px';
  container.innerHTML = `
    <div style="flex: 1; max-width: 200px;">
      <svg viewBox="0 0 ${cx * 2} ${cy * 2}" style="width: 100%; height: 100%;">
        ${arcsHtml}
        <!-- Core text -->
        <text x="${cx}" y="${cy + 5}" fill="var(--text-primary)" font-size="12" font-weight="700" text-anchor="middle" font-family="var(--font-heading)">TOTAL</text>
        <text x="${cx}" y="${cy + 22}" fill="var(--text-secondary)" font-size="10" text-anchor="middle" font-family="var(--font-body)">₹${Math.round(total / 1000)}k</text>
      </svg>
    </div>
    ${legendHtml}
  `;
}
