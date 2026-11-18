import { Component, inject, model, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { ArtistCreatedResponse, ArtistsClient } from '../../../core/api/api-clients';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';
import { CreatedCredentials } from './created-credentials';

@Component({
  selector: 'app-create-artist-dialog',
  imports: [ReactiveFormsModule, Dialog, Button, InputText],
  templateUrl: './create-artist-dialog.html',
})
export class CreateArtistDialog {
  private readonly artistsClient = inject(ArtistsClient);
  private readonly messages = inject(MessageService);

  readonly visible = model(false);
  readonly created = output<ArtistCreatedResponse>();

  protected readonly saving = signal(false);
  protected readonly credentials = signal<CreatedCredentials | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    // Optional: when empty the API generates a one-time password.
    password: ['', Validators.minLength(8)],
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

    this.artistsClient
      .createArtist({
        name: value.name.trim(),
        email: value.email.trim(),
        country: value.country.trim(),
        password: value.password || undefined,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        ignoreHandledError(),
      )
      .subscribe((artist) => {
        this.credentials.set({
          name: artist.name,
          email: artist.email,
          password: artist.temporaryPassword ?? value.password,
          generated: !!artist.temporaryPassword,
        });
        this.created.emit(artist);
      });
  }

  protected copy(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(
      () => this.messages.add({ severity: 'info', summary: 'Copied', detail: `${label} copied to the clipboard.`, life: 2000 }),
      () => this.messages.add({ severity: 'warn', summary: 'Copy failed', detail: 'Select the text and copy it manually.' }),
    );
  }

  protected onHide(): void {
    this.form.reset();
    this.credentials.set(null);
  }
}
