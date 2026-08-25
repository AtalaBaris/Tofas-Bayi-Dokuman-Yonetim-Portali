/** Admin — Doküman havuzu + takvim (tek sayfa). */
import { Component } from '@angular/core';
import { DocsPoolCalendarPanel } from '../docs-pool-calendar-panel/docs-pool-calendar-panel';

@Component({
  selector: 'app-docs-pool-calendar-page',
  imports: [DocsPoolCalendarPanel],
  templateUrl: './docs-pool-calendar-page.html',
  styleUrl: './docs-pool-calendar-page.scss',
})
export class DocsPoolCalendarPage {}

