/**
 * Web fallback for NotificationService.
 * Contains no-ops to ensure the web application compiles and runs without crashes.
 */

export async function getPermissions(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function requestPermissions(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function updateSchedule(enabled: boolean, timeStr: string, isCompletedToday: boolean): Promise<void> {
  return Promise.resolve();
}
