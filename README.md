# aws-billing-monitor-cdk

This is cdk stacks to provision AWS billing monitor.

## Usage

### Preparation
Create `.env` file.

```sh
echo "AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_DEFAULT_REGION=your-aws-region
SLACK_API_TOKEN=your-slack-api-token
POST_CHANNEL=your-slack-channel-id
" > .env
```

### Deploy CDK

```sh
yarn
yarn deploy
```
