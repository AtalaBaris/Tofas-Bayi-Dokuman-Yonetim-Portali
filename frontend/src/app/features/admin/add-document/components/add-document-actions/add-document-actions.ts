/** Sabit alt aksiyon çubuğu. */
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-add-document-actions',
  templateUrl: './add-document-actions.html',
  styleUrl: '../../styles/add-document-actions.scss',
})
export class AddDocumentActions {
  readonly saving = input(false);
  readonly saveDraft = output<void>();
  readonly save = output<void>();
}
