import type { APIGatewayProxyHandler } from "aws-lambda";
import { scanAll } from "./db.js";
import { ok, error } from "./response.js";

const TABLE_NAME = process.env.SHELVES_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const items = await scanAll({ TableName: TABLE_NAME });
    return ok({ shelves: items });
  } catch (err) {
    console.error(err);
    return error(500, "Internal server error");
  }
};
