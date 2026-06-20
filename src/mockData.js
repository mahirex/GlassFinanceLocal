// Initial seed data for GlassERP Pro V2

export const initialBankAccounts = [
  {
    bank_id: 'bank-sbi-current',
    account_name: 'SBI Current Account',
    account_number: '3029104920',
    ifsc: 'SBIN0004512',
    branch: 'BKC Mumbai',
    opening_balance: 0.00,
    current_balance: 0.00,
    upi_id: 'glasserpsbi@okaxis',
    allow_overdraft: false
  },
  {
    bank_id: 'bank-hdfc-active',
    account_name: 'HDFC Active Account',
    account_number: '50100293849102',
    ifsc: 'HDFC0000104',
    branch: 'Nariman Point Mumbai',
    opening_balance: 0.00,
    current_balance: 0.00,
    upi_id: 'glasserphdfc@okhdfc',
    allow_overdraft: false
  },
  {
    bank_id: 'bank-cash-hand',
    account_name: 'Cash In Hand',
    account_number: 'CASH-VAULT-01',
    ifsc: 'NA',
    branch: 'Office Locker',
    opening_balance: 0.00,
    current_balance: 0.00,
    upi_id: '',
    allow_overdraft: false
  }
];

export const initialEmployees = [
  {
    employee_id: 'EMP-101',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@glasserp.in',
    mobile: '9820012345',
    address: 'A-402, Green Meadows, Andheri West, Mumbai',
    profile_image: '',
    pan: 'ABCDE1234F',
    aadhaar_status: 'Verified (Physical Check)',
    joining_date: '2024-03-15',
    designation: 'Senior Structural Engineer',
    salary_type: 'Monthly',
    base_salary: 75000.00,
    advance_due: 0,
    attendance: {
      '2026-06-01': 'Present',
      '2026-06-02': 'Present',
      '2026-06-03': 'Present',
      '2026-06-04': 'Half-Day',
      '2026-06-05': 'Present',
      '2026-06-08': 'Present',
      '2026-06-09': 'Present'
    },
    overtime: {
      '2026-06-01': 2,
      '2026-06-02': 0,
      '2026-06-03': 1.5,
      '2026-06-04': 0,
      '2026-06-05': 0,
      '2026-06-08': 3,
      '2026-06-09': 0
    }
  },
  {
    employee_id: 'EMP-102',
    name: 'Sunita Verma',
    email: 'sunita.verma@glasserp.in',
    mobile: '9819923456',
    address: 'B-12, Sai Kripa Chawl, Dharavi, Mumbai',
    profile_image: '',
    pan: 'XYZAB8765C',
    aadhaar_status: 'Verified (Physical Check)',
    joining_date: '2025-01-10',
    designation: 'Glass Fitting Lead',
    salary_type: 'Weekly',
    base_salary: 15000.00,
    advance_due: 2000.00,
    attendance: {
      '2026-06-01': 'Present',
      '2026-06-02': 'Present',
      '2026-06-03': 'Present',
      '2026-06-04': 'Present',
      '2026-06-05': 'Present',
      '2026-06-08': 'Absent',
      '2026-06-09': 'Present'
    },
    overtime: {}
  },
  {
    employee_id: 'EMP-103',
    name: 'Amit Patel',
    email: 'amit.patel@glasserp.in',
    mobile: '9833345678',
    address: 'Flat 101, Shanti Niketan, Thane West',
    profile_image: '',
    pan: 'KLMNO9911P',
    aadhaar_status: 'Verified (Physical Check)',
    joining_date: '2023-06-01',
    designation: 'Project Director',
    salary_type: 'Monthly',
    base_salary: 120000.00,
    advance_due: 0,
    attendance: {
      '2026-06-01': 'Present',
      '2026-06-02': 'Present',
      '2026-06-03': 'Present',
      '2026-06-04': 'Approved Leave',
      '2026-06-05': 'Approved Leave',
      '2026-06-08': 'Present',
      '2026-06-09': 'Present'
    },
    overtime: {}
  }
];

