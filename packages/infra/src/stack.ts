import {
  Stack,
  StackProps,
  RemovalPolicy,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function deriveZoneName(domain: string): string {
  const parts = domain.split(".");
  return parts.length <= 2 ? domain : parts.slice(1).join(".");
}

export interface PaperspineStackProps extends StackProps {
  frontendCert?: acm.ICertificate;
}

export class PaperspineStack extends Stack {
  public readonly booksTable: dynamodb.Table;
  public readonly shelvesTable: dynamodb.Table;
  public readonly imagesBucket: s3.Bucket;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: PaperspineStackProps) {
    super(scope, id, props);

    const apiDomain = this.node.tryGetContext("apiDomain") as string | undefined;
    const frontendDomain = this.node.tryGetContext("frontendDomain") as string | undefined;

    // --- Data stores ---

    this.booksTable = new dynamodb.Table(this, "BooksTable", {
      partitionKey: { name: "bookId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.booksTable.addGlobalSecondaryIndex({
      indexName: "shelfId-index",
      partitionKey: { name: "shelfId", type: dynamodb.AttributeType.STRING },
    });

    this.shelvesTable = new dynamodb.Table(this, "ShelvesTable", {
      partitionKey: { name: "shelfId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.imagesBucket = new s3.Bucket(this, "ImagesBucket", {
      removalPolicy: RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // --- CloudFront distribution ---

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      ...(frontendDomain && props?.frontendCert
        ? { domainNames: [frontendDomain], certificate: props.frontendCert }
        : {}),
    });

    // --- Lambda handlers ---

    const corsOrigin = frontendDomain ? `https://${frontendDomain}` : "*";
    const booksEnv = { TABLE_NAME: this.booksTable.tableName, CORS_ORIGIN: corsOrigin };
    const shelvesEnv = { SHELVES_TABLE_NAME: this.shelvesTable.tableName, CORS_ORIGIN: corsOrigin };

    const getBooksHandler = new NodejsFunction(this, "GetBooksHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-books.ts"),
      handler: "handler",
      environment: booksEnv,
    });

    const getBookHandler = new NodejsFunction(this, "GetBookHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-book.ts"),
      handler: "handler",
      environment: booksEnv,
    });

    const getTagsHandler = new NodejsFunction(this, "GetTagsHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-tags.ts"),
      handler: "handler",
      environment: booksEnv,
    });

    const getShelvesHandler = new NodejsFunction(this, "GetShelvesHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-shelves.ts"),
      handler: "handler",
      environment: shelvesEnv,
    });

    this.booksTable.grantReadData(getBooksHandler);
    this.booksTable.grantReadData(getBookHandler);
    this.booksTable.grantReadData(getTagsHandler);
    this.shelvesTable.grantReadData(getShelvesHandler);

    // --- API Gateway ---

    const corsOrigins = frontendDomain
      ? [`https://${frontendDomain}`]
      : apigateway.Cors.ALL_ORIGINS;

    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: "Paperspine API",
      defaultCorsPreflightOptions: {
        allowOrigins: corsOrigins,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type"],
      },
    });

    const books = this.api.root.addResource("books");
    books.addMethod("GET", new apigateway.LambdaIntegration(getBooksHandler));

    const book = books.addResource("{id}");
    book.addMethod("GET", new apigateway.LambdaIntegration(getBookHandler));

    const tags = this.api.root.addResource("tags");
    tags.addMethod("GET", new apigateway.LambdaIntegration(getTagsHandler));

    const shelves = this.api.root.addResource("shelves");
    shelves.addMethod("GET", new apigateway.LambdaIntegration(getShelvesHandler));

    if (apiDomain) {
      const zoneName = deriveZoneName(apiDomain);
      const zone = route53.HostedZone.fromLookup(this, "ApiZone", {
        domainName: zoneName,
      });

      const apiCert = new acm.Certificate(this, "ApiCert", {
        domainName: apiDomain,
        validation: acm.CertificateValidation.fromDns(zone),
      });

      const customDomain = this.api.addDomainName("ApiCustomDomain", {
        domainName: apiDomain,
        certificate: apiCert,
      });

      new route53.ARecord(this, "ApiAliasRecord", {
        zone,
        recordName: apiDomain,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGatewayDomain(customDomain),
        ),
      });
    }

    // --- Frontend deployment ---

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../frontend/dist"))],
      destinationBucket: this.frontendBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    // --- Outputs ---

    new CfnOutput(this, "ApiUrl", {
      value: apiDomain ? `https://${apiDomain}` : this.api.url,
    });

    new CfnOutput(this, "DistributionUrl", {
      value: frontendDomain
        ? `https://${frontendDomain}`
        : `https://${this.distribution.distributionDomainName}`,
    });

    new CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
    });

    if (frontendDomain) {
      new CfnOutput(this, "FrontendDnsSetup", {
        value: `Create a CNAME from ${frontendDomain} to ${this.distribution.distributionDomainName} in your DNS provider.`,
      });
    }

    new CfnOutput(this, "ImagesBucketName", {
      value: this.imagesBucket.bucketName,
    });

    new CfnOutput(this, "BooksTableName", {
      value: this.booksTable.tableName,
    });

    new CfnOutput(this, "ShelvesTableName", {
      value: this.shelvesTable.tableName,
    });
  }
}
