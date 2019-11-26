import { getServiceNames, getAmount } from "./lib";

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
