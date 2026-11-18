import { Injectable, inject, signal } from '@angular/core';
import { ArtistDto, ArtistsClient } from '../api/api-clients';
import { ignoreHandledError } from '../../shared/ignore-handled-error';

// Admin-only artist list shared by every dropdown, so a newly created artist shows up everywhere.
@Injectable({ providedIn: 'root' })
export class ArtistDirectory {
  private readonly artistsClient = inject(ArtistsClient);
  private readonly list = signal<ArtistDto[]>([]);

  readonly artists = this.list.asReadonly();

  // The API caps a page at 100, which is plenty for dropdowns.
  refresh(): void {
    this.artistsClient
      .getArtists(1, 100)
      .pipe(ignoreHandledError())
      .subscribe((result) => this.list.set(result.items));
  }
}
