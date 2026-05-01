// src/services/appointmentService.js
// Appointment scheduling service with AI-generated pre-visit checklists

import { getCurrentHealthState } from './healthGraph';
import * as idb from '../lib/idb';

const APPOINTMENTS_STORE = 'appointments';

/**
 * Schedule an appointment
 */
export async function scheduleAppointment(appointmentData) {
  const appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: appointmentData.title || 'Appointment',
    specialistType: appointmentData.specialistType || 'general',
    specialistName: appointmentData.specialistName || 'TBD',
    facility: appointmentData.facility || '',
    date: appointmentData.date,
    time: appointmentData.time,
    duration: appointmentData.duration || 30, // minutes
    purpose: appointmentData.purpose || '',
    symptoms: appointmentData.symptoms || [],
    concerns: appointmentData.concerns || [],
    preparationChecklist: appointmentData.preparationChecklist || [],
    status: appointmentData.status || 'scheduled', // scheduled, confirmed, completed, cancelled, no_show
    priority: appointmentData.priority || 'routine', // routine, urgent, emergency
    reminders: appointmentData.reminders || [],
    notes: appointmentData.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Generate AI-powered preparation checklist if not provided
  if (!appointmentData.preparationChecklist || appointmentData.preparationChecklist.length === 0) {
    appointment.preparationChecklist = await generatePreparationChecklist(appointment);
  }

  // Save to IndexedDB
  await storeAppointment(appointment);

  // Schedule reminders
  await scheduleAppointmentReminders(appointment);

  return appointment;
}

/**
 * Store appointment in IndexedDB
 */
async function storeAppointment(appointment) {
  const tx = idb.openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(APPOINTMENTS_STORE)) {
        db.createObjectStore(APPOINTMENTS_STORE, { keyPath: 'id' });
      }
      const tx = db.transaction(APPOINTMENTS_STORE, 'readwrite');
      const store = tx.objectStore(APPOINTMENTS_STORE);
      store.put(appointment);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
  return tx;
}

/**
 * Get appointment by ID
 */
