import { dbState, uuid, syncDataToOfflineFileStorage } from '../state.js';
import { showModal } from './operations.js';
import { GlassTable } from '../components/table.js';

let currentSettingsTab = 'profile'; // Tab persist at module level
let settingsFeedbackMessage = '';

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
      <button class="tab-btn ${currentSettingsTab === 'database' ? 'active' : ''}" id="btn-tab-database" style="cursor: pointer;">Local Database</button>
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
            <div style="margin-bottom: 18px; border-bottom: 1px solid var(--border-glass); padding-bottom: 5px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">Corporate Identity</h4>
            </div>

            <!-- Logo Upload Section -->
            <div style="margin-bottom: 18px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-glass); border-radius: var(--border-radius-sm);">
              <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div id="logo-preview-wrap" style="width: 80px; height: 80px; background: rgba(99,102,241,0.08); border: 2px dashed var(--border-glass); border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                  ${state.settings.companyLogo
                    ? `<img src="${state.settings.companyLogo}" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:8px;">`
                    : `<i data-lucide="image" style="width:30px; height:30px; color: var(--text-muted);"></i>`
                  }
                </div>
                <div style="flex: 1;">
                  <p style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Company Logo</p>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4;">Upload your logo — it will appear on all printed quotations. Recommended: PNG/JPG, square, max 2MB.</p>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <label for="logo-upload-input" class="btn btn-secondary" style="cursor: pointer; padding: 6px 14px; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; margin: 0;">
                      <i data-lucide="upload" style="width: 14px; height: 14px;"></i> Upload Logo
                    </label>
                    <input type="file" id="logo-upload-input" accept="image/*" style="display: none;">
                    ${state.settings.companyLogo ? `<button type="button" id="btn-remove-logo" class="btn" style="padding: 6px 12px; font-size: 0.78rem; background: var(--credit-bg); color: var(--credit-color); border: 1px solid var(--credit-color); border-radius: var(--border-radius-sm);">Remove</button>` : ''}
                  </div>
                </div>
              </div>
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
                <label for="set-gst-rate">Default GST Rate (%) *</label>
                <input type="number" id="set-gst-rate" class="form-control" value="${state.settings.defaultGstRate || 18}" required>
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="set-state">GST State Code Location *</label>
              <select id="set-state" style="width:100%;">
                <option value="01" ${state.settings.gstStateCode === '01' ? 'selected' : ''}>State 01 - Jammu & Kashmir</option>
                <option value="02" ${state.settings.gstStateCode === '02' ? 'selected' : ''}>State 02 - Himachal Pradesh</option>
                <option value="03" ${state.settings.gstStateCode === '03' ? 'selected' : ''}>State 03 - Punjab</option>
                <option value="04" ${state.settings.gstStateCode === '04' ? 'selected' : ''}>State 04 - Chandigarh</option>
                <option value="05" ${state.settings.gstStateCode === '05' ? 'selected' : ''}>State 05 - Uttarakhand</option>
                <option value="06" ${state.settings.gstStateCode === '06' ? 'selected' : ''}>State 06 - Haryana</option>
                <option value="07" ${state.settings.gstStateCode === '07' ? 'selected' : ''}>State 07 - Delhi</option>
                <option value="08" ${state.settings.gstStateCode === '08' ? 'selected' : ''}>State 08 - Rajasthan</option>
                <option value="09" ${state.settings.gstStateCode === '09' ? 'selected' : ''}>State 09 - Uttar Pradesh</option>
                <option value="10" ${state.settings.gstStateCode === '10' ? 'selected' : ''}>State 10 - Bihar</option>
                <option value="11" ${state.settings.gstStateCode === '11' ? 'selected' : ''}>State 11 - Sikkim</option>
                <option value="12" ${state.settings.gstStateCode === '12' ? 'selected' : ''}>State 12 - Arunachal Pradesh</option>
                <option value="13" ${state.settings.gstStateCode === '13' ? 'selected' : ''}>State 13 - Nagaland</option>
                <option value="14" ${state.settings.gstStateCode === '14' ? 'selected' : ''}>State 14 - Manipur</option>
                <option value="15" ${state.settings.gstStateCode === '15' ? 'selected' : ''}>State 15 - Mizoram</option>
                <option value="16" ${state.settings.gstStateCode === '16' ? 'selected' : ''}>State 16 - Tripura</option>
                <option value="17" ${state.settings.gstStateCode === '17' ? 'selected' : ''}>State 17 - Meghalaya</option>
                <option value="18" ${state.settings.gstStateCode === '18' ? 'selected' : ''}>State 18 - Assam</option>
                <option value="19" ${state.settings.gstStateCode === '19' ? 'selected' : ''}>State 19 - West Bengal</option>
                <option value="20" ${state.settings.gstStateCode === '20' ? 'selected' : ''}>State 20 - Jharkhand</option>
                <option value="21" ${state.settings.gstStateCode === '21' ? 'selected' : ''}>State 21 - Odisha</option>
                <option value="22" ${state.settings.gstStateCode === '22' ? 'selected' : ''}>State 22 - Chhattisgarh</option>
                <option value="23" ${state.settings.gstStateCode === '23' ? 'selected' : ''}>State 23 - Madhya Pradesh</option>
                <option value="24" ${state.settings.gstStateCode === '24' ? 'selected' : ''}>State 24 - Gujarat</option>
                <option value="25" ${state.settings.gstStateCode === '25' ? 'selected' : ''}>State 25 - Daman & Diu</option>
                <option value="26" ${state.settings.gstStateCode === '26' ? 'selected' : ''}>State 26 - Dadra & Nagar Haveli</option>
                <option value="27" ${state.settings.gstStateCode === '27' ? 'selected' : ''}>State 27 - Maharashtra</option>
                <option value="28" ${state.settings.gstStateCode === '28' ? 'selected' : ''}>State 28 - Andhra Pradesh (Old)</option>
                <option value="29" ${state.settings.gstStateCode === '29' ? 'selected' : ''}>State 29 - Karnataka</option>
                <option value="30" ${state.settings.gstStateCode === '30' ? 'selected' : ''}>State 30 - Goa</option>
                <option value="31" ${state.settings.gstStateCode === '31' ? 'selected' : ''}>State 31 - Lakshadweep</option>
                <option value="32" ${state.settings.gstStateCode === '32' ? 'selected' : ''}>State 32 - Kerala</option>
                <option value="33" ${state.settings.gstStateCode === '33' ? 'selected' : ''}>State 33 - Tamil Nadu</option>
                <option value="34" ${state.settings.gstStateCode === '34' ? 'selected' : ''}>State 34 - Puducherry</option>
                <option value="35" ${state.settings.gstStateCode === '35' ? 'selected' : ''}>State 35 - Andaman & Nicobar Islands</option>
                <option value="36" ${state.settings.gstStateCode === '36' ? 'selected' : ''}>State 36 - Telangana</option>
                <option value="37" ${state.settings.gstStateCode === '37' ? 'selected' : ''}>State 37 - Andhra Pradesh (New)</option>
                <option value="38" ${state.settings.gstStateCode === '38' ? 'selected' : ''}>State 38 - Ladakh</option>
                <option value="custom" ${['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38'].indexOf(state.settings.gstStateCode) === -1 ? 'selected' : ''}>Other / Custom State Code</option>
              </select>
            </div>

            <!-- Custom State Code Input Section -->
            <div id="custom-state-code-wrapper" style="display: ${['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38'].indexOf(state.settings.gstStateCode) === -1 ? 'block' : 'none'}; margin-bottom: 12px; transition: var(--transition-smooth);">
              <div class="form-group">
                <label for="set-custom-state">Enter Custom GST State Code *</label>
                <input type="text" id="set-custom-state" class="form-control" value="${state.settings.gstStateCode || ''}" placeholder="e.g. 99" maxlength="2">
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Provide a 2-digit Indian GST State/UT numeric identifier code.</p>
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

            <div id="settings-feedback" style="display: ${settingsFeedbackMessage ? 'block' : 'none'}; padding: 10px; border-radius: var(--border-radius-sm); font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; background: var(--debit-bg); color: var(--debit-color);">${settingsFeedbackMessage}</div>

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
            Verify and match place of supply GST rates across all Indian states and union territories.
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#profile-settings-form');
    const feedback = container.querySelector('#settings-feedback');
    const selectState = container.querySelector('#set-state');
    const customWrapper = container.querySelector('#custom-state-code-wrapper');
    const inputCustomState = container.querySelector('#set-custom-state');

    if (selectState && customWrapper && inputCustomState) {
      selectState.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
          customWrapper.style.display = 'block';
          inputCustomState.required = true;
        } else {
          customWrapper.style.display = 'none';
          inputCustomState.required = false;
        }
      });
    }

    // Logo upload handler
    let pendingLogoDataUrl = null;
    const logoInput = container.querySelector('#logo-upload-input');
    const logoPreviewWrap = container.querySelector('#logo-preview-wrap');
    if (logoInput && logoPreviewWrap) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          alert('Logo file is too large. Please use an image under 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          pendingLogoDataUrl = ev.target.result;
          logoPreviewWrap.innerHTML = `<img src="${pendingLogoDataUrl}" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
      });
    }

    // Remove logo handler
    const btnRemoveLogo = container.querySelector('#btn-remove-logo');
    if (btnRemoveLogo && logoPreviewWrap) {
      btnRemoveLogo.addEventListener('click', () => {
        pendingLogoDataUrl = '__REMOVE__';
        logoPreviewWrap.innerHTML = `<i data-lucide="image" style="width:30px; height:30px; color: var(--text-muted);"></i>`;
        if (window.lucide) window.lucide.createIcons();
        btnRemoveLogo.style.display = 'none';
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedback.style.display = 'none';

      const finalStateCode = selectState.value === 'custom' ? inputCustomState.value.trim() : selectState.value;
      if (selectState.value === 'custom' && (!finalStateCode || finalStateCode.length !== 2 || isNaN(finalStateCode))) {
        alert('Please enter a valid 2-digit numeric GST state code.');
        return;
      }

      settingsFeedbackMessage = 'Settings updated and saved successfully!';

      const logoToSave = pendingLogoDataUrl === '__REMOVE__'
        ? null
        : (pendingLogoDataUrl || dbState.state.settings.companyLogo || null);

      dbState.updateSettings({
        companyName: container.querySelector('#set-company').value,
        companyAddress: container.querySelector('#set-address').value,
        companyPhone: container.querySelector('#set-phone').value,
        companyEmail: container.querySelector('#set-email').value,
        companyGstin: container.querySelector('#set-gstin').value,
        gstin: container.querySelector('#set-gstin').value,
        gstStateCode: finalStateCode,
        defaultGstRate: parseInt(container.querySelector('#set-gst-rate').value) || 18,
        filingFrequency: container.querySelector('#set-freq').value,
        bankName: container.querySelector('#set-bank-name').value,
        bankAccName: container.querySelector('#set-bank-acc-name').value,
        bankAccNo: container.querySelector('#set-bank-acc-no').value,
        bankIfsc: container.querySelector('#set-bank-ifsc').value,
        bankBranch: container.querySelector('#set-bank-branch').value,
        termsAndConditions: container.querySelector('#set-terms').value,
        companyLogo: logoToSave
      });

      pendingLogoDataUrl = null;

      setTimeout(() => {
        settingsFeedbackMessage = '';
        const feedbackEl = container.querySelector('#settings-feedback');
        if (feedbackEl) feedbackEl.style.display = 'none';
      }, 3000);
    });

  } else if (currentSettingsTab === 'payment-types') {
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
  } else if (currentSettingsTab === 'database') {
    // ------------------ LOCAL DATABASE TAB ------------------
    const folderName = localStorage.getItem('duckdb_local_folder_name') || '';
    const lastSyncTime = localStorage.getItem('duckdb_last_sync_timestamp') || 'Never';

    container.innerHTML = `
      ${tabsHtml}
      <div class="glass-panel" style="padding: 24px; margin-bottom: 25px;">
        <div style="border-bottom: 1px solid var(--border-glass); margin-bottom: 20px; padding-bottom: 10px;">
          <h2 style="font-size: 1.15rem; font-weight: 900; text-transform: uppercase; tracking-wider; margin: 0 0 5px 0; color: var(--accent-color);">🎛️ Hybrid Triple-Engine Database Controller</h2>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Synchronized pipeline bridging cloud storage instances (Supabase & Turso Cloud) with local device files.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <!-- SELECTION BOX: CHOOSE COMPUTER LOCATION -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: var(--warning-color); display: block; margin-bottom: 6px;">Local PC File Sync Engine</span>
              <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">Select Active Computer Storage Target Folder</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px 0;">
                Select an isolated local folder directory. The app will write binary data matrices to a fallback tracking file inside your directory.
              </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 0.75rem;">
                <span style="color: var(--text-muted); text-transform: uppercase;">Linked Directory:</span>
                <span id="lbl-folder-name" style="font-weight: 700; color: var(--text-primary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${folderName || '🔴 NO FOLDER SELECTED'}</span>
              </div>

              <button type="button" id="btn-select-folder" class="btn btn-primary" style="width: 100%; font-weight: 700; py: 10px; text-transform: uppercase; font-size: 0.8rem;">
                📁 Locate & Connect Storage Folder
              </button>
            </div>
          </div>

          <!-- PORTER CONTROLS: DATA UTILITIES HUB -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: var(--info-color); display: block; margin-bottom: 6px;">Backup Utilities Portal</span>
              <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">Manual Data Migration Interchange</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px 0;">
                Instantly export current local cache environments out to universally formatted text blobs or ingest existing CSV backups.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <label class="btn btn-secondary" style="cursor: pointer; padding: 10px; text-align: center; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; margin: 0; display: flex; align-items: center; justify-content: center; gap: 6px; background: var(--debit-bg); color: var(--debit-color); border: 1px solid rgba(16, 185, 129, 0.2);">
                📥 Import CSV File
                <input type="file" id="btn-import-csv" accept=".csv" style="display: none;">
              </label>

              <button type="button" id="btn-export-csv-action" class="btn" style="padding: 10px; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: var(--border-radius-sm);">
                📤 Export CSV Blob
              </button>
            </div>
          </div>
        </div>

        <!-- METRIC STATUS OVERVIEW BAR -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-family: monospace; color: var(--text-muted);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="pulse-dot" style="height: 8px; width: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
            <span>Active Engines: Supabase (Cloud) + Turso (Edge) + DuckDB Engine (Local PC File storage)</span>
          </div>
          <div>
            <span>Last Hard-Drive Sync: <b id="lbl-sync-time" style="color: var(--text-primary); font-weight: 700;">${lastSyncTime}</b></span>
          </div>
        </div>
      </div>

      <!-- Live logs table mount -->
      <div class="glass-panel" style="padding: 24px;">
        <h3 style="font-size: 1rem; font-weight: 700; margin: 0 0 15px 0; color: var(--text-primary);">Current Database System Logs</h3>
        <div id="logs-table-mount"></div>
      </div>
    `;

    // Define table columns matching the CSV layout
    const headersList = [
      { key: 'date', label: 'Date' },
      { key: 'hardwareName', label: 'Hardware Name' },
      { key: 'partyName', label: 'Party Name' },
      { key: 'fitterName', label: 'Fitter Name' },
      { key: 'input', label: 'Input' },
      { key: 'output', label: 'Output' },
      { key: 'blank1', label: 'Blank1' },
      { key: 'blank2', label: 'Blank2' },
      { key: 'total', label: 'Total' }
    ];

    const logsTable = new GlassTable({
      container: container.querySelector('#logs-table-mount'),
      headers: headersList,
      data: state.systemLogs || [],
      onDeleteSelected: (selectedRows) => {
        const ids = selectedRows.map(row => row.id);
        state.systemLogs = state.systemLogs.filter(row => !ids.includes(row.id));
        dbState.saveState();
        renderSettings(container);
      },
      onImportCSV: (importedRows) => {
        // Auto map columns defensively
        const normalized = importedRows.map(row => ({
          id: row.id || uuid(),
          date: row.date || row.Date || new Date().toISOString().split('T')[0],
          hardwareName: row.hardwareName || row.hardware_name || row['hardware name'] || '',
          partyName: row.partyName || row.party_name || row['party name'] || '',
          fitterName: row.fitterName || row.fitter_name || row['fitter name'] || '',
          input: row.input || row.Input || '',
          output: row.output || row.Output || '',
          blank1: row.blank1 || '',
          blank2: row.blank2 || '',
          total: row.total || row.Total || ''
        }));
        state.systemLogs = normalized;
        dbState.saveState();
        renderSettings(container);
        alert(`Successfully imported ${normalized.length} rows directly into active states.`);
      }
    });

    // Wire Connect Storage Folder Button
    container.querySelector('#btn-select-folder').addEventListener('click', async () => {
      try {
        if (!window.showDirectoryPicker) {
          alert("Your current browser environment doesn't support the File System Access API. Please use a modern Chromium browser.");
          return;
        }
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        localStorage.setItem('duckdb_local_folder_name', handle.name);
        window.localDatabaseFolderHandle = handle;
        
        container.querySelector('#lbl-folder-name').textContent = handle.name;
        alert(`Successfully linked workspace to your computer folder: "${handle.name}"`);
        
        // Execute initial save
        await syncDataToOfflineFileStorage(state.systemLogs);
        
        const timeString = localStorage.getItem('duckdb_last_sync_timestamp') || new Date().toLocaleTimeString();
        container.querySelector('#lbl-sync-time').textContent = timeString;
      } catch (err) {
        console.error("Folder selection rejected:", err);
      }
    });

    // Wire Export CSV Blob Button
    container.querySelector('#btn-export-csv-action').addEventListener('click', () => {
      const logs = state.systemLogs || [];
      if (logs.length === 0) {
        alert("No database items available to compile into CSV format.");
        return;
      }
      const csvHeaders = ["Date", "Hardware Name", "Party Name", "Fitter Name", "Input", "Output", "Blank1", "Blank2", "Total"];
      const csvRows = [
        csvHeaders.join(','),
        ...logs.map(row => [
          `"${String(row.date || '').replace(/"/g, '""')}"`,
          `"${String(row.hardwareName || '').replace(/"/g, '""')}"`,
          `"${String(row.partyName || '').replace(/"/g, '""')}"`,
          `"${String(row.fitterName || '').replace(/"/g, '""')}"`,
          `"${String(row.input || '').replace(/"/g, '""')}"`,
          `"${String(row.output || '').replace(/"/g, '""')}"`,
          `"${String(row.blank1 || '').replace(/"/g, '""')}"`,
          `"${String(row.blank2 || '').replace(/"/g, '""')}"`,
          `"${String(row.total || '').replace(/"/g, '""')}"`
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.setAttribute("download", `glass_finance_db_backup_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });

    // Wire Import CSV Button
    container.querySelector('#btn-import-csv').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const textStr = evt.target.result;
          const lines = textStr.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length <= 1) return;

          const importedRows = lines.slice(1).map(line => {
            const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            return {
              id: uuid(),
              date: cells[0] || '',
              hardwareName: cells[1] || '',
              partyName: cells[2] || '',
              fitterName: cells[3] || '',
              input: cells[4] || '',
              output: cells[5] || '',
              blank1: cells[6] || '',
              blank2: cells[7] || '',
              total: cells[8] || ''
            };
          });

          state.systemLogs = importedRows;
          dbState.saveState();
          
          alert(`Successfully imported ${importedRows.length} rows directly into active states.`);
          renderSettings(container);
        } catch (err) {
          alert("Error parsing backup CSV file. Verify structural separation alignments.");
        }
      };
      reader.readAsText(file);
      e.target.value = null; // reset input
    });
  }

  // Hook Tab Switches
  const tabProfile = container.querySelector('#btn-tab-profile');
  const tabPayment = container.querySelector('#btn-tab-payment-types');
  const tabDatabase = container.querySelector('#btn-tab-database');

  if (tabProfile) {
    tabProfile.addEventListener('click', () => {
      currentSettingsTab = 'profile';
      renderSettings(container);
    });
  }
  if (tabPayment) {
    tabPayment.addEventListener('click', () => {
      currentSettingsTab = 'payment-types';
      renderSettings(container);
    });
  }
  if (tabDatabase) {
    tabDatabase.addEventListener('click', () => {
      currentSettingsTab = 'database';
      renderSettings(container);
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
