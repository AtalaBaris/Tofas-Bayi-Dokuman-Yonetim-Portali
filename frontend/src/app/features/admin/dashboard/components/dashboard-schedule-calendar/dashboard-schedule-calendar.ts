/** Dashboard — salt okunur aylık yayın takvimi (mobilde haftalık liste). */
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaterialsService } from '../../../../../core/services/materials.service';
import type { MaterialScheduleItem } from '../../../../../core/models/material.interface';
import { startOfMonth, toDateKey } from '../../../../../shared/utils/calendar-date.util';

interface CalendarDay {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  weekdayLabel: string;
}

const WEEKDAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const COMPACT_MQ = '(max-width: 767px)';

@Component({
  selector: 'app-dashboard-schedule-calendar',
  imports: [RouterLink],
  templateUrl: './dashboard-schedule-calendar.html',
  styleUrl: './dashboard-schedule-calendar.scss',
})
export class DashboardScheduleCalendar implements OnInit {
  private readonly materialsApi = inject(MaterialsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Mobil: haftalık liste; masaüstü: ay ızgarası. */
  readonly compact = signal(false);
  readonly cursor = signal(startOfWeek(new Date()));
  readonly events = signal<MaterialScheduleItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly monthLabel = computed(() => {
    if (this.compact()) {
      const start = this.cursor();
      const end = addDays(start, 6);
      const fmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
      return `${fmt.format(start)} – ${fmt.format(end)}`;
    }
    return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
      this.cursor()
    );
  });

  readonly days = computed(() =>
    this.compact() ? buildWeekDays(this.cursor()) : buildMonthGrid(this.cursor())
  );

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
    this.bindCompactMedia();
    this.reload();
  }

  prev(): void {
    if (this.compact()) {
      this.cursor.set(addDays(this.cursor(), -7));
    } else {
      const d = new Date(this.cursor());
      d.setMonth(d.getMonth() - 1);
      this.cursor.set(startOfMonth(d));
    }
    this.reload();
  }

  next(): void {
    if (this.compact()) {
      this.cursor.set(addDays(this.cursor(), 7));
    } else {
      const d = new Date(this.cursor());
      d.setMonth(d.getMonth() + 1);
      this.cursor.set(startOfMonth(d));
    }
    this.reload();
  }

  goToday(): void {
    this.cursor.set(this.compact() ? startOfWeek(new Date()) : startOfMonth(new Date()));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');

    let from: Date;
    let to: Date;
    if (this.compact()) {
      from = this.cursor();
      to = addDays(from, 7);
    } else {
      from = startOfMonth(this.cursor());
      to = new Date(from);
      to.setMonth(to.getMonth() + 1);
    }

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

  private bindCompactMedia(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      this.cursor.set(startOfMonth(new Date()));
      return;
    }

    const mq = window.matchMedia(COMPACT_MQ);
    const syncCursor = (matches: boolean) => {
      this.compact.set(matches);
      this.cursor.set(matches ? startOfWeek(new Date()) : startOfMonth(new Date()));
    };

    syncCursor(mq.matches);

    const onChange = (event: MediaQueryListEvent) => {
      syncCursor(event.matches);
      this.reload();
    };
    mq.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', onChange));
  }
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const mondayOffset = (day + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - mondayOffset);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}


function buildWeekDays(weekStart: Date): CalendarDay[] {
  const todayKey = toDateKey(new Date());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const dateKey = toDateKey(d);
    days.push({
      dateKey,
      day: d.getDate(),
      inMonth: true,
      isToday: dateKey === todayKey,
      weekdayLabel: WEEKDAY_SHORT[i],
    });
  }
  return days;
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
      weekdayLabel: WEEKDAY_SHORT[(startOffset + i) % 7],
    });
  }
  return days;
}
