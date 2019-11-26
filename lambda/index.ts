import { CloudWatchLogsHandler } from "aws-lambda";
import { CloudWatch } from "aws-sdk";
import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import {
  getServiceNames,
  getParam,
  getAmount,
  assertIsDefined,
  callingArguments,
} from "./lib";

const currency = { Name: "Currency", Value: "USD" };

const messenger = (token: string | undefined) => {
  const slack = new WebClient(token);
  return (args: ChatPostMessageArguments) => slack.chat.postMessage(args);
};

const cloudwatch = new CloudWatch({ region: "us-east-1" });
const listMetrics = () =>
  cloudwatch.listMetrics({ MetricName: "EstimatedCharges" }).promise();
const getMetricStatistics = (params: CloudWatch.GetMetricStatisticsInput) =>
  cloudwatch.getMetricStatistics(params).promise();

export const handler: CloudWatchLogsHandler = async () => {
  const { SLACK_API_TOKEN, POST_CHANNEL } = process.env;
  assertIsDefined(SLACK_API_TOKEN);
  assertIsDefined(POST_CHANNEL);
  const now = new Date();

  const _getParam = getParam(now);
  const post = messenger(SLACK_API_TOKEN);

  const totalStatistics = await getMetricStatistics(_getParam([currency]));
  log({ totalStatistics });
  const total = getAmount(totalStatistics);

  const listMetricsOutput = await listMetrics();
  log({ listMetricsOutput });
  assertIsDefined(listMetricsOutput.Metrics);

  const promises = getServiceNames(listMetricsOutput.Metrics).map(
    async serviceName => {
      const fieldStatistics = await getMetricStatistics(
        _getParam([currency, { Name: "ServiceName", Value: serviceName }]),
      );
      log({ fieldStatistics });

      return { serviceName, amount: getAmount(fieldStatistics) };
    },
  );
  const billings = await Promise.all(promises);

  const fields = billings
    .sort((b1, b2) => b2.amount - b1.amount)
    .map(b => ({ title: b.serviceName, value: `$${b.amount}`, short: true }));

  log({ fields });

  await post(callingArguments(POST_CHANNEL, total, fields));
};

function log(obj: Object) {
  Object.entries(obj).forEach(([k, v]) => {
    console.log(`${k}:: ${JSON.stringify(v, null, 2)}`);
  });
}
