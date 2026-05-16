import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ Items: [] });

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: class { },
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
  PutCommand: class { constructor(public input: any) {} },
  ScanCommand: class { constructor(public input: any) {} },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = mockSend; },
  PutObjectCommand: class { constructor(public input: any) {} },
}));

describe("uploadToAws", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BOOKS_TABLE_NAME = "test-books";
    process.env.SHELVES_TABLE_NAME = "test-shelves";
    process.env.IMAGES_BUCKET_NAME = "test-bucket";
  });

  it("creates shelf and book records", async () => {
    const { uploadToAws } = await import("../src/services/upload.js");

    const result = await uploadToAws({
      shelfName: "Living Room",
      books: [
        {
          title: "Dune",
          author: "Frank Herbert",
          confidence: "high",
          isbn: "123",
          tags: [{ name: "sci-fi", category: "genre" }],
        },
      ],
    });

    expect(result.shelfId).toBeDefined();
    expect(result.bookIds).toHaveLength(1);
    expect(mockSend).toHaveBeenCalled();
  });
});
