import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { EnrichedBook } from "./enrichment.js";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION ?? "eu-west-2" }),
);
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "eu-west-2" });

const BOOKS_TABLE = process.env.BOOKS_TABLE_NAME!;
const SHELVES_TABLE = process.env.SHELVES_TABLE_NAME!;
const IMAGES_BUCKET = process.env.IMAGES_BUCKET_NAME!;

export interface UploadPayload {
  shelfName: string;
  shelfPhoto?: Buffer;
  shelfPhotoMimeType?: string;
  books: EnrichedBook[];
}

async function findExistingBooks(): Promise<Set<string>> {
  const keys = new Set<string>();
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: BOOKS_TABLE,
        ProjectionExpression: "title, author, isbn",
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of result.Items ?? []) {
      if (item.isbn) {
        keys.add(`isbn::${item.isbn as string}`);
      }
      keys.add(`title::${(item.title as string).toLowerCase()}::${(item.author as string).toLowerCase()}`);
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return keys;
}

async function findShelfByName(name: string): Promise<string | undefined> {
  const result = await ddb.send(
    new ScanCommand({
      TableName: SHELVES_TABLE,
      FilterExpression: "#n = :name",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: { ":name": name },
    }),
  );
  return result.Items?.[0]?.shelfId as string | undefined;
}

export async function uploadToAws(payload: UploadPayload) {
  const createdAt = new Date().toISOString();

  let shelfId = await findShelfByName(payload.shelfName);

  if (!shelfId) {
    shelfId = randomUUID();

    let shelfImageUrl: string | undefined;
    if (payload.shelfPhoto) {
      const key = `images/shelves/${shelfId}/photo.jpg`;
      await s3.send(
        new PutObjectCommand({
          Bucket: IMAGES_BUCKET,
          Key: key,
          Body: payload.shelfPhoto,
          ContentType: payload.shelfPhotoMimeType ?? "image/jpeg",
        }),
      );
      shelfImageUrl = `/${key}`;
    }

    await ddb.send(
      new PutCommand({
        TableName: SHELVES_TABLE,
        Item: {
          shelfId,
          name: payload.shelfName,
          imageUrl: shelfImageUrl,
          createdAt,
        },
      }),
    );
  }

  const existingBooks = await findExistingBooks();

  const bookResults = await Promise.all(
    payload.books.map(async (book) => {
      const isbnMatch = book.isbn && existingBooks.has(`isbn::${book.isbn}`);
      const titleMatch = existingBooks.has(`title::${book.title.toLowerCase()}::${book.author.toLowerCase()}`);
      if (isbnMatch || titleMatch) return null;

      const bookId = randomUUID();

      let coverUrl = book.coverUrl;
      if (coverUrl && (coverUrl.startsWith("http") || coverUrl.startsWith("data:"))) {
        try {
          let buffer: Buffer;
          let contentType = "image/jpeg";

          if (coverUrl.startsWith("data:")) {
            const match = coverUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              contentType = match[1];
              buffer = Buffer.from(match[2], "base64");
            } else {
              buffer = Buffer.alloc(0);
            }
          } else {
            const res = await fetch(coverUrl);
            if (!res.ok) throw new Error("fetch failed");
            buffer = Buffer.from(await res.arrayBuffer());
          }

          if (buffer.length > 0) {
            const ext = contentType.includes("png") ? "png" : "jpg";
            const key = `images/covers/${bookId}.${ext}`;
            await s3.send(
              new PutObjectCommand({
                Bucket: IMAGES_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: contentType,
              }),
            );
            coverUrl = `/${key}`;
          }
        } catch {
          // Keep the original URL if upload fails
        }
      }

      await ddb.send(
        new PutCommand({
          TableName: BOOKS_TABLE,
          Item: {
            bookId,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            coverUrl,
            description: book.description,
            tags: book.tags,
            shelfId,
            createdAt,
          },
        }),
      );

      return bookId;
    }),
  );

  const newBookIds = bookResults.filter((id) => id !== null);
  const skipped = bookResults.length - newBookIds.length;
  return { shelfId, bookIds: newBookIds, skipped };
}
