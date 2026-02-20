import { z } from "zod";

export const createPrizeSchema = z.object({
  title: z.string().min(1),
  value: z.number().nullable().optional(),
  totalQty: z.number().int().min(0),
  remainingQty: z.number().int().min(0).optional(),
});

export const updatePrizeSchema = createPrizeSchema.partial();
