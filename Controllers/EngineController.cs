using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScholarAlign.Data;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EngineController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public EngineController(ApplicationDbContext db) => _db = db;

    // ── POST /api/engine/sync ──────────────────────────────────────────
    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] EngineSyncRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserEmail)) return BadRequest("UserEmail required.");
        await SyncInternalAsync(req.UserEmail);
        return Ok(new { synced = true });
    }

    // ── GET /api/engine/dashboard/{userEmail} ──────────────────────────
    [HttpGet("dashboard/{userEmail}")]
    public async Task<IActionResult> GetDashboard(string userEmail)
    {
        var data = await (
            from us in _db.UserScholarships
            join s in _db.Scholarships on us.ScholarshipId equals s.ScholarshipId
            join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            join o in _db.Organizations on a.OrganizationId equals o.OrganizationId
            where us.UserEmail == userEmail
            orderby a.ScholarshipName
            select new
            {
                us.ScholarshipId,
                a.ScholarshipName,
                OrgName = o.OrganizationName,
                s.Amount,
                s.AmountDescription,
                s.StartDate,
                s.EndDate,
                s.EligibilityInformation,
                us.UserScholarshipStatus
            }
        ).ToListAsync();

        return Ok(new
        {
            eligible   = data.Where(d => d.UserScholarshipStatus == 1).ToList(),
            unknown    = data.Where(d => d.UserScholarshipStatus == 0).ToList(),
            ineligible = data.Where(d => d.UserScholarshipStatus == -1).ToList()
        });
    }

    // ── GET /api/engine/my-answers/{userEmail} ────────────────────────
    [HttpGet("my-answers/{userEmail}")]
    public async Task<IActionResult> GetMyAnswers(string userEmail)
    {
        var data = await (
            from a in _db.Answers
            join q in _db.Questions on a.QuestionId equals q.QuestionId
            where a.UserEmail == userEmail
            orderby q.QuestionOrder, q.QuestionDescription
            select new
            {
                q.QuestionId,
                q.QuestionDescription,
                q.QuestionTypeId,
                q.QuestionTypeAttributes,
                a.AnswerValue,
                a.LastModified
            }
        ).ToListAsync();
        return Ok(data);
    }

    // ── GET /api/engine/scholarship-detail/{userEmail}/{scholarshipId} ─
    [HttpGet("scholarship-detail/{userEmail}/{scholarshipId:guid}")]
    public async Task<IActionResult> GetScholarshipDetail(string userEmail, Guid scholarshipId)
    {
        var schol = await (
            from s in _db.Scholarships
            join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            join o in _db.Organizations on a.OrganizationId equals o.OrganizationId
            join ay in _db.AwardYears on s.AwardYearId equals ay.AwardYearId into ayJoin
            from ay in ayJoin.DefaultIfEmpty()
            where s.ScholarshipId == scholarshipId
            select new
            {
                s.ScholarshipId,
                a.ScholarshipName,
                a.ScholarshipDescription,
                OrgName = o.OrganizationName,
                AwardYearDescription = ay != null ? ay.AwardYearDescription : null,
                s.Amount,
                s.AmountDescription,
                s.StartDate,
                s.EndDate,
                s.EligibilityInformation,
                s.ScholarshipStatus,
                s.ScholarshipUrl,
                s.AwardingInformation
            }
        ).FirstOrDefaultAsync();

        if (schol == null) return NotFound();

        var userStatus = await _db.UserScholarships
            .Where(us => us.UserEmail == userEmail && us.ScholarshipId == scholarshipId)
            .Select(us => (int?)us.UserScholarshipStatus)
            .FirstOrDefaultAsync();

        var requirements = await _db.ScholarshipRequirements
            .Where(r => r.ScholarshipId == scholarshipId)
            .OrderBy(r => r.Grouping)
            .ToListAsync();

        var questionIds = requirements.Select(r => r.QuestionId).Distinct().ToList();

        var questions = questionIds.Count > 0
            ? await _db.Questions.Where(q => questionIds.Contains(q.QuestionId)).ToDictionaryAsync(q => q.QuestionId)
            : new Dictionary<Guid, Question>();

        var answers = questionIds.Count > 0
            ? await _db.Answers.Where(a => a.UserEmail == userEmail && questionIds.Contains(a.QuestionId)).ToDictionaryAsync(a => a.QuestionId)
            : new Dictionary<Guid, Answer>();

        var ops = await _db.Operators.ToDictionaryAsync(o => o.OperatorId);

        var reqs = requirements.Select(r =>
        {
            var q  = questions.GetValueOrDefault(r.QuestionId);
            var ans = answers.GetValueOrDefault(r.QuestionId);
            var op  = ops.GetValueOrDefault(r.OperatorId);
            bool? eval = q != null ? EvaluateRequirement(r, ans, q.QuestionTypeId) : null;
            return new
            {
                r.ScholarshipRequirementId,
                r.Grouping,
                r.QuestionId,
                QuestionDescription   = q?.QuestionDescription,
                QuestionTypeId        = q?.QuestionTypeId ?? 0,
                QuestionTypeAttributes = q?.QuestionTypeAttributes,
                r.OperatorId,
                OperatorShownName = op?.OperatorShownName,
                r.RequirementValue,
                UserAnswer = ans?.AnswerValue,
                Status = eval.HasValue ? (eval.Value ? 1 : -1) : 0
            };
        }).ToList();

        return Ok(new { scholarship = schol, userStatus, requirements = reqs });
    }

    // ── GET /api/engine/next-question/{userEmail} ──────────────────────
    [HttpGet("next-question/{userEmail}")]
    public async Task<IActionResult> GetNextQuestion(string userEmail)
    {
        // Only scholarships where eligibility is still unknown
        var unknownScholarshipIds = await _db.UserScholarships
            .Where(us => us.UserEmail == userEmail && us.UserScholarshipStatus == 0)
            .Select(us => us.ScholarshipId)
            .ToListAsync();

        if (unknownScholarshipIds.Count == 0) return Ok(null);

        // All requirements attached to those scholarships
        var requirements = await _db.ScholarshipRequirements
            .Where(r => unknownScholarshipIds.Contains(r.ScholarshipId))
            .ToListAsync();

        // Questions the user has already answered
        var answeredIds = (await _db.Answers
            .Where(a => a.UserEmail == userEmail)
            .Select(a => a.QuestionId)
            .ToListAsync()).ToHashSet();

        // Unanswered question IDs referenced by unknown-scholarship requirements
        var unansweredIds = requirements
            .Select(r => r.QuestionId)
            .Distinct()
            .Where(id => !answeredIds.Contains(id))
            .ToList();

        if (unansweredIds.Count == 0) return Ok(null);

        var questions = await _db.Questions
            .Where(q => unansweredIds.Contains(q.QuestionId))
            .ToListAsync();

        // Priority 1: lowest QuestionOrder
        var ordered = questions
            .Where(q => q.QuestionOrder.HasValue)
            .OrderBy(q => q.QuestionOrder)
            .FirstOrDefault();
        if (ordered != null) return Ok(ordered);

        // Priority 2: most frequently referenced across unknown-scholarship requirements
        var mostFrequentId = requirements
            .Where(r => unansweredIds.Contains(r.QuestionId))
            .GroupBy(r => r.QuestionId)
            .OrderByDescending(g => g.Count())
            .First().Key;

        return Ok(questions.First(q => q.QuestionId == mostFrequentId));
    }

    // ── POST /api/engine/answer ────────────────────────────────────────
    [HttpPost("answer")]
    public async Task<IActionResult> SaveAnswer([FromBody] EngineAnswerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserEmail) || req.QuestionId == Guid.Empty)
            return BadRequest("UserEmail and QuestionId required.");

        var now = DateTime.UtcNow;
        var existing = await _db.Answers
            .FirstOrDefaultAsync(a => a.UserEmail == req.UserEmail && a.QuestionId == req.QuestionId);

        if (existing != null)
        {
            existing.AnswerValue = req.AnswerValue;
            existing.LastModified = now;
        }
        else
        {
            _db.Answers.Add(new Answer
            {
                AnswerId = Guid.NewGuid(),
                QuestionId = req.QuestionId,
                UserEmail = req.UserEmail,
                AnswerValue = req.AnswerValue,
                CreatedOn = now,
                LastModified = now
            });
        }
        await _db.SaveChangesAsync();

        // Re-evaluate every scholarship this question's requirements belong to
        var affectedIds = await _db.ScholarshipRequirements
            .Where(r => r.QuestionId == req.QuestionId)
            .Select(r => r.ScholarshipId)
            .Distinct()
            .ToListAsync();

        var userAffectedIds = await _db.UserScholarships
            .Where(us => us.UserEmail == req.UserEmail && affectedIds.Contains(us.ScholarshipId))
            .Select(us => us.ScholarshipId)
            .ToListAsync();

        await EvaluateRequirementsAsync(req.UserEmail, userAffectedIds);
        return Ok(new { saved = true });
    }

    // ── Sync: availability filter + create UserScholarship records ─────
    private async Task SyncInternalAsync(string userEmail)
    {
        var today = DateTime.UtcNow.Date;

        // 1. Collect all org IDs the user can access.
        //    Direct membership via OrganizationUsers, plus cascade from SubOrganizationUsers:
        //    any SubOrg the user belongs to shares its OrganizationId with the top-level org.
        var accessibleOrgIds = (await _db.OrganizationUsers
            .Where(ou => ou.UserEmail == userEmail)
            .Select(ou => ou.OrganizationId)
            .ToListAsync()).ToHashSet();

        var subOrgIds = await _db.SubOrganizationUsers
            .Where(su => su.UserEmail == userEmail)
            .Select(su => su.SubOrganizationId)
            .ToListAsync();

        if (subOrgIds.Count > 0)
        {
            var cascadeOrgIds = await _db.SubOrganizations
                .Where(so => subOrgIds.Contains(so.SubOrganizationId))
                .Select(so => so.OrganizationId)
                .Distinct()
                .ToListAsync();
            foreach (var id in cascadeOrgIds) accessibleOrgIds.Add(id);
        }

        // 2. Find all scholarships that pass the availability filter.
        //    Rules: status = Live (4), both dates present, today in [start, end],
        //    and either the owning org is marked IsPublic or the user is a member.
        var qualifyingIds = await (
            from s in _db.Scholarships
            join a in _db.ScholarshipAbstracts on s.ScholarshipAbstractId equals a.ScholarshipAbstractId
            join o in _db.Organizations on a.OrganizationId equals o.OrganizationId
            where s.ScholarshipStatus == 4
               && s.StartDate != null && s.EndDate != null
               && s.StartDate!.Value.Date <= today && s.EndDate!.Value.Date >= today
               && (o.IsPublic || accessibleOrgIds.Contains(a.OrganizationId))
            select s.ScholarshipId
        ).ToListAsync();

        // 3. Create UserScholarship = 0 (Unknown) for any new qualifying scholarship.
        var existingIds = (await _db.UserScholarships
            .Where(us => us.UserEmail == userEmail)
            .Select(us => us.ScholarshipId)
            .ToListAsync()).ToHashSet();

        var now = DateTime.UtcNow;
        foreach (var sId in qualifyingIds.Where(id => !existingIds.Contains(id)))
        {
            _db.UserScholarships.Add(new UserScholarship
            {
                UserScholarshipsId = Guid.NewGuid(),
                UserEmail = userEmail,
                ScholarshipId = sId,
                UserScholarshipStatus = 0,
                CreatedOn = now,
                LastModified = now
            });
        }
        await _db.SaveChangesAsync();

        // 4. Re-evaluate requirements for all qualifying scholarships.
        await EvaluateRequirementsAsync(userEmail, qualifyingIds);
    }

    // ── Requirement evaluation ─────────────────────────────────────────
    private async Task EvaluateRequirementsAsync(string userEmail, List<Guid> scholarshipIds)
    {
        if (scholarshipIds.Count == 0) return;

        var requirements = await _db.ScholarshipRequirements
            .Where(r => scholarshipIds.Contains(r.ScholarshipId))
            .ToListAsync();

        var questionIds = requirements.Select(r => r.QuestionId).Distinct().ToList();

        var questions = questionIds.Count > 0
            ? await _db.Questions
                .Where(q => questionIds.Contains(q.QuestionId))
                .ToDictionaryAsync(q => q.QuestionId)
            : new Dictionary<Guid, Question>();

        var answers = questionIds.Count > 0
            ? await _db.Answers
                .Where(a => a.UserEmail == userEmail && questionIds.Contains(a.QuestionId))
                .ToDictionaryAsync(a => a.QuestionId)
            : new Dictionary<Guid, Answer>();

        var userScholarships = await _db.UserScholarships
            .Where(us => us.UserEmail == userEmail && scholarshipIds.Contains(us.ScholarshipId))
            .ToListAsync();

        var now = DateTime.UtcNow;

        foreach (var us in userScholarships)
        {
            var sReqs = requirements.Where(r => r.ScholarshipId == us.ScholarshipId).ToList();

            int newStatus;
            if (sReqs.Count == 0)
            {
                // No requirements coded yet — scholarship is eligible by availability alone.
                newStatus = 1;
            }
            else
            {
                bool anyGroupTrue    = false;
                bool anyGroupUnknown = false;

                foreach (var group in sReqs.GroupBy(r => r.Grouping))
                {
                    bool hasUnknown = false;
                    bool hasFalse   = false;

                    foreach (var req in group)
                    {
                        if (!questions.TryGetValue(req.QuestionId, out var q)) { hasUnknown = true; continue; }
                        var answer = answers.GetValueOrDefault(req.QuestionId);
                        var result = EvaluateRequirement(req, answer, q.QuestionTypeId);

                        if (result is null)  hasUnknown = true;
                        else if (!result.Value) hasFalse = true;
                    }

                    if (!hasUnknown && !hasFalse) anyGroupTrue = true;
                    else if (hasUnknown && !hasFalse) anyGroupUnknown = true;
                }

                if (anyGroupTrue)         newStatus = 1;
                else if (anyGroupUnknown) newStatus = 0;
                else                      newStatus = -1;
            }

            us.UserScholarshipStatus = newStatus;
            us.LastModified = now;
        }

        await _db.SaveChangesAsync();
    }

    // ── Single-requirement evaluator ───────────────────────────────────
    private static bool? EvaluateRequirement(ScholarshipRequirement req, Answer? answer, int questionTypeId)
    {
        if (answer == null) return null; // unanswered → unknown

        var (ansScalar, ansArray) = ParseValue(answer.AnswerValue);
        var (reqScalar, reqArray) = ParseValue(req.RequirementValue);

        // In List (7) / Not In List (8)
        if (req.OperatorId is 7 or 8)
        {
            var reqList = reqArray ?? (reqScalar != null ? [reqScalar] : Array.Empty<string>());
            var ansList = ansArray ?? (ansScalar != null ? [ansScalar] : Array.Empty<string>());
            bool anyMatch = ansList.Any(a => reqList.Any(r => string.Equals(a, r, StringComparison.OrdinalIgnoreCase)));
            return req.OperatorId == 7 ? anyMatch : !anyMatch;
        }

        var aVal = ansScalar ?? string.Empty;
        var rVal = reqScalar ?? string.Empty;

        // Numeric: Int (2), Decimal (3)
        if (questionTypeId is 2 or 3)
        {
            if (decimal.TryParse(aVal, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var aNum) &&
                decimal.TryParse(rVal, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var rNum))
                return CompareOp(aNum.CompareTo(rNum), req.OperatorId);
        }

        // Date/DateTime (7, 8)
        if (questionTypeId is 7 or 8)
        {
            if (DateTime.TryParse(aVal, out var aDate) && DateTime.TryParse(rVal, out var rDate))
                return CompareOp(aDate.CompareTo(rDate), req.OperatorId);
        }

        // String / list types: only = (1) and != (4) are meaningful
        return req.OperatorId switch
        {
            1 => string.Equals(aVal, rVal, StringComparison.OrdinalIgnoreCase),
            4 => !string.Equals(aVal, rVal, StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    // Maps a numeric comparison result (-1/0/1) to an operator ID result
    private static bool CompareOp(int cmp, int operatorId) => operatorId switch
    {
        1 => cmp == 0,   // =
        2 => cmp > 0,    // >
        3 => cmp < 0,    // <
        4 => cmp != 0,   // !=
        5 => cmp >= 0,   // >=
        6 => cmp <= 0,   // <=
        _ => false
    };

    // Parses both {"value": ...} wrapper and bare JSON array formats
    private static (string? scalar, string[]? array) ParseValue(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return (null, null);
        raw = raw.Trim();

        if (raw.StartsWith('{'))
        {
            try
            {
                using var doc = JsonDocument.Parse(raw);
                if (doc.RootElement.TryGetProperty("value", out var v))
                {
                    if (v.ValueKind == JsonValueKind.Array)
                        return (null, v.EnumerateArray().Select(e => e.GetString() ?? "").ToArray());
                    return (v.GetString(), null);
                }
            }
            catch { /* fall through */ }
        }

        if (raw.StartsWith('['))
        {
            try
            {
                var arr = JsonSerializer.Deserialize<string[]>(raw);
                if (arr != null) return (null, arr);
            }
            catch { /* fall through */ }
        }

        return (raw, null);
    }
}

public record EngineSyncRequest(string UserEmail);
public record EngineAnswerRequest(string UserEmail, Guid QuestionId, string AnswerValue);
