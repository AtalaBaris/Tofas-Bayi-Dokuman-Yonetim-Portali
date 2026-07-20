using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BayiPortal.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Users");
        }
    }
}
