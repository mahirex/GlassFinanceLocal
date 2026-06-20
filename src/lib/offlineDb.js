import * as duckdb from '@duckdb/duckdb-wasm';

const BUNDLES = {
  mvp: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-mvp.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser.worker.js',
  },
  eh: {
    mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-eh.wasm',
    mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/duckdb-browser.worker.js',
  },
};

let db = null;
let conn = null;

/**
 * Initializes and establishes a WebAssembly offline DuckDB connection in the browser
 */
export async function getOfflineDb() {
  if (conn) return conn;

  try {
    const logger = new duckdb.ConsoleLogger();
    // Select the best bundle automatically based on browser capabilities
    const bundle = await duckdb.selectBundle(BUNDLES);
    
    const worker = new Worker(bundle.mainWorker);
    db = new duckdb.DuckDBInstance(logger, worker);
    await db.bootstrap(bundle.mainModule);
    
    conn = await db.connect();

    // Initialize tracking tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS local_events (
        id VARCHAR PRIMARY KEY,
        event_name VARCHAR,
        payload VARCHAR,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('🦆 DuckDB-Wasm connected successfully offline in browser.');
    return conn;
  } catch (error) {
    console.error('Failed to initialize browser offline DuckDB:', error);
    throw error;
  }
}

/**
 * Helper to execute analytical queries over local DuckDB data
 */
export async function queryOfflineData(sqlQuery) {
  const connection = await getOfflineDb();
  const result = await connection.query(sqlQuery);
  return result.toArray().map(row => {
    const obj = {};
    for (const key of Object.keys(row)) {
      // Handle potential BigInt or complex types
      const val = row[key];
      if (typeof val === 'bigint') {
        obj[key] = Number(val);
      } else {
        obj[key] = val;
      }
    }
    return obj;
  });
}
