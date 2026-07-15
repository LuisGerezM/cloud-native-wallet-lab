# Expone el ARN del rol como output (buena practica IaC)
output "github_actions_role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes via OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "user_pool_id" {
  description = "ID of the Cognito user pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "ID of the Cognito user pool client"
  value       = aws_cognito_user_pool_client.web.id
}


output "backend_api_url" {
  description = "Base URL of the backend HTTP API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
