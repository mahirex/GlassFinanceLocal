// GlassERP Pro V2 Global Header Component

import { dbState } from '../state.js';

export function renderHeader(container, currentViewName) {
  // Calculate total system liquidity
  const totalLiquidity = dbState.state.bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  // Formatter for Currency
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  // Determine current active theme
  const isDark = document.body.classList.contains('dark-theme');

  container.innerHTML = `
    <div class="header-title">
      <h2>${currentViewName}</h2>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">GlassERP Pro V2 Integration Layer</p>
    </div>
    
    <div class="header-controls">
      <!-- Liquidity Widget -->
      <div class="liquidity-badge">
        <i data-lucide="landmark"></i>
        <span>Liquidity: ${formatter.format(totalLiquidity)}</span>
      </div>

      <!-- Theme Switcher Button -->
      <button class="theme-toggle" title="Toggle Light/Dark Theme">
        <i data-lucide="${isDark ? 'sun' : 'moon'}"></i>
      </button>

      <!-- Profile Section -->
      <div style="display: flex; align-items: center; gap: 10px; border-left: 1px solid var(--border-glass); padding-left: 16px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #3b82f6); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-family: var(--font-heading); font-size: 0.9rem;">
          AD
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">Admin User</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">BKC HQ / State 27</span>
        </div>
      </div>
    </div>
  `;

  // Toggle Theme Listener
  const toggleBtn = container.querySelector('.theme-toggle');
  toggleBtn.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-theme');
    if (isCurrentlyDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
    // Re-render header to update icon state
    renderHeader(container, currentViewName);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
