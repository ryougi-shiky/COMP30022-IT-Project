#!/bin/bash

# 检查环境变量是否设置
if [ -z "$DO_TOKEN" ]; then
  echo "Error: DO_TOKEN environment variable is not set"
  exit 1
fi

if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI environment variable is not set"
  exit 1
fi

# 导出变量给 Terraform 使用
export TF_VAR_do_token="$DO_TOKEN"
export TF_VAR_mongodb_uri="$MONGODB_URI"

# 切换到 terraform 目录
cd "$(dirname "$0")"

# 运行 terraform 命令
terraform "$@" 