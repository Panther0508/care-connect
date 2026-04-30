#!/usr/bin/env python3
import os

idb_path = '/Users/HP/Documents/care-connect/src/lib/idb.ts'

with open(idb_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'export async function getWorkoutLogs(userId:' in content:
    print('Alias already exists')
    exit(0)

append = '''

// Alias for backward compatibility
export async function getWorkoutLogs(userId: string, limit: number = 10): Promise<WorkoutLog[]> {
  return getWorkoutLogsForUser(userId, limit);
}
'''

with open(idb_path, 'w', encoding='utf-8') as f:
    f.write(content.rstrip() + append)

print('Alias added')
