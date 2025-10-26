# DNS Zone for beleno.clestiq.com
resource "google_dns_managed_zone" "beleno_zone" {
  name        = "${var.environment}-beleno-zone"
  dns_name    = "beleno.clestiq.com."
  description = "DNS zone for beleno.clestiq.com - ${var.environment} environment"
  
  depends_on = [google_project_service.dns_api]
  
  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }
}

# A record for API subdomain (main environment)
resource "google_dns_record_set" "api_record" {
  count = var.environment == "main" ? 1 : 0
  
  name         = "api.beleno.clestiq.com."
  managed_zone = google_dns_managed_zone.beleno_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# A record for staging subdomain (staging environment)
resource "google_dns_record_set" "staging_record" {
  count = var.environment == "staging" ? 1 : 0
  
  name         = "staging.beleno.clestiq.com."
  managed_zone = google_dns_managed_zone.beleno_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# Output DNS nameservers
output "dns_nameservers" {
  description = "DNS nameservers for the zone"
  value       = google_dns_managed_zone.beleno_zone.name_servers
}

# Output the DNS records created
output "dns_records" {
  description = "DNS records created"
  value = {
    api_record     = var.environment == "main" ? "api.beleno.clestiq.com -> ${google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip}:3000" : "Not created in this environment"
    staging_record = var.environment == "staging" ? "staging.beleno.clestiq.com -> ${google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip}:3000" : "Not created in this environment"
  }
}