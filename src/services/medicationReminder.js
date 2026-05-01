// src/services/medicationReminder.js
// Medication reminder service with scheduling, notifications, and adherence tracking

import { storeMedicationEvent, getMedicationEvents, getMedicationSummary } from '../lib/idb';

const REMINDER_KEY_PREFIX = 'medication-reminder-';
const SCHEDULED_REMINDERS_KEY = 'scheduled-medication-reminders';

/**
 * Schedule a medication reminder
 */
export async function scheduleReminder(medId, medicationName, times, daysOfWeek, options = {}) {
  const reminders = await getScheduledReminders();
  
  const reminder = {
    id: `${REMINDER_KEY_PREFIX}${medId}`,
    medId,
    medicationName,
    times, // Array of "HH:MM" strings
    daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6], // 0=Sunday, 6=Saturday
    enabled: options.enabled !== false,
    notifyBeforeMinutes: options.notifyBeforeMinutes || 15,
    sound: options.sound || 'default',
    vibrate: options.vibrate !== false,
    snoozeDuration: options.snoozeDuration || 10, // minutes
    maxSnoozes: options.maxSnoozes || 3,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    createdAt: new Date().toISOString(),
    ...options
  };

  reminders[reminder.id] = reminder;
  await saveScheduledReminders(reminders);

  // Schedule actual notifications
  await scheduleReminderNotifications(reminder);

  return reminder;
}

/**
 * Schedule notification via Service Worker
 */
async function scheduleReminderNotifications(reminder) {
  if (!reminder.enabled) return;

  const now = new Date();
  const today = now.getDay();

  // For each day in schedule
  for (const dayOfWeek of reminder.daysOfWeek) {
    // Skip past days this week if we're scheduling for future
    if (dayOfWeek < today && isSameWeek(now, dayOfWeek)) {
      continue;
    }

    for (const time of reminder.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const triggerTime = calculateNextTrigger(now, dayOfWeek, hours, minutes, reminder.notifyBeforeMinutes);
      
      if (triggerTime > now) {
        // Notify Service Worker to schedule
        await notifyServiceWorkerScheduleReminder({
          id: `${reminder.id}-${dayOfWeek}-${time}`,
          type: 'medication-reminder',
          medId: reminder.medId,
          medicationName: reminder.medicationName,
          time,
          dayOfWeek,
          triggerAt: triggerTime.toISOString(),
          notifyBeforeMinutes: reminder.notifyBeforeMinutes,
          data: reminder
        });
      }
    }
  }
}

/**
 * Calculate next trigger time
 */
function calculateNextTrigger(now, dayOfWeek, hours, minutes, notifyBeforeMinutes = 0) {
  const trigger = new Date(now);
  trigger.setHours(hours, minutes - notifyBeforeMinutes, 0, 0);
  
  // Adjust day
  const currentDay = trigger.getDay();
  const dayDiff = dayOfWeek - currentDay;
  
  if (dayDiff > 0 || (dayDiff === 0 && trigger > now)) {
    // Later this week
    trigger.setDate(trigger.getDate() + dayDiff);
  } else if (dayDiff === 0 && trigger <= now) {
    // Today but already passed, schedule for next week
    trigger.setDate(trigger.getDate() + 7);
  } else {
    // Previous day, schedule for next week
    trigger.setDate(trigger.getDate() + 7 + dayDiff);
  }
  
  return trigger;
}

function isSameWeek(date1, dayOfWeek) {
  const now = new Date();
  const day = now.getDay();
  return Math.floor((dayOfWeek - day + 7) % 7) === 0;
}

/**
 * Notify Service Worker to schedule reminder
 */
async function notifyServiceWorkerScheduleReminder(reminder) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // Send message to service worker
      reg.active?.postMessage({
        type: 'SCHEDULE_MEDICATION_REMINDER',
        reminder
      });
    } catch (err) {
      console.warn('Could not notify service worker:', err);
    }
  }
}

/**
 * Cancel a reminder
 */
export async function cancelReminder(medId) {
  const reminders = await getScheduledReminders();
  const reminderId = `${REMINDER_KEY_PREFIX}${medId}`;
  
  if (reminders[reminderId]) {
    delete reminders[reminderId];
    await saveScheduledReminders(reminders);
    
    // Notify service worker to cancel
    await notifyServiceWorkerCancelReminder(reminderId);
  }
}

async function notifyServiceWorkerCancelReminder(reminderId) {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: 'CANCEL_MEDICATION_REMINDER',
        reminderId
      });
    } catch (err) {
      console.warn('Could not cancel notification:', err);
    }
  }
}

/**
 * Toggle reminder enabled state
 */
export async function toggleReminder(medId, enabled) {
  const reminders = await getScheduledReminders();
  const reminderId = `${REMINDER_KEY_PREFIX}${medId}`;
  
  if (reminders[reminderId]) {
    reminders[reminderId].enabled = enabled !== false;
    await saveScheduledReminders(reminders);
    
    if (enabled) {
      await scheduleReminderNotifications(reminders[reminderId]);
    } else {
      await notifyServiceWorkerCancelReminder(reminderId);
    }
  }
}

/**
 * Record medication adherence
 */
