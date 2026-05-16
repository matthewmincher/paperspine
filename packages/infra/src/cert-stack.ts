import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface CertificateStackProps extends StackProps {
  domainName: string;
}

export class CertificateStack extends Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(),
    });

    new CfnOutput(this, "CertValidationHelp", {
      value: `Certificate for ${props.domainName} pending DNS validation. Add the CNAME record from the ACM console (us-east-1) to your DNS provider.`,
    });
  }
}
