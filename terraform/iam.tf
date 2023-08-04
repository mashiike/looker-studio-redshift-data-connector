/*
locals {
  audience       = "12345789-hogehoge.apps.googleusercontent.com"
  host_domain    = "example.com"
  workgroup_name = "<your workgroup name>"
  cluster_id     = "<your cluster id>"
  db_user        = "<your db user name>"
}
*/

resource "aws_iam_role" "main" {
  name               = "LookerStudioRedshiftDataConnector"
  assume_role_policy = data.aws_iam_policy_document.assume_role_google.json
}

data "aws_iam_policy_document" "assume_role_google" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["accounts.google.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "accounts.google.com:aud"
      values   = [local.audience]
    }
    condition {
      test     = "StringLike"
      variable = "accounts.google.com:email"
      values   = ["*@${local.host_domain}"]
    }
  }
}

resource "aws_iam_role_policy" "redshift_data" {
  name   = "RedshiftDataAccess"
  role   = aws_iam_role.main.name
  policy = data.aws_iam_policy_document.redshift_data.json
}

data "aws_redshiftserverless_workgroup" "default" {
  workgroup_name = local.workgroup_name
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "redshift_data" {
  statement {
    sid = "AllowRedshiftDataAccess"
    actions = [
      "redshift-data:DescribeTable",
      "redshift-data:ExecuteStatement",
      "redshift-data:GetStatementResult",
      "redshift-data:DescribeStatement",
    ]
    resources = ["*"]
    effect    = "Allow"
  }

  statement {
    sid = "AllowRedshiftTemporaryCredentialAccess"
    actions = [
      "redshift-serverless:GetCredentials",
      "redshift:GetClusterCredentials",
    ]
    resources = [
      data.aws_redshiftserverless_workgroup.default.arn,
      "arn:aws:redshift:*:${data.aws_caller_identity.current.account_id}:dbgroup:${local.cluster_id}/*",
      "arn:aws:redshift:*:${data.aws_caller_identity.current.account_id}:dbuser:${local.cluster_id}/${local.db_user}",
      "arn:aws:redshift:*:${data.aws_caller_identity.current.account_id}:dbname:${local.cluster_id}/*"
    ]
    effect = "Allow"
  }
}
