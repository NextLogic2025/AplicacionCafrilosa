# ============================================================
# API GATEWAY: Punto de entrada público seguro
# ============================================================

# OpenAPI spec dinámico
resource "local_file" "openapi_spec" {
  filename = "${path.module}/openapi.yaml"
  content  = templatefile("${path.module}/openapi.tpl", {
    project_id   = var.project_id
    region       = var.region
    backend_urls = var.backend_urls
  })
}

# API Gateway API
resource "google_api_gateway_api" "cafrisales_api" {
  provider      = google-beta
  api_id        = "cafrisales-api"
  display_name  = "Cafrisales API"
  description   = "API Gateway para Cafrisales"
}

# API Gateway Config
resource "google_api_gateway_api_config" "cafrisales_config" {
  provider        = google-beta
  api             = google_api_gateway_api.cafrisales_api.api_id
  api_config_id   = "v1-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  display_name    = "Cafrisales API Config v1"
  backend_service = "servicemanagement.googleapis.com"

  openapi_config {
    contents = file("${path.module}/openapi.yaml")
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [local_file.openapi_spec]
}

# API Gateway Gateway
resource "google_api_gateway_gateway" "cafrisales_gateway" {
  provider    = google-beta
  api_config  = google_api_gateway_api_config.cafrisales_config.id
  gateway_id  = "cafrisales-gateway"
  display_name = "Cafrisales Gateway"

  labels = var.labels
}

# ============================================================
# CLOUD ARMOR: Web Application Firewall (WAF)
# ============================================================

resource "google_compute_security_policy" "cloud_armor" {
  name        = "${var.project_id}-cloud-armor"
  description = "Cloud Armor policy para Cafrisales"

  # Regla por defecto: Permitir
  rules {
    action   = "allow"
    priority = "65535"
    match {
      versioned_expr = "SAFEBROWSING_V33"
      safebrowsing_options {
        action = "allow"
      }
    }
    description = "Default rule"
  }

  # Protección contra ataques OWASP Top 10
  rules {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33')"
      }
    }
    description = "Protección XSS"
  }

  rules {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33')"
      }
    }
    description = "Protección SQL Injection"
  }

  # Rate limiting: 100 req/min por IP
  rules {
    action   = "rate_based_ban"
    priority = "100"
    match {
      versioned_expr = "SAFEBROWSING_V33"
      safebrowsing_options {
        action = "allow"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"

      rate_limit_key = "IP"
      ban_duration_sec = 600

      enforce_on_key = "IP"
    }
    description = "Rate limiting"
  }

  labels = var.labels
}

# ============================================================
# OUTPUTS
# ============================================================

output "api_gateway_url" {
  value       = google_api_gateway_gateway.cafrisales_gateway.default_hostname
  description = "URL pública del API Gateway"
}

output "api_id" {
  value       = google_api_gateway_api.cafrisales_api.api_id
  description = "ID del API"
}

output "cloud_armor_policy" {
  value       = google_compute_security_policy.cloud_armor.name
  description = "Nombre de la política Cloud Armor"
}
