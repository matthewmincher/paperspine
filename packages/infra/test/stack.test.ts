import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, it, expect } from "vitest";
import { PaperspineStack } from "../src/stack.js";

describe("PaperspineStack", () => {
  const app = new App();
  const stack = new PaperspineStack(app, "TestStack");
  const template = Template.fromStack(stack);

  it("creates a DynamoDB table with bookId partition key", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "bookId", KeyType: "HASH" }],
    });
  });

  it("creates a shelfId GSI", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      GlobalSecondaryIndexes: [
        {
          IndexName: "shelfId-index",
          KeySchema: [{ AttributeName: "shelfId", KeyType: "HASH" }],
        },
      ],
    });
  });

  it("creates an images S3 bucket", () => {
    template.resourceCountIs("AWS::S3::Bucket", 2);
  });

  it("creates a CloudFront distribution", () => {
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
  });
});
