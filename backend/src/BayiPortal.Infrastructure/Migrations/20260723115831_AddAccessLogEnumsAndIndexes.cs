using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BayiPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAccessLogEnumsAndIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_Action_ViewedAtUtc",
                table: "AccessLogs",
                columns: new[] { "Action", "ViewedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_LoginStatus_ViewedAtUtc",
                table: "AccessLogs",
                columns: new[] { "LoginStatus", "ViewedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_ViewedAtUtc",
                table: "AccessLogs",
                column: "ViewedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AccessLogs_Action_ViewedAtUtc",
                table: "AccessLogs");

            migrationBuilder.DropIndex(
                name: "IX_AccessLogs_LoginStatus_ViewedAtUtc",
                table: "AccessLogs");

            migrationBuilder.DropIndex(
                name: "IX_AccessLogs_ViewedAtUtc",
                table: "AccessLogs");
        }
    }
}
