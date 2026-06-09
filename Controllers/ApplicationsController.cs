using Microsoft.AspNetCore.Mvc;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => StatusCode(501);
}
