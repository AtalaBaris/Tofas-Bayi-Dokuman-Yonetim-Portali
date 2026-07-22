/** Dosya sürükle-bırak / seçim alanı (çoklu dosya). */
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
  readonly files = input<SelectedFileInfo[]>([]);
  readonly filesChange = output<SelectedFileInfo[]>();
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
    const dropped = event.dataTransfer?.files;
    if (dropped && dropped.length > 0) {
      this.emitFiles(dropped);
    }
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.emitFiles(input.files);
    }
    input.value = '';
  }

  removeFile(event: Event, index: number): void {
    event.stopPropagation();
    const next = this.files().slice();
    next.splice(index, 1);
    this.fileErrorChange.emit('');
    this.filesChange.emit(next);
  }

  private emitFiles(fileList: FileList): void {
    const selectedInfos: SelectedFileInfo[] = [];
    for (const file of Array.from(fileList)) {
      const error = validateSelectedFile(file);
      if (error) {
        this.fileErrorChange.emit(error);
        return;
      }
      selectedInfos.push({
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        kind: detectFileKind(file.name),
        file,
        sizeBytes: file.size,
      });
    }

    this.fileErrorChange.emit('');
    this.filesChange.emit([...this.files(), ...selectedInfos]);
  }
}
