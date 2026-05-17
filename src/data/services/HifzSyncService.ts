import { supabase } from '../supabase/client';
import * as SQLite from 'expo-sqlite';

/**
 * HifzSyncService
 * 
 * Pattern: Java-like Service / DAO Layer
 * Purpose: Abstracts away the complexity of managing local vs cloud data.
 * Components/UI should only call these service methods, never raw SQL.
 */
export class HifzSyncService {
  
  /**
   * Pushes any local logs that haven't been backed up yet to Supabase.
   */
  static async pushUnsyncedLogs() {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      
      // 1. Fetch unsynced local logs
      const unsynced = await db.getAllAsync('SELECT * FROM hifz_log WHERE synced_to_cloud = 0');
      if (unsynced.length === 0) return;

      // 2. Push to Supabase Cloud
      const { error } = await supabase.from('hifz_log').insert(unsynced);

      if (!error) {
        // 3. Mark as safely synced locally
        await db.execAsync('UPDATE hifz_log SET synced_to_cloud = 1 WHERE synced_to_cloud = 0');
        console.log("Successfully synced local logs to cloud.");
      } else {
        console.error("Supabase sync error:", error.message);
      }
    } catch (err) {
      console.error("Sync Service failed:", err);
    }
  }

  /**
   * Reads settings primarily from Local DB for instant offline access.
   */
  static async getLocalSettings() {
    try {
      const db = await SQLite.openDatabaseAsync('murajaa.db');
      return await db.getFirstAsync('SELECT * FROM user_settings LIMIT 1');
    } catch (err) {
      console.error("Failed to read local settings:", err);
      return null;
    }
  }
}
