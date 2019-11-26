import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";

export class BillingMonitor extends cdk.Stack {
  constructor(parent: cdk.App, id: string, props?: cdk.StackProps) {
    super(parent, id, props);

    const { SLACK_API_TOKEN, POST_CHANNEL } = process.env;
    assertIsDefined(SLACK_API_TOKEN);
    assertIsDefined(POST_CHANNEL);

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
      environment: { SLACK_API_TOKEN, POST_CHANNEL },
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
      schedule: events.Schedule.cron({ minute: "0", hour: "0" }),
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
