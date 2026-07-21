/** Admin — yeni içerik ekleme sayfası (POST /api/materials multipart). */
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BrandService } from '../../../../../core/services/brand.service';
import { CategoryService } from '../../../../../core/services/category.service';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { AddDocumentHeader } from '../add-document-header/add-document-header';
import { AddDocumentBasic } from '../add-document-basic/add-document-basic';
import { AddDocumentUpload } from '../add-document-upload/add-document-upload';
import { AddDocumentMeta } from '../add-document-meta/add-document-meta';
import { AddDocumentActions } from '../add-document-actions/add-document-actions';
import { addDocumentAnimations } from '../../animations/add-document.animations';
import {
  defaultScheduledLocal,
  emptyBrandIds,
  expiresAtToIso,
  scheduledAtToIso,
  toApiStatus,
  type BrandOption,
  type CategoryOption,
  type MaterialFormStatus,
  type RecurrenceFormKind,
  type SelectedFileInfo,
} from '../../models/add-document.model';

@Component({
  selector: 'app-add-document-page',
  imports: [
    AddDocumentHeader,
    AddDocumentBasic,
    AddDocumentUpload,
    AddDocumentMeta,
    AddDocumentActions,
  ],
  templateUrl: './add-document-page.html',
  styleUrl: '../../styles/add-document-page.scss',
  animations: addDocumentAnimations,
})
export class AddDocumentPage implements OnInit {
  private readonly router = inject(Router);
  private readonly materials = inject(MaterialsService);
  private readonly brandsApi = inject(BrandService);
  private readonly categoriesApi = inject(CategoryService);

  readonly title = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly brandIds = signal<number[]>(emptyBrandIds());
  readonly publishedAt = signal('');
  readonly scheduledAt = signal(defaultScheduledLocal());
  readonly expiresAt = signal('');
  readonly status = signal<MaterialFormStatus>('active');
  readonly recurrenceKind = signal<RecurrenceFormKind>('None');
  readonly recurrenceDayOfWeek = signal(1);
  readonly recurrenceDayOfMonth = signal(1);
  readonly file = signal<SelectedFileInfo | null>(null);
  readonly showErrors = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly fileError = signal('');
  readonly loadingMeta = signal(true);

  readonly categoryOptions = signal<CategoryOption[]>([]);
  readonly brandOptions = signal<BrandOption[]>([]);

  ngOnInit(): void {
    const today = new Date();
    this.publishedAt.set(today.toISOString().slice(0, 10));

    forkJoin({
      brands: this.brandsApi.list(),
      categories: this.categoriesApi.list(),
    }).subscribe({
      next: ({ brands, categories }) => {
        this.brandOptions.set(
          brands.filter((b) => b.isActive).map((b) => ({ id: b.id, label: b.name }))
        );
        this.categoryOptions.set(
          categories
            .filter((c) => c.isActive)
            .map((c) => ({ value: String(c.id), label: c.name }))
        );
        this.loadingMeta.set(false);
      },
      error: (err: { message?: string }) => {
        this.loadError.set(
          err?.message ?? 'Marka ve kategori listesi yüklenemedi. API çalışıyor mu?'
        );
        this.loadingMeta.set(false);
      },
    });
  }

  goToLibrary(): void {
    void this.router.navigateByUrl('/admin/documents');
  }

  saveDraft(): void {
    this.status.set('draft');
    this.submit(true);
  }

  save(): void {
    if (this.status() === 'archived') {
      this.status.set('active');
    }
    this.submit(false);
  }

  private submit(asDraft: boolean): void {
    this.submitError.set('');
    const title = this.title().trim();
    const description = this.description().trim();
    const categoryId = Number(this.category());
    const brandIds = this.brandIds();
    const selected = this.file();
    const status = asDraft ? 'draft' : this.status();
    const scheduledIso =
      status === 'scheduled' ? scheduledAtToIso(this.scheduledAt()) : null;

    const needsDescription = !asDraft;
    const validBasics =
      title.length > 0 &&
      (!needsDescription || description.length > 0) &&
      Number.isFinite(categoryId) &&
      categoryId > 0 &&
      brandIds.length > 0 &&
      selected != null &&
      (status !== 'scheduled' || !!scheduledIso);

    if (!validBasics) {
      this.showErrors.set(true);
      if (!selected) {
        this.fileError.set('Dosya zorunludur.');
      }
      return;
    }

    this.saving.set(true);
    this.materials
      .create({
        title,
        description: description || title,
        categoryId,
        brandIds,
        expiresAt: expiresAtToIso(this.expiresAt()),
        status: toApiStatus(status),
        scheduledPublishAt: scheduledIso,
        recurrenceKind: status === 'scheduled' ? this.recurrenceKind() : undefined,
        recurrenceDayOfWeek:
          status === 'scheduled' && this.recurrenceKind() === 'Weekly'
            ? this.recurrenceDayOfWeek()
            : undefined,
        recurrenceDayOfMonth:
          status === 'scheduled' && this.recurrenceKind() === 'MonthlyDay'
            ? this.recurrenceDayOfMonth()
            : undefined,
        file: selected.file,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigateByUrl('/admin/documents');
        },
        error: (err: { message?: string }) => {
          this.saving.set(false);
          this.submitError.set(err?.message ?? 'Doküman kaydedilemedi. Lütfen tekrar deneyin.');
        },
      });
  }
}
