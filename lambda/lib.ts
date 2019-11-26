import { CloudWatch } from "aws-sdk";
import { subDays } from "date-fns";
import { ChatPostMessageArguments } from "@slack/web-api";

const PERIOD = 24 * 60 * 60; // 1 day

type MetricStatistic = { Datapoints?: { Maximum?: number }[] };
type Dimension = { Name: string; Value: string };
type Metric = { Dimensions?: Dimension[] };

export const getMetricStatisticsParams = (
  now: Date,
  metrics: Metric[],
): CloudWatch.GetMetricStatisticsInput[] => {
  const dimensionsList = metrics
    .map(metric => metric.Dimensions && metric.Dimensions[0])
    .filter(isNotNull)
    .filter(dimension => dimension.Name == "ServiceName")
    .map(dimension => dimension.Value)
    .filter((serviceName, index, self) => self.indexOf(serviceName) === index)
    .map(serviceName => [
      { Name: "Currency", Value: "USD" },
      { Name: "ServiceName", Value: serviceName },
    ]);

  return [[{ Name: "Currency", Value: "USD" }], ...dimensionsList].map(
    dimensions => ({
      MetricName: "EstimatedCharges",
      Namespace: "AWS/Billing",
      Period: PERIOD,
      StartTime: subDays(now, 1),
      EndTime: now,
      Statistics: ["Maximum"],
      Dimensions: dimensions,
    }),
  );
};

export const getMaximum = (ms: MetricStatistic | undefined) =>
  ms?.Datapoints?.[0].Maximum ?? 0;

export const getFields = (
  metricStatistics: CloudWatch.GetMetricStatisticsOutput[],
) =>
  metricStatistics
    .filter(result => result.Label)
    .sort((result1, result2) => getMaximum(result2) - getMaximum(result1))
    .map(result => {
      const maximum = getMaximum(result);
      if (!maximum || !result.Label) return null;
      return {
        title: result.Label,
        value: `$${maximum}`,
        short: true,
      };
    })
    .filter(isNotNull);

export function callingArguments(
  channel: string,
  maximumDatapoint: number,
  fields: {
    title: string;
    value: string;
    short?: boolean;
  }[],
): ChatPostMessageArguments {
  return {
    channel,
    text: "FooBaa",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Hello* hello: " + maximumDatapoint,
        },
      },
    ],
    attachments: [{ fields }],
  };
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}

function isNotNull<T>(dimension: T): dimension is NonNullable<T> {
  return !!dimension;
}
