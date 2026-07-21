/** Bayi ana sayfa — hoş geldiniz + özet + son dokümanlar (gerçek Materials API). */
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { fileKindIcon, toBayiDocumentCard, type BayiDocumentCard } from '../../models/bayi-home.model';

@Component({
  selector: 'app-bayi-home-page',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './bayi-home-page.html',
  styleUrl: '../../styles/bayi-home-page.scss',
})
export class BayiHomePage {
  private readonly auth = inject(AuthService);
  private readonly materialsService = inject(MaterialsService);

  readonly displayName = computed(() => this.auth.currentUser()?.name ?? 'Kullanıcı');
  readonly dealerName = computed(() => this.auth.currentUser()?.dealerName ?? 'Bayiniz');

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  );

  readonly loading = signal(true);
  readonly error = signal('');
  readonly allDocs = signal<BayiDocumentCard[]>([]);

  readonly stats = computed(() => {
    const docs = this.allDocs();
    return {
      total: docs.length,
      thisWeek: docs.filter((d) => d.daysAgo <= 7).length,
      newCount: docs.filter((d) => d.isNew).length,
    };
  });

  readonly recentDocs = computed(() =>
    [...this.allDocs()].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 4)
  );

  constructor() {
    this.materialsService.list().subscribe({
      next: (materials) => {
        this.allDocs.set(materials.map(toBayiDocumentCard));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Dokümanlar yüklenemedi.');
        this.loading.set(false);
      },
    });
  }

  iconFor(doc: BayiDocumentCard): string {
    return fileKindIcon(doc.fileKind);
  }
}
