// Mock data + API surface for CareSentinel.
// Each function below mirrors a future backend endpoint.
// Swap the bodies for real fetch() calls when the backend is ready.

export interface Facility {
  id: string;
  facility: string;
  location: string;
  services: string[];
  contact: string;
  distance: number;
  report_text: string;
}

export interface Alert {
  id: string;
  facility: Facility;
  matchedNeed: string;
  matchedAt: string; // ISO
  isNew: boolean;
}

export interface ImpactStats {
  familiesWatching: number;
  careConnectionsMade: number;
  facilitiesMonitored: number;
}

const FACILITIES: Facility[] = [
  {
    id: "1",
    facility: "Hope Clinic Enugu",
    location: "Enugu, 6.5 km",
    services: ["Pediatric malaria treatment", "IV drips"],
    contact: "080-555-1234",
    distance: 6.5,
    report_text:
      "Full pediatric malaria treatment available. Functional IV drip station. 2 isolation beds currently available.",
  },
  {
    id: "2",
    facility: "St. Mary's Community Hospital",
    location: "Nsukka, 12.1 km",
    services: ["Maternal care", "Ultrasound", "Vaccinations"],
    contact: "080-555-2280",
    distance: 12.1,
    report_text:
      "Maternal care unit fully staffed today. Ultrasound machine operational. Routine childhood vaccines in stock.",
  },
  {
    id: "3",
    facility: "Sunrise Pediatric Center",
    location: "Awka, 18.4 km",
    services: ["Speech therapy", "Pediatric assessment", "Nutrition"],
    contact: "080-555-3344",
    distance: 18.4,
    report_text:
      "Speech therapist on site Mon–Thu. Accepting new pediatric patients under 5. Nutrition counseling available.",
  },
  {
    id: "4",
    facility: "Greenfield Health Outpost",
    location: "Onitsha, 22.0 km",
    services: ["Wound care", "Antibiotics", "Basic surgery"],
    contact: "080-555-7711",
    distance: 22.0,
    report_text:
      "Sterile wound care supplies restocked this week. Broad-spectrum antibiotics available. Minor surgical procedures Mon/Wed.",
  },
];

const ALERTS: Alert[] = [
  {
    id: "a1",
    facility: FACILITIES[2],
    matchedNeed: "Speech therapy for child under 5, within 20km",
    matchedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    isNew: true,
  },
  {
    id: "a2",
    facility: FACILITIES[0],
    matchedNeed: "Pediatric malaria treatment near Enugu",
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    isNew: true,
  },
];

// Tiny helper to simulate network latency
const delay = <T,>(value: T, ms = 450): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// API: replace with backend endpoint later — GET /api/care/search?q=
export async function searchCare(query: string): Promise<Facility[]> {
  if (!query.trim()) return delay([]);
  const q = query.toLowerCase();
  const matches = FACILITIES.filter(
    (f) =>
      f.facility.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      f.services.some((s) => s.toLowerCase().includes(q)) ||
      f.report_text.toLowerCase().includes(q),
  );
  // Fallback: when nothing matches, surface nearest facilities so demo always feels alive.
  return delay(matches.length ? matches : FACILITIES.slice(0, 3));
}

// API: replace with backend endpoint later — GET /api/alerts
export async function getAlerts(): Promise<Alert[]> {
  return delay(ALERTS);
}

// API: replace with backend endpoint later — GET /api/facilities/:id
export async function getFacilityById(id: string): Promise<Facility | null> {
  const found = FACILITIES.find((f) => f.id === id) ?? null;
  return delay(found, 300);
}

// API: replace with backend endpoint later — GET /api/impact
export async function getImpactStats(): Promise<ImpactStats> {
  return delay({
    familiesWatching: 12480,
    careConnectionsMade: 3271,
    facilitiesMonitored: 184,
  });
}

// API: replace with backend endpoint later — POST /api/reservations
export async function confirmReservation(
  facilityId: string,
): Promise<{ code: string; expiresAt: string }> {
  const code = `CONF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
  return delay({ code, expiresAt }, 700);
}

// API: replace with backend endpoint later — POST /api/feedback
export async function sendFeedback(
  facilityId: string,
  helpful: boolean,
): Promise<{ ok: true }> {
  return delay({ ok: true }, 250);
}
