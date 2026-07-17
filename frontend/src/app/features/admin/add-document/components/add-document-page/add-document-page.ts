/** Admin — yeni içerik ekleme sayfası. */
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AddDocumentHeader } from '../add-document-header/add-document-header';
import { AddDocumentBasic } from '../add-document-basic/add-document-basic';
import { AddDocumentUpload } from '../add-document-upload/add-document-upload';
import { AddDocumentMeta } from '../add-document-meta/add-document-meta';
import { AddDocumentActions } from '../add-document-actions/add-document-actions';
import { addDocumentAnimations } from '../../animations/add-document.animations';
import {
  emptyAddDocumentForm,
  type MaterialFormStatus,
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
export class AddDocumentPage {
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly brands = signal<string[]>([...emptyAddDocumentForm().brands]);
  readonly publishedAt = signal('');
  readonly expiresAt = signal('');
  readonly status = signal<MaterialFormStatus>('active');
  readonly file = signal<SelectedFileInfo | null>(null);
  readonly showErrors = signal(false);
  readonly saving = signal(false);

  goToLibrary(): void {
    void this.router.navigateByUrl('/admin/documents');
  }

  saveDraft(): void {
    this.status.set('draft');
    this.submit(true);
  }

  save(): void {
    this.submit(false);
  }

  private submit(asDraft: boolean): void {
    if (!asDraft) {
      const valid = this.title().trim().length > 0 && this.description().trim().length > 0;
      if (!valid) {
        this.showErrors.set(true);
        return;
      }
    } else if (!this.title().trim()) {
      this.showErrors.set(true);
      return;
    }

    this.saving.set(true);
    // API henüz yok — UI akışını tamamlayıp listeye dön.
    window.setTimeout(() => {
      this.saving.set(false);
      void this.router.navigateByUrl('/admin/documents');
    }, 350);
  }
}
