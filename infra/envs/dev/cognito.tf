resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-${var.environment}" # wallet-lab-dev

  username_attributes      = ["email"] # loguear con email
  auto_verified_attributes = ["email"] # Cognito verifica el mail

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # mfa_configuration = "OFF"   # default; en dev lo dejamos asi

  # TODO: default_tags (providers.tf) es lo que llena esta parte global
  #   tags = {
  #     Project     = var.project
  #     Environment = var.environment
  #   }
}


resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project}-${var.environment}-web" # reto: "${var.project}-${var.environment}-web"
  user_pool_id = aws_cognito_user_pool.main.id           # referencia al pool de arriba

  generate_secret = false # front SPA: sin secret

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}
