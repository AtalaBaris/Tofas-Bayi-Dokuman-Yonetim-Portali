using BayiPortal.Core.Enums;
using BayiPortal.Core.Exceptions;

namespace BayiPortal.Application.Helpers;

public static class ScheduleRecurrenceHelper
{
    public static DateTime NormalizeUtc(DateTime value)
    {
        if (value.Kind == DateTimeKind.Unspecified)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        if (value.Kind == DateTimeKind.Local)
        {
            return value.ToUniversalTime();
        }

        return value;
    }

    public static void ValidateRecurrence(RecurrenceKind kind, int? dayOfWeek, int? dayOfMonth)
    {
        switch (kind)
        {
            case RecurrenceKind.None:
                return;
            case RecurrenceKind.Weekly:
                if (!dayOfWeek.HasValue || dayOfWeek.Value is < 0 or > 6)
                {
                    throw new ValidationException("Haftalık tekrar için geçerli bir haftanın günü (0–6) gerekli.");
                }
                return;
            case RecurrenceKind.MonthlyDay:
                if (!dayOfMonth.HasValue || dayOfMonth.Value is < 1 or > 28)
                {
                    throw new ValidationException("Aylık tekrar için gün 1–28 arasında olmalıdır.");
                }
                return;
            default:
                throw new ValidationException("Geçersiz tekrar türü.");
        }
    }

    public static DateTime ComputeNextOccurrence(DateTime fromUtc, RecurrenceKind kind, int? dayOfWeek, int? dayOfMonth)
    {
        fromUtc = NormalizeUtc(fromUtc);
        return kind switch
        {
            RecurrenceKind.Weekly => NextWeekly(fromUtc, dayOfWeek!.Value),
            RecurrenceKind.MonthlyDay => NextMonthlyDay(fromUtc, dayOfMonth!.Value),
            _ => throw new ValidationException("Tekrar türü None iken sonraki tarih hesaplanamaz.")
        };
    }

    private static DateTime NextWeekly(DateTime fromUtc, int dayOfWeek)
    {
        var target = (DayOfWeek)dayOfWeek;
        var next = fromUtc.AddDays(1);
        while (next.DayOfWeek != target)
        {
            next = next.AddDays(1);
        }

        return new DateTime(next.Year, next.Month, next.Day, fromUtc.Hour, fromUtc.Minute, fromUtc.Second, DateTimeKind.Utc);
    }

    private static DateTime NextMonthlyDay(DateTime fromUtc, int dayOfMonth)
    {
        var year = fromUtc.Year;
        var month = fromUtc.Month + 1;
        if (month > 12)
        {
            month = 1;
            year++;
        }

        return new DateTime(year, month, dayOfMonth, fromUtc.Hour, fromUtc.Minute, fromUtc.Second, DateTimeKind.Utc);
    }
}
