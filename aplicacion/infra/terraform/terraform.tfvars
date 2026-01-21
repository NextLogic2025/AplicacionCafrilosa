# Configuración de GCP
project_id = "gen-lang-client-0059045498"
region     = "us-east1"
zone       = "us-east1-b"

# GitHub para Cloud Build
github_repo_owner = "NextLogic2025"
github_repo_name  = "AplicacionCafrilosa"

# --- CAMBIO CRÍTICO AQUÍ ---
# Lista de servicios basada en las carpetas REALES de Omer
# (Nota: 'inventario' lo quitamos porque está vacío. Agregamos 'auth', 'catalog', 'orders')
services = [
  "finance", 
  "usuarios", 
  "auth", 
  "catalog", 
  "orders", 
  "warehouse"
]

# Configuración de BD
environment = "production"
enable_deletion_protection = false  # Cambiar a true en producción real

# Secretos (generados por Terraform)
db_admin_user = "postgres"

# Configuración de backups
backup_retention_days = 30