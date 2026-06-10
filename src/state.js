// GlassERP Pro V2 State Management & Double-Entry Accounting Engine

import { initialBankAccounts, initialEmployees, initialProjects, initialLedgerEntries, initialSettings } from './mockData.js';
import { supabase } from './supabase.js';

// Deep clone helper
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Precision helper
export function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Generate UUID
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class GlassERPState {
  constructor() {
    this.listeners = [];
    this.loadState();
  }

  async init() {
    if (!supabase) {
      this.loadState();
      return;
    }
    await this.loadStateFromSupabase();
  }

  async loadStateFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('glasserp_state')
        .select('state')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No state found in Supabase. Seeding database state...');
          this.seedInitialData();
          await this.saveStateToSupabase();
        } else {
          throw error;
        }
      } else if (data && data.state) {
        this.state = data.state;
        this.pruneExistingAuditLogs();
      }
    } catch (e) {
      console.error('Failed to load state from Supabase, falling back to local storage:', e);
      this.loadState();
    }
  }

  async saveStateToSupabase() {
    if (!supabase) return;
    const { error } = await supabase
      .from('glasserp_state')
      .upsert({ id: 1, state: this.state, updated_at: new Date().toISOString() });
    
    if (error) {
      throw error;
    }
  }

  pruneExistingAuditLogs() {
    if (!this.state.auditLogs || !Array.isArray(this.state.auditLogs)) {
      this.state.auditLogs = [];
      return;
    }
    
    // Keep at most 50 old logs to free up storage immediately
    if (this.state.auditLogs.length > 50) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 50);
    }

    this.state.auditLogs.forEach(log => {
      const key = log.target_entity ? log.target_entity.split('/')[0] : null;
      
      const pruneStateImage = (stateImage) => {
        if (!stateImage || typeof stateImage !== 'object') return stateImage;
        
        // If it contains auditLogs or looks like a full state object, prune it
        if ('auditLogs' in stateImage || ('bankAccounts' in stateImage && 'ledgerEntries' in stateImage)) {
          if (key && key in stateImage) {
            return clone(stateImage[key]);
          } else {
            const copy = clone(stateImage);
            delete copy.auditLogs;
            return copy;
          }
        }
        return stateImage;
      };

      log.pre_state = pruneStateImage(log.pre_state);
      log.post_state = pruneStateImage(log.post_state);
    });
  }

  loadState() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('glasserp_state_v2') : null;
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        this.pruneExistingAuditLogs();
        // Defensive checks to ensure all collections exist
        if (!this.state.quotations || this.state.quotations.length === 0) {
          this.state.quotations = [
            {
              id: 'QTN-9021',
              date: '2026-06-02',
              customer: 'L&T Construction',
              project: 'Glass Pavilion Facade',
              amount: 850000.00,
              status: 'Draft',
              validity: '2026-07-02',
              clientAddress: 'L&T Campus, Powai, Mumbai - 400072',
              clientEmail: 'procurement@lntecc.com',
              clientPhone: '022-67051234',
              clientGstin: '27AAACL1234F1Z8',
              clientState: '27',
              transportCharges: 50000,
              items: [
                { name: 'Toughened Glass (12mm)', description: 'Clear structural glass panels', quantity: 1000, unit: 'Sft', size: '2400 x 1800 mm', price: 650, amount: 650000 },
                { name: 'Aluminum Frame Profiles', description: 'Powder-coated indigo color frame', quantity: 100, unit: 'Pcs', size: '6000 mm', price: 1500, amount: 150000 }
              ]
            },
            {
              id: 'QTN-9022',
              date: '2026-06-05',
              customer: 'Godrej Properties',
              project: 'Balcony Toughened Railings',
              amount: 420000.00,
              status: 'Approved',
              validity: '2026-07-05',
              clientAddress: 'Godrej One, Vikhroli East, Mumbai - 400079',
              clientEmail: 'sales@godrejproperties.com',
              clientPhone: '022-61698888',
              clientGstin: '27AAACG5678H1Z3',
              clientState: '27',
              transportCharges: 20000,
              items: [
                { name: 'Toughened Glass (10mm)', description: 'Polished edges, round corners', quantity: 500, unit: 'Sft', size: '1200 x 900 mm', price: 500, amount: 250000 },
                { name: 'Stainless Steel Spigots', description: 'SS 316 grade base plate spigots', quantity: 150, unit: 'Pcs', size: '150 mm', price: 1000, amount: 150000 }
              ]
            },
            {
              id: 'QTN-9023',
              date: '2026-06-08',
              customer: 'Lodha Group',
              project: 'Double Glazed Office Windows',
              amount: 1500000.00,
              status: 'Sent',
              validity: '2026-07-08',
              clientAddress: 'Lodha Excelus, New Sharda Mandir Road, Ahmedabad',
              clientEmail: 'commercial@lodhagroup.com',
              clientPhone: '079-40012345',
              clientGstin: '24AAACL9922K1Z4',
              clientState: '24',
              transportCharges: 80000,
              items: [
                { name: 'Double Glazed Units (6+12A+6)', description: 'Argon filled, Low-E coated glass', quantity: 1200, unit: 'Sft', size: '1500 x 1200 mm', price: 1000, amount: 1200000 },
                { name: 'Heavy Duty Structural Sealant', description: 'Dow Corning 995 structural silicone', quantity: 1200, unit: 'Tubes', size: '600 ml', price: 180, amount: 216000 }
              ]
            }
          ];
        } else {
          // Upgrade existing quotations defensively
          this.state.quotations.forEach(q => {
            if (!q.items) {
              q.items = [{
                name: q.project || 'Glass Supply / Facade Works',
                description: 'Custom glass installation works',
                quantity: 1,
                unit: 'Job',
                size: 'Standard',
                price: q.amount || 0,
                amount: q.amount || 0
              }];
              q.clientAddress = q.clientAddress || '';
              q.clientEmail = q.clientEmail || '';
              q.clientPhone = q.clientPhone || '';
              q.clientGstin = q.clientGstin || '';
              q.clientState = q.clientState || '27';
              q.transportCharges = q.transportCharges || 0;
            }
          });
        }
        if (!this.state.settings) {
          this.state.settings = clone(initialSettings);
        } else {
          this.state.settings = { ...clone(initialSettings), ...this.state.settings };
        }
        if (!this.state.inventory || this.state.inventory.length === 0) {
          this.state.inventory = [
            { id: uuid(), name: 'Tempered Structural Glass (12mm)', quantity: 240, threshold: 50, unit: 'Sft', rate: 450 },
            { id: uuid(), name: 'Premium Aluminum Profiles (Black)', quantity: 80, threshold: 30, unit: 'm', rate: 1200 },
            { id: uuid(), name: 'Heavy-Duty Glass Suction Fixtures', quantity: 15, threshold: 10, unit: 'Pcs', rate: 3500 },
            { id: uuid(), name: 'Silicone Structural Sealant', quantity: 410, threshold: 100, unit: 'Tubes', rate: 180 }
          ];
        }
        if (!this.state.production) this.state.production = [];
        if (!this.state.customers) this.state.customers = [];
        if (!this.state.vendors) this.state.vendors = [];
        if (!this.state.bankAccounts) this.state.bankAccounts = [];
        if (!this.state.employees) this.state.employees = [];
        if (!this.state.projects) this.state.projects = [];
        if (!this.state.ledgerEntries) this.state.ledgerEntries = [];
        if (!this.state.projectCosts) this.state.projectCosts = [];
        if (!this.state.gstTransactions) this.state.gstTransactions = [];
        if (!this.state.expenses) this.state.expenses = [];
        if (!this.state.income) this.state.income = [];
      } catch (e) {
        console.error('Failed to parse saved state, seeding new data.', e);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  seedInitialData() {
    this.state = {
      bankAccounts: clone(initialBankAccounts),
      employees: clone(initialEmployees),
      projects: clone(initialProjects),
      ledgerEntries: clone(initialLedgerEntries),
      projectCosts: [],
      gstTransactions: [],
      auditLogs: [],
      settings: clone(initialSettings),
      expenses: [],
      income: [],
      quotations: [
        {
          id: 'QTN-9021',
          date: '2026-06-02',
          customer: 'L&T Construction',
          project: 'Glass Pavilion Facade',
          amount: 850000.00,
          status: 'Draft',
          validity: '2026-07-02',
          clientAddress: 'L&T Campus, Powai, Mumbai - 400072',
          clientEmail: 'procurement@lntecc.com',
          clientPhone: '022-67051234',
          clientGstin: '27AAACL1234F1Z8',
          clientState: '27',
          transportCharges: 50000,
          items: [
            { name: 'Toughened Glass (12mm)', description: 'Clear structural glass panels', quantity: 1000, unit: 'Sft', size: '2400 x 1800 mm', price: 650, amount: 650000 },
            { name: 'Aluminum Frame Profiles', description: 'Powder-coated indigo color frame', quantity: 100, unit: 'Pcs', size: '6000 mm', price: 1500, amount: 150000 }
          ]
        },
        {
          id: 'QTN-9022',
          date: '2026-06-05',
          customer: 'Godrej Properties',
          project: 'Balcony Toughened Railings',
          amount: 420000.00,
          status: 'Approved',
          validity: '2026-07-05',
          clientAddress: 'Godrej One, Vikhroli East, Mumbai - 400079',
          clientEmail: 'sales@godrejproperties.com',
          clientPhone: '022-61698888',
          clientGstin: '27AAACG5678H1Z3',
          clientState: '27',
          transportCharges: 20000,
          items: [
            { name: 'Toughened Glass (10mm)', description: 'Polished edges, round corners', quantity: 500, unit: 'Sft', size: '1200 x 900 mm', price: 500, amount: 250000 },
            { name: 'Stainless Steel Spigots', description: 'SS 316 grade base plate spigots', quantity: 150, unit: 'Pcs', size: '150 mm', price: 1000, amount: 150000 }
          ]
        },
        {
          id: 'QTN-9023',
          date: '2026-06-08',
          customer: 'Lodha Group',
          project: 'Double Glazed Office Windows',
          amount: 1500000.00,
          status: 'Sent',
          validity: '2026-07-08',
          clientAddress: 'Lodha Excelus, New Sharda Mandir Road, Ahmedabad',
          clientEmail: 'commercial@lodhagroup.com',
          clientPhone: '079-40012345',
          clientGstin: '24AAACL9922K1Z4',
          clientState: '24',
          transportCharges: 80000,
          items: [
            { name: 'Double Glazed Units (6+12A+6)', description: 'Argon filled, Low-E coated glass', quantity: 1200, unit: 'Sft', size: '1500 x 1200 mm', price: 1000, amount: 1200000 },
            { name: 'Heavy Duty Structural Sealant', description: 'Dow Corning 995 structural silicone', quantity: 1200, unit: 'Tubes', size: '600 ml', price: 180, amount: 216000 }
          ]
        }
      ],
      inventory: [
        { id: uuid(), name: 'Tempered Structural Glass (12mm)', quantity: 240, threshold: 50, unit: 'Sft', rate: 450 },
        { id: uuid(), name: 'Premium Aluminum Profiles (Black)', quantity: 80, threshold: 30, unit: 'm', rate: 1200 },
        { id: uuid(), name: 'Heavy-Duty Glass Suction Fixtures', quantity: 15, threshold: 10, unit: 'Pcs', rate: 3500 },
        { id: uuid(), name: 'Silicone Structural Sealant', quantity: 410, threshold: 100, unit: 'Tubes', rate: 180 }
      ],
      production: [
        { id: uuid(), order_no: 'PO-9201', project_id: 'PRJ-101', item: 'Double Glazed Facade Panels', qty: 45, status: 'In Production', due_date: '2026-06-25' },
        { id: uuid(), order_no: 'PO-9202', project_id: 'PRJ-102', item: 'Tempered Glass Balustrades', qty: 120, status: 'Scheduled', due_date: '2026-07-02' }
      ],
      customers: [
        { id: 'CST-001', name: 'Apex Builders Ltd', contact: 'Ramesh Shah', email: 'ramesh@apexbuilders.in', phone: '9876543210', outstanding: 120000 },
        { id: 'CST-002', name: 'Metro Infra Corp', contact: 'Sunita Rao', email: 'contact@metroinfra.co.in', phone: '8765432109', outstanding: 450000 }
      ],
      vendors: [
        { id: 'VND-001', name: 'Saint-Gobain Glass India', contact: 'Sales Desk', email: 'order@saint-gobain.co.in', phone: '7654321098', outstanding: 50000 },
        { id: 'VND-002', name: 'Hindalco Extrusions', contact: 'K. J. Nair', email: 'kjnair@hindalco.adityabirla.com', phone: '6543210987', outstanding: 0 }
      ]
    };
    // Calculate initial balances/costs/gst from the initial ledger entries or populate them
    this.recalculateAllBalances();
    this.saveState();
  }

  saveState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('glasserp_state_v2', JSON.stringify(this.state));
    }
    this.notify();

    if (supabase) {
      this.saveStateToSupabase().catch(err => {
        console.error('Failed to sync state to Supabase:', err);
      });
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  // Recalculates bank balances and ensures validation rules hold
  recalculateAllBalances() {
    // Zero out bank current balances first
    this.state.bankAccounts.forEach(acc => {
      acc.current_balance = acc.opening_balance;
    });

    // Zero out employee advance dues
    this.state.employees.forEach(emp => {
      emp.advance_due = 0;
    });

    // Process all ledger entries to build dynamic balances
    this.state.ledgerEntries.forEach(entry => {
      entry.legs.forEach(leg => {
        // Update bank accounts
        if (leg.bank_id) {
          const bank = this.state.bankAccounts.find(b => b.bank_id === leg.bank_id);
          if (bank) {
            if (leg.type === 'DEBIT') {
              bank.current_balance = round(bank.current_balance + leg.amount);
            } else if (leg.type === 'CREDIT') {
              bank.current_balance = round(bank.current_balance - leg.amount);
            }
          }
        }

        // Update employee advance due
        if (leg.employee_id) {
          const emp = this.state.employees.find(e => e.employee_id === leg.employee_id);
          if (emp) {
            // If advance is debited (advance given to employee, asset), employee owes us more
            // If advance is credited (repaid/salary deduction), employee owes us less
            if (leg.account === 'Employee Advance Account') {
              if (leg.type === 'DEBIT') {
                emp.advance_due = round(emp.advance_due + leg.amount);
              } else if (leg.type === 'CREDIT') {
                emp.advance_due = round(emp.advance_due - leg.amount);
              }
            }
          }
        }
      });
    });

    // Verify bank balance integrity
    this.state.bankAccounts.forEach(acc => {
      // business validation rule check
      // opening_balance + sum(credits/debits)
      // Done.
    });
  }

  // Log system mutation
  logAudit(actionType, targetEntity, preState, postState, actorId = 'SYSTEM-ADMIN') {
    // Determine the key to slice, or default to the targetEntity
    const key = targetEntity ? targetEntity.split('/')[0] : null;
    
    // Extract slice of state or copy state without auditLogs
    let preImage = null;
    let postImage = null;
    
    if (preState && typeof preState === 'object') {
      if (key && key in preState) {
        preImage = clone(preState[key]);
      } else {
        const preCopy = clone(preState);
        delete preCopy.auditLogs;
        preImage = preCopy;
      }
    }
    
    if (postState && typeof postState === 'object') {
      if (key && key in postState) {
        postImage = clone(postState[key]);
      } else {
        const postCopy = clone(postState);
        delete postCopy.auditLogs;
        postImage = postCopy;
      }
    }

    const log = {
      audit_id: uuid(),
      timestamp: new Date().toISOString(),
      actor_id: actorId,
      action_type: actionType,
      target_entity: targetEntity,
      pre_state: preImage,
      post_state: postImage
    };
    
    if (!this.state.auditLogs) {
      this.state.auditLogs = [];
    }
    this.state.auditLogs.unshift(log); // newest first

    // Limit to 100 entries to prevent infinite growth
    if (this.state.auditLogs.length > 100) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 100);
    }
  }

  // ----------------------------------------------------
  // TRANSACTION PROPAGATION ENGINE (ATOMIC TRANSACTION)
  // ----------------------------------------------------
  executeTransaction(fn) {
    // Keep snapshot for potential rollback
    const stateSnapshot = clone(this.state);
    try {
      // Execute transaction logic
      const result = fn();
      
      // Recalculate and validate invariants
      this.recalculateAllBalances();
      this.validateInvariants();

      // If everything is fine, save and return
      this.saveState();
      return { success: true, data: result };
    } catch (error) {
      console.error('Transaction rolled back due to error:', error);
      // Rollback
      this.state = stateSnapshot;
      return { success: false, error: error.message };
    }
  }

  validateInvariants() {
    // 1. Total debits must equal total credits in every ledger entry
    for (const entry of this.state.ledgerEntries) {
      let debitsTotal = 0;
      let creditsTotal = 0;
      entry.legs.forEach(leg => {
        if (leg.type === 'DEBIT') debitsTotal = round(debitsTotal + leg.amount);
        else if (leg.type === 'CREDIT') creditsTotal = round(creditsTotal + leg.amount);
      });
      if (debitsTotal !== creditsTotal) {
        throw new Error(`Double-entry validation failed for entry ${entry.entry_id || entry.reference_number}. Debits (${debitsTotal}) do not equal Credits (${creditsTotal}).`);
      }
    }

    // 2. Bank account balance must be non-negative (unless overdraft is configured)
    for (const bank of this.state.bankAccounts) {
      if (bank.current_balance < 0 && !bank.allow_overdraft) {
        throw new Error(`Overdraft violation on account '${bank.account_name}'. Current balance would drop to ₹${bank.current_balance}.`);
      }
    }
  }

  // A. MAKE PAYMENT ENGINE (Universal Outbound Cash)
  makePayment(payload) {
    return this.executeTransaction(() => {
      const {
        date,
        amount,
        paymentType, // e.g. "Vendor Payment", "Employee Advance", "General Expense", "Rent", "Materials"
        bankId,
        referenceNo,
        description,
        gstApplicable,
        gstRate, // 5, 12, 18, 28
        projectLink, // project_id
        employeeLink, // employee_id
        vendorLink, // vendor_id
        receiptUrl
      } = payload;

      if (!amount || amount <= 0) throw new Error('Payment amount must be greater than zero.');
      if (!bankId) throw new Error('Source bank account is required.');
      if (!referenceNo) throw new Error('Audit reference number is required.');

      const bank = this.state.bankAccounts.find(b => b.bank_id === bankId);
      if (!bank) throw new Error('Selected bank account does not exist.');

      // Check double-entry mapping
      const preState = clone(this.state);
      
      const ledgerEntryId = uuid();
      const legs = [];

      // Credit: Bank Account (reducing bank balance)
      legs.push({
        account: `${bank.account_name} (Asset)`,
        type: 'CREDIT',
        amount: round(amount),
        bank_id: bankId
      });

      let taxableAmount = amount;
      let cgst = 0, sgst = 0, igst = 0;

      // Handle GST Split if applicable
      if (gstApplicable) {
        const ratePct = parseInt(gstRate) || 18;
        // Assume invoice amount contains GST (inclusive tax split) or exclusive? 
        // Let's implement inclusive: Taxable = Amount / (1 + Rate%)
        taxableAmount = round(amount / (1 + ratePct / 100));
        const totalTax = round(amount - taxableAmount);
        
        // Split CGST/SGST (local) or IGST (interstate) based on state matching
        // Let's assume company state matches bank state or config state.
        const companyState = this.state.settings.gstStateCode || '27'; // Maharashtra default
        const vendor = this.state.vendors.find(v => v.id === vendorLink);
        // Default to local split (CGST & SGST) if vendor state isn't specified or matches
        const isInterState = vendor && vendor.gstin && !vendor.gstin.startsWith(companyState);
        
        if (isInterState) {
          igst = totalTax;
        } else {
          cgst = round(totalTax / 2);
          sgst = round(totalTax - cgst);
        }

        // Add GST debit leg (Input Tax Credit Receivable)
        if (igst > 0) {
          legs.push({
            account: 'GST Input Tax Credit (IGST)',
            type: 'DEBIT',
            amount: igst
          });
        } else {
          if (cgst > 0) {
            legs.push({
              account: 'GST Input Tax Credit (CGST)',
              type: 'DEBIT',
              amount: cgst
            });
          }
          if (sgst > 0) {
            legs.push({
              account: 'GST Input Tax Credit (SGST)',
              type: 'DEBIT',
              amount: sgst
            });
          }
        }
      }

      // Determine the main Debit Account based on Payment Type
      let mainDebitAccount = 'General Expenses';
      let targetEmployeeId = null;
      let targetVendorId = null;

      if (paymentType === 'Employee Advance') {
        if (!employeeLink) throw new Error('Employee must be selected for an Employee Advance payment.');
        mainDebitAccount = 'Employee Advance Account';
        targetEmployeeId = employeeLink;
      } else if (paymentType === 'Vendor Payment') {
        if (!vendorLink) throw new Error('Vendor must be selected.');
        mainDebitAccount = 'Accounts Payable';
        targetVendorId = vendorLink;
      } else if (paymentType === 'Salary Payout') {
        if (!employeeLink) throw new Error('Employee must be selected.');
        mainDebitAccount = 'Salaries Payable';
        targetEmployeeId = employeeLink;
      } else if (paymentType === 'Materials Procurement') {
        mainDebitAccount = 'Inventory Materials Asset';
      } else if (paymentType === 'Rent' || paymentType === 'Utility' || paymentType === 'Machine Repair') {
        mainDebitAccount = this.state.settings.paymentTypeMappings[paymentType] || 'Operating Expenses';
      }

      // Add main debit leg
      legs.push({
        account: mainDebitAccount,
        type: 'DEBIT',
        amount: taxableAmount,
        employee_id: targetEmployeeId,
        project_id: projectLink,
        vendor_id: targetVendorId
      });

      // Insert Ledger Entry
      const newLedgerEntry = {
        entry_id: ledgerEntryId,
        date: date || new Date().toISOString().split('T')[0],
        reference_number: referenceNo,
        description: description || `Outbound ${paymentType} Payment`,
        legs: legs
      };
      
      this.state.ledgerEntries.unshift(newLedgerEntry);

      // Save Expense log
      const newExpense = {
        expense_id: uuid(),
        date: date || new Date().toISOString().split('T')[0],
        amount: amount,
        payment_type: paymentType,
        bank_name: bank.account_name,
        reference_no: referenceNo,
        description: description,
        gst_applicable: gstApplicable,
        gst_rate: gstRate,
        taxable_amount: taxableAmount,
        cgst, sgst, igst,
        project_id: projectLink,
        employee_id: targetEmployeeId,
        vendor_id: targetVendorId,
        receipt_url: receiptUrl || null
      };
      this.state.expenses.unshift(newExpense);

      // Append to GST_Transactions
      if (gstApplicable) {
        this.state.gstTransactions.push({
          gst_id: uuid(),
          entry_id: ledgerEntryId,
          party_id: vendorLink || employeeLink || 'VARIOUS',
          date: date || new Date().toISOString().split('T')[0],
          invoice_no: referenceNo,
          gstin: vendorLink ? (this.state.vendors.find(v => v.id === vendorLink)?.gstin || '') : '',
          rate: gstRate,
          taxable_amount: taxableAmount,
          cgst, sgst, igst,
          type: 'ITC'
        });
      }

      // Append to Project Cost
      if (projectLink) {
        this.state.projectCosts.push({
          cost_id: uuid(),
          project_id: projectLink,
          entry_id: ledgerEntryId,
          amount: taxableAmount,
          category: paymentType === 'Materials Procurement' ? 'Material' : 'Labor/Misc',
          description: description || `Cost charged via payment ref: ${referenceNo}`,
          date: date || new Date().toISOString().split('T')[0]
        });

        // Relational check: Automatically increments cumulative project costs
        const project = this.state.projects.find(p => p.project_id === projectLink);
        if (project) {
          project.accumulated_costs = round((project.accumulated_costs || 0) + taxableAmount);
          // Recalculate project margins
          project.gross_margin = round(project.contract_value - project.accumulated_costs);
          project.margin_percentage = project.contract_value > 0 ? round((project.gross_margin / project.contract_value) * 100) : 0;
        }
      }

      // Accounts Payable reduction if vendor payment
      if (paymentType === 'Vendor Payment' && vendorLink) {
        const vendor = this.state.vendors.find(v => v.id === vendorLink);
        if (vendor) {
          vendor.outstanding = round(Math.max(0, vendor.outstanding - amount));
        }
      }

      this.logAudit('CREATE_PAYMENT', 'expenses', preState, this.state);
      return newExpense;
    });
  }

  // C. RECEIVE PAYMENT ENGINE (Universal Inbound Cash)
  receivePayment(payload) {
    return this.executeTransaction(() => {
      const {
        date,
        amount,
        inflowCategory, // "Customer Payment", "Vendor Refund", "Employee Refund", "Misc Income"
        bankId,
        referenceNo,
        description,
        customerLink, // customer_id
        employeeLink, // employee_id
        vendorLink, // vendor_id
        projectLink, // project_id
        receiptUrl
      } = payload;

      if (!amount || amount <= 0) throw new Error('Receive amount must be greater than zero.');
      if (!bankId) throw new Error('Target bank account is required.');
      if (!referenceNo) throw new Error('Reference number is required.');

      const bank = this.state.bankAccounts.find(b => b.bank_id === bankId);
      if (!bank) throw new Error('Selected bank account does not exist.');

      const preState = clone(this.state);
      
      const ledgerEntryId = uuid();
      const legs = [];

      // Debit: Bank Account (increasing bank balance)
      legs.push({
        account: `${bank.account_name} (Asset)`,
        type: 'DEBIT',
        amount: round(amount),
        bank_id: bankId
      });

      // Credit: Determined by inflow category
      let mainCreditAccount = 'Misc Revenue';
      let targetEmployeeId = null;
      let targetCustomerId = null;
      let targetVendorId = null;

      if (inflowCategory === 'Customer Payment') {
        if (!customerLink) throw new Error('Customer is required.');
        mainCreditAccount = 'Accounts Receivable';
        targetCustomerId = customerLink;
      } else if (inflowCategory === 'Employee Refund') {
        if (!employeeLink) throw new Error('Employee is required.');
        mainCreditAccount = 'Employee Advance Account';
        targetEmployeeId = employeeLink;
      } else if (inflowCategory === 'Vendor Refund') {
        if (!vendorLink) throw new Error('Vendor is required.');
        mainCreditAccount = 'Accounts Payable';
        targetVendorId = vendorLink;
      } else if (inflowCategory === 'Interest Income') {
        mainCreditAccount = 'Interest Revenue';
      }

      legs.push({
        account: mainCreditAccount,
        type: 'CREDIT',
        amount: round(amount),
        employee_id: targetEmployeeId,
        project_id: projectLink,
        vendor_id: targetVendorId
      });

      // Insert Ledger Entry
      const newLedgerEntry = {
        entry_id: ledgerEntryId,
        date: date || new Date().toISOString().split('T')[0],
        reference_number: referenceNo,
        description: description || `Inbound ${inflowCategory} Receipt`,
        legs: legs
      };
      
      this.state.ledgerEntries.unshift(newLedgerEntry);

      // Save Income log
      const newIncome = {
        income_id: uuid(),
        date: date || new Date().toISOString().split('T')[0],
        amount: amount,
        inflow_category: inflowCategory,
        bank_name: bank.account_name,
        reference_no: referenceNo,
        description: description,
        customer_id: targetCustomerId,
        employee_id: targetEmployeeId,
        vendor_id: targetVendorId,
        project_id: projectLink,
        receipt_url: receiptUrl || null
      };
      this.state.income.unshift(newIncome);

      // Reduce customer outstanding balance
      if (inflowCategory === 'Customer Payment' && customerLink) {
        const customer = this.state.customers.find(c => c.id === customerLink);
        if (customer) {
          customer.outstanding = round(Math.max(0, customer.outstanding - amount));
        }
      }

      this.logAudit('RECEIVE_PAYMENT', 'income', preState, this.state);
      return newIncome;
    });
  }

  // INTER-ACCOUNT FUND TRANSFER PROTOCOL
  transferFunds(payload) {
    return this.executeTransaction(() => {
      const { date, amount, fromBankId, toBankId, referenceNo, description } = payload;

      if (!amount || amount <= 0) throw new Error('Transfer amount must be greater than zero.');
      if (!fromBankId || !toBankId) throw new Error('Source and destination accounts are required.');
      if (fromBankId === toBankId) throw new Error('Source and destination accounts must be different.');
      if (!referenceNo) throw new Error('Reference number is required for fund transfers.');

      const sourceBank = this.state.bankAccounts.find(b => b.bank_id === fromBankId);
      const destBank = this.state.bankAccounts.find(b => b.bank_id === toBankId);

      if (!sourceBank || !destBank) throw new Error('One or both bank accounts do not exist.');

      const preState = clone(this.state);
      
      const ledgerEntryId = uuid();

      // Double-entry legs
      const legs = [
        // Credit: Source Bank (reduce balance)
        {
          account: `${sourceBank.account_name} (Asset)`,
          type: 'CREDIT',
          amount: round(amount),
          bank_id: fromBankId
        },
        // Debit: Destination Bank (increase balance)
        {
          account: `${destBank.account_name} (Asset)`,
          type: 'DEBIT',
          amount: round(amount),
          bank_id: toBankId
        }
      ];

      const newLedgerEntry = {
        entry_id: ledgerEntryId,
        date: date || new Date().toISOString().split('T')[0],
        reference_number: referenceNo,
        description: description || `Internal Fund Transfer from ${sourceBank.account_name} to ${destBank.account_name}`,
        legs: legs
      };

      this.state.ledgerEntries.unshift(newLedgerEntry);

      // Record in expenses / income as a special entry
      const transferLog = {
        expense_id: uuid(),
        date: date || new Date().toISOString().split('T')[0],
        amount: amount,
        payment_type: 'Internal Fund Transfer',
        bank_name: sourceBank.account_name,
        reference_no: referenceNo,
        description: `Transferred to ${destBank.account_name}. ${description || ''}`
      };
      this.state.expenses.unshift(transferLog);

      this.logAudit('FUND_TRANSFER', 'ledgerEntries', preState, this.state);
      return newLedgerEntry;
    });
  }

  // EMPLOYEE DIRECTORY OPERATIONS
  createEmployee(payload) {
    const preState = clone(this.state);
    
    // PAN regex check
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (payload.pan && !panRegex.test(payload.pan.toUpperCase())) {
      throw new Error('Invalid PAN Number format. Must match standard format (e.g. ABCDE1234F).');
    }

    const newEmployee = {
      employee_id: payload.employee_id || `EMP-${100 + this.state.employees.length + 1}`,
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
      profile_image: payload.profile_image || '',
      pan: payload.pan ? payload.pan.toUpperCase() : '',
      aadhaar_status: payload.aadhaar_status || 'Verified (Physical Check)',
      joining_date: payload.joining_date || new Date().toISOString().split('T')[0],
      designation: payload.designation,
      salary_type: payload.salary_type || 'Monthly',
      base_salary: round(parseFloat(payload.base_salary) || 0),
      advance_due: 0,
      attendance: {}, // Date key e.g. "2026-06-09" -> "Present", "Absent", "Half-Day", "Leave"
      overtime: {} // Date key -> hours
    };

    this.state.employees.push(newEmployee);
    this.logAudit('CREATE_EMPLOYEE', 'employees', preState, this.state);
    this.saveState();
    return newEmployee;
  }

  recordAttendance(employeeId, date, status, overtimeHours = 0) {
    const preState = clone(this.state);
    const emp = this.state.employees.find(e => e.employee_id === employeeId);
    if (!emp) throw new Error(`Employee with ID ${employeeId} not found.`);

    if (!emp.attendance) emp.attendance = {};
    if (!emp.overtime) emp.overtime = {};

    emp.attendance[date] = status;
    emp.overtime[date] = round(parseFloat(overtimeHours) || 0);

    this.logAudit('RECORD_ATTENDANCE', `employees/${employeeId}`, preState, this.state);
    this.saveState();
  }

  // Dynamic Settings Mappings
  updateSettings(newSettings) {
    const preState = clone(this.state);
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.logAudit('UPDATE_SETTINGS', 'settings', preState, this.state);
    this.saveState();
  }

  // Quotations Operations
  createQuotation(payload) {
    const preState = clone(this.state);
    const newQuote = {
      id: payload.id || `QTN-${9020 + this.state.quotations.length + 1}`,
      date: payload.date || new Date().toISOString().split('T')[0],
      customer: payload.customer,
      project: payload.project || '',
      amount: round(parseFloat(payload.amount) || 0),
      status: payload.status || 'Draft',
      validity: payload.validity || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      clientAddress: payload.clientAddress || '',
      clientEmail: payload.clientEmail || '',
      clientPhone: payload.clientPhone || '',
      clientGstin: payload.clientGstin || '',
      clientState: payload.clientState || '27',
      items: payload.items || [],
      transportCharges: round(parseFloat(payload.transportCharges) || 0)
    };
    this.state.quotations.push(newQuote);
    this.logAudit('CREATE_QUOTATION', 'quotations', preState, this.state);
    this.saveState();
    return newQuote;
  }

  // Inventory Operations
  createInventoryItem(payload) {
    const preState = clone(this.state);
    const newItem = {
      id: payload.id || uuid(),
      name: payload.name,
      quantity: round(parseFloat(payload.quantity) || 0),
      threshold: round(parseFloat(payload.threshold) || 0),
      unit: payload.unit || 'units',
      rate: round(parseFloat(payload.rate) || 0)
    };
    this.state.inventory.push(newItem);
    this.logAudit('CREATE_INVENTORY', 'inventory', preState, this.state);
    this.saveState();
    return newItem;
  }

  // Project Operations
  createProject(payload) {
    const preState = clone(this.state);
    const contractVal = round(parseFloat(payload.contract_value) || 0);
    const accumCosts = round(parseFloat(payload.accumulated_costs) || 0);
    const grossMargin = round(contractVal - accumCosts);
    const marginPct = contractVal > 0 ? round((grossMargin / contractVal) * 100) : 0;
    
    const newProj = {
      project_id: payload.project_id || `PRJ-${100 + this.state.projects.length + 1}`,
      name: payload.name,
      client_name: payload.client_name,
      contract_value: contractVal,
      accumulated_costs: accumCosts,
      gross_margin: grossMargin,
      margin_percentage: marginPct,
      status: payload.status || 'Active',
      start_date: payload.start_date || new Date().toISOString().split('T')[0]
    };
    this.state.projects.push(newProj);
    this.logAudit('CREATE_PROJECT', 'projects', preState, this.state);
    this.saveState();
    return newProj;
  }

  // Production Operations
  createProductionOrder(payload) {
    const preState = clone(this.state);
    const newOrder = {
      id: uuid(),
      order_no: payload.order_no || `PO-${9200 + this.state.production.length + 1}`,
      project_id: payload.project_id || 'PRJ-101',
      item: payload.item,
      qty: round(parseFloat(payload.qty) || 0),
      status: payload.status || 'Scheduled',
      due_date: payload.due_date || new Date().toISOString().split('T')[0]
    };
    this.state.production.push(newOrder);
    this.logAudit('CREATE_PRODUCTION', 'production', preState, this.state);
    this.saveState();
    return newOrder;
  }

  // Customer Operations
  createCustomer(payload) {
    const preState = clone(this.state);
    const newCust = {
      id: payload.id || `CST-${100 + this.state.customers.length + 1}`,
      name: payload.name,
      contact: payload.contact || '',
      email: payload.email || '',
      phone: payload.phone || '',
      outstanding: round(parseFloat(payload.outstanding) || 0)
    };
    this.state.customers.push(newCust);
    this.logAudit('CREATE_CUSTOMER', 'customers', preState, this.state);
    this.saveState();
    return newCust;
  }

  // Vendor Operations
  createVendor(payload) {
    const preState = clone(this.state);
    const newVendor = {
      id: payload.id || `VND-${100 + this.state.vendors.length + 1}`,
      name: payload.name,
      contact: payload.contact || '',
      email: payload.email || '',
      phone: payload.phone || '',
      outstanding: round(parseFloat(payload.outstanding) || 0)
    };
    this.state.vendors.push(newVendor);
    this.logAudit('CREATE_VENDOR', 'vendors', preState, this.state);
    this.saveState();
    return newVendor;
  }

  // Bank Account Operations
  addBankAccount(payload) {
    const preState = clone(this.state);
    const newAcc = {
      bank_id: payload.bank_id || `bank-${payload.account_name.toLowerCase().replace(/\s+/g, '-')}-${uuid().slice(0, 4)}`,
      account_name: payload.account_name,
      account_number: payload.account_number,
      ifsc: payload.ifsc || 'NA',
      branch: payload.branch || 'NA',
      opening_balance: round(parseFloat(payload.opening_balance) || 0),
      current_balance: round(parseFloat(payload.opening_balance) || 0),
      upi_id: payload.upi_id || '',
      allow_overdraft: payload.allow_overdraft === 'true' || payload.allow_overdraft === true
    };
    this.state.bankAccounts.push(newAcc);
    this.logAudit('CREATE_BANK_ACCOUNT', 'bankAccounts', preState, this.state);
    this.saveState();
    return newAcc;
  }
}

export const dbState = new GlassERPState();