export const initialProjects = [
  {
    project_id: 'PRJ-101',
    name: 'Double Glazed Glass Facade - Apex Towers',
    client_name: 'Apex Builders Ltd',
    contract_value: 1200000.00,
    accumulated_costs: 75000.00,
    gross_margin: 1125000.00,
    margin_percentage: 93.75,
    status: 'Active',
    start_date: '2026-05-10'
  },
  {
    project_id: 'PRJ-102',
    name: 'Structural Glazing - Metro Office Park',
    client_name: 'Metro Infra Corp',
    contract_value: 2500000.00,
    accumulated_costs: 0.00,
    gross_margin: 2500000.00,
    margin_percentage: 100.00,
    status: 'Active',
    start_date: '2026-06-01'
  }
];

export const initialLedgerEntries = [
  {
    entry_id: 'initial-capital-sbi',
    date: '2026-05-01',
    reference_number: 'OP-BAL-01',
    description: 'Opening Capital Injection - SBI Bank Account',
    legs: [
      {
        account: 'SBI Current Account (Asset)',
        type: 'DEBIT',
        amount: 2000000.00,
        bank_id: 'bank-sbi-current'
      },
      {
        account: 'Shareholders Equity',
        type: 'CREDIT',
        amount: 2000000.00
      }
    ]
  },
  {
    entry_id: 'initial-capital-hdfc',
    date: '2026-05-01',
    reference_number: 'OP-BAL-02',
    description: 'Opening Capital Injection - HDFC Bank Account',
    legs: [
      {
        account: 'HDFC Active Account (Asset)',
        type: 'DEBIT',
        amount: 1500000.00,
        bank_id: 'bank-hdfc-active'
      },
      {
        account: 'Shareholders Equity',
        type: 'CREDIT',
        amount: 1500000.00
      }
    ]
  },
  {
    entry_id: 'initial-cash',
    date: '2026-05-01',
    reference_number: 'OP-BAL-03',
    description: 'Petty Cash Ledger Seeding',
    legs: [
      {
        account: 'Cash In Hand (Asset)',
        type: 'DEBIT',
        amount: 50000.00,
        bank_id: 'bank-cash-hand'
      },
      {
        account: 'Shareholders Equity',
        type: 'CREDIT',
        amount: 50000.00
      }
    ]
  },
  {
    entry_id: 'mock-advance-sunita',
    date: '2026-06-05',
    reference_number: 'TXN-90214',
    description: 'Emergency Medical Request Advance - Sunita Verma',
    legs: [
      {
        account: 'Employee Advance Account',
        type: 'DEBIT',
        amount: 2000.00,
        employee_id: 'EMP-102'
      },
      {
        account: 'SBI Current Account (Asset)',
        type: 'CREDIT',
        amount: 2000.00,
        bank_id: 'bank-sbi-current'
      }
    ]
  }
];

export const initialSettings = {
  companyName: 'Glassology',
  companyAddress: 'A/4, Govindpura Industrial Area, Bhopal, Madhya Pradesh 462023',
  companyPhone: '+91 9826330806',
  companyEmail: 'glassology.bpl@gmail.com',
  companyGstin: '23AARPO9778L1ZM',
  gstin: '23AARPO9778L1ZM',
  gstStateCode: '23',
  defaultGstRate: 18,
  filingFrequency: 'Monthly',
  bankName: 'INDIAN BANK',
  bankAccName: 'GLASSOLOGY',
  bankAccNo: '8102836791',
  bankIfsc: 'IDIB000T609',
  bankBranch: 'Bhopal Branch',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within 15 days.\n3. Subject to Bhopal Jurisdiction.',
  paymentTypeMappings: {
    'Rent': 'Rent Expense Account',
    'Utility': 'Utilities Expense Account',
    'Machine Repair': 'Fixed Asset Maintenance'
  }
};

