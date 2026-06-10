// GlassERP Pro V2 Accounting Core Tests

import { dbState, round } from '../src/state.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('----------------------------------------------------');
console.log('GlassERP Pro V2: Initiating Accounting Core Tests...');
console.log('----------------------------------------------------');

try {
  // Test Case 1: Database Initialization & Seeding Checks
  console.log('Test Case 1: Verifying Seed Data...');
  dbState.seedInitialData();
  const bankAccounts = dbState.state.bankAccounts;
  assert(bankAccounts.length === 3, 'Expected 3 bank accounts');
  const sbiAcc = bankAccounts.find(b => b.bank_id === 'bank-sbi-current');
  assert(sbiAcc.current_balance === 1998000, `Expected SBI balance 1,998,000, got ${sbiAcc.current_balance}`); // 2000000 - 2000 advance
  console.log('✓ Seed data verified successfully.');

  // Test Case 2: Make Outbound Payment with Double-Entry checks
  console.log('\nTest Case 2: Executing Outbound Expense Payment...');
  const initialSbiBal = sbiAcc.current_balance;
  const initialExpensesCount = dbState.state.expenses.length;

  const paymentPayload = {
    date: '2026-06-09',
    amount: 11800.00, // 10000 base + 18% GST (1800 split)
    paymentType: 'Utility',
    bankId: 'bank-sbi-current',
    referenceNo: 'UT-TXN-001',
    description: 'Electricity bill payment',
    gstApplicable: true,
    gstRate: '18',
    projectLink: 'PRJ-101',
    employeeLink: null,
    vendorLink: null
  };

  const paymentResult = dbState.makePayment(paymentPayload);
  assert(paymentResult.success === true, `Payment execution failed: ${paymentResult.error}`);

  // Re-fetch SBI balance
  const postPaymentSbiBal = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-sbi-current').current_balance;
  assert(round(initialSbiBal - postPaymentSbiBal) === 11800, `Expected bank balance drop of 11,800, got difference: ${initialSbiBal - postPaymentSbiBal}`);
  
  // Verify double entry check on the added ledger row
  const newestLedger = dbState.state.ledgerEntries[0];
  let debitSum = 0;
  let creditSum = 0;
  newestLedger.legs.forEach(leg => {
    if (leg.type === 'DEBIT') debitSum = round(debitSum + leg.amount);
    else if (leg.type === 'CREDIT') creditSum = round(creditSum + leg.amount);
  });
  assert(debitSum === creditSum, `Total Debits (${debitSum}) must equal Total Credits (${creditSum})`);
  assert(debitSum === 11800, `Expected total legs balance 11,800, got ${debitSum}`);
  console.log('✓ Outbound payment executed, double-entry balanced.');

  // Test Case 3: Verify Project Cost Integration Updates
  console.log('\nTest Case 3: Verifying Project Cost Increments...');
  const proj = dbState.state.projects.find(p => p.project_id === 'PRJ-101');
  assert(proj.accumulated_costs === 85000, `Expected accumulated costs 85,000 (75k seeded + 10k base), got ${proj.accumulated_costs}`);
  assert(proj.gross_margin === 1115000, `Expected gross margin 1,115,000, got ${proj.gross_margin}`);
  console.log('✓ Real-time project costing margin evaluation verified.');

  // Test Case 4: Transaction Rollback on Overdraft
  console.log('\nTest Case 4: Testing Transaction Rollback on Overdraft...');
  const overdraftPayload = {
    date: '2026-06-09',
    amount: 5000000.00, // exceeds total balance
    paymentType: 'Utility',
    bankId: 'bank-sbi-current',
    referenceNo: 'UT-TXN-OVERDRAFT',
    description: 'Massive bills payment',
    gstApplicable: false,
    projectLink: null
  };

  const previousLedgerLength = dbState.state.ledgerEntries.length;
  const overdraftResult = dbState.makePayment(overdraftPayload);
  
  assert(overdraftResult.success === false, 'Expected overdraft payment to fail');
  assert(overdraftResult.error.includes('Overdraft violation'), `Expected Overdraft error message, got: ${overdraftResult.error}`);
  assert(dbState.state.ledgerEntries.length === previousLedgerLength, 'Ledger changes should have rolled back');
  console.log('✓ Overdraft safety constraint checks triggered rollback successfully.');

  // Test Case 5: Receive Inbound Customer Payment & Outstanding Balance Reduction
  console.log('\nTest Case 5: Executing Customer Payment Inflow...');
  const customer = dbState.state.customers.find(c => c.id === 'CST-001');
  const initialOutstanding = customer.outstanding;
  const initialBankBal = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-hdfc-active').current_balance;

  const receivePayload = {
    date: '2026-06-10',
    amount: 50000.00,
    inflowCategory: 'Customer Payment',
    bankId: 'bank-hdfc-active',
    referenceNo: 'UPI-RCV-001',
    description: 'Milestone 1 invoice payment',
    customerLink: 'CST-001',
    employeeLink: null,
    vendorLink: null,
    projectLink: null
  };

  const receiveResult = dbState.receivePayment(receivePayload);
  assert(receiveResult.success === true, `Inflow execution failed: ${receiveResult.error}`);

  // Re-fetch HDFC balance and outstanding balance
  const postRcvHdfcBal = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-hdfc-active').current_balance;
  assert(round(postRcvHdfcBal - initialBankBal) === 50000, `Expected HDFC balance increase of 50,000, got difference: ${postRcvHdfcBal - initialBankBal}`);
  
  const postRcvOutstanding = dbState.state.customers.find(c => c.id === 'CST-001').outstanding;
  assert(round(initialOutstanding - postRcvOutstanding) === 50000, `Expected outstanding balance drop of 50,000, got: ${initialOutstanding - postRcvOutstanding}`);
  console.log('✓ Inbound customer payment executed, outstanding balance reduced.');

  // Test Case 6: Inter-Account Fund Transfer Verification
  console.log('\nTest Case 6: Executing Inter-Account Fund Transfer...');
  const sbiCurrent = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-sbi-current');
  const hdfcActive = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-hdfc-active');
  const initialSbi = sbiCurrent.current_balance;
  const initialHdfc = hdfcActive.current_balance;

  const transferPayload = {
    date: '2026-06-10',
    amount: 10000.00,
    fromBankId: 'bank-sbi-current',
    toBankId: 'bank-hdfc-active',
    referenceNo: 'FT-001',
    description: 'Internal treasury transfer'
  };

  const transferResult = dbState.transferFunds(transferPayload);
  assert(transferResult.success === true, `Fund transfer failed: ${transferResult.error}`);

  const postSbi = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-sbi-current').current_balance;
  const postHdfc = dbState.state.bankAccounts.find(b => b.bank_id === 'bank-hdfc-active').current_balance;

  assert(round(initialSbi - postSbi) === 10000, `Expected SBI balance to drop by 10,000, got ${initialSbi - postSbi}`);
  assert(round(postHdfc - initialHdfc) === 10000, `Expected HDFC balance to rise by 10,000, got ${postHdfc - initialHdfc}`);
  console.log('✓ Inter-account fund transfer verified.');

  // Test Case 7: Add Bank Account & Verify Integrity
  console.log('\nTest Case 7: Adding new Bank Account...');
  const initialAccountsCount = dbState.state.bankAccounts.length;
  const newAccountPayload = {
    account_name: 'ICICI Savings',
    account_number: '1234567890',
    ifsc: 'ICIC0000123',
    branch: 'Vashi',
    opening_balance: 50000.00,
    upi_id: 'icicisavings@okicici',
    allow_overdraft: false
  };

  const newAcc = dbState.addBankAccount(newAccountPayload);
  assert(dbState.state.bankAccounts.length === initialAccountsCount + 1, 'Bank accounts count should increase by 1');
  assert(newAcc.current_balance === 50000.00, `Expected current balance to equal opening balance 50,000, got ${newAcc.current_balance}`);
  console.log('✓ Bank account added and dynamic balance initialized.');

  // Test Case 8: Create Employee and PAN validation
  console.log('\nTest Case 8: Verifying Employee PAN validation constraints...');
  const invalidEmpPayload = {
    name: 'John Doe',
    email: 'john@glasserp.in',
    mobile: '9999999999',
    designation: 'Fitter',
    pan: 'INVALIDPAN1'
  };

  try {
    dbState.createEmployee(invalidEmpPayload);
    assert(false, 'Expected employee creation with invalid PAN to throw an error');
  } catch (err) {
    assert(err.message.includes('Invalid PAN Number format'), `Expected PAN validation error, got: ${err.message}`);
  }

  const validEmpPayload = {
    name: 'Jane Doe',
    email: 'jane@glasserp.in',
    mobile: '8888888888',
    designation: 'Designer',
    pan: 'ABCDE1234F'
  };

  const createdEmp = dbState.createEmployee(validEmpPayload);
  assert(createdEmp.name === 'Jane Doe', 'Employee name should match');
  assert(createdEmp.pan === 'ABCDE1234F', 'Employee PAN should be uppercase and match');
  console.log('✓ Employee PAN validation constraints verified.');

  console.log('\n----------------------------------------------------');
  console.log('GlassERP Pro V2: All accounting & ops tests passed! 🚀');
  console.log('----------------------------------------------------');
} catch (error) {
  console.error('\n❌ TEST SUITE FAILED:', error);
  process.exit(1);
}
