// GlassERP Pro V2 Corporate & Accounting settings

import { dbState } from '../state.js';
import { showModal } from './operations.js';

let currentSettingsTab = 'profile'; // Tab persist at module level

export function renderSettings(container) {
  const state = dbState.state;

  // Initialize paymentTypeMappings defensively if missing
  if (!state.settings.paymentTypeMappings) {
    state.settings.paymentTypeMappings = {
      "Rent": "Rent Expense Account",
      "Utility": "Utilities Expense Account",
      "Machine Repair": "Fixed Asset Maintenance"
    };
    dbState.saveState();
  }

  // Render Sub-Tabs
  let tabsHtml = `
    <div class="tab-list" style="margin-bottom: 25px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px; display: flex; gap: 10px;">
      <button class="tab-btn ${currentSettingsTab === 'profile' ? 'active' : ''}" id="btn-tab-profile" style="cursor: pointer;">Company Profile</button>
      <button class="tab-btn ${currentSettingsTab === 'payment-types' ? 'active' : ''}" id="btn-tab-payment-types" style="cursor: pointer;">Payment Types Mappings</button>
    </div>
  `;

  if (currentSettingsTab === 'profile') {
    // ------------------ PROFILE TAB ------------------
    container.innerHTML = `
      ${tabsHtml}
      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; flex-wrap: wrap;">
        
        <!-- Company Profile Details Form -->
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <i data-lucide="building" style="color: var(--accent-color); width: 18px; height: 18px;"></i>
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

        <!-- Corporate Registration Declarations -->
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">
            Corporate Registration Declarations
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 15px;">
            Configure official corporate details, local GSTIN identification numbers, and default bank account wiring to print on outbound invoice quotes.
          </p>
          <div style="padding: 15px; background: rgba(255,255,255,0.01); border: 1px dashed var(--border-glass); border-radius: var(--border-radius-sm); font-size: 0.8rem; color: var(--text-secondary);">
            Verify and match place of supply GST rates: Maharashtra (27), Karnataka (29), Delhi NCR (07), Gujarat (24).
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#profile-settings-form');
    const feedback = container.querySelector('#settings-feedback');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.style.display = 'none';

      dbState.updateSettings({
        companyName: container.querySelector('#set-company').value,
        companyAddress: container.querySelector('#set-address').value,
        companyPhone: container.querySelector('#set-phone').value,
        companyEmail: container.querySelector('#set-email').value,
        companyGstin: container.querySelector('#set-gstin').value,
        gstin: container.querySelector('#set-gstin').value,
        gstStateCode: container.querySelector('#set-state').value,
        filingFrequency: container.querySelector('#set-freq').value,
        bankName: container.querySelector('#set-bank-name').value,
        bankAccName: container.querySelector('#set-bank-acc-name').value,
        bankAccNo: container.querySelector('#set-bank-acc-no').value,
        bankIfsc: container.querySelector('#set-bank-ifsc').value,
        bankBranch: container.querySelector('#set-bank-branch').value,
        termsAndConditions: container.querySelector('#set-terms').value
      });

      feedback.style.background = 'var(--debit-bg)';
      feedback.style.color = 'var(--debit-color)';
      feedback.textContent = 'Settings updated and saved successfully!';
      feedback.style.display = 'block';

      setTimeout(() => {
        feedback.style.display = 'none';
      }, 2000);
    });

  } else {
    // ------------------ PAYMENT TYPES TAB ------------------
    let mappingsRows = '';
    const mappings = state.settings.paymentTypeMappings || {};
    
    Object.entries(mappings).forEach(([category, ledgerAcc]) => {
      mappingsRows += `
        <tr style="border-bottom: 1px solid var(--border-glass);">
          <td style="font-weight: 600; padding: 12px 14px;">${category}</td>
          <td style="font-family: monospace; font-size: 0.85rem; color: var(--accent-color); padding: 12px 14px;">${ledgerAcc}</td>
          <td style="padding: 12px 14px;"><span class="badge badge-debit">Active</span></td>
          <td style="text-align: right; padding: 12px 14px; display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-edit-mapping" data-category="${category}" data-ledger="${ledgerAcc}" style="padding: 4px 8px; font-size: 0.75rem; cursor: pointer;"><i data-lucide="edit-2" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>Edit</button>
            <button class="btn btn-secondary btn-delete-mapping" data-category="${category}" style="padding: 4px 8px; font-size: 0.75rem; color: var(--credit-color); cursor: pointer;"><i data-lucide="trash-2" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>Delete</button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      ${tabsHtml}
      <div class="glass-panel" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="git-commit" style="color: var(--accent-color); width: 18px; height: 18px;"></i>
              Dynamic Outbound Payment Type Mappings
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
              Configure outbound categories and map transactions to designated system general ledger branches
            </p>
          </div>
          <button class="btn btn-primary" id="btn-add-mapping" style="padding: 6px 12px; font-size: 0.8rem; cursor: pointer;">
            <i data-lucide="plus" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Add Mapping
          </button>
        </div>
        
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th style="padding: 10px 14px;">Category Name</th>
                <th style="padding: 10px 14px;">Mapped Ledger Branch Segment</th>
                <th style="padding: 10px 14px;">Status</th>
                <th style="text-align: right; padding: 10px 14px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${mappingsRows || `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">No custom payment mappings configured yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Add Mapping
    container.querySelector('#btn-add-mapping').addEventListener('click', () => {
      const formHtml = `
        <div style="text-align: left;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="map-category">Category Name *</label>
            <input type="text" id="map-category" class="form-control" placeholder="e.g. Rent, Electricity" required>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="map-ledger">Mapped Ledger Account Name *</label>
            <input type="text" id="map-ledger" class="form-control" placeholder="e.g. Rent Expense Account" required>
          </div>
        </div>
      `;

      showModal('Add Payment Category Mapping', formHtml, (formEl) => {
        const cat = formEl.querySelector('#map-category').value.trim();
        const led = formEl.querySelector('#map-ledger').value.trim();
        if (cat && led) {
          state.settings.paymentTypeMappings[cat] = led;
          dbState.saveState();
          renderSettings(container);
          return true;
        }
        return false;
      });
    });

    // Bind Edit Mapping
    container.querySelectorAll('.btn-edit-mapping').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        const ledger = btn.dataset.ledger;
        
        const formHtml = `
          <div style="text-align: left;">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="map-category">Category Name *</label>
              <input type="text" id="map-category" class="form-control" value="${category}" required>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="map-ledger">Mapped Ledger Account Name *</label>
              <input type="text" id="map-ledger" class="form-control" value="${ledger}" required>
            </div>
          </div>
        `;

        showModal('Edit Payment Category Mapping', formHtml, (formEl) => {
          const newCat = formEl.querySelector('#map-category').value.trim();
          const newLed = formEl.querySelector('#map-ledger').value.trim();
          if (newCat && newLed) {
            if (newCat !== category) {
              delete state.settings.paymentTypeMappings[category];
            }
            state.settings.paymentTypeMappings[newCat] = newLed;
            dbState.saveState();
            renderSettings(container);
            return true;
          }
          return false;
        });
      });
    });

    // Bind Delete Mapping
    container.querySelectorAll('.btn-delete-mapping').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        if (confirm(`Are you sure you want to delete the mapping for "${category}"?`)) {
          delete state.settings.paymentTypeMappings[category];
          dbState.saveState();
          renderSettings(container);
        }
      });
    });
  }

  // Hook Tab Switches
  const tabProfile = container.querySelector('#btn-tab-profile');
  const tabPayment = container.querySelector('#btn-tab-payment-types');

  if (tabProfile && tabPayment) {
    tabProfile.addEventListener('click', () => {
      currentSettingsTab = 'profile';
      renderSettings(container);
    });
    tabPayment.addEventListener('click', () => {
      currentSettingsTab = 'payment-types';
      renderSettings(container);
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
