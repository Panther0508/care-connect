// src/lib/gossipProtocol.ts
// Gossip protocol for Mesh Intelligence using Automerge CRDTs

import * as automerge from '@automerge/automerge/slim';
import { initAutomerge } from './initAutomerge';

// Ensure Automerge is initialized before any operations
initAutomerge();

export interface StockoutAlert {
  drugName: string;
  facilityId: string;
  timestamp: number;
}

export interface MeshDoc {
  searchCounters: Record<string, number>;
  confirmedFacilities: Set<string>; // G-Set (add-wins set)
  stockoutAlerts: StockoutAlert[];
  lastModified: number;
}

/**
 * Create a fresh mesh document
 */
export function createMeshDoc(): MeshDoc {
  return automerge.init<MeshDoc>();
}

/**
 * Record a search query (increment counter)
 */
export function recordSearch(doc: MeshDoc, term: string): MeshDoc {
  const normalized = term.toLowerCase().trim();
  return automerge.change(doc, (d) => {
    if (!d.searchCounters) d.searchCounters = {};
    d.searchCounters[normalized] = (d.searchCounters[normalized] || 0) + 1;
    d.lastModified = Date.now();
  });
}

/**
 * Record a facility confirmation (add to G-Set)
 */
export function recordConfirmation(doc: MeshDoc, facilityId: string): MeshDoc {
  return automerge.change(doc, (d) => {
    if (!d.confirmedFacilities) d.confirmedFacilities = new Set<string>();
    d.confirmedFacilities.add(facilityId);
    d.lastModified = Date.now();
  });
}

/**
 * Record a stockout alert
 */
export function recordStockout(doc: MeshDoc, drugName: string, facilityId: string): MeshDoc {
  return automerge.change(doc, (d) => {
    if (!d.stockoutAlerts) d.stockoutAlerts = [];
    d.stockoutAlerts.push({
      drugName,
      facilityId,
      timestamp: Date.now(),
    });
    d.lastModified = Date.now();
  });
}

/**
 * Merge two mesh documents (Automerge CRDT merge)
 */
export function mergeMeshes(docA: MeshDoc, docB: MeshDoc): MeshDoc {
  return automerge.merge(docA, docB);
}

/**
 * Serialize mesh document to Uint8Array for transmission
 */
export function serializeMesh(doc: MeshDoc): Uint8Array {
  return automerge.save(doc);
}

/**
 * Deserialize Uint8Array back to mesh document
 */
export function deserializeMesh(buffer: Uint8Array): MeshDoc {
  return automerge.load<MeshDoc>(buffer);
}

/**
 * Get a plain JavaScript object representing current mesh state
 * Used for outbreak dashboard and satellite upload
 */
export function getMeshState(doc: MeshDoc): {
  searchCounters: Record<string, number>;
  confirmedFacilities: string[];
  stockoutAlerts: StockoutAlert[];
  lastModified: number;
} {
  return {
    searchCounters: doc.searchCounters || {},
    confirmedFacilities: doc.confirmedFacilities ? Array.from(doc.confirmedFacilities) : [],
    stockoutAlerts: doc.stockoutAlerts || [],
    lastModified: doc.lastModified || 0,
  };
}
