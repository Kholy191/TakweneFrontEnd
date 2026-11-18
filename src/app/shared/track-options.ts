import { TrackStatus } from '../core/api/api-clients';

export const TRACK_STATUSES: TrackStatus[] = ['Draft', 'Submitted', 'Distributed'];

// Suggestions only; the API accepts any genre text.
export const GENRES = ['Pop', 'Rock', 'Rap', 'Indie', 'Electronic', 'Jazz', 'Shaabi', 'Classical'];

// Same rule as the API: the search box sends nothing shorter than this.
export const MIN_SEARCH_LENGTH = 3;
