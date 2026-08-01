import { z } from "zod";

/**
 * Contract versioning.
 *
 * These schemas are provisional. `Wickd.Inspection` will eventually generate
 * canonical JSON Schema and TypeScript declarations, and this directory is
 * what gets replaced when it does. The version literal is what makes that
 * replacement safe: a payload from a newer producer fails to parse instead of
 * rendering as something subtly wrong.
 */

export const SCHEMA_VERSION = 1 as const;

/**
 * Mix into every top-level contract.
 *
 * Version rejection is structural rather than a separate check — a payload
 * declaring version 2 fails on the literal, at the top of the object, before
 * any field is trusted. There is no branch to forget to write.
 */
export const versioned = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
});

export type ContractIssue = z.ZodError["issues"][number];

/**
 * Thrown when a payload does not match its contract, including when it
 * declares an unsupported schema version.
 */
export class ContractError extends Error {
  readonly contract: string;
  readonly issues: readonly ContractIssue[];

  constructor(contract: string, issues: readonly ContractIssue[]) {
    const detail = issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    const more = issues.length > 3 ? ` (+${issues.length - 3} more)` : "";
    super(`${contract} failed contract validation — ${detail}${more}`);
    this.name = "ContractError";
    this.contract = contract;
    this.issues = issues;
  }

  /**
   * True when the payload announced a schema version this build cannot read,
   * which is worth reporting differently from a malformed field: the producer
   * is ahead of the consumer, and neither is broken.
   */
  get isVersionMismatch(): boolean {
    return this.issues.some(
      (i) => i.path.length === 1 && i.path[0] === "schemaVersion",
    );
  }
}

/**
 * Parse a payload or throw. Never returns partially-valid data — a contract
 * that half-parsed is a contract that renders half-wrong.
 */
export function parseContract<S extends z.ZodType>(
  contract: string,
  schema: S,
  input: unknown,
): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ContractError(contract, result.error.issues);
  }
  return result.data;
}
