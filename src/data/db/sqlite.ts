import * as SQLite from 'expo-sqlite';

/**
 * Initializes the local SQLite database.
 * This is the foundation of the Local-First architecture.
 * It ensures the app runs at 60fps even with no internet connection.
 */
export async function initLocalDB() {
  const db = await SQLite.openDatabaseAsync('murajaa.db');

  // Define local schema (WAL mode provides better concurrency)
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS hifz_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      izhar_done BOOLEAN NOT NULL DEFAULT 0,
      reviewed BOOLEAN NOT NULL DEFAULT 0,
      synced_to_cloud BOOLEAN NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memorized_eighths INTEGER NOT NULL DEFAULT 0,
      weekly_goal_eighths INTEGER NOT NULL DEFAULT 2,
      izhar_day INTEGER NOT NULL DEFAULT 4,
      synced_to_cloud BOOLEAN NOT NULL DEFAULT 0
    );
  `);

  return db;
}
