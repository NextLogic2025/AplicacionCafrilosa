# ============================================================
# API GATEWAY: Punto de entrada público seguro
# ============================================================

# Crear la identidad (el robot) para el Gateway
resource "google_service_account" "gateway_sa" {
  account_id   = "api-gateway-identity"
  display_name = "Service Account para API Gateway"
  project      = var.project_id
}

# 1. Generar la especificación OpenAPI dinámicamente
#    Reemplaza las variables ${backend_urls} con las URLs reales de Cloud Run
resource "local_file" "openapi_spec" {
  filename = "${path.module}/openapi.yaml"
  content  = templatefile("${path.module}/openapi.tpl", {
    project_id   = var.project_id
    region       = var.region
    backend_urls = var.backend_urls
  })
}

# 2. Crear el recurso API
resource "google_api_gateway_api" "cafrisales_api" {
  provider     = google-beta
  api_id       = "cafrisales-api"
  display_name = "Cafrisales API"
  description  = "API Gateway para Cafrisales"
}

# 3. Crear la Configuración del API (Versionado)
resource "google_api_gateway_api_config" "cafrisales_config" {
  provider      = google-beta
  api           = google_api_gateway_api.cafrisales_api.api_id
  # Usamos timestamp para forzar una config nueva en cada cambio (Google lo requiere)
  api_config_id = "v1-${formatdate("YYYYMMDDhhmmss", timestamp())}"
  display_name  = "Cafrisales API Config v1"
  
  backend_service = "servicemanagement.googleapis.com"

  openapi_config {
    document {
      path     = "openapi.yaml"
      contents = local_file.openapi_spec.content_base64
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [local_file.openapi_spec]
}

# 4. Desplegar el Gateway (El servidor real)
resource "google_api_gateway_gateway" "cafrisales_gateway" {
  provider     = google-beta
  api_config   = google_api_gateway_api_config.cafrisales_config.id
  gateway_id   = "cafrisales-gateway"
  display_name = "Cafrisales Gateway"
  region       = var.region

  labels = var.labels
}

# ============================================================
# OUTPUTS
# ============================================================

output "api_gateway_url" {
  value       = google_api_gateway_gateway.cafrisales_gateway.default_hostname
  description = "URL pública del API Gateway (Poner esto en el Frontend)"
}

output "api_id" {
  value       = google_api_gateway_api.cafrisales_api.api_id
  description = "ID del API"
}

output "gateway_sa_email" {
  description = "El email del robot del API Gateway"
  value       = google_service_account.gateway_sa.email
}