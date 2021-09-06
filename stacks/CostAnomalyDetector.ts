import * as cdk from "@aws-cdk/core";
import * as chatbot from "@aws-cdk/aws-chatbot";
import * as sns from "@aws-cdk/aws-sns";
import * as ce from "@aws-cdk/aws-ce";

type Props = cdk.StackProps & {
  slackWorkspaceId: string;
  slackChannelId: string;
};

export class CostAnomalyDetector extends cdk.Stack {
  constructor(parent: cdk.App, id: string, props: Props) {
    super(parent, id, props);

    const { slackWorkspaceId, slackChannelId } = props;

    const topic = new sns.Topic(this, "topic");

    /**
     * It is requires to some setup to be done in the AWS Chatbot console.
     * Look https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/aws-resource-chatbot-slackchannelconfiguration.html
     * 1. Select client(Slack) and click button
     * 2. Click Allow button in slack oauth page
     * 3. You can see Workspace Id
     */
    new chatbot.SlackChannelConfiguration(this, "chatbot", {
      slackChannelConfigurationName: "CostAnomalyDetector",
      slackWorkspaceId,
      slackChannelId,
      notificationTopics: [topic],
    });

    const anomalyMonitor = new ce.CfnAnomalyMonitor(this, "AnomalyMonitor", {
      monitorName: "MyAnomalyMonitor",
      monitorType: "DIMENSIONAL",
      monitorDimension: "SERVICE",
    });

    new ce.CfnAnomalySubscription(this, "AnomalySubscription", {
      subscriptionName: "MyAnomalySubscription",
      frequency: "IMMEDIATE",
      monitorArnList: [anomalyMonitor.ref],
      subscribers: [{ type: "SNS", address: topic.topicArn }],
      // 実験的に1を設定してみる
      threshold: 1,
    });
  }
}
