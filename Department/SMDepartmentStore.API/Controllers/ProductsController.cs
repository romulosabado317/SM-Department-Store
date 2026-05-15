using Microsoft.AspNetCore.Mvc;
using SMDepartmentStore.API.Models;

namespace SMDepartmentStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private static readonly List<Product> _products = new List<Product>
        {
            new Product { Id = 1, Name = "Silk Wrap Dress", Brand = "Plains & Prints", Category = "Women", Price = 3450, OriginalPrice = 4500, IsNew = false, IsOnSale = true, Image = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop" },
            new Product { Id = 2, Name = "Tailored Linen Blazer", Brand = "Regatta", Category = "Women", Price = 2800, OriginalPrice = null, IsNew = true, IsOnSale = false, Image = "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?q=80&w=800&auto=format&fit=crop" },
            new Product { Id = 4, Name = "Classic Oxford Shirt", Brand = "Bench", Category = "Men", Price = 1200, OriginalPrice = 1500, IsNew = false, IsOnSale = true, Image = "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=800&auto=format&fit=crop" },
            new Product { Id = 18, Name = "Hot Wheels '67 Camaro", Brand = "Hot Wheels", Category = "Toys", Price = 529, OriginalPrice = 629, IsNew = true, IsOnSale = true, Image = "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop" },
            new Product { Id = 20, Name = "Hot Wheels Monster Truck", Brand = "Hot Wheels", Category = "Toys", Price = 949, OriginalPrice = 1049, IsNew = false, IsOnSale = true, Image = "https://images.unsplash.com/photo-1558981403-c5f9799868fb?q=80&w=800&auto=format&fit=crop" }
        };

        [HttpGet]
        public ActionResult<IEnumerable<Product>> GetProducts([FromQuery] string? category, [FromQuery] bool? onSale, [FromQuery] bool? isNew)
        {
            var query = _products.AsQueryable();

            if (!string.IsNullOrEmpty(category))
                query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

            if (onSale.HasValue && onSale.Value)
                query = query.Where(p => p.IsOnSale);

            if (isNew.HasValue && isNew.Value)
                query = query.Where(p => p.IsNew);

            return Ok(query.ToList());
        }

        [HttpGet("{id}")]
        public ActionResult<Product> GetProduct(int id)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            if (product == null) return NotFound();
            return Ok(product);
        }
    }
}
