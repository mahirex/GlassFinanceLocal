// GlassERP Pro V2 Project Costing & Margin Boards

import { dbState } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';
import { showModal } from './operations.js';

let currentProjectsView = 'table'; // Persisted at module level

export function renderProjects(container) {
  const state = dbState.state;

  // Render Top Control Panel
  let controlPanelHtml = `
    <div class="glass-panel" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
      <div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">Projects Costing & Margins Control Board</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Track project contract values, costs, and profit margins</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <!-- Add Project Button -->
        <button class="btn btn-primary" id="btn-add-project" style="padding: 6px 12px; font-size: 0.85rem;">
          <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Add Project
        </button>
        
        <!-- Table vs Kanban Toggle -->
        <div style="display: flex; background: rgba(255, 255, 255, 0.03); padding: 4px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-glass);">
          <button class="btn ${currentProjectsView === 'table' ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-table" style="padding: 4px 10px; font-size: 0.75rem; border: none; margin: 0; cursor: pointer;">Table View</button>
          <button class="btn ${currentProjectsView === 'kanban' ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-kanban" style="padding: 4px 10px; font-size: 0.75rem; border: none; margin: 0; cursor: pointer;">Kanban Board</button>
        </div>
      </div>
    </div>
  `;

  if (currentProjectsView === 'table') {
    // ------------------ TABLE & GRID VIEW ------------------
    let projectsGridHtml = '';

    state.projects.forEach(p => {
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
            <span class="badge ${p.status === 'Active' ? 'badge-debit' : p.status === 'Completed' ? 'badge-info' : 'badge-warning'}">${p.status}</span>
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
      <div style="display: flex; flex-direction: column; gap: 25px;">
        ${controlPanelHtml}
        
        <div style="display: flex; flex-direction: column; gap: 25px;">
          ${projectsGridHtml}
        </div>

        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
            Projects Directory Registry
          </h3>
          <div id="projects-table-mount"></div>
        </div>
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
      onDeleteSelected: (selectedRows) => {
        const ids = selectedRows.map(row => row.project_id);
        dbState.deleteProjects(ids);
        renderProjects(container);
      },
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

  } else {
    // ------------------ DRAG & DROP KANBAN VIEW ------------------
    const statuses = ['Draft', 'Scheduled', 'Active', 'Completed'];
    let columnsHtml = '';

    statuses.forEach(status => {
      const statusProjects = state.projects.filter(p => p.status === status);
      let cardsHtml = '';

      statusProjects.forEach(p => {
        const costs = state.projectCosts.filter(c => c.project_id === p.project_id);
        const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
        const netProfit = p.contract_value - totalCosts;

        cardsHtml += `
          <div class="kanban-card" draggable="true" data-id="${p.project_id}" style="padding: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm); margin-bottom: 12px; cursor: grab; transition: transform 0.2s, box-shadow 0.2s;">
            <h5 style="font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; color: var(--text-primary); font-family: var(--font-heading);">${p.name}</h5>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">Client: ${p.client_name}</p>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; border-top: 1px dashed var(--border-glass); padding-top: 8px;">
              <div>
                <span style="color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase;">Contract</span>
                <span style="font-weight: 600; display: block; color: var(--text-primary); margin-top: 1px;">${inrFormat.format(p.contract_value)}</span>
              </div>
              <div style="text-align: right;">
                <span style="color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase;">Margin</span>
                <span style="font-weight: 600; display: block; color: ${netProfit >= 0 ? 'var(--debit-color)' : 'var(--credit-color)'}; margin-top: 1px;">${inrFormat.format(netProfit)}</span>
              </div>
            </div>
          </div>
        `;
      });

      columnsHtml += `
        <div class="glass-panel" style="padding: 16px; display: flex; flex-direction: column; min-height: 500px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">
            <span>${status}</span>
            <span style="background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 20px; font-size: 0.75rem;">${statusProjects.length}</span>
          </h4>
          <div class="kanban-cards-container" data-status="${status}" style="flex-grow: 1; min-height: 400px; display: flex; flex-direction: column; gap: 8px;">
            ${cardsHtml || `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 30px 10px; border: 1px dashed var(--border-glass); border-radius: 6px; background: rgba(255, 255, 255, 0.005);">No projects in this stage</div>`}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 25px;">
        ${controlPanelHtml}
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; align-items: start;">
          ${columnsHtml}
        </div>
      </div>
    `;

    // Hook HTML5 Drag and Drop events
    const cards = container.querySelectorAll('.kanban-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.style.transform = 'scale(0.98)';
        card.style.opacity = '0.6';
      });
      card.addEventListener('dragend', () => {
        card.style.transform = 'none';
        card.style.opacity = '1';
      });
    });

    const columns = container.querySelectorAll('.kanban-cards-container');
    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.style.background = 'rgba(255, 255, 255, 0.015)';
        col.style.borderRadius = '6px';
      });
      col.addEventListener('dragleave', () => {
        col.style.background = 'transparent';
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.style.background = 'transparent';
        const projectId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        if (projectId && newStatus) {
          dbState.updateProjectStatus(projectId, newStatus);
        }
      });
    });
  }

  // Hook toggle buttons
  container.querySelector('#btn-toggle-table').addEventListener('click', () => {
    currentProjectsView = 'table';
    renderProjects(container);
  });
  container.querySelector('#btn-toggle-kanban').addEventListener('click', () => {
    currentProjectsView = 'kanban';
    renderProjects(container);
  });

  // Hook Add Project Button
  const btnAddProject = container.querySelector('#btn-add-project');
  if (btnAddProject) {
    btnAddProject.addEventListener('click', () => {
      const today = new Date().toISOString().split('T')[0];
      const formHtml = `
        <div style="text-align: left;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="proj-name">Project Name *</label>
            <input type="text" id="proj-name" class="form-control" placeholder="e.g. Imperial Tower Glazing" required>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="proj-client">Client Name *</label>
            <input type="text" id="proj-client" class="form-control" placeholder="e.g. Tata Realty" required>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="proj-value">Contract Value (₹) *</label>
              <input type="number" step="0.01" id="proj-value" class="form-control" placeholder="1000000" required>
            </div>
            <div class="form-group">
              <label for="proj-status">Status *</label>
              <select id="proj-status" required>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Active" selected>Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="proj-start">Start Date *</label>
            <input type="date" id="proj-start" class="form-control" value="${today}" required>
          </div>
        </div>
      `;

      showModal('Add New Project', formHtml, (formEl) => {
        try {
          const payload = {
            name: formEl.querySelector('#proj-name').value,
            client_name: formEl.querySelector('#proj-client').value,
            contract_value: parseFloat(formEl.querySelector('#proj-value').value) || 0,
            status: formEl.querySelector('#proj-status').value,
            start_date: formEl.querySelector('#proj-start').value
          };

          dbState.createProject(payload);
          renderProjects(container);
          return true;
        } catch (err) {
          alert(err.message);
          return false;
        }
      });
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
