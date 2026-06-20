// GlassERP Pro V2 Employee Salary Calculator View
import { dbState, round } from '../state.js';
import { GlassTable } from '../components/table.js';
import { showModal } from './operations.js';

const inrFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function countPresentDays(employee) {
  let present = 0;
  const attendance = employee.attendance || {};
  const dates = Object.keys(attendance);
  if (dates.length === 0) return 26; // Default to standard 26 working days if roster is empty
  
  dates.forEach(d => {
    if (attendance[d] === 'Present') {
      present += 1;
    } else if (attendance[d] === 'Half-Day') {
      present += 0.5;
    }
  });
  return present;
}

function calculateDefaultEntry(emp) {
  const presentDays = countPresentDays(emp);
  let perDayRate = 0;
  if (emp.salary_type === 'Daily Wage') {
    perDayRate = emp.base_salary;
  } else if (emp.salary_type === 'Weekly') {
    perDayRate = emp.base_salary / 6;
  } else {
    perDayRate = emp.base_salary / 30;
  }
  perDayRate = round(perDayRate);

  const advanceTaken = emp.advance_due || 0;
  const pf = 0;
  const finalSalary = Math.max(0, round((presentDays * perDayRate) - advanceTaken - pf));

  return {
    employee_id: emp.employee_id,
    present_days: presentDays,
    per_day_salary: perDayRate,
    advance_taken: advanceTaken,
    pf: pf,
    final_salary: finalSalary
  };
}

