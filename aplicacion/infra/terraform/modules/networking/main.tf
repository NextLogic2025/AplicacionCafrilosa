# ============================================================
# VPC: Red privada aislada
# ============================================================

resource "google_compute_network" "vpc" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  description             = "VPC privada para ${var.app_name}"
  labels                  = var.labels
}

# ============================================================
# SUBNET: Subred para Cloud Run y aplicaciones
# ============================================================

resource "google_compute_subnetwork" "app_subnet" {
  name          = "${var.app_name}-app-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  description   = "Subred para servicios de aplicación"

  # Logs de acceso a la red (auditoría)
  enable_flow_logs = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5  # 50% de trafico
    metadata             = "INCLUDE_ALL_METADATA"
  }

  labels = var.labels
}

# ============================================================
# VPC ACCESS CONNECTOR: Cloud Run ↔ Cloud SQL
# ============================================================

resource "google_vpc_access_connector" "cloud_run_connector" {
  name          = "${var.app_name}-vpc-connector"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 10

  labels = var.labels

  depends_on = [google_compute_network.vpc]
}

# ============================================================
# CLOUD NAT: Salida a internet sin IP pública
# ============================================================

resource "google_compute_router" "router" {
  name    = "${var.app_name}-router"
  network = google_compute_network.vpc.id
  region  = var.region

  bgp {
    asn = 64514
  }

  labels = var.labels
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.app_name}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  # Logging de conexiones NAT
  enable_logging       = true
  logging_filter       = "ERRORS_ONLY"

  # Timeouts de conexión
  tcp_established_idle_timeout_sec = 1200
  tcp_transitory_idle_timeout_sec  = 30
  udp_idle_timeout_sec             = 30

  labels = var.labels

  depends_on = [google_compute_router.router]
}

# ============================================================
# PRIVATE SERVICE CONNECTION: Cloud SQL ↔ VPC
# ============================================================

resource "google_compute_global_address" "private_ip_alloc" {
  name          = "${var.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id

  labels = var.labels
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]

  depends_on = [google_compute_global_address.private_ip_alloc]
}

# ============================================================
# FIREWALL RULES: Controlar tráfico de red
# ============================================================

# Permitir tráfico interno (Cloud Run ↔ Cloud SQL)
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.app_name}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
  }

  source_ranges = ["10.0.0.0/8"]
  target_tags   = ["${var.app_name}-internal"]

  labels = var.labels
}

# Denegar todos los demás (default: DENY)
resource "google_compute_firewall" "deny_all" {
  name    = "${var.app_name}-deny-all"
  network = google_compute_network.vpc.name

  deny {
    protocol = "all"
  }

  priority = 65534  # Baja prioridad (default)

  labels = var.labels
}

# ============================================================
# OUTPUTS
# ============================================================

output "vpc_id" {
  value       = google_compute_network.vpc.id
  description = "ID de la VPC"
}

output "vpc_self_link" {
  value       = google_compute_network.vpc.self_link
  description = "Self link de la VPC"
}

output "subnet_id" {
  value       = google_compute_subnetwork.app_subnet.id
  description = "ID de la subred"
}

output "vpc_connector_id" {
  value       = google_vpc_access_connector.cloud_run_connector.id
  description = "ID del VPC Access Connector (para Cloud Run)"
}

output "vpc_connector_name" {
  value       = google_vpc_access_connector.cloud_run_connector.name
  description = "Nombre del VPC Access Connector"
}
