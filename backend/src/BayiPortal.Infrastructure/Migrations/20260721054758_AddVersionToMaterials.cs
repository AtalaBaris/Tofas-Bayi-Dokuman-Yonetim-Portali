using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BayiPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVersionToMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Materials",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Version",
                table: "Materials");
        }
    }
}
