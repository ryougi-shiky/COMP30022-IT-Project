resource "google_storage_bucket" "tfstate" {
  name     = "aniani-staging-gcp-vm-tfstate"
  location = "US-CENTRAL1"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 5
    }
  }

  retention_policy {
    retention_period = 604800  # seconds, 7 days
    is_locked = false
  }
}
