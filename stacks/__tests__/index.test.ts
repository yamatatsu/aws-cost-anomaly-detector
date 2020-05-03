import "@aws-cdk/assert/jest";
import * as cdk from "@aws-cdk/core";
import { SynthUtils } from "@aws-cdk/assert";
import { BillingMonitor } from "../";

describe("BillingMonitor", () => {
  const app = new cdk.App();
  const billingMonitor = new BillingMonitor(app, "BillingMonitor");
  test("snapshot", () => {
    expect(SynthUtils.toCloudFormation(billingMonitor)).toMatchSnapshot();
  });
});
