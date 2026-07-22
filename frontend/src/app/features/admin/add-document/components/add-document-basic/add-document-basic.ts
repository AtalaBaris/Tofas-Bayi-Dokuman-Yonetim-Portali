import { Component, ElementRef, input, output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-document-basic',
  imports: [FormsModule],
  templateUrl: './add-document-basic.html',
  styleUrl: '../../styles/add-document-basic.scss',
})
export class AddDocumentBasic {
  @ViewChild('descInput') descInput?: ElementRef<HTMLTextAreaElement>;

  readonly title = input('');
  readonly description = input('');
  readonly showErrors = input(false);

  readonly titleChange = output<string>();
  readonly descriptionChange = output<string>();

  applyFormat(style: 'bold' | 'italic' | 'underline' | 'bullet' | 'number' | 'link'): void {
    const textarea = this.descInput?.nativeElement;
    const currentText = this.description() || '';

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentText.substring(start, end);

    let replacement = '';
    switch (style) {
      case 'bold':
        replacement = `**${selected || 'kalın metin'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italik metin'}*`;
        break;
      case 'underline':
        replacement = `<u>${selected || 'altı çizili metin'}</u>`;
        break;
      case 'bullet':
        replacement = selected ? `\n- ${selected}` : '\n- Madde öğesi';
        break;
      case 'number':
        replacement = selected ? `\n1. ${selected}` : '\n1. Liste öğesi';
        break;
      case 'link':
        replacement = `[${selected || 'bağlantı metni'}](https://)`;
        break;
    }

    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
    this.descriptionChange.emit(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  }
}
