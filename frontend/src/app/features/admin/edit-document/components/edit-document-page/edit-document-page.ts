/** Admin — doküman düzenleme sayfası: metadata (PUT) + dosya ekleme/kaldırma. */
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BrandService } from '../../../../../core/services/brand.service';
import { CategoryService } from '../../../../../core/services/category.service';
import { MaterialsService } from '../../../../../core/services/materials.service';
import { saveBlobAsFile } from '../../../../../shared/utils/file-download.util';
import type { Material, MaterialFile } from '../../../../../core/models/material.interface';
import { AddDocumentBasic } from '../../../add-document/components/add-document-basic/add-document-basic';
import { AddDocumentUpload } from '../../../add-document/components/add-document-upload/add-document-upload';
import {
  expiresAtToIso,
  formatFileSize,
  type BrandOption,
  type CategoryOption,
  type SelectedFileInfo,
} from '../../../add-document/models/add-document.model';

@Component({
  selector: 'app-edit-document-page',
  imports: [FormsModule, AddDocumentBasic, AddDocumentUpload],
  templateUrl: './edit-document-page.html',
  styleUrl: '../../styles/edit-document-page.scss',
})
export class EditDocumentPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly materials = inject(MaterialsService);
  private readonly brandsApi = inject(BrandService);
  private readonly categoriesApi = inject(CategoryService);

  private materialId = 0;

  readonly title = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly brandIds = signal<number[]>([]);
  readonly expiresAt = signal('');
  readonly showErrors = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly submitError = signal('');

  readonly categoryOptions = signal<CategoryOption[]>([]);
  readonly brandOptions = signal<BrandOption[]>([]);
  readonly brandMenuOpen = signal(false);

  readonly currentFiles = signal<MaterialFile[]>([]);
  readonly version = signal(1);
  readonly pendingFiles = signal<SelectedFileInfo[]>([]);
  readonly fileError = signal('');
  readonly addingFiles = signal(false);
  readonly fileSuccess = signal('');
  readonly deletingFileId = signal<number | null>(null);

  readonly formatFileSize = formatFileSize;

  ngOnInit(): void {
    this.materialId = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      material: this.materials.getById(this.materialId),
      brands: this.brandsApi.list(),
      categories: this.categoriesApi.list(),
    }).subscribe({
      next: ({ material, brands, categories }) => {
        this.title.set(material.title);
        this.description.set(material.description);
        this.category.set(String(material.categoryId));
        this.brandIds.set([...material.brandIds]);
        this.expiresAt.set(material.expiresAt ? material.expiresAt.slice(0, 10) : '');
        this.currentFiles.set(material.files);
        this.version.set(material.version);
        this.brandOptions.set(
          brands.filter((b) => b.isActive).map((b) => ({ id: b.id, label: b.name }))
        );
        this.categoryOptions.set(
          categories
            .filter((c) => c.isActive)
            .map((c) => ({ value: String(c.id), label: c.name }))
        );
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.loadError.set(err?.message ?? 'Doküman bilgileri yüklenemedi. Lütfen tekrar deneyin.');
        this.loading.set(false);
      },
    });
  }

  get selectedBrands(): BrandOption[] {
    const ids = new Set(this.brandIds());
    return this.brandOptions().filter((b) => ids.has(b.id));
  }

  get availableBrands(): BrandOption[] {
    const ids = new Set(this.brandIds());
    return this.brandOptions().filter((b) => !ids.has(b.id));
  }

  toggleBrandMenu(): void {
    if (this.availableBrands.length === 0) {
      return;
    }
    this.brandMenuOpen.update((open) => !open);
  }

  addBrand(brandId: number): void {
    if (!this.brandIds().includes(brandId)) {
      this.brandIds.set([...this.brandIds(), brandId]);
    }
    this.brandMenuOpen.set(false);
  }

  removeBrand(brandId: number): void {
    this.brandIds.set(this.brandIds().filter((id) => id !== brandId));
  }

  cancel(): void {
    void this.router.navigateByUrl('/admin/documents');
  }

  downloadCurrentFile(file: MaterialFile): void {
    this.materials.downloadFile(this.materialId, file.id).subscribe({
      next: (blob) => saveBlobAsFile(blob, file.fileName),
      error: (err: { message?: string }) => {
        this.submitError.set(err?.message ?? 'Dosya indirilemedi.');
      },
    });
  }

  addFiles(): void {
    const files = this.pendingFiles();
    if (files.length === 0) {
      return;
    }

    this.fileError.set('');
    this.fileSuccess.set('');
    this.addingFiles.set(true);
    this.materials.addFiles(this.materialId, files.map((f) => f.file)).subscribe({
      next: (updated: Material) => {
        this.addingFiles.set(false);
        this.currentFiles.set(updated.files);
        this.version.set(updated.version);
        this.pendingFiles.set([]);
        this.fileSuccess.set('Yeni dosya(lar) eklendi.');
      },
      error: (err: { message?: string }) => {
        this.addingFiles.set(false);
        this.fileError.set(err?.message ?? 'Dosya eklenemedi. Lütfen tekrar deneyin.');
      },
    });
  }

  deleteFile(file: MaterialFile): void {
    if (this.currentFiles().length <= 1) {
      this.fileError.set('Bir dokümanın en az bir dosyası olmalıdır.');
      return;
    }

    this.fileError.set('');
    this.fileSuccess.set('');
    this.deletingFileId.set(file.id);
    this.materials.deleteFile(this.materialId, file.id).subscribe({
      next: (updated: Material) => {
        this.deletingFileId.set(null);
        this.currentFiles.set(updated.files);
        this.version.set(updated.version);
        this.fileSuccess.set(`"${file.fileName}" kaldırıldı.`);
      },
      error: (err: { message?: string }) => {
        this.deletingFileId.set(null);
        this.fileError.set(err?.message ?? 'Dosya kaldırılamadı. Lütfen tekrar deneyin.');
      },
    });
  }

  save(): void {
    this.submitError.set('');
    const title = this.title().trim();
    const description = this.description().trim();
    const categoryId = Number(this.category());
    const brandIds = this.brandIds();

    const valid =
      title.length > 0 &&
      description.length > 0 &&
      Number.isFinite(categoryId) &&
      categoryId > 0 &&
      brandIds.length > 0;

    if (!valid) {
      this.showErrors.set(true);
      return;
    }

    this.saving.set(true);
    this.materials
      .update(this.materialId, {
        title,
        description,
        categoryId,
        brandIds,
        expiresAt: expiresAtToIso(this.expiresAt()),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigateByUrl('/admin/documents');
        },
        error: (err: { message?: string }) => {
          this.saving.set(false);
          this.submitError.set(err?.message ?? 'Doküman güncellenemedi. Lütfen tekrar deneyin.');
        },
      });
  }
}
