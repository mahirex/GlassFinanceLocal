// GlassERP Pro V2 Operations, Inventory, and CRM Modules

import { dbState, uuid } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';

export function renderOperations(container, viewName) {
  if (viewName === 'quotations') {
    renderQuotations(container);
  } else if (viewName === 'inventory') {
    renderInventory(container);
  } else if (viewName === 'production') {
    renderProduction(container);
  } else if (viewName === 'customers') {
    renderCustomers(container);
  } else if (viewName === 'vendors') {
    renderVendors(container);
  }
}

// 1. QUOTATIONS PIPELINE VIEW
function renderQuotations(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px; margin-bottom: 25px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-size: 1.15rem; font-weight: 700;">Sales Quotations Pipeline & Pricing Engine</h3>
        <button class="btn btn-primary" id="btn-create-quote"><i data-lucide="file-plus"></i> New Quotation</button>
      </div>

      <div id="quotes-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'id', label: 'Quote ID' },
    { key: 'date', label: 'Date Created' },
    { key: 'customer', label: 'Customer Name' },
    { key: 'project', label: 'Project Name' },
    { key: 'amount', label: 'Value (₹)', render: val => inrFormat.format(val) },
    { key: 'status', label: 'Pipeline Status', render: val => {
      let bClass = 'badge-info';
      if (val === 'Approved') bClass = 'badge-debit';
      if (val === 'Draft') bClass = 'badge-warning';
      if (val === 'Rejected') bClass = 'badge-credit';
      return `<span class="badge ${bClass}">${val}</span>`;
    }},
    { key: 'validity', label: 'Valid Until' }
  ];

  const table = new GlassTable({
    container: container.querySelector('#quotes-table-mount'),
    headers: headers,
    data: dbState.state.quotations,
    onRowClick: (row) => {
      showQuotationInvoiceModal(row);
    },
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createQuotation({
          id: row.id || row.quote_id || row['quote id'],
          date: row.date || row['date created'],
          customer: row.customer || row['customer name'],
          project: row.project || row['project name'],
          amount: parseFloat(String(row.amount || row['value (₹)']).replace(/[^\d.]/g, '')) || 0,
          status: row.status || row['pipeline status'] || 'Draft',
          validity: row.validity || row['valid until']
        });
      });
      table.setData(dbState.state.quotations);
    }
  });

  // Wire up creation form modal
  container.querySelector('#btn-create-quote').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultValidity = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const formHtml = `
      <div class="quotation-maker-modal" style="max-height: 70vh; overflow-y: auto; padding-right: 5px; text-align: left;">
        <!-- Client Details Section -->
        <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color); margin: 0;">Client Information</h4>
            <span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(99,102,241,0.08); padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(99,102,241,0.2);">All fields optional — fill only what you need</span>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="quote-customer" style="display:flex; justify-content:space-between;"><span>Client Name / Company</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="text" id="quote-customer" class="form-control" placeholder="e.g. L&T Construction">
            </div>
            <div class="form-group">
              <label for="quote-project" style="display:flex; justify-content:space-between;"><span>Project Name</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="text" id="quote-project" class="form-control" placeholder="e.g. Glass Pavilion Facade">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="quote-client-address" style="display:flex; justify-content:space-between;"><span>Billing Address</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
            <input type="text" id="quote-client-address" class="form-control" placeholder="e.g. Powai, Mumbai">
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="quote-client-email" style="display:flex; justify-content:space-between;"><span>Email Address</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="text" id="quote-client-email" class="form-control" placeholder="e.g. buyer@client.com">
            </div>
            <div class="form-group">
              <label for="quote-client-phone" style="display:flex; justify-content:space-between;"><span>Phone / Mobile</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="text" id="quote-client-phone" class="form-control" placeholder="e.g. +91 9999988888">
            </div>
          </div>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="quote-client-gstin" style="display:flex; justify-content:space-between;"><span>Client GSTIN</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="text" id="quote-client-gstin" class="form-control" placeholder="e.g. 27AAACL1234F1Z8">
            </div>
            <div class="form-group">
              <label for="quote-client-state" style="display:flex; justify-content:space-between;"><span>State / Place of Supply</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <select id="quote-client-state" class="form-control" style="width: 100%; color: var(--text-primary); background: var(--input-bg);">
                <option value="">— Skip / Not Applicable —</option>
                <option value="01">01 - Jammu &amp; Kashmir</option>
                <option value="02">02 - Himachal Pradesh</option>
                <option value="03">03 - Punjab</option>
                <option value="04">04 - Chandigarh</option>
                <option value="05">05 - Uttarakhand</option>
                <option value="06">06 - Haryana</option>
                <option value="07">07 - Delhi</option>
                <option value="08">08 - Rajasthan</option>
                <option value="09">09 - Uttar Pradesh</option>
                <option value="10">10 - Bihar</option>
                <option value="11">11 - Sikkim</option>
                <option value="12">12 - Arunachal Pradesh</option>
                <option value="13">13 - Nagaland</option>
                <option value="14">14 - Manipur</option>
                <option value="15">15 - Mizoram</option>
                <option value="16">16 - Tripura</option>
                <option value="17">17 - Meghalaya</option>
                <option value="18">18 - Assam</option>
                <option value="19">19 - West Bengal</option>
                <option value="20">20 - Jharkhand</option>
                <option value="21">21 - Odisha</option>
                <option value="22">22 - Chhattisgarh</option>
                <option value="23">23 - Madhya Pradesh</option>
                <option value="24">24 - Gujarat</option>
                <option value="25">25 - Daman &amp; Diu</option>
                <option value="26">26 - Dadra &amp; Nagar Haveli</option>
                <option value="27" selected>27 - Maharashtra</option>
                <option value="28">28 - Andhra Pradesh (Old)</option>
                <option value="29">29 - Karnataka</option>
                <option value="30">30 - Goa</option>
                <option value="31">31 - Lakshadweep</option>
                <option value="32">32 - Kerala</option>
                <option value="33">33 - Tamil Nadu</option>
                <option value="34">34 - Puducherry</option>
                <option value="35">35 - Andaman &amp; Nicobar Islands</option>
                <option value="36">36 - Telangana</option>
                <option value="37">37 - Andhra Pradesh (New)</option>
                <option value="38">38 - Ladakh</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Quotation Metadata -->
        <div style="margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color); margin-bottom: 12px;">Quotation Settings</h4>
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="quote-status">Pipeline Status</label>
              <select id="quote-status" style="width: 100%;">
                <option value="Draft">Draft</option>
                <option value="Sent" selected>Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div class="form-group">
              <label for="quote-validity" style="display:flex; justify-content:space-between;"><span>Valid Until</span><span style="font-size:0.7rem;color:var(--text-muted);">optional</span></label>
              <input type="date" id="quote-validity" class="form-control" value="${defaultValidity}">
            </div>
          </div>
        </div>

        <!-- Dynamic Items Builder -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color); margin: 0;">Line Items</h4>
            <button type="button" class="btn btn-secondary" id="btn-add-item-row" style="padding: 4px 10px; font-size: 0.75rem;">
              <i data-lucide="plus" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i> Add Item
            </button>
          </div>
          
          <div style="overflow-x: auto;">
            <table style="width: 100%; min-width: 650px; border-collapse: collapse; font-size: 0.8rem;" id="quote-items-table">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-glass); text-align: left; opacity: 0.7;">
                  <th style="padding: 6px 4px; width: 140px;">Item Name *</th>
                  <th style="padding: 6px 4px;">Description</th>
                  <th style="padding: 6px 4px; width: 90px;">Size</th>
                  <th style="padding: 6px 4px; width: 65px;">Qty *</th>
                  <th style="padding: 6px 4px; width: 65px;">Unit</th>
                  <th style="padding: 6px 4px; width: 85px;">Price *</th>
                  <th style="padding: 6px 4px; width: 90px; text-align: right;">Amount</th>
                  <th style="padding: 6px 4px; width: 35px; text-align: center;"></th>
                </tr>
              </thead>
              <tbody id="quote-items-tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Transport & Live Calculation Summary -->
        <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.02); border-radius: var(--border-radius-sm); border: 1px solid var(--border-glass);">
          <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px; align-items: start;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div class="form-group" style="margin: 0;">
                <label for="quote-transport">Transport &amp; Logistics Charges (₹)</label>
                <input type="number" step="0.01" id="quote-transport" class="form-control" value="0" style="max-width: 200px;">
              </div>

              <!-- GST Selector -->
              <div class="form-group" style="margin: 0;">
                <label for="quote-gst-select" style="display: flex; align-items: center; gap: 8px;">
                  GST Rate
                  <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 400;">(optional — select or skip)</span>
                </label>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <select id="quote-gst-select" class="form-control" style="max-width: 180px; color: var(--text-primary); background: var(--input-bg);">
                    <option value="0">No GST (0%)</option>
                    <option value="5">GST 5%</option>
                    <option value="12">GST 12%</option>
                    <option value="18" selected>GST 18%</option>
                    <option value="28">GST 28%</option>
                    <option value="custom">Custom %</option>
                  </select>
                  <input type="number" id="quote-gst-custom" class="form-control" min="0" max="100" step="0.01" placeholder="Enter %" style="max-width: 110px; display: none; color: var(--text-primary); background: var(--input-bg);">
                </div>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; text-align: right; padding-top: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <span style="color: var(--text-secondary);">Subtotal:</span>
                <span id="summary-subtotal" style="font-weight: 600; color: var(--text-primary);">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <span style="color: var(--text-secondary);">Transport:</span>
                <span id="summary-transport" style="font-weight: 600; color: var(--text-primary);">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 20px;">
                <span id="gst-label" style="color: var(--text-secondary);">GST (18%):</span>
                <span id="summary-gst" style="font-weight: 600; color: var(--text-primary);">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid var(--border-glass); padding-top: 6px; font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">
                <span>Grand Total:</span>
                <span id="summary-total">₹0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    showModal('Generate Sales Quotation', formHtml, (formEl, exportAfterSave) => {
      // Collect items — all rows are included, no field is mandatory
      const items = [];
      formEl.querySelectorAll('.item-row').forEach(row => {
        const nameVal = row.querySelector('.item-name').value.trim();
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        // Include row if at least one field has a value
        if (nameVal || qty || price || row.querySelector('.item-desc').value.trim() || row.querySelector('.item-size').value.trim()) {
          items.push({
            name: nameVal,
            description: row.querySelector('.item-desc').value.trim(),
            size: row.querySelector('.item-size').value.trim(),
            quantity: qty,
            unit: row.querySelector('.item-unit').value.trim() || 'units',
            price: price,
            amount: qty * price
          });
        }
      });

      // Calculations
      const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
      const transport = parseFloat(formEl.querySelector('#quote-transport').value) || 0;
      const gstSelectVal = formEl.querySelector('#quote-gst-select').value;
      const gstRate = gstSelectVal === 'custom'
        ? (parseFloat(formEl.querySelector('#quote-gst-custom').value) || 0) / 100
        : parseFloat(gstSelectVal) / 100;
      const gst = (subtotal + transport) * gstRate;
      const grandTotal = subtotal + transport + gst;

      // Customer name default fallback
      const customerName = formEl.querySelector('#quote-customer').value.trim() || 'Walk-in Customer';

      const payload = {
        customer: customerName,
        project: formEl.querySelector('#quote-project').value.trim(),
        clientAddress: formEl.querySelector('#quote-client-address').value.trim(),
        clientEmail: formEl.querySelector('#quote-client-email').value.trim(),
        clientPhone: formEl.querySelector('#quote-client-phone').value.trim(),
        clientGstin: formEl.querySelector('#quote-client-gstin').value.trim(),
        clientState: formEl.querySelector('#quote-client-state').value,
        status: formEl.querySelector('#quote-status').value,
        validity: formEl.querySelector('#quote-validity').value,
        date: today,
        amount: grandTotal,
        items: items,
        transportCharges: transport,
        gstRate: gstRate  // store chosen rate (e.g. 0, 0.05, 0.12, 0.18, 0.28)
      };

      const newQuote = dbState.createQuotation(payload);
      table.setData(dbState.state.quotations);

      if (exportAfterSave) {
        setTimeout(() => {
          showQuotationInvoiceModal(newQuote);
        }, 350);
      }
      return true;
    }, '800px');

    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
      setupQuotationFormInteractions(modalOverlay, defaultValidity);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 2. INVENTORY TRACKER & REORDER THRESHOLDS
function renderInventory(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px; margin-bottom: 25px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0;">Raw Materials & Glass inventory Ledger</h3>
        <button class="btn btn-primary" id="btn-create-inventory"><i data-lucide="package-plus"></i> Add Material Item</button>
      </div>
      <div id="inventory-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'name', label: 'Material Description' },
    { key: 'quantity', label: 'Current Stock Level', render: (val, row) => {
      const isLow = val <= row.threshold;
      return `<span style="font-weight: 700; color: ${isLow ? 'var(--credit-color)' : 'inherit'}">${val} ${row.unit}</span>`;
    }},
    { key: 'threshold', label: 'Min Reorder Threshold', render: val => `${val} units` },
    { key: 'rate', label: 'Unit Rate (₹)', render: val => inrFormat.format(val) },
    { key: 'status', label: 'Status Alert', render: (_, row) => {
      const isLow = row.quantity <= row.threshold;
      return isLow 
        ? `<span class="badge badge-credit"><i data-lucide="alert-circle" style="width: 10px; height: 10px; vertical-align: middle; margin-right: 4px;"></i> Low Stock Reorder</span>`
        : `<span class="badge badge-debit">Optimal Stock</span>`;
    }}
  ];

  const table = new GlassTable({
    container: container.querySelector('#inventory-table-mount'),
    headers: headers,
    data: state.inventory,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createInventoryItem({
          name: row.name || row['material description'],
          quantity: parseFloat(String(row.quantity || row['current stock level']).replace(/[^\d.]/g, '')) || 0,
          threshold: parseFloat(String(row.threshold || row['min reorder threshold']).replace(/[^\d.]/g, '')) || 0,
          unit: row.unit || 'units',
          rate: parseFloat(String(row.rate || row['unit rate (₹)']).replace(/[^\d.]/g, '')) || 0
        });
      });
      table.setData(dbState.inventory);
    }
  });

  // Wire up creation form modal
  container.querySelector('#btn-create-inventory').addEventListener('click', () => {
    const formHtml = `
      <div class="form-group" style="margin-bottom: 12px;">
        <label for="inv-name">Material Description / Name *</label>
        <input type="text" id="inv-name" class="form-control" placeholder="e.g. Tinted Float Glass (6mm)" required>
      </div>
      <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div class="form-group">
          <label for="inv-qty">Current Stock Level *</label>
          <input type="number" id="inv-qty" class="form-control" placeholder="e.g. 100" required>
        </div>
        <div class="form-group">
          <label for="inv-threshold">Min Reorder Threshold *</label>
          <input type="number" id="inv-threshold" class="form-control" placeholder="e.g. 20" required>
        </div>
      </div>
      <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div class="form-group">
          <label for="inv-unit">Unit of Measure *</label>
          <input type="text" id="inv-unit" class="form-control" placeholder="e.g. Sft, m, Pcs, Tubes" required>
        </div>
        <div class="form-group">
          <label for="inv-rate">Unit Rate (₹) *</label>
          <input type="number" step="0.01" id="inv-rate" class="form-control" placeholder="e.g. 350" required>
        </div>
      </div>
    `;

    showModal('Add Material to Inventory', formHtml, (formEl) => {
      const payload = {
        name: formEl.querySelector('#inv-name').value,
        quantity: parseFloat(formEl.querySelector('#inv-qty').value) || 0,
        threshold: parseFloat(formEl.querySelector('#inv-threshold').value) || 0,
        unit: formEl.querySelector('#inv-unit').value,
        rate: parseFloat(formEl.querySelector('#inv-rate').value) || 0
      };
      
      dbState.createInventoryItem(payload);
      table.setData(dbState.state.inventory);
      return true;
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 3. PRODUCTION & SCHEDULING
function renderProduction(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700;">Manufacturing scheduling & Shop-floor Orders</h3>
      <div id="production-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'order_no', label: 'Order Number' },
    { key: 'project_id', label: 'Project ID' },
    { key: 'item', label: 'Product Assembly Item' },
    { key: 'qty', label: 'Scheduled Quantity' },
    { key: 'status', label: 'Production Status', render: val => {
      const isProgress = val === 'In Production';
      return `<span class="badge ${isProgress ? 'badge-warning' : 'badge-info'}">${val}</span>`;
    }},
    { key: 'due_date', label: 'Target Handover' }
  ];

  const table = new GlassTable({
    container: container.querySelector('#production-table-mount'),
    headers: headers,
    data: state.production,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createProductionOrder({
          order_no: row.order_no || row['order number'],
          project_id: row.project_id || row['project id'],
          item: row.item || row['product assembly item'],
          qty: parseFloat(String(row.qty || row['scheduled quantity']).replace(/[^\d.]/g, '')) || 0,
          status: row.status || row['production status'] || 'Scheduled',
          due_date: row.due_date || row['target handover']
        });
      });
      table.setData(dbState.state.production);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 4. CUSTOMERS CRM LIST
function renderCustomers(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0;">CRM Customer Directory & Receivables Balance</h3>
        <button class="btn btn-primary" id="btn-add-customer"><i data-lucide="plus"></i> Add Customer</button>
      </div>
      <div id="customers-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'id', label: 'Customer ID' },
    { key: 'name', label: 'Company Name' },
    { key: 'contact', label: 'Primary Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Mobile Number' },
    { key: 'outstanding', label: 'Outstanding Receivables (₹)', render: val => inrFormat.format(val) }
  ];

  const table = new GlassTable({
    container: container.querySelector('#customers-table-mount'),
    headers: headers,
    data: state.customers,
    onDeleteSelected: (selectedRows) => {
      const ids = selectedRows.map(row => row.id);
      dbState.deleteCustomers(ids);
      renderCustomers(container);
    },
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createCustomer({
          id: row.id || row['customer id'],
          name: row.name || row['company name'],
          contact: row.contact || row['primary contact person'],
          email: row.email || '',
          phone: row.phone || row['mobile number'] || '',
          outstanding: parseFloat(String(row.outstanding || row['outstanding receivables (₹)']).replace(/[^\d.]/g, '')) || 0
        });
      });
      renderCustomers(container);
    }
  });

  // Bind Add Customer button
  container.querySelector('#btn-add-customer').addEventListener('click', () => {
    const formHtml = `
      <div style="text-align: left;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="cust-name">Company Name *</label>
          <input type="text" id="cust-name" class="form-control" placeholder="e.g. Acme Builders Ltd" required>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="cust-contact">Primary Contact Person *</label>
          <input type="text" id="cust-contact" class="form-control" placeholder="e.g. John Doe" required>
        </div>
        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="cust-email">Email Address</label>
            <input type="email" id="cust-email" class="form-control" placeholder="e.g. info@acme.com">
          </div>
          <div class="form-group">
            <label for="cust-phone">Mobile Number</label>
            <input type="tel" id="cust-phone" class="form-control" placeholder="e.g. 9876543210">
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="cust-outstanding">Initial Outstanding Receivables (₹)</label>
          <input type="number" step="0.01" id="cust-outstanding" class="form-control" placeholder="0.00" value="0.00">
        </div>
      </div>
    `;

    showModal('Add New Customer', formHtml, (formEl) => {
      try {
        const payload = {
          name: formEl.querySelector('#cust-name').value,
          contact: formEl.querySelector('#cust-contact').value,
          email: formEl.querySelector('#cust-email').value,
          phone: formEl.querySelector('#cust-phone').value,
          outstanding: parseFloat(formEl.querySelector('#cust-outstanding').value) || 0
        };

        dbState.createCustomer(payload);
        renderCustomers(container);
        return true;
      } catch (err) {
        alert(err.message);
        return false;
      }
    });

    const modalEl = document.querySelector('.modal-overlay');
    if (modalEl) {
      const btnAutofill = modalEl.querySelector('.btn-modal-autofill');
      if (btnAutofill) {
        btnAutofill.addEventListener('click', () => {
          modalEl.querySelector('#cust-name').value = 'Lodha Developers';
          modalEl.querySelector('#cust-contact').value = 'Amit Lodha';
          modalEl.querySelector('#cust-email').value = 'amit@lodha.in';
          modalEl.querySelector('#cust-phone').value = '9812345678';
          modalEl.querySelector('#cust-outstanding').value = '550000.00';
        });
      }
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 5. VENDORS DIRECTORY
function renderVendors(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0;">Vendor Directory & Accounts Payable</h3>
        <button class="btn btn-primary" id="btn-add-vendor"><i data-lucide="plus"></i> Add Vendor</button>
      </div>
      <div id="vendors-table-mount"></div>
    </div>
  `;

  const headers = [
    { key: 'id', label: 'Vendor ID' },
    { key: 'name', label: 'Supplier Company Name' },
    { key: 'contact', label: 'Sales Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'outstanding', label: 'Accounts Payable Owed (₹)', render: val => inrFormat.format(val) }
  ];

  const table = new GlassTable({
    container: container.querySelector('#vendors-table-mount'),
    headers: headers,
    data: state.vendors,
    onDeleteSelected: (selectedRows) => {
      const ids = selectedRows.map(row => row.id);
      dbState.deleteVendors(ids);
      renderVendors(container);
    },
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.createVendor({
          id: row.id || row['vendor id'],
          name: row.name || row['supplier company name'],
          contact: row.contact || row['sales contact person'],
          email: row.email || '',
          phone: row.phone || '',
          outstanding: parseFloat(String(row.outstanding || row['accounts payable owed (₹)']).replace(/[^\d.]/g, '')) || 0
        });
      });
      renderVendors(container);
    }
  });

  // Bind Add Vendor button
  container.querySelector('#btn-add-vendor').addEventListener('click', () => {
    const formHtml = `
      <div style="text-align: left;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="vend-name">Supplier Company Name *</label>
          <input type="text" id="vend-name" class="form-control" placeholder="e.g. Asahi Glass India" required>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="vend-contact">Sales Contact Person *</label>
          <input type="text" id="vend-contact" class="form-control" placeholder="e.g. Jane Smith" required>
        </div>
        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="vend-email">Email Address</label>
            <input type="email" id="vend-email" class="form-control" placeholder="e.g. sales@asahi.com">
          </div>
          <div class="form-group">
            <label for="vend-phone">Mobile Number</label>
            <input type="tel" id="vend-phone" class="form-control" placeholder="e.g. 9811223344">
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="vend-outstanding">Initial Payable Balance (₹)</label>
          <input type="number" step="0.01" id="vend-outstanding" class="form-control" placeholder="0.00" value="0.00">
        </div>
      </div>
    `;

    showModal('Add New Vendor', formHtml, (formEl) => {
      try {
        const payload = {
          name: formEl.querySelector('#vend-name').value,
          contact: formEl.querySelector('#vend-contact').value,
          email: formEl.querySelector('#vend-email').value,
          phone: formEl.querySelector('#vend-phone').value,
          outstanding: parseFloat(formEl.querySelector('#vend-outstanding').value) || 0
        };

        dbState.createVendor(payload);
        renderVendors(container);
        return true;
      } catch (err) {
        alert(err.message);
        return false;
      }
    });

    const modalEl = document.querySelector('.modal-overlay');
    if (modalEl) {
      const btnAutofill = modalEl.querySelector('.btn-modal-autofill');
      if (btnAutofill) {
        btnAutofill.addEventListener('click', () => {
          modalEl.querySelector('#vend-name').value = 'Pilkington Glass';
          modalEl.querySelector('#vend-contact').value = 'Robert Pilkington';
          modalEl.querySelector('#vend-email').value = 'orders@pilkington.com';
          modalEl.querySelector('#vend-phone').value = '7611223344';
          modalEl.querySelector('#vend-outstanding').value = '250000.00';
        });
      }
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Reusable overlay glass modal UI helper
export function showModal(title, bodyHtml, onSave, customWidth = '500px') {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  
  overlay.dataset.exportOnSave = 'false';
  
  overlay.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: ${customWidth}; margin-top: 5vh; width: 95%;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; margin: 0;">${title}</h3>
        <button type="button" class="btn-close" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; line-height: 1; padding: 0 5px;">&times;</button>
      </div>
      <form id="modal-form">
        ${bodyHtml}
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid var(--border-glass); padding-top: 15px;" class="print-actions-toolbar">
          <button type="button" class="btn btn-secondary btn-modal-autofill" style="margin-right: auto; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
          <button type="button" class="btn btn-secondary btn-cancel">Cancel</button>
          ${title.includes('Quotation') ? `
            <button type="button" class="btn btn-secondary btn-save-print" style="background: var(--debit-bg); color: var(--debit-color); border: 1px solid rgba(16, 185, 129, 0.2);"><i data-lucide="printer" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Save & Export PDF</button>
          ` : ''}
          <button type="submit" class="btn btn-primary btn-save">Save changes</button>
        </div>
      </form>
    </div>
  `;
  
  const close = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };
  
  overlay.querySelector('.btn-close').addEventListener('click', close);
  overlay.querySelector('.btn-cancel').addEventListener('click', close);
  
  const savePrintBtn = overlay.querySelector('.btn-save-print');
  if (savePrintBtn) {
    savePrintBtn.addEventListener('click', () => {
      overlay.dataset.exportOnSave = 'true';
      form.requestSubmit();
    });
  }
  
  const btnModalAutofill = overlay.querySelector('.btn-modal-autofill');
  if (btnModalAutofill) {
    btnModalAutofill.addEventListener('click', () => {
      if (title.includes('Material')) {
        form.querySelector('#inv-name').value = 'Laminated Safety Glass (8mm)';
        form.querySelector('#inv-qty').value = '150';
        form.querySelector('#inv-threshold').value = '40';
        form.querySelector('#inv-unit').value = 'Sft';
        form.querySelector('#inv-rate').value = '620';
      } else if (title.includes('Quotation')) {
        form.querySelector('#quote-customer').value = 'Hiranandani Developers';
        form.querySelector('#quote-project').value = 'Hiranandani Gardens Glass Atrium';
        form.querySelector('#quote-client-address').value = 'Hiranandani Business Park, Powai, Mumbai - 400076';
        form.querySelector('#quote-client-email').value = 'procurement@hiranandani.net';
        form.querySelector('#quote-client-phone').value = '022-25762100';
        form.querySelector('#quote-client-gstin').value = '27AAACH8811M1Z2';
        form.querySelector('#quote-client-state').value = '27';
        form.querySelector('#quote-status').value = 'Sent';
        form.querySelector('#quote-transport').value = '12500';
        
        const tbody = form.querySelector('#quote-items-tbody');
        const rows = tbody.querySelectorAll('.item-row');
        if (rows.length > 0) {
          const firstRow = rows[0];
          firstRow.querySelector('.item-name').value = 'Laminated Safety Glass (10mm)';
          firstRow.querySelector('.item-desc').value = 'Custom size clear sheets';
          firstRow.querySelector('.item-size').value = '3000 x 2400 mm';
          firstRow.querySelector('.item-qty').value = '800';
          firstRow.querySelector('.item-unit').value = 'Sft';
          firstRow.querySelector('.item-price').value = '750';
        }
        
        form.querySelectorAll('.item-qty, .item-price, #quote-transport').forEach(el => {
          el.dispatchEvent(new Event('input'));
        });
      }
    });
  }
  
  const form = overlay.querySelector('#modal-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (onSave(form, overlay.dataset.exportOnSave === 'true')) {
      close();
    }
  });
  
  overlay.offsetHeight; // force layout
  overlay.classList.add('active');
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 6. HELPER FUNCTIONS & PRINT VIEW ENGINE
function setupQuotationFormInteractions(modalOverlay, defaultValidity) {
  const tbody = modalOverlay.querySelector('#quote-items-tbody');
  const btnAdd = modalOverlay.querySelector('#btn-add-item-row');
  const validityInput = modalOverlay.querySelector('#quote-validity');
  const transportInput = modalOverlay.querySelector('#quote-transport');

  if (validityInput) {
    validityInput.value = defaultValidity;
  }

  let rowCount = 0;

  function addRow() {
    const tr = document.createElement('tr');
    tr.className = 'item-row';
    tr.dataset.index = rowCount;
    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    tr.innerHTML = `
      <td style="padding: 6px 4px;">
        <input type="text" class="form-control item-name" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" placeholder="e.g. Glass Sheet">
      </td>
      <td style="padding: 6px 4px;">
        <input type="text" class="form-control item-desc" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" placeholder="e.g. Clear float">
      </td>
      <td style="padding: 6px 4px;">
        <input type="text" class="form-control item-size" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" placeholder="e.g. 10x12">
      </td>
      <td style="padding: 6px 4px;">
        <input type="number" class="form-control item-qty" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" min="0" value="" placeholder="0">
      </td>
      <td style="padding: 6px 4px;">
        <input type="text" class="form-control item-unit" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" placeholder="e.g. Sft">
      </td>
      <td style="padding: 6px 4px;">
        <input type="number" step="0.01" class="form-control item-price" style="padding: 4px 6px; font-size: 0.8rem; color: var(--text-primary); background: var(--input-bg);" placeholder="0.00">
      </td>
      <td style="padding: 6px 4px; text-align: right; font-weight: 600; color: var(--text-primary);" class="item-amount">
        ₹0.00
      </td>
      <td style="padding: 6px 4px; text-align: center;">
        <button type="button" class="btn-delete-row" style="background: transparent; border: none; color: var(--credit-color); cursor: pointer; font-size: 1.15rem; line-height: 1;">&times;</button>
      </td>
    </tr>
  `;

    tbody.appendChild(tr);
    rowCount++;

    tr.querySelector('.item-qty').addEventListener('input', () => recalculateQuotationTotals(modalOverlay));
    tr.querySelector('.item-price').addEventListener('input', () => recalculateQuotationTotals(modalOverlay));
    
    tr.querySelector('.btn-delete-row').addEventListener('click', () => {
      tr.remove();
      recalculateQuotationTotals(modalOverlay);
    });

    recalculateQuotationTotals(modalOverlay);
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', addRow);
  }

  if (transportInput) {
    transportInput.addEventListener('input', () => recalculateQuotationTotals(modalOverlay));
  }

  // GST selector: show/hide custom input and recalculate
  const gstSelectEl = modalOverlay.querySelector('#quote-gst-select');
  const gstCustomEl = modalOverlay.querySelector('#quote-gst-custom');
  if (gstSelectEl) {
    gstSelectEl.addEventListener('change', () => {
      if (gstCustomEl) {
        gstCustomEl.style.display = gstSelectEl.value === 'custom' ? 'inline-block' : 'none';
        if (gstSelectEl.value === 'custom') gstCustomEl.focus();
      }
      recalculateQuotationTotals(modalOverlay);
    });
  }
  if (gstCustomEl) {
    gstCustomEl.addEventListener('input', () => recalculateQuotationTotals(modalOverlay));
  }

  addRow();
}

function recalculateQuotationTotals(modalEl) {
  let subtotal = 0;
  const rows = modalEl.querySelectorAll('.item-row');
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const amount = qty * price;
    subtotal += amount;
    row.querySelector('.item-amount').textContent = inrFormat.format(amount);
  });

  const transport = parseFloat(modalEl.querySelector('#quote-transport').value) || 0;

  // Read selected GST rate
  const gstSelectEl = modalEl.querySelector('#quote-gst-select');
  const gstCustomEl = modalEl.querySelector('#quote-gst-custom');
  let gstRate = 0.18; // default
  if (gstSelectEl) {
    const val = gstSelectEl.value;
    gstRate = val === 'custom'
      ? (parseFloat(gstCustomEl ? gstCustomEl.value : 0) || 0) / 100
      : parseFloat(val) / 100;
  }

  const gst = (subtotal + transport) * gstRate;
  const grandTotal = subtotal + transport + gst;

  modalEl.querySelector('#summary-subtotal').textContent = inrFormat.format(subtotal);
  modalEl.querySelector('#summary-transport').textContent = inrFormat.format(transport);
  modalEl.querySelector('#summary-gst').textContent = inrFormat.format(gst);
  modalEl.querySelector('#summary-total').textContent = inrFormat.format(grandTotal);

  // Update the GST label to reflect selected rate
  const gstLabelEl = modalEl.querySelector('#gst-label');
  if (gstLabelEl) {
    const pct = Math.round(gstRate * 100);
    gstLabelEl.textContent = pct > 0 ? `GST (${pct}%):` : 'GST (None):';
  }

  return { subtotal, transport, gst, grandTotal };
}

function convertNumberToWords(num) {
  num = Math.round(num * 100) / 100;
  if (num <= 0) return 'Rupees Zero Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function helper(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + helper(n % 100) : '');
    if (n < 100000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
    if (n < 10000000) return helper(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + helper(n % 100000) : '');
    return helper(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + helper(n % 10000000) : '');
  }

  const parts = String(num).split('.');
  const rupees = parseInt(parts[0]) || 0;
  const paise = parts[1] ? parseInt(parts[1].substring(0, 2).padEnd(2, '0')) : 0;

  let words = '';
  if (rupees > 0) {
    words = 'Rupees ' + helper(rupees).trim();
  } else {
    words = 'Rupees Zero';
  }
  
  if (paise > 0) {
    words += ' and ' + helper(paise).trim() + ' Paise';
  }
  return words + ' Only';
}

function showQuotationInvoiceModal(quote) {
  const settings = dbState.state.settings;
  
  // Use saved GST rate from quote, default to 0 if not set (no mandatory GST)
  const savedGstRate = (quote.gstRate !== undefined && quote.gstRate !== null) ? quote.gstRate : 0.18;
  const subtotal = quote.items ? quote.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) : quote.amount;
  const transport = parseFloat(quote.transportCharges) || 0;
  const taxableSum = subtotal + transport;
  const totalTax = taxableSum * savedGstRate;
  const grandTotal = taxableSum + totalTax;
  const gstPct = Math.round(savedGstRate * 100);

  const amountInWords = convertNumberToWords(grandTotal);

  let itemsHtml = '';
  if (quote.items && quote.items.length > 0) {
    quote.items.forEach((item, index) => {
      itemsHtml += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center; color: #111827; font-weight: 600;">${index + 1}</td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb;">
            <div style="font-weight: 700; color: #111827;">${item.name || '—'}</div>
            ${item.description ? `<div style="font-size: 0.75rem; color: #374151; margin-top: 2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center; color: #111827; font-weight: 600;">${item.size || '—'}</td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center; color: #111827; font-weight: 600;">${item.quantity || '—'}</td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center; color: #111827; font-weight: 600;">${item.unit || 'units'}</td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600;">${inrFormat.format(item.price)}</td>
          <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 700;">${inrFormat.format(item.amount)}</td>
        </tr>
      `;
    });
  } else {
    itemsHtml = `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center;">1</td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb;">
          <div style="font-weight: 700; color: #111827;">${quote.project || 'Glass Supply / Facade Works'}</div>
          <div style="font-size: 0.75rem; color: #4b5563; margin-top: 2px;">Custom glass fabrication and installation</div>
        </td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center;">Standard</td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center;">1</td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center;">Job</td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: right;">${inrFormat.format(quote.amount)}</td>
        <td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${inrFormat.format(quote.amount)}</td>
      </tr>
    `;
  }

  const isLocal = !quote.clientState || quote.clientState === settings.gstStateCode;
  let taxRowsHtml = '';
  if (gstPct === 0) {
    taxRowsHtml = `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 7px 4px; color: #4b5563;">GST:</td>
        <td style="padding: 7px 4px; text-align: right; color: #111827;">Not Applicable (0%)</td>
      </tr>
    `;
  } else if (isLocal) {
    const halfPct = gstPct / 2;
    const halfTax = totalTax / 2;
    taxRowsHtml = `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 7px 4px; color: #4b5563;">CGST (${halfPct}%):</td>
        <td style="padding: 7px 4px; text-align: right; color: #111827;">${inrFormat.format(halfTax)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 7px 4px; color: #4b5563;">SGST (${halfPct}%):</td>
        <td style="padding: 7px 4px; text-align: right; color: #111827;">${inrFormat.format(halfTax)}</td>
      </tr>
    `;
  } else {
    taxRowsHtml = `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 7px 4px; color: #4b5563;">IGST (${gstPct}%):</td>
        <td style="padding: 7px 4px; text-align: right; color: #111827;">${inrFormat.format(totalTax)}</td>
      </tr>
    `;
  }

  const termsList = settings.termsAndConditions 
    ? settings.termsAndConditions.split('\n').map(line => `<div style="margin-bottom:3px;">${line}</div>`).join('') 
    : '';

  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: 850px; margin-top: 3vh; width: 95%; background: rgba(18, 26, 42, 0.95);">
      <div class="modal-header print-actions-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-primary);">Quotation Invoice Sheet Preview</h3>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-primary btn-print-invoice" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="printer" style="width: 16px; height: 16px;"></i> Print / Export PDF
          </button>
          <button type="button" class="btn btn-secondary btn-close-preview" style="font-size: 1.25rem; line-height: 1; padding: 4px 10px; height: 36px; display: flex; align-items: center; justify-content: center;">
            &times; Close
          </button>
        </div>
      </div>

      <div style="max-height: 75vh; overflow-y: auto; padding: 10px 5px;" class="preview-scroll-container">
        <!-- Exact replica printable sheet -->
        <div class="invoice-container printable-sheet" style="font-family: 'Inter', sans-serif; color: #111827; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 780px; margin: 0 auto; line-height: 1.45; font-size: 0.82rem; border: 1px solid #e5e7eb;">
          
          <!-- Brand Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 22px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 70px; height: 70px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; ${settings.companyLogo ? 'border: 1px solid #e5e7eb; background: #fff; padding: 4px;' : 'background: #2563eb; box-shadow: 0 4px 10px rgba(37,99,235,0.2);'}">
                ${settings.companyLogo
                  ? `<img src="${settings.companyLogo}" alt="Logo" style="width:100%; height:100%; object-fit:contain;">`
                  : `<svg width="34" height="34" viewBox="0 0 100 100"><circle cx="50" cy="45" r="18" fill="none" stroke="#ffffff" stroke-width="9"/><path d="M68,27 L68,65 C68,78 57,88 44,88 C34,88 27,82 25,74" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/></svg>`
                }
              </div>
              <div>
                <h2 style="font-size: 1.65rem; font-weight: 800; color: #111827; margin: 0; letter-spacing: 0.04em; font-family: 'Outfit', sans-serif;">${settings.companyName || 'GLASSOLOGY'}</h2>
                <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 0.75rem; max-width: 340px; line-height: 1.35;">${settings.companyAddress || ''}</p>
                <p style="margin: 3px 0 0 0; color: #4b5563; font-size: 0.75rem;">Email: ${settings.companyEmail || ''} | Phone: ${settings.companyPhone || ''}</p>
                <p style="margin: 3px 0 0 0; color: #111827; font-weight: 700; font-size: 0.78rem;">GSTIN: ${settings.companyGstin || ''}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 1.5rem; font-weight: 950; color: #2563eb; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Outfit', sans-serif;">Sales Quotation</h1>
              <table style="font-size: 0.75rem; border-collapse: collapse; margin-left: auto; text-align: left;">
                <tr>
                  <td style="padding: 2px 8px; font-weight: 700; color: #4b5563; border-right: 1px solid #e5e7eb;">Quotation No:</td>
                  <td style="padding: 2px 8px; font-weight: 800; color: #111827;">${quote.id}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px; font-weight: 700; color: #4b5563; border-right: 1px solid #e5e7eb;">Date Created:</td>
                  <td style="padding: 2px 8px; color: #111827;">${quote.date}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px; font-weight: 700; color: #4b5563; border-right: 1px solid #e5e7eb;">Valid Until:</td>
                  <td style="padding: 2px 8px; color: #111827;">${quote.validity}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 8px; font-weight: 700; color: #4b5563; border-right: 1px solid #e5e7eb;">State Code:</td>
                  <td style="padding: 2px 8px; color: #111827;">${settings.gstStateCode || '27'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Customer info -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin-bottom: 22px; display: flex; justify-content: space-between;">
            <div style="flex: 1.5; padding-right: 15px;">
              <h4 style="font-size: 0.72rem; font-weight: 800; color: #4b5563; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; letter-spacing: 0.05em;">Quotation For (Client)</h4>
              <p style="margin: 2px 0; font-size: 0.95rem; font-weight: 700; color: #111827;">${quote.customer || 'Walk-in Customer'}</p>
              ${quote.clientAddress ? `<p style="margin: 3px 0; color: #4b5563; font-size: 0.78rem; line-height: 1.35;">${quote.clientAddress}</p>` : ''}
              <p style="margin: 3px 0; color: #4b5563; font-size: 0.78rem;">
                ${quote.clientEmail ? `Email: ${quote.clientEmail}` : ''}
                ${quote.clientEmail && quote.clientPhone ? ' | ' : ''}
                ${quote.clientPhone ? `Phone: ${quote.clientPhone}` : ''}
              </p>
              ${quote.clientGstin ? `<p style="margin: 3px 0; color: #111827; font-weight: 700; font-size: 0.78rem;">GSTIN: ${quote.clientGstin}</p>` : ''}
            </div>
            <div style="flex: 0.8; text-align: right; border-left: 1px solid #e5e7eb; padding-left: 15px; display: flex; flex-direction: column; justify-content: center;">
              <p style="margin: 0; color: #4b5563; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.02em;">Place of Supply</p>
              <p style="margin: 4px 0 0 0; font-weight: 700; color: #111827; font-size: 0.85rem;">GST State Code: ${quote.clientState || '27'}</p>
              ${quote.project ? `<p style="margin: 6px 0 0 0; color: #4b5563; font-size: 0.75rem;">Project: <strong>${quote.project}</strong></p>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 0.78rem;">
            <thead>
              <tr style="background: #2563eb; color: #ffffff;">
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: center; width: 45px;">S.No.</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: left;">Item & Description</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: center; width: 100px;">Size</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: center; width: 60px;">Unit</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: right; width: 100px;">Price (₹)</th>
                <th style="padding: 10px 8px; border: 1px solid #2563eb; text-align: right; width: 110px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Bottom Summary block -->
          <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; margin-bottom: 25px; align-items: start;">
            <div>
              <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px; background: #f9fafb;">
                <h4 style="font-size: 0.72rem; font-weight: 800; color: #4b5563; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; letter-spacing: 0.05em;">Our Bank Details</h4>
                <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse; text-align: left;">
                  <tr>
                    <td style="padding: 3px 0; color: #4b5563; width: 95px; font-weight: 600;">Bank Name:</td>
                    <td style="padding: 3px 0; font-weight: 700; color: #111827;">${settings.bankName || ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #4b5563; font-weight: 600;">Account Name:</td>
                    <td style="padding: 3px 0; color: #111827;">${settings.bankAccName || ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #4b5563; font-weight: 600;">Account No:</td>
                    <td style="padding: 3px 0; font-weight: 700; color: #111827; font-family: monospace; font-size: 0.8rem;">${settings.bankAccNo || ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #4b5563; font-weight: 600;">IFSC Code:</td>
                    <td style="padding: 3px 0; font-weight: 700; color: #111827; font-family: monospace; font-size: 0.8rem;">${settings.bankIfsc || ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0; color: #4b5563; font-weight: 600;">Branch:</td>
                    <td style="padding: 3px 0; color: #111827;">${settings.bankBranch || ''}</td>
                  </tr>
                </table>
              </div>
              
              <div style="font-size: 0.74rem; color: #4b5563; line-height: 1.45;">
                <span style="font-weight: 800; color: #111827; display: block; margin-bottom: 3px; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.02em;">Total Amount in Words:</span>
                <span style="font-style: italic; color: #111827; font-weight: 700; font-size: 0.8rem;">${amountInWords}</span>
              </div>
            </div>

            <div>
              <table style="width: 100%; font-size: 0.78rem; border-collapse: collapse; text-align: left;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 7px 4px; color: #4b5563;">Subtotal:</td>
                  <td style="padding: 7px 4px; text-align: right; font-weight: 600; color: #111827;">${inrFormat.format(subtotal)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 7px 4px; color: #4b5563;">Transport Charges:</td>
                  <td style="padding: 7px 4px; text-align: right; font-weight: 600; color: #111827;">${inrFormat.format(transport)}</td>
                </tr>
                ${taxRowsHtml}
                <tr style="background: #2563eb; color: #ffffff; font-size: 0.98rem; font-weight: 800;">
                  <td style="padding: 10px 8px; border: 1px solid #2563eb;">Grand Total:</td>
                  <td style="padding: 10px 8px; border: 1px solid #2563eb; text-align: right;">${inrFormat.format(grandTotal)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Bottom: Terms & Conditions and Signature Area -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 18px; display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 24px; font-size: 0.74rem;">
            <div>
              <h4 style="font-weight: 800; color: #111827; margin: 0 0 6px 0; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.02em;">Terms & Conditions:</h4>
              <div style="color: #4b5563; line-height: 1.45; font-size: 0.74rem;">
                ${termsList}
              </div>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: space-between; height: 110px; text-align: right;">
              <p style="margin: 0; font-weight: 700; color: #111827; font-size: 0.78rem;">For <strong>${settings.companyName || 'GLASSOLOGY'}</strong></p>
              <div style="margin-top: auto; border-top: 1px dashed #d1d5db; padding-top: 6px; font-size: 0.7rem; color: #4b5563; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em;">
                Authorized Signatory
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `;

  const close = () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('.btn-close-preview').addEventListener('click', close);
  overlay.querySelector('.btn-print-invoice').addEventListener('click', () => {
    window.print();
  });

  overlay.offsetHeight; // force layout
  overlay.classList.add('active');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

