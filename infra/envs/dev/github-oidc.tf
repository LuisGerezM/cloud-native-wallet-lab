data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# si el recurso no existe aun, se puede crear con el comando:
# resource "aws_iam_openid_connect_provider" "github" {
#   url            = "https://token.actions.githubusercontent.com"
#   client_id_list = ["sts.amazonaws.com"]
# }

resource "aws_iam_role" "github_actions" {
  name = "wallet-lab-github-actions-dev"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:LuisGerezM/cloud-native-wallet-lab:*"
          }
        }
      }
    ]
  })
}

# Attach del managed ReadOnlyAccess
resource "aws_iam_role_policy_attachment" "read_only" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

#Inline policy para el state bucket:
resource "aws_iam_role_policy" "tf_state_access" {
  name = "wallet-lab-tf-state-access-dev"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "StateBucketList"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::wallet-lab-tfstate-370292660810"
      },
      {
        Sid      = "StateObjectRW"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "arn:aws:s3:::wallet-lab-tfstate-370292660810/envs/dev/*"
      }
    ]
  })
}
