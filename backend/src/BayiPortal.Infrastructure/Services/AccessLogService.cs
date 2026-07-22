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
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BayiPortal.Infrastructure.Services;

public class AccessLogService : IAccessLogService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AccessLogService(ApplicationDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        int? userId,
        string? userName,
        int? materialId,
        string action,
        string description,
        string? loginStatus = null,
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
            LoginStatus = loginStatus ?? "N/A",
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
                && (x.Action == "Döküman Görüntüleme" || x.Action == "Döküman İndirme"))
            .Select(x => new { MaterialId = x.MaterialId!.Value, x.Action })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<int, string>();
        foreach (var log in logs)
        {
            var status = log.Action == "Döküman İndirme" ? "downloaded" : "viewed";
            if (status == "downloaded" || !result.ContainsKey(log.MaterialId))
            {
                result[log.MaterialId] = status;
            }
        }

        return result;
    }

    public async Task<MaterialAccessReportResponse> GetMaterialAccessReportAsync(
        int materialId, CancellationToken cancellationToken = default)
    {
        var logs = await _dbContext.AccessLogs
            .Include(x => x.User)
            .ThenInclude(u => u!.Dealer)
            .AsNoTracking()
            .Where(x => x.MaterialId == materialId
                && (x.Action == "Döküman Görüntüleme" || x.Action == "Döküman İndirme"))
            .OrderByDescending(x => x.ViewedAtUtc)
            .ToListAsync(cancellationToken);

        var items = logs.Select(log =>
        {
            var localTime = log.ViewedAtUtc.AddHours(3);
            return new MaterialAccessReportItemResponse
            {
                Id = log.Id,
                UserName = log.UserName ?? log.User?.Email ?? "Bilinmeyen Kullanıcı",
                DealerName = log.User?.Dealer?.Name ?? string.Empty,
                Action = log.Action,
                Date = localTime.ToString("yyyy-MM-dd"),
                Time = localTime.ToString("HH:mm:ss")
            };
        }).ToList();

        return new MaterialAccessReportResponse
        {
            MaterialId = materialId,
            Items = items
        };
    }

    public async Task<AccessLogListResponse> GetListAsync(
        AccessLogListQuery query,
        CancellationToken cancellationToken = default)
    {
        var dbQuery = _dbContext.AccessLogs
            .Include(x => x.User)
            .AsNoTracking();

        // ContentManager yetki kısıtlaması: Giriş/Çıkış loglarını göremez, sadece doküman hareketlerini görebilir
        if (query.ExcludeAuthLogs)
        {
            dbQuery = dbQuery.Where(x => x.Action != "Giriş" && x.Action != "Çıkış" && x.Action != "Giriş Başarısız");
        }

        // Keyword filter (matches username / email)
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim().ToLower();
            dbQuery = dbQuery.Where(x => 
                (x.UserName != null && x.UserName.ToLower().Contains(keyword)) ||
                (x.User != null && x.User.Email.ToLower().Contains(keyword)));
        }

        // Role filter
        if (!string.IsNullOrWhiteSpace(query.Role) && Enum.TryParse<RoleType>(query.Role, out var roleFilter))
        {
            dbQuery = dbQuery.Where(x => x.User != null && x.User.Role == roleFilter);
        }

        // Action filter — tek değer veya virgülle ayrılmış liste (örn. "Giriş,Çıkış")
        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var actions = query.Action
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (actions.Length == 1)
            {
                dbQuery = dbQuery.Where(x => x.Action == actions[0]);
            }
            else
            {
                dbQuery = dbQuery.Where(x => actions.Contains(x.Action));
            }
        }

        // Status filter
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            dbQuery = dbQuery.Where(x => x.LoginStatus == query.Status);
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

        var totalCount = await dbQuery.CountAsync(cancellationToken);

        var items = await dbQuery
            .OrderByDescending(x => x.ViewedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(log => {
            // Determine UserRole & UserType
            var role = log.User?.Role.ToString() ?? "Guest";
            var userType = "Bayi Kullanıcısı";
            if (role == "Admin") userType = "Yönetici";
            else if (role == "ContentManager") userType = "İçerik Yöneticisi";

            // Format date and time in Turkish timezone (Turkey is UTC+3)
            var localTime = log.ViewedAtUtc.AddHours(3); // Turkey timezone offset
            
            return new AccessLogResponse
            {
                Id = log.Id,
                UserName = log.UserName ?? log.User?.Email ?? "Bilinmeyen Kullanıcı",
                UserRole = role,
                UserType = userType,
                Action = log.Action,
                Description = log.Description,
                LoginStatus = log.LoginStatus ?? "N/A",
                Date = localTime.ToString("yyyy-MM-dd"),
                Time = localTime.ToString("HH:mm:ss"),
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent
            };
        }).ToList();

        return new AccessLogListResponse
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
