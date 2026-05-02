// src/pages/EvaluationDashboard.jsx
// VITACHAIN EVALUATION DASHBOARD — ADMIN TOOL FOR AI PERFORMANCE MONITORING
// Displays evaluation scores, model comparison, quality metrics, and trends

import React, { useEffect, useState } from 'react';

// Mock data — replace with actual IndexedDB query
const MOCK_EVALUATIONS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
  model: ['gemma4-31b', 'tinyllama-1.1b', 'google/gemma-4', 'mistral'][Math.floor(Math.random() * 4)],
  role: ['patient', 'clinician', 'chw'][Math.floor(Math.random() * 3)],
  overall: Math.random() * 0.4 + 0.6, // 0.6–1.0
  components: {
    factual: Math.random() * 0.3 + 0.7,
    clarity: Math.random() * 0.3 + 0.7,
    safety: Math.random() * 0.2 + 0.8,
    completeness: Math.random() * 0.4 + 0.6
  },
  citationCount: Math.floor(Math.random() * 5),
  wordCount: Math.floor(Math.random() * 300) + 50,
  hasCrisisResources: Math.random() > 0.9,
  hasDisclaimer: Math.random() > 0.1,
  hasUncertainty: Math.random() > 0.3,
  warningIndicators: Math.random() > 0.7 ? ['urgency_mention'] : []
}));

export default function EvaluationDashboard() {
  const [evaluations, setEvaluations] = useState(MOCK_EVALUATIONS);
  const [filter, setFilter] = useState({ role: 'all', model: 'all' });

  // Filter
  const filtered = evaluations.filter(e => {
    if (filter.role !== 'all' && e.role !== filter.role) return false;
    if (filter.model !== 'all' && e.model !== filter.model) return false;
    return true;
  });

  // Aggregate stats
  const stats = {
    total: filtered.length,
    avgOverall: filtered.reduce((s, e) => s + e.overall, 0) / Math.max(1, filtered.length),
    byRole: (() => {
      const groups = {};
      filtered.forEach(e => {
        groups[e.role] = (groups[e.role] || 0) + 1;
      });
      return groups;
    })(),
    byModel: (() => {
      const groups = {};
      filtered.forEach(e => {
        groups[e.model] = (groups[e.model] || 0) + 1;
      });
      return groups;
    })(),
    qualityBreakdown: {
      excellent: filtered.filter(e => e.overall >= 0.8).length,
      good: filtered.filter(e => e.overall >= 0.6 && e.overall < 0.8).length,
      poor: filtered.filter(e => e.overall < 0.6).length
    },
    safetyIssues: filtered.filter(e => e.components.safety < 0.5).length,
    factualIssues: filtered.filter(e => e.components.factual < 0.5).length
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📊 VitaChain AI Evaluation Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Real-time monitoring of AI response quality across all models and user roles.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
          <option value="all">All Roles</option>
          <option value="patient">Patient</option>
          <option value="clinician">Clinician</option>
          <option value="chw">CHW</option>
        </select>
        <select value={filter.model} onChange={e => setFilter({ ...filter, model: e.target.value })}>
          <option value="all">All Models</option>
          <option value="gemma4-31b">Gemma 4</option>
          <option value="tinyllama-1.1b">TinyLlama</option>
          <option value="google/gemma-4">OpenRouter Gemma</option>
          <option value="mistral">Hugging Face Mistral</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="Total Evaluations" value={stats.total} />
        <StatCard title="Avg Quality Score" value={stats.avgOverall.toFixed(3)} />
        <StatCard title="Excellent (≥0.8)" value={`${stats.qualityBreakdown.excellent} (${(stats.qualityBreakdown.excellent / stats.total * 100).toFixed(0)}%)`} />
        <StatCard title="Good (0.6–0.8)" value={`${stats.qualityBreakdown.good} (${(stats.qualityBreakdown.good / stats.total * 100).toFixed(0)}%)`} />
        <StatCard title="Poor (<0.6)" value={`${stats.qualityBreakdown.poor} (${(stats.qualityBreakdown.poor / stats.total * 100).toFixed(0)}%)`} />
        <StatCard title="Safety Issues" value={stats.safetyIssues} color={stats.safetyIssues > 0 ? '#f44336' : undefined} />
      </div>

      {/* Break-down tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h3>By Role</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f0f0f0' }}><th style={{ padding: '0.5rem' }}>Role</th><th style={{ padding: '0.5rem' }}>Count</th></tr></thead>
            <tbody>
              {Object.entries(stats.byRole).map(([role, count]) => (
                <tr key={role}><td style={{ padding: '0.5rem' }}>{role}</td><td style={{ padding: '0.5rem' }}>{count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3>By Model</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f0f0f0' }}><th style={{ padding: '0.5rem' }}>Model</th><th style={{ padding: '0.5rem' }}>Count</th></tr></thead>
            <tbody>
              {Object.entries(stats.byModel).map(([model, count]) => (
                <tr key={model}><td style={{ padding: '0.5rem' }}>{model}</td><td style={{ padding: '0.5rem' }}>{count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quality distribution chart (simple ASCII bars) */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Quality Distribution</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BarSegment label="Excellent" pct={stats.qualityBreakdown.excellent / stats.total} color="#4caf50" />
          <BarSegment label="Good" pct={stats.qualityBreakdown.good / stats.total} color="#ff9800" />
          <BarSegment label="Poor" pct={stats.qualityBreakdown.poor / stats.total} color="#f44336" />
        </div>
      </div>

      {/* Recent low-score alerts */}
      {stats.poor > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#ffebee', borderRadius: '4px' }}>
          <h3 style={{ color: '#c62828' }}>⚠️ Low-Score Alerts ({stats.poor})</h3>
          <ul>
            {filtered.filter(e => e.overall < 0.6).slice(0, 5).map(e => (
              <li key={e.id}>
                <strong>{e.model}</strong> ({e.role}): score={e.overall.toFixed(3)}, citations={e.citationCount}
                {e.warningIndicators.length > 0 && ` • warnings: ${e.warningIndicators.join(', ')}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginTop: '2rem', fontSize: '0.9em', color: '#666' }}>
        <p><strong>How scores are calculated:</strong></p>
        <ul>
          <li><strong>Factual (40% weight):</strong> citations present, reputable sources, uncertainty markers, no absolutes</li>
          <li><strong>Clarity (25%):</strong> readability, formatting, jargon explanation</li>
          <li><strong>Safety (20%):</strong> disclaimer, crisis resources, regulatory compliance</li>
          <li><strong>Completeness (15%):</strong> word count, actionable steps, citation support</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ padding: '1rem', border: `1px solid ${color || '#ddd'}`, borderRadius: '4px' }}>
      <div style={{ fontSize: '0.9em', color: '#666' }}>{title}</div>
      <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: color || '#333' }}>{value}</div>
    </div>
  );
}

function BarSegment({ label, pct, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
        <span>{label}</span><span>{(pct * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: '12px', background: '#eee', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: '6px' }} />
      </div>
    </div>
  );
}
