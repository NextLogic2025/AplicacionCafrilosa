resource "google_compute_network" "main_vpc" {
  name                    = "cafrilosa-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.services]
}

resource "google_compute_subnetwork" "services_subnet" {
  name          = "subnet-servicios"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main_vpc.id
}

resource "google_vpc_access_connector" "connector" {
  name          = "vpc-conn"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.main_vpc.name
}