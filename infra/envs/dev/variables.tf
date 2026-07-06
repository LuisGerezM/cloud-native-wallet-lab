
variable "aws_region" {
  description = "Region AWS donde se crea la infra"
  type        = string
  default     = "us-east-1" # default es el valor
}

variable "project" {
  description = "Project name to Cognito"
  type        = string
  default     = "wallet-lab"
}

variable "environment" {
  description = "Environment name to Cognito"
  type        = string
  default     = "dev"
}
