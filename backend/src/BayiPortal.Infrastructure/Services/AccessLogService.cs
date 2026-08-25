using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BayiPortal.Application.DTOs.Requests;
using BayiPortal.Application.DTOs.Responses;
using BayiPortal.Application.Interfaces.Services;
using BayiPortal.Core.Entities;
using BayiPortal.Core.Enums;
using BayiPortal.Infrastructure.Data.Contexts;
using BayiPortal.Infrastructure.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Services;

public class AccessLogService : IAccessLogService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IExportService _exportService;

    public AccessLogService(
        ApplicationDbContext dbContext,
        IHttpContextAccessor httpContextAccessor,
        IExportService exportService)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
        _exportService = exportService;
    }

    public async Task LogAsync(
        int? userId,
        string? userName,
        int? materialId,
        AccessAction action,
        string description,
        AccessResult? loginStatus = null,
        CancellationToken cancellationToken = default,
        int? materialFileId = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        // If userId is provided but userName is null, retrieve user email
        if (userId.HasValue && string.IsNullOrEmpty(userName))
        {
            var user = await _dbContext.Users.FindAsync(new object[] { userId.Value }, cancellationToken);
            if (user != null)
            {
                userName = user.Email;
            }
        }

        var log = new AccessLog
        {
            UserId = userId,
            UserName = userName,
            MaterialId = materialId,
            MaterialFileId = materialFileId,
            Action = action,
            Description = description,
            LoginStatus = loginStatus ?? AccessResult.NotApplicable,
            ViewedAtUtc = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _dbContext.AccessLogs.Add(log);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Dictionary<int, string>> GetAccessStatusesAsync(
        int userId, IReadOnlyCollection<int> materialIds, CancellationToken cancellationToken = default)
    {
        if (materialIds.Count == 0)
        {
            return new Dictionary<int, string>();
        }

        var logs = await _dbContext.AccessLogs
            .Where(x => x.UserId == userId
                && x.MaterialId != null
                && materialIds.Contains(x.MaterialId.Value)
                && (x.Action == AccessAction.View || x.Action == AccessAction.Download))
            .Select(x => new { MaterialId = x.MaterialId!.Value, x.Action })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<int, string>();
        foreach (var log in logs)
        {
            var status = log.Action == AccessAction.Download ? "downloaded" : "viewed";
            if (status == "downloaded" || !result.ContainsKey(log.MaterialId))
            {
                result[log.MaterialId] = status;
            }
        }

        return result;
    }

    public async Task<AccessLogTrendResponse> GetTrendAsync(
        string period, CancellationToken cancellationToken = default)
    {
        var nowLocal = DateTime.UtcNow.AddHours(3);

        if (string.Equals(period, "year", StringComparison.OrdinalIgnoreCase))
        {
            var yearStartUtc = new DateTime(nowLocal.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-3);
            var timestamps = await _dbContext.AccessLogs
                .Where(x => x.ViewedAtUtc >= yearStartUtc
                    && (x.Action == AccessAction.View || x.Action == AccessAction.Download))
                .Select(x => x.ViewedAtUtc)
                .ToListAsync(cancellationToken);

            var byMonth = timestamps
                .GroupBy(t => t.AddHours(3).Month)
                .ToDictionary(g => g.Key, g => g.Count());

            var monthNames = new[] { "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara" };
            var points = Enumerable.Range(1, 12)
                .Select(month => new AccessLogTrendPointResponse
                {
                    Label = monthNames[month - 1],
                    Count = byMonth.GetValueOrDefault(month)
                })
                .ToList();

            return new AccessLogTrendResponse { Points = points };
        }
        else
        {
            var startLocalDate = nowLocal.Date.AddDays(-29);
            var startUtc = startLocalDate.AddHours(-3);
            var timestamps = await _dbContext.AccessLogs
                .Where(x => x.ViewedAtUtc >= startUtc
                    && (x.Action == AccessAction.View || x.Action == AccessAction.Download))
                .Select(x => x.ViewedAtUtc)
                .ToListAsync(cancellationToken);

            var byDay = timestamps
                .GroupBy(t => t.AddHours(3).Date)
                .ToDictionary(g => g.Key, g => g.Count());

            var points = Enumerable.Range(0, 30)
                .Select(offset =>
                {
                    var day = startLocalDate.AddDays(offset);
                    return new AccessLogTrendPointResponse
                    {
                        Label = day.ToString("dd.MM"),
                        Count = byDay.GetValueOrDefault(day)
                    };
                })
                .ToList();

            return new AccessLogTrendResponse { Points = points };
        }
    }

    public async Task<AccessLogListResponse> GetListAsync(
        AccessLogListQuery query,
        CancellationToken cancellationToken = default)
    {
        var dbQuery = BuildFilteredQuery(query);

        var totalCount = await dbQuery.CountAsync(cancellationToken);

        var items = await dbQuery
            .OrderByDescending(x => x.ViewedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return new AccessLogListResponse
        {
            Items = items.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<(byte[] Content, string FileName, string MimeType)> ExportAsync(
        AccessLogListQuery query, string format, CancellationToken cancellationToken = default)
    {
        var dbQuery = BuildFilteredQuery(query);

        var items = await dbQuery
            .OrderByDescending(x => x.ViewedAtUtc)
            .Take(ExportRowLimit)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToResponse).ToList();
        return _exportService.ExportAccessLogs(dtos, format);
    }

    /// <summary>Dışa aktarımda tek seferde işlenecek azami satır sayısı (bellek/performans koruması).</summary>
    private const int ExportRowLimit = 20000;

    private IQueryable<AccessLog> BuildFilteredQuery(AccessLogListQuery query)
    {
        var dbQuery = _dbContext.AccessLogs
            .Include(x => x.User)
                .ThenInclude(u => u!.Dealer)
            .AsNoTracking()
            .AsQueryable();

        // MaterialId filter
        if (query.MaterialId.HasValue)
        {
            dbQuery = dbQuery.Where(x => x.MaterialId == query.MaterialId.Value);
        }

        // ContentManager yetki kısıtlaması: Giriş/Çıkış loglarını göremez, sadece doküman hareketlerini görebilir
        if (query.ExcludeAuthLogs)
        {
            dbQuery = dbQuery.Where(x => x.Action != AccessAction.Login && x.Action != AccessAction.Logout);
        }

        // Keyword filter (matches username / email) — culture'dan bağımsız, case-insensitive (Npgsql ILIKE)
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keywordPattern = $"%{query.Keyword.Trim().EscapeLikePattern()}%";
            dbQuery = dbQuery.Where(x =>
                (x.UserName != null && EF.Functions.ILike(x.UserName, keywordPattern, LikePatternExtensions.EscapeCharacter)) ||
                (x.User != null && EF.Functions.ILike(x.User.Email, keywordPattern, LikePatternExtensions.EscapeCharacter)));
        }

        // Role filter
        if (!string.IsNullOrWhiteSpace(query.Role) && Enum.TryParse<RoleType>(query.Role, out var roleFilter))
        {
            dbQuery = dbQuery.Where(x => x.User != null && x.User.Role == roleFilter);
        }

        // Action filter — tek değer veya virgülle ayrılmış liste (örn. "Giriş,Çıkış"); frontend hâlâ Türkçe
        // görünüm metnini gönderiyor, bu yüzden filtrelemeden önce AccessAction'a çevrilir.
        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var actions = query.Action
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(a => AccessActionExtensions.TryParseDisplayString(a, out var parsed) ? (AccessAction?)parsed : null)
                .Where(a => a.HasValue)
                .Select(a => a!.Value)
                .ToArray();

            if (actions.Length > 0)
            {
                dbQuery = dbQuery.Where(x => actions.Contains(x.Action));
            }
        }

        // Status filter — frontend Türkçe görünüm metni gönderiyor ("Başarılı"/"Başarısız"/"N/A")
        if (!string.IsNullOrWhiteSpace(query.Status) && AccessResultExtensions.TryParseDisplayString(query.Status, out var statusFilter))
        {
            dbQuery = dbQuery.Where(x => x.LoginStatus == statusFilter);
        }

        // Date range filters
        if (query.StartDate.HasValue)
        {
            dbQuery = dbQuery.Where(x => x.ViewedAtUtc >= query.StartDate.Value.ToUniversalTime());
        }
        if (query.EndDate.HasValue)
        {
            // End of day handling
            var endOfDay = query.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            dbQuery = dbQuery.Where(x => x.ViewedAtUtc <= endOfDay.ToUniversalTime());
        }

        return dbQuery;
    }

    private static AccessLogResponse MapToResponse(AccessLog log)
    {
        // Determine UserRole & UserType & DealerName
        var role = log.User?.Role.ToString() ?? "Guest";
        var dealerName = log.User?.Dealer?.Name;
        var userType = !string.IsNullOrWhiteSpace(dealerName)
            ? dealerName
            : (role == "Admin" ? "Yönetici" : (role == "ContentManager" ? "İçerik Yöneticisi" : "Bayi"));

        // Format date and time in Turkish timezone (Turkey is UTC+3)
        var localTime = log.ViewedAtUtc.AddHours(3); // Turkey timezone offset

        return new AccessLogResponse
        {
            Id = log.Id,
            UserName = log.UserName ?? log.User?.Email ?? "Bilinmeyen Kullanıcı",
            UserRole = role,
            UserType = userType,
            DealerName = dealerName,
            Action = log.Action.ToDisplayString(),
            Description = log.Description,
            LoginStatus = log.LoginStatus?.ToDisplayString() ?? "N/A",
            Date = localTime.ToString("yyyy-MM-dd"),
            Time = localTime.ToString("HH:mm:ss"),
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent
        };
    }
}
