/** Admin — Doküman havuzu + yayın takvimi. */
import { Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { docsListAnimations } from '../../animations/docs-list.animations';
import { MaterialsService } from '../../../../../core/services/materials.service';
import type { MaterialScheduleItem } from '../../../../../core/models/material.interface';
import { DocsDetailDrawer } from '../docs-detail-drawer/docs-detail-drawer';
import { materialToDocumentListItem } from '../../models/document-list.model';
import type { DocumentListItem, DocumentViewerRow } from '../../models/document-list.model';

interface CalendarDay {
  dateKey: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
  isToday: boolean;
  /** Bugünden önceki günler — sürükle-bırak kapalı. */
  isPast: boolean;
}

interface ScheduleModalState {
  materialId: number;
  title: string;
  dateKey: string;
  time: string; // HH:mm
  /** Havuzdan: yeni kopya; takvimden: mevcut kaydı taşı. */
  mode: 'create' | 'move';
  recurrenceKind: 'None' | 'Weekly' | 'MonthlyDay';
}

const POOL_WIDTH_KEY = 'admin.poolPanelWidth';
const POOL_MIN_WIDTH = 220;
const POOL_MAX_WIDTH = 520;
const POOL_DEFAULT_WIDTH = 320;

@Component({
  selector: 'app-docs-pool-calendar-panel',
  imports: [FormsModule, DocsDetailDrawer, ConfirmDialog],
  templateUrl: './docs-pool-calendar-panel.html',
  styleUrl: './docs-pool-calendar-panel.scss',
  animations: docsListAnimations,
})
export class DocsPoolCalendarPanel {
  private readonly materialsApi = inject(MaterialsService);
  private readonly document = inject(DOCUMENT);

  readonly poolWidth = signal(readStoredPoolWidth());
  readonly resizing = signal(false);

  readonly pool = signal<DocumentListItem[]>([]);
  readonly poolLoading = signal(true);
  readonly poolError = signal('');

  /** 'pool' | 'calendar' — bırakma anında create vs move ayrımı için. */
  readonly dragSource = signal<'pool' | 'calendar' | null>(null);

  readonly cursor = signal(startOfMonth(new Date()));
  readonly events = signal<MaterialScheduleItem[]>([]);
  readonly calendarLoading = signal(true);
  readonly calendarError = signal('');

  readonly draggingId = signal<number | null>(null);

  readonly modal = signal<ScheduleModalState | null>(null);
  readonly modalError = signal('');
  readonly savingSchedule = signal(false);

  readonly modalScheduleInvalid = computed(() => {
    const state = this.modal();
    if (!state) {
      return false;
    }
    return isScheduleInPast(state.dateKey, state.time);
  });

  readonly confirmOpen = signal(false);
  readonly removeCandidateId = signal<number | null>(null);

  // Details drawer (DocsDetailDrawer)
  readonly detailsDoc = signal<DocumentListItem | null>(null);
  readonly viewers = signal<DocumentViewerRow[]>([]);

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(this.cursor())
  );

  readonly days = computed(() => buildMonthGrid(this.cursor()));

  readonly eventsByDay = computed(() => {
    const map = new Map<string, MaterialScheduleItem[]>();
    for (const ev of this.events()) {
      // backend may return UTC; we show by dateKey in local browser timezone
      const key = toDateKey(new Date(ev.at));
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  });

  readonly scheduledIdSet = computed(() => new Set(this.events().map((e) => e.id)));

  constructor() {
    void this.reloadAll();
  }

  startResize(event: PointerEvent): void {
    event.preventDefault();
    this.resizing.set(true);
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startWidth = this.poolWidth();

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) {
        return;
      }
      const delta = moveEvent.clientX - startX;
      this.poolWidth.set(clampPoolWidth(startWidth + delta));
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== event.pointerId) {
        return;
      }
      this.resizing.set(false);
      handle.releasePointerCapture(upEvent.pointerId);
      this.document.removeEventListener('pointermove', onMove);
      this.document.removeEventListener('pointerup', onUp);
      this.document.removeEventListener('pointercancel', onUp);
      localStorage.setItem(POOL_WIDTH_KEY, String(this.poolWidth()));
    };

    this.document.addEventListener('pointermove', onMove);
    this.document.addEventListener('pointerup', onUp);
    this.document.addEventListener('pointercancel', onUp);
  }

  reloadAll(): void {
    this.reloadPool();
    this.reloadCalendar();
  }

  reloadPool(): void {
    this.poolLoading.set(true);
    this.poolError.set('');
    // Havuz: taslak şablonlar + eski tekil zamanlanmışlar (kopya olmayanlar).
    // Takvim kopyaları (scheduleTemplateId dolu) havuzda gösterilmez.
    forkJoin({
      drafts: this.materialsApi.list({ status: 'Draft' }),
      scheduled: this.materialsApi.list({ status: 'Scheduled' }),
    }).subscribe({
      next: ({ drafts, scheduled }) => {
        const roots = scheduled.filter((m) => m.scheduleTemplateId == null);
        const items = [...drafts, ...roots]
          .map(materialToDocumentListItem)
          .sort((a, b) => {
            if (a.status !== b.status) {
              return a.status === 'draft' ? -1 : 1;
            }
            return a.title.localeCompare(b.title, 'tr');
          });
        this.pool.set(items);
        this.poolLoading.set(false);
      },
      error: (err: { message?: string }) => {
        this.poolError.set(err?.message ?? 'Havuz yüklenemedi.');
        this.poolLoading.set(false);
      },
    });
  }

  reloadCalendar(): void {
    this.calendarLoading.set(true);
    this.calendarError.set('');
    const from = startOfMonth(this.cursor());
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);

    forkJoin({
      schedule: this.materialsApi.getSchedule(from.toISOString(), to.toISOString()),
    }).subscribe({
      next: ({ schedule }) => {
        this.events.set(schedule.filter((s) => s.status.toLowerCase() === 'scheduled'));
        this.calendarLoading.set(false);
      },
      error: (err: { message?: string }) => {
        this.calendarError.set(err?.message ?? 'Takvim yüklenemedi.');
        this.calendarLoading.set(false);
      },
    });
  }

  prevMonth(): void {
    const d = new Date(this.cursor());
    d.setMonth(d.getMonth() - 1);
    this.cursor.set(startOfMonth(d));
    this.reloadCalendar();
  }

  nextMonth(): void {
    const d = new Date(this.cursor());
    d.setMonth(d.getMonth() + 1);
    this.cursor.set(startOfMonth(d));
    this.reloadCalendar();
  }

  eventsFor(day: CalendarDay): MaterialScheduleItem[] {
    return this.eventsByDay().get(day.dateKey) ?? [];
  }

  onDragStart(id: number, event: DragEvent, source: 'pool' | 'calendar'): void {
    this.draggingId.set(id);
    this.dragSource.set(source);
    event.dataTransfer?.setData('text/plain', String(id));
    event.dataTransfer?.setData('application/x-drag-source', source);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = source === 'pool' ? 'copy' : 'move';
    }
  }

  onDragEnd(): void {
    this.draggingId.set(null);
    this.dragSource.set(null);
  }

  onDayDragOver(day: CalendarDay, event: DragEvent): void {
    if (day.isPast) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.dragSource() === 'pool' ? 'copy' : 'move';
    }
  }

  onDayDrop(day: CalendarDay, event: DragEvent): void {
    event.preventDefault();

    if (day.isPast) {
      this.calendarError.set('Geçmiş bir güne yayın zamanı ayarlanamaz.');
      return;
    }

    const raw = event.dataTransfer?.getData('text/plain') ?? '';
    const materialId = Number(raw);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      return;
    }

    const source =
      (event.dataTransfer?.getData('application/x-drag-source') as 'pool' | 'calendar' | '') ||
      this.dragSource() ||
      (this.pool().some((p) => p.id === materialId) && !this.scheduledIdSet().has(materialId)
        ? 'pool'
        : 'calendar');

    const fromPool = this.pool().find((p) => p.id === materialId);
    const fromEvent = this.events().find((e) => e.id === materialId);
    let time =
      fromEvent && source === 'calendar' ? formatTimeHHmm(new Date(fromEvent.at)) : '09:00';
    if (isScheduleInPast(day.dateKey, time)) {
      time = defaultFutureTimeForDate(day.dateKey);
    }
    const mode: 'create' | 'move' = source === 'pool' ? 'create' : 'move';

    this.calendarError.set('');
    this.modalError.set('');
    this.modal.set({
      materialId,
      title: fromPool?.title ?? fromEvent?.title ?? `Doküman #${materialId}`,
      dateKey: day.dateKey,
      time,
      mode,
      recurrenceKind: 'None',
    });
  }

  setModalTime(time: string): void {
    this.modal.update((m) => (m ? { ...m, time } : null));
    this.modalError.set('');
  }

  setModalRecurrenceKind(kind: 'None' | 'Weekly' | 'MonthlyDay'): void {
    this.modal.update((m) => (m ? { ...m, recurrenceKind: kind } : null));
  }

  closeModal(): void {
    this.modal.set(null);
    this.modalError.set('');
    this.savingSchedule.set(false);
  }

  confirmSchedule(): void {
    const state = this.modal();
    if (!state) {
      return;
    }
    const local = `${state.dateKey}T${state.time}`;
    const when = new Date(local);

    if (Number.isNaN(when.getTime())) {
      this.modalError.set('Geçersiz saat.');
      return;
    }

    if (when.getTime() <= Date.now()) {
      this.modalError.set('Yayın zamanı şu andan ileri bir tarih/saat olmalıdır.');
      return;
    }

    const dateObj = new Date(local);
    const dayOfWeek = dateObj.getDay() || 7; // Sunday is 0 in JS but usually 7 in .NET, wait .NET uses Sunday=0 or 7 depending on setup, but typically we can send 1=Mon...7=Sun or just use standard. Let's send day of week from 1-7 (Mon-Sun).
    const jsDay = dateObj.getDay();
    const dayOfWeekToSend = jsDay === 0 ? 7 : jsDay; 
    const iso = when.toISOString();

    const payload = {
      scheduledPublishAt: iso,
      recurrenceKind: state.recurrenceKind,
      recurrenceDayOfWeek: state.recurrenceKind === 'Weekly' ? dayOfWeekToSend : undefined,
      recurrenceDayOfMonth: state.recurrenceKind === 'MonthlyDay' ? dateObj.getDate() : undefined,
    };

    this.savingSchedule.set(true);
    const request$ =
      state.mode === 'create'
        ? this.materialsApi.createScheduledCopy(state.materialId, payload)
        : this.materialsApi.updateSchedule(state.materialId, payload);

    request$.subscribe({
      next: () => {
        this.savingSchedule.set(false);
        this.modalError.set('');
        this.modal.set(null);
        this.reloadAll();
      },
      error: (err: { message?: string }) => {
        this.savingSchedule.set(false);
        this.modalError.set(err?.message ?? 'Zamanlama kaydedilemedi.');
      },
    });
  }

  // Takvimden boş alana bırakınca “kaldır” akışı.
  onRemoveDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onRemoveDrop(event: DragEvent): void {
    event.preventDefault();

    const raw = event.dataTransfer?.getData('text/plain') ?? '';
    const materialId = Number(raw);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      return;
    }

    if (!this.scheduledIdSet().has(materialId)) {
      // Draft/Havuzdan sürüklediyse takvimden "kaldırma" çağrısı yapılmaz.
      return;
    }

    this.removeCandidateId.set(materialId);
    this.confirmOpen.set(true);
  }

  cancelRemove(): void {
    this.confirmOpen.set(false);
    this.removeCandidateId.set(null);
  }

  removeFromCalendar(): void {
    const id = this.removeCandidateId();
    if (!id) {
      this.cancelRemove();
      return;
    }

    this.materialsApi.cancelSchedule(id).subscribe({
      next: () => {
        this.cancelRemove();
        this.reloadAll();
      },
      error: (err: { message?: string }) => {
        this.cancelRemove();
        this.calendarError.set(err?.message ?? 'Takvimden kaldırma başarısız.');
      },
    });
  }

  openDetails(id: number): void {
    this.materialsApi.getById(id).subscribe({
      next: (material) => {
        this.detailsDoc.set(materialToDocumentListItem(material));
        this.viewers.set([]);
      },
      error: () => {
        this.detailsDoc.set(null);
      },
    });
  }

  closeDetails(): void {
    this.detailsDoc.set(null);
  }

  archiveDoc(doc: DocumentListItem): void {
    this.materialsApi.archive(doc.id).subscribe({
      next: () => {
        this.closeDetails();
        this.reloadAll();
      },
      error: (err: { message?: string }) => {
        this.calendarError.set(err?.message ?? 'Arşivleme başarısız.');
      },
    });
  }

  publishNow(doc: DocumentListItem): void {
    this.materialsApi.publishNow(doc.id).subscribe({
      next: () => {
        this.closeDetails();
        this.reloadAll();
      },
      error: (err: { message?: string }) => {
        this.calendarError.set(err?.message ?? 'Yayınlama başarısız.');
      },
    });
  }

  downloadFile(event: { materialId: number; fileId: number; fileName: string }): void {
    this.materialsApi.downloadFile(event.materialId, event.fileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = event.fileName || `document-${event.fileId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: { message?: string }) => {
        this.calendarError.set(err?.message ?? 'Dosya indirilemedi.');
      },
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase() === 'scheduled' ? 'cal-event--scheduled' : 'cal-event';
  }

  timeLabel(iso: string): string {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso)
    );
  }

}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMonthGrid(monthStart: Date): CalendarDay[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayKey = toDateKey(new Date());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dateKey = toDateKey(d);
    days.push({
      dateKey,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
    });
  }
  return days;
}

function formatTimeHHmm(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isScheduleInPast(dateKey: string, time: string): boolean {
  const when = new Date(`${dateKey}T${time}`);
  if (Number.isNaN(when.getTime())) {
    return true;
  }
  return when.getTime() <= Date.now();
}

/** Bugün için varsayılan 09:00 geçmişse bir sonraki saate yuvarla. */
function defaultFutureTimeForDate(dateKey: string): string {
  const candidate = new Date(`${dateKey}T09:00`);
  if (!Number.isNaN(candidate.getTime()) && candidate.getTime() > Date.now()) {
    return '09:00';
  }
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  if (toDateKey(next) !== dateKey) {
    // Gün bitmişse yine de 23:59 öner (kayıt yine backend/FE doğrulamasında reddedilir).
    return '23:59';
  }
  return formatTimeHHmm(next);
}

function readStoredPoolWidth(): number {
  const raw = localStorage.getItem(POOL_WIDTH_KEY);
  if (!raw) {
    return POOL_DEFAULT_WIDTH;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampPoolWidth(parsed) : POOL_DEFAULT_WIDTH;
}

function clampPoolWidth(width: number): number {
  return Math.min(POOL_MAX_WIDTH, Math.max(POOL_MIN_WIDTH, Math.round(width)));
}

