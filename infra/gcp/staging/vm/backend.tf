terraform {
  backend "gcs" {
    bucket = "aniani-staging-gcp-vm-tfstate"
    prefix = "staging/vm"
  }
}
