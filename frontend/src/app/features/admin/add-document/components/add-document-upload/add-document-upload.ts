/** Dosya sürükle-bırak / seçim alanı. */
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import type { SelectedFileInfo } from '../../models/add-document.model';
import {
  detectFileKind,
  formatFileSize,
  validateSelectedFile,
} from '../../models/add-document.model';

@Component({
  selector: 'app-add-document-upload',
  templateUrl: './add-document-upload.html',
  styleUrl: '../../styles/add-document-upload.scss',
})
export class AddDocumentUpload {
  readonly file = input<SelectedFileInfo | null>(null);
  readonly fileChange = output<SelectedFileInfo | null>();
  readonly fileErrorChange = output<string>();

  readonly dragOver = signal(false);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) {
      this.emitFile(dropped);
    }
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    if (picked) {
      this.emitFile(picked);
    }
    input.value = '';
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.fileErrorChange.emit('');
    this.fileChange.emit(null);
  }

  private emitFile(file: File): void {
    const error = validateSelectedFile(file);
    if (error) {
      this.fileErrorChange.emit(error);
      this.fileChange.emit(null);
      return;
    }

    this.fileErrorChange.emit('');
    this.fileChange.emit({
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      kind: detectFileKind(file.name),
      file,
      sizeBytes: file.size,
    });
  }
}
