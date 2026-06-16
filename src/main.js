// GlassERP Pro V2 Application Coordinator & Router

import './style.css';
import { dbState } from './state.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';

// Views imports
import { renderDashboard } from './views/dashboard.js';
import { 
  renderMakePayment, 
  renderReceivePayment, 
  renderExpensesLog, 
  renderIncomeLog, 
  renderLedger 
} from './views/finance.js';
import { renderBanking } from './views/banking.js';
import { renderProjects } from './views/projects.js';
import { renderReports } from './views/reports.js';
import { renderHR } from './views/hr.js';
import { renderGST } from './views/gst.js';
import { renderSettings } from './views/settings.js';
import { renderAuditLog } from './views/auditLog.js';
import { renderOperations } from './views/operations.js';

// Application active route mapping
let currentRoute = 'dashboard';

const routeDisplayNames = {
  'dashboard': 'Executive Control Dashboard',
  'make-payment': 'Universal Make Payment Engine',
  'receive-payment': 'Universal Receive Inflow Engine',
  'expenses': 'Expenses Tracking Register',
  'income': 'Income Verification Register',
  'bank-accounts': 'Multi-Account Treasury Panel',
  'ledger': 'General Double-Entry Ledger',
  'gst': 'GST Compliance & Filing Audit',
  'reports': 'P&L, Cash Flow, Balance Sheets Reports',
  'projects': 'Active Projects Costings & Margins',
  'quotations': 'Sales Quotations Pricing Pipelines',
  'inventory': 'Raw Materials stock Ledger',
  'production': 'Manufacturing schedules Shop-floor',
  'customers': 'CRM Customer Accounts Directory',
  'vendors': 'Accounts Payable Vendor Directory',
  'employees': 'Staff Master Directory',
  'attendance': 'Daily Attendance Overtime Matrix',
  'employee-advances': 'Employee Salary Advances Board',
  'petrol': 'Employee Petrol Advances Board',
  'settings': 'Corporate & Accounting Settings',
  'audit-log': 'Immutable System Audit trails'
};

// Initialize Application Layout
async function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Render premium loading screen
  appContainer.innerHTML = `
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .loading-spinner {
        border: 3px solid rgba(255, 255, 255, 0.05);
        border-top: 3px solid #6366f1;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
    </style>
    <div style="display:flex; justify-content:center; align-items:center; height:100vh; width:100vw; background-color:#080b11; color:#f3f4f6; font-family:'Outfit', sans-serif; position:fixed; top:0; left:0; z-index:9999;">
      <div style="text-align:center;">
        <div class="loading-spinner"></div>
        <div style="font-size:0.95rem; font-weight:600; letter-spacing:0.02em; color:#9ca3af;">Connecting to Secure Cloud Ledger...</div>
      </div>
    </div>
  `;

  // Asynchronously initialize state from Supabase
  try {
    await dbState.init();
  } catch (error) {
    console.error('Failed to load cloud state:', error);
  }

  appContainer.innerHTML = `
    <!-- Left Navigation sidebar -->
    <aside class="sidebar-container"></aside>
    
    <!-- Right main content viewport -->
    <main>
      <header class="global-header"></header>
      <div id="main-view-container"></div>
    </main>
  `;

  // Draw initial state layouts
  renderAppShell();

  // Subscribe state updates to trigger rerender of active view
  dbState.subscribe(() => {
    renderAppShell();
  });
}

function renderAppShell() {
  const sidebarContainer = document.querySelector('.sidebar-container');
  const headerContainer = document.querySelector('.global-header');
  const viewContainer = document.querySelector('#main-view-container');

  if (!sidebarContainer || !headerContainer || !viewContainer) return;

  // 1. Sidebar Nav Drawing
  renderSidebar(sidebarContainer, currentRoute, (newRoute) => {
    currentRoute = newRoute;
    renderAppShell();
  });

  // 2. Header Status Panels Drawing
  const viewTitle = routeDisplayNames[currentRoute] || 'ERP Control Panel';
  renderHeader(headerContainer, viewTitle);

  // 3. Mount current active view
  viewContainer.innerHTML = '';
  mountActiveView(viewContainer);
}

function mountActiveView(container) {
  switch (currentRoute) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'make-payment':
      renderMakePayment(container);
      break;
    case 'receive-payment':
      renderReceivePayment(container);
      break;
    case 'expenses':
      renderExpensesLog(container);
      break;
    case 'income':
      renderIncomeLog(container);
      break;
    case 'bank-accounts':
      renderBanking(container);
      break;
    case 'ledger':
      renderLedger(container);
      break;
    case 'gst':
      renderGST(container);
      break;
    case 'reports':
      renderReports(container);
      break;
    case 'projects':
      renderProjects(container);
      break;
    case 'quotations':
    case 'inventory':
    case 'production':
    case 'customers':
    case 'vendors':
      renderOperations(container, currentRoute);
      break;
    case 'employees':
    case 'attendance':
    case 'employee-advances':
    case 'petrol':
      renderHR(container, currentRoute);
      break;
    case 'settings':
      renderSettings(container);
      break;
    case 'audit-log':
      renderAuditLog(container);
      break;
    default:
      container.innerHTML = `<div class="glass-panel">View not found</div>`;
  }
}

// Start app
window.addEventListener('DOMContentLoaded', initApp);
// Trigger init immediately if window is loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}
