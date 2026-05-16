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
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PaperspineStack extends Stack {
  public readonly booksTable: dynamodb.Table;
  public readonly shelvesTable: dynamodb.Table;
  public readonly imagesBucket: s3.Bucket;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly api: apigateway.RestApi;

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

    const lambdaEnv = {
      TABLE_NAME: this.booksTable.tableName,
      SHELVES_TABLE_NAME: this.shelvesTable.tableName,
    };

    const getBooksHandler = new NodejsFunction(this, "GetBooksHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-books.ts"),
      handler: "handler",
      environment: lambdaEnv,
    });

    const getBookHandler = new NodejsFunction(this, "GetBookHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-book.ts"),
      handler: "handler",
      environment: lambdaEnv,
    });

    const getTagsHandler = new NodejsFunction(this, "GetTagsHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-tags.ts"),
      handler: "handler",
      environment: lambdaEnv,
    });

    const getShelvesHandler = new NodejsFunction(this, "GetShelvesHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "lambdas/get-shelves.ts"),
      handler: "handler",
      environment: lambdaEnv,
    });

    this.booksTable.grantReadData(getBooksHandler);
    this.booksTable.grantReadData(getBookHandler);
    this.booksTable.grantReadData(getTagsHandler);
    this.shelvesTable.grantReadData(getShelvesHandler);

    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: "Paperspine API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
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

    new CfnOutput(this, "ApiUrl", {
      value: this.api.url,
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

    new CfnOutput(this, "ShelvesTableName", {
      value: this.shelvesTable.tableName,
    });
  }
}
