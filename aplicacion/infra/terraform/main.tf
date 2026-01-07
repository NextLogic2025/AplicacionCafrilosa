terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.45"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.45"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ============================================================
# MÓDULO: NETWORKING (VPC, Subnets, NAT, Cloud SQL Proxy)
# ============================================================
module "networking" {
  source = "./modules/networking"

  project_id = var.project_id
  region     = var.region
  app_name   = local.app_name
  labels     = local.common_labels
}

# ============================================================
# MÓDULO: DATABASE (Cloud SQL PostgreSQL)
# ============================================================
module "database" {
  source = "./modules/database"

  project_id              = var.project_id
  region                  = var.region
  zone                    = var.zone
  services                = var.services
  vpc_id                  = module.networking.vpc_id
  deletion_protection     = var.enable_deletion_protection
  backup_retention_days   = var.backup_retention_days
  labels                  = local.common_labels

  depends_on = [module.networking]
}

# ============================================================
# MÓDULO: ARTIFACT REGISTRY (Registro de imágenes Docker)
# ============================================================
module "artifact_registry" {
  source = "./modules/artifact_registry"

  project_id = var.project_id
  region     = var.region
  app_name   = local.app_name
  labels     = local.common_labels
}

# ============================================================
# MÓDULO: CLOUD BUILD (CI/CD)
# ============================================================
module "cloud_build" {
  source = "./modules/cloud_build"

  project_id        = var.project_id
  region            = var.region
  services          = var.services
  github_repo_owner = var.github_repo_owner
  github_repo_name  = var.github_repo_name
  artifact_registry = module.artifact_registry.repository_name
  labels            = local.common_labels
}

# ============================================================
# MÓDULO: CLOUD RUN (Despliegue de servicios)
# ============================================================
module "cloud_run" {
  source = "./modules/cloud_run"

  project_id            = var.project_id
  region                = var.region
  services              = var.services
  artifact_registry_url = module.artifact_registry.repository_url
  vpc_connector_id      = module.networking.vpc_connector_id
  cloudsql_private_ip   = module.database.cloudsql_private_ip
  cloudsql_connection   = module.database.cloudsql_connection_name
  labels                = local.common_labels

  depends_on = [module.database, module.artifact_registry]
}

# ============================================================
# MÓDULO: API GATEWAY (Punto de entrada público)
# ============================================================
module "api_gateway" {
  source = "./modules/api_gateway"

  project_id   = var.project_id
  region       = var.region
  services     = var.services
  backend_urls = module.cloud_run.service_urls
  labels       = local.common_labels

  depends_on = [module.cloud_run]
}
