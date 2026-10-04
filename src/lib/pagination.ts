import { SelectQueryBuilder, sql } from "kysely";
import { z } from "zod";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export async function paginate<DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  { page, limit }: PaginationQuery,
): Promise<Paginated<O>> {
  const [countRow, items] = await Promise.all([
    query
      .clearSelect()
      .clearOrderBy()
      .select(sql<string>`count(*)`.as("total"))
      .executeTakeFirstOrThrow(),
    query
      .limit(limit)
      .offset((page - 1) * limit)
      .execute(),
  ]);

  const total = Number((countRow as { total: string }).total);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}
