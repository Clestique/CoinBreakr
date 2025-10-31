# Reference existing DNS Zone for splitlyr.clestiq.com
data "google_dns_managed_zone" "splitlyr_zone" {
  name = var.dns_zone_name  
}

# A record for API subdomain (main environment)
resource "google_dns_record_set" "api_record" {
  count = var.environment == "main" ? 1 : 0

  name         = "api.splitlyr.clestiq.com."
  managed_zone = data.google_dns_managed_zone.splitlyr_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# A record for staging subdomain (staging environment)
resource "google_dns_record_set" "staging_record" {
  count = var.environment == "staging" ? 1 : 0

  name         = "staging.splitlyr.clestiq.com."
  managed_zone = data.google_dns_managed_zone.splitlyr_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip]
}

# Output the DNS records created
output "dns_records" {
  description = "DNS records created"
  value = {
    api_record     = var.environment == "main" ? "api.splitlyr.clestiq.com -> ${google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip}" : "Not created in this environment"
    staging_record = var.environment == "staging" ? "staging.splitlyr.clestiq.com -> ${google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip}" : "Not created in this environment"
  }
}