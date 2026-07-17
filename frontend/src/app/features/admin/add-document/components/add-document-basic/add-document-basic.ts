/** Başlık + açıklama (rich text toolbar mock). */
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-document-basic',
  imports: [FormsModule],
  templateUrl: './add-document-basic.html',
  styleUrl: '../../styles/add-document-basic.scss',
})
export class AddDocumentBasic {
  readonly title = input('');
  readonly description = input('');
  readonly showErrors = input(false);

  readonly titleChange = output<string>();
  readonly descriptionChange = output<string>();
}
