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

  const bookResults = await Promise.all(
    payload.books.map(async (book) => {
      const bookId = randomUUID();

      let coverUrl = book.coverUrl;
      if (coverUrl && coverUrl.startsWith("http")) {
        try {
          const res = await fetch(coverUrl);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            const key = `images/covers/${bookId}.jpg`;
            await s3.send(
              new PutObjectCommand({
                Bucket: IMAGES_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: "image/jpeg",
              }),
            );
            coverUrl = `/${key}`;
          }
        } catch {
          // Keep the original URL if download fails
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

  return { shelfId, bookIds: bookResults };
}
