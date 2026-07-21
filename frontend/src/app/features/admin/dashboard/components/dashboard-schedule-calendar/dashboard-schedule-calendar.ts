/** Dashboard — salt okunur aylık yayın takvimi. */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaterialsService } from '../../../../../core/services/materials.service';
import type { MaterialScheduleItem } from '../../../../../core/models/material.interface';

interface CalendarDay {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-dashboard-schedule-calendar',
  imports: [RouterLink],
  templateUrl: './dashboard-schedule-calendar.html',
  styleUrl: './dashboard-schedule-calendar.scss',
})
export class DashboardScheduleCalendar implements OnInit {
  private readonly materialsApi = inject(MaterialsService);

  readonly cursor = signal(startOfMonth(new Date()));
  readonly events = signal<MaterialScheduleItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

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
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    }
    return map;
  });

  readonly scheduledCount = computed(
    () => this.events().filter((e) => e.status.toLowerCase() === 'scheduled').length
  );

  readonly publishedCount = computed(
    () => this.events().filter((e) => e.status.toLowerCase() === 'active').length
  );

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

  goToday(): void {
    this.cursor.set(startOfMonth(new Date()));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    const from = startOfMonth(this.cursor());
    const to = new Date(from);
    to.setMonth(to.getMonth() + 1);

    this.materialsApi.getSchedule(from.toISOString(), to.toISOString()).subscribe({
      next: (items) => {
        this.events.set(items);
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

  timeLabel(iso: string): string {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso)
    );
  }

  isScheduled(ev: MaterialScheduleItem): boolean {
    return ev.status.toLowerCase() === 'scheduled';
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
  const startOffset = (first.getDay() + 6) % 7;
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
