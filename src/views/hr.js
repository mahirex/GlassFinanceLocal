import { dbState, round, uuid } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';
import { showModal } from './operations.js';

export function renderHR(container, viewName) {
  if (viewName === 'employees') {
    renderEmployeeDirectory(container);
  } else if (viewName === 'attendance') {
    renderAttendanceRoster(container);
  } else if (viewName === 'employee-advances') {
    renderEmployeeAdvancesBoard(container);
  } else if (viewName === 'petrol') {
    renderPetrolAdvancesBoard(container);
  }
}

// 1. COMPREHENSIVE EMPLOYEE DIRECTORY & PROFILE VIEW
// 1. COMPREHENSIVE EMPLOYEE DIRECTORY & PROFILE VIEW
function renderEmployeeDirectory(container) {
  const state = dbState.state;

  // Initialize employee columns in settings if not present
  if (!state.settings.employeeColumns) {
    state.settings.employeeColumns = [
      { key: 'name', label: 'Name' },
      { key: 'employee_id', label: 'ID' },
      { key: 'designation', label: 'Designation' }
    ];
  }

  const headers = state.settings.employeeColumns;
  const standardKeys = ['name', 'employee_id', 'designation', 'email', 'mobile', 'address', 'pan', 'aadhaar_status', 'joining_date', 'salary_type', 'base_salary'];

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1.2fr 2fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Left Column: Add Employee Button & Quick Directory -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="glass-panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
              Staff Directory
            </h3>
            <button type="button" class="btn btn-primary" id="btn-add-employee" style="padding: 6px 12px; font-size: 0.8rem;">
              <i data-lucide="user-plus" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Onboard
            </button>
          </div>
          
          <div style="display: flex; gap: 8px; margin-bottom: 15px;">
            <button type="button" class="btn btn-secondary" id="btn-export-emp" style="padding: 4px 10px; font-size: 0.75rem; flex: 1;"><i data-lucide="download" style="width: 12px; height: 12px; margin-right: 4px;"></i> Export</button>
            <label class="btn btn-secondary" style="cursor: pointer; padding: 4px 10px; font-size: 0.75rem; margin: 0; flex: 1; text-align: center;">
              <i data-lucide="upload" style="width: 12px; height: 12px; margin-right: 4px;"></i> Import
              <input type="file" id="import-emp-csv" accept=".csv" style="display: none;">
            </label>
            <button type="button" class="btn btn-secondary" id="btn-add-column" style="padding: 4px 10px; font-size: 0.75rem; flex: 1;"><i data-lucide="plus-circle" style="width: 12px; height: 12px; margin-right: 4px;"></i> Add Column</button>
          </div>

          <div id="employee-list-table-mount"></div>
        </div>
      </div>

      <!-- Right Column: Immersive Profile Tabbed Panel -->
      <div class="glass-panel" id="employee-profile-mount" style="min-height: 550px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
        <div style="text-align: center;">
          <i data-lucide="contact" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 10px; color: var(--accent-color);"></i>
          <p>Select an employee from the registry list to load their profile workspaces.</p>
        </div>
      </div>
    </div>
  `;

  // Draw list table with dynamic columns
  const table = new GlassTable({
    container: container.querySelector('#employee-list-table-mount'),
    headers: headers,
    data: state.employees,
    onRowClick: (row) => {
      renderEmployeeProfile(container.querySelector('#employee-profile-mount'), row, container);
    },
    onDeleteSelected: (selectedRows) => {
      const ids = selectedRows.map(row => row.employee_id);
      dbState.deleteEmployees(ids);
      renderEmployeeDirectory(container);
    }
  });

  // Add Dynamic Custom Column Listener
  container.querySelector('#btn-add-column').addEventListener('click', () => {
    const modalHtml = `
      <div style="text-align: left;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="new-col-label">Column Name *</label>
          <input type="text" id="new-col-label" class="form-control" placeholder="e.g. Location, Department, Blood Group" required>
        </div>
      </div>
    `;

    showModal('Add Custom Column', modalHtml, (formEl) => {
      const columnName = formEl.querySelector('#new-col-label').value;
      if (columnName && columnName.trim()) {
        const label = columnName.trim();
        const key = label.toLowerCase().replace(/\s+/g, '_');
        
        // Prevent duplicates
        if (state.settings.employeeColumns.some(col => col.key === key)) {
          alert("A column with this name already exists.");
          return false;
        }
        
        state.settings.employeeColumns.push({ key: key, label: label });
        dbState.updateSettings({ employeeColumns: state.settings.employeeColumns });
        renderEmployeeDirectory(container);
        return true;
      }
      return false;
    });
  });

  // Modal Onboard
  container.querySelector('#btn-add-employee').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];

    // Build custom fields inputs dynamically
    let customFieldsHtml = '';
    headers.forEach(col => {
      if (!standardKeys.includes(col.key)) {
        customFieldsHtml += `
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="emp-custom-${col.key}">${col.label}</label>
            <input type="text" id="emp-custom-${col.key}" class="form-control" placeholder="Enter ${col.label}">
          </div>
        `;
      }
    });

    const formHtml = `
      <div style="text-align: left;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="emp-name">Full Name *</label>
          <input type="text" id="emp-name" class="form-control" placeholder="Rohan Sharma" required>
        </div>
        
        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="emp-email">Email Address</label>
            <input type="email" id="emp-email" class="form-control" placeholder="rohan@glasserp.in">
          </div>
          <div class="form-group">
            <label for="emp-mobile">Mobile Number</label>
            <input type="tel" id="emp-mobile" class="form-control" placeholder="9820012345">
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label for="emp-address">Residential Address</label>
          <input type="text" id="emp-address" class="form-control" placeholder="Flat No, Wing, Area, City">
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="emp-pan">PAN (Tax ID)</label>
            <input type="text" id="emp-pan" class="form-control" placeholder="ABCDE1234F" style="text-transform: uppercase;">
          </div>
          <div class="form-group">
            <label for="emp-aadhaar">Aadhaar Status</label>
            <select id="emp-aadhaar">
              <option value="Verified (Physical Check)">Verified (Physical Check)</option>
              <option value="Pending Check">Pending Physical verification</option>
              <option value="Not Provided">Not Provided</option>
            </select>
          </div>
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
          <div class="form-group">
            <label for="emp-designation">Designation</label>
            <input type="text" id="emp-designation" class="form-control" placeholder="Structural Engineer">
          </div>
          <div class="form-group">
            <label for="emp-salary-type">Salary Type</label>
            <select id="emp-salary-type">
              <option value="Monthly">Monthly Salary</option>
              <option value="Weekly">Weekly Wage</option>
              <option value="Daily Wage">Daily Wage</option>
              <option value="Contract">Contractual Basis</option>
            </select>
          </div>
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
          <div class="form-group">
            <label for="emp-salary-amt">Base Salary / Wage (₹)</label>
            <input type="number" id="emp-salary-amt" class="form-control" placeholder="75,000">
          </div>
          <div class="form-group">
            <label for="emp-join">Joining Date</label>
            <input type="date" id="emp-join" class="form-control" value="${today}">
          </div>
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 15px;">
          <div class="form-group">
            <label for="emp-bank-name">Bank Name</label>
            <input type="text" id="emp-bank-name" class="form-control" placeholder="HDFC Bank">
          </div>
          <div class="form-group">
            <label for="emp-account-number">Account Number</label>
            <input type="text" id="emp-account-number" class="form-control" placeholder="50100293849102">
          </div>
          <div class="form-group">
            <label for="emp-ifsc-code">IFSC Code</label>
            <input type="text" id="emp-ifsc-code" class="form-control" placeholder="HDFC0000104">
          </div>
        </div>

        <!-- Custom Fields Section -->
        ${customFieldsHtml}

        <div style="display: flex; gap: 12px; margin-top: 10px;">
          <button type="button" class="btn btn-secondary btn-autofill-emp" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
        </div>
      </div>
    `;

    showModal('Onboard New Employee', formHtml, (formEl) => {
      try {
        const payload = {
          name: formEl.querySelector('#emp-name').value,
          email: formEl.querySelector('#emp-email').value,
          mobile: formEl.querySelector('#emp-mobile').value,
          address: formEl.querySelector('#emp-address').value,
          pan: formEl.querySelector('#emp-pan').value,
          aadhaar_status: formEl.querySelector('#emp-aadhaar').value,
          designation: formEl.querySelector('#emp-designation').value,
          salary_type: formEl.querySelector('#emp-salary-type').value,
          base_salary: parseFloat(formEl.querySelector('#emp-salary-amt').value || 0),
          joining_date: formEl.querySelector('#emp-join').value || today,
          bank_name: formEl.querySelector('#emp-bank-name').value,
          account_number: formEl.querySelector('#emp-account-number').value,
          ifsc_code: formEl.querySelector('#emp-ifsc-code').value
        };

        // Collect custom fields values
        headers.forEach(col => {
          if (!standardKeys.includes(col.key)) {
            const inputVal = formEl.querySelector(`#emp-custom-${col.key}`)?.value || '';
            payload[col.key] = inputVal;
          }
        });

        dbState.createEmployee(payload);
        renderEmployeeDirectory(container);
        return true;
      } catch (err) {
        alert(err.message);
        return false;
      }
    });

    const modalEl = document.querySelector('.modal-overlay');
    if (modalEl) {
      const btnAutofill = modalEl.querySelector('.btn-autofill-emp');
      if (btnAutofill) {
        btnAutofill.addEventListener('click', () => {
          modalEl.querySelector('#emp-name').value = 'Vikram Malhotra';
          modalEl.querySelector('#emp-email').value = 'vikram.m@glasserp.in';
          modalEl.querySelector('#emp-mobile').value = '9876123450';
          modalEl.querySelector('#emp-address').value = 'Flat 502, B-Wing, Ritu Heights, Thane West';
          modalEl.querySelector('#emp-pan').value = 'VPMAL8765Q';
          modalEl.querySelector('#emp-aadhaar').value = 'Verified (Physical Check)';
          modalEl.querySelector('#emp-designation').value = 'Junior Estimator';
          modalEl.querySelector('#emp-salary-type').value = 'Monthly';
          modalEl.querySelector('#emp-salary-amt').value = '45000';
          modalEl.querySelector('#emp-join').value = today;

          // Fill custom fields with demo data
          headers.forEach(col => {
            if (!standardKeys.includes(col.key)) {
              const inputEl = modalEl.querySelector(`#emp-custom-${col.key}`);
              if (inputEl) inputEl.value = 'Demo Value';
            }
          });
        });
      }
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Wire up employee CSV Export
  container.querySelector('#btn-export-emp').addEventListener('click', () => {
    // Collect all active headers for CSV
    const csvHeaders = ["Employee ID", "Full Name", "Email Address", "Mobile Number", "Residential Address", "PAN (Tax ID)", "Aadhaar Status", "Designation", "Salary Type", "Base Salary", "Joining Date"];
    const customHeaders = headers.filter(h => !standardKeys.includes(h.key));
    customHeaders.forEach(ch => csvHeaders.push(ch.label));

    const csvRows = [csvHeaders.map(h => `"${h}"`).join(',')];
    
    state.employees.forEach(emp => {
      const rowData = [
        emp.employee_id,
        emp.name,
        emp.email,
        emp.mobile,
        emp.address || '',
        emp.pan || '',
        emp.aadhaar_status,
        emp.designation,
        emp.salary_type,
        emp.base_salary,
        emp.joining_date
      ];

      // Append custom columns
      customHeaders.forEach(ch => {
        rowData.push(emp[ch.key] || '');
      });

      csvRows.push(rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glasserp-employees-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Wire up employee CSV Import
  container.querySelector('#import-emp-csv').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const splitCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result.map(val => val.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
        };

        const rawHeaders = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const employeesToCreate = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cells = splitCSVLine(lines[i]);
          const row = {};
          rawHeaders.forEach((hdr, colIndex) => {
            if (colIndex < cells.length) {
              row[hdr] = cells[colIndex];
            }
          });

          const empPayload = {
            employee_id: row['employee id'] || row['employee_id'] || '',
            name: row['full name'] || row['name'] || row['employee name'] || '',
            email: row['email address'] || row['email'] || '',
            mobile: row['mobile number'] || row['mobile'] || row['phone'] || '',
            address: row['residential address'] || row['address'] || '',
            pan: row['pan (tax id)'] || row['pan'] || '',
            aadhaar_status: row['aadhaar status'] || row['aadhaar_status'] || 'Verified (Physical Check)',
            designation: row['designation'] || '',
            salary_type: row['salary type'] || row['salary_type'] || 'Monthly',
            base_salary: parseFloat(String(row['base salary'] || row['base_salary'] || '0').replace(/[^\d.]/g, '')) || 0,
            joining_date: row['joining date'] || row['joining_date'] || new Date().toISOString().split('T')[0]
          };

          // Collect custom fields dynamically from CSV
          headers.forEach(col => {
            if (!standardKeys.includes(col.key)) {
              empPayload[col.key] = row[col.key] || row[col.label.toLowerCase()] || '';
            }
          });

          employeesToCreate.push(empPayload);
        }
        
        if (employeesToCreate.length > 0) {
          dbState.createEmployees(employeesToCreate);
        }
        
        renderEmployeeDirectory(container);
      };
      reader.readAsText(file);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 2. TABBED EMPLOYEE PROFILE WORKSPACE
function renderEmployeeProfile(mount, employee, container) {
  mount.innerHTML = `
    <div style="width: 100%;">
      <!-- Profile Header Summary -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--border-glass); padding-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; font-family: var(--font-heading);">
            ${employee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: var(--text-primary);">${employee.name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${employee.designation} | ID: <span style="font-family: monospace; color: var(--accent-color); font-weight: 700;">${employee.employee_id}</span></p>
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary" id="btn-edit-employee" style="padding: 6px 12px; font-size: 0.8rem;">
            <i data-lucide="edit" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Edit Details
          </button>
        </div>
      </div>

      <!-- Tab Buttons -->
      <div class="tab-list" style="margin-bottom: 20px;">
        <button class="tab-btn active" id="prof-btn-overview">Overview</button>
        <button class="tab-btn" id="prof-btn-attendance">Attendance</button>
        <button class="tab-btn" id="prof-btn-ledger">Payment Ledger</button>
        <button class="tab-btn" id="prof-btn-advances">Advances</button>
        <button class="tab-btn" id="prof-btn-docs">Documents</button>
      </div>

      <!-- Content Mount -->
      <div id="profile-tab-mount" style="min-height: 300px;"></div>
    </div>
  `;

  const tabOverview = mount.querySelector('#prof-btn-overview');
  const tabAttendance = mount.querySelector('#prof-btn-attendance');
  const tabLedger = mount.querySelector('#prof-btn-ledger');
  const tabAdvances = mount.querySelector('#prof-btn-advances');
  const tabDocs = mount.querySelector('#prof-btn-docs');
  const tabMount = mount.querySelector('#profile-tab-mount');

  const tabs = [tabOverview, tabAttendance, tabLedger, tabAdvances, tabDocs];

  function setProfileTab(activeBtn, renderFn) {
    tabs.forEach(t => t.classList.remove('active'));
    activeBtn.classList.add('active');
    renderFn(tabMount, employee);
  }

  tabOverview.addEventListener('click', () => setProfileTab(tabOverview, renderProfileOverview));
  tabAttendance.addEventListener('click', () => setProfileTab(tabAttendance, renderProfileAttendance));
  tabLedger.addEventListener('click', () => setProfileTab(tabLedger, renderProfileLedger));
  tabAdvances.addEventListener('click', () => setProfileTab(tabAdvances, renderProfileAdvances));
  tabDocs.addEventListener('click', () => setProfileTab(tabDocs, renderProfileDocs));

  // Edit employee details event listener
  const btnEdit = mount.querySelector('#btn-edit-employee');
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      const state = dbState.state;
      const headers = state.settings.employeeColumns;
      const standardKeys = ['name', 'employee_id', 'designation', 'email', 'mobile', 'address', 'pan', 'aadhaar_status', 'joining_date', 'salary_type', 'base_salary'];

      // Build custom fields inputs dynamically prefilled
      let customFieldsHtml = '';
      headers.forEach(col => {
        if (!standardKeys.includes(col.key)) {
          customFieldsHtml += `
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="emp-custom-${col.key}">${col.label}</label>
              <input type="text" id="emp-custom-${col.key}" class="form-control" placeholder="Enter ${col.label}" value="${employee[col.key] || ''}">
            </div>
          `;
        }
      });

      const formHtml = `
        <div style="text-align: left;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="emp-name">Full Name *</label>
            <input type="text" id="emp-name" class="form-control" placeholder="Rohan Sharma" value="${employee.name}" required>
          </div>
          
          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="emp-email">Email Address</label>
              <input type="email" id="emp-email" class="form-control" placeholder="rohan@glasserp.in" value="${employee.email || ''}">
            </div>
            <div class="form-group">
              <label for="emp-mobile">Mobile Number</label>
              <input type="tel" id="emp-mobile" class="form-control" placeholder="9820012345" value="${employee.mobile || ''}">
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 12px;">
            <label for="emp-address">Residential Address</label>
            <input type="text" id="emp-address" class="form-control" placeholder="Flat No, Wing, Area, City" value="${employee.address || ''}">
          </div>

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label for="emp-pan">PAN (Tax ID)</label>
              <input type="text" id="emp-pan" class="form-control" placeholder="ABCDE1234F" style="text-transform: uppercase;" value="${employee.pan || ''}">
            </div>
            <div class="form-group">
              <label for="emp-aadhaar">Aadhaar Status</label>
              <select id="emp-aadhaar">
                <option value="Verified (Physical Check)" ${employee.aadhaar_status === 'Verified (Physical Check)' ? 'selected' : ''}>Verified (Physical Check)</option>
                <option value="Pending Check" ${employee.aadhaar_status === 'Pending Check' ? 'selected' : ''}>Pending Physical verification</option>
                <option value="Not Provided" ${employee.aadhaar_status === 'Not Provided' ? 'selected' : ''}>Not Provided</option>
              </select>
            </div>
          </div>

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div class="form-group">
              <label for="emp-designation">Designation</label>
              <input type="text" id="emp-designation" class="form-control" placeholder="Structural Engineer" value="${employee.designation || ''}">
            </div>
            <div class="form-group">
              <label for="emp-salary-type">Salary Type</label>
              <select id="emp-salary-type">
                <option value="Monthly" ${employee.salary_type === 'Monthly' ? 'selected' : ''}>Monthly Salary</option>
                <option value="Weekly" ${employee.salary_type === 'Weekly' ? 'selected' : ''}>Weekly Wage</option>
                <option value="Daily Wage" ${employee.salary_type === 'Daily Wage' ? 'selected' : ''}>Daily Wage</option>
                <option value="Contract" ${employee.salary_type === 'Contract' ? 'selected' : ''}>Contractual Basis</option>
              </select>
            </div>
          </div>

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div class="form-group">
              <label for="emp-salary-amt">Base Salary / Wage (₹)</label>
              <input type="number" id="emp-salary-amt" class="form-control" placeholder="75,000" value="${employee.base_salary || 0}">
            </div>
            <div class="form-group">
              <label for="emp-join">Joining Date</label>
              <input type="date" id="emp-join" class="form-control" value="${employee.joining_date || ''}">
            </div>
          </div>

          <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div class="form-group">
              <label for="emp-bank-name">Bank Name</label>
              <input type="text" id="emp-bank-name" class="form-control" placeholder="HDFC Bank" value="${employee.bank_name || ''}">
            </div>
            <div class="form-group">
              <label for="emp-account-number">Account Number</label>
              <input type="text" id="emp-account-number" class="form-control" placeholder="50100293849102" value="${employee.account_number || ''}">
            </div>
            <div class="form-group">
              <label for="emp-ifsc-code">IFSC Code</label>
              <input type="text" id="emp-ifsc-code" class="form-control" placeholder="HDFC0000104" value="${employee.ifsc_code || ''}">
            </div>
          </div>

          <!-- Custom Fields Section -->
          ${customFieldsHtml}
        </div>
      `;

      showModal('Edit Employee Details', formHtml, (formEl) => {
        try {
          const payload = {
            name: formEl.querySelector('#emp-name').value,
            email: formEl.querySelector('#emp-email').value,
            mobile: formEl.querySelector('#emp-mobile').value,
            address: formEl.querySelector('#emp-address').value,
            pan: formEl.querySelector('#emp-pan').value,
            aadhaar_status: formEl.querySelector('#emp-aadhaar').value,
            designation: formEl.querySelector('#emp-designation').value,
            salary_type: formEl.querySelector('#emp-salary-type').value,
            base_salary: parseFloat(formEl.querySelector('#emp-salary-amt').value || 0),
            joining_date: formEl.querySelector('#emp-join').value,
            bank_name: formEl.querySelector('#emp-bank-name').value,
            account_number: formEl.querySelector('#emp-account-number').value,
            ifsc_code: formEl.querySelector('#emp-ifsc-code').value
          };

          // Collect custom fields values
          headers.forEach(col => {
            if (!standardKeys.includes(col.key)) {
              const inputVal = formEl.querySelector(`#emp-custom-${col.key}`)?.value || '';
              payload[col.key] = inputVal;
            }
          });

          const updated = dbState.updateEmployee(employee.employee_id, payload);
          renderEmployeeDirectory(container);
          renderEmployeeProfile(container.querySelector('#employee-profile-mount'), updated, container);
          return true;
        } catch (err) {
          alert(err.message);
          return false;
        }
      });
    });
  }

  // Load Overview by default
  renderProfileOverview(tabMount, employee);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 2.A OVERVIEW PROFILE PANEL
function renderProfileOverview(mount, employee) {
  // Mock metadata calculations
  const totalDays = Object.keys(employee.attendance || {}).length || 30;
  const presentDays = Object.values(employee.attendance || {}).filter(s => s === 'Present').length;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '95';

  const panMasked = employee.pan ? employee.pan.slice(0, 5) + '****' + employee.pan.slice(-1) : 'N/A';

  const standardKeys = ['name', 'employee_id', 'designation', 'email', 'mobile', 'address', 'pan', 'aadhaar_status', 'joining_date', 'salary_type', 'base_salary'];
  let customMetadataHtml = '';
  if (dbState.state.settings.employeeColumns) {
    dbState.state.settings.employeeColumns.forEach(col => {
      if (!standardKeys.includes(col.key)) {
        customMetadataHtml += `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">${col.label}:</span>
            <strong>${employee[col.key] || 'N/A'}</strong>
          </div>
        `;
      }
    });
  }

  mount.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Stats Cards -->
      <div class="glass-panel" style="padding: 15px; display: flex; align-items: center; gap: 15px;">
        <div style="padding: 10px; background: var(--debit-bg); color: var(--debit-color); border-radius: 8px;">
          <i data-lucide="check-square"></i>
        </div>
        <div>
          <h6 style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Attendance Score</h6>
          <p style="font-size: 1.15rem; font-weight: 700; font-family: var(--font-heading);">${attendancePercentage}% Average</p>
        </div>
      </div>

      <div class="glass-panel" style="padding: 15px; display: flex; align-items: center; gap: 15px;">
        <div style="padding: 10px; background: var(--accent-light); color: var(--accent-color); border-radius: 8px;">
          <i data-lucide="wallet"></i>
        </div>
        <div>
          <h6 style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Advances Due</h6>
          <p style="font-size: 1.15rem; font-weight: 700; font-family: var(--font-heading); color: ${employee.advance_due > 0 ? 'var(--credit-color)' : 'inherit'}">
            ${inrFormat.format(employee.advance_due)}
          </p>
        </div>
      </div>

      <!-- Identity and Settings details -->
      <div class="glass-panel" style="grid-column: span 2; padding: 20px;">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; color: var(--text-secondary);">Employee master metadata</h4>
        
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Email:</span><strong>${employee.email}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Mobile:</span><strong>${employee.mobile}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Address:</span><strong>${employee.address || 'N/A'}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Joining Date:</span><strong>${employee.joining_date}</strong></div>
          
          <!-- Custom Columns Rendering -->
          ${customMetadataHtml}

          <!-- Data minimization check: Display PAN masked, Aadhaar as status without plaintext values -->
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-glass); padding-top: 8px; margin-top: 5px;">
            <span style="color: var(--text-secondary);">PAN (Tax ID):</span>
            <strong style="font-family: monospace; font-size: 0.9rem; color: var(--accent-color);">${panMasked}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Aadhaar Compliance Status:</span>
            <span class="badge badge-debit" style="font-size: 0.7rem;">${employee.aadhaar_status}</span>
          </div>

          <!-- Salary & Bank Details -->
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-glass); padding-top: 8px; margin-top: 5px;">
            <span style="color: var(--text-secondary); font-weight: 700; text-transform: uppercase; font-size: 0.75rem;">Salary & Bank Details</span>
          </div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Bank Name:</span><strong>${employee.bank_name || 'N/A'}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">Account Number:</span><strong style="font-family: monospace;">${employee.account_number || 'N/A'}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">IFSC Code:</span><strong style="font-family: monospace;">${employee.ifsc_code || 'N/A'}</strong></div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// 2.B ATTENDANCE CALENDAR MATRIX
function renderProfileAttendance(mount, employee) {
  // Render a calendar layout of the current month (June 2026)
  const daysInMonth = 30;
  let calendarDaysHtml = '';
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateKey = `2026-06-${dayStr}`;
    const status = employee.attendance?.[dateKey] || 'No Roster';
    const ot = employee.overtime?.[dateKey] || 0;

    let bgColor = 'rgba(255, 255, 255, 0.01)';
    let color = 'inherit';
    let border = '1px solid var(--border-glass)';

    if (status === 'Present') {
      bgColor = 'var(--debit-bg)';
      color = 'var(--debit-color)';
    } else if (status === 'Absent') {
      bgColor = 'var(--credit-bg)';
      color = 'var(--credit-color)';
    } else if (status === 'Half-Day') {
      bgColor = 'var(--warning-bg)';
      color = 'var(--warning-color)';
    } else if (status === 'Approved Leave') {
      bgColor = 'var(--info-bg)';
      color = 'var(--info-color)';
    }

    calendarDaysHtml += `
      <div style="padding: 10px; background: ${bgColor}; color: ${color}; border: ${border}; border-radius: 6px; text-align: center; font-size: 0.8rem; position: relative;">
        <span style="font-weight: 700; font-size: 0.9rem; display: block; margin-bottom: 4px;">${d}</span>
        <span style="font-size: 0.65rem; font-weight: 500; display: block; opacity: 0.85;">${status}</span>
        ${ot > 0 ? `<span style="position: absolute; top: 2px; right: 2px; background: var(--accent-color); color: #fff; font-size: 0.55rem; padding: 1px 3px; border-radius: 3px;">+${ot}h OT</span>` : ''}
      </div>
    `;
  }

  mount.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h5 style="font-size: 0.95rem; font-weight: 700;">Attendance Calendar - June 2026</h5>
        <div style="display: flex; gap: 8px; font-size: 0.65rem; flex-wrap: wrap;">
          <span class="badge badge-debit">Present</span>
          <span class="badge badge-credit">Absent</span>
          <span class="badge badge-warning">Half-Day</span>
          <span class="badge badge-info">Approved Leave</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
        <!-- Mon-Sun headers -->
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Mon</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Tue</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Wed</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Thu</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Fri</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Sat</div>
        <div style="text-align: center; font-weight: 700; font-size: 0.75rem; color: var(--text-muted);">Sun</div>
        
        <!-- Seeding offset empty boxes to start June 2026 on a Monday (June 1st, 2026 is indeed a Monday) -->
        ${calendarDaysHtml}
      </div>
    </div>
  `;
}

// 2.C COMPREHENSIVE EMPLOYEE PAYMENT LEDGER MODEL
function renderProfileLedger(mount, employee) {
  // Fetch ledger events mapping directly to this employee (advances, payouts, payroll runs)
  const history = [];

  // System Payroll accruals simulator
  // Salary Accrual
  history.push({
    date: '01 Jun 2026',
    payment_type: 'System Roll',
    amount: 0,
    paid_from: '--',
    reference_id: '--',
    description: 'Monthly Salary Cycle Accrual',
    due_amount: employee.base_salary
  });

  // Check state ledger entries for this employee
  dbState.state.ledgerEntries.forEach(entry => {
    let matchesEmp = false;
    let employeeLeg = null;
    let bankLeg = null;

    entry.legs.forEach(leg => {
      if (leg.employee_id === employee.employee_id) {
        matchesEmp = true;
        employeeLeg = leg;
      }
      if (leg.bank_id) {
        bankLeg = leg;
      }
    });

    if (matchesEmp) {
      if (employeeLeg.account === 'Employee Advance Account') {
        history.push({
          date: entry.date,
          payment_type: 'Advance',
          amount: employeeLeg.amount,
          paid_from: bankLeg ? bankLeg.account.split(' ')[0] : 'System Ledger',
          reference_id: entry.reference_number,
          description: entry.description,
          due_amount: employeeLeg.type === 'DEBIT' ? employeeLeg.amount : -employeeLeg.amount
        });
      } else if (employeeLeg.account === 'Salaries Payable') {
        history.push({
          date: entry.date,
          payment_type: 'Base Pay',
          amount: employeeLeg.amount,
          paid_from: bankLeg ? bankLeg.account.split(' ')[0] : 'System Ledger',
          reference_id: entry.reference_number,
          description: entry.description,
          due_amount: -employeeLeg.amount
        });
      }
    }
  });

  // Calculate cumulative balance owed/due
  let balanceAccumulated = 0;
  const ledgerRows = history.map(item => {
    balanceAccumulated = round(balanceAccumulated + item.due_amount);
    return `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">${item.date}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);"><span class="badge ${item.payment_type === 'System Roll' ? 'badge-info' : item.payment_type === 'Advance' ? 'badge-warning' : 'badge-debit'}">${item.payment_type}</span></td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass);">${inrFormat.format(item.amount)}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); font-size: 0.8rem; font-family: monospace;">${item.paid_from}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); font-size: 0.8rem; font-family: monospace;">${item.reference_id}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); font-size: 0.85rem; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.description}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid var(--border-glass); font-weight: 700; color: ${balanceAccumulated > 0 ? 'var(--credit-color)' : 'inherit'}">${inrFormat.format(balanceAccumulated)} (Due)</td>
      </tr>
    `;
  }).join('');

  mount.innerHTML = `
    <div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="padding: 10px 14px;">Date</th>
              <th style="padding: 10px 14px;">Payment Type</th>
              <th style="padding: 10px 14px;">Amount</th>
              <th style="padding: 10px 14px;">Paid From Bank</th>
              <th style="padding: 10px 14px;">Reference ID</th>
              <th style="padding: 10px 14px;">Remarks / Description</th>
              <th style="padding: 10px 14px;">Balance Owed / Due</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 2.D ADVANCES REGISTRY WORKSPACE
