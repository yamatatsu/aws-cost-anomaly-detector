import { CloudWatch } from "aws-sdk";
import { subDays } from "date-fns";

const PERIOD = 24 * 60 * 60; // 1 day
const CURRENCY = { Name: "Currency", Value: "USD" };

type MetricStatistic = { Datapoints?: { Maximum?: number }[] };
type Dimension = { Name: string; Value: string };
type Metric = { Dimensions?: Dimension[] };

export const getServiceNames = (metrics: Metric[]): string[] => {
  return metrics
    .map((metric) => metric.Dimensions?.[0])
    .filter(isNotNull)
    .filter((dimension) => dimension.Name == "ServiceName")
    .map((dimension) => dimension.Value)
    .filter((serviceName, index, self) => self.indexOf(serviceName) === index);
};

export const getParam = (
  now: Date,
  dimensions: Dimension[],
): CloudWatch.GetMetricStatisticsInput => ({
  MetricName: "EstimatedCharges",
  Namespace: "AWS/Billing",
  Period: PERIOD,
  StartTime: subDays(now, 1),
  EndTime: now,
  Statistics: ["Maximum"],
  Dimensions: dimensions,
});

export const getAmount = (ms: MetricStatistic | undefined) =>
  ms?.Datapoints?.[0]?.Maximum ?? 0;

const getTotal = async (
  now: Date,
  getMetricStatistics: (
    params: CloudWatch.GetMetricStatisticsInput,
  ) => Promise<MetricStatistic>,
) => {
  const totalStatistics = await getMetricStatistics(getParam(now, [CURRENCY]));
  return getAmount(totalStatistics);
};
const getAmounts = (
  now: Date,
  getMetricStatistics: (
    params: CloudWatch.GetMetricStatisticsInput,
  ) => Promise<MetricStatistic>,
) => async (serviceName: string) => {
  const param = getParam(now, [
    CURRENCY,
    { Name: "ServiceName", Value: serviceName },
  ]);
  const metricStatistics = await getMetricStatistics(param);

  return getAmount(metricStatistics);
};

type Return = {
  total: number;
  fields: { title: string; value: number }[];
};
export const main = async (
  now: Date,
  getMetricStatistics: (
    params: CloudWatch.GetMetricStatisticsInput,
  ) => Promise<MetricStatistic>,
  listMetrics: () => Promise<{ Metrics?: Metric[] }>,
): Promise<Return> => {
  const total = await getTotal(now, getMetricStatistics);

  const listMetricsOutput = await listMetrics();
  assertIsDefined(listMetricsOutput.Metrics);

  const serviceNames = getServiceNames(listMetricsOutput.Metrics);
  const amounts = await Promise.all(
    serviceNames.map(getAmounts(now, getMetricStatistics)),
  );

  const fields = zip(serviceNames, amounts)
    .sort(([, amount1], [, amount2]) => amount1 - amount2)
    .map(([serviceName, amount]) => ({
      title: serviceName,
      value: amount,
    }));

  return { total, fields };
};

function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  return arr1.map((el, i) => [el, arr2[i]]);
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be defined, but received ${val}`);
  }
}

function isNotNull<T>(dimension: T): dimension is NonNullable<T> {
  return !!dimension;
}
