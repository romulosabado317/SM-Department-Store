using Microsoft.AspNetCore.Mvc;
using SMDepartmentStore.API.Models;

namespace SMDepartmentStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoresController : ControllerBase
    {
        private static readonly List<Store> _stores = new List<Store>
        {
            new Store { Id = 1, BranchName = "SM Mall of Asia", Address = "Seaside Blvd, Pasay, 1300 Metro Manila", OpeningHours = "10:00 AM - 10:00 PM", MapsUrl = "https://maps.google.com/?q=SM+Mall+of+Asia" },
            new Store { Id = 2, BranchName = "SM Megamall", Address = "EDSA cor. Doña Julia Vargas Ave., Ortigas Center, Mandaluyong", OpeningHours = "10:00 AM - 10:00 PM", MapsUrl = "https://maps.google.com/?q=SM+Megamall" },
            new Store { Id = 3, BranchName = "SM North EDSA", Address = "North Avenue cor. EDSA, Quezon City, 1100 Metro Manila", OpeningHours = "10:00 AM - 9:00 PM", MapsUrl = "https://maps.google.com/?q=SM+North+EDSA" }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Store>> GetStores()
        {
            return Ok(_stores);
        }
    }
}
