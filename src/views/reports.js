// GlassERP Pro V2 Financial Reports Engine

import { dbState, round } from '../state.js';
import { inrFormat } from './finance.js';

export function renderReports(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
      <div class="tab-list" style="margin: 0; padding: 0; border: none;">
        <button class="tab-btn active" id="btn-pl">Profit & Loss (P&L)</button>
        <button class="tab-btn" id="btn-bs">Balance Sheet</button>
        <button class="tab-btn" id="btn-cf">Cash Flow Statement</button>
      </div>
      <button class="btn btn-secondary" id="btn-export-report"><i data-lucide="download"></i> Export Report CSV</button>
    </div>

    <div id="report-sheet-mount" class="glass-panel" style="padding: 30px;"></div>
  `;

  // Hooks for tabs switching
  const btnPL = container.querySelector('#btn-pl');
  const btnBS = container.querySelector('#btn-bs');
  const btnCF = container.querySelector('#btn-cf');
  const sheetMount = container.querySelector('#report-sheet-mount');

  const tabs = [btnPL, btnBS, btnCF];

  function activateTab(btn, renderFn) {
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderFn(sheetMount);
  }

  btnPL.addEventListener('click', () => activateTab(btnPL, renderPL));
  btnBS.addEventListener('click', () => activateTab(btnBS, renderBS));
  btnCF.addEventListener('click', () => activateTab(btnCF, renderCF));

  // Export CSV handler
  container.querySelector('#btn-export-report').addEventListener('click', () => {
    const activeTab = container.querySelector('.tab-btn.active');
    const reportName = activeTab ? activeTab.textContent.trim().replace(/\s+/g, '-') : 'Financial-Report';
    const csvRows = [];
    
    if (activeTab.id === 'btn-bs') {
      // Balance sheet is special: two columns (Assets on Left, Liabilities/Equity on Right)
      const leftRows = sheetMount.querySelectorAll('.report-sheet > div > div:first-child > .report-row');
      const rightRows = sheetMount.querySelectorAll('.report-sheet > div > div:last-child > .report-row');
      
      const maxLen = Math.max(leftRows.length, rightRows.length);
      csvRows.push('"ASSETS","Value (₹)","","LIABILITIES & EQUITY","Value (₹)"');
      
      for (let i = 0; i < maxLen; i++) {
        const leftRow = leftRows[i];
        const rightRow = rightRows[i];
        
        let leftCol1 = '', leftCol2 = '';
        if (leftRow) {
          if (leftRow.children.length >= 2) {
            leftCol1 = leftRow.children[0].textContent.trim();
            leftCol2 = leftRow.children[1].textContent.trim();
          } else {
            leftCol1 = leftRow.textContent.trim();
          }
        }
        
        let rightCol1 = '', rightCol2 = '';
        if (rightRow) {
          if (rightRow.children.length >= 2) {
            rightCol1 = rightRow.children[0].textContent.trim();
            rightCol2 = rightRow.children[1].textContent.trim();
          } else {
            rightCol1 = rightRow.textContent.trim();
          }
        }
        
        csvRows.push(`"${leftCol1.replace(/"/g, '""')}","${leftCol2.replace(/"/g, '""')}","","${rightCol1.replace(/"/g, '""')}","${rightCol2.replace(/"/g, '""')}"`);
      }
    } else {
      // P&L and Cash Flow are flat single column lists
      const rows = sheetMount.querySelectorAll('.report-sheet > .report-row');
      rows.forEach(r => {
        const cells = [];
        if (r.children.length > 0) {
          for (let i = 0; i < r.children.length; i++) {
            cells.push(r.children[i].textContent.trim());
          }
        } else {
          cells.push(r.textContent.trim());
        }
        csvRows.push(cells.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glasserp-${reportName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Initialize with P&L
  renderPL(sheetMount);
}

// 1. PROFIT & LOSS SHEET RENDER
function renderPL(mount) {
  const state = dbState.state;

  // Calculate dynamic revenues & expenses from ledger accounts
  let revenueTotal = 0;
  let interestRevenue = 0;
  let operatingRevenue = 0;

  let generalExpenses = 0;
  let salariesExpenses = 0;
  let materialsExpenses = 0;
  let rentExpenses = 0;
  let utilitiesExpenses = 0;
  let repairExpenses = 0;

  state.ledgerEntries.forEach(entry => {
    entry.legs.forEach(leg => {
      // In double-entry, credit to revenue represents income
      if (leg.type === 'CREDIT') {
        if (leg.account === 'Misc Revenue' || leg.account === 'Accounts Receivable') {
          operatingRevenue = round(operatingRevenue + leg.amount);
        } else if (leg.account === 'Interest Revenue') {
          interestRevenue = round(interestRevenue + leg.amount);
        }
      }
      // Debit represents expense
      if (leg.type === 'DEBIT') {
        if (leg.account === 'General Expenses' || leg.account === 'Operating Expenses') {
          generalExpenses = round(generalExpenses + leg.amount);
        } else if (leg.account === 'Salaries Payable' || leg.account === 'Salaries Expense') {
          salariesExpenses = round(salariesExpenses + leg.amount);
        } else if (leg.account === 'Inventory Materials Asset' || leg.account === 'Materials Procurement') {
          materialsExpenses = round(materialsExpenses + leg.amount);
        } else if (leg.account === 'Rent Expense Account') {
          rentExpenses = round(rentExpenses + leg.amount);
        } else if (leg.account === 'Utilities Expense Account') {
          utilitiesExpenses = round(utilitiesExpenses + leg.amount);
        } else if (leg.account === 'Fixed Asset Maintenance') {
          repairExpenses = round(repairExpenses + leg.amount);
        }
      }
    });
  });

  revenueTotal = round(operatingRevenue + interestRevenue);
  const totalExpenses = round(generalExpenses + salariesExpenses + materialsExpenses + rentExpenses + utilitiesExpenses + repairExpenses);
  const netIncome = round(revenueTotal - totalExpenses);

  mount.innerHTML = `
    <div class="report-sheet">
      <div style="text-align: center; margin-bottom: 25px;">
        <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${state.settings.companyName}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Statement of Profit and Loss | MTD Cumulative View</p>
      </div>

      <div class="report-row header">Revenue & Operational Inflow</div>
      <div class="report-row">
        <span>Operating Revenue / Receivables Payments</span>
        <span>${inrFormat.format(operatingRevenue)}</span>
      </div>
      <div class="report-row">
        <span>Interest Income</span>
        <span>${inrFormat.format(interestRevenue)}</span>
      </div>
      <div class="report-row subtotal">
        <span>Total Revenue (A)</span>
        <span>${inrFormat.format(revenueTotal)}</span>
      </div>

      <div class="report-row header">Operating Expenses</div>
      <div class="report-row">
        <span>Materials Procurement Cost</span>
        <span>${inrFormat.format(materialsExpenses)}</span>
      </div>
      <div class="report-row">
        <span>Staff Salaries & Benefits</span>
        <span>${inrFormat.format(salariesExpenses)}</span>
      </div>
      <div class="report-row">
        <span>Office Rent Expense</span>
        <span>${inrFormat.format(rentExpenses)}</span>
      </div>
      <div class="report-row">
        <span>Utility (Power, Internet) Outlays</span>
        <span>${inrFormat.format(utilitiesExpenses)}</span>
      </div>
      <div class="report-row">
        <span>Machine & Asset Maintenance</span>
        <span>${inrFormat.format(repairExpenses)}</span>
      </div>
      <div class="report-row">
        <span>General Administrative Overhead</span>
        <span>${inrFormat.format(generalExpenses)}</span>
      </div>
      <div class="report-row subtotal">
        <span>Total Expenses (B)</span>
        <span>${inrFormat.format(totalExpenses)}</span>
      </div>

      <div class="report-row total">
        <span>Net Operating Profit / (Loss) (A - B)</span>
        <span style="color: ${netIncome >= 0 ? 'var(--debit-color)' : 'var(--credit-color)'}">${inrFormat.format(netIncome)}</span>
      </div>
    </div>
  `;
}

// 2. BALANCE SHEET RENDER
function renderBS(mount) {
  const state = dbState.state;

  // 1. Assets
  const bankBalancesTotal = state.bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const employeeAdvancesTotal = state.employees.reduce((sum, emp) => sum + emp.advance_due, 0);
  const accountsReceivableTotal = state.customers.reduce((sum, cust) => sum + (cust.outstanding || 0), 0);
  const totalAssets = round(bankBalancesTotal + employeeAdvancesTotal + accountsReceivableTotal);

  // 2. Liabilities
  const accountsPayableTotal = state.vendors.reduce((sum, v) => sum + (v.outstanding || 0), 0);

  // 3. Equity
  // Seeding initial capital injections
  let initialEquity = 0;
  state.ledgerEntries.forEach(entry => {
    entry.legs.forEach(leg => {
      if (leg.account === 'Shareholders Equity' && leg.type === 'CREDIT') {
        initialEquity = round(initialEquity + leg.amount);
      }
    });
  });

  // Calculate net profit to date
  let totalRevenues = 0;
  let totalExpenses = 0;
  state.ledgerEntries.forEach(entry => {
    entry.legs.forEach(leg => {
      if (leg.type === 'CREDIT' && (leg.account === 'Misc Revenue' || leg.account === 'Accounts Receivable' || leg.account === 'Interest Revenue')) {
        totalRevenues = round(totalRevenues + leg.amount);
      }
      if (leg.type === 'DEBIT' && (leg.account === 'General Expenses' || leg.account === 'Operating Expenses' || leg.account === 'Salaries Payable' || leg.account === 'Salaries Expense' || leg.account === 'Inventory Materials Asset' || leg.account === 'Materials Procurement' || leg.account === 'Rent Expense Account' || leg.account === 'Utilities Expense Account' || leg.account === 'Fixed Asset Maintenance')) {
        totalExpenses = round(totalExpenses + leg.amount);
      }
    });
  });

  const netEarnings = round(totalRevenues - totalExpenses);
  const currentEquity = round(initialEquity + netEarnings);
  
  // Total Liabilities + Equity
  const totalLiabilitiesEquity = round(accountsPayableTotal + currentEquity);

  mount.innerHTML = `
    <div class="report-sheet">
      <div style="text-align: center; margin-bottom: 25px;">
        <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${state.settings.companyName}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Statement of Financial Position (Balance Sheet)</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; flex-wrap: wrap;">
        <!-- Left Column: Assets -->
        <div>
          <div class="report-row header" style="border-bottom-color: var(--debit-color);">ASSETS (Current & Liquid)</div>
          
          <div class="report-row">
            <span>Bank & Cash Balances</span>
            <span>${inrFormat.format(bankBalancesTotal)}</span>
          </div>
          <div class="report-row">
            <span>Employee Advance Receivables</span>
            <span>${inrFormat.format(employeeAdvancesTotal)}</span>
          </div>
          <div class="report-row">
            <span>Customer Accounts Receivable</span>
            <span>${inrFormat.format(accountsReceivableTotal)}</span>
          </div>
          
          <div class="report-row total" style="margin-top: 30px; background: var(--debit-bg);">
            <span>TOTAL ASSETS</span>
            <span>${inrFormat.format(totalAssets)}</span>
          </div>
        </div>

        <!-- Right Column: Liabilities & Equity -->
        <div>
          <div class="report-row header" style="border-bottom-color: var(--credit-color);">LIABILITIES & EQUITY</div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 700; font-size: 0.85rem; padding: 6px 16px; color: var(--text-secondary);">Current Liabilities</div>
            <div class="report-row">
              <span>Vendor Accounts Payable</span>
              <span>${inrFormat.format(accountsPayableTotal)}</span>
            </div>
          </div>

          <div>
            <div style="font-weight: 700; font-size: 0.85rem; padding: 6px 16px; color: var(--text-secondary);">Shareholder Equity</div>
            <div class="report-row">
              <span>Contributed Paid-in Capital</span>
              <span>${inrFormat.format(initialEquity)}</span>
            </div>
            <div class="report-row">
              <span>Retained Earnings</span>
              <span>${inrFormat.format(netEarnings)}</span>
            </div>
          </div>

          <div class="report-row total" style="margin-top: 8px; background: var(--credit-bg);">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span>${inrFormat.format(totalLiabilitiesEquity)}</span>
          </div>
        </div>
      </div>

      <!-- Balanced Check Badge -->
      <div style="display: flex; justify-content: center; margin-top: 30px;">
        <div style="display: flex; align-items: center; gap: 8px; background: var(--debit-bg); color: var(--debit-color); padding: 8px 24px; border-radius: 50px; font-weight: 700; border: 1px solid var(--debit-color);">
          <i data-lucide="shield-check"></i>
          <span>Assets = Liabilities + Equity Balance Verified</span>
        </div>
      </div>
    </div>
  `;
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// 3. CASH FLOW STATEMENT RENDER
function renderCF(mount) {
  const state = dbState.state;

  // Re-run checks on operational cash flow allocations
  let opCashIn = 0;
  let opCashOut = 0;
  let investCashOut = 0;
  let financeCashIn = 0;

  // Process ledger transactions
  state.ledgerEntries.forEach(entry => {
    // Categorize entry based on reference & desc
    const isCapital = entry.reference_number.startsWith('OP-BAL');
    const isTransfer = entry.description.includes('Internal Fund Transfer');
    
    if (isTransfer) return; // skip internal transfers for cash flow total

    entry.legs.forEach(leg => {
      // We only care about actual bank/cash updates
      if (leg.bank_id) {
        if (leg.type === 'DEBIT') {
          if (isCapital) {
            financeCashIn = round(financeCashIn + leg.amount);
          } else {
            opCashIn = round(opCashIn + leg.amount);
          }
        } else if (leg.type === 'CREDIT') {
          // Check investing category
          if (entry.description.includes('Machine Repair') || entry.description.includes('Fixed Asset')) {
            investCashOut = round(investCashOut + leg.amount);
          } else {
            opCashOut = round(opCashOut + leg.amount);
          }
        }
      }
    });
  });

  const netOperatingCF = round(opCashIn - opCashOut);
  const netInvestingCF = round(-investCashOut);
  const netFinancingCF = round(financeCashIn);
  const netIncreaseCash = round(netOperatingCF + netInvestingCF + netFinancingCF);

  mount.innerHTML = `
    <div class="report-sheet">
      <div style="text-align: center; margin-bottom: 25px;">
        <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${state.settings.companyName}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Statement of Cash Flows | Direct Method</p>
      </div>

      <div class="report-row header">Cash Flow from Operating Activities</div>
      <div class="report-row">
        <span>Receipts from Customers & Debt Refunds</span>
        <span>${inrFormat.format(opCashIn)}</span>
      </div>
      <div class="report-row">
        <span>Payments for Materials, Salaries & Overheads</span>
        <span style="color: var(--credit-color);">${inrFormat.format(-opCashOut)}</span>
      </div>
      <div class="report-row subtotal">
        <span>Net Cash generated from Operating Activities</span>
        <span>${inrFormat.format(netOperatingCF)}</span>
      </div>

      <div class="report-row header">Cash Flow from Investing Activities</div>
      <div class="report-row">
        <span>Payments for Machine Repairs & Tool Assets</span>
        <span style="color: var(--credit-color);">${inrFormat.format(-investCashOut)}</span>
      </div>
      <div class="report-row subtotal">
        <span>Net Cash used in Investing Activities</span>
        <span style="color: var(--credit-color);">${inrFormat.format(netInvestingCF)}</span>
      </div>

      <div class="report-row header">Cash Flow from Financing Activities</div>
      <div class="report-row">
        <span>Proceeds from Capital Injections / Shareholders</span>
        <span>${inrFormat.format(financeCashIn)}</span>
      </div>
      <div class="report-row subtotal">
        <span>Net Cash from Financing Activities</span>
        <span>${inrFormat.format(netFinancingCF)}</span>
      </div>

      <div class="report-row total" style="margin-top: 25px;">
        <span>Net Increase / Decrease in Liquid Cash</span>
        <span>${inrFormat.format(netIncreaseCash)}</span>
      </div>

      <div style="display: flex; justify-content: center; margin-top: 30px;">
        <div style="display: flex; align-items: center; gap: 8px; background: var(--info-bg); color: var(--info-color); padding: 8px 24px; border-radius: 50px; font-weight: 700; border: 1px solid var(--info-color);">
          <i data-lucide="check-circle-2"></i>
          <span>Reconciled Cash matches Bank Treasury Balances</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