export function renderPayrollCalculator(container) {
  const state = dbState.state;
  if (!state.payrollSheet) state.payrollSheet = [];

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Title & Statistics Summary Cards -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0;">
            Employee Salary Calculator
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            Calculate and override payroll details. Net Salary = (Present Days * Rate) - Advance - PF.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" id="btn-recalculate-all" style="background: rgba(99, 102, 241, 0.1); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2);">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Recalculate Sheet
          </button>
        </div>
      </div>

      <!-- Action toolbar for CSV Operations -->
      <div class="glass-panel" style="padding: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: -10px;">
        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">
          <i data-lucide="info" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle; color: var(--accent-color);"></i>
          <span>Import spreadsheet to modify calculations in bulk, or use action buttons below to edit individually.</span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" id="btn-export-payroll-csv">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i> Export CSV
          </button>
          <label class="btn btn-secondary" style="cursor: pointer; margin: 0;">
            <i data-lucide="upload" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Import CSV
            <input type="file" id="import-payroll-csv" accept=".csv" style="display: none;">
          </label>
        </div>
      </div>

      <!-- Mount point for the main GlassTable component -->
      <div id="payroll-table-mount"></div>
    </div>
  `;

  // Populate data items for Table dynamically without calling saveState() in render path
  const getTableData = () => {
    return state.employees.map(emp => {
      const entry = state.payrollSheet.find(p => p.employee_id === emp.employee_id);
      if (entry) {
        return {
          employee_id: emp.employee_id,
          name: emp.name,
          present_days: entry.present_days ?? countPresentDays(emp),
          per_day_salary: entry.per_day_salary ?? 0,
          advance_taken: entry.advance_taken ?? 0,
          pf: entry.pf ?? 0,
          final_salary: entry.final_salary ?? 0
        };
      } else {
        const defaults = calculateDefaultEntry(emp);
        return {
          ...defaults,
          name: emp.name
        };
      }
    });
  };

  const headers = [
    { key: 'name', label: 'Employee Name' },
    { key: 'present_days', label: 'Present Days' },
    { key: 'per_day_salary', label: 'Per Day Salary', render: (val) => inrFormat.format(val) },
    { key: 'advance_taken', label: 'Advance Taken', render: (val) => inrFormat.format(val) },
    { key: 'pf', label: 'Provident Fund (PF)', render: (val) => inrFormat.format(val) },
    { key: 'final_salary', label: 'Final Net Salary', render: (val) => `<strong style="color: var(--debit-color); font-weight: 700;">${inrFormat.format(val)}</strong>` },
    {
      key: 'employee_id',
      label: 'Actions',
      render: (val, row) => `
        <button type="button" class="btn btn-secondary btn-edit-payroll-row" data-emp-id="${val}" style="padding: 5px 10px; font-size: 0.75rem;">
          <i data-lucide="edit" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i> Edit Details
        </button>
      `
    }
  ];

  // Draw GlassTable
  const table = new GlassTable({
    container: container.querySelector('#payroll-table-mount'),
    headers: headers,
    data: getTableData(),
    pageSize: 25,
    onRowClick: null
  });

  // Attach button click event listeners on table render/update
  const attachRowEventListeners = () => {
    container.querySelectorAll('.btn-edit-payroll-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const empId = btn.getAttribute('data-emp-id');
        openEditPayrollModal(empId);
      });
    });
  };

  // Wrap table's update with listener bindings
  const originalUpdate = table.update;
  table.update = function() {
    originalUpdate.apply(this);
    attachRowEventListeners();
  };

  // Initial call to attach listeners
  attachRowEventListeners();

  // Open Modal logic
  const openEditPayrollModal = (employeeId) => {
    const emp = state.employees.find(e => e.employee_id === employeeId);
    if (!emp) return;

    let entry = state.payrollSheet.find(p => p.employee_id === employeeId);
    if (!entry) {
      entry = calculateDefaultEntry(emp);
    }

    const formHtml = `
      <div style="text-align: left;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Employee Name</label>
          <input type="text" class="form-control" value="${emp.name}" disabled style="opacity: 0.7; background: rgba(255,255,255,0.02);">
        </div>
        
        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="payroll-present-days">Present Days</label>
            <input type="number" id="payroll-present-days" class="form-control" step="0.5" min="0" max="31" value="${entry.present_days}" required>
          </div>
          <div class="form-group">
            <label for="payroll-per-day">Per Day Rate (₹)</label>
            <input type="number" id="payroll-per-day" class="form-control" step="0.01" min="0" value="${entry.per_day_salary}" required>
          </div>
        </div>

        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="payroll-advance">Advance Deduction (₹)</label>
            <input type="number" id="payroll-advance" class="form-control" step="0.01" min="0" value="${entry.advance_taken}">
          </div>
          <div class="form-group">
            <label for="payroll-pf">PF Contribution (₹)</label>
            <input type="number" id="payroll-pf" class="form-control" step="0.01" min="0" value="${entry.pf}">
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 12px;">
          <label for="payroll-final-salary">Final Net Salary (₹)</label>
          <input type="number" id="payroll-final-salary" class="form-control" step="0.01" value="${entry.final_salary}" required>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Formula: (Present Days * Rate) - Advance - PF. Click and type to override this calculation.</span>
        </div>
      </div>
    `;

    showModal(`Edit Payroll: ${emp.name}`, formHtml, (formEl) => {
      try {
        const days = parseFloat(formEl.querySelector('#payroll-present-days').value || 0);
        const rate = parseFloat(formEl.querySelector('#payroll-per-day').value || 0);
        const advance = parseFloat(formEl.querySelector('#payroll-advance').value || 0);
        const pf = parseFloat(formEl.querySelector('#payroll-pf').value || 0);
        const final = parseFloat(formEl.querySelector('#payroll-final-salary').value || 0);

        dbState.updatePayrollEntry(employeeId, {
          present_days: days,
          per_day_salary: rate,
          advance_taken: advance,
          pf: pf,
          final_salary: final
        });

        // Rerender table
        table.setData(getTableData());
        attachRowEventListeners();
        return true;
      } catch (err) {
        alert(err.message);
        return false;
      }
    });

    // Auto-fill listeners for real-time calculations
    setTimeout(() => {
      const modalEl = document.querySelector('.modal-overlay');
      if (modalEl) {
        const btnAutofill = modalEl.querySelector('.btn-modal-autofill');
        if (btnAutofill) btnAutofill.style.display = 'none';

        const inputDays = modalEl.querySelector('#payroll-present-days');
        const inputPerDay = modalEl.querySelector('#payroll-per-day');
        const inputAdvance = modalEl.querySelector('#payroll-advance');
        const inputPF = modalEl.querySelector('#payroll-pf');
        const inputFinal = modalEl.querySelector('#payroll-final-salary');

        const recalculate = () => {
          const d = parseFloat(inputDays.value) || 0;
          const r = parseFloat(inputPerDay.value) || 0;
          const a = parseFloat(inputAdvance.value) || 0;
          const p = parseFloat(inputPF.value) || 0;
          inputFinal.value = Math.max(0, round((d * r) - a - p));
        };

        [inputDays, inputPerDay, inputAdvance, inputPF].forEach(input => {
          input.addEventListener('input', recalculate);
        });
      }
    }, 50);
  };

  // Recalculate all Action (updates database state asynchronously upon explicit user confirmation)
  container.querySelector('#btn-recalculate-all').addEventListener('click', () => {
    if (confirm("Are you sure you want to recalculate payroll for all employees? This will reset custom overrides with dynamic attendance values and active advance balances.")) {
      const entries = state.employees.map(emp => calculateDefaultEntry(emp));
      dbState.updatePayrollBatch(entries);
      table.setData(getTableData());
      attachRowEventListeners();
    }
  });

  // Export CSV Action
  container.querySelector('#btn-export-payroll-csv').addEventListener('click', () => {
    const csvHeaders = ["Employee ID", "Employee Name", "Present Days", "Per Day Salary", "Advance Taken", "PF", "Final Salary"];
    const csvRows = [csvHeaders.map(h => `"${h}"`).join(',')];

    getTableData().forEach(row => {
      const data = [
        row.employee_id,
        row.name,
        row.present_days,
        row.per_day_salary,
        row.advance_taken,
        row.pf,
        row.final_salary
      ];
      csvRows.push(data.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glasserp-payroll-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Import CSV Action
  container.querySelector('#import-payroll-csv').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
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
          const entries = [];

          for (let i = 1; i < lines.length; i++) {
            const cells = splitCSVLine(lines[i]);
            const row = {};
            rawHeaders.forEach((hdr, colIndex) => {
              if (colIndex < cells.length) {
                row[hdr] = cells[colIndex];
              }
            });

            const employeeId = row['employee id'] || row['employee_id'] || '';
            if (!employeeId) continue;

            const present_days = parseFloat(row['present days'] || row['present_days'] || '0') || 0;
            const per_day_salary = parseFloat(row['per day salary'] || row['per_day_salary'] || '0') || 0;
            const advance_taken = parseFloat(row['advance taken'] || row['advance_taken'] || '0') || 0;
            const pf = parseFloat(row['pf'] || row['provident fund'] || '0') || 0;
            const final_salary = parseFloat(row['final salary'] || row['final_salary'] || '0') || 0;

            entries.push({
              employee_id: employeeId,
              present_days,
              per_day_salary,
              advance_taken,
              pf,
              final_salary
            });
          }

          if (entries.length > 0) {
            dbState.updatePayrollBatch(entries);
            alert(`Imported payroll entries for ${entries.length} employees.`);
            table.setData(getTableData());
            attachRowEventListeners();
          } else {
            alert("No valid payroll records found in CSV file.");
          }
        } catch (err) {
          alert("Failed to parse CSV file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  });

  // Handle shortcut highlighting from Employee Profile details page
  const highlightEmpId = localStorage.getItem('salary_calculator_highlight_employee');
  if (highlightEmpId) {
    localStorage.removeItem('salary_calculator_highlight_employee');
    const emp = state.employees.find(e => e.employee_id === highlightEmpId);
    if (emp) {
      setTimeout(() => {
        openEditPayrollModal(highlightEmpId);
      }, 200);
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
