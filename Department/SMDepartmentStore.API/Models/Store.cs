namespace SMDepartmentStore.API.Models
{
    public class Store
    {
        public int Id { get; set; }
        public string BranchName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string OpeningHours { get; set; } = string.Empty;
        public string MapsUrl { get; set; } = string.Empty;
    }
}
