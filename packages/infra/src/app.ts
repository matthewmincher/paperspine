import { App } from "aws-cdk-lib";
import { PaperspineStack } from "./stack.js";
import { CertificateStack } from "./cert-stack.js";

const app = new App();
const region = process.env.CDK_DEFAULT_REGION ?? "eu-west-2";
const account = process.env.CDK_DEFAULT_ACCOUNT;

const frontendDomain = app.node.tryGetContext("frontendDomain") as string | undefined;

let certStack: CertificateStack | undefined;
if (frontendDomain) {
  certStack = new CertificateStack(app, "PaperspineCertStack", {
    env: { region: "us-east-1", account },
    crossRegionReferences: true,
    domainName: frontendDomain,
  });
}

new PaperspineStack(app, "PaperspineStack", {
  env: { region, account },
  crossRegionReferences: true,
  frontendCert: certStack?.certificate,
});

app.synth();
