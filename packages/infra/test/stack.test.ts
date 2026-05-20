import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, it } from "vitest";
import { PaperspineStack } from "../src/stack.js";

describe("PaperspineStack", () => {
  const app = new App();
  const stack = new PaperspineStack(app, "TestStack");
  const template = Template.fromStack(stack);

  it("creates a DynamoDB books table with bookId partition key", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "bookId", KeyType: "HASH" }],
    });
  });

  it("creates a shelfId GSI on the books table", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      GlobalSecondaryIndexes: [
        {
          IndexName: "shelfId-index",
          KeySchema: [{ AttributeName: "shelfId", KeyType: "HASH" }],
        },
      ],
    });
  });

  it("creates a DynamoDB shelves table", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "shelfId", KeyType: "HASH" }],
    });
  });

  it("creates S3 buckets for images and frontend", () => {
    template.resourceCountIs("AWS::S3::Bucket", 2);
  });

  it("creates a CloudFront distribution", () => {
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
  });

  it("creates Lambda functions for API endpoints", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs24.x",
    });
  });

  it("creates an API Gateway REST API", () => {
    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      Name: "Paperspine API",
    });
  });

  it("configures CORS on API Gateway", () => {
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      HttpMethod: "OPTIONS",
    });
  });
});
