using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BayiPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaterialFileId",
                table: "AccessLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MaterialFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MaterialId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    StoredFileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialFiles_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_MaterialFileId",
                table: "AccessLogs",
                column: "MaterialFileId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialFiles_MaterialId",
                table: "MaterialFiles",
                column: "MaterialId");

            // Mevcut Materials satırlarının tek dosyasını MaterialFiles'a birer satır olarak kopyalar.
            // Eski scalar kolonlar (Materials.FileName vb.) kasıtlı olarak silinmiyor, "ilk dosya" için dolu kalıyor.
            migrationBuilder.Sql(@"
                INSERT INTO ""MaterialFiles"" (""MaterialId"", ""FileName"", ""StoredFileName"", ""FilePath"", ""MimeType"", ""FileSize"", ""SortOrder"", ""CreatedAt"")
                SELECT ""Id"", ""FileName"", ""StoredFileName"", ""FilePath"", ""MimeType"", ""FileSize"", 0, ""CreatedAt""
                FROM ""Materials""
                WHERE ""StoredFileName"" IS NOT NULL AND ""StoredFileName"" <> '';
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_AccessLogs_MaterialFiles_MaterialFileId",
                table: "AccessLogs",
                column: "MaterialFileId",
                principalTable: "MaterialFiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccessLogs_MaterialFiles_MaterialFileId",
                table: "AccessLogs");

            migrationBuilder.DropTable(
                name: "MaterialFiles");

            migrationBuilder.DropIndex(
                name: "IX_AccessLogs_MaterialFileId",
                table: "AccessLogs");

            migrationBuilder.DropColumn(
                name: "MaterialFileId",
                table: "AccessLogs");
        }
    }
}
