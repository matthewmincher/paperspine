import { App } from "aws-cdk-lib";
import { PaperspineStack } from "./stack.js";

const app = new App();

new PaperspineStack(app, "PaperspineStack", {
  env: {
    region: process.env.CDK_DEFAULT_REGION ?? "eu-west-2",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

app.synth();
