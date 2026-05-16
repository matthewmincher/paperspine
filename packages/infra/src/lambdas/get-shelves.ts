import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.SHELVES_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await client.send(
      new ScanCommand({ TableName: TABLE_NAME }),
    );

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ shelves: result.Items ?? [] }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}
