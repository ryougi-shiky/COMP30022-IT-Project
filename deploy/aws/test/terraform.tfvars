aws_account_id = "219396432881"

image_nginx   = "public.ecr.aws/g0n3r5g7/comp30022-forum/nginx:0.2.4"
image_backend = "public.ecr.aws/g0n3r5g7/comp30022-forum/backend:0.2.4"
image_mongodb = "public.ecr.aws/g0n3r5g7/comp30022-forum/mongodb:0.2.4"

cluster_arn = "arn:aws:ecs:ap-northeast-1:219396432881:cluster/comp30022-test-cluster"
cluster_id = "comp30022-test-cluster"
subnet_ids = ["subnet-04b2746535e69ec5d", "subnet-0cf4543ff1ae4a348"]
security_group_ids = ["sg-0fb86b63af36a68a9"]
alb_target_group_arn = "arn:aws:elasticloadbalancing:ap-northeast-1:219396432881:targetgroup/comp30022-test-nginx-tg/179341cdb2165f2f"
execution_role_arn = "arn:aws:iam::219396432881:role/comp30022-test-ecs-task-execution-role"
desired_count      = 1

container_cpu    = 1024
container_memory = 2048
