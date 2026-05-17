import * as SQLite from 'expo-sqlite';

export interface HifzLog {
  id?: number | string;
  date: string; // YYYY-MM-DD
  task_type: 'izhar' | 'review';
  eighths_amount: number;
  created_at?: string;
}

class DBServiceNative {
  async initDb(): Promise<void> {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS hifz_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          task_type TEXT NOT NULL,
          eighths_amount INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('SQLite init error:', error);
    }
  }

  async addLog(date: string, taskType: 'izhar' | 'review', eighthsAmount: number): Promise<void> {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      await db.runAsync(
        'INSERT INTO hifz_log (date, task_type, eighths_amount) VALUES (?, ?, ?)',
        date, taskType, eighthsAmount
      );
    } catch (error) {
      console.error('SQLite insert error:', error);
    }
  }

  async getLogsForDate(date: string): Promise<HifzLog[]> {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      return await db.getAllAsync<HifzLog>(
        'SELECT * FROM hifz_log WHERE date = ? ORDER BY created_at DESC',
        date
      );
    } catch (error) {
      console.error('SQLite select error:', error);
      return [];
    }
  }

  async getAllLogs(): Promise<HifzLog[]> {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      return await db.getAllAsync<HifzLog>('SELECT * FROM hifz_log ORDER BY date DESC, created_at DESC');
    } catch (error) {
      console.error('SQLite select all error:', error);
      return [];
    }
  }

  async removeLog(date: string, taskType: 'izhar' | 'review'): Promise<void> {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      await db.runAsync(
        'DELETE FROM hifz_log WHERE date = ? AND task_type = ?',
        date, taskType
      );
    } catch (error) {
      console.error('SQLite delete error:', error);
    }
  }
}

export const DatabaseService = new DBServiceNative();
