// GlassERP Pro V2 Sidebar Navigation Component

export function renderSidebar(container, activeRoute, onNavigate) {
  // Preserve open status on mobile if it was already open
  const isOpen = container.classList.contains('open');

  // Create or retrieve mobile backdrop overlay
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

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
        { route: 'employee-advances', label: 'Employee Advances', icon: 'coins' },
        { route: 'petrol', label: 'Petrol Advances', icon: 'fuel' }
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
        // Close sidebar on mobile after navigating
        container.classList.remove('open');
        overlay.classList.remove('active');
        onNavigate(item.route);
      });
      menuNav.appendChild(a);
    });
  });

  container.appendChild(menuNav);

  // Overlay click event listener to close drawer on mobile
  overlay.onclick = () => {
    container.classList.remove('open');
    overlay.classList.remove('active');
    const toggleIcon = toggleBtn.querySelector('i');
    if (toggleIcon) {
      toggleIcon.setAttribute('data-lucide', 'chevron-right');
      if (window.lucide) window.lucide.createIcons();
    }
  };

  // Unified toggle/collapse handle button
  const appEl = document.getElementById('app');
  const isCollapsed = appEl ? appEl.classList.contains('sidebar-collapsed') : false;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'sidebar-toggle-btn';
  toggleBtn.setAttribute('title', 'Toggle Navigation Sidebar');
  
  let initialIcon = 'chevron-left';
  if (window.innerWidth <= 768) {
    initialIcon = isOpen ? 'chevron-left' : 'chevron-right';
  } else {
    initialIcon = isCollapsed ? 'chevron-right' : 'chevron-left';
  }
  
  toggleBtn.innerHTML = `<i data-lucide="${initialIcon}"></i>`;
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (window.innerWidth <= 768) {
      const willOpen = !container.classList.contains('open');
      container.classList.toggle('open', willOpen);
      overlay.classList.toggle('active', willOpen);
      
      const toggleIcon = toggleBtn.querySelector('i');
      if (toggleIcon) {
        toggleIcon.setAttribute('data-lucide', willOpen ? 'chevron-left' : 'chevron-right');
        if (window.lucide) window.lucide.createIcons();
      }
    } else {
      if (appEl) {
        const willCollapse = !appEl.classList.contains('sidebar-collapsed');
        appEl.classList.toggle('sidebar-collapsed', willCollapse);
        
        const toggleIcon = toggleBtn.querySelector('i');
        if (toggleIcon) {
          toggleIcon.setAttribute('data-lucide', willCollapse ? 'chevron-right' : 'chevron-left');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    }
  });
  container.appendChild(toggleBtn);

  // Restore open classes if state is active
  if (isOpen) {
    container.classList.add('open');
    overlay.classList.add('active');
  } else {
    container.classList.remove('open');
    overlay.classList.remove('active');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
