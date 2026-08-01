import { z } from "zod";

/**
 * Shared scalar schemas. Everything the platform renders is built from these,
 * so the rules about time and money are stated once.
 */

/**
 * An ISO 8601 instant.
 *
 * Kept as a string because that is the wire format, and because the moment a
 * timestamp becomes a `Date` it acquires a local timezone that nothing here
 * wants. Conversion to epoch milliseconds happens once, at the dataset
 * boundary — see `epochMs`.
 */
export const utcInstant = z
  .string()
  .refine((s) => Number.isFinite(Date.parse(s)), {
    message: "must be a parseable ISO 8601 instant",
  });

/**
 * Parse an instant to epoch milliseconds.
 *
 * Throws rather than returning `NaN`. This matters more than it looks: `NaN`
 * fails every comparison, so a single unparseable timestamp in a causal filter
 * silently returns everything or nothing rather than erroring.
 */
export function epochMs(instant: string): number {
  const ms = Date.parse(instant);
  if (!Number.isFinite(ms)) {
    throw new RangeError(`not a parseable ISO 8601 instant: ${instant}`);
  }
  return ms;
}

/**
 * Run-local ordering within a single trigger observation.
 *
 * Two facts can become known at the same instant. Sequence is what makes their
 * order deterministic, and it is only meaningful within one run.
 */
export const sequence = z.number().int().nonnegative();

/**
 * An authoritative financial value, as a decimal string.
 *
 * Never a JavaScript number. These are values a user reconciles against an
 * exchange statement, and binary floating point cannot represent them exactly.
 * They are transported, stored, and displayed as strings; the backend owns any
 * arithmetic on them.
 */
export const decimal = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "must be a decimal string, for example \"1.25\"");

/**
 * A price used for chart geometry.
 *
 * A number, deliberately — this one is on its way to becoming a pixel
 * coordinate, so the precision argument above does not apply. Do not use it for
 * anything reported to the user as money.
 */
export const geometryPrice = z.number().finite();

export const entityId = z.string().min(1);
export const identifier = z.string().min(1);
