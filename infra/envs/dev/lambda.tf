locals {
  function_name = "${var.project}-${var.environment}-backend" # wallet-lab-dev-backend
}

# --- Log group: lo creamos nosotros para controlar retencion y permisos ---
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14 # dev: 14 dias es suficiente y barato
}

# --- Rol de ejecucion: SOLO el servicio Lambda puede asumirlo (trust policy) ---
resource "aws_iam_role" "lambda_exec" {
  name = "${local.function_name}-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# --- Permisos: escribir SOLO en el log group de arriba (least privilege) ---
resource "aws_iam_role_policy" "lambda_logs" {
  name = "${local.function_name}-logs"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.backend.arn}:*"
    }]
  })
}

# ---
# ---

# --- 2F-3: la Lambda ---
resource "aws_lambda_function" "backend" {
  function_name = local.function_name
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs22.x"
  handler       = "lambda.handler" # bundle esbuild en la raiz del zip: lambda.js, export `handler`

  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256 # redeploy si cambia el zip

  memory_size = 512
  timeout     = 15

  environment {
    variables = {
      NODE_ENV     = "production"
      CORS_ORIGINS = "http://localhost:3000"
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_logs,
    aws_cloudwatch_log_group.backend, # usar el log group nuestro, no que lo cree sola
  ]
}

# --- 2F-4: HTTP API que enruta TODO a la Lambda ---
resource "aws_apigatewayv2_api" "backend" {
  name          = "${local.function_name}-http"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "backend" {
  api_id                 = aws_apigatewayv2_api.backend.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "$default" # catch-all: cualquier metodo/path -> la Lambda (Nest enruta adentro)
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true
}

# Sin esto, API Gateway NO tiene permiso para invocar tu Lambda (fail closed)
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend.execution_arn}/*/*"
}


# Zipea la carpeta autocontenida que arma `pnpm deploy` (dist + node_modules prod).
# Terraform calcula el hash del zip: si el codigo cambia, la Lambda se redeploya sola.
data "archive_file" "backend" {
  type        = "zip"
  source_dir  = "${path.module}/../../../.deploy/backend"
  output_path = "${path.module}/backend.zip"
}
