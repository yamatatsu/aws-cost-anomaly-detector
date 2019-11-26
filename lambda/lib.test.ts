import { getMetricStatisticsParams, getMaximum, getFields } from "./lib";

test("getMetricStatisticsParams fiter for not 'ServiceName'", () => {
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

test("getMetricStatisticsParams maximum case", () => {
  const now = new Date("2019-11-26");
  const yesterdday = new Date("2019-11-25");
  const metrics = [
    {
      Dimensions: [
        { Name: "ServiceName", Value: "Foo" },
        { Name: "ServiceName", Value: "Foo" },
      ],
    },
    { Dimensions: [{ Name: "ServiceName", Value: "Foo" }] },
    { Dimensions: [{ Name: "ServiceName", Value: "Bar" }] },
    { Dimensions: [] },
    {},
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
        { Name: "ServiceName", Value: "Foo" },
      ],
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
        { Name: "ServiceName", Value: "Bar" },
      ],
    },
  ]);
});

test("getMaximum get 'Maximum'", () => {
  const ms = { Datapoints: [{ Maximum: 999 }] };
  expect(getMaximum(ms)).toEqual(999);
});
test("getMaximum if no 'Maximum'", () => {
  const ms = { Datapoints: [{}] };
  expect(getMaximum(ms)).toEqual(0);
});
test("getMaximum if no datapoint", () => {
  const ms = { Datapoints: [] };
  expect(getMaximum(ms)).toEqual(0);
});
test("getMaximum if no 'Datapoints'", () => {
  const ms = {};
  expect(getMaximum(ms)).toEqual(0);
});

test("getFields", () => {
  const metricStatistics = [
    { Label: "test_Label", Datapoints: [{ Maximum: 999 }] },
  ];
  expect(getFields(metricStatistics)).toEqual([
    {
      title: "test_Label",
      value: "$999",
      short: true,
    },
  ]);
});