export async function getAppointment(appointmentId) {
  const db = await idb.openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APPOINTMENTS_STORE, 'readonly');
    const store = tx.objectStore(APPOINTMENTS_STORE);
    const req = store.get(appointmentId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all appointments
 */
export async function getAllAppointments() {
  const db = await idb.openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(APPOINTMENTS_STORE, 'readonly');
    const store = tx.objectStore(APPOINTMENTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const appointments = req.result || [];
      // Sort by date
      appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
      resolve(appointments);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(daysAhead = 30) {
  const appointments = await getAllAppointments();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  
  return appointments.filter(a => {
    const aptDate = new Date(a.date + 'T' + a.time);
    return aptDate >= new Date() && aptDate <= cutoff && a.status !== 'cancelled' && a.status !== 'no_show';
  });
}

/**
 * Get past appointments
 */
export async function getPastAppointments(daysBack = 90) {
  const appointments = await getAllAppointments();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  
  return appointments.filter(a => {
    const aptDate = new Date(a.date + 'T' + a.time);
    return aptDate < new Date() && aptDate >= cutoff && a.status === 'completed';
  });
}

/**
 * Update appointment
 */
export async function updateAppointment(appointmentId, updates) {
  const appointment = await getAppointment(appointmentId);
  if (!appointment) return null;

  const updated = {
    ...appointment,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await storeAppointment(updated);

  // Reschedule reminders if date/time changed
  if (updates.date || updates.time) {
    await cancelAppointmentReminders(appointmentId);
    await scheduleAppointmentReminders(updated);
  }

  return updated;
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(appointmentId, reason = '') {
  return await updateAppointment(appointmentId, {
    status: 'cancelled',
    notes: reason ? `${appointment.notes ? appointment.notes + '\n' : ''}Cancelled: ${reason}` : appointment.notes
  });
}

/**
 * Complete appointment
 */
export async function completeAppointment(appointmentId, notes = '') {
  return await updateAppointment(appointmentId, {
    status: 'completed',
    notes: appointment.notes ? `${appointment.notes}\n${notes}` : notes
  });
}

/**
 * Generate AI-powered preparation checklist
 */
export async function generatePreparationChecklist(appointment) {
  const healthState = getCurrentHealthState();
  const checklist = [];

  // General items
  checklist.push('Bring valid ID and insurance card', 'Bring list of current medications', 'Bring any relevant medical records');

  // Specialist-specific items
  switch (appointment.specialistType) {
    case 'cardiologist':
      checklist.push('Bring recent blood pressure readings', 'List all medications with dosages', 'Note any chest pain or palpitations');
      if (healthState.conditions.some(c => c.name.toLowerCase().includes('hypertension') || c.name.toLowerCase().includes('heart'))) {
        checklist.push('Bring recent ECG results if available');
      }
      break;

    case 'endocrinologist':
      checklist.push('Bring recent blood sugar logs if diabetic', 'List all medications including supplements', 'Note any symptoms like increased thirst or urination');
      break;

    case 'neurologist':
      checklist.push('Document frequency and severity of symptoms', 'Bring list of current medications', 'Note any triggers or patterns');
      break;

    case 'orthopedic':
      checklist.push('Bring any X-rays or imaging results', 'Document range of motion limitations', 'List pain levels (1-10 scale)');
      break;

    case 'pulmonologist':
      checklist.push('Keep a 1-week symptom diary', 'Note triggers for breathing issues', 'Bring spirometry results if available');
      break;

    case 'gastroenterologist':
      checklist.push('Keep a 3-day food diary', 'Document bowel movement patterns', 'List any food intolerances');
      break;

    case 'dermatologist':
      checklist.push('Bring photos of skin conditions if they have changed', 'List all current skincare products', 'Note any allergies');
      break;

    case 'psychiatrist':
    case 'psychologist':
      checklist.push('List current symptoms and when they started', 'Note any family history of mental health conditions', 'Bring list of previous treatments');
      break;

    case 'obstetrician':
    case 'gynecologist':
      if (appointment.purpose.toLowerCase().includes('prenatal') || appointment.purpose.toLowerCase().includes('pregnancy')) {
        checklist.push('Note last menstrual period date', 'List all prenatal vitamins and supplements', 'Document any pregnancy symptoms');
      }
      break;

    case 'pediatrician':
      checklist.push('Bring vaccination record', 'Note any developmental milestones', 'List any concerns about growth or behavior');
      break;

    default:
      checklist.push('Write down your main concerns and questions');
  }

  // Medication-related items
  if (healthState.medications.length > 0) {
    const medChecklist = [];
    const bloodThinners = healthState.medications.filter(m => 
      m.name.toLowerCase().includes('warfarin') || 
      m.name.toLowerCase().includes('aspirin') ||
      m.name.toLowerCase().includes('clopidogrel')
    );
    
    if (bloodThinners.length > 0) {
      medChecklist.push('Note any recent bleeding or bruising');
    }

    const diabetesMeds = healthState.medications.filter(m => 
      m.name.toLowerCase().includes('insulin') ||
      m.name.toLowerCase().includes('metformin') ||
      m.name.toLowerCase().includes('glipizide')
    );

    if (diabetesMeds.length > 0) {
      medChecklist.push('Bring recent glucose readings', 'Check blood sugar before appointment if directed');
    }

    if (medChecklist.length > 0) {
      checklist.push(...medChecklist);
    }
  }

  // Appointment timing
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  const hoursUntilAppointment = Math.round((appointmentDate - new Date()) / (1000 * 60 * 60));

  if (hoursUntilAppointment > 24) {
    checklist.push('Confirm appointment 24 hours in advance', 'Plan transportation to appointment');
  }

  // Fasting requirements
  if (appointment.purpose.toLowerCase().includes('blood work') || appointment.purpose.toLowerCase().includes('lab')) {
    checklist.push('Fast for 8-12 hours before appointment if blood work required', 'Drink water normally unless instructed otherwise');
  }

  // Post-appointment items
  checklist.push('Write down questions before the visit', 'Bring someone to help remember information if possible', 'Request written instructions before leaving');

  return checklist.map((item, index) => `${index + 1}. ${item}`);
}

/**
 * Schedule appointment reminders
 */
async function scheduleAppointmentReminders(appointment) {
  const reminders = [
    { daysBefore: 7, message: `Upcoming appointment on ${appointment.date} at ${appointment.time}` },
    { daysBefore: 1, message: `Tomorrow: ${appointment.title} at ${appointment.time}` },
    { hoursBefore: 2, message: `Appointment in 2 hours: ${appointment.title}` }
  ];

  const scheduled = [];

  for (const reminder of reminders) {
    const triggerTime = calculateReminderTime(appointment.date, appointment.time, reminder);
    
    // Schedule via service worker
    await notifyServiceWorkerScheduleAppointmentReminder({
      id: `${appointment.id}-reminder-${reminder.daysBefore || reminder.hoursBefore}`,
      type: 'appointment-reminder',
      appointmentId: appointment.id,
      appointment,
      triggerAt: triggerTime.toISOString(),
      message: reminder.message
    });

    scheduled.push(triggerTime);
  }

  return scheduled;
}

/**
 * Calculate reminder time
 */
function calculateReminderTime(date, time, reminder) {
  const appointmentTime = new Date(`${date}T${time}`);
  
  if (reminder.daysBefore) {
    appointmentTime.setDate(appointmentTime.getDate() - reminder.daysBefore);
    appointmentTime.setHours(9, 0, 0, 0); // 9 AM reminder
  } else if (reminder.hoursBefore) {
    appointmentTime.setHours(appointmentTime.getHours() - reminder.hoursBefore);
  }
  
  return appointmentTime;
}

/**
 * Notify Service Worker to schedule appointment reminder
 */
async function notifyServiceWorkerScheduleAppointmentReminder(reminder) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: 'SCHEDULE_APPOINTMENT_REMINDER',
        reminder
      });
    } catch (err) {
      console.warn('Could not schedule appointment reminder:', err);
    }
  }
}

