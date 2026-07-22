/** Sağ detay drawer. */
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DocumentListItem, DocumentViewerRow } from '../../models/document-list.model';

@Component({
  selector: 'app-docs-detail-drawer',
  imports: [RouterLink],
  templateUrl: './docs-detail-drawer.html',
  styleUrl: '../../styles/docs-detail-drawer.scss',
})
export class DocsDetailDrawer {
  readonly doc = input.required<DocumentListItem>();
  readonly viewers = input<DocumentViewerRow[]>([]);
  readonly closed = output<void>();
  readonly archive = output<DocumentListItem>();
<<<<<<< HEAD
  readonly download = output<DocumentListItem>();
=======
  readonly publishNow = output<DocumentListItem>();
  readonly downloadFile = output<{ materialId: number; fileId: number; fileName: string }>();
>>>>>>> Develop

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
