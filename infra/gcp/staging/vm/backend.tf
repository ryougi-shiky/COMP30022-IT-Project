terraform {
  backend "gcs" {
    bucket = "aniani-staging-gcp-vm-tfstate"
    key = "staging/vm/aniani-staging-gcp-vm.tfstate"
  }
}
