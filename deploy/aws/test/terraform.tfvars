aws_account_id = "219396432881"

image_nginx   = "public.ecr.aws/g0n3r5g7/comp30022-forum/nginx:0.2.3"
image_backend = "public.ecr.aws/g0n3r5g7/comp30022-forum/backend:0.2.3"
image_mongodb = "public.ecr.aws/g0n3r5g7/comp30022-forum/mongodb:0.2.3"

cluster_arn = "arn:aws:ecs:ap-northeast-1:219396432881:cluster/comp30022-test-cluster"
cluster_id = "comp30022-test-cluster"
subnet_ids = ["subnet-04b2746535e69ec5d", "subnet-0cf4543ff1ae4a348"]
security_group_ids = ["sg-057dbc17de537b5fb"]
alb_target_group_arn = "arn:aws:elasticloadbalancing:ap-northeast-1:219396432881:targetgroup/comp30022-nginx-tg/3b4c5192d280d063"
execution_role_arn = "arn:aws:iam::219396432881:role/comp30022-ecs-task-execution-role"
desired_count      = 1
