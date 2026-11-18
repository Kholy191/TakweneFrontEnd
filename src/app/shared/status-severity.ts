import { DistributionStatus, TrackStatus } from '../core/api/api-clients';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

const TRACK_SEVERITY: Record<TrackStatus, TagSeverity> = {
  Draft: 'secondary',
  Submitted: 'info',
  Distributed: 'success',
};

const DISTRIBUTION_SEVERITY: Record<DistributionStatus, TagSeverity> = {
  Pending: 'warn',
  Live: 'success',
  Rejected: 'danger',
};

export const trackStatusSeverity = (status: TrackStatus): TagSeverity => TRACK_SEVERITY[status];

export const distributionStatusSeverity = (status: DistributionStatus): TagSeverity =>
  DISTRIBUTION_SEVERITY[status];
