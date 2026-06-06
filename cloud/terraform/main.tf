# Cloud Run Service Configuration (Terraform)
# For infrastructure as code deployment

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL Instance
resource "google_sql_database_instance" "cloudjudge_db" {
  name             = "cloudjudge-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  deletion_protection = true

  settings {
    tier = "db-n1-standard-2"
    disk_size = 20
    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.cloudjudge_network.id
    }
  }
}

# Database
resource "google_sql_database" "cloudjudge" {
  name     = "cloudjudge"
  instance = google_sql_database_instance.cloudjudge_db.name
}

# Cloud SQL User
resource "google_sql_user" "cloudjudge" {
  name     = "cloudjudge"
  instance = google_sql_database_instance.cloudjudge_db.name
  password = var.db_password
}

# VPC Network
resource "google_compute_network" "cloudjudge_network" {
  name                    = "cloudjudge-network"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "cloudjudge_subnet" {
  name          = "cloudjudge-subnet"
  network       = google_compute_network.cloudjudge_network.id
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
}

# Cloud Storage Bucket
resource "google_storage_bucket" "cloudjudge_uploads" {
  name         = "${var.project_id}-cloudjudge-uploads"
  location     = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true
}

# Cloud Run - Backend
resource "google_cloud_run_v2_service" "backend" {
  name     = "cloudjudge-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 100
    }

    containers {
      image = "gcr.io/${var.project_id}/cloudjudge-backend:latest"
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
      ports {
        container_port = 8080
      }
      env {
        name  = "DATABASE_URL"
        value = google_sql_database_instance.cloudjudge_db.connection_name
      }
      env {
        name  = "SECRET_KEY"
        value = var.secret_key
      }
    }

    vpc_access {
      network    = google_compute_network.cloudjudge_network.id
      subnetwork = google_compute_subnetwork.cloudjudge_subnet.name
    }
  }
}

# Cloud Run - Frontend
resource "google_cloud_run_v2_service" "frontend" {
  name     = "cloudjudge-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.frontend_sa.email

    containers {
      image = "gcr.io/${var.project_id}/cloudjudge-frontend:latest"
      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
      }
    }
  }
}

# Service Account - Backend
resource "google_service_account" "backend_sa" {
  account_id = "cloudjudge-backend-sa"
}

# Service Account - Frontend
resource "google_service_account" "frontend_sa" {
  account_id = "cloudjudge-frontend-sa"
}

# IAM - Backend can access Cloud SQL
resource "google_project_iam_member" "backend_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend_sa.email}"
}

# IAM - Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAM - Allow public access to backend
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-southeast1"
}

variable "db_password" {
  description = "Cloud SQL password"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Application secret key"
  type        = string
  sensitive   = true
}

# Outputs
output "frontend_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}
