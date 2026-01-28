import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from '../utils/capacitor';

class NotificationService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    if (!isNativePlatform()) return;

    // Handle notification actions (Snooze/Dismiss)
    LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
      console.log('Notification action performed:', action);
      
      const { notification, actionId } = action;
      const taskId = notification.extra?.taskId;

      if (!taskId) return;

      try {
        if (actionId === 'snooze') {
           console.log(`Snoozing task ${taskId}`);
           // Stop current alarm
           await this.cancelReminder(taskId);
           
           // Reschedule for 10 minutes later
           const snoozedTime = new Date(Date.now() + 10 * 60 * 1000);
           // Retrieve title/alertType if stored, or default to basic for snooze to be safe
           // For simpler implementation, we just reschedule a standard notification
           // In a full app, we'd fetch the task details again
           await this.scheduleReminder(
              { id: taskId, title: 'Snoozed Task' }, 
              snoozedTime, 
              'persistent' // Keep it persistent? Or basic? Let's keep persistent for alarm
           );
        } else if (actionId === 'dismiss') {
           console.log(`Dismissing task ${taskId}`);
           await this.cancelReminder(taskId);
        }
      } catch (error) {
        console.error('Error handling notification action:', error);
      }
    });
  }

  async requestPermission() {
    if (!isNativePlatform()) return false;
    
    const status = await LocalNotifications.requestPermissions();
    if (status.display !== 'granted') return false;

    // Check/Request Android 12+ Exact Alarm Permission if strictly required
    // Capacitor manages this automatically if permission is in manifest,
    // but good to be aware.
    return true;
  }

  async scheduleReminder(task, reminderTime, alertType = 'basic') {
    if (!isNativePlatform()) {
      console.log('Web notification scheduled:', task.title, reminderTime);
      return;
    }

    // Ensure permissions before scheduling
    if (!(await this.requestPermission())) {
        console.error('Notification permissions denied');
        return;
    }

    const id = this.generateId(task.id);
    const date = new Date(reminderTime);

    // Cancel any existing notification for this task
    await this.cancelReminder(task.id);

    // Schedule new notification
    const options = {
      notifications: [
        {
          id: id,
          title: 'Task Reminder',
          body: task.title,
          schedule: { 
            at: date,
            allowWhileIdle: true
          },
          extra: { 
            taskId: task.id,
            alertType 
          },
          smallIcon: 'ic_stat_notification', 
          actionTypeId: alertType === 'persistent' ? 'REMINDER_ACTIONS' : undefined,
        }
      ]
    };

    if (alertType === 'persistent') {
      // Create dedicated channel for persistent alerts
      // V6: Custom Sound + Alarm Attributes + Fresh ID
      await LocalNotifications.createChannel({
        id: 'alarm_v6', 
        name: 'Alarm Channel V6',
        description: 'Loud alarm for tasks',
        sound: 'ringtone.wav', 
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // VISIBILITY_PUBLIC
        vibration: true,
        lights: true,
        lightColor: '#FF0000',
        audioAttributes: {
            usage: 4, // USAGE_ALARM
            contentType: 4 // CONTENT_TYPE_SONIFICATION
        }
      });

      // For persistent, we make it ongoing and high priority
      options.notifications[0].channelId = 'alarm_v6';
      options.notifications[0].ongoing = true;
      options.notifications[0].autoCancel = false;
      options.notifications[0].sound = 'ringtone.wav';
      
      // Infinite Loop: Repeat every minute
      options.notifications[0].schedule.repeats = true;
      options.notifications[0].schedule.every = 'minute';
      
      // Register action types for persistent notifications
      await this.registerActionTypes();
    }

    // Debug: Log the exact options being sent (AFTER modification)
    console.log('👀 Scheduling Options (Final):', JSON.stringify(options, null, 2));

    try {
        await LocalNotifications.schedule(options);
        console.log(`✅ Scheduled ${alertType} notification for task ${task.id} at ${date}`);
        
        // Immediate verification log
        const pending = await LocalNotifications.getPending();
        console.log('📋 Pending Notifications:', JSON.stringify(pending));
    } catch (e) {
        console.error('❌ Failed to schedule notification', e);
    }
  }

  async cancelReminder(taskId) {
    if (!isNativePlatform()) return;
    const id = this.generateId(taskId);
    try {
        await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (e) {
        // Ignore error if notification doesn't exist
    }
  }

  async registerActionTypes() {
    if (!isNativePlatform()) return;

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'REMINDER_ACTIONS',
          actions: [
            {
              id: 'snooze',
              title: 'Snooze 10m',
              foreground: false // Perform in background
            },
            {
              id: 'dismiss',
              title: 'Dismiss',
              foreground: false,
              destructive: true
            }
          ]
        }
      ]
    });
  }

  // Generate a unique numeric ID from the task ID string
  generateId(taskId) {
    // Simple hash to convert string/uuid to int
    let hash = 0;
    const str = String(taskId);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

export const notificationService = new NotificationService();
