import { getItem, setItem } from '@/lib/idb';

const ADMIN_AUDIT_LOG_KEY = 'admin_audit_logs';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorDid?: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

/**
 * Admin Audit Logger Service
 * Logs all admin actions for compliance and security monitoring.
 * Stores logs in IndexedDB for offline availability and syncs when online.
 */
export class AdminAuditLogger {
  private logs: AuditLogEntry[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Load existing logs from IndexedDB
    this.loadLogs();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncLogs();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async loadLogs() {
    try {
      const stored = await getItem<AuditLogEntry[]>(ADMIN_AUDIT_LOG_KEY);
      if (stored) {
        this.logs = stored;
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  private async saveLogs() {
    try {
      await setItem(ADMIN_AUDIT_LOG_KEY, this.logs);
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  /**
   * Log an admin action
   */
  async log(
    actorId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>,
    actorDid?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      actorId,
      actorDid,
      action,
      resource,
      metadata,
      ip,
      userAgent,
    };

    this.logs.unshift(entry); // Add to beginning (most recent first)

    // Keep only last 10000 logs to prevent unbounded growth
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(0, 10000);
    }

    await this.saveLogs();

    // Sync to server when online
    if (this.isOnline) {
      this.syncLogs();
    }
  }

  /**
   * Get all logs (for admin viewing)
   */
  async getLogs(
    limit?: number,
    offset?: number,
    actionFilter?: string,
    resourceFilter?: string
  ): Promise<AuditLogEntry[]> {
    let filtered = [...this.logs];

    if (actionFilter) {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    if (resourceFilter) {
      filtered = filtered.filter((log) =>
        log.resource.toLowerCase().includes(resourceFilter.toLowerCase())
      );
    }

    if (offset) {
      filtered = filtered.slice(offset);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Get logs by actor (user)
   */
  async getLogsByActor(actorId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter((log) => log.actorId === actorId);
  }

  /**
   * Clear all logs (admin only, for testing/reset)
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    await this.saveLogs();
  }

  /**
   * Sync logs to remote server
   * In production, this would POST to /api/admin/audit endpoint
   */
  private async syncLogs(): Promise<void> {
    if (!this.isOnline || this.logs.length === 0) return;

    try {
      // For now, just keep logs local
      // In production: upload to server for permanent storage
      console.log(`Syncing ${this.logs.length} audit logs to server`);
    } catch (error) {
      console.error('Failed to sync audit logs:', error);
    }
  }
}

// Singleton instance
export const adminAuditLogger = new AdminAuditLogger();
