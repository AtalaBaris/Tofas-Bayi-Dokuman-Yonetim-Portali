using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Exceptions;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BayiPortal.Infrastructure.Services;

public class ExportService : IExportService
{
    private const string XlsxMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private const string PdfMimeType = "application/pdf";

    public (byte[] Content, string FileName, string MimeType) ExportAccessLogs(
        IReadOnlyList<AccessLogResponse> items, string format)
    {
        var timestamp = DateTime.UtcNow.AddHours(3).ToString("yyyyMMdd-HHmmss");

        return format switch
        {
            "xlsx" => (BuildAccessLogsXlsx(items), $"erisim-kayitlari-{timestamp}.xlsx", XlsxMimeType),
            "pdf" => (BuildAccessLogsPdf(items), $"erisim-kayitlari-{timestamp}.pdf", PdfMimeType),
            _ => throw new ValidationException("Geçersiz dışa aktarma formatı. 'xlsx' veya 'pdf' olmalı.")
        };
    }

    public (byte[] Content, string FileName, string MimeType) ExportAccessReport(
        MaterialAccessReportResponse report, string format)
    {
        var timestamp = DateTime.UtcNow.AddHours(3).ToString("yyyyMMdd-HHmmss");
        var safeTitle = string.Join("-", report.MaterialTitle.Split(Path.GetInvalidFileNameChars()));

        return format switch
        {
            "xlsx" => (BuildAccessReportXlsx(report), $"okuma-raporu-{safeTitle}-{timestamp}.xlsx", XlsxMimeType),
            "pdf" => (BuildAccessReportPdf(report), $"okuma-raporu-{safeTitle}-{timestamp}.pdf", PdfMimeType),
            _ => throw new ValidationException("Geçersiz dışa aktarma formatı. 'xlsx' veya 'pdf' olmalı.")
        };
    }

    private static readonly string[] AccessLogHeaders =
        { "Kullanıcı", "Rol", "Bayi/Tip", "Aksiyon", "Açıklama", "Durum", "Tarih", "Saat", "IP Adresi" };

    private static byte[] BuildAccessLogsXlsx(IReadOnlyList<AccessLogResponse> items)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Erişim Kayıtları");

        for (var col = 0; col < AccessLogHeaders.Length; col++)
        {
            sheet.Cell(1, col + 1).Value = AccessLogHeaders[col];
        }
        sheet.Row(1).Style.Font.Bold = true;

        var row = 2;
        foreach (var item in items)
        {
            sheet.Cell(row, 1).Value = item.UserName;
            sheet.Cell(row, 2).Value = item.UserRole;
            sheet.Cell(row, 3).Value = item.DealerName ?? item.UserType;
            sheet.Cell(row, 4).Value = item.Action;
            sheet.Cell(row, 5).Value = item.Description;
            sheet.Cell(row, 6).Value = item.LoginStatus;
            sheet.Cell(row, 7).Value = item.Date;
            sheet.Cell(row, 8).Value = item.Time;
            sheet.Cell(row, 9).Value = item.IpAddress;
            row++;
        }

        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static byte[] BuildAccessLogsPdf(IReadOnlyList<AccessLogResponse> items)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(24);
                page.DefaultTextStyle(x => x.FontSize(8));

