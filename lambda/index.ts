import { CloudWatchLogsHandler } from "aws-lambda";
import { CloudWatch } from "aws-sdk";
import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import {
  getMetricStatisticsParams,
  getMaximum,
  getFields,
  assertIsDefined,
  callingArguments,
} from "./lib";

const messenger = (token: string | undefined) => {
  const slack = new WebClient(token);
  return (args: ChatPostMessageArguments) => slack.chat.postMessage(args);
};

const cloudwatch = new CloudWatch({ region: "us-east-1" });
const listMetrics = () =>
  cloudwatch.listMetrics({ MetricName: "EstimatedCharges" }).promise();
const getMaximumMetricStatistics = (
  params: CloudWatch.GetMetricStatisticsInput,
) => cloudwatch.getMetricStatistics(params).promise();

export const handler: CloudWatchLogsHandler = async () => {
  const { SLACK_API_TOKEN, POST_CHANNEL } = process.env;
  assertIsDefined(SLACK_API_TOKEN);
  assertIsDefined(POST_CHANNEL);
  const now = new Date();

  const post = messenger(SLACK_API_TOKEN);

  const listMetricsOutput = await listMetrics();
  log({ listMetricsOutput });
  if (!listMetricsOutput.Metrics) {
    console.info("No Metrics is found.");
    return;
  }

  const maximumMetricStatistics = await Promise.all(
    getMetricStatisticsParams(now, listMetricsOutput.Metrics).map(
      getMaximumMetricStatistics,
    ),
  );
  log({ maximumMetricStatistics });

  const fields = getFields(maximumMetricStatistics);

  const total = getMaximum(maximumMetricStatistics[0]);

  log({ fields, total });

  await post(callingArguments(POST_CHANNEL, total, fields));
};

function log(obj: Object) {
  Object.entries(obj).forEach(([k, v]) => {
    console.log(`${k}:: ${JSON.stringify(v, null, 2)}`);
  });
}
