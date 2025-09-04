terraform {
  backend "gcs" {
    bucket = "comp30022-staging-gcp-vm-tfstate"
    prefix = "staging/vm"
  }
}
