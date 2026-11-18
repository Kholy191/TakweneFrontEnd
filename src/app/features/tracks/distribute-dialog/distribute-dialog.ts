import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { MultiSelect } from 'primeng/multiselect';
import { finalize } from 'rxjs';
import {
  DistributeTrackResponse,
  DspDto,
  TrackDistributionDto,
  TracksClient,
} from '../../../core/api/api-clients';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';

interface DspOption {
  id: string;
  name: string;
  disabled: boolean;
}

@Component({
  selector: 'app-distribute-dialog',
  imports: [FormsModule, Dialog, Button, MultiSelect],
  templateUrl: './distribute-dialog.html',
})
export class DistributeDialog {
  private readonly tracksClient = inject(TracksClient);
  private readonly messages = inject(MessageService);

  readonly visible = model(false);
  readonly trackId = input.required<string>();
  readonly dsps = input<DspDto[]>([]);
  readonly distributions = input<TrackDistributionDto[]>([]);
  readonly distributed = output<DistributeTrackResponse>();

  protected readonly selected = signal<string[]>([]);
  protected readonly sending = signal(false);

  // Pending or Live DSPs can't be sent again; Rejected ones can be resubmitted.
  protected readonly options = computed<DspOption[]>(() => {
    const taken = new Set(
      this.distributions()
        .filter((distribution) => distribution.status !== 'Rejected')
        .map((distribution) => distribution.dspId),
    );
    return this.dsps().map((dsp) => ({ id: dsp.id, name: dsp.name, disabled: taken.has(dsp.id) }));
  });

  protected send(): void {
    this.sending.set(true);

    this.tracksClient
      .distributeTrack(this.trackId(), { dspIds: this.selected() })
      .pipe(
        finalize(() => this.sending.set(false)),
        ignoreHandledError(),
      )
      .subscribe((result) => {
        const parts = [
          `${result.submitted.length} submitted`,
          result.resubmitted.length ? `${result.resubmitted.length} resubmitted` : '',
          result.skipped.length ? `${result.skipped.length} already sent` : '',
        ].filter(Boolean);

        this.messages.add({ severity: 'success', summary: 'Sent to DSPs', detail: parts.join(', ') + '.' });
        this.visible.set(false);
        this.distributed.emit(result);
      });
  }

  protected onHide(): void {
    this.selected.set([]);
  }
}