function renderProfileAdvances(mount, employee) {
  // Gathers outstanding employee advance balances and repayments
  mount.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h5 style="font-weight: 700; font-size: 0.95rem;">Outstanding Advances Ledger Balance</h5>
          <p style="font-size: 0.75rem; color: var(--text-secondary);">Amounts owed back to the company treasury</p>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 800; color: var(--credit-color);">
          ${inrFormat.format(employee.advance_due)}
        </h3>
      </div>

      <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; background: rgba(255, 255, 255, 0.02); padding: 15px; border-radius: 8px; border: 1px dashed var(--border-glass);">
        <h6 style="font-weight: 700; color: var(--text-primary); margin-bottom: 5px;">Automatic Payroll Deductions Protocol:</h6>
        Outstanding advances are automatically isolated and deducted during monthly payroll roll settlements. Advances do not accumulate compound interest.
      </div>
    </div>
  `;
}

// 2.E COMPLIANT DOCUMENT LOCKER
function renderProfileDocs(mount, employee) {
  // Show compliance doc items
  mount.innerHTML = `
    <div class="doc-grid">
      <div class="glass-panel doc-card">
        <i data-lucide="file-text"></i>
        <span>Employment Agreement.pdf</span>
        <span style="font-size: 0.7rem; color: var(--text-muted);">Signed 12 KB</span>
      </div>

      <div class="glass-panel doc-card">
        <i data-lucide="file-check-2"></i>
        <span>PAN Copy Verified</span>
        <span style="font-size: 0.7rem; color: var(--text-muted);">Verified check</span>
      </div>

      <div class="glass-panel doc-card">
        <i data-lucide="lock"></i>
        <span>Aadhaar Verification Check</span>
        <span style="font-size: 0.7rem; color: var(--text-muted);">Masked Verification</span>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

// 3. DAILY ATTENDANCE ROSTER GRID
function renderAttendanceRoster(container) {
  const state = dbState.state;
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="glass-panel">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
            Daily Attendance Roster & Overtime Board
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Update rosters for administrative audit</p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="btn-bulk-present" style="padding: 6px 12px; font-size: 0.85rem; background: var(--debit-bg); color: var(--debit-color); border: 1px solid rgba(16, 185, 129, 0.2);"><i data-lucide="check-square" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Mark Present</button>
          <button class="btn btn-secondary" id="btn-bulk-absent" style="padding: 6px 12px; font-size: 0.85rem; background: var(--credit-bg); color: var(--credit-color); border: 1px solid rgba(239, 68, 68, 0.2);"><i data-lucide="x-square" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Mark Absent</button>
          <div style="width: 1px; height: 18px; background-color: var(--border-glass); margin: 0 5px;"></div>
          <button class="btn btn-secondary" id="btn-export-attendance" style="padding: 6px 12px; font-size: 0.85rem;"><i data-lucide="download" style="width: 14px; height: 14px; margin-right: 4px;"></i> Export Roster</button>
          <label class="btn btn-secondary" style="cursor: pointer; padding: 6px 12px; font-size: 0.85rem; margin: 0;">
            <i data-lucide="upload" style="width: 14px; height: 14px; margin-right: 4px;"></i> Import Roster
            <input type="file" id="import-attendance-csv" accept=".csv" style="display: none;">
          </label>
        </div>
        
        <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px;">
          <label for="roster-date" style="white-space: nowrap;">Active Roster Date:</label>
          <input type="date" id="roster-date" class="form-control" value="${today}" style="padding: 6px 12px; font-size: 0.85rem;">
        </div>
      </div>

      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" id="bulk-select-attendance-header"></th>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Status Today</th>
              <th>Overtime Hours</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="attendance-roster-body"></tbody>
        </table>
      </div>
    </div>
  `;

  const rosterBody = container.querySelector('#attendance-roster-body');
  const rosterDateInput = container.querySelector('#roster-date');

  // Wire up Attendance CSV Export
  container.querySelector('#btn-export-attendance').addEventListener('click', () => {
    const date = rosterDateInput.value;
    const headers = ["Employee ID", "Employee Name", "Designation", "Status Today", "Overtime Hours"];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    state.employees.forEach(emp => {
      const currentStatus = emp.attendance?.[date] || 'Absent';
      const currentOT = emp.overtime?.[date] || 0;
      csvRows.push([
        emp.employee_id,
        emp.name,
        emp.designation,
        currentStatus,
        currentOT
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glasserp-attendance-${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Wire up Attendance CSV Import
  container.querySelector('#import-attendance-csv').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return;

        const splitCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result.map(val => val.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
        };

        const rawHeaders = splitCSVLine(lines[0]).map(h => h.toLowerCase());
        const date = rosterDateInput.value;

        for (let i = 1; i < lines.length; i++) {
          const cells = splitCSVLine(lines[i]);
          const row = {};
          rawHeaders.forEach((hdr, colIndex) => {
            if (colIndex < cells.length) {
              row[hdr] = cells[colIndex];
            }
          });

          const empId = row['employee id'] || row['employee_id'] || row['id'] || '';
          const empName = row['employee name'] || row['name'] || row['employee_name'] || '';
          const status = row['status today'] || row['status_today'] || row['status'] || 'Absent';
          const ot = parseFloat(String(row['overtime hours'] || row['overtime_hours'] || row['overtime'] || '0').replace(/[^\d.]/g, '')) || 0;

          const emp = state.employees.find(e => e.employee_id === empId || e.name.toLowerCase() === empName.toLowerCase());
          if (emp) {
            dbState.recordAttendance(emp.employee_id, date, status, ot);
          }
        }
        renderRosterRows();
      };
      reader.readAsText(file);
    }
  });

  function renderRosterRows() {
    rosterBody.innerHTML = '';
    const date = rosterDateInput.value;

    state.employees.forEach(emp => {
      const currentStatus = emp.attendance?.[date] || 'Absent';
      const currentOT = emp.overtime?.[date] || 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" class="row-select-attendance" data-emp-id="${emp.employee_id}"></td>
        <td style="font-weight: 600;">${emp.name}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${emp.designation}</td>
        <td>
          <select class="roster-status-select" style="padding: 4px 8px; font-size: 0.8rem;">
            <option value="Present" ${currentStatus === 'Present' ? 'selected' : ''}>Present</option>
            <option value="Absent" ${currentStatus === 'Absent' ? 'selected' : ''}>Absent</option>
            <option value="Half-Day" ${currentStatus === 'Half-Day' ? 'selected' : ''}>Half-Day</option>
            <option value="Approved Leave" ${currentStatus === 'Approved Leave' ? 'selected' : ''}>Approved Leave</option>
          </select>
        </td>
        <td>
          <input type="number" step="0.5" class="form-control roster-ot-input" value="${currentOT}" style="width: 80px; padding: 4px 8px; font-size: 0.8rem;" placeholder="0">
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-save-roster" style="padding: 4px 10px; font-size: 0.75rem;"><i data-lucide="save" style="width: 12px; height: 12px; margin-right: 4px;"></i> Save</button>
        </td>
      `;

      // Event listener on saving individual row
      tr.querySelector('.btn-save-roster').addEventListener('click', () => {
        const stat = tr.querySelector('.roster-status-select').value;
        const ot = tr.querySelector('.roster-ot-input').value;
        
        dbState.recordAttendance(emp.employee_id, date, stat, ot);
        
        // Visual indicator trigger
        const btn = tr.querySelector('.btn-save-roster');
        btn.innerHTML = `<i data-lucide="check" style="width: 12px; height: 12px; margin-right: 4px;"></i> Saved`;
        btn.style.background = 'var(--debit-bg)';
        btn.style.color = 'var(--debit-color)';
        if (window.lucide) window.lucide.createIcons();
        
        setTimeout(() => {
          btn.innerHTML = `<i data-lucide="save" style="width: 12px; height: 12px; margin-right: 4px;"></i> Save`;
          btn.style.background = 'var(--bg-card)';
          btn.style.color = 'var(--text-primary)';
          if (window.lucide) window.lucide.createIcons();
        }, 1200);
      });

      rosterBody.appendChild(tr);
    });

    // Select-all checkbox logic
    const headerChk = container.querySelector('#bulk-select-attendance-header');
    if (headerChk) {
      headerChk.checked = false; // reset on re-render
      headerChk.addEventListener('change', (e) => {
        const rowChks = rosterBody.querySelectorAll('.row-select-attendance');
        rowChks.forEach(chk => chk.checked = e.target.checked);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Bulk actions event handlers
  const handleBulkMark = (status) => {
    const checkedRows = rosterBody.querySelectorAll('.row-select-attendance:checked');
    if (checkedRows.length === 0) {
      alert("Please select at least one employee first.");
      return;
    }

    const updates = [];
    checkedRows.forEach(chk => {
      const empId = chk.getAttribute('data-emp-id');
      const tr = chk.closest('tr');
      const ot = tr.querySelector('.roster-ot-input').value;
      updates.push({
        employeeId: empId,
        status: status,
        overtimeHours: ot
      });
    });

    dbState.recordAttendanceBatch(updates, rosterDateInput.value);
    renderRosterRows();
  };

  container.querySelector('#btn-bulk-present').addEventListener('click', () => handleBulkMark('Present'));
  container.querySelector('#btn-bulk-absent').addEventListener('click', () => handleBulkMark('Absent'));

  rosterDateInput.addEventListener('change', renderRosterRows);
  renderRosterRows();
}

// 4. EMPLOYEE SALARY ADVANCES BOARD
function renderEmployeeAdvancesBoard(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 25px;">
      
      <!-- Top Actions Bar -->
      <div class="glass-panel" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">Employee Salary Advances Board</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Track outstanding loans and record repayments</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" id="btn-issue-advance" style="background: var(--credit-color); color: #fff; border-color: var(--credit-color);">
            <i data-lucide="arrow-up-right" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Issue Advance (Pay)
          </button>
          <button class="btn btn-primary" id="btn-receive-refund" style="background: var(--debit-color); color: #fff; border-color: var(--debit-color);">
            <i data-lucide="arrow-down-left" style="width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;"></i> Record Refund (Receipt)
          </button>
        </div>
      </div>

      <!-- Main Columns: Left (Summary Table), Right (Detailed History Log) -->
      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start; flex-wrap: wrap;">
        
        <!-- Left Column: Advances Summary Table -->
        <div class="glass-panel" style="padding: 24px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="users" style="color: var(--accent-color); width: 18px; height: 18px;"></i>
            Outstanding Balances Summary
          </h4>
          <div id="advances-summary-mount"></div>
        </div>

        <!-- Right Column: Detailed Transaction Registry -->
        <div class="glass-panel" style="padding: 24px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="history" style="color: var(--accent-color); width: 18px; height: 18px;"></i>
            Advances Transaction History Log
          </h4>
          <div id="advances-history-mount"></div>
        </div>

      </div>
    </div>
  `;

  // Bind shortcuts
  container.querySelector('#btn-issue-advance').addEventListener('click', () => {
    const link = document.querySelector('.menu-item[data-route="make-payment"]');
    if (link) {
      link.click();
      setTimeout(() => {
        const typeSelect = document.getElementById('pay-type');
        if (typeSelect) {
          typeSelect.value = 'Employee Advance';
          typeSelect.dispatchEvent(new Event('change'));
        }
      }, 50);
    }
  });

  container.querySelector('#btn-receive-refund').addEventListener('click', () => {
    const link = document.querySelector('.menu-item[data-route="receive-payment"]');
    if (link) {
      link.click();
      setTimeout(() => {
        const catSelect = document.getElementById('rcv-category');
        if (catSelect) {
          catSelect.value = 'Employee Refund';
          catSelect.dispatchEvent(new Event('change'));
        }
      }, 50);
    }
  });

  // Render Left: Summary Table
  const summaryHeaders = [
    { key: 'name', label: 'Employee Name' },
    { key: 'base_salary', label: 'Base Salary (₹)', render: val => inrFormat.format(val) },
    { key: 'advance_due', label: 'Advance Due (₹)', render: val => val > 0 
      ? `<span style="color: var(--credit-color); font-weight: 700;">${inrFormat.format(val)}</span>` 
      : `<span style="color: var(--text-muted);">₹0.00</span>` 
    }
  ];

  new GlassTable({
    container: container.querySelector('#advances-summary-mount'),
    headers: summaryHeaders,
    data: state.employees
  });

  // Compile Right: Historical logs
  const advances = state.expenses
    .filter(e => e.payment_type === 'Employee Advance')
    .map(e => {
      const emp = state.employees.find(emp => emp.employee_id === e.employee_id);
      return {
        date: e.date,
        name: emp ? emp.name : 'Unknown Employee',
        type: 'Advance (Paid)',
        amount: e.amount,
        reference: e.reference_no,
        typeClass: 'badge-credit',
        amtStyle: 'color: var(--credit-color); font-weight: 600;'
      };
    });

  const refunds = state.income
    .filter(inc => inc.inflow_category === 'Employee Refund')
    .map(inc => {
      const emp = state.employees.find(emp => emp.employee_id === inc.employee_id);
      return {
        date: inc.date,
        name: emp ? emp.name : 'Unknown Employee',
        type: 'Refund (Received)',
        amount: inc.amount,
        reference: inc.reference_no,
        typeClass: 'badge-debit',
        amtStyle: 'color: var(--debit-color); font-weight: 600;'
      };
    });

  const combinedHistory = [...advances, ...refunds].sort((a, b) => new Date(b.date) - new Date(a.date));

  const historyHeaders = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Employee Name' },
    { key: 'type', label: 'Type', render: (val, row) => `<span class="badge ${row.typeClass}">${val}</span>` },
    { key: 'amount', label: 'Amount (₹)', render: (val, row) => `<span style="${row.amtStyle}">${inrFormat.format(val)}</span>` },
    { key: 'reference', label: 'Ref ID' }
  ];

  new GlassTable({
    container: container.querySelector('#advances-history-mount'),
    headers: historyHeaders,
    data: combinedHistory
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function renderPetrolAdvancesBoard(container) {
  const state = dbState.state;
  const petrolRate = state.petrolRate !== undefined ? state.petrolRate : 120;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 25px;">
      
      <!-- Top Action bar with Petrol Rate configurator -->
      <div class="glass-panel" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">Employee Petrol Advances Dashboard</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Track mileage, petrol consumption, and advance payments</p>
        </div>
        <div class="form-group" style="display: flex; flex-direction: row; align-items: center; gap: 10px; margin: 0;">
          <label for="petrol-rate-top" style="white-space: nowrap; font-weight: 600; color: var(--text-primary);">Petrol Rate (₹/Litre):</label>
          <input type="number" id="petrol-rate-top" class="form-control" value="${petrolRate}" style="width: 100px; padding: 6px 12px; font-size: 0.9rem; font-weight: 700; text-align: center;">
          <button class="btn btn-primary" id="btn-save-rate" style="padding: 6px 12px; font-size: 0.85rem;">Update Rate</button>
        </div>
      </div>

      <!-- Main Layout Split -->
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start; flex-wrap: wrap;">
        
        <!-- Left Panel: Employee Registry -->
        <div class="glass-panel" style="padding: 20px;">
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="users" style="color: var(--accent-color); width: 18px; height: 18px;"></i>
            Staff Registry
          </h4>
          <div id="petrol-employees-table-mount"></div>
        </div>

        <!-- Right Panel: Petrol Advance details for Selected Employee -->
        <div class="glass-panel" id="petrol-detail-mount" style="min-height: 500px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); padding: 24px;">
          <div style="text-align: center;">
            <i data-lucide="fuel" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 10px; color: var(--accent-color);"></i>
            <p>Select an employee from the registry to view and manage their daily petrol advances.</p>
          </div>
        </div>

      </div>
    </div>
  `;

  // Bind Petrol Rate Update
  const petrolRateInput = container.querySelector('#petrol-rate-top');
  container.querySelector('#btn-save-rate').addEventListener('click', () => {
    const rateVal = parseFloat(petrolRateInput.value) || 120;
    dbState.updatePetrolRate(rateVal);
    // Flash visual check
    const btn = container.querySelector('#btn-save-rate');
    btn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Updated`;
    btn.style.background = 'var(--debit-bg)';
    btn.style.color = 'var(--debit-color)';
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      btn.textContent = 'Update Rate';
      btn.style.background = '';
      btn.style.color = '';
    }, 1200);
  });

  // Render Left Column Table
  const headers = [
    { key: 'name', label: 'Employee Name' },
    { key: 'designation', label: 'Designation' }
  ];

  new GlassTable({
    container: container.querySelector('#petrol-employees-table-mount'),
    headers: headers,
    data: state.employees,
    onRowClick: (row) => {
      renderEmployeePetrolWorkspace(container.querySelector('#petrol-detail-mount'), row);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderEmployeePetrolWorkspace(mount, employee) {
  const state = dbState.state;
  const currentRate = state.petrolRate || 120;
  
  // Filter logs for this employee
  const employeeLogs = (state.petrolLogs || []).filter(log => log.employee_id === employee.employee_id);
  
  // Calculate summary statistics
  const totalKm = employeeLogs.reduce((acc, log) => acc + (log.total_km || 0), 0);
  const totalLitres = employeeLogs.reduce((acc, log) => acc + (log.litres_used || 0), 0);
  const totalPaid = employeeLogs.reduce((acc, log) => acc + (log.amount_paid || 0), 0);

  // Get last end meter reading as default start meter
  let defaultStartMeter = 0;
  if (employeeLogs.length > 0) {
    defaultStartMeter = Math.max(...employeeLogs.map(l => l.end_meter || 0), 0);
  }

  mount.style.display = 'block';
  mount.innerHTML = `
    <div style="width: 100%;">
      <!-- Workspace Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-glass); padding-bottom: 15px; flex-wrap: wrap; gap: 15px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff;">
            ${employee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0;">${employee.name}</h3>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">${employee.designation} | ID: ${employee.employee_id}</p>
          </div>
        </div>

        <!-- Summary Cards inline -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <div class="glass-panel" style="padding: 8px 14px; text-align: center; min-width: 90px; background: rgba(255, 255, 255, 0.01);">
            <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Total KM</div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${totalKm} km</div>
          </div>
          <div class="glass-panel" style="padding: 8px 14px; text-align: center; min-width: 90px; background: rgba(255, 255, 255, 0.01);">
            <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Total Litres</div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${round(totalLitres)} L</div>
          </div>
          <div class="glass-panel" style="padding: 8px 14px; text-align: center; min-width: 90px; background: rgba(255, 255, 255, 0.01);">
            <div style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted);">Amount Paid</div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--debit-color);">${inrFormat.format(totalPaid)}</div>
          </div>
        </div>
      </div>

      <!-- Left-Right Form vs Log Table Split -->
      <div style="display: grid; grid-template-columns: 1.2fr 2fr; gap: 20px; align-items: start; flex-wrap: wrap;">
        
        <!-- Form: Daily Petrol Log -->
        <div class="glass-panel" style="padding: 15px; background: rgba(255,255,255,0.01);">
          <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; border-bottom: 1px dashed var(--border-glass); padding-bottom: 6px;">New Petrol Advance Entry</h5>
          <form id="petrol-entry-form" style="display: flex; flex-direction: column; gap: 10px;">
            <div class="form-group">
              <label for="petrol-date" style="font-size: 0.75rem;">Date</label>
              <input type="date" id="petrol-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required style="font-size: 0.8rem; padding: 5px 10px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label for="petrol-start-meter" style="font-size: 0.75rem;">Start Meter (KM)</label>
                <input type="number" id="petrol-start-meter" class="form-control" value="${defaultStartMeter}" required style="font-size: 0.8rem; padding: 5px 10px;">
              </div>
              <div class="form-group">
                <label for="petrol-end-meter" style="font-size: 0.75rem;">End Meter (KM)</label>
                <input type="number" id="petrol-end-meter" class="form-control" placeholder="e.g. ${defaultStartMeter + 50}" required style="font-size: 0.8rem; padding: 5px 10px;">
              </div>
            </div>

            <div class="form-group">
              <label style="font-size: 0.75rem;">Total KM (Calculated)</label>
              <div id="petrol-total-km-display" style="padding: 6px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; font-weight: 700; font-size: 0.85rem; border: 1px solid var(--border-glass);">${defaultStartMeter} km</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="form-group">
                <label for="petrol-litres" style="font-size: 0.75rem;">Litres Used</label>
                <input type="number" step="0.01" id="petrol-litres" class="form-control" placeholder="0.00" style="font-size: 0.8rem; padding: 5px 10px;">
              </div>
              <div class="form-group">
                <label for="petrol-amount" style="font-size: 0.75rem;">Amount Paid (₹)</label>
                <input type="number" id="petrol-amount" class="form-control" placeholder="0.00" style="font-size: 0.8rem; padding: 5px 10px;">
              </div>
            </div>

            <div class="form-group">
              <label for="petrol-remarks" style="font-size: 0.75rem;">Remarks / Notes</label>
              <input type="text" id="petrol-remarks" class="form-control" placeholder="e.g. Visit to Apex site" style="font-size: 0.8rem; padding: 5px 10px;">
            </div>

            <!-- Double-entry checkbox -->
            <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 0.75rem;">
              <input type="checkbox" id="post-to-ledger-chk" checked style="width: 14px; height: 14px; cursor: pointer;">
              <label for="post-to-ledger-chk" style="cursor: pointer; margin: 0; color: var(--text-secondary);">Post to double-entry ledger</label>
            </div>

            <!-- Ledger posting bank selector -->
            <div id="ledger-bank-selector" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem;">
              <label for="petrol-bank-source">Paid From:</label>
              <select id="petrol-bank-source" style="padding: 4px 8px; font-size: 0.75rem; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-glass); border-radius: 4px;">
                ${state.bankAccounts.map(b => `<option value="${b.bank_id}" ${b.bank_id === 'bank-cash-hand' ? 'selected' : ''}>${b.account_name} (Bal: ₹${b.current_balance})</option>`).join('')}
              </select>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top: 5px; font-size: 0.8rem; padding: 6px 12px;">Save Daily Entry</button>
          </form>
        </div>

        <!-- Table: Historical logs -->
        <div>
          <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="history" style="width: 14px; height: 14px; color: var(--accent-color);"></i> Log Registry History
          </h5>
          <div id="petrol-logs-table-mount"></div>
        </div>

      </div>
    </div>
  `;

  // Grab form inputs
  const form = mount.querySelector('#petrol-entry-form');
  const dateInput = mount.querySelector('#petrol-date');
  const startInput = mount.querySelector('#petrol-start-meter');
  const endInput = mount.querySelector('#petrol-end-meter');
  const kmDisplay = mount.querySelector('#petrol-total-km-display');
  const litresInput = mount.querySelector('#petrol-litres');
  const amountInput = mount.querySelector('#petrol-amount');
  const remarksInput = mount.querySelector('#petrol-remarks');
  const postLedgerChk = mount.querySelector('#post-to-ledger-chk');
  const bankSelector = mount.querySelector('#ledger-bank-selector');

  // Handle bank selector visibility toggle
  postLedgerChk.addEventListener('change', () => {
    bankSelector.style.display = postLedgerChk.checked ? 'flex' : 'none';
  });

  // Calculate KM on input change
  function updateKm() {
    const start = parseFloat(startInput.value) || 0;
    const end = parseFloat(endInput.value) || 0;
    const diff = Math.max(0, end - start);
    kmDisplay.textContent = `${diff} km`;
  }
  startInput.addEventListener('input', updateKm);
  endInput.addEventListener('input', updateKm);
  updateKm();

  // Auto-calculation logic between Litres and Amount
  litresInput.addEventListener('input', () => {
    const l = parseFloat(litresInput.value) || 0;
    amountInput.value = round(l * currentRate);
  });
  amountInput.addEventListener('input', () => {
    const amt = parseFloat(amountInput.value) || 0;
    litresInput.value = round(amt / currentRate);
  });

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const payload = {
        employee_id: employee.employee_id,
        date: dateInput.value,
        start_meter: parseFloat(startInput.value) || 0,
        end_meter: parseFloat(endInput.value) || 0,
        litres_used: parseFloat(litresInput.value) || 0,
        petrol_rate: currentRate,
        amount_paid: parseFloat(amountInput.value) || 0,
        remarks: remarksInput.value
      };

      if (payload.end_meter < payload.start_meter) {
        throw new Error("End meter reading cannot be less than start meter reading.");
      }
      if (payload.amount_paid <= 0) {
        throw new Error("Amount paid must be greater than zero.");
      }

      // If posting to double-entry ledger is checked
      if (postLedgerChk.checked) {
        const bankId = mount.querySelector('#petrol-bank-source').value;
        const refNo = `PETROL-${Date.now().toString().slice(-6)}`;
        
        // Post expense
        dbState.makePayment({
          date: payload.date,
          amount: payload.amount_paid,
          paymentType: 'Employee Advance', // debit employee advance account so it behaves like other advances
          bankId: bankId,
          referenceNo: refNo,
          description: `Petrol Advance Log: Start:${payload.start_meter} End:${payload.end_meter} (${payload.remarks || 'No notes'})`,
          employeeLink: employee.employee_id,
          gstApplicable: false,
          gstRate: '0'
        });
      }

      // Save petrol log
      dbState.createPetrolLog(payload);

      // Re-render
      renderEmployeePetrolWorkspace(mount, employee);
    } catch (err) {
      alert(err.message);
    }
  });

  // Render Log Table
  const logHeaders = [
    { key: 'date', label: 'Date' },
    { key: 'start_meter', label: 'Start' },
    { key: 'end_meter', label: 'End' },
    { key: 'total_km', label: 'KM' },
    { key: 'litres_used', label: 'Litres' },
    { key: 'amount_paid', label: 'Paid (₹)', render: val => inrFormat.format(val) },
    { key: 'remarks', label: 'Remarks' }
  ];

  new GlassTable({
    container: mount.querySelector('#petrol-logs-table-mount'),
    headers: logHeaders,
    data: employeeLogs,
    onDeleteSelected: (selectedRows) => {
      selectedRows.forEach(row => dbState.deletePetrolLog(row.id));
      renderEmployeePetrolWorkspace(mount, employee);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