/**
 * Cancel appointment reminders
 */
async function cancelAppointmentReminders(appointmentId) {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        type: 'CANCEL_APPOINTMENT_REMINDERS',
        appointmentId
      });
    } catch (err) {
      console.warn('Could not cancel appointment reminders:', err);
    }
  }
}

/**
 * Generate follow-up recommendations
 */
export async function generateFollowUpRecommendation(appointment) {
  const recommendations = [];
  
  // Based on specialist type and reason
  if (appointment.specialistType === 'cardiologist') {
    recommendations.push('Schedule follow-up in 3 months for BP monitoring', 'Consider stress test if not done');
  } else if (appointment.specialistType === 'endocrinologist') {
    recommendations.push('Schedule HbA1c test in 3 months', 'Consider annual eye exam if diabetic');
  } else if (appointment.specialistType === 'orthopedic') {
    recommendations.push('Physical therapy referral may be helpful', 'Follow-up in 6-8 weeks to assess progress');
  } else if (appointment.specialistType === 'gastroenterologist') {
    recommendations.push('Schedule follow-up to review test results', 'Dietary consultation may be beneficial');
  } else {
    recommendations.push('Schedule follow-up as directed by your provider', 'Continue current treatment plan');
  }

  // Add general recommendations
  recommendations.push('Update medication list after visit', 'Note any new symptoms or concerns');

  return recommendations;
}

/**
 * Process appointment reminder trigger
 */
export async function processAppointmentReminder(reminderData) {
  const { appointment } = reminderData;
  
  // Show notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(`Appointment Reminder: ${appointment.title}`, {
      body: `${appointment.specialistName || appointment.specialistType} - ${appointment.date} at ${appointment.time}\n${appointment.purpose || ''}`,
      icon: '/avatars/vita-alert.png',
      tag: `apt-reminder-${appointment.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    });
    
    notification.onclick = () => {
      window.focus();
      // Navigate to appointment details
    };
  }
  
  return { status: 'processed', appointment: appointment };
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats() {
  const appointments = await getAllAppointments();
  
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const scheduled = appointments.filter(a => a.status === 'scheduled').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  
  const bySpecialist = appointments.reduce((acc, apt) => {
    acc[apt.specialistType] = (acc[apt.specialistType] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    completed,
    scheduled,
    cancelled,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    bySpecialist
  };
}

/**
 * Initialize appointment system
 */
export async function initializeAppointments() {
  // Ensure object store exists
  const db = await idb.openDB();
  if (!db.objectStoreNames.contains(APPOINTMENTS_STORE)) {
    const tx = db.transaction(APPOINTMENTS_STORE, 'readwrite');
    tx.objectStore(APPOINTMENTS_STORE);
  }
}