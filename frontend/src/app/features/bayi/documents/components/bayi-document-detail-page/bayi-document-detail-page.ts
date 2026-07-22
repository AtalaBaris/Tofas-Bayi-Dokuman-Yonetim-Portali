/** Bayi doküman detayı — gerçek Materials API (GET tekli erişim VIEW logunu backend'de zaten üretir). */
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { openBlobInNewTab, saveBlobAsFile } from '../../../../../shared/utils/file-download.util';
import { toBayiDocumentCard, type BayiDocumentCard } from '../../../home/models/bayi-home.model';

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
  private readonly materialsService = inject(MaterialsService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly loading = signal(true);
  readonly error = signal('');
  readonly doc = signal<BayiDocumentCard | null>(null);

  readonly descriptionParagraphs = computed(() => {
    const text = this.doc()?.description ?? DEFAULT_DESCRIPTION;
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  });

  readonly uploadedBy = computed(() => this.doc()?.uploadedBy ?? 'Merkez Admin');
  readonly fileSize = computed(() => this.doc()?.fileSize ?? '—');
  readonly fileName = computed(() => this.doc()?.fileName ?? 'dokuman');

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

  constructor() {
    this.materialsService.getById(this.id()).subscribe({
      next: (material) => {
        this.doc.set(toBayiDocumentCard(material));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Doküman bulunamadı ya da erişim yetkiniz yok.');
        this.loading.set(false);
      },
    });
  }

  onView(): void {
    const id = this.doc()?.id;
    if (id == null) {
      return;
    }
    this.materialsService.download(id).subscribe({
      next: (blob) => openBlobInNewTab(blob),
      error: (err) => this.error.set(err?.message ?? 'Doküman açılamadı.'),
    });
  }

  onDownload(): void {
    const d = this.doc();
    if (!d) {
      return;
    }
    this.materialsService.download(d.id).subscribe({
      next: (blob) => saveBlobAsFile(blob, d.fileName ?? d.title),
      error: (err) => this.error.set(err?.message ?? 'Dosya indirilemedi.'),
    });
  }
}
