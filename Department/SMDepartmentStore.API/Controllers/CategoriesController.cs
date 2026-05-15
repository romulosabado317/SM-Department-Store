using Microsoft.AspNetCore.Mvc;
using SMDepartmentStore.API.Models;

namespace SMDepartmentStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private static readonly List<Category> _categories = new List<Category>
        {
            new Category { Id = 1, Name = "Women", Description = "Elegant apparel and accessories for women.", Icon = "ShoppingBag" },
            new Category { Id = 2, Name = "Men", Description = "Sharp styles and casual wear for men.", Icon = "ChevronRight" },
            new Category { Id = 3, Name = "Kids", Description = "Playful and comfortable apparel for children.", Icon = "Baby" },
            new Category { Id = 4, Name = "Home", Description = "Curated essentials for a beautiful space.", Icon = "Home" },
            new Category { Id = 5, Name = "Beauty", Description = "Premium skincare and cosmetics.", Icon = "Sparkles" },
            new Category { Id = 6, Name = "Toys", Description = "Timeless play for all generations.", Icon = "Bot" }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Category>> GetCategories()
        {
            return Ok(_categories);
        }
    }
}
