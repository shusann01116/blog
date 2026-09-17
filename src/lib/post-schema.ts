import type { PostMeta } from "./post-types.ts";

export function validateDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("date must be YYYY-MM-DD");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("invalid calendar date");
  }

  return value;
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim() !== "")
  );
}

export function parseFrontmatter(
  value: unknown,
  sourcePath: string,
): Omit<PostMeta, "slug" | "readingMinutes"> {
  try {
    if (!isRecord(value)) {
      throw new Error("frontmatter must be an object");
    }

    if (!isNonEmptyStringArray(value.tags)) {
      throw new Error("tags must be a non-empty array of non-empty strings");
    }

    return {
      title: nonEmptyString(value.title, "title"),
      date: validateDate(value.date),
      description: nonEmptyString(value.description, "description"),
      tags: [...value.tags],
      author: nonEmptyString(value.author, "author"),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${sourcePath}: ${message}`, { cause: error });
  }
}
