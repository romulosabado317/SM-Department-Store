namespace SMDepartmentStore.API.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public bool IsNew { get; set; }
        public bool IsOnSale { get; set; }
        public string Image { get; set; } = string.Empty;
        public string ImagePlaceholderColor { get; set; } = string.Empty;
    }
}
