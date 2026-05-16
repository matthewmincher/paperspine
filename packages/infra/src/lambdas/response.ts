import type { APIGatewayProxyResult } from "aws-lambda";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export function ok(body: unknown): APIGatewayProxyResult {
  return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) };
}

export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return { statusCode, headers: HEADERS, body: JSON.stringify({ error: message }) };
}
