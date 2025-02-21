
STACK_NAME="$1"  

if [ -z "$STACK_NAME" ]; then
  echo "Usage: $0 <stack-name>"
  exit 1
fi

echo "Deleting stack: $STACK_NAME"


#//? delete stack with aws cli
aws cloudformation delete-stack --stack-name  "$STACK_NAME"
