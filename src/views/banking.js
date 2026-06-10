// GlassERP Pro V2 Bank Accounts Control Hub

import { dbState, round } from '../state.js';
import { inrFormat } from './finance.js';
import { GlassTable } from '../components/table.js';

export function renderBanking(container) {
  const state = dbState.state;

  // Render accounts list
  let bankCardsHtml = '';
  
  state.bankAccounts.forEach(acc => {
    // Calculate Credits/Debits totals for this account
    let totalCredits = 0;
    let totalDebits = 0;

    state.ledgerEntries.forEach(entry => {
      entry.legs.forEach(leg => {
        if (leg.bank_id === acc.bank_id) {
          if (leg.type === 'DEBIT') totalCredits = round(totalCredits + leg.amount);
          else if (leg.type === 'CREDIT') totalDebits = round(totalDebits + leg.amount);
        }
      });
    });

    const maskedAccNum = acc.account_number.startsWith('CASH') 
      ? acc.account_number 
      : '************' + acc.account_number.slice(-4);

    bankCardsHtml += `
      <div class="glass-panel bank-panel-card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
              ${acc.account_name} ${acc.bank_id === 'bank-sbi-current' ? '<span style="font-size: 0.65rem; background: var(--accent-light); color: var(--accent-color); padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 5px;">Primary</span>' : ''}
            </h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">Acc: ${maskedAccNum}</p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Current Balance</span>
            <h3 style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 800; color: var(--accent-color); margin-top: 2px;">
              ${inrFormat.format(acc.current_balance)}
            </h3>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; border-top: 1px solid var(--border-glass); border-bottom: 1px solid var(--border-glass); padding: 15px 0;">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Inflows (Credits)</span>
            <p style="font-size: 0.95rem; font-weight: 700; color: var(--debit-color); margin-top: 2px;">${inrFormat.format(totalCredits)}</p>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Outflows (Debits)</span>
            <p style="font-size: 0.95rem; font-weight: 700; color: var(--credit-color); margin-top: 2px;">${inrFormat.format(totalDebits)}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
          <span style="color: var(--text-secondary);">IFSC: <span style="font-family: monospace; color: var(--text-primary); font-weight: 600;">${acc.ifsc}</span></span>
          <span class="trend-up" style="display: flex; align-items: center; gap: 4px; font-weight: 600;">
            <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
            ▲ 12.4% vs Last Month
          </span>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <!-- Top Account Grid -->
    <div class="bank-grid">
      ${bankCardsHtml}
    </div>

    <!-- Fund Transfer and Details -->
    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; flex-wrap: wrap;">
      
      <!-- Inter-Account Fund Transfer -->
      <div class="glass-panel">
        <h3 style="font-size: 1.25rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="refresh-cw" style="color: var(--accent-color);"></i>
          Inter-Account Fund Transfer Protocol
        </h3>

        <form id="fund-transfer-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="xfer-date">Transfer Date *</label>
              <input type="date" id="xfer-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
            </div>

            <div class="form-group">
              <label for="xfer-amount">Transfer Amount (₹) *</label>
              <input type="number" step="0.01" id="xfer-amount" class="form-control" placeholder="10,000.00" required>
            </div>

            <div class="form-group">
              <label for="xfer-from">Source Account *</label>
              <select id="xfer-from" required>
                <option value="" disabled selected>-- Choose Source --</option>
                ${state.bankAccounts.map(b => `<option value="${b.bank_id}">${b.account_name} (${inrFormat.format(b.current_balance)})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="xfer-to">Destination Account *</label>
              <select id="xfer-to" required>
                <option value="" disabled selected>-- Choose Destination --</option>
                ${state.bankAccounts.map(b => `<option value="${b.bank_id}">${b.account_name} (${inrFormat.format(b.current_balance)})</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="xfer-ref">Internal Reference Number *</label>
              <input type="text" id="xfer-ref" class="form-control" placeholder="XFER-REF-XXXX" required>
            </div>

            <div class="form-group">
              <label for="xfer-desc">Description</label>
              <input type="text" id="xfer-desc" class="form-control" placeholder="Internal capital movement reasons...">
            </div>
          </div>

          <div id="transfer-feedback" style="display: none; padding: 12px; border-radius: var(--border-radius-sm); font-size: 0.85rem; font-weight: 600; margin-bottom: 15px;"></div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-autofill-xfer" style="margin-right: auto; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2);"><i data-lucide="sparkles" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> Autofill Demo</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="refresh-cw"></i> Execute Internal Transfer</button>
          </div>
        </form>
      </div>

      <!-- Compliance Policy Audit Panel -->
      <div class="glass-panel">
        <h3 style="font-size: 1.1rem; margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">
          Treasury Verification Rules
        </h3>
        
        <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; line-height: 1.5;">
          <li>
            <strong>Mathematical Balance Rule:</strong>
            Account balance must exactly equal:
            <br>
            <span style="font-family: monospace; color: var(--accent-color);">Opening Balance + Inflows - Outflows</span>
            at all times.
          </li>
          <li>
            <strong>Overdraft Lock:</strong>
            Accounts without overdraft approval flag block ledger entries that would push balance values below zero.
          </li>
          <li>
            <strong>Unified Audit Trail:</strong>
            Internal fund transfers execute atomic double ledger updates (Credit source bank / Debit destination bank) using a single cross-referenced voucher tracking code.
          </li>
        </ul>
      </div>
    </div>

    <!-- Bank Accounts Table Mount -->
    <div class="glass-panel" style="padding: 24px; margin-top: 25px;">
      <h3 style="font-size: 1.15rem; margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">
        Bank Accounts Master Registry
      </h3>
      <div id="bank-accounts-table-mount"></div>
    </div>
  `;

  // Submit transfer form
  const form = container.querySelector('#fund-transfer-form');
  const feedbackEl = container.querySelector('#transfer-feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedbackEl.style.display = 'none';

    const payload = {
      date: container.querySelector('#xfer-date').value,
      amount: parseFloat(container.querySelector('#xfer-amount').value),
      fromBankId: container.querySelector('#xfer-from').value,
      toBankId: container.querySelector('#xfer-to').value,
      referenceNo: container.querySelector('#xfer-ref').value,
      description: container.querySelector('#xfer-desc').value
    };

    const txnResult = dbState.transferFunds(payload);

    if (txnResult.success) {
      feedbackEl.style.background = 'var(--debit-bg)';
      feedbackEl.style.color = 'var(--debit-color)';
      feedbackEl.style.border = '1px solid var(--debit-color)';
      feedbackEl.innerHTML = `<i data-lucide="check-circle" style="vertical-align: middle; margin-right: 8px;"></i> Capital moved successfully. Balances updated.`;
      feedbackEl.style.display = 'block';
      
      // Re-render the banking view after 1 second to update balances and list options
      setTimeout(() => renderBanking(container), 1000);
    } else {
      feedbackEl.style.background = 'var(--credit-bg)';
      feedbackEl.style.color = 'var(--credit-color)';
      feedbackEl.style.border = '1px solid var(--credit-color)';
      feedbackEl.innerHTML = `<i data-lucide="alert-triangle" style="vertical-align: middle; margin-right: 8px;"></i> Transfer Blocked: ${txnResult.error}`;
      feedbackEl.style.display = 'block';
    }

  const btnAutofillXfer = container.querySelector('.btn-autofill-xfer');
  if (btnAutofillXfer) {
    btnAutofillXfer.addEventListener('click', () => {
      container.querySelector('#xfer-amount').value = '25000';
      const fromSelect = container.querySelector('#xfer-from');
      if (fromSelect.options.length > 1) {
        fromSelect.selectedIndex = 1;
      }
      const toSelect = container.querySelector('#xfer-to');
      if (toSelect.options.length > 2) {
        toSelect.selectedIndex = 2; // select a different bank
      } else if (toSelect.options.length > 1) {
        toSelect.selectedIndex = 1;
      }
      container.querySelector('#xfer-ref').value = `XFER-${Math.floor(1000 + Math.random() * 9000)}`;
      container.querySelector('#xfer-desc').value = 'Treasury balancing - moving funds to HDFC active operations account';
    });
  }

  if (window.lucide) window.lucide.createIcons();
  });

  const headers = [
    { key: 'account_name', label: 'Account Name' },
    { key: 'account_number', label: 'Account Number' },
    { key: 'ifsc', label: 'IFSC' },
    { key: 'branch', label: 'Branch' },
    { key: 'opening_balance', label: 'Opening Balance (₹)', render: val => inrFormat.format(val) },
    { key: 'current_balance', label: 'Current Balance (₹)', render: val => inrFormat.format(val) },
    { key: 'upi_id', label: 'UPI ID' },
    { key: 'allow_overdraft', label: 'Allow Overdraft', render: val => val ? 'Yes' : 'No' }
  ];

  new GlassTable({
    container: container.querySelector('#bank-accounts-table-mount'),
    headers: headers,
    data: state.bankAccounts,
    onImportCSV: (importedRows) => {
      importedRows.forEach(row => {
        dbState.addBankAccount({
          account_name: row.account_name || row['account name'] || row['name'] || '',
          account_number: row.account_number || row['account number'] || '',
          ifsc: row.ifsc || 'NA',
          branch: row.branch || 'NA',
          opening_balance: parseFloat(String(row.opening_balance || row['opening balance'] || '0').replace(/[^\d.]/g, '')) || 0,
          upi_id: row.upi_id || row['upi id'] || '',
          allow_overdraft: row.allow_overdraft === 'true' || row.allow_overdraft === true || String(row['allow overdraft']).toLowerCase() === 'true'
        });
      });
      renderBanking(container);
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
