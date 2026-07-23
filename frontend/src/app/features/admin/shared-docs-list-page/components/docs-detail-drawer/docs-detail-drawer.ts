/** Sağ detay drawer. */
import { Component, input, output, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import type { DocumentListItem, DocumentViewerRow } from '../../models/document-list.model';
import { CategoryService } from '../../../../../core/services/category.service';
import { BrandService } from '../../../../../core/services/brand.service';
import { MaterialsService, type UpdateMaterialPayload } from '../../../../../core/services/materials.service';
import type { CategoryDto, BrandDto } from '../../../../../core/models/definition.models';

@Component({
  selector: 'app-docs-detail-drawer',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './docs-detail-drawer.html',
  styleUrl: '../../styles/docs-detail-drawer.scss',
})
export class DocsDetailDrawer {
  readonly doc = input.required<DocumentListItem>();
  readonly viewers = input<DocumentViewerRow[]>([]);
  readonly closed = output<void>();
  readonly archive = output<DocumentListItem>();
  readonly publishNow = output<DocumentListItem>();
  readonly downloadFile = output<{ materialId: number; fileId: number; fileName: string }>();
  readonly updated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly brandService = inject(BrandService);
  private readonly materialsService = inject(MaterialsService);

  readonly isEditing = signal(false);
  readonly categories = signal<CategoryDto[]>([]);
  readonly brands = signal<BrandDto[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  
  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    brandIds: this.fb.array<FormControl<boolean>>([]),
    expiresAt: [''],
    file: [null as File | null],
  });

  constructor() {
    effect(() => {
      const doc = this.doc();
      if (this.isEditing() && doc) {
        this.resetForm(doc);
      }
    });
  }

  iconFor(kind: DocumentListItem['fileKind']): string {
    switch (kind) {
      case 'pdf': return 'picture_as_pdf';
      case 'video': return 'movie';
      default: return 'description';
    }
  }

  startEdit(): void {
    this.errorMessage.set('');
    if (this.categories().length === 0) {
      this.categoryService.list().subscribe(cats => this.categories.set(cats));
    }
    if (this.brands().length === 0) {
      this.brandService.list().subscribe(brs => {
        this.brands.set(brs);
        this.resetForm(this.doc());
      });
    } else {
      this.resetForm(this.doc());
    }
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  private resetForm(doc: DocumentListItem): void {
    this.form.patchValue({
      title: doc.title,
      description: doc.description,
      categoryId: doc.categoryId,
      expiresAt: doc.expiresAt || '',
      file: null
    });

    const brandArray = this.form.controls.brandIds;
    brandArray.clear();
    this.brands().forEach(b => {
      const hasBrand = doc.brandIds ? doc.brandIds.includes(b.id) : false;
      brandArray.push(new FormControl(hasBrand, { nonNullable: true }));
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.form.patchValue({ file: input.files[0] });
    } else {
      this.form.patchValue({ file: null });
    }
  }

  saveEdit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');

    const val = this.form.value;
    
    const selectedBrandIds: number[] = [];
    val.brandIds?.forEach((selected, i) => {
      if (selected) selectedBrandIds.push(this.brands()[i].id);
    });

    const payload: UpdateMaterialPayload = {
      title: val.title!,
      description: val.description!,
      categoryId: val.categoryId!,
      brandIds: selectedBrandIds,
      expiresAt: val.expiresAt || null,
      files: val.file ? [val.file as File] : []
    };

    this.materialsService.update(this.doc().id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.isEditing.set(false);
        this.updated.emit();
      },
      error: (err: { message?: string }) => {
        this.saving.set(false);
        this.errorMessage.set(err?.message || 'Güncelleme sırasında bir hata oluştu.');
      }
    });
  }
}
