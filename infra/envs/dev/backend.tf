terraform {
  backend "s3" {
    bucket = "wallet-lab-tfstate-370292660810" # el bucket del bootstrap
    key    = "envs/dev/terraform.tfstate"      # RUTA del state DENTRO del bucket
    region = "us-east-1"
    # dynamodb_table = "wallet_lab_tf_lock" # la tabla de lock / lock con DynamoDB (patron clasico - deprecado - usar use_lockfile) 
    use_lockfile = true
    encrypt      = true # cifra el state en transito/reposo
  }
}
