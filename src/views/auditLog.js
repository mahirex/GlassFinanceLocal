// GlassERP Pro V2 Audit Logging Viewer

import { dbState } from '../state.js';

export function renderAuditLog(container) {
  const state = dbState.state;

  let auditItemsHtml = '';

  if (state.auditLogs.length === 0) {
    auditItemsHtml = `
      <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
        <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--debit-color); margin-bottom: 10px; opacity: 0.6;"></i>
        <p>Audit Log is clean. No system mutations recorded yet.</p>
      </div>
    `;
  } else {
    state.auditLogs.forEach((log, index) => {
      const formattedTime = new Date(log.timestamp).toLocaleString();
      
      // Compute formatted Pre-State / Post-State
      const preJson = JSON.stringify(log.pre_state, null, 2);
      const postJson = JSON.stringify(log.post_state, null, 2);

      auditItemsHtml += `
        <div class="glass-panel" style="padding: 15px; background: rgba(255, 255, 255, 0.01); margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
            <div>
              <span class="badge badge-warning" style="font-size: 0.75rem;">${log.action_type}</span>
              <strong style="margin-left: 8px; font-size: 0.9rem;">Target: ${log.target_entity}</strong>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              <span>Actor: <strong>${log.actor_id}</strong></span> | 
              <span>${formattedTime}</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <button class="btn btn-secondary btn-toggle-diff" data-index="${index}" style="padding: 4px 10px; font-size: 0.75rem;">
              <i data-lucide="eye" style="width: 12px; height: 12px; margin-right: 4px;"></i> View JSON Mutation Diff
            </button>
          </div>

          <!-- Diff Container (collapsed by default) -->
          <div id="diff-box-${index}" style="display: none; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; border-top: 1px dashed var(--border-glass); padding-top: 12px;">
            <div>
              <span style="font-size: 0.75rem; color: var(--credit-color); font-weight: 700; text-transform: uppercase;">Pre-State Image</span>
              <pre class="code-diff" style="margin-top: 5px; max-height: 250px; border-color: var(--credit-color); color: #fca5a5;">${preJson}</pre>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--debit-color); font-weight: 700; text-transform: uppercase;">Post-State Image</span>
              <pre class="code-diff" style="margin-top: 5px; max-height: 250px; border-color: var(--debit-color); color: #a7f3d0;">${postJson}</pre>
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
        <i data-lucide="shield-alert" style="color: var(--warning-color);"></i>
        Append-Only Immutable System Audit Trails
      </h3>

      <div style="display: flex; flex-direction: column; gap: 15px;">
        ${auditItemsHtml}
      </div>
    </div>
  `;

  // Register toggler listeners
  container.querySelectorAll('.btn-toggle-diff').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = btn.getAttribute('data-index');
      const box = container.querySelector(`#diff-box-${idx}`);
      if (box.style.display === 'none') {
        box.style.display = 'grid';
        btn.innerHTML = `<i data-lucide="eye-off" style="width: 12px; height: 12px; margin-right: 4px;"></i> Hide Mutation JSON`;
      } else {
        box.style.display = 'none';
        btn.innerHTML = `<i data-lucide="eye" style="width: 12px; height: 12px; margin-right: 4px;"></i> View JSON Mutation Diff`;
      }
      if (window.lucide) window.lucide.createIcons();
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
