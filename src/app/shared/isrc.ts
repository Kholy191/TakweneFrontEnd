// Accepts "EGTKW2600001" or "EG-TKW-26-00001" (case-insensitive), like the API.
export const ISRC_PATTERN = /^[A-Za-z]{2}-?[A-Za-z0-9]{3}-?\d{2}-?\d{5}$/;

// Stored as 12 characters; shown as CC-XXX-YY-NNNNN for readability.
export function formatIsrc(isrc: string): string {
  return isrc.length === 12
    ? `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`
    : isrc;
}
