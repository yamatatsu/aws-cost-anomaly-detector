import "@aws-cdk/assert/jest";
import * as cdk from "@aws-cdk/core";
import { BillingMonitor } from "../";
import { SynthUtils } from "@aws-cdk/assert";

describe("Waf", () => {
  const app = new cdk.App();
  const billingMonitor = new BillingMonitor(app, "BillingMonitor");
  test("snapshot", () => {
    expect(SynthUtils.toCloudFormation(billingMonitor)).toMatchSnapshot();
  });
});
