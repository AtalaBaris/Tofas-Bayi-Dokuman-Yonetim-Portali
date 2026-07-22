/** Tek doküman satırı. */
import { Component, computed, input, output } from '@angular/core';
import {
  remainingDaysLabel,
  viewCoverageLabel,
  viewCoveragePercent,
  type DocumentListItem,
  type DocumentStatus,
} from '../../models/document-list.model';

const STATUS_LABEL: Record<DocumentStatus, string> = {
  active: 'Aktif',
  draft: 'Taslak',
  archived: 'Arşiv',
};

@Component({
  selector: 'app-docs-list-row',
  templateUrl: './docs-list-row.html',
  styleUrl: '../../styles/docs-list-row.scss',
})
export class DocsListRow {
  readonly doc = input.required<DocumentListItem>();
  readonly selected = input(false);
  readonly select = output<DocumentListItem>();

  readonly remainingLabel = computed(() => remainingDaysLabel(this.doc().expiresAt));

  readonly coverageLabel = computed(() =>
    viewCoverageLabel(this.doc().viewedCount, this.doc().audienceCount)
  );

  readonly percent = computed(() =>
    viewCoveragePercent(this.doc().viewedCount, this.doc().audienceCount)
  );

  readonly statusLabel = computed(() => STATUS_LABEL[this.doc().status]);

  iconFor(kind: DocumentListItem['fileKind']): string {
    switch (kind) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'video':
        return 'movie';
      default:
        return 'description';
    }
  }
}
