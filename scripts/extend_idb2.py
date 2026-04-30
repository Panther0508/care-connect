#!/usr/bin/env python3
import os

idb_path = '/Users/HP/Documents/care-connect/src/lib/idb.ts'

# Read current content
with open(idb_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already extended
if 'export interface FoodLog' in content:
    print('Already extended')
    exit(0)

# Append new content
append_content = '''

// ==================== Food Logs ====================

export interface FoodLog {
  id?: number;
  userId: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: string;
  foodName: string;
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: number;
}

export async function addFoodLog(log: Omit<FoodLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readwrite");
    const store = transaction.objectStore("foodLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getFoodLogsForDate(userId: string, date: string): Promise<FoodLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readonly");
    const store = transaction.objectStore("foodLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as FoodLog[];
      const dayLogs = all.filter(l => l.userId === userId && l.date === date);
      resolve(dayLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFoodLogsForRange(userId: string, startDate: string, endDate: string): Promise<FoodLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("foodLogs", "readonly");
    const store = transaction.objectStore("foodLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as FoodLog[];
      const rangeLogs = all.filter(l => 
        l.userId === userId && l.date >= startDate && l.date <= endDate
      );
      resolve(rangeLogs);
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Workout Logs ====================

export interface WorkoutLog {
  id?: number;
  userId: string;
  date: string;
  workoutName: string;
  totalDuration: number;
  totalVolume: number;
  exercises: Array<{
    name: string;
    sets: Array<{ reps: number; weight: number }>;
  }>;
  notes: string;
  timestamp: number;
}

export async function addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workoutLogs", "readwrite");
    const store = transaction.objectStore("workoutLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkoutLogsForUser(userId: string, limit: number = 10): Promise<WorkoutLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workoutLogs", "readonly");
    const store = transaction.objectStore("workoutLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as WorkoutLog[];
      const userLogs = all.filter(l => l.userId === userId);
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userLogs.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Cycle Data ====================

export interface CycleEntry {
  id?: number;
  userId: string;
  date: string;
  cycleDay: number;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  symptoms: string[];
  mood: string;
  notes: string;
  timestamp: number;
}

export async function addCycleEntry(entry: Omit<CycleEntry, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("cycleData", "readwrite");
    const store = transaction.objectStore("cycleData");
    const request = store.add(entry);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getCycleData(userId: string, limit: number = 12): Promise<CycleEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("cycleData", "readonly");
    const store = transaction.objectStore("cycleData");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as CycleEntry[];
      const userEntries = all.filter(e => e.userId === userId);
      userEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userEntries.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Daily Hydration ====================

export interface DailyHydration {
  date: string;
  userId: string;
  totalMl: number;
  goalMl: number;
  timestamp: number;
}

export async function updateDailyHydration(entry: DailyHydration): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dailyHydration", "readwrite");
    const store = transaction.objectStore("dailyHydration");
    store.put(entry);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getDailyHydration(userId: string, date: string): Promise<DailyHydration | null> {
  const db = await openDB();
  const key = userId + "_" + date;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("dailyHydration", "readonly");
    const store = transaction.objectStore("dailyHydration");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Sleep Logs ====================

export interface SleepLog {
  id?: number;
  userId: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  totalSleep: number; // minutes
  quality: 1 | 2 | 3 | 4 | 5;
  notes: string;
  timestamp: number;
}

export async function addSleepLog(log: Omit<SleepLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("sleepLogs", "readwrite");
    const store = transaction.objectStore("sleepLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getSleepLogsForUser(userId: string, limit: number = 10): Promise<SleepLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("sleepLogs", "readonly");
    const store = transaction.objectStore("sleepLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as SleepLog[];
      const userLogs = all.filter(l => l.userId === userId);
      userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(userLogs.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Medication Logs ====================

export interface MedicationLog {
  id?: number;
  userId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  timestamp: number;
  taken: boolean;
  notes?: string;
}

export async function addMedicationLog(log: Omit<MedicationLog, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readwrite");
    const store = transaction.objectStore("medicationLogs");
    const request = store.add(log);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getMedicationLogsForDate(userId: string, date: string): Promise<MedicationLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("medicationLogs", "readonly");
    const store = transaction.objectStore("medicationLogs");
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as MedicationLog[];
      const dayLogs = all.filter(l => l.userId === userId && new Date(l.timestamp).toISOString().split('T')[0] === date);
      resolve(dayLogs);
    };
    request.onerror = () => reject(request.error);
  });
}
'''

with open(idb_path, 'w', encoding='utf-8') as f:
    f.write(content + append_content)

print('idb.ts extended successfully with log functions')
