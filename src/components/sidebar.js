// GlassERP Pro V2 Sidebar Navigation Component

export function renderSidebar(container, activeRoute, onNavigate) {
  // Navigation structure definition
  const menuStructure = [
    {
      title: '',
      items: [
        { route: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' }
      ]
    },
    {
      title: 'Finance',
      items: [
        { route: 'make-payment', label: 'Make Payment', icon: 'arrow-up-right' },
        { route: 'receive-payment', label: 'Receive Payment', icon: 'arrow-down-left' },
        { route: 'expenses', label: 'Expenses', icon: 'receipt' },
        { route: 'income', label: 'Income', icon: 'wallet' },
        { route: 'bank-accounts', label: 'Bank Accounts', icon: 'landmark' },
        { route: 'ledger', label: 'Ledger', icon: 'book-open' },
        { route: 'gst', label: 'GST', icon: 'percent' },
        { route: 'reports', label: 'Reports', icon: 'bar-chart-3' }
      ]
    },
    {
      title: 'Operations',
      items: [
        { route: 'projects', label: 'Projects', icon: 'briefcase' },
        { route: 'quotations', label: 'Quotations', icon: 'file-text' },
        { route: 'inventory', label: 'Inventory', icon: 'package' },
        { route: 'production', label: 'Production', icon: 'wrench' },
        { route: 'customers', label: 'Customers', icon: 'users' },
        { route: 'vendors', label: 'Vendors', icon: 'truck' }
      ]
    },
    {
      title: 'HR & Staffing',
      items: [
        { route: 'employees', label: 'Employees', icon: 'contact' },
        { route: 'attendance', label: 'Attendance', icon: 'calendar-days' },
        { route: 'employee-advances', label: 'Employee Advances', icon: 'coins' }
      ]
    },
    {
      title: 'System Settings',
      items: [
        { route: 'settings', label: 'Settings', icon: 'settings' },
        { route: 'audit-log', label: 'Audit Log', icon: 'shield-alert' } // audit log is essential
      ]
    }
  ];

  container.innerHTML = '';

  const logoDiv = document.createElement('div');
  logoDiv.className = 'sidebar-logo';
  logoDiv.innerHTML = `
    <i data-lucide="blocks" style="color: var(--accent-color); width: 28px; height: 28px;"></i>
    <h1>GlassERP Pro <span style="font-size: 0.75rem; vertical-align: super; opacity: 0.7;">V2</span></h1>
  `;
  container.appendChild(logoDiv);

  const menuNav = document.createElement('nav');
  menuNav.className = 'sidebar-menu';

  menuStructure.forEach(section => {
    if (section.title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'menu-section-title';
      titleDiv.textContent = section.title;
      menuNav.appendChild(titleDiv);
    }

    section.items.forEach(item => {
      const a = document.createElement('a');
      a.className = `menu-item ${activeRoute === item.route ? 'active' : ''}`;
      a.dataset.route = item.route;
      a.innerHTML = `
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      `;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigate(item.route);
      });
      menuNav.appendChild(a);
    });
  });

  container.appendChild(menuNav);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
