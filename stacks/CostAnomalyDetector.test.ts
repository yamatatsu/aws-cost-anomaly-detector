import "@aws-cdk/assert/jest";
import * as cdk from "@aws-cdk/core";
import { SynthUtils } from "@aws-cdk/assert";
import { CostAnomalyDetector } from "./CostAnomalyDetector";

test("Snapshot Test", () => {
  const app = new cdk.App();
  const target = new CostAnomalyDetector(app, "Target", {
    slackWorkspaceId: "test-slackWorkspaceId",
    slackChannelId: "test-slackChannelId",
  });

  expect(SynthUtils.toCloudFormation(target)).toMatchSnapshot();
});
