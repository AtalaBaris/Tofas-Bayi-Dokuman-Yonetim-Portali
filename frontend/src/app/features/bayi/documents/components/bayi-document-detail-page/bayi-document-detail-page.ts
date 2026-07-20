/** Bayi doküman detayı — mock (API sonrası VIEW/DOWNLOAD bağlanır). */
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  BAYI_MOCK_DOCUMENTS,
  BayiDocumentCard,
} from '../../../home/models/bayi-home.model';

const DEFAULT_DESCRIPTION =
  'Bu içerik bayinizin markalarına açılmıştır. Görüntüleme ve indirme işlemleri sistem tarafından kayıt altına alınır.';

@Component({
  selector: 'app-bayi-document-detail-page',
  imports: [RouterLink],
  templateUrl: './bayi-document-detail-page.html',
  styleUrl: '../../styles/bayi-document-detail-page.scss',
})
export class BayiDocumentDetailPage {
  private readonly route = inject(ActivatedRoute);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly doc = computed(() => {
    const id = this.id();
    return BAYI_MOCK_DOCUMENTS.find((d) => d.id === id) ?? BAYI_MOCK_DOCUMENTS[0] ?? null;
  });

  readonly descriptionParagraphs = computed(() => {
    const text = this.doc()?.description ?? DEFAULT_DESCRIPTION;
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  });

  readonly uploadedBy = computed(() => this.doc()?.uploadedBy ?? 'Merkez Admin');

  readonly fileSize = computed(() => {
    const d = this.doc();
    if (d?.fileSize) {
      return d.fileSize;
    }
    return defaultFileSize(d);
  });

  readonly fileName = computed(() => {
    const d = this.doc();
    if (d?.fileName) {
      return d.fileName;
    }
    return defaultFileName(d);
  });

  readonly previewMeta = computed(() => {
    const d = this.doc();
    if (!d || d.fileKind !== 'pdf') {
      return null;
    }
    const parts = [this.fileSize()];
    if (d.pageCount) {
      parts.push(`${d.pageCount} Sayfa`);
    }
    return parts.join(' • ');
  });

  onView(): void {
    // TODO: GET /api/materials/:id/view + erişim logu
    console.info('[mock] VIEW', this.doc()?.id);
  }

  onDownload(): void {
    // TODO: GET /api/materials/:id/download + erişim logu
    console.info('[mock] DOWNLOAD', this.doc()?.id);
  }
}

function defaultFileName(doc: BayiDocumentCard | null | undefined): string {
  if (!doc) {
    return 'dokuman.pdf';
  }
  const slug = doc.title
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  const ext = doc.fileKind === 'video' ? 'mp4' : doc.fileKind === 'doc' ? 'docx' : 'pdf';
  return `${slug || 'dokuman'}.${ext}`;
}

function defaultFileSize(doc: BayiDocumentCard | null | undefined): string {
  if (!doc) {
    return '—';
  }
  switch (doc.fileKind) {
    case 'video':
      return '48 MB';
    case 'doc':
      return '1.1 MB';
    default:
      return '2.4 MB';
  }
}
