import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = event.queryStringParameters ?? {};
  const { tag, shelf, author, q } = params;

  try {
    let items;

    if (shelf) {
      const result = await client.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "shelfId-index",
          KeyConditionExpression: "shelfId = :shelfId",
          ExpressionAttributeValues: { ":shelfId": shelf },
        }),
      );
      items = result.Items ?? [];
    } else {
      const result = await client.send(
        new ScanCommand({ TableName: TABLE_NAME }),
      );
      items = result.Items ?? [];
    }

    if (tag) {
      items = items.filter((item) =>
        item.tags?.some((t: { name: string }) => t.name === tag),
      );
    }
    if (author) {
      items = items.filter(
        (item) => item.author?.toLowerCase().includes(author.toLowerCase()),
      );
    }
    if (q) {
      const query = q.toLowerCase();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.author?.toLowerCase().includes(query),
      );
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ books: items }),
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
