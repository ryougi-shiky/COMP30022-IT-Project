aws_account_id = "219396432881"

image_nginx   = "ryougishiky/forum-nginx"
image_backend = "ryougishiky/forum-backend"
image_mongodb = "ryougishiky/forum-mongodb"

cluster_arn = "arn:aws:ecs:ap-northeast-1:219396432881:cluster/comp30022-test-cluster"

cluster_id = "comp30022-test-cluster"

subnet_ids = ["subnet-0bb5d7d0aca57c5f0"]
security_group_ids = ["sg-082a1975d51c46de9"]

alb_target_group_arn = ""

execution_role_arn = "arn:aws:iam::219396432881:role/comp30022-ecs-task-execution-role"
desired_count      = 1
