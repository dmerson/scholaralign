using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScholarAlign.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReviewProcessRestructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScholarshipApplicationReviews");

            migrationBuilder.DropTable(
                name: "ScholarshipReviewers");

            migrationBuilder.CreateTable(
                name: "ScholarshipCommittees",
                columns: table => new
                {
                    ScholarshipCommitteeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScholarshipId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubOrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipCommittees", x => x.ScholarshipCommitteeId);
                });

            migrationBuilder.CreateTable(
                name: "ScholarshipReviews",
                columns: table => new
                {
                    ScholarshipReviewId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ScholarshipApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewerEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ReviewerNotes = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: true),
                    ReviewerDecision = table.Column<int>(type: "int", nullable: true),
                    ReviewerRating = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipReviews", x => x.ScholarshipReviewId);
                });

            migrationBuilder.CreateTable(
                name: "SubOrganizationUsers",
                columns: table => new
                {
                    SubOrganizationUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubOrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubOrganizationUsers", x => x.SubOrganizationUserId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScholarshipCommittees");

            migrationBuilder.DropTable(
                name: "ScholarshipReviews");

            migrationBuilder.DropTable(
                name: "SubOrganizationUsers");

            migrationBuilder.CreateTable(
                name: "ScholarshipApplicationReviews",
                columns: table => new
                {
                    ScholarshipApplicationReviewId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ReviewerDecision = table.Column<int>(type: "int", nullable: true),
                    ReviewerNotes = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    ReviewerRating = table.Column<int>(type: "int", nullable: true),
                    ScholarshipApplicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipApplicationReviews", x => x.ScholarshipApplicationReviewId);
                });

            migrationBuilder.CreateTable(
                name: "ScholarshipReviewers",
                columns: table => new
                {
                    ScholarshipReviewerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ScholarshipId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScholarshipReviewers", x => x.ScholarshipReviewerId);
                });
        }
    }
}
