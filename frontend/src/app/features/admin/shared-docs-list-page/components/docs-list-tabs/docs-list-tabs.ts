/** All / Aktif / Taslak / Arşiv sekmeleri. */
import { Component, input, output } from '@angular/core';
import type { DocumentStatusTab } from '../../models/document-list.model';

@Component({
  selector: 'app-docs-list-tabs',
  templateUrl: './docs-list-tabs.html',
  styleUrl: '../../styles/docs-list-tabs.scss',
})
export class DocsListTabs {
  readonly active = input<DocumentStatusTab>('all');
  readonly tabChange = output<DocumentStatusTab>();

  readonly tabs: Array<{ id: DocumentStatusTab; label: string }> = [
    { id: 'all', label: 'Tümü' },
    { id: 'active', label: 'Aktif' },
    { id: 'scheduled', label: 'Zamanlanmış' },
    { id: 'draft', label: 'Taslaklar' },
    { id: 'archived', label: 'Arşiv' },
  ];
}
