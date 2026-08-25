/** Arama + kategori + çoklu marka + özel tarih aralığı (native date picker taşmasın diye). */
import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { parseIsoDate, startOfMonth, toDateKey } from '../../../../../shared/utils/calendar-date.util';

type DateField = 'from' | 'to';

interface CalendarDay {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-docs-list-filters',
  imports: [FormsModule],
  templateUrl: './docs-list-filters.html',
  styleUrl: '../../styles/docs-list-filters.scss',
})
export class DocsListFilters {
  readonly search = input('');
  readonly category = input('');
  readonly brands = input<string[]>([]);
  readonly categoryOptions = input<string[]>([]);
  readonly brandOptions = input<string[]>([]);
  /** ISO tarih (YYYY-MM-DD) — yayın tarihi aralığının başlangıcı. */
  readonly dateFrom = input('');
  /** ISO tarih (YYYY-MM-DD) — yayın tarihi aralığının bitişi. */
  readonly dateTo = input('');

  readonly searchChange = output<string>();
  readonly categoryChange = output<string>();
  readonly brandsChange = output<string[]>();
  readonly dateFromChange = output<string>();
  readonly dateToChange = output<string>();

  readonly brandMenuOpen = signal(false);
  readonly datePickerField = signal<DateField | null>(null);
  readonly calendarCursor = signal(startOfMonth(new Date()));

  readonly brandTriggerLabel = computed(() => {
    const selected = this.brands();
    if (selected.length === 0) {
      return 'Marka';
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${selected.length} marka`;
  });

  readonly dateFromLabel = computed(() => formatDisplayDate(this.dateFrom()) || 'Başlangıç');
  readonly dateToLabel = computed(() => formatDisplayDate(this.dateTo()) || 'Bitiş');

  readonly datePickerTitle = computed(() =>
    this.datePickerField() === 'to' ? 'Bitiş tarihi' : 'Başlangıç tarihi'
  );

  readonly calendarMonthLabel = computed(() =>
    new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(this.calendarCursor())
  );

  /** "Bugün" seçimi aktif alan + mevcut aralık ile geçerli mi? (değilse buton devre dışı). */
  readonly todayPickable = computed(() => {
    const field = this.datePickerField();
    const today = toDateKey(new Date());
    if (field === 'from') {
      return !(this.dateTo() && today > this.dateTo());
    }
    if (field === 'to') {
      return !(this.dateFrom() && today < this.dateFrom());
    }
    return true;
  });

  readonly calendarDays = computed(() => {
    const field = this.datePickerField();
    const selected = field === 'to' ? this.dateTo() : this.dateFrom();
    const min = field === 'to' ? this.dateFrom() || null : null;
    const max = field === 'from' ? this.dateTo() || null : null;
    return buildMonthGrid(this.calendarCursor(), selected, min, max);
  });

  toggleBrandMenu(): void {
    this.closeDatePicker();
    this.brandMenuOpen.update((open) => !open);
  }

  isBrandSelected(brand: string): boolean {
    return this.brands().includes(brand);
  }

  toggleBrand(brand: string, checked: boolean): void {
    const current = this.brands();
    const next = checked ? [...current, brand] : current.filter((b) => b !== brand);
    this.brandsChange.emit(next);
  }

  clearBrands(): void {
    this.brandsChange.emit([]);
  }

  openDatePicker(field: DateField, event: Event): void {
    event.stopPropagation();
    this.brandMenuOpen.set(false);
    const current = field === 'from' ? this.dateFrom() : this.dateTo();
    const seed = current
      ? parseIsoDate(current)
      : field === 'to' && this.dateFrom()
        ? parseIsoDate(this.dateFrom())
        : new Date();
    this.calendarCursor.set(startOfMonth(seed ?? new Date()));
    this.datePickerField.set(field);
  }

  closeDatePicker(): void {
    this.datePickerField.set(null);
  }

  prevCalendarMonth(): void {
    const d = new Date(this.calendarCursor());
    d.setMonth(d.getMonth() - 1);
    this.calendarCursor.set(startOfMonth(d));
  }

  nextCalendarMonth(): void {
    const d = new Date(this.calendarCursor());
    d.setMonth(d.getMonth() + 1);
    this.calendarCursor.set(startOfMonth(d));
  }

  selectCalendarDay(day: CalendarDay): void {
    if (day.isDisabled) {
      return;
    }
    const field = this.datePickerField();
    if (field === 'from') {
      // Bitiş tarihinden sonraki günler zaten devre dışı (max = dateTo),
      // bu yüzden burada geçersiz aralık oluşamaz.
      this.dateFromChange.emit(day.dateKey);
    } else if (field === 'to') {
      this.dateToChange.emit(day.dateKey);
    }
    this.closeDatePicker();
  }

  clearActiveDateField(): void {
    const field = this.datePickerField();
    if (field === 'from') {
      this.dateFromChange.emit('');
    } else if (field === 'to') {
      this.dateToChange.emit('');
    }
    this.closeDatePicker();
  }

  pickToday(): void {
    const today = toDateKey(new Date());
    const field = this.datePickerField();
    if (field === 'from') {
      if (this.dateTo() && today > this.dateTo()) {
        return;
      }
      this.dateFromChange.emit(today);
    } else if (field === 'to') {
      if (this.dateFrom() && today < this.dateFrom()) {
        return;
      }
      this.dateToChange.emit(today);
    }
    this.closeDatePicker();
  }

  clearDateRange(): void {
    this.dateFromChange.emit('');
    this.dateToChange.emit('');
    this.closeDatePicker();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.docs-filters__brand')) {
      this.brandMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDatePicker();
    this.brandMenuOpen.set(false);
  }
}

function formatDisplayDate(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function buildMonthGrid(
  monthStart: Date,
  selected: string,
  min: string | null,
  max: string | null
): CalendarDay[] {
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
      isSelected: dateKey === selected,
      isDisabled: (!!min && dateKey < min) || (!!max && dateKey > max),
    });
  }
  return days;
}
