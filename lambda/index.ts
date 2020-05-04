import { Handler, CloudWatchLogsEvent } from "aws-lambda";
import { CloudWatch } from "aws-sdk";
import { main } from "./lib";

const cloudwatch = new CloudWatch({ region: "us-east-1" });

const listMetrics = async () => {
  const params = { MetricName: "EstimatedCharges" };
  const data = await cloudwatch.listMetrics(params).promise();
  log({ ListMetricsOutput: data });
  return data;
};

const getMetricStatistics = async (
  params: CloudWatch.GetMetricStatisticsInput,
) => {
  log({ GetMetricStatisticsInput: params });
  const data = cloudwatch.getMetricStatistics(params).promise();
  log({ GetMetricStatisticsOutput: data });
  return data;
};

export const handler: Handler<CloudWatchLogsEvent, any> = async () => {
  const res = main(new Date(), getMetricStatistics, listMetrics);
  log(res);
  return res;
};

function log(obj: Object) {
  Object.entries(obj).forEach(([k, v]) => {
    console.log(`${k}:: ${JSON.stringify(v, null, 2)}`);
  });
}
