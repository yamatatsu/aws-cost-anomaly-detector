import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as chatbot from "@aws-cdk/aws-chatbot";
import * as sns from "@aws-cdk/aws-sns";
import * as lambdaDestinations from "@aws-cdk/aws-lambda-destinations";
import * as budgets from "@aws-cdk/aws-budgets";

export class BillingMonitor extends cdk.Stack {
  constructor(parent: cdk.App, id: string, props?: cdk.StackProps) {
    super(parent, id, props);

    const { SLACK_WORKSPACE_ID, SLACK_CHANNEL_ID } = process.env;
    assertIsDefined(SLACK_WORKSPACE_ID);
    assertIsDefined(SLACK_CHANNEL_ID);

    const chatbotRole = new iam.Role(this, "chatbotRole", {
      assumedBy: new iam.ServicePrincipal("chatbot.amazonaws.com"),
      inlinePolicies: {
        ChatbotNotificationsOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: ["*"],
              actions: [
                "cloudwatch:Describe*",
                "cloudwatch:Get*",
                "cloudwatch:List*",
              ],
            }),
          ],
        }),
      },
    });

    const topic = new sns.Topic(this, "topic");

    /**
     * It is requires to some setup to be done in the AWS Chatbot console.
     * Look https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/aws-resource-chatbot-slackchannelconfiguration.html
     * 1. Select client(Slack) and click button
     * 2. Click Allow button in slack oauth page
     * 3. You can see Workspace Id
     */
    new chatbot.CfnSlackChannelConfiguration(this, "chatbot", {
      configurationName: "BillingMonitor",
      slackWorkspaceId: SLACK_WORKSPACE_ID,
      slackChannelId: SLACK_CHANNEL_ID,
      iamRoleArn: chatbotRole.roleArn,
      snsTopicArns: [topic.topicArn],
    });

    const subscribers = [{ address: topic.topicArn, subscriptionType: "SNS" }];
    const notification = { notificationType: "ACTUAL", threshold: 0.1 };
    new budgets.CfnBudget(this, "budget", {
      budget: {
        budgetLimit: { amount: 1, unit: "USD" },
        budgetType: "COST",
        timeUnit: "MONTHLY",
      },
      notificationsWithSubscribers: [
        {
          notification: { comparisonOperator: "EQUAL_TO", ...notification },
          subscribers,
        },
        {
          notification: { comparisonOperator: "GREATER_THAN", ...notification },
          subscribers,
        },
        {
          notification: { comparisonOperator: "LESS_THAN", ...notification },
          subscribers,
        },
      ],
    });
    topic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AWSBudgetsSNSPublishingPermissions",
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("budgets.amazonaws.com")],
        actions: ["SNS:Publish"],
        resources: [topic.topicArn],
      }),
    );

    // ========================================
    // TODO: 以下、lambdaからchatbotを起動しようとして儚くも力尽きた残骸たち。
    // いつか自由にchatbotを発火できるようになるって信じてる。
    const handler = new lambda.Function(this, "BillingMonitorFunction", {
      handler: "index.handler",
      functionName: "BillingMonitor",
      code: new lambda.AssetCode("./dist"),
      layers: [
        new lambda.LayerVersion(this, "modules", {
          code: new lambda.AssetCode("./layer-dist"),
        }),
      ],
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.seconds(10),
    });

    const snsDestination = new lambdaDestinations.SnsDestination(topic);
    new lambda.EventInvokeConfig(this, "EventInvokeConfig", {
      function: handler,
      onSuccess: snsDestination,
      onFailure: snsDestination,
    });

    handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:ListMetrics", "cloudwatch:GetMetricStatistics"],
        resources: ["*"],
      }),
    );

    new events.Rule(this, "BillingMonitorCron", {
      ruleName: "BillingMonitorCron",
      schedule: events.Schedule.cron({ hour: "13", minute: "00" }),
      targets: [new targets.LambdaFunction(handler)],
    });
  }
}

const app = new cdk.App();
new BillingMonitor(app, "BillingMonitor");

function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}
