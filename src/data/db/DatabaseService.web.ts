export interface HifzLog {
  id?: number | string;
  date: string; // YYYY-MM-DD
  task_type: 'izhar' | 'review';
  eighths_amount: number;
  created_at?: string;
}

const WEB_STORAGE_KEY = 'murajaa-hifz-logs';

class DBServiceWeb {
  private getWebLogs(): HifzLog[] {
    try {
      const data = window.localStorage.getItem(WEB_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private saveWebLogs(logs: HifzLog[]) {
    try {
      window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to web storage', e);
    }
  }

  async initDb(): Promise<void> {
    // Web uses localStorage, no schema needed
    return Promise.resolve();
  }

  async addLog(date: string, taskType: 'izhar' | 'review', eighthsAmount: number): Promise<void> {
    const logs = this.getWebLogs();
    logs.push({
      id: Date.now().toString(),
      date,
      task_type: taskType,
      eighths_amount: eighthsAmount,
      created_at: new Date().toISOString()
    });
    this.saveWebLogs(logs);
    return Promise.resolve();
  }

  async getLogsForDate(date: string): Promise<HifzLog[]> {
    return Promise.resolve(this.getWebLogs().filter(log => log.date === date));
  }

  async getAllLogs(): Promise<HifzLog[]> {
    const sorted = this.getWebLogs().sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
    return Promise.resolve(sorted);
  }

  async removeLog(date: string, taskType: 'izhar' | 'review'): Promise<void> {
    let logs = this.getWebLogs();
    logs = logs.filter(log => !(log.date === date && log.task_type === taskType));
    this.saveWebLogs(logs);
    return Promise.resolve();
  }
}

export const DatabaseService = new DBServiceWeb();
