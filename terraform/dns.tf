# DNS Zone for clestiq.com domain
resource "google_dns_managed_zone" "clestiq_zone" {
  name        = "${var.environment}-clestiq-zone"
  dns_name    = "clestiq.com."
  description = "DNS zone for clestiq.com domain"
  
  # Only create the zone once (in main environment)
  count = var.environment == "main" ? 1 : 0
}

# DNS A record for api.beleno.clestiq.com (main environment)
resource "google_dns_record_set" "api_beleno_main" {
  count = var.environment == "main" ? 1 : 0
  
  name         = "api.beleno.clestiq.com."
  managed_zone = google_dns_managed_zone.clestiq_zone[0].name
  type         = "A"
  ttl          = 300
  
  rrdatas = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# DNS A record for staging.beleno.clestiq.com (staging environment)
resource "google_dns_record_set" "api_beleno_staging" {
  count = var.environment == "staging" ? 1 : 0
  
  # Reference the zone from main environment using data source
  name         = "staging.beleno.clestiq.com."
  managed_zone = data.google_dns_managed_zone.existing_zone[0].name
  type         = "A"
  ttl          = 300
  
  rrdatas = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# Data source to reference existing DNS zone (for staging environment)
data "google_dns_managed_zone" "existing_zone" {
  count = var.environment == "staging" ? 1 : 0
  name  = "main-clestiq-zone"
}

# Output DNS nameservers (only for main environment)
output "dns_nameservers" {
  description = "DNS nameservers for the domain"
  value       = var.environment == "main" ? google_dns_managed_zone.clestiq_zone[0].name_servers : []
}

# Output the domain URLs
output "api_url" {
  description = "API URL for the environment"
  value = var.environment == "main" ? "https://api.beleno.clestiq.com/v1" : "https://staging.beleno.clestiq.com/v1"
}

output "health_check_url" {
  description = "Health check URL for the environment"
  value = var.environment == "main" ? "https://api.beleno.clestiq.com/v1/healthz" : "https://staging.beleno.clestiq.com/v1/healthz"
}
