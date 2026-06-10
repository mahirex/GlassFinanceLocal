// GlassERP Pro V2 Human Resources & Payroll Module

import { dbState, round, uuid } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';

export function renderHR(container, viewName) {
  if (viewName === 'employees') {
    renderEmployeeDirectory(container);
  } else if (viewName === 'attendance') {
    renderAttendanceRoster(container);
  } else if (viewName === 'documents') {
    renderDocumentsLocker(container);
  }
}

// 1. COMPREHENSIVE EMPLOYEE DIRECTORY & PROFILE VIEW
function renderEmployeeDirectory(container) {
  const state = dbState.state;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Left Column: Add Employee Form & Quick Directory -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Add Employee Form -->
        <div class="glass-panel">
          <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">
            Onboard New Employee
          </h3>
          <form id="onboard-employee-form">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="emp-name">Full Name *</label>
              <input type="text" id="emp-name" class="form-control" placeholder="Rohan Sharma" required>
            </div>
            
            <div class="form-grid" style="grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px;">
              <div class="form-group">
                <label for="emp-email">Email Address *</label>
                <input type="email" id="emp-email" class="form-control" placeholder="rohan@glasserp.in" required>
              </div>
              <div class="form-group">
                <label for="emp-mobile">Mobile Number *</label>
                <input type="tel" id="emp-mobile" class="form-control" placeholder="9820012345" required>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label for="emp-address">Residential Address</label>
              <input type="text" id="emp-address" class="form-control" placeholder="Flat No, Wing, Area, City">
            </div>

            <!-- Verification Fields -->
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div class="form-group">
                <label for="emp-pan">PAN (Tax ID) *</label>
                <input type="text" id="emp-pan" class="form-control" placeholder="ABCDE1234F" style="text-transform: uppercase;" required>
              </div>
              <div class="form-group">
                <label for="emp-aadhaar">Aadhaar Status *</label>
                <select id="emp-aadhaar" required>
                  <option value="Verified (Physical Check)">Verified (Physical Check)</option>
                  <option value="Pending Check">Pending Physical verification</option>
                  <option value="Not Provided">Not Provided</option>
                </select>
              </div>
            </div>

            <!-- Payroll Settings -->
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
              <div class="form-group">
                <label for="emp-designation">Designation *</label>
                <input type="text" id="emp-designation" class="form-control" placeholder="Structural Engineer" required>
              </div>
              <div class="form-group">
                <label for="emp-salary-type">Salary Type *</label>
                <select id="emp-salary-type" required>
                  <option value="Monthly">Monthly Salary</option>
                  <option value="Weekly">Weekly Wage</option>
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Contract">Contractual Basis</option>
                </select>
              </div>
            </div>

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
              <div class="form-group">
                <label for="emp-salary-amt">Base Salary / Wage (₹) *</label>
                <input type="number" id="emp-salary-amt" class="form-control" placeholder="75,000" required>
              </div>
              <div class="form-group">
                <label for="emp-join">Joining Date *</label>
                <input type="date" id="emp-join" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
            </div>

            <div id="onboard-feedback" style="display: none; padding: 10px; border-radius: var(--border-radius-sm); font-size: 0.8rem; font-weight: 600; margin-bottom: 12px;"></div>

            <div style="display: flex; gap: 12px; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-autofill-emp" style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); flex: 1;"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
              <button type="submit" class="btn btn-primary" style="flex: 1.5;"><i data-lucide="user-plus"></i> Complete Onboarding</button>
            </div>
          </form>
        </div>

        <!-- Directory list -->
        <div class="glass-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
              Staff Master Registry
            </h3>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary" id="btn-export-emp" style="padding: 4px 10px; font-size: 0.75rem;"><i data-lucide="download" style="width: 12px; height: 12px;"></i> Export</button>
              <label class="btn btn-secondary" style="cursor: pointer; padding: 4px 10px; font-size: 0.75rem; margin: 0;">
                <i data-lucide="upload" style="width: 12px; height: 12px; margin-right: 4px;"></i> Import
                <input type="file" id="import-emp-csv" accept=".csv" style="display: none;">
              </label>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;" id="employee-list-mount"></div>
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

  const employeeListMount = container.querySelector('#employee-list-mount');
  const onboardForm = container.querySelector('#onboard-employee-form');
  const onboardFeedback = container.querySelector('#onboard-feedback');

  // Load employee listing cards
  function loadEmployeeCards() {
    employeeListMount.innerHTML = '';
    state.employees.forEach(emp => {
      const card = document.createElement('div');
      card.className = 'glass-panel';
      card.style.padding = '12px 16px';
      card.style.cursor = 'pointer';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.background = 'rgba(255, 255, 255, 0.01)';
      
      card.innerHTML = `
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700;">${emp.name}</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary);">${emp.designation}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.75rem; color: var(--accent-color); font-weight: 600;">${emp.employee_id}</span>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${emp.salary_type}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        // Toggle selected state in view
        employeeListMount.querySelectorAll('.glass-panel').forEach(c => c.style.borderColor = 'var(--border-glass)');
        card.style.borderColor = 'var(--accent-color)';
        
        renderEmployeeProfile(container.querySelector('#employee-profile-mount'), emp);
      });

      employeeListMount.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Handle Onboarding form submission
  onboardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onboardFeedback.style.display = 'none';

    try {
      const payload = {
        name: container.querySelector('#emp-name').value,
        email: container.querySelector('#emp-email').value,
        mobile: container.querySelector('#emp-mobile').value,
        address: container.querySelector('#emp-address').value,
        pan: container.querySelector('#emp-pan').value,
        aadhaar_status: container.querySelector('#emp-aadhaar').value,
        designation: container.querySelector('#emp-designation').value,
        salary_type: container.querySelector('#emp-salary-type').value,
        base_salary: parseFloat(container.querySelector('#emp-salary-amt').value),
        joining_date: container.querySelector('#emp-join').value
      };

      dbState.createEmployee(payload);

      onboardFeedback.style.background = 'var(--debit-bg)';
      onboardFeedback.style.color = 'var(--debit-color)';
      onboardFeedback.textContent = 'Employee onboarded successfully!';
      onboardFeedback.style.display = 'block';

      onboardForm.reset();
      loadEmployeeCards();
    } catch (err) {
      onboardFeedback.style.background = 'var(--credit-bg)';
      onboardFeedback.style.color = 'var(--credit-color)';
      onboardFeedback.textContent = err.message;
      onboardFeedback.style.display = 'block';
    }
  });

  const btnAutofillEmp = container.querySelector('.btn-autofill-emp');
  if (btnAutofillEmp) {
    btnAutofillEmp.addEventListener('click', () => {
      container.querySelector('#emp-name').value = 'Vikram Malhotra';
      container.querySelector('#emp-email').value = 'vikram.m@glasserp.in';
      container.querySelector('#emp-mobile').value = '9876123450';
      container.querySelector('#emp-address').value = 'Flat 502, B-Wing, Ritu Heights, Thane West';
      container.querySelector('#emp-pan').value = 'VPMAL8765Q';
      container.querySelector('#emp-aadhaar').value = 'Verified (Physical Check)';
      container.querySelector('#emp-designation').value = 'Junior Estimator';
      container.querySelector('#emp-salary-type').value = 'Monthly';
      container.querySelector('#emp-salary-amt').value = '45000';
      container.querySelector('#emp-join').value = new Date().toISOString().split('T')[0];
    });
  }

  loadEmployeeCards();

  // Wire up employee CSV Export
  container.querySelector('#btn-export-emp').addEventListener('click', () => {
    const headers = ["Employee ID", "Full Name", "Email Address", "Mobile Number", "Residential Address", "PAN (Tax ID)", "Aadhaar Status", "Designation", "Salary Type", "Base Salary", "Joining Date"];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];
    
    state.employees.forEach(emp => {
      csvRows.push([
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
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
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

        const rawHeaders = splitCSVLine(lines[0]).map(h => h.toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const cells = splitCSVLine(lines[i]);
          const row = {};
          rawHeaders.forEach((hdr, colIndex) => {
            if (colIndex < cells.length) {
              row[hdr] = cells[colIndex];
            }
          });

          try {
            dbState.createEmployee({
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
            });
          } catch (err) {
            console.error('Error onboarding imported employee:', err);
          }
        }
        
        loadEmployeeCards();
      };
      reader.readAsText(file);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 2. TABBED EMPLOYEE PROFILE WORKSPACE
function renderEmployeeProfile(mount, employee) {
  mount.innerHTML = `
    <div style="width: 100%;">
      <!-- Profile Header Summary -->
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--border-glass); padding-bottom: 20px;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; font-family: var(--font-heading);">
          ${employee.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: var(--text-primary);">${employee.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${employee.designation} | ID: <span style="font-family: monospace; color: var(--accent-color); font-weight: 700;">${employee.employee_id}</span></p>
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
          
          <!-- Data minimization check: Display PAN masked, Aadhaar as status without plaintext values -->
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border-glass); padding-top: 8px; margin-top: 5px;">
            <span style="color: var(--text-secondary);">PAN (Tax ID):</span>
            <strong style="font-family: monospace; font-size: 0.9rem; color: var(--accent-color);">${panMasked}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Aadhaar Compliance Status:</span>
            <span class="badge badge-debit" style="font-size: 0.7rem;">${employee.aadhaar_status}</span>
          </div>
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

        <div style="display: flex; gap: 10px; align-items: center;">
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

    if (window.lucide) window.lucide.createIcons();
  }

  rosterDateInput.addEventListener('change', renderRosterRows);
  renderRosterRows();
}