export async function recordAdherence(medId, taken, timestamp = new Date(), notes = '') {
  const event = {
    id: `adherence-${medId}-${timestamp.getTime()}`,
    medId,
    taken,
    timestamp: timestamp.toISOString(),
    notes,
    recordedAt: new Date().toISOString()
  };

  await storeMedicationEvent(event);
  return event;
}

/**
 * Record that medication was skipped
 */
export async function recordSkipped(medId, reason = '', timestamp = new Date()) {
  return await recordAdherence(medId, false, timestamp, `Skipped: ${reason}`);
}

/**
 * Record that medication was taken
 */
export async function recordTaken(medId, notes = '', timestamp = new Date()) {
  return await recordAdherence(medId, true, timestamp, notes);
}

/**
 * Get adherence records for a medication
 */
export async function getAdherenceForMedication(medId, startDate = null, endDate = null) {
  return await getMedicationEvents(medId, startDate, endDate);
}

/**
 * Get adherence statistics
 */
export async function getAdherenceStats(medId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const events = await getMedicationEvents(medId, startDate, new Date());
  
  const total = events.length;
  const taken = events.filter(e => e.taken).length;
  const missed = total - taken;
  
  return {
    total,
    taken,
    missed,
    adherenceRate: total > 0 ? (taken / total) * 100 : 0,
    events
  };
}

/**
 * Get summary of multiple medications
 */
export async function getMedicationsSummary(medIds, days = 30) {
  const summaries = [];
  
  for (const medId of medIds) {
    const summary = await getMedicationSummary(medId, days);
    summaries.push(summary);
  }
  
  return summaries;
}

/**
 * Calculate refill date estimate
 */
export async function estimateRefillDate(medId, currentSupply = null, dosagePerDay = null) {
  const events = await getMedicationEvents(medId);
  
  // If we have dosage info, try to estimate
  if (dosagePerDay && currentSupply) {
    const daysSupply = currentSupply / dosagePerDay;
    const refillDate = new Date();
    refillDate.setDate(refillDate.getDate() + Math.floor(daysSupply));
    
    return {
      estimatedRefillDate: refillDate.toISOString(),
      daysRemaining: Math.floor(daysSupply),
      estimatedSupplyUsed: dosagePerDay * events.filter(e => e.taken).length,
      confidence: 'estimated'
    };
  }
  
  // Fallback: estimate from recent usage
  const recentTaken = events.filter(e => e.taken);
  if (recentTaken.length >= 5) {
    const avgDaysBetween = calculateAverageDaysBetween(recentTaken.map(e => new Date(e.timestamp)));
    const lastTaken = new Date(recentTaken[0].timestamp);
    const nextRefill = new Date(lastTaken);
    nextRefill.setDate(nextRefill.getDate() + Math.floor(avgDaysBetween * recentTaken.length));
    
    return {
      estimatedRefillDate: nextRefill.toISOString(),
      confidence: 'historical',
      avgDaysBetween
    };
  }
  
  return {
    estimatedRefillDate: null,
    confidence: 'insufficient_data'
  };
}

function calculateAverageDaysBetween(dates) {
  if (dates.length < 2) return 1;
  
  const sorted = dates.sort((a, b) => a - b);
  let totalDiff = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    totalDiff += (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
  }
  
  return totalDiff / (sorted.length - 1);
}

/**
 * Get scheduled reminders
 */
async function getScheduledReminders() {
  const stored = localStorage.getItem(SCHEDULED_REMINDERS_KEY);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Save scheduled reminders
 */
async function saveScheduledReminders(reminders) {
  localStorage.setItem(SCHEDULED_REMINDERS_KEY, JSON.stringify(reminders));
}

/**
 * Get all scheduled reminders
 */
export async function getAllReminders() {
  return await getScheduledReminders();
}

/**
 * Process reminder trigger from service worker
 */
export async function processReminderTrigger(reminderData) {
  const { medId, medicationName, time } = reminderData;
  
  // Show notification (if supported)
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(`Medication Reminder: ${medicationName}`, {
      body: `Time: ${time}. Take your medication.${reminderData.notifyBeforeMinutes > 0 ? ` (in ${reminderData.notifyBeforeMinutes} minutes)` : ''}`,
      icon: '/avatars/vita-alert.png',
      tag: `med-reminder-${medId}-${Date.now()}`,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });
    
    notification.onclick = () => {
      window.focus();
      // Could open medication page
    };
  }
  
  return { status: 'processed', reminder: reminderData };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Initialize reminder system
 */
export async function initializeReminders() {
  // Request notification permission
  await requestNotificationPermission();
  
  // Load existing reminders and reschedule
  const reminders = await getScheduledReminders();
  for (const reminderId in reminders) {
    const reminder = reminders[reminderId];
    if (reminder.enabled) {
      await scheduleReminderNotifications(reminder);
    }
  }
}

/**
 * Generate reminder report
 */
export async function generateReminderReport(medIds, days = 30) {
  const reminders = await getAllReminders();
  const stats = await getMedicationsSummary(medIds, days);
  
  return {
    period: `${days} days`,
    reminders: Object.values(reminders).filter(r => medIds.includes(r.medId)),
    adherenceStats: stats,
    generatedAt: new Date().toISOString()
  };
}