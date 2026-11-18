import { Component, inject, input, model, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';
import { ArtistDto, TrackDetailsDto, TracksClient } from '../../../core/api/api-clients';
import { AuthService } from '../../../core/auth/auth.service';
import { toDateOnly } from '../../../shared/date-only';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';
import { ISRC_PATTERN } from '../../../shared/isrc';
import { GENRES } from '../../../shared/track-options';

@Component({
  selector: 'app-create-track-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, InputText, Select, DatePicker],
  templateUrl: './create-track-dialog.html',
})
export class CreateTrackDialog {
  private readonly tracksClient = inject(TracksClient);
  protected readonly auth = inject(AuthService);

  readonly visible = model(false);
  readonly artists = input<ArtistDto[]>([]);
  readonly created = output<TrackDetailsDto>();

  protected readonly genres = GENRES;
  protected readonly saving = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    isrc: ['', [Validators.required, Validators.pattern(ISRC_PATTERN)]],
    genre: ['', [Validators.required, Validators.maxLength(50)]],
    releaseDate: [null as Date | null, Validators.required],
    // Admins pick the artist; artists always create for themselves.
    artistId: [null as string | null, this.auth.isAdmin() ? Validators.required : []],
  });

  protected isInvalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.tracksClient
      .createTrack({
        title: value.title.trim(),
        isrc: value.isrc.trim(),
        genre: value.genre.trim(),
        releaseDate: toDateOnly(value.releaseDate!),
        artistId: this.auth.isAdmin() ? (value.artistId ?? undefined) : undefined,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        ignoreHandledError(),
      )
      .subscribe((track) => {
        this.visible.set(false);
        this.created.emit(track);
      });
  }

  protected onHide(): void {
    this.form.reset();
  }
}
