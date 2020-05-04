import { CloudWatch } from "aws-sdk";
import { getServiceNames, getAmount, main } from "./lib";

test("getServiceNames fiter for not 'ServiceName'", () => {
  const metrics = [{ Dimensions: [{ Name: "Foo", Value: "Bar" }] }];
  expect(getServiceNames(metrics)).toEqual([]);
});

test("getServiceNames maximum case", () => {
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
  expect(getServiceNames(metrics)).toEqual(["Foo", "Bar"]);
});

test("getAmount get 'Maximum'", () => {
  const ms = { Datapoints: [{ Maximum: 999 }] };
  expect(getAmount(ms)).toEqual(999);
});
test("getAmount if no 'Maximum'", () => {
  const ms = { Datapoints: [{}] };
  expect(getAmount(ms)).toEqual(0);
});
test("getAmount if no datapoint", () => {
  const ms = { Datapoints: [] };
  expect(getAmount(ms)).toEqual(0);
});
test("getAmount if no 'Datapoints'", () => {
  const ms = {};
  expect(getAmount(ms)).toEqual(0);
});

test("main", async () => {
  const date = new Date("2020-05-04");
  const listMetrics = async () => {
    return {
      Metrics: [
        { Dimensions: [{ Name: "ServiceName", Value: "AmazonEC2" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AWSMarketplace" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AmazonCloudWatch" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AmazonSNS" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AWSDataTransfer" }] },
        { Dimensions: [{ Name: "Currency", Value: "USD" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "awskms" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AmazonS3" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AWSLambda" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AWSXRay" }] },
        { Dimensions: [{ Name: "ServiceName", Value: "AmazonApiGateway" }] },
      ],
    };
  };

  const getMetricStatistics = async (
    params: CloudWatch.GetMetricStatisticsInput,
  ) => {
    expect(params).toMatchObject({
      MetricName: "EstimatedCharges",
      Namespace: "AWS/Billing",
      Period: 24 * 60 * 60,
      StartTime: new Date("2020-05-03"),
      EndTime: new Date("2020-05-04"),
      Statistics: ["Maximum"],
      // Dimensions: dimensions,
    });
    expect(Array.isArray(params.Dimensions)).toBeTruthy();
    return { Datapoints: [{ Maximum: 0 }] };
  };
  await expect(
    main(date, getMetricStatistics, listMetrics),
  ).resolves.toStrictEqual({
    total: 0,
    fields: [
      { title: "AmazonEC2", value: 0 },
      { title: "AWSMarketplace", value: 0 },
      { title: "AmazonCloudWatch", value: 0 },
      { title: "AmazonSNS", value: 0 },
      { title: "AWSDataTransfer", value: 0 },
      { title: "awskms", value: 0 },
      { title: "AmazonS3", value: 0 },
      { title: "AWSLambda", value: 0 },
      { title: "AWSXRay", value: 0 },
      { title: "AmazonApiGateway", value: 0 },
    ],
  });
});