// 4. DOCUMENTS COMPLIANCE FILE LOCKER
function renderDocumentsLocker(container) {
  container.innerHTML = `
    <div class="glass-panel">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
        <i data-lucide="folder-lock" style="color: var(--accent-color);"></i>
        Secure Corporate Documents Locker
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
        <div class="glass-panel doc-card" style="padding: 20px;">
          <i data-lucide="shield-check" style="width: 32px; height: 32px; color: var(--debit-color);"></i>
          <h5 style="margin-top: 8px; font-weight: 700; font-size: 0.9rem;">Company GST Registration Certificate</h5>
          <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">PDF - 245 KB | Mapped to State 27</p>
        </div>

        <div class="glass-panel doc-card" style="padding: 20px;">
          <i data-lucide="file-text" style="width: 32px; height: 32px;"></i>
          <h5 style="margin-top: 8px; font-weight: 700; font-size: 0.9rem;">Corporate PAN Card Mapped</h5>
          <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">PNG - 1.2 MB | Admin Locker</p>
        </div>

        <div class="glass-panel doc-card" style="padding: 20px;">
          <i data-lucide="file-check-2" style="width: 32px; height: 32px;"></i>
          <h5 style="margin-top: 8px; font-weight: 700; font-size: 0.9rem;">Standard Board Resolution Charter</h5>
          <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">PDF - 120 KB | Signed 2026</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
