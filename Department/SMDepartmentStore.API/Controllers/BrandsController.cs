using Microsoft.AspNetCore.Mvc;
using SMDepartmentStore.API.Models;

namespace SMDepartmentStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private static readonly List<Brand> _brands = new List<Brand>
        {
            new Brand { Id = 1, Name = "Plains & Prints" },
            new Brand { Id = 2, Name = "Penshoppe" },
            new Brand { Id = 3, Name = "Bench" },
            new Brand { Id = 4, Name = "Regatta" },
            new Brand { Id = 5, Name = "Carbon" },
            new Brand { Id = 6, Name = "Miniso" },
            new Brand { Id = 7, Name = "Aesop" },
            new Brand { Id = 8, Name = "Muji" },
            new Brand { Id = 9, Name = "Hot Wheels" }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Brand>> GetBrands()
        {
            return Ok(_brands);
        }
    }
}
