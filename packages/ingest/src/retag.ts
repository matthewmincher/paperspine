import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { generateTags } from "./services/tagging.js";
import type { Tag } from "@paperspine/shared";

const region = process.env.AWS_REGION ?? "eu-west-2";
const tableName = process.env.BOOKS_TABLE_NAME;

if (!tableName) {
  console.error("BOOKS_TABLE_NAME is required");
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

interface BookRecord {
  bookId: string;
  title: string;
  author: string;
  description?: string;
  tags?: Tag[];
}

async function getAllBooks(): Promise<BookRecord[]> {
  const items: BookRecord[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...((result.Items as BookRecord[]) ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

async function retag() {
  const books = await getAllBooks();
  console.log(`Found ${books.length} books to retag\n`);

  const genreTags = new Set<string>();

  for (const book of books) {
    const tags = await generateTags(
      book.title,
      book.author,
      book.description,
      undefined,
      [...genreTags],
    );

    for (const tag of tags) {
      if (tag.category === "genre") genreTags.add(tag.name);
    }

    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { bookId: book.bookId },
        UpdateExpression: "SET tags = :t",
        ExpressionAttributeValues: { ":t": tags },
      }),
    );

    const tagStr = tags.map((t) => `${t.name} (${t.category})`).join(", ");
    console.log(`${book.title} — ${tagStr}`);
  }

  console.log(`\nDone. ${genreTags.size} genres across ${books.length} books.`);
}

retag();
