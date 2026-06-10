// GlassERP Pro V2 Generic High-Fidelity Table Component

export class GlassTable {
  constructor(options) {
    this.container = options.container;
    this.headers = options.headers; // Array of { key, label, visible: true, render: fn }
    this.data = options.data || [];
    this.onRowClick = options.onRowClick || null;
    this.onBulkAction = options.onBulkAction || null;
    this.onImportCSV = options.onImportCSV || null;
    this.onDeleteSelected = options.onDeleteSelected || null;
    
    // Pagination & Search States
    this.pageSize = options.pageSize || 25;
    this.currentPage = 1;
    this.searchQuery = '';
    this.selectedRows = new Set();
    this.sortKey = '';
    this.sortOrder = 'asc'; // 'asc' or 'desc'
    this.filterCallback = options.filterCallback || null; // function to filter row data
    this.activeFilters = {};

    this.init();
  }

  init() {
    this.renderLayout();
    this.update();
    this.updateBulkDeleteButton();
  }

  setData(newData) {
    this.data = newData;
    this.selectedRows.clear();
    this.currentPage = 1;
    this.update();
    this.updateBulkDeleteButton();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="table-controls-bar" style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
        <!-- Left: Search & Filter -->
        <div style="display: flex; gap: 10px; align-items: center; flex: 1; min-width: 250px;">
          <input type="text" class="form-control table-search" placeholder="Search rows..." style="flex: 1; max-width: 320px;">
          <div class="dropdown-filter-container" style="position: relative;">
            <!-- Custom filters injected here if needed -->
          </div>
        </div>

        <!-- Right: Actions & Column Visibility -->
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary btn-delete-selected" style="display: none; background: var(--credit-bg); color: var(--credit-color); border: 1px solid rgba(239, 68, 68, 0.2);"><i data-lucide="trash-2"></i> Delete Selected</button>
          <button class="btn btn-secondary btn-export-csv" title="Export as CSV"><i data-lucide="download"></i> Export CSV</button>
          <button class="btn btn-secondary btn-print" title="Print List"><i data-lucide="printer"></i> Print</button>
          
          <div class="import-csv-container" style="position: relative;">
            <label class="btn btn-secondary" style="cursor: pointer; display: inline-flex; margin: 0;">
              <i data-lucide="upload" style="margin-right: 8px;"></i> Import CSV
              <input type="file" class="csv-file-input" accept=".csv" style="display: none;">
            </label>
          </div>

          <div class="col-visibility-dropdown" style="position: relative;">
            <button class="btn btn-secondary btn-col-toggle"><i data-lucide="eye"></i> Columns</button>
            <div class="col-menu glass-panel" style="display: none; position: absolute; right: 0; top: 45px; z-index: 50; min-width: 180px; padding: 12px;">
              <h5 style="margin-bottom: 8px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Toggle Columns</h5>
              <div class="col-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive glass-panel" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr class="table-header-row"></tr>
          </thead>
          <tbody class="table-body"></tbody>
        </table>
      </div>

      <div class="pagination-container">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 0.85rem; color: var(--text-secondary);">Show rows:</span>
          <select class="page-size-selector" style="padding: 4px 8px; font-size: 0.8rem;">
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span class="table-info-text" style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 10px;"></span>
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn btn-prev-page" disabled><i data-lucide="chevron-left"></i></button>
          <span class="pagination-numbers" style="font-size: 0.9rem; font-weight: 600;">Page 1 of 1</span>
          <button class="pagination-btn btn-next-page" disabled><i data-lucide="chevron-right"></i></button>
        </div>
      </div>
    `;

    // Hook listeners
    this.searchEl = this.container.querySelector('.table-search');
    this.searchEl.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.currentPage = 1;
      this.update();
    });

    const pageSizeSelector = this.container.querySelector('.page-size-selector');
    pageSizeSelector.value = this.pageSize;
    pageSizeSelector.addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value);
      this.currentPage = 1;
      this.update();
    });

    this.container.querySelector('.btn-prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.update();
      }
    });

    this.container.querySelector('.btn-next-page').addEventListener('click', () => {
      const filtered = this.getFilteredData();
      const maxPages = Math.ceil(filtered.length / this.pageSize) || 1;
      if (this.currentPage < maxPages) {
        this.currentPage++;
        this.update();
      }
    });

    // Column Toggler dropdown
    const colToggleBtn = this.container.querySelector('.btn-col-toggle');
    const colMenu = this.container.querySelector('.col-menu');
    colToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      colMenu.style.display = colMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      colMenu.style.display = 'none';
    });
    colMenu.addEventListener('click', (e) => e.stopPropagation());

    // Render columns visibility list
    const colList = colMenu.querySelector('.col-list');
    this.headers.forEach((h, index) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.innerHTML = `
        <input type="checkbox" id="col-chk-${index}" ${h.visible !== false ? 'checked' : ''}>
        <label for="col-chk-${index}" style="font-size: 0.85rem; cursor: pointer;">${h.label}</label>
      `;
      const chk = div.querySelector('input');
      chk.addEventListener('change', (e) => {
        h.visible = e.target.checked;
        this.updateHeaders();
        this.update();
      });
      colList.appendChild(div);
    });

    // Export & Print actions
    this.container.querySelector('.btn-export-csv').addEventListener('click', () => this.exportCSV());
    this.container.querySelector('.btn-print').addEventListener('click', () => window.print());

    // Delete Selected action
    const deleteBtn = this.container.querySelector('.btn-delete-selected');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.showConfirmModal(
          'Confirm Permanent Deletion',
          `Are you sure you want to permanently delete the ${this.selectedRows.size} selected items? This action cannot be undone.`,
          () => {
            if (this.onDeleteSelected) {
              this.onDeleteSelected(Array.from(this.selectedRows));
            }
          }
        );
      });
    }

    // CSV Ingest Selector
    const csvFileInput = this.container.querySelector('.csv-file-input');
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.parseAndImportCSV(evt.target.result);
        };
        reader.readAsText(file);
      }
    });

    this.updateHeaders();
  }

  updateHeaders() {
    const tr = this.container.querySelector('.table-header-row');
    tr.innerHTML = `
      <th style="width: 40px; text-align: center;">
        <input type="checkbox" class="bulk-select-header">
      </th>
    `;

    this.headers.forEach(h => {
      if (h.visible !== false) {
        const th = document.createElement('th');
        th.textContent = h.label;
        th.style.position = 'relative';
        th.style.paddingRight = '20px';
        
        // Sorting indicator icon
        if (this.sortKey === h.key) {
          th.innerHTML += ` <span style="font-size: 0.75rem; position: absolute; right: 5px;">${this.sortOrder === 'asc' ? '▲' : '▼'}</span>`;
        }

        th.addEventListener('click', () => {
          if (this.sortKey === h.key) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortKey = h.key;
            this.sortOrder = 'asc';
          }
          this.updateHeaders();
          this.update();
        });

        tr.appendChild(th);
      }
    });

    // Connect bulk select toggle checkbox
    const bulkHeader = tr.querySelector('.bulk-select-header');
    bulkHeader.addEventListener('change', (e) => {
      const pageData = this.getCurrentPageData();
      if (e.target.checked) {
        pageData.forEach(row => this.selectedRows.add(row));
      } else {
        pageData.forEach(row => this.selectedRows.delete(row));
      }
      this.updateRows();
      this.updateBulkDeleteButton();
      if (this.onBulkAction) this.onBulkAction(Array.from(this.selectedRows));
    });
  }

  getFilteredData() {
    let result = [...this.data];

    // 1. Text Search matching
    if (this.searchQuery) {
      result = result.filter(row => {
        return this.headers.some(h => {
          const val = row[h.key];
          return val !== undefined && String(val).toLowerCase().includes(this.searchQuery);
        });
      });
    }

    // 2. Custom logical filters
    if (this.filterCallback) {
      result = result.filter(this.filterCallback);
    }

    // 3. Sorting
    if (this.sortKey) {
      result.sort((a, b) => {
        let valA = a[this.sortKey];
        let valB = b[this.sortKey];

        // Format to string/number check
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }

  getCurrentPageData() {
    const filtered = this.getFilteredData();
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  update() {
    this.updateRows();
    this.updatePagination();
  }

  updateRows() {
    const tbody = this.container.querySelector('.table-body');
    tbody.innerHTML = '';

    const pageData = this.getCurrentPageData();

    if (pageData.length === 0) {
      const visibleColCount = this.headers.filter(h => h.visible !== false).length + 1;
      tbody.innerHTML = `
        <tr>
          <td colspan="${visibleColCount}" style="text-align: center; color: var(--text-muted); padding: 30px;">
            No matching entries found.
          </td>
        </tr>
      `;
      return;
    }

    pageData.forEach((row) => {
      const tr = document.createElement('tr');
      tr.style.cursor = this.onRowClick ? 'pointer' : 'default';
      
      const rowId = row.id || row.entry_id || row.employee_id || row.expense_id || row.income_id || row.project_id;
      
      // Select Checkbox
      const tdSelect = document.createElement('td');
      tdSelect.style.textAlign = 'center';
      tdSelect.innerHTML = `<input type="checkbox" class="row-select-chk" ${this.selectedRows.has(row) ? 'checked' : ''}>`;
      const chk = tdSelect.querySelector('input');
      chk.addEventListener('click', (e) => e.stopPropagation()); // prevent row click triggers
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedRows.add(row);
        } else {
          this.selectedRows.delete(row);
        }
        this.updateBulkDeleteButton();
        if (this.onBulkAction) this.onBulkAction(Array.from(this.selectedRows));
      });
      tr.appendChild(tdSelect);

      // Value Columns
      this.headers.forEach(h => {
        if (h.visible !== false) {
          const td = document.createElement('td');
          if (h.render) {
            td.innerHTML = h.render(row[h.key], row);
          } else {
            td.textContent = row[h.key] !== undefined ? row[h.key] : '';
          }
          tr.appendChild(td);
        }
      });

      if (this.onRowClick) {
        tr.addEventListener('click', () => this.onRowClick(row));
      }

      tbody.appendChild(tr);
    });

    // Re-verify icons via Lucide
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updatePagination() {
    const filtered = this.getFilteredData();
    const totalCount = filtered.length;
    const maxPages = Math.ceil(totalCount / this.pageSize) || 1;

    // Boundary constraints
    if (this.currentPage > maxPages) this.currentPage = maxPages;

    const startIdx = totalCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endIdx = Math.min(this.currentPage * this.pageSize, totalCount);

    // Update text
    const infoText = this.container.querySelector('.table-info-text');
    infoText.textContent = `Showing ${startIdx}-${endIdx} of ${totalCount} records`;

    const paginationNums = this.container.querySelector('.pagination-numbers');
    paginationNums.textContent = `Page ${this.currentPage} of ${maxPages}`;

    // Enable/disable page controls
    this.container.querySelector('.btn-prev-page').disabled = this.currentPage === 1;
    this.container.querySelector('.btn-next-page').disabled = this.currentPage === maxPages;
  }

  exportCSV() {
    const visibleHeaders = this.headers.filter(h => h.visible !== false);
    const csvRows = [];

    // Header labels
    csvRows.push(visibleHeaders.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));

    // Row values
    this.getFilteredData().forEach(row => {
      const values = visibleHeaders.map(h => {
        let val = row[h.key];
        if (val === undefined || val === null) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glasserp-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  splitCSVLine(line) {
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
  }

  parseAndImportCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;

    // Extract headers and map to lower case
    const rawHeaders = this.splitCSVLine(lines[0]).map(h => h.toLowerCase());
    const importedData = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = this.splitCSVLine(lines[i]);
      const row = {};
      
      // Map both column label and key dynamically to the header indices
      this.headers.forEach(h => {
        const labelLower = h.label.toLowerCase();
        const keyLower = h.key.toLowerCase();
        
        const colIndex = rawHeaders.findIndex(hdr => hdr === labelLower || hdr === keyLower);
        if (colIndex !== -1 && colIndex < cells.length) {
          row[h.key] = cells[colIndex];
        }
      });

      // Keep raw values for other keys that might be directly matching
      rawHeaders.forEach((rawHdr, colIdx) => {
        if (colIdx < cells.length && !row[rawHdr]) {
          row[rawHdr] = cells[colIdx];
        }
      });

      importedData.push(row);
    }

    if (this.onImportCSV) {
      this.onImportCSV(importedData);
    }
  }

  updateBulkDeleteButton() {
    const deleteBtn = this.container.querySelector('.btn-delete-selected');
    if (deleteBtn) {
      if (this.onDeleteSelected && this.selectedRows.size > 0) {
        deleteBtn.style.display = 'inline-flex';
      } else {
        deleteBtn.style.display = 'none';
      }
    }
  }

  showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal-content glass-panel" style="max-width: 400px; text-align: center; margin-top: 25vh; border: 1px solid var(--credit-color);">
        <h3 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">${title}</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button type="button" class="btn btn-secondary btn-confirm-cancel">Cancel</button>
          <button type="button" class="btn btn-primary btn-confirm-yes" style="background: var(--credit-color); color: #fff;">Delete Permanently</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.btn-confirm-cancel').addEventListener('click', close);
    modal.querySelector('.btn-confirm-yes').addEventListener('click', () => {
      onConfirm();
      close();
    });
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}
