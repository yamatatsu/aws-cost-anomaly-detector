import * as cdk from "@aws-cdk/core";
import { CostAnomalyDetector } from "./CostAnomalyDetector";

const slackWorkspaceId = getEnv("SLACK_WORKSPACE_ID");
const slackChannelId = getEnv("SLACK_CHANNEL_ID");

const app = new cdk.App();
new CostAnomalyDetector(app, "CostAnomalyDetector", {
  slackWorkspaceId,
  slackChannelId,
  env: {
    // CEは us-east-1 じゃないとだめ。
    region: "us-east-1",
  },
});

// ///////////////
// lib

function getEnv(envName: string): string {
  const env = process.env[envName];
  if (!env) {
    throw new Error(`env[${envName}] is needed.`);
  }
  return env;
}
