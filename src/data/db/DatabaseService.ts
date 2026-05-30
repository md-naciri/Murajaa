import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

export interface HifzLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  task_type: 'izhar' | 'review' | 'memorization';
  eighths_amount: number;
  range_string?: string;
  for_date?: string;
  created_at?: string;
}

class DBServiceNative {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  private getUid(): string {
    const uid = useAuthStore.getState().user?.id;
    if (!uid) {
      console.warn('[DatabaseService] Warning: SQLite operation executed without an active auth session!');
      return 'anonymous_fallback';
    }
    return uid;
  }

  private getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        try {
          const db = await SQLite.openDatabaseAsync('murajaa.db');

          // Check if hifz_log exists and uses INTEGER for id (needs UUID migration)
          let needsUUIDMigration = false;
          try {
            const tableInfo = await db.getAllAsync<{ name: string; type: string }>('PRAGMA table_info(hifz_log)');
            const idCol = tableInfo.find(c => c.name === 'id');
            needsUUIDMigration = !!(idCol && idCol.type.toUpperCase().includes('INT'));
          } catch (e) {
            // Table might not exist yet
          }

          if (needsUUIDMigration) {
            console.log('[UUID Migration] Starting local DB migration...');
            const activeUid = useAuthStore.getState().user?.id || 'legacy_user';
            
            // 1. Create temporary table with UUID primary key and user_id
            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS hifz_log_uuid (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                task_type TEXT NOT NULL,
                eighths_amount INTEGER NOT NULL,
                range_string TEXT,
                for_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `);
            
            // 2. Fetch all old records
            const oldLogs = await db.getAllAsync<any>('SELECT * FROM hifz_log');
            
            // 3. Re-insert with random UUIDs and current user_id
            for (const log of oldLogs) {
              const uuid = Crypto.randomUUID();
              await db.runAsync(
                'INSERT INTO hifz_log_uuid (id, user_id, date, task_type, eighths_amount, range_string, for_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  uuid,
                  activeUid,
                  log.date, 
                  log.task_type, 
                  log.eighths_amount, 
                  log.range_string || null, 
                  log.for_date || null, 
                  log.created_at
                ]
              );
            }

            // 4. Safely swap tables
            await db.execAsync(`
              DROP TABLE hifz_log;
              ALTER TABLE hifz_log_uuid RENAME TO hifz_log;
            `);
            
            console.log('[UUID Migration] Completed successfully!');
          } else {
            // Standard initialization for new users or already migrated users
            await db.execAsync(`
              CREATE TABLE IF NOT EXISTS hifz_log (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                task_type TEXT NOT NULL,
                eighths_amount INTEGER NOT NULL,
                range_string TEXT,
                for_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              );
            `);

            // Apply existing additive schema migrations
            try {
              await db.execAsync(`ALTER TABLE hifz_log ADD COLUMN range_string TEXT;`);
            } catch (e) {}

            try {
              await db.execAsync(`ALTER TABLE hifz_log ADD COLUMN for_date TEXT;`);
              await db.execAsync(`UPDATE hifz_log SET for_date = date WHERE for_date IS NULL;`);
            } catch (e) {
              try {
                await db.execAsync(`UPDATE hifz_log SET for_date = date WHERE for_date IS NULL;`);
              } catch (e2) {}
            }
            
            // Multi-tenant migration: Add user_id to legacy tables
            try {
              await db.execAsync(`ALTER TABLE hifz_log ADD COLUMN user_id TEXT;`);
              const activeUid = useAuthStore.getState().user?.id || 'legacy_user';
              await db.execAsync(`UPDATE hifz_log SET user_id = '${activeUid}' WHERE user_id IS NULL;`);
              // Mark the column NOT NULL if possible, but SQLite ALTER TABLE doesn't support adding NOT NULL easily without default.
            } catch (e) {
              try {
                // If column exists, just backfill any nulls
                const activeUid = useAuthStore.getState().user?.id || 'legacy_user';
                await db.execAsync(`UPDATE hifz_log SET user_id = '${activeUid}' WHERE user_id IS NULL;`);
              } catch (e2) {}
            }
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
      const uuid = Crypto.randomUUID();
      const uid = this.getUid();
      await db.runAsync(
        'INSERT INTO hifz_log (id, user_id, date, task_type, eighths_amount, range_string, for_date) VALUES ($id, $uid, $date, $task, $amount, $range, $forDate)',
        { $id: uuid, $uid: uid, $date: date, $task: taskType, $amount: eighthsAmount, $range: rangeString || null, $forDate: actualForDate }
      );
    } catch (error) {
      console.error('SQLite insert error:', error);
    }
  }

  async getLogsForDate(date: string): Promise<HifzLog[]> {
    try {
      const db = await this.getDb();
      const uid = this.getUid();
      return await db.getAllAsync<HifzLog>(
        'SELECT * FROM hifz_log WHERE for_date = $date AND user_id = $uid ORDER BY created_at DESC',
        { $date: date, $uid: uid }
      );
    } catch (error) {
      console.error('SQLite select error:', error);
      return [];
    }
  }

  async getAllLogs(): Promise<HifzLog[]> {
    try {
      const db = await this.getDb();
      const uid = this.getUid();
      return await db.getAllAsync<HifzLog>(
        'SELECT * FROM hifz_log WHERE user_id = $uid ORDER BY date DESC, created_at DESC',
        { $uid: uid }
      );
    } catch (error) {
      console.error('SQLite select all error:', error);
      return [];
    }
  }

  async removeLog(forDate: string, taskType: 'izhar' | 'review' | 'memorization'): Promise<void> {
    try {
      const db = await this.getDb();
      const uid = this.getUid();
      await db.runAsync(
        'DELETE FROM hifz_log WHERE for_date = $forDate AND task_type = $task AND user_id = $uid',
        { $forDate: forDate, $task: taskType, $uid: uid }
      );
    } catch (error) {
      console.error('SQLite delete error:', error);
    }
  }
}

export const DatabaseService = new DBServiceNative();
