import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { ddb } from "./db.js";
import { ok, error } from "./response.js";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const bookId = event.pathParameters?.id;
  if (!bookId) return error(400, "Missing book ID");

  try {
    const result = await ddb.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { bookId } }),
    );

    if (!result.Item) return error(404, "Book not found");
    return ok({ book: result.Item });
  } catch (err) {
    console.error(err);
    return error(500, "Internal server error");
  }
};
