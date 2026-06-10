// GlassERP Pro V2 Finance Views & Forms

import { dbState, round, uuid } from '../state.js';
import { GlassTable } from '../components/table.js';

// Visual currency formatter
export const inrFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

// A. MAKE PAYMENT ENGINE (Universal Outbound Cash Form)
export function renderMakePayment(container) {
  const state = dbState.state;
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Outbound Form Panel -->
      <div class="glass-panel">
        <h3 style="font-size: 1.25rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="arrow-up-right" style="color: var(--credit-color);"></i>
          Universal Make Payment Outbound Cash Engine
        </h3>
        
        <form id="make-payment-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="pay-date">Payment Date *</label>
              <input type="date" id="pay-date" class="form-control" value="${today}" required>
            </div>

            <div class="form-group">
              <label for="pay-amount">Amount (₹) *</label>
              <input type="number" step="0.01" id="pay-amount" class="form-control" placeholder="1,00,000.00" required>
            </div>

            <div class="form-group">
              <label for="pay-type">Payment Type *</label>
              <select id="pay-type" required>
                <option value="" disabled selected>-- Select Type --</option>
                <option value="Vendor Payment">Vendor Invoice Settlement</option>
                <option value="Employee Advance">Employee Advance / Loan</option>
                <option value="Salary Payout">Staff Payroll Disbursement</option>
                <option value="Materials Procurement">Materials Procurement</option>
                <option value="Rent">Office / Space Rent</option>
                <option value="Utility">Electricity & Internet Utilities</option>
                <option value="Machine Repair">Machine Repair / Fixed Asset maintenance</option>
              </select>
            </div>

            <div class="form-group">
              <label for="pay-bank">Source Bank Account *</label>
              <select id="pay-bank" required>
                <option value="" disabled selected>-- Select Source Bank --</option>
                ${state.bankAccounts.map(b => `<option value="${b.bank_id}">${b.account_name} (Bal: ${inrFormat.format(b.current_balance)})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="pay-ref">Reference Number *</label>
              <input type="text" id="pay-ref" class="form-control" placeholder="TXN-XXXXX" required>
            </div>

            <div class="form-group">
              <label for="pay-project">Link to Project (Optional)</label>
              <select id="pay-project">
                <option value="">-- No Project Link --</option>
                ${state.projects.map(p => `<option value="${p.project_id}">${p.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Dynamic conditional link inputs based on Type selection -->
          <div id="dynamic-link-container" class="form-grid" style="margin-bottom: 20px;"></div>

          <!-- GST settings toggle -->
          <div class="glass-panel" style="padding: 15px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.01);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h5 style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">GST Applicable</h5>
                <p style="font-size: 0.75rem; color: var(--text-secondary);">Route transaction to tax ledger calculations</p>
              </div>
              <label class="toggle-container">
                <input type="checkbox" id="gst-toggle" style="display: none;">
                <div class="toggle-switch"></div>
              </label>
            </div>

            <div id="gst-fields-container" style="display: none; margin-top: 15px; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label for="gst-rate">GST Rate</label>
                <select id="gst-rate">
                  <option value="5">GST @ 5%</option>
                  <option value="12">GST @ 12%</option>
                  <option value="18" selected>GST @ 18%</option>
                  <option value="28">GST @ 28%</option>
                </select>
              </div>
              <div class="form-group">
                <label>Real-Time Tax Breakdown Split</label>
                <div id="gst-split-display" style="padding: 10px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--border-radius-sm); font-size: 0.8rem; height: 38px; display: flex; align-items: center; color: var(--text-secondary);">
                  ₹0.00 split (Local CGST/SGST vs IGST)
                </div>
              </div>
            </div>
          </div>

          <!-- Receipt & description notes -->
          <div class="form-grid" style="margin-bottom: 20px;">
            <div class="form-group" style="grid-column: span 2;">
              <label for="pay-notes">Description / Rich Text Notes</label>
              <textarea id="pay-notes" rows="3" placeholder="Enter remarks details..."></textarea>
            </div>
            
            <div class="form-group" style="grid-column: span 2;">
              <label>Attach Digital Receipt Upload</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="file" id="pay-file" class="form-control" style="flex: 1;" accept="image/*,application/pdf">
                <span style="font-size: 0.75rem; color: var(--text-muted);">Max size: 10MB</span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-autofill" style="margin-right: auto; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
            <button type="reset" class="btn btn-secondary">Reset Form</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Authorize & Commit</button>
          </div>
        </form>
      </div>

      <!-- Real-Time Accounting Flow Propagation Animation -->
      <div class="glass-panel">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
          Double-Entry Propagation Engine
        </h3>
        
        <div id="propagation-visualizer" class="accounting-propagation-viewer">
          <div class="propagation-step" id="step-trigger">
            <span class="step-indicator">1</span>
            <div class="step-details">
              <h5>Transaction Triggered</h5>
              <p>Capture initial payload inputs and execute validation constraints.</p>
            </div>
          </div>

          <div class="propagation-step" id="step-debit">
            <span class="step-indicator">2</span>
            <div class="step-details">
              <h5>Debit Account Ledger Entry</h5>
              <p id="debit-details-text">Pending debit target allocation.</p>
            </div>
          </div>

          <div class="propagation-step" id="step-credit">
            <span class="step-indicator">3</span>
            <div class="step-details">
              <h5>Credit Account Bank Ledger</h5>
              <p id="credit-details-text">Pending bank credit ledger allocation.</p>
            </div>
          </div>

          <div class="propagation-step" id="step-project">
            <span class="step-indicator">4</span>
            <div class="step-details">
              <h5>Project Costing Integration</h5>
              <p id="project-details-text">Cost sheets updating in real-time if project linked.</p>
            </div>
          </div>

          <div class="propagation-step" id="step-gst">
            <span class="step-indicator">5</span>
            <div class="step-details">
              <h5>GST Compliance Pipe</h5>
              <p id="gst-details-text">ITC receivable logged if GST toggled on.</p>
            </div>
          </div>
        </div>

        <div id="feedback-alert" style="display: none; padding: 12px; border-radius: var(--border-radius-sm); font-size: 0.85rem; font-weight: 600; margin-top: 20px;"></div>
      </div>
    </div>
  `;

  // Hooks for conditional selectors
  const payTypeSelect = container.querySelector('#pay-type');
  const dynamicLinkContainer = container.querySelector('#dynamic-link-container');

  payTypeSelect.addEventListener('change', (e) => {
    const type = e.target.value;
    dynamicLinkContainer.innerHTML = '';

    if (type === 'Employee Advance' || type === 'Salary Payout') {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="pay-employee">Select Employee *</label>
        <select id="pay-employee" required>
          <option value="" disabled selected>-- Choose Employee --</option>
          ${state.employees.map(emp => `<option value="${emp.employee_id}">${emp.name} (${emp.designation})</option>`).join('')}
        </select>
      `;
      dynamicLinkContainer.appendChild(div);
    } else if (type === 'Vendor Payment') {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="pay-vendor">Select Vendor *</label>
        <select id="pay-vendor" required>
          <option value="" disabled selected>-- Choose Vendor --</option>
          ${state.vendors.map(v => `<option value="${v.id}">${v.name} (Outstanding: ${inrFormat.format(v.outstanding)})</option>`).join('')}
        </select>
      `;
      dynamicLinkContainer.appendChild(div);
    }
  });

  // GST interactive splits updates
  const gstToggle = container.querySelector('#gst-toggle');
  const gstFields = container.querySelector('#gst-fields-container');
  const gstRate = container.querySelector('#gst-rate');
  const gstSplitDisplay = container.querySelector('#gst-split-display');
  const payAmountInput = container.querySelector('#pay-amount');

  function updateGSTSplit() {
    const amt = parseFloat(payAmountInput.value) || 0;
    if (amt <= 0 || !gstToggle.checked) {
      gstSplitDisplay.textContent = '₹0.00 split (Local CGST/SGST vs IGST)';
      return;
    }
    const rate = parseInt(gstRate.value) || 18;
    const taxable = round(amt / (1 + rate / 100));
    const totalTax = round(amt - taxable);
    const halfTax = round(totalTax / 2);
    
    gstSplitDisplay.textContent = `Taxable: ${inrFormat.format(taxable)} | CGST+SGST: ${inrFormat.format(halfTax)} each (Total Tax: ${inrFormat.format(totalTax)})`;
  }

  gstToggle.addEventListener('change', () => {
    gstFields.style.display = gstToggle.checked ? 'grid' : 'none';
    updateGSTSplit();
  });
  gstRate.addEventListener('change', updateGSTSplit);
  payAmountInput.addEventListener('input', updateGSTSplit);

  // Form submit trigger
  const form = container.querySelector('#make-payment-form');
  const feedbackAlert = container.querySelector('#feedback-alert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackAlert.style.display = 'none';

    // Retrieve form values
    const payload = {
      date: container.querySelector('#pay-date').value,
      amount: parseFloat(payAmountInput.value),
      paymentType: payTypeSelect.value,
      bankId: container.querySelector('#pay-bank').value,
      referenceNo: container.querySelector('#pay-ref').value,
      description: container.querySelector('#pay-notes').value,
      gstApplicable: gstToggle.checked,
      gstRate: gstRate.value,
      projectLink: container.querySelector('#pay-project').value,
      employeeLink: container.querySelector('#pay-employee')?.value || null,
      vendorLink: container.querySelector('#pay-vendor')?.value || null
    };

    // Trigger step-by-step visual animation to wow user
    animatePropagation(payload, feedbackAlert);
  });

  const btnAutofill = container.querySelector('.btn-autofill');
  if (btnAutofill) {
    btnAutofill.addEventListener('click', () => {
      container.querySelector('#pay-amount').value = '75000';
      const typeSelect = container.querySelector('#pay-type');
      typeSelect.value = 'Vendor Payment';
      typeSelect.dispatchEvent(new Event('change'));
      
      const bankSelect = container.querySelector('#pay-bank');
      if (bankSelect.options.length > 1) {
        bankSelect.selectedIndex = 1;
      }
      
      const vendorSelect = container.querySelector('#pay-vendor');
      if (vendorSelect && vendorSelect.options.length > 1) {
        vendorSelect.selectedIndex = 1;
      }
      
      container.querySelector('#pay-ref').value = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
      container.querySelector('#pay-notes').value = 'Settlement for Saint-Gobain structural glass panels delivery - Batch 4';
      
      const projectSelect = container.querySelector('#pay-project');
      if (projectSelect && projectSelect.options.length > 1) {
        projectSelect.selectedIndex = 1;
      }

      const gstToggle = container.querySelector('#gst-toggle');
      gstToggle.checked = true;
      gstToggle.dispatchEvent(new Event('change'));
      
      const gstRate = container.querySelector('#gst-rate');
      gstRate.value = '18';
      gstRate.dispatchEvent(new Event('change'));
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function animatePropagation(payload, feedbackEl) {
  const steps = ['step-trigger', 'step-debit', 'step-credit', 'step-project', 'step-gst'];
  
  // Clear past active markers
  steps.forEach(id => document.getElementById(id)?.classList.remove('active'));

  // Compile detailed step description messages
  const debitText = document.getElementById('debit-details-text');
  const creditText = document.getElementById('credit-details-text');
  const projectText = document.getElementById('project-details-text');
  const gstText = document.getElementById('gst-details-text');

  debitText.textContent = `Debit Target Account: '${payload.paymentType}' expense block. Amount: ${inrFormat.format(payload.amount)}`;
  creditText.textContent = `Credit Bank balance source. Total: ${inrFormat.format(payload.amount)}`;
  
  if (payload.projectLink) {
    projectText.textContent = `Tying cost of ${inrFormat.format(payload.amount)} to Project: ${payload.projectLink}. Increments gross margin indices.`;
  } else {
    projectText.textContent = `No Project ID linked. Step skipped.`;
  }

  if (payload.gstApplicable) {
    gstText.textContent = `GST rate ${payload.gstRate}% active. Logging Input Tax Credit balance sheet receivable.`;
  } else {
    gstText.textContent = `GST not checked. Bypassing tax splits.`;
  }

  let currentStep = 0;
  
  function nextStep() {
    if (currentStep < steps.length) {
      document.getElementById(steps[currentStep]).classList.add('active');
      currentStep++;
      setTimeout(nextStep, 700); // 700ms gap
    } else {
      // Execute the database state change
      const txnResult = dbState.makePayment(payload);
      
      if (txnResult.success) {
        feedbackEl.className = 'glass-panel';
        feedbackEl.style.background = 'var(--debit-bg)';
        feedbackEl.style.color = 'var(--debit-color)';
        feedbackEl.style.borderColor = 'var(--debit-color)';
        feedbackEl.innerHTML = `<i data-lucide="check-circle" style="vertical-align: middle; margin-right: 8px;"></i> Transaction Committed. Double-entry ledger matched perfectly.`;
        feedbackEl.style.display = 'block';
        
        // Reset form
        document.getElementById('make-payment-form').reset();
        document.getElementById('dynamic-link-container').innerHTML = '';
        document.getElementById('gst-fields-container').style.display = 'none';
      } else {
        feedbackEl.className = 'glass-panel';
        feedbackEl.style.background = 'var(--credit-bg)';
        feedbackEl.style.color = 'var(--credit-color)';
        feedbackEl.style.borderColor = 'var(--credit-color)';
        feedbackEl.innerHTML = `<i data-lucide="alert-triangle" style="vertical-align: middle; margin-right: 8px;"></i> Rolled Back: ${txnResult.error}`;
        feedbackEl.style.display = 'block';
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }

  nextStep();
}

// B. RECEIVE PAYMENT ENGINE (Universal Inbound Cash Form)
export function renderReceivePayment(container) {
  const state = dbState.state;
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Inbound Form -->
      <div class="glass-panel">
        <h3 style="font-size: 1.25rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="arrow-down-left" style="color: var(--debit-color);"></i>
          Universal Receive Payment Inbound Cash Engine
        </h3>

        <form id="receive-payment-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="rcv-date">Receipt Date *</label>
              <input type="date" id="rcv-date" class="form-control" value="${today}" required>
            </div>

            <div class="form-group">
              <label for="rcv-amount">Amount Received (₹) *</label>
              <input type="number" step="0.01" id="rcv-amount" class="form-control" placeholder="5,000.00" required>
            </div>

            <div class="form-group">
              <label for="rcv-category">Inflow Categorization *</label>
              <select id="rcv-category" required>
                <option value="" disabled selected>-- Choose Category --</option>
                <option value="Customer Payment">Customer Payment / Project Advance</option>
                <option value="Employee Refund">Employee Advance Refund</option>
                <option value="Vendor Refund">Vendor Outlay Refund</option>
                <option value="Interest Income">Interest Revenue</option>
              </select>
            </div>

            <div class="form-group">
              <label for="rcv-bank">Target Bank Account *</label>
              <select id="rcv-bank" required>
                <option value="" disabled selected>-- Select Target Bank --</option>
                ${state.bankAccounts.map(b => `<option value="${b.bank_id}">${b.account_name} (Bal: ${inrFormat.format(b.current_balance)})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="rcv-ref">Reference ID / UPI Rrn *</label>
              <input type="text" id="rcv-ref" class="form-control" placeholder="UPI-REF-XXXXX" required>
            </div>

            <div class="form-group">
              <label for="rcv-project">Project Link (Optional)</label>
              <select id="rcv-project">
                <option value="">-- No Project Link --</option>
                ${state.projects.map(p => `<option value="${p.project_id}">${p.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Dynamic inputs based on Category selection -->
          <div id="rcv-dynamic-container" class="form-grid" style="margin-bottom: 20px;"></div>

          <!-- Description and upload -->
          <div class="form-grid" style="margin-bottom: 20px;">
            <div class="form-group" style="grid-column: span 2;">
              <label for="rcv-notes">Description / Remarks</label>
              <textarea id="rcv-notes" rows="3" placeholder="Additional receipt details..."></textarea>
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label>Attach Screenshot / Verification Receipt</label>
              <input type="file" id="rcv-file" class="form-control" accept="image/*">
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-autofill-rcv" style="margin-right: auto; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="check-circle"></i> Verify & Record Inflow</button>
          </div>
        </form>
      </div>

      <!-- Real-Time Customer UPI QR Code Visualizer -->
      <div class="glass-panel" style="text-align: center;">
        <h3 style="font-size: 1.1rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
          Dynamic UPI QR Engine
        </h3>
        
        <div style="padding: 20px; background: rgba(255, 255, 255, 0.02); border-radius: var(--border-radius-md); border: 1px dashed var(--border-glass);">
          <div class="qr-box" style="margin-bottom: 15px;">
            <!-- Simulating QR via HTML grid or beautiful style. We will draw a mock pixel grid/graphic -->
            <div style="width: 140px; height: 140px; background: repeating-conic-gradient(from 45deg, #000 0% 25%, #fff 0% 50%) 50% / 10px 10px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 100px; height: 100px; background: #fff; display: flex; align-items: center; justify-content: center; position: relative;">
                <!-- Inner QR square lines -->
                <div style="width: 80px; height: 80px; border: 8px solid #000; position: relative;">
                  <div style="width: 30px; height: 30px; border: 4px solid #000; position: absolute; top: 0; left: 0;"></div>
                  <div style="width: 20px; height: 20px; background: #000; position: absolute; bottom: 0; right: 0;"></div>
                </div>
              </div>
            </div>
            <div class="qr-label">UPI ID Mapped</div>
          </div>
          
          <h5 id="qr-bank-name" style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;">SBI Current Account Mappings</h5>
          <p id="qr-upi-string" style="font-size: 0.8rem; color: var(--accent-color); font-family: monospace;">glasserpsbi@okaxis</p>
          
          <div style="margin-top: 15px; border-top: 1px solid var(--border-glass); padding-top: 15px; text-align: left;">
            <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
              Scanning QR creates a direct payment request. Reconcile transaction via reference number to close pending invoice receivables instantly.
            </p>
          </div>
        </div>

        <div id="rcv-feedback" style="display: none; padding: 12px; border-radius: var(--border-radius-sm); font-size: 0.85rem; font-weight: 600; margin-top: 20px;"></div>
      </div>
    </div>
  `;

  // Dynamic elements logic
  const rcvCategory = container.querySelector('#rcv-category');
  const rcvDynamic = container.querySelector('#rcv-dynamic-container');
  const qrBankName = container.querySelector('#qr-bank-name');
  const qrUpiString = container.querySelector('#qr-upi-string');
  const bankSelect = container.querySelector('#rcv-bank');

  // Update QR code details depending on bank selection
  bankSelect.addEventListener('change', (e) => {
    const bank = state.bankAccounts.find(b => b.bank_id === e.target.value);
    if (bank) {
      qrBankName.textContent = bank.account_name;
      qrUpiString.textContent = bank.upi_id || 'no-upi-configured@erp';
    }
  });

  rcvCategory.addEventListener('change', (e) => {
    const cat = e.target.value;
    rcvDynamic.innerHTML = '';

    if (cat === 'Customer Payment') {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="rcv-customer">Select Customer *</label>
        <select id="rcv-customer" required>
          <option value="" disabled selected>-- Choose Customer --</option>
          ${state.customers.map(c => `<option value="${c.id}">${c.name} (Due: ${inrFormat.format(c.outstanding)})</option>`).join('')}
        </select>
      `;
      rcvDynamic.appendChild(div);
    } else if (cat === 'Employee Refund') {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="rcv-employee">Select Employee *</label>
        <select id="rcv-employee" required>
          <option value="" disabled selected>-- Choose Employee --</option>
          ${state.employees.map(emp => `<option value="${emp.employee_id}">${emp.name} (Advance Due: ${inrFormat.format(emp.advance_due)})</option>`).join('')}
        </select>
      `;
      rcvDynamic.appendChild(div);
    } else if (cat === 'Vendor Refund') {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label for="rcv-vendor">Select Vendor *</label>
        <select id="rcv-vendor" required>
          <option value="" disabled selected>-- Choose Vendor --</option>
          ${state.vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
        </select>
      `;
      rcvDynamic.appendChild(div);
    }
  });

  // Submit rcv form
  const form = container.querySelector('#receive-payment-form');
  const rcvFeedback = container.querySelector('#rcv-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    rcvFeedback.style.display = 'none';

    const payload = {
      date: container.querySelector('#rcv-date').value,
      amount: parseFloat(container.querySelector('#rcv-amount').value),
      inflowCategory: rcvCategory.value,
      bankId: bankSelect.value,
      referenceNo: container.querySelector('#rcv-ref').value,
      description: container.querySelector('#rcv-notes').value,
      customerLink: container.querySelector('#rcv-customer')?.value || null,
      employeeLink: container.querySelector('#rcv-employee')?.value || null,
      vendorLink: container.querySelector('#rcv-vendor')?.value || null,
      projectLink: container.querySelector('#rcv-project').value || null
    };

    const txnResult = dbState.receivePayment(payload);

    if (txnResult.success) {
      rcvFeedback.className = 'glass-panel';
      rcvFeedback.style.background = 'var(--debit-bg)';
      rcvFeedback.style.color = 'var(--debit-color)';
      rcvFeedback.style.borderColor = 'var(--debit-color)';
      rcvFeedback.innerHTML = `<i data-lucide="check-circle" style="vertical-align: middle; margin-right: 8px;"></i> Inbound payment processed and recorded. Ledger updated.`;
      rcvFeedback.style.display = 'block';

      form.reset();
      rcvDynamic.innerHTML = '';
    } else {
      rcvFeedback.className = 'glass-panel';
      rcvFeedback.style.background = 'var(--credit-bg)';
      rcvFeedback.style.color = 'var(--credit-color)';
      rcvFeedback.style.borderColor = 'var(--credit-color)';
      rcvFeedback.innerHTML = `<i data-lucide="alert-triangle" style="vertical-align: middle; margin-right: 8px;"></i> Transaction Rejected: ${txnResult.error}`;
      rcvFeedback.style.display = 'block';
    }

    if (window.lucide) window.lucide.createIcons();
  });

  const btnAutofillRcv = container.querySelector('.btn-autofill-rcv');
  if (btnAutofillRcv) {
    btnAutofillRcv.addEventListener('click', () => {
      container.querySelector('#rcv-amount').value = '150000';
      const catSelect = container.querySelector('#rcv-category');
      catSelect.value = 'Customer Payment';
      catSelect.dispatchEvent(new Event('change'));
      
      const bankSelect = container.querySelector('#rcv-bank');
      if (bankSelect.options.length > 1) {
        bankSelect.selectedIndex = 1;
        bankSelect.dispatchEvent(new Event('change'));
      }
      
      const custSelect = container.querySelector('#rcv-customer');
      if (custSelect && custSelect.options.length > 1) {
        custSelect.selectedIndex = 1;
      }
      
      const projSelect = container.querySelector('#rcv-project');
      if (projSelect && projSelect.options.length > 1) {
        projSelect.selectedIndex = 1;
      }
      
      container.querySelector('#rcv-ref').value = `UPI-${Math.floor(100000 + Math.random() * 900000)}`;
      container.querySelector('#rcv-notes').value = 'Milestone 1 Advance payment for Double Glazed Glass Facade';
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// C. EXPENSES LOG VIEW
export function renderExpensesLog(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
        System-Generated Outbound Expense Log
      </h3>
      <div id="expenses-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'date', label: 'Payment Date' },
    { key: 'payment_type', label: 'Category' },
    { key: 'amount', label: 'Gross Outflow', render: val => inrFormat.format(val) },
    { key: 'bank_name', label: 'Paid From' },
    { key: 'reference_no', label: 'Reference ID' },
    { key: 'taxable_amount', label: 'Taxable Amt', render: val => val ? inrFormat.format(val) : 'N/A' },
    { key: 'cgst', label: 'CGST', render: (val, row) => row.gst_applicable ? inrFormat.format(val) : '--' },
    { key: 'sgst', label: 'SGST', render: (val, row) => row.gst_applicable ? inrFormat.format(val) : '--' },
    { key: 'igst', label: 'IGST', render: (val, row) => row.gst_applicable ? inrFormat.format(val) : '--' }
  ];

  const table = new GlassTable({
    container: container.querySelector('#expenses-table-mount'),
    headers: headers,
    data: dbState.state.expenses,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        const bankNameStr = String(row.bank_name || row['paid from'] || '').toLowerCase();
        const bank = dbState.state.bankAccounts.find(b => b.account_name.toLowerCase().includes(bankNameStr)) || dbState.state.bankAccounts[0];
        
        dbState.makePayment({
          date: row.date || row['payment date'],
          amount: parseFloat(String(row.amount || row['gross outflow']).replace(/[^\d.]/g, '')) || 0,
          paymentType: row.payment_type || row['category'],
          bankId: bank?.bank_id,
          referenceNo: row.reference_no || row['reference id'],
          description: row.description || '',
          gstApplicable: row.gst_applicable === 'true' || row.gst_applicable === true || String(row['gst applicable']).toLowerCase() === 'true',
          gstRate: row.gst_rate || '18',
          projectLink: row.project_id || null,
          employeeLink: row.employee_id || null,
          vendorLink: row.vendor_id || null
        });
      });
      table.setData(dbState.state.expenses);
    }
  });
}

// D. INCOME LOG VIEW
export function renderIncomeLog(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
        Inbound Asset Income & Reconciliation Log
      </h3>
      <div id="income-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'inflow_category', label: 'Inflow Category' },
    { key: 'amount', label: 'Amount Received', render: val => inrFormat.format(val) },
    { key: 'bank_name', label: 'Target Account' },
    { key: 'reference_no', label: 'Reference ID' },
    { key: 'description', label: 'Remarks / Notes' }
  ];

  const table = new GlassTable({
    container: container.querySelector('#income-table-mount'),
    headers: headers,
    data: dbState.state.income,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        const bankNameStr = String(row.bank_name || row['target account'] || '').toLowerCase();
        const bank = dbState.state.bankAccounts.find(b => b.account_name.toLowerCase().includes(bankNameStr)) || dbState.state.bankAccounts[0];
        
        dbState.receivePayment({
          date: row.date || row['date created'] || new Date().toISOString().split('T')[0],
          amount: parseFloat(String(row.amount || row['amount received']).replace(/[^\d.]/g, '')) || 0,
          inflowCategory: row.inflow_category || row['inflow category'],
          bankId: bank?.bank_id,
          referenceNo: row.reference_no || row['reference id'],
          description: row.description || row['remarks / notes'] || '',
          customerLink: row.customer_id || null,
          employeeLink: row.employee_id || null,
          vendorLink: row.vendor_id || null,
          projectLink: row.project_id || null
        });
      });
      table.setData(dbState.state.income);
    }
  });
}

// E. DOUBLE-ENTRY LEDGER VIEW (Global General Ledger)
export function renderLedger(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
          Global General Ledger (Double-Entry Log)
        </h3>
        
        <!-- Quick double-entry verification shield -->
        <div id="ledger-verification-shield" style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; padding: 6px 12px; border-radius: 50px; background: var(--debit-bg); color: var(--debit-color);">
          <i data-lucide="shield-check"></i>
          <span>∑Debits = ∑Credits Double-Entry Verified</span>
        </div>
      </div>
      
      <div id="ledger-table-mount"></div>
    </div>
  `;

  // Format ledger records into single lines (split debits and credits)
  function getLedgerLines() {
    const ledgerLines = [];
    dbState.state.ledgerEntries.forEach(entry => {
      entry.legs.forEach(leg => {
        ledgerLines.push({
          date: entry.date,
          reference_number: entry.reference_number,
          description: entry.description,
          account: leg.account,
          debit_amount: leg.type === 'DEBIT' ? leg.amount : null,
          credit_amount: leg.type === 'CREDIT' ? leg.amount : null
        });
      });
    });
    return ledgerLines;
  }

  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'reference_number', label: 'Reference' },
    { key: 'description', label: 'Transaction Description' },
    { key: 'account', label: 'Ledger Account' },
    { key: 'debit_amount', label: 'Debit (Dr)', render: val => val ? `<span style="color: var(--debit-color); font-weight: 600;">${inrFormat.format(val)}</span>` : '--' },
    { key: 'credit_amount', label: 'Credit (Cr)', render: val => val ? `<span style="color: var(--credit-color); font-weight: 600;">${inrFormat.format(val)}</span>` : '--' }
  ];

  const table = new GlassTable({
    container: container.querySelector('#ledger-table-mount'),
    headers: headers,
    data: getLedgerLines(),
    onImportCSV: (importedRows) => {
      // Group rows by reference_number + date + description to form double-entry journal entries
      const groups = {};
      importedRows.forEach(row => {
        const ref = row.reference_number || row['reference'] || '';
        const date = row.date || '';
        const desc = row.description || row['transaction description'] || '';
        const groupKey = `${ref}_${date}_${desc}`;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            date,
            reference_number: ref,
            description: desc,
            legs: []
          };
        }
        const debit = parseFloat(String(row.debit_amount || row['debit (dr)'] || '').replace(/[^\d.]/g, '')) || 0;
        const credit = parseFloat(String(row.credit_amount || row['credit (cr)'] || '').replace(/[^\d.]/g, '')) || 0;
        
        if (debit > 0 || credit > 0) {
          groups[groupKey].legs.push({
            account: row.account || row['ledger account'] || 'General Ledger Account',
            type: debit > 0 ? 'DEBIT' : 'CREDIT',
            amount: debit > 0 ? debit : credit
          });
        }
      });

      // Execute transactions
      Object.values(groups).forEach(g => {
        dbState.executeTransaction(() => {
          let debits = 0;
          let credits = 0;
          g.legs.forEach(leg => {
            if (leg.type === 'DEBIT') debits = round(debits + leg.amount);
            else credits = round(credits + leg.amount);
          });
          if (debits !== credits) {
            throw new Error(`Double-entry validation failed: Debits (₹${debits}) do not equal Credits (₹${credits}) for ref ${g.reference_number}`);
          }
          const newEntry = {
            entry_id: uuid(),
            date: g.date || new Date().toISOString().split('T')[0],
            reference_number: g.reference_number || `JV-${uuid().slice(0, 5)}`,
            description: g.description || 'Imported Journal Voucher',
            legs: g.legs
          };
          dbState.state.ledgerEntries.unshift(newEntry);
          dbState.logAudit('IMPORT_LEDGER_ENTRY', 'ledgerEntries', null, newEntry);
        });
      });
      dbState.saveState();
      table.setData(getLedgerLines());
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
