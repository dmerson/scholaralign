using Microsoft.AspNetCore.Mvc;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScholarshipsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => StatusCode(501);
}
