# modules/firebase/main.tf

variable "project_id" {}
variable "app_name" {}

resource "google_project_service" "firebase" {
  project            = var.project_id
  service            = "firebase.googleapis.com"
  disable_on_destroy = false
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
  
  # Esperamos a que la API esté habilitada
  depends_on = [google_project_service.firebase]
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.app_name}-web-hosting"

  depends_on   = [google_firebase_project.default]
}