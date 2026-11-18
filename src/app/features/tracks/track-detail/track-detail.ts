import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';
import {
  DistributionStatus,
  DspDto,
  DspsClient,
  TrackDetailsDto,
  TrackDistributionDto,
  TrackStatus,
  TracksClient,
} from '../../../core/api/api-clients';
import { AuthService } from '../../../core/auth/auth.service';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';
import { formatIsrc } from '../../../shared/isrc';
import { distributionStatusSeverity, trackStatusSeverity } from '../../../shared/status-severity';
import { DistributeDialog } from '../distribute-dialog/distribute-dialog';

@Component({
  selector: 'app-track-detail',
  imports: [DatePipe, RouterLink, TableModule, Tag, Button, DistributeDialog],
  templateUrl: './track-detail.html',
})
export class TrackDetail {
  private readonly tracksClient = inject(TracksClient);
  private readonly dspsClient = inject(DspsClient);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly auth = inject(AuthService);

  // Bound from the ":id" route parameter.
  readonly id = input.required<string>();

  protected readonly trackSeverity = trackStatusSeverity;
  protected readonly distributionSeverity = distributionStatusSeverity;
  protected readonly formatIsrc = formatIsrc;

  protected readonly track = signal<TrackDetailsDto | null>(null);
  protected readonly notFound = signal(false);
  protected readonly dsps = signal<DspDto[]>([]);
  protected readonly busy = signal(false);
  protected readonly distributeVisible = signal(false);

  // Mirrors the API's rules so only valid actions are offered; the API still has the final word.
  protected readonly hasLive = computed(
    () => this.track()?.distributions.some((distribution) => distribution.status === 'Live') ?? false,
  );
  protected readonly canMarkDistributed = computed(() => this.track()?.status === 'Submitted' && this.hasLive());
  protected readonly canWithdraw = computed(() => this.track()?.status === 'Submitted' && !this.hasLive());

  constructor() {
    effect(() => this.load(this.id()));

    this.dspsClient
      .getDsps()
      .pipe(ignoreHandledError())
      .subscribe((dsps) => this.dsps.set(dsps));
  }

  protected markDistributed(): void {
    this.changeStatus('Distributed', 'Track marked as distributed.');
  }

  protected withdraw(): void {
    this.confirmation.confirm({
      header: 'Withdraw to draft?',
      message: 'This cancels every pending or rejected DSP submission for this track.',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Withdraw', severity: 'danger' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: () => this.changeStatus('Draft', 'Track moved back to draft.'),
    });
  }

  // Admin only: records a DSP's decision on a pending distribution.
  protected setDistributionStatus(distribution: TrackDistributionDto, status: DistributionStatus): void {
    this.busy.set(true);

    this.tracksClient
      .updateDistributionStatus(this.id(), distribution.id, { status })
      .pipe(
        finalize(() => this.busy.set(false)),
        ignoreHandledError(),
      )
      .subscribe(() => {
        this.messages.add({ severity: 'success', summary: 'Distribution updated', detail: `${distribution.dspName} is now ${status}.` });
        this.load(this.id());
      });
  }

  protected onDistributed(): void {
    this.load(this.id());
  }

  private changeStatus(status: TrackStatus, successMessage: string): void {
    this.busy.set(true);

    this.tracksClient
      .updateTrackStatus(this.id(), { status })
      .pipe(
        finalize(() => this.busy.set(false)),
        ignoreHandledError(),
      )
      .subscribe(() => {
        this.messages.add({ severity: 'success', summary: 'Status updated', detail: successMessage });
        this.load(this.id());
      });
  }

  private load(id: string): void {
    this.tracksClient.getTrack(id).subscribe({
      next: (track) => {
        this.track.set(track);
        this.notFound.set(false);
      },
      error: () => this.notFound.set(true),
    });
  }
}
