import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Tag } from "@paperspine/shared";
import { scanAll, queryAll } from "./db.js";
import { ok, error } from "./response.js";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = event.queryStringParameters ?? {};
  const { tag, shelf, author, q } = params;

  try {
    let items = shelf
      ? await queryAll({
          TableName: TABLE_NAME,
          IndexName: "shelfId-index",
          KeyConditionExpression: "shelfId = :shelfId",
          ExpressionAttributeValues: { ":shelfId": shelf },
        })
      : await scanAll({ TableName: TABLE_NAME });

    if (tag) {
      items = items.filter((item) =>
        (item.tags as Tag[] | undefined)?.some((t) => t.name === tag),
      );
    }
    if (author) {
      const lc = author.toLowerCase();
      items = items.filter((item) =>
        (item.author as string)?.toLowerCase().includes(lc),
      );
    }
    if (q) {
      const lc = q.toLowerCase();
      items = items.filter(
        (item) =>
          (item.title as string)?.toLowerCase().includes(lc) ||
          (item.author as string)?.toLowerCase().includes(lc),
      );
    }

    return ok({ books: items });
  } catch (err) {
    console.error(err);
    return error(500, "Internal server error");
  }
};
