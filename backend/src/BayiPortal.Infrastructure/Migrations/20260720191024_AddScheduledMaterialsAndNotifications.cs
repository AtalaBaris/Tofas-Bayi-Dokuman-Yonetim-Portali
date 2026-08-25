using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BayiPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledMaterialsAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecurrenceDayOfMonth",
                table: "Materials",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceDayOfWeek",
                table: "Materials",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceKind",
                table: "Materials",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<int>(
                name: "ScheduleTemplateId",
                table: "Materials",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledPublishAt",
                table: "Materials",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Body = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    MaterialId = table.Column<int>(type: "integer", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Materials_ScheduleTemplateId",
                table: "Materials",
                column: "ScheduleTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Status_ScheduledPublishAt",
                table: "Materials",
                columns: new[] { "Status", "ScheduledPublishAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_MaterialId",
                table: "Notifications",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_Materials_Materials_ScheduleTemplateId",
                table: "Materials",
                column: "ScheduleTemplateId",
                principalTable: "Materials",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Materials_Materials_ScheduleTemplateId",
                table: "Materials");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Materials_ScheduleTemplateId",
                table: "Materials");

            migrationBuilder.DropIndex(
                name: "IX_Materials_Status_ScheduledPublishAt",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "RecurrenceDayOfMonth",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "RecurrenceDayOfWeek",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "RecurrenceKind",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "ScheduleTemplateId",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "ScheduledPublishAt",
                table: "Materials");
        }
    }
}
