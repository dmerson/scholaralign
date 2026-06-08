using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ScholarAlign.Models;

namespace ScholarAlign.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(SignInManager<ApplicationUser> signInManager) : ControllerBase
{
    [HttpGet("challenge/{provider}")]
    public IActionResult Challenge(string provider, string returnUrl = "/")
    {
        var redirectUrl = Url.Action(nameof(Callback), new { returnUrl });
        var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return Challenge(properties, provider);
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback(string returnUrl = "/")
    {
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info is null)
            return Redirect("/login?error=external-login-failed");

        // Sign in if the external login already exists in the database
        var result = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: true);

        if (!result.Succeeded)
        {
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Redirect("/login?error=no-email-from-provider");

            // Check if a user with this email already exists (different provider)
            var existingUser = await signInManager.UserManager.FindByEmailAsync(email);
            if (existingUser is not null)
            {
                await signInManager.UserManager.AddLoginAsync(existingUser, info);
                await signInManager.SignInAsync(existingUser, isPersistent: true);
            }
            else
            {
                // First time — create the user
                var newUser = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName),
                    LastName = info.Principal.FindFirstValue(ClaimTypes.Surname),
                    EmailConfirmed = true
                };

                var createResult = await signInManager.UserManager.CreateAsync(newUser);
                if (!createResult.Succeeded)
                    return Redirect("/login?error=registration-failed");

                await signInManager.UserManager.AddLoginAsync(newUser, info);
                await signInManager.SignInAsync(newUser, isPersistent: true);
            }
        }

        var separator = returnUrl.Contains('?') ? "&" : "?";
        return Redirect($"{returnUrl}{separator}auth=1");
    }

    [HttpGet("info")]
    public IActionResult Info()
    {
        if (User.Identity?.IsAuthenticated != true)
            return Ok(new { isAuthenticated = false });

        return Ok(new
        {
            Id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Email = User.FindFirstValue(ClaimTypes.Email),
            Name = User.Identity.Name,
            IsAuthenticated = true
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }
}
