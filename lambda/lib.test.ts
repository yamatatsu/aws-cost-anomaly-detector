import { getMetricStatisticsParams } from "./lib";

test("getMetricStatisticsParams", async () => {
  const now = new Date("2019-11-26");
  const yesterdday = new Date("2019-11-25");
  const metrics = [{ Dimensions: [{ Name: "Foo", Value: "Bar" }] }];
  expect(getMetricStatisticsParams(now, metrics)).toEqual([
    {
      MetricName: "EstimatedCharges",
      Namespace: "AWS/Billing",
      Period: 86400,
      StartTime: yesterdday,
      EndTime: now,
      Statistics: ["Maximum"],
      Dimensions: [{ Name: "Currency", Value: "USD" }],
    },
  ]);
});
test("getMetricStatisticsParams", async () => {
  const now = new Date("2019-11-26");
  const yesterdday = new Date("2019-11-25");
  const metrics = [
    {
      Dimensions: [
        { Name: "ServiceName", Value: "FooBar" },
        { Name: "ServiceName", Value: "FooBar" },
      ],
    },
  ];
  expect(getMetricStatisticsParams(now, metrics)).toEqual([
    {
      MetricName: "EstimatedCharges",
      Namespace: "AWS/Billing",
      Period: 86400,
      StartTime: yesterdday,
      EndTime: now,
      Statistics: ["Maximum"],
      Dimensions: [{ Name: "Currency", Value: "USD" }],
    },
    {
      MetricName: "EstimatedCharges",
      Namespace: "AWS/Billing",
      Period: 86400,
      StartTime: yesterdday,
      EndTime: now,
      Statistics: ["Maximum"],
      Dimensions: [
        { Name: "Currency", Value: "USD" },
        { Name: "ServiceName", Value: "FooBar" },
      ],
    },
  ]);
});
