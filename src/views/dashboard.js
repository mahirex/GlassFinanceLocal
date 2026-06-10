// GlassERP Pro V2 Dashboard View Panel

import { dbState } from '../state.js';
import { renderLineChart, renderDoughnutChart } from '../components/charts.js';

export function renderDashboard(container) {
  const state = dbState.state;

  // Calculate metrics
  const totalLiquidity = state.bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const cashInHand = state.bankAccounts.find(b => b.bank_id === 'bank-cash-hand')?.current_balance || 0;
  
  // MTD Expenses
  const mtdExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  // MTD Revenue
  const mtdRevenue = state.income.reduce((sum, inc) => sum + inc.amount, 0);

  // GST calculations
  // Real-time ITC from GST_Transactions
  const totalITC = state.gstTransactions
    .filter(t => t.type === 'ITC')
    .reduce((sum, t) => sum + (t.cgst + t.sgst + t.igst), 0);
  
  const totalOutputGST = state.gstTransactions
    .filter(t => t.type === 'Output')
    .reduce((sum, t) => sum + (t.cgst + t.sgst + t.igst), 0);
  
  const netGSTLiability = totalOutputGST - totalITC;

  // Operational metrics
  const upcomingPayroll = state.employees.reduce((sum, emp) => sum + emp.base_salary, 0);
  const totalAdvanceOutstanding = state.employees.reduce((sum, emp) => sum + emp.advance_due, 0);
  const lowStockCount = state.inventory.filter(item => item.quantity <= item.threshold).length;
  const activeProjectsCount = state.projects.filter(p => p.status === 'Active').length;

  // Formatter for Currency
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  container.innerHTML = `
    <!-- Top KPI metrics grid -->
    <div class="dashboard-grid">
      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>TREASURY LIQUIDITY</span>
          <i data-lucide="landmark" style="color: var(--accent-color);"></i>
        </div>
        <div class="card-value">${formatter.format(totalLiquidity)}</div>
        <div class="card-trend trend-up">
          <i data-lucide="trending-up"></i>
          <span>Cash-in-hand: ${formatter.format(cashInHand)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>MONTH-TO-DATE VELOCITY</span>
          <i data-lucide="zap" style="color: var(--warning-color);"></i>
        </div>
        <div class="card-value" style="color: ${mtdRevenue >= mtdExpenses ? 'var(--debit-color)' : 'var(--credit-color)'}">
          ${formatter.format(mtdRevenue - mtdExpenses)}
        </div>
        <div class="card-trend" style="color: var(--text-secondary);">
          <span>Rev: ${formatter.format(mtdRevenue)} | Exp: ${formatter.format(mtdExpenses)}</span>
        </div>
      </div>

      <div class="glass-panel metric-card">
        <div class="card-header">
          <span>REAL-TIME GST BALANCE</span>
          <i data-lucide="percent" style="color: var(--info-color);"></i>
        </div>
        <div class="card-value">${formatter.format(Math.abs(netGSTLiability))}</div>
        <div class="card-trend ${netGSTLiability <= 0 ? 'trend-up' : 'trend-down'}">
          <i data-lucide="${netGSTLiability <= 0 ? 'shield-check' : 'alert-circle'}"></i>
          <span>${netGSTLiability <= 0 ? 'ITC Receivable (Refund)' : 'GST Payable Tax Liability'}</span>
        </div>
      </div>
    </div>

    <!-- Main analytics chart split -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; align-items: start; flex-wrap: wrap;">
      <div class="glass-panel" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">Liquidity Trend & Cash Velocity</h3>
        <div id="liquidity-chart-container" style="height: 220px; width: 100%;"></div>
      </div>

      <div class="glass-panel" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">Operating Expense Allocation</h3>
        <div id="expense-doughnut-container" style="height: 220px; width: 100%;"></div>
      </div>
    </div>

    <!-- Bottom Operational Risk list alerts -->
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="font-size: 1.1rem; margin-bottom: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
        <i data-lucide="shield-alert" style="color: var(--credit-color);"></i>
        Operational Risk Indicators & Roster Action Center
      </h3>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        <!-- Salary Obligations -->
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
          <div style="padding: 10px; background: var(--warning-bg); border-radius: 8px; color: var(--warning-color);">
            <i data-lucide="contact"></i>
          </div>
          <div>
            <h5 style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Upcoming Payroll</h5>
            <p style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-heading);">${formatter.format(upcomingPayroll)}</p>
          </div>
        </div>

        <!-- Advances outstanding -->
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
          <div style="padding: 10px; background: var(--info-bg); border-radius: 8px; color: var(--info-color);">
            <i data-lucide="hand-metal"></i>
          </div>
          <div>
            <h5 style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Employee Debt</h5>
            <p style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-heading);">${formatter.format(totalAdvanceOutstanding)}</p>
          </div>
        </div>

        <!-- Low stock -->
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
          <div style="padding: 10px; background: ${lowStockCount > 0 ? 'var(--credit-bg)' : 'var(--debit-bg)'}; border-radius: 8px; color: ${lowStockCount > 0 ? 'var(--credit-color)' : 'var(--debit-color)'};">
            <i data-lucide="package"></i>
          </div>
          <div>
            <h5 style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Inventory Alerts</h5>
            <p style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-heading); color: ${lowStockCount > 0 ? 'var(--credit-color)' : 'inherit'}">${lowStockCount} Low Reorder</p>
          </div>
        </div>

        <!-- Active Projects -->
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
          <div style="padding: 10px; background: var(--debit-bg); border-radius: 8px; color: var(--debit-color);">
            <i data-lucide="briefcase"></i>
          </div>
          <div>
            <h5 style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Active Projects</h5>
            <p style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-heading);">${activeProjectsCount} Project pipelines</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw Charts
  const lineChartContainer = container.querySelector('#liquidity-chart-container');
  const doughnutContainer = container.querySelector('#expense-doughnut-container');

  // Static historical point generation + current state calculations
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun MTD'];
  const baseLiquidity = 2800000;
  const values = [
    baseLiquidity,
    baseLiquidity + 150000,
    baseLiquidity - 80000,
    baseLiquidity + 300000,
    baseLiquidity + 450000,
    totalLiquidity
  ];

  renderLineChart(lineChartContainer, labels, values);

  // Group expenses for doughnut chart
  const categoriesMap = {};
  state.expenses.forEach(e => {
    categoriesMap[e.payment_type] = (categoriesMap[e.payment_type] || 0) + e.amount;
  });

  const doughnutLabels = Object.keys(categoriesMap);
  const doughnutValues = Object.values(categoriesMap);

  if (doughnutLabels.length === 0) {
    // Seeding dummy elements for look & feel if empty
    renderDoughnutChart(doughnutContainer, ['Salary', 'Materials', 'Operational'], [120000, 85000, 45000]);
  } else {
    renderDoughnutChart(doughnutContainer, doughnutLabels, doughnutValues);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