                page.Header().Text("Sistem Erişim Kayıtları").FontSize(16).Bold();

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        for (var i = 0; i < AccessLogHeaders.Length; i++)
                        {
                            columns.RelativeColumn();
                        }
                    });

                    table.Header(header =>
                    {
                        foreach (var title in AccessLogHeaders)
                        {
                            header.Cell().Element(HeaderCell).Text(title).Bold();
                        }
                    });

                    foreach (var item in items)
                    {
                        table.Cell().Element(BodyCell).Text(item.UserName);
                        table.Cell().Element(BodyCell).Text(item.UserRole);
                        table.Cell().Element(BodyCell).Text(item.DealerName ?? item.UserType);
                        table.Cell().Element(BodyCell).Text(item.Action);
                        table.Cell().Element(BodyCell).Text(item.Description);
                        table.Cell().Element(BodyCell).Text(item.LoginStatus);
                        table.Cell().Element(BodyCell).Text(item.Date);
                        table.Cell().Element(BodyCell).Text(item.Time);
                        table.Cell().Element(BodyCell).Text(item.IpAddress);
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static byte[] BuildAccessReportXlsx(MaterialAccessReportResponse report)
    {
        using var workbook = new XLWorkbook();

        var summary = workbook.Worksheets.Add("Özet");
        summary.Cell(1, 1).Value = "Doküman";
        summary.Cell(1, 2).Value = report.MaterialTitle;
        summary.Cell(2, 1).Value = "Hedef Kitle";
        summary.Cell(2, 2).Value = report.AudienceCount;
        summary.Cell(3, 1).Value = "Görüntüleyen";
        summary.Cell(3, 2).Value = report.ViewedCount;
        summary.Cell(4, 1).Value = "Bekleyen";
        summary.Cell(4, 2).Value = report.PendingCount;
        summary.Cell(5, 1).Value = "Katılım Oranı (%)";
        summary.Cell(5, 2).Value = report.EngagementPercent;
        summary.Column(1).Style.Font.Bold = true;
        summary.Columns().AdjustToContents();

        var viewed = workbook.Worksheets.Add("Görüntüleyenler");
        for (var col = 0; col < AccessLogHeaders.Length; col++)
        {
            viewed.Cell(1, col + 1).Value = AccessLogHeaders[col];
        }
        viewed.Row(1).Style.Font.Bold = true;
        var row = 2;
        foreach (var log in report.AccessLogs)
        {
            viewed.Cell(row, 1).Value = log.UserName;
            viewed.Cell(row, 2).Value = log.UserRole;
            viewed.Cell(row, 3).Value = log.DealerName ?? log.UserType;
            viewed.Cell(row, 4).Value = log.Action;
            viewed.Cell(row, 5).Value = log.Description;
            viewed.Cell(row, 6).Value = log.LoginStatus;
            viewed.Cell(row, 7).Value = log.Date;
            viewed.Cell(row, 8).Value = log.Time;
            viewed.Cell(row, 9).Value = log.IpAddress;
            row++;
        }
        viewed.Columns().AdjustToContents();

        var pending = workbook.Worksheets.Add("Bekleyenler");
        pending.Cell(1, 1).Value = "Kullanıcı";
        pending.Cell(1, 2).Value = "E-posta";
        pending.Cell(1, 3).Value = "Bayi";
        pending.Row(1).Style.Font.Bold = true;
        row = 2;
        foreach (var user in report.PendingUsers)
        {
            pending.Cell(row, 1).Value = user.UserName;
            pending.Cell(row, 2).Value = user.Email;
            pending.Cell(row, 3).Value = user.DealerName;
            row++;
        }
        pending.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static byte[] BuildAccessReportPdf(MaterialAccessReportResponse report)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(24);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text("Bayi Okuma Raporu").FontSize(16).Bold();
                    col.Item().Text(report.MaterialTitle).FontSize(12);
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingVertical(8).Row(row =>
                    {
                        row.RelativeItem().Text($"Hedef Kitle: {report.AudienceCount}");
                        row.RelativeItem().Text($"Görüntüleyen: {report.ViewedCount}");
                        row.RelativeItem().Text($"Bekleyen: {report.PendingCount}");
                        row.RelativeItem().Text($"Katılım: %{report.EngagementPercent}");
                    });

                    col.Item().PaddingTop(8).Text("Görüntüleyenler").Bold();
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2);
                            columns.RelativeColumn();
                            columns.RelativeColumn(2);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).Text("Kullanıcı").Bold();
                            header.Cell().Element(HeaderCell).Text("Bayi").Bold();
                            header.Cell().Element(HeaderCell).Text("Aksiyon").Bold();
                            header.Cell().Element(HeaderCell).Text("Tarih").Bold();
                            header.Cell().Element(HeaderCell).Text("Saat").Bold();
                        });

                        foreach (var log in report.AccessLogs)
                        {
                            table.Cell().Element(BodyCell).Text(log.UserName);
                            table.Cell().Element(BodyCell).Text(log.DealerName ?? log.UserType);
                            table.Cell().Element(BodyCell).Text(log.Action);
                            table.Cell().Element(BodyCell).Text(log.Date);
                            table.Cell().Element(BodyCell).Text(log.Time);
                        }
                    });

                    col.Item().PaddingTop(12).Text("Bekleyenler").Bold();
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).Text("Kullanıcı").Bold();
                            header.Cell().Element(HeaderCell).Text("E-posta").Bold();
                            header.Cell().Element(HeaderCell).Text("Bayi").Bold();
                        });

                        foreach (var user in report.PendingUsers)
                        {
                            table.Cell().Element(BodyCell).Text(user.UserName);
                            table.Cell().Element(BodyCell).Text(user.Email);
                            table.Cell().Element(BodyCell).Text(user.DealerName);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.Background(Colors.Grey.Lighten2).Padding(4).BorderBottom(1).BorderColor(Colors.Grey.Darken1);

    private static IContainer BodyCell(IContainer container) =>
        container.Padding(4).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1);
}
