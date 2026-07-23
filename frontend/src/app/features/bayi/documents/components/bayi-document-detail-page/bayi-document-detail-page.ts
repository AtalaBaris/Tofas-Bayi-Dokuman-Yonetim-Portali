/** Bayi doküman detayı — filigranlı önizleyici ve versiyon geçmişi desteği. */
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map } from 'rxjs';
import { MaterialsService, type MaterialVersionDto } from '../../../../../core/services/materials.service';
import { WatermarkOverlay } from '../../../../../shared/components/watermark-overlay/watermark-overlay';
import { saveBlobAsFile } from '../../../../../shared/utils/file-download.util';
import { toBayiDocumentCard, type BayiDocumentCard } from '../../../home/models/bayi-home.model';

const DEFAULT_DESCRIPTION =
  'Bu içerik bayinizin markalarına açılmıştır. Görüntüleme ve indirme işlemleri sistem tarafından kayıt altına alınır.';

@Component({
  selector: 'app-bayi-document-detail-page',
  imports: [RouterLink, WatermarkOverlay],
  templateUrl: './bayi-document-detail-page.html',
  styleUrl: '../../styles/bayi-document-detail-page.scss',
})
export class BayiDocumentDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly materialsService = inject(MaterialsService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('id')) || 0)),
    { initialValue: 0 }
  );

  readonly loading = signal(true);
  readonly error = signal('');
  readonly doc = signal<BayiDocumentCard | null>(null);

  // Filigranlı Önizleme Modalı
  readonly viewerModalOpen = signal(false);
  readonly viewerLoading = signal(false);
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly rawPreviewUrl = signal<string | null>(null);
  readonly previewFileType = signal<'pdf' | 'image' | 'other'>('other');

  // Versiyon Geçmişi Modalı
  readonly versionsModalOpen = signal(false);
  readonly versionsLoading = signal(false);
  readonly versions = signal<MaterialVersionDto[]>([]);

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

    this.viewerLoading.set(true);
    this.viewerModalOpen.set(true);

    this.materialsService.download(id).subscribe({
      next: (blob) => {
        if (this.rawPreviewUrl()) {
          URL.revokeObjectURL(this.rawPreviewUrl()!);
        }

        const type = blob.type.toLowerCase();
        if (type.includes('pdf')) {
          this.previewFileType.set('pdf');
        } else if (type.includes('image')) {
          this.previewFileType.set('image');
        } else {
          this.previewFileType.set('other');
        }

        const url = URL.createObjectURL(blob);
        this.rawPreviewUrl.set(url);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.viewerLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Doküman açılamadı.');
        this.viewerLoading.set(false);
      },
    });
  }

  closeViewerModal(): void {
    this.viewerModalOpen.set(false);
  }

  openVersionsModal(): void {
    const materialId = this.doc()?.id;
    if (!materialId) return;

    this.versionsModalOpen.set(true);
    this.versionsLoading.set(true);

    this.materialsService.getVersions(materialId).subscribe({
      next: (list) => {
        this.versions.set(list);
        this.versionsLoading.set(false);
      },
      error: (err) => {
        console.error('Versiyonlar yüklenemedi:', err);
        this.versionsLoading.set(false);
      },
    });
  }

  closeVersionsModal(): void {
    this.versionsModalOpen.set(false);
  }

  onDownloadVersion(v: MaterialVersionDto): void {
    const materialId = this.doc()?.id;
    if (!materialId) return;

    this.materialsService.downloadVersion(materialId, v.id).subscribe({
      next: (blob) => saveBlobAsFile(blob, v.fileName),
      error: (err) => alert(err?.message ?? 'Versiyon indirilemedi.'),
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
