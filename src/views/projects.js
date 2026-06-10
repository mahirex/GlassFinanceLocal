// GlassERP Pro V2 Project Costing & Margin Boards

import { dbState } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';

export function renderProjects(container) {
  const state = dbState.state;

  let projectsGridHtml = '';

  state.projects.forEach(p => {
    // Gather linked cost records
    const costs = state.projectCosts.filter(c => c.project_id === p.project_id);
    const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
    const netProfit = p.contract_value - totalCosts;
    const marginPct = p.contract_value > 0 ? (netProfit / p.contract_value) * 100 : 0;

    projectsGridHtml += `
      <div class="glass-panel" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 15px;">
          <div>
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              ${p.name}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">Client: <strong>${p.client_name}</strong> | Start: ${p.start_date}</p>
          </div>
          <span class="badge ${p.status === 'Active' ? 'badge-debit' : 'badge-info'}">${p.status}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Contract Value (R)</span>
            <p style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${inrFormat.format(p.contract_value)}</p>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Accumulated Costs (C)</span>
            <p style="font-size: 1.1rem; font-weight: 700; color: var(--credit-color); margin-top: 2px;">${inrFormat.format(totalCosts)}</p>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Realized Margin</span>
            <p style="font-size: 1.1rem; font-weight: 800; color: ${netProfit >= 0 ? 'var(--debit-color)' : 'var(--credit-color)'}; margin-top: 2px;">
              ${inrFormat.format(netProfit)} (${marginPct.toFixed(1)}%)
            </p>
          </div>
        </div>

        <!-- Profit margin visual slider indicator -->
        <div style="width: 100%; height: 6px; background: var(--input-border); border-radius: 5px; margin-bottom: 20px; overflow: hidden; position: relative;">
          <div style="width: ${Math.max(0, Math.min(100, marginPct))}%; height: 100%; background: ${marginPct >= 30 ? 'var(--debit-color)' : 'var(--warning-color)'}; border-radius: 5px;"></div>
        </div>

        <!-- Costs breakdown log for this project -->
        <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.03em;">
          Cost Line Items Details
        </h5>
        
        <div class="table-responsive" style="max-height: 150px; overflow-y: auto;">
          <table style="font-size: 0.8rem;">
            <thead>
              <tr style="background: transparent;">
                <th style="padding: 6px 12px; border-bottom: 1px solid var(--border-glass);">Date</th>
                <th style="padding: 6px 12px; border-bottom: 1px solid var(--border-glass);">Category</th>
                <th style="padding: 6px 12px; border-bottom: 1px solid var(--border-glass);">Description</th>
                <th style="padding: 6px 12px; border-bottom: 1px solid var(--border-glass); text-align: right;">Cost Amount</th>
              </tr>
            </thead>
            <tbody>
              ${costs.length === 0 
                ? `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 12px;">No costs tied to this installation pipeline yet.</td></tr>`
                : costs.map(c => `
                  <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-glass);">${c.date}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-glass);"><span class="badge badge-warning" style="font-size: 0.65rem;">${c.category}</span></td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-glass); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.description}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid var(--border-glass); text-align: right; font-weight: 600; color: var(--credit-color);">${inrFormat.format(c.amount)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <!-- Projects Main layout -->
    <div style="display: flex; flex-direction: column; gap: 25px;">
      ${projectsGridHtml}
    </div>

    <!-- Projects Table Mount -->
    <div class="glass-panel" style="padding: 24px; margin-top: 25px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
        Projects Directory Registry
      </h3>
      <div id="projects-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'project_id', label: 'Project ID' },
    { key: 'name', label: 'Project Name' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'contract_value', label: 'Contract Value (₹)', render: val => inrFormat.format(val) },
    { key: 'accumulated_costs', label: 'Accumulated Costs (₹)', render: val => inrFormat.format(val) },
    { key: 'gross_margin', label: 'Gross Margin (₹)', render: val => inrFormat.format(val) },
    { key: 'margin_percentage', label: 'Margin (%)', render: val => `${val}%` },
    { key: 'status', label: 'Status' },
    { key: 'start_date', label: 'Start Date' }
  ];

  new GlassTable({
    container: container.querySelector('#projects-table-mount'),
    headers: headers,
    data: state.projects,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createProject({
          project_id: row.project_id || row['project id'] || '',
          name: row.name || row['project name'] || '',
          client_name: row.client_name || row['client name'] || '',
          contract_value: parseFloat(String(row.contract_value || row['contract value'] || '0').replace(/[^\d.]/g, '')) || 0,
          accumulated_costs: parseFloat(String(row.accumulated_costs || row['accumulated costs'] || '0').replace(/[^\d.]/g, '')) || 0,
          status: row.status || 'Active',
          start_date: row.start_date || row['start date'] || ''
        });
      });
      renderProjects(container);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
