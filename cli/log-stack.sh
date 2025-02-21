
#//? logs a specefic stack with aws cli
aws cloudformation describe-stack-events --stack-name multi-tier-stack --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId, ResourceStatusReason]' --output table


