import type { APIGatewayProxyHandler } from "aws-lambda";
import type { Tag } from "@paperspine/shared";
import { scanAll } from "./db.js";
import { ok, error } from "./response.js";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const items = await scanAll({
      TableName: TABLE_NAME,
      ProjectionExpression: "tags",
    });

    const tagMap = new Map<string, Tag>();
    for (const item of items) {
      for (const tag of (item.tags as Tag[]) ?? []) {
        tagMap.set(tag.name, tag);
      }
    }

    return ok({ tags: [...tagMap.values()] });
  } catch (err) {
    console.error(err);
    return error(500, "Internal server error");
  }
};
