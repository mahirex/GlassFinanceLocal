// GlassERP Pro V2 Corporate & Accounting settings

import { dbState } from '../state.js';

export function renderSettings(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Company Profile Details Form -->
      <div class="glass-panel">
        <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="building" style="color: var(--accent-color);"></i>
          Company Profile & Tax Settings
        </h3>

        <form id="profile-settings-form">
          <div style="margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 5px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">Corporate Identity</h4>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="set-company">Registered Company Name *</label>
            <input type="text" id="set-company" class="form-control" value="${state.settings.companyName || ''}" required>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="set-address">Registered Address</label>
            <textarea id="set-address" class="form-control" style="min-height: 60px; font-family: inherit; font-size: 0.85rem;" rows="2">${state.settings.companyAddress || ''}</textarea>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="set-phone">Phone / Mobile</label>
              <input type="text" id="set-phone" class="form-control" value="${state.settings.companyPhone || ''}">
            </div>
            <div class="form-group">
              <label for="set-email">Email Address</label>
              <input type="email" id="set-email" class="form-control" value="${state.settings.companyEmail || ''}">
            </div>
          </div>

          <div style="margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 5px; margin-top: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">GST & Tax Parameters</h4>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="set-gstin">Company GSTIN *</label>
              <input type="text" id="set-gstin" class="form-control" value="${state.settings.gstin || ''}" required>
            </div>
            <div class="form-group">
              <label for="set-state">GST State Code Location *</label>
              <select id="set-state" style="width:100%;">
                <option value="27" ${state.settings.gstStateCode === '27' ? 'selected' : ''}>State 27 - Maharashtra</option>
                <option value="29" ${state.settings.gstStateCode === '29' ? 'selected' : ''}>State 29 - Karnataka</option>
                <option value="07" ${state.settings.gstStateCode === '07' ? 'selected' : ''}>State 07 - Delhi NCR</option>
                <option value="24" ${state.settings.gstStateCode === '24' ? 'selected' : ''}>State 24 - Gujarat</option>
              </select>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="set-freq">Filing Frequency Loop</label>
            <select id="set-freq" style="width:100%;">
              <option value="Monthly" ${state.settings.filingFrequency === 'Monthly' ? 'selected' : ''}>Monthly filing loop</option>
              <option value="Quarterly" ${state.settings.filingFrequency === 'Quarterly' ? 'selected' : ''}>Quarterly filing loop</option>
            </select>
          </div>

          <div style="margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 5px; margin-top: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">Treasury Bank Details (Invoice Declaration)</h4>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="set-bank-name">Bank Name</label>
              <input type="text" id="set-bank-name" class="form-control" value="${state.settings.bankName || ''}">
            </div>
            <div class="form-group">
              <label for="set-bank-acc-name">Account Name (Beneficiary)</label>
              <input type="text" id="set-bank-acc-name" class="form-control" value="${state.settings.bankAccName || ''}">
            </div>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="set-bank-acc-no">Account Number</label>
              <input type="text" id="set-bank-acc-no" class="form-control" value="${state.settings.bankAccNo || ''}">
            </div>
            <div class="form-group">
              <label for="set-bank-ifsc">IFSC Code</label>
              <input type="text" id="set-bank-ifsc" class="form-control" value="${state.settings.bankIfsc || ''}">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="set-bank-branch">Branch Details</label>
            <input type="text" id="set-bank-branch" class="form-control" value="${state.settings.bankBranch || ''}">
          </div>

          <div style="margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 5px; margin-top: 20px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">Standard Terms & Conditions</h4>
          </div>
          <div class="form-group" style="margin-bottom: 15px;">
            <label for="set-terms">Terms (One rule per line)</label>
            <textarea id="set-terms" class="form-control" style="min-height: 80px; font-family: inherit; font-size: 0.85rem;" rows="3">${state.settings.termsAndConditions || ''}</textarea>
          </div>

          <div id="settings-feedback" style="display: none; padding: 10px; border-radius: var(--border-radius-sm); font-size: 0.85rem; font-weight: 600; margin-bottom: 12px;"></div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;"><i data-lucide="save"></i> Save Profile Settings</button>
        </form>
      </div>

      <!-- Payment Types Accounting Mappings -->
      <div class="glass-panel">
        <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="git-commit" style="color: var(--accent-color);"></i>
          Dynamic Outbound Payment Type Mappings
        </h3>
        
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.4;">
          Configure administrative outbound categories and map transactions to designated system general ledger branches (e.g. mapping Outbound Rent payments to the Rent Expense account block).
        </p>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Mapped Ledger Branch Segment</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">Office Space Rent</td>
                <td style="font-family: monospace; font-size: 0.85rem; color: var(--accent-color);">Rent Expense Account</td>
                <td><span class="badge badge-debit">Active</span></td>
                <td style="text-align: right;"><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">Edit Map</button></td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Electricity / Utility</td>
                <td style="font-family: monospace; font-size: 0.85rem; color: var(--accent-color);">Utilities Expense Account</td>
                <td><span class="badge badge-debit">Active</span></td>
                <td style="text-align: right;"><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">Edit Map</button></td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Machine / Tool Repair</td>
                <td style="font-family: monospace; font-size: 0.85rem; color: var(--accent-color);">Fixed Asset Maintenance</td>
                <td><span class="badge badge-debit">Active</span></td>
                <td style="text-align: right;"><button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;">Edit Map</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#profile-settings-form');
  const feedback = container.querySelector('#settings-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.style.display = 'none';

    const newName = container.querySelector('#set-company').value;
    const newAddress = container.querySelector('#set-address').value;
    const newPhone = container.querySelector('#set-phone').value;
    const newEmail = container.querySelector('#set-email').value;
    const newGstin = container.querySelector('#set-gstin').value;
    const newState = container.querySelector('#set-state').value;
    const newFreq = container.querySelector('#set-freq').value;
    const newBankName = container.querySelector('#set-bank-name').value;
    const newBankAccName = container.querySelector('#set-bank-acc-name').value;
    const newBankAccNo = container.querySelector('#set-bank-acc-no').value;
    const newBankIfsc = container.querySelector('#set-bank-ifsc').value;
    const newBankBranch = container.querySelector('#set-bank-branch').value;
    const newTerms = container.querySelector('#set-terms').value;

    dbState.updateSettings({
      companyName: newName,
      companyAddress: newAddress,
      companyPhone: newPhone,
      companyEmail: newEmail,
      companyGstin: newGstin,
      gstin: newGstin,
      gstStateCode: newState,
      filingFrequency: newFreq,
      bankName: newBankName,
      bankAccName: newBankAccName,
      bankAccNo: newBankAccNo,
      bankIfsc: newBankIfsc,
      bankBranch: newBankBranch,
      termsAndConditions: newTerms
    });

    feedback.style.background = 'var(--debit-bg)';
    feedback.style.color = 'var(--debit-color)';
    feedback.textContent = 'Settings updated and saved successfully!';
    feedback.style.display = 'block';

    setTimeout(() => {
      feedback.style.display = 'none';
    }, 2000);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
