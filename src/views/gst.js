// GlassERP Pro V2 GST Tax Compliance & Reporting Module

import { dbState, round, uuid } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';

export function renderGST(container) {
  const state = dbState.state;

  // Calculate dynamic totals
  let totalITC_CGST = 0;
  let totalITC_SGST = 0;
  let totalITC_IGST = 0;

  let totalOutput_CGST = 0;
  let totalOutput_SGST = 0;
  let totalOutput_IGST = 0;

  state.gstTransactions.forEach(t => {
    if (t.type === 'ITC') {
      totalITC_CGST = round(totalITC_CGST + (t.cgst || 0));
      totalITC_SGST = round(totalITC_SGST + (t.sgst || 0));
      totalITC_IGST = round(totalITC_IGST + (t.igst || 0));
    } else if (t.type === 'Output') {
      totalOutput_CGST = round(totalOutput_CGST + (t.cgst || 0));
      totalOutput_SGST = round(totalOutput_SGST + (t.sgst || 0));
      totalOutput_IGST = round(totalOutput_IGST + (t.igst || 0));
    }
  });

  const grandTotalITC = round(totalITC_CGST + totalITC_SGST + totalITC_IGST);
  const grandTotalOutput = round(totalOutput_CGST + totalOutput_SGST + totalOutput_IGST);
  const netLiability = round(grandTotalOutput - grandTotalITC);

  container.innerHTML = `
    <!-- Top summary split -->
    <div class="dashboard-grid" style="margin-bottom: 30px;">
      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>INPUT TAX CREDIT (ITC)</span>
          <i data-lucide="download" style="color: var(--debit-color);"></i>
        </div>
        <div class="card-value" style="color: var(--debit-color);">${inrFormat.format(grandTotalITC)}</div>
        <div class="card-trend" style="color: var(--text-secondary);">
          <span>CGST: ${inrFormat.format(totalITC_CGST)} | SGST: ${inrFormat.format(totalITC_SGST)} | IGST: ${inrFormat.format(totalITC_IGST)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>OUTPUT TAX LIABILITY</span>
          <i data-lucide="upload" style="color: var(--credit-color);"></i>
        </div>
        <div class="card-value" style="color: var(--credit-color);">${inrFormat.format(grandTotalOutput)}</div>
        <div class="card-trend" style="color: var(--text-secondary);">
          <span>CGST: ${inrFormat.format(totalOutput_CGST)} | SGST: ${inrFormat.format(totalOutput_SGST)} | IGST: ${inrFormat.format(totalOutput_IGST)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>NET PAYABLE / (REFUND)</span>
          <i data-lucide="calculator" style="color: var(--info-color);"></i>
        </div>
        <div class="card-value">${inrFormat.format(Math.abs(netLiability))}</div>
        <div class="card-trend ${netLiability <= 0 ? 'trend-up' : 'trend-down'}">
          <i data-lucide="${netLiability <= 0 ? 'shield-check' : 'alert-circle'}"></i>
          <span>${netLiability <= 0 ? 'Net Refund/ITC Receivable position' : 'Net Tax Due for filing cycle'}</span>
        </div>
      </div>
    </div>

    <!-- Main GST engine visual walkthrough flowchart -->
    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Transactions history log -->
      <div class="glass-panel">
        <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
          Tax Invoices & GST Transaction Register
        </h3>
        
        <div id="gst-table-mount"></div>
      </div>

      <!-- Flowchart details and parameters -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="glass-panel">
          <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">
            Active GSTIN Parameters
          </h3>
          
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Corporate GSTIN:</span><strong>${state.settings.gstin}</strong></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Registration State:</span><strong>State 27 (Maharashtra)</strong></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Filing Frequency:</span><strong>${state.settings.filingFrequency} Loop</strong></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Compliance Status:</span><span class="badge badge-debit" style="font-size: 0.75rem;">Active / Compliant</span></div>
          </div>
        </div>

        <div class="glass-panel" style="padding: 20px; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="git-branch" style="color: var(--accent-color);"></i>
            GST Inbound Document Flow
          </h4>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <p><strong>Step 1: Check applicability toggle:</strong> Outbound payments pass through a conditional tax state evaluator check.</p>
            <p><strong>Step 2: Split allocation rules:</strong> Transactions are routed to either a pure expense account or isolated into CGST/SGST/IGST tax hold buckets depending on vendor state match codes.</p>
            <p><strong>Step 3: Output balancing offset:</strong> System aggregates CGST/SGST/IGST balances in real-time to compute total ITC and off-sets it against output liability for filing reconciliation.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type', render: val => `<span class="badge ${val === 'ITC' ? 'badge-debit' : 'badge-credit'}">${val}</span>` },
    { key: 'invoice_no', label: 'Invoice Rrn' },
    { key: 'taxable_amount', label: 'Taxable Value', render: val => inrFormat.format(val) },
    { key: 'cgst', label: 'CGST (9%)', render: val => val > 0 ? inrFormat.format(val) : '--' },
    { key: 'sgst', label: 'SGST (9%)', render: val => val > 0 ? inrFormat.format(val) : '--' },
    { key: 'igst', label: 'IGST (18%)', render: val => val > 0 ? inrFormat.format(val) : '--' }
  ];

  new GlassTable({
    container: container.querySelector('#gst-table-mount'),
    headers: headers,
    data: state.gstTransactions,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        state.gstTransactions.push({
          gst_id: uuid(),
          entry_id: row.entry_id || uuid(),
          party_id: row.party_id || 'VARIOUS',
          date: row.date || new Date().toISOString().split('T')[0],
          invoice_no: row.invoice_no || row['invoice rrn'] || row['invoice no'] || '',
          gstin: row.gstin || '',
          rate: row.rate || '18',
          taxable_amount: parseFloat(String(row.taxable_amount || row['taxable value'] || '0').replace(/[^\d.]/g, '')) || 0,
          cgst: parseFloat(String(row.cgst || '0').replace(/[^\d.]/g, '')) || 0,
          sgst: parseFloat(String(row.sgst || '0').replace(/[^\d.]/g, '')) || 0,
          igst: parseFloat(String(row.igst || '0').replace(/[^\d.]/g, '')) || 0,
          type: row.type || 'ITC'
        });
      });
      dbState.saveState();
      renderGST(container);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
