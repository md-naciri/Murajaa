import * as SQLite from 'expo-sqlite';

export interface HifzLog {
  id?: number | string;
  date: string; // YYYY-MM-DD
  task_type: 'izhar' | 'review' | 'memorization';
  eighths_amount: number;
  range_string?: string;
  for_date?: string;
  created_at?: string;
}

class DBServiceNative {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  private getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        try {
          const db = await SQLite.openDatabaseAsync('murajaa.db');
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS hifz_log (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              date TEXT NOT NULL,
              task_type TEXT NOT NULL,
              eighths_amount INTEGER NOT NULL,
              range_string TEXT,
              for_date TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Migration: Add range_string if missing (for existing users)
          try {
            await db.execAsync(`ALTER TABLE hifz_log ADD COLUMN range_string TEXT;`);
          } catch (e) {
            // Ignore error if column already exists
          }

          // Migration: Add for_date if missing and backfill
          try {
            await db.execAsync(`ALTER TABLE hifz_log ADD COLUMN for_date TEXT;`);
            await db.execAsync(`UPDATE hifz_log SET for_date = date WHERE for_date IS NULL;`);
          } catch (e) {
            // Ignore error if column already exists
            try {
              await db.execAsync(`UPDATE hifz_log SET for_date = date WHERE for_date IS NULL;`);
            } catch (e2) {}
          }
          return db;
        } catch (error) {
          console.error('SQLite init error:', error);
          throw error;
        }
      })();
    }
    return this.dbPromise;
  }

  async initDb(): Promise<void> {
    // Explicitly await the setup to ensure it finishes during startup
    await this.getDb();
  }

  async addLog(date: string, taskType: 'izhar' | 'review' | 'memorization', eighthsAmount: number, rangeString?: string, forDate?: string): Promise<void> {
    try {
      const db = await this.getDb();
      const actualForDate = forDate || date;
      await db.runAsync(
        'INSERT INTO hifz_log (date, task_type, eighths_amount, range_string, for_date) VALUES ($date, $task, $amount, $range, $forDate)',
        { $date: date, $task: taskType, $amount: eighthsAmount, $range: rangeString || null, $forDate: actualForDate }
      );
    } catch (error) {
      console.error('SQLite insert error:', error);
    }
  }

  async getLogsForDate(date: string): Promise<HifzLog[]> {
    try {
      const db = await this.getDb();
      return await db.getAllAsync<HifzLog>(
        'SELECT * FROM hifz_log WHERE for_date = $date ORDER BY created_at DESC',
        { $date: date }
      );
    } catch (error) {
      console.error('SQLite select error:', error);
      return [];
    }
  }

  async getAllLogs(): Promise<HifzLog[]> {
    try {
      const db = await this.getDb();
      return await db.getAllAsync<HifzLog>('SELECT * FROM hifz_log ORDER BY date DESC, created_at DESC');
    } catch (error) {
      console.error('SQLite select all error:', error);
      return [];
    }
  }

  async removeLog(forDate: string, taskType: 'izhar' | 'review' | 'memorization'): Promise<void> {
    try {
      const db = await this.getDb();
      await db.runAsync(
        'DELETE FROM hifz_log WHERE for_date = $forDate AND task_type = $task',
        { $forDate: forDate, $task: taskType }
      );
    } catch (error) {
      console.error('SQLite delete error:', error);
    }
  }
}

export const DatabaseService = new DBServiceNative();
