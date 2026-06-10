// GlassERP Pro V2 Project Costing, Margins & Kanban Task Management

import { dbState } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';
import { showModal } from './operations.js';

let selectedProjectId = null; // Track currently selected project globally at module level

export function renderProjects(container) {
  const state = dbState.state;

  // Auto-select first project if nothing selected
  if (!selectedProjectId && state.projects.length > 0) {
    selectedProjectId = state.projects[0].project_id;
  }

  // Render Top Control Panel
  let controlPanelHtml = `
    <div class="glass-panel" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
      <div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">Projects Costing & Margins Control Board</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Track project contract values, costs, margins, and manage tasks</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <!-- Add Project Button -->
        <button class="btn btn-primary" id="btn-add-project" style="padding: 6px 12px; font-size: 0.85rem;">
          <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Add Project
        </button>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 25px;">
      ${controlPanelHtml}
      
      <!-- Primary Projects Selection Table -->
      <div class="glass-panel" style="padding: 24px;">
        <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="list" style="color: var(--accent-color); width: 16px; height: 16px;"></i>
          Projects Directory Registry
        </h4>
        <div id="projects-table-mount"></div>
      </div>

      <!-- Selected Project Details & Kanban Board Section -->
      <div id="selected-project-details-section"></div>
    </div>
  `;

  // Define table headers
  const headers = [
    { key: 'project_id', label: 'Project ID' },
    { key: 'name', label: 'Project Name' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'contract_value', label: 'Contract Value (₹)', render: val => inrFormat.format(val) },
    { key: 'accumulated_costs', label: 'Accumulated Costs (₹)', render: val => inrFormat.format(val) },
    { key: 'gross_margin', label: 'Gross Margin (₹)', render: val => inrFormat.format(val) },
    { key: 'margin_percentage', label: 'Margin (%)', render: val => `${val}%` },
    { key: 'status', label: 'Status', render: val => `<span class="badge ${val === 'Active' ? 'badge-debit' : val === 'Completed' ? 'badge-info' : 'badge-warning'}">${val}</span>` },
    { key: 'start_date', label: 'Start Date' }
  ];

  // Mount the GlassTable component
  const tableInstance = new GlassTable({
    container: container.querySelector('#projects-table-mount'),
    headers: headers,
    data: state.projects,
    onRowClick: (row) => {
      selectedProjectId = row.project_id;
      renderProjects(container);
    },
    onDeleteSelected: (selectedRows) => {
      const ids = selectedRows.map(row => row.project_id);
      dbState.deleteProjects(ids);
      if (ids.includes(selectedProjectId)) {
        selectedProjectId = null;
      }
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

  // Re-fetch project after possible deletion or load
  const detailsContainer = container.querySelector('#selected-project-details-section');
  const project = state.projects.find(p => p.project_id === selectedProjectId);

  if (!project) {
    detailsContainer.innerHTML = `
      <div class="glass-panel" style="padding: 40px; text-align: center; color: var(--text-secondary);">
        <i data-lucide="info" style="width: 36px; height: 36px; color: var(--accent-color); margin-bottom: 12px; vertical-align: middle;"></i>
        <p style="font-size: 0.95rem; font-weight: 600; margin-top: 8px;">No Project Selected</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Click on a project row in the table above to view details, financial costing, and manage tasks.</p>
      </div>
    `;
    bindControlPanelEvents(container);
    if (window.lucide) {
      window.lucide.createIcons();
    }
    return;
  }

  // Highlight selected project row in the GlassTable rendered body
  setTimeout(() => {
    const tableBody = container.querySelector('.table-body');
    if (tableBody) {
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach((tr, idx) => {
        const pageData = tableInstance.getCurrentPageData();
        const rowData = pageData[idx];
        if (rowData && rowData.project_id === selectedProjectId) {
          tr.style.background = 'var(--accent-light)';
          tr.style.borderLeft = '3px solid var(--accent-color)';
        }
      });
    }
  }, 30);

  // Financial costs logs for this project
  const costs = state.projectCosts.filter(c => c.project_id === project.project_id);
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const netProfit = project.contract_value - totalCosts;
  const marginPct = project.contract_value > 0 ? (netProfit / project.contract_value) * 100 : 0;

  detailsContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 25px;">
      
      <!-- Details Card -->
      <div class="glass-panel" style="padding: 24px; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 15px; flex-wrap: wrap; gap: 15px;">
          <div>
            <span style="font-size: 0.75rem; color: var(--accent-color); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Selected Project details</span>
            <h4 style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 4px 0 6px;">
              ${project.name}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">
              Project ID: <strong>${project.project_id}</strong> | Client: <strong>${project.client_name}</strong> | Start: ${project.start_date}
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <label for="select-project-status" style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Set Status:</label>
            <select id="select-project-status" style="padding: 5px 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-radius: var(--border-radius-sm);">
              <option value="Draft" ${project.status === 'Draft' ? 'selected' : ''}>Draft</option>
              <option value="Scheduled" ${project.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
          <div style="padding: 16px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm);">
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Contract Value (R)</span>
            <p style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${inrFormat.format(project.contract_value)}</p>
          </div>
          <div style="padding: 16px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm);">
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Accumulated Costs (C)</span>
            <p style="font-size: 1.2rem; font-weight: 700; color: var(--credit-color); margin-top: 2px;">${inrFormat.format(totalCosts)}</p>
          </div>
          <div style="padding: 16px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm);">
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Realized Margin</span>
            <p style="font-size: 1.2rem; font-weight: 800; color: ${netProfit >= 0 ? 'var(--debit-color)' : 'var(--credit-color)'}; margin-top: 2px;">
              ${inrFormat.format(netProfit)} (${marginPct.toFixed(1)}%)
            </p>
          </div>
        </div>

        <!-- Profit margin visual slider indicator -->
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">
            <span>Realized Margin Ratio</span>
            <span style="font-weight: 700; color: ${marginPct >= 30 ? 'var(--debit-color)' : 'var(--warning-color)'};">${marginPct.toFixed(1)}%</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--input-border); border-radius: 5px; overflow: hidden; position: relative;">
            <div style="width: ${Math.max(0, Math.min(100, marginPct))}%; height: 100%; background: ${marginPct >= 30 ? 'var(--debit-color)' : 'var(--warning-color)'}; border-radius: 5px;"></div>
          </div>
        </div>
      </div>

      <!-- Kanban Tasks Section -->
      <div class="glass-panel" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="kanban" style="color: var(--accent-color); width: 18px; height: 18px; vertical-align: middle;"></i>
              Project Task Board
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Trello-style drag & drop Kanban board for managing tasks</p>
          </div>
          <button class="btn btn-secondary" id="btn-add-task" style="padding: 5px 10px; font-size: 0.75rem;">
            <i data-lucide="plus" style="width: 12px; height: 12px;"></i> Add Task
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; align-items: start;">
          ${renderKanbanColumns(state, project.project_id)}
        </div>
      </div>

      <!-- Cost Line Items Table -->
      <div class="glass-panel" style="padding: 24px;">
        <h4 style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="coins" style="color: var(--accent-color); width: 18px; height: 18px; vertical-align: middle;"></i>
          Cost Line Items Details
        </h4>
        
        <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
          <table>
            <thead>
              <tr style="background: var(--table-header-bg);">
                <th style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">Date</th>
                <th style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">Category</th>
                <th style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">Description</th>
                <th style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); text-align: right;">Cost Amount</th>
              </tr>
            </thead>
            <tbody>
              ${costs.length === 0 
                ? `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">No costs tied to this installation pipeline yet.</td></tr>`
                : costs.map(c => `
                  <tr>
                    <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">${c.date}</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);"><span class="badge badge-warning" style="font-size: 0.65rem;">${c.category}</span></td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.description}</td>
                    <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); text-align: right; font-weight: 600; color: var(--credit-color);">${inrFormat.format(c.amount)}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Bind actions
  bindSelectedProjectEvents(container, project.project_id);
  bindControlPanelEvents(container);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderKanbanColumns(state, projectId) {
  const statuses = ['To Do', 'In Progress', 'Review', 'Done'];
  const projectTasks = (state.projectTasks || []).filter(t => t.project_id === projectId);
  let colsHtml = '';

  statuses.forEach(status => {
    const tasks = projectTasks.filter(t => t.status === status);
    let cardsHtml = '';

    tasks.forEach(t => {
      cardsHtml += `
        <div class="kanban-task-card" draggable="true" data-id="${t.id}" style="padding: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm); position: relative; cursor: grab; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Delete button in top-right -->
          <button class="btn-delete-task" data-id="${t.id}" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem;" title="Delete task">
            <i data-lucide="x" style="width: 12px; height: 12px;"></i>
          </button>
          
          <h5 style="font-weight: 700; font-size: 0.8rem; color: var(--text-primary); margin-bottom: 6px; padding-right: 15px; line-height: 1.3;">${t.name}</h5>
          ${t.description ? `<p style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.4; word-break: break-word; white-space: pre-wrap;">${t.description}</p>` : ''}
        </div>
      `;
    });

    colsHtml += `
      <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-glass); border-radius: var(--border-radius-sm); padding: 12px; display: flex; flex-direction: column; min-height: 280px; transition: background-color 0.2s;">
        <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 6px;">
          <span style="display: inline-flex; align-items: center; gap: 6px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${status === 'To Do' ? 'var(--text-muted)' : status === 'In Progress' ? 'var(--info-color)' : status === 'Review' ? 'var(--warning-color)' : 'var(--debit-color)'};"></span>
            ${status}
          </span>
          <span style="background: rgba(255, 255, 255, 0.05); padding: 1px 6px; border-radius: 10px; font-size: 0.65rem;">${tasks.length}</span>
        </h5>
        
        <div class="task-column-dropzone" data-status="${status}" style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px; min-height: 200px; padding: 4px 0;">
          ${cardsHtml || `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.7rem; padding: 25px 10px; border: 1px dashed var(--border-glass); border-radius: var(--border-radius-sm); background: rgba(255,255,255,0.002); margin: auto 0; pointer-events: none;">
              Empty column
            </div>
          `}
        </div>
      </div>
    `;
  });

  return colsHtml;
}

function bindControlPanelEvents(container) {
  // Add Project Button
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
              <select id="proj-status" required style="width:100%;">
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

      showHtmlModal('Add New Project', formHtml, (formEl) => {
        const payload = {
          name: formEl.querySelector('#proj-name').value.trim(),
          client_name: formEl.querySelector('#proj-client').value.trim(),
          contract_value: parseFloat(formEl.querySelector('#proj-value').value) || 0,
          status: formEl.querySelector('#proj-status').value,
          start_date: formEl.querySelector('#proj-start').value
        };

        if (!payload.name || !payload.client_name) {
          alert('Project Name and Client Name are required.');
          return false;
        }

        const created = dbState.createProject(payload);
        selectedProjectId = created.project_id;
        renderProjects(container);
        return true;
      });
    });
  }
}

function bindSelectedProjectEvents(container, projectId) {
  // Select Project Status Dropdown
  const selectStatus = container.querySelector('#select-project-status');
  if (selectStatus) {
    selectStatus.addEventListener('change', (e) => {
      dbState.updateProjectStatus(projectId, e.target.value);
    });
  }

  // Add Task Button
  const btnAddTask = container.querySelector('#btn-add-task');
  if (btnAddTask) {
    btnAddTask.addEventListener('click', () => {
      const formHtml = `
        <div style="text-align: left;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="task-name">Task Name *</label>
            <input type="text" id="task-name" class="form-control" placeholder="e.g. Verify site dimensions" required>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="task-desc">Task Description</label>
            <textarea id="task-desc" class="form-control" placeholder="Enter details..." style="min-height: 80px;" rows="3"></textarea>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="task-status">Initial Column *</label>
            <select id="task-status" style="width:100%;">
              <option value="To Do" selected>To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
      `;

      showHtmlModal('Add Project Task', formHtml, (formEl) => {
        const name = formEl.querySelector('#task-name').value.trim();
        const description = formEl.querySelector('#task-desc').value.trim();
        const status = formEl.querySelector('#task-status').value;

        if (!name) {
          alert('Task name is required.');
          return false;
        }

        dbState.createProjectTask({
          project_id: projectId,
          name: name,
          description: description,
          status: status
        });
        renderProjects(container);
        return true;
      });
    });
  }

  // Delete Task Card buttons
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.id;
      if (confirm('Are you sure you want to delete this task?')) {
        dbState.deleteProjectTask(taskId);
        renderProjects(container);
      }
    });
  });

  // Kanban HTML5 Drag and Drop Handlers
  const cards = container.querySelectorAll('.kanban-task-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      card.style.transform = 'scale(0.96)';
      card.style.opacity = '0.5';
      card.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
    });
    card.addEventListener('dragend', () => {
      card.style.transform = 'none';
      card.style.opacity = '1';
      card.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
    });
  });

  const dropzones = container.querySelectorAll('.task-column-dropzone');
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.parentElement.style.background = 'rgba(99, 102, 241, 0.04)';
      zone.parentElement.style.borderColor = 'var(--accent-color)';
    });

    zone.addEventListener('dragleave', () => {
      zone.parentElement.style.background = 'rgba(255,255,255,0.01)';
      zone.parentElement.style.borderColor = 'var(--border-glass)';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.parentElement.style.background = 'rgba(255,255,255,0.01)';
      zone.parentElement.style.borderColor = 'var(--border-glass)';
      
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = zone.dataset.status;
      
      if (taskId && newStatus) {
        dbState.updateProjectTaskStatus(taskId, newStatus);
        renderProjects(container);
      }
    });
  });
}

// Helper function to call showModal safely
function showHtmlModal(title, html, onConfirm) {
  showModal(title, html, onConfirm);
}
