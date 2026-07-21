/** Admin — yayın takvimi: ay görünümü, sürükle-bırak, saat modalı. */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MaterialsService } from '../../../../../core/services/materials.service';
import type { Material, MaterialScheduleItem } from '../../../../../core/models/material.interface';

interface CalendarDay {
  dateKey: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

interface ScheduleModalState {
  materialId: number;
  title: string;
  dateKey: string;
  time: string;
}

@Component({
  selector: 'app-docs-schedule-calendar-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './docs-schedule-calendar-page.html',
  styleUrl: './docs-schedule-calendar-page.scss',
})
export class DocsScheduleCalendarPage implements OnInit {
  private readonly materialsApi = inject(MaterialsService);

  readonly cursor = signal(startOfMonth(new Date()));
  readonly events = signal<MaterialScheduleItem[]>([]);
  readonly pool = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly draggingId = signal<number | null>(null);
  readonly modal = signal<ScheduleModalState | null>(null);
  readonly saving = signal(false);

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(this.cursor())
  );

  readonly days = computed(() => buildMonthGrid(this.cursor()));

  readonly eventsByDay = computed(() => {
    const map = new Map<string, MaterialScheduleItem[]>();
    for (const ev of this.events()) {
      const key = toDateKey(new Date(ev.at));
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  });

  ngOnInit(): void {
    this.reload();
  }

  prevMonth(): void {
    const d = new Date(this.cursor());
    d.setMonth(d.getMonth() - 1);
    this.cursor.set(startOfMonth(d));
    this.reload();
  }

  nextMonth(): void {
    const d = new Date(this.cursor());
    d.setMonth(d.getMonth() + 1);
    this.cursor.set(startOfMonth(d));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    const from = startOfMonth(this.cursor());
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);

    forkJoin({
      schedule: this.materialsApi.getSchedule(from.toISOString(), to.toISOString()),
      scheduled: this.materialsApi.list({ status: 'Scheduled' }),
      drafts: this.materialsApi.list({ status: 'Draft' }),
    }).subscribe({
      next: ({ schedule, scheduled, drafts }) => {
        this.events.set(schedule);
        this.pool.set(
          [...drafts, ...scheduled].filter(
            (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
          )
        );
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Takvim yüklenemedi.');
        this.loading.set(false);
      },
    });
  }

  eventsFor(day: CalendarDay): MaterialScheduleItem[] {
    return this.eventsByDay().get(day.dateKey) ?? [];
  }

  onDragStart(materialId: number, event: DragEvent): void {
    this.draggingId.set(materialId);
    event.dataTransfer?.setData('text/plain', String(materialId));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.draggingId.set(null);
  }

  onDayDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDayDrop(day: CalendarDay, event: DragEvent): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('text/plain') ?? String(this.draggingId() ?? '');
    const materialId = Number(raw);
    this.draggingId.set(null);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      return;
    }

    const fromPool = this.pool().find((m) => m.id === materialId);
    const fromEvent = this.events().find((e) => e.id === materialId);
    const title = fromPool?.title ?? fromEvent?.title ?? `Doküman #${materialId}`;
    const existingTime = fromEvent ? formatTimeLocal(new Date(fromEvent.at)) : '09:00';

    this.modal.set({
      materialId,
      title,
      dateKey: day.dateKey,
      time: existingTime,
    });
  }

  openEvent(ev: MaterialScheduleItem): void {
    if (ev.status.toLowerCase() !== 'scheduled') {
      return;
    }
    const at = new Date(ev.at);
    this.modal.set({
      materialId: ev.id,
      title: ev.title,
      dateKey: toDateKey(at),
      time: formatTimeLocal(at),
    });
  }

  closeModal(): void {
    this.modal.set(null);
  }

  updateModalTime(time: string): void {
    this.modal.update((m) => (m ? { ...m, time } : null));
  }

  confirmSchedule(): void {
    const state = this.modal();
    if (!state) {
      return;
    }
    const local = `${state.dateKey}T${state.time}`;
    const iso = new Date(local).toISOString();
    if (Number.isNaN(new Date(local).getTime())) {
      this.error.set('Geçersiz saat.');
      return;
    }

    this.saving.set(true);
    const fromPool = this.pool().find((m) => m.id === state.materialId);
    const recurrenceKind =
      (fromPool?.recurrenceKind as 'None' | 'Weekly' | 'MonthlyDay' | undefined) ?? 'None';
    this.materialsApi
      .updateSchedule(state.materialId, {
        scheduledPublishAt: iso,
        recurrenceKind,
        recurrenceDayOfWeek: fromPool?.recurrenceDayOfWeek ?? null,
        recurrenceDayOfMonth: fromPool?.recurrenceDayOfMonth ?? null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.modal.set(null);
          this.reload();
        },
        error: (err: { message?: string }) => {
          this.saving.set(false);
          this.error.set(err?.message ?? 'Zamanlama kaydedilemedi.');
        },
      });
  }

  statusClass(status: string): string {
    return `cal-event--${status.toLowerCase()}`;
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

function formatTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    });
  }
  return days;
}
