/** Breadcrumb + sayfa başlığı. */
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-add-document-header',
  templateUrl: './add-document-header.html',
  styleUrl: '../../styles/add-document-header.scss',
})
export class AddDocumentHeader {
  readonly libraryClick = output<void>();
}
