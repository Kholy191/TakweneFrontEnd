import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { finalize } from 'rxjs';
import { ArtistCreatedResponse, ArtistDto, ArtistsClient } from '../../../core/api/api-clients';
import { ArtistDirectory } from '../../../core/artists/artist-directory.service';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';
import { CreateArtistDialog } from '../create-artist-dialog/create-artist-dialog';

@Component({
  selector: 'app-artist-list',
  imports: [TableModule, Tag, Button, CreateArtistDialog],
  templateUrl: './artist-list.html',
})
export class ArtistList {
  private readonly artistsClient = inject(ArtistsClient);
  private readonly artistDirectory = inject(ArtistDirectory);

  protected readonly pageSize = 10;
  protected readonly artists = signal<ArtistDto[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);
  protected readonly first = signal(0);
  protected readonly createVisible = signal(false);

  // Called by the table on first render and on every page change.
  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0);
    this.load();
  }

  // Refresh this table and every artist dropdown in the app.
  protected onCreated(_: ArtistCreatedResponse): void {
    this.first.set(0);
    this.load();
    this.artistDirectory.refresh();
  }

  private load(): void {
    const page = Math.floor(this.first() / this.pageSize) + 1;
    this.loading.set(true);

    this.artistsClient
      .getArtists(page, this.pageSize)
      .pipe(
        finalize(() => this.loading.set(false)),
        ignoreHandledError(),
      )
      .subscribe((result) => {
        this.artists.set(result.items);
        this.totalRecords.set(result.totalCount);
      });
  }
}
