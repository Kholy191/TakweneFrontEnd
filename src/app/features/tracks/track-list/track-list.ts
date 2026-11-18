import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Subject, debounceTime, distinctUntilChanged, filter, finalize, map } from 'rxjs';
import {
  TrackDetailsDto,
  TrackListItemDto,
  TrackStatus,
  TracksClient,
} from '../../../core/api/api-clients';
import { ArtistDirectory } from '../../../core/artists/artist-directory.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ignoreHandledError } from '../../../shared/ignore-handled-error';
import { formatIsrc } from '../../../shared/isrc';
import { trackStatusSeverity } from '../../../shared/status-severity';
import { MIN_SEARCH_LENGTH, TRACK_STATUSES } from '../../../shared/track-options';
import { CreateTrackDialog } from '../create-track-dialog/create-track-dialog';

@Component({
  selector: 'app-track-list',
  imports: [
    DatePipe,
    FormsModule,
    TableModule,
    Tag,
    Select,
    Button,
    InputText,
    IconField,
    InputIcon,
    CreateTrackDialog,
  ],
  templateUrl: './track-list.html',
})
export class TrackList {
  private readonly tracksClient = inject(TracksClient);
  private readonly artistDirectory = inject(ArtistDirectory);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  protected readonly auth = inject(AuthService);

  protected readonly pageSize = 10;
  protected readonly statusOptions = TRACK_STATUSES;
  protected readonly statusSeverity = trackStatusSeverity;
  protected readonly formatIsrc = formatIsrc;

  protected readonly tracks = signal<TrackListItemDto[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);
  protected readonly first = signal(0);
  protected readonly artists = this.artistDirectory.artists;
  protected readonly createVisible = signal(false);

  protected readonly status = signal<TrackStatus | null>(null);
  protected readonly artistId = signal<string | null>(null);
  protected readonly searchText = signal('');
  protected readonly searchTooShort = computed(() => {
    const length = this.searchText().trim().length;
    return length > 0 && length < MIN_SEARCH_LENGTH;
  });

  private appliedSearch = '';
  private readonly searchInput$ = new Subject<string>();

  constructor() {
    // Artists can't list other artists; only admins get the artist filter.
    if (this.auth.isAdmin()) this.artistDirectory.refresh();

    // Search fires 300 ms after typing stops, and only when empty or long enough for the API.
    this.searchInput$
      .pipe(
        debounceTime(300),
        map((text) => text.trim()),
        filter((text) => text.length === 0 || text.length >= MIN_SEARCH_LENGTH),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((text) => {
        this.appliedSearch = text;
        this.reload();
      });
  }

  protected onSearchInput(text: string): void {
    this.searchText.set(text);
    this.searchInput$.next(text);
  }

  protected onStatusChange(status: TrackStatus | null): void {
    this.status.set(status);
    this.reload();
  }

  protected onArtistChange(artistId: string | null): void {
    this.artistId.set(artistId);
    this.reload();
  }

  // Called by the table on first render and on every page change.
  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0);
    this.load();
  }

  protected open(track: TrackListItemDto): void {
    void this.router.navigate(['/tracks', track.id]);
  }

  protected onCreated(track: TrackDetailsDto): void {
    this.messages.add({ severity: 'success', summary: 'Track created', detail: `"${track.title}" was saved as a draft.` });
    void this.router.navigate(['/tracks', track.id]);
  }

  private reload(): void {
    this.first.set(0);
    this.load();
  }

  private load(): void {
    const page = Math.floor(this.first() / this.pageSize) + 1;
    this.loading.set(true);

    this.tracksClient
      .getTracks(
        this.artistId() ?? undefined,
        undefined,
        this.status() ?? undefined,
        this.appliedSearch || undefined,
        page,
        this.pageSize,
      )
      .pipe(
        finalize(() => this.loading.set(false)),
        ignoreHandledError(),
      )
      .subscribe((result) => {
        this.tracks.set(result.items);
        this.totalRecords.set(result.totalCount);
      });
  }
}
