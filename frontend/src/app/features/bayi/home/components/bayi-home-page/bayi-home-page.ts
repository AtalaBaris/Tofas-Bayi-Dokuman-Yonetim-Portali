/** Bayi ana sayfa — hoş geldiniz + özet + son dokümanlar. */
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import {
  BAYI_MOCK_DOCUMENTS,
  dealerDisplayName,
  fileKindIcon,
  type BayiDocumentCard,
} from '../../models/bayi-home.model';

@Component({
  selector: 'app-bayi-home-page',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './bayi-home-page.html',
  styleUrl: '../../styles/bayi-home-page.scss',
})
export class BayiHomePage {
  private readonly auth = inject(AuthService);

  readonly displayName = computed(() => this.auth.currentUser()?.name ?? 'Kullanıcı');
  readonly dealerName = computed(() => dealerDisplayName(this.auth.currentUser()?.dealerId));

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  );

  readonly allDocs = BAYI_MOCK_DOCUMENTS;

  readonly stats = computed(() => {
    const docs = this.allDocs;
    return {
      total: docs.length,
      thisWeek: docs.filter((d) => d.daysAgo <= 7).length,
      newCount: docs.filter((d) => d.isNew).length,
    };
  });

  readonly recentDocs = computed(() =>
    [...this.allDocs].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 4)
  );

  iconFor(doc: BayiDocumentCard): string {
    return fileKindIcon(doc.fileKind);
  }
}
