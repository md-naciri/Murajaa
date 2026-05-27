import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the notification handler to determine what to do when a notification is received
// while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Sets up the Android notification channel with maximum importance.
 */
export async function setupChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'تذكير المراجعة',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4a843',
    });
  }
}

/**
 * Checks if the notification permission is currently granted.
 */
export async function getPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.error('Failed to get notification permissions', e);
    return false;
  }
}

/**
 * Requests notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.error('Failed to request notification permissions', e);
    return false;
  }
}

/**
 * Updates the 7-day rolling window reminder schedule.
 * Clears all existing reminders first.
 *
 * @param enabled Whether reminders are enabled.
 * @param timeStr Time to schedule notifications (format "HH:MM", e.g., "20:00").
 * @param isCompletedToday Whether today's daily review is already checked/complete.
 */
export async function updateSchedule(enabled: boolean, timeStr: string, isCompletedToday: boolean): Promise<void> {
  try {
    // 1. Always clear previous scheduled reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!enabled) {
      return;
    }

    await setupChannels();

    // 2. Parse trigger time (HH:MM)
    const [hourStr, minStr] = timeStr.split(':');
    const targetHour = parseInt(hourStr, 10);
    const targetMin = parseInt(minStr, 10);

    if (isNaN(targetHour) || isNaN(targetMin)) {
      console.error('Invalid time string for scheduling reminders:', timeStr);
      return;
    }

    const now = new Date();

    // 3. Schedule notifications for the next 7 days (Day 0 to Day 6)
    for (let i = 0; i < 7; i++) {
      const triggerDate = new Date();
      triggerDate.setDate(now.getDate() + i);
      triggerDate.setHours(targetHour, targetMin, 0, 0);

      // Special check for today (Day 0)
      if (i === 0) {
        // If the target time has already passed for today, do not schedule today
        if (triggerDate.getTime() <= now.getTime()) {
          continue;
        }
        // If the user already completed today's review, skip today's notification
        if (isCompletedToday) {
          continue;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ورد المراجعة اليومي 📖',
          body: 'حان وقت المراجعة اليومية لتثبيت محفوظك. لا تدع يومك يمر دون مراجعة.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'daily-reminders',
        },
      });
    }
  } catch (e) {
    console.error('Failed to update notification schedule', e);
  }
}
