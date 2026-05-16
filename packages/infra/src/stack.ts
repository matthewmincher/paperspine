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

export class PaperspineStack extends Stack {
  public readonly booksTable: dynamodb.Table;
  public readonly imagesBucket: s3.Bucket;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.booksTable = new dynamodb.Table(this, "BooksTable", {
      partitionKey: { name: "bookId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.booksTable.addGlobalSecondaryIndex({
      indexName: "shelfId-index",
      partitionKey: { name: "shelfId", type: dynamodb.AttributeType.STRING },
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
    });

    new CfnOutput(this, "DistributionUrl", {
      value: `https://${this.distribution.distributionDomainName}`,
    });

    new CfnOutput(this, "ImagesBucketName", {
      value: this.imagesBucket.bucketName,
    });

    new CfnOutput(this, "BooksTableName", {
      value: this.booksTable.tableName,
    });
  }
}
