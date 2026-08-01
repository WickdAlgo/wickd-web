import { describe, expect, it } from "vitest";
import { z } from "zod";
import { chartSceneV1 } from "./chart-scene";
import { inspectionDatasetV1 } from "./inspection-dataset";
import { epochMs } from "./scalars";
import { ContractError, parseContract, SCHEMA_VERSION, versioned } from "./version";

describe("parseContract", () => {
  const schema = versioned.extend({ name: z.string() });

  it("returns parsed data on a valid payload", () => {
    const parsed = parseContract("Thing", schema, {
      schemaVersion: SCHEMA_VERSION,
      name: "ok",
    });
    expect(parsed.name).toBe("ok");
  });

  it("throws ContractError naming the contract", () => {
    expect(() => parseContract("Thing", schema, { schemaVersion: 1 })).toThrow(
      ContractError,
    );
    expect(() => parseContract("Thing", schema, { schemaVersion: 1 })).toThrow(
      /^Thing failed contract validation/,
    );
  });

  it("never returns partially-valid data", () => {
    // The point of throwing rather than returning a partial: a half-parsed
    // contract renders half-wrong, which is worse than not rendering.
    let result: unknown = "untouched";
    try {
      result = parseContract("Thing", schema, { schemaVersion: 1, name: 42 });
    } catch {
      /* expected */
    }
    expect(result).toBe("untouched");
  });
});

describe("schema version rejection", () => {
  const schema = versioned.extend({ name: z.string() });

  it("rejects a newer schema version", () => {
    expect(() =>
      parseContract("Thing", schema, { schemaVersion: 2, name: "from the future" }),
    ).toThrow(ContractError);
  });

  it("rejects a missing schema version", () => {
    expect(() => parseContract("Thing", schema, { name: "unversioned" })).toThrow(
      ContractError,
    );
  });

  it("distinguishes a version mismatch from a malformed field", () => {
    // Worth telling apart: a version mismatch means the producer is ahead of
    // this build, and neither side is broken.
    const versionError = captureError(() =>
      parseContract("Thing", schema, { schemaVersion: 9, name: "ok" }),
    );
    expect(versionError.isVersionMismatch).toBe(true);

    const fieldError = captureError(() =>
      parseContract("Thing", schema, { schemaVersion: SCHEMA_VERSION, name: 42 }),
    );
    expect(fieldError.isVersionMismatch).toBe(false);
  });

  it("rejects a versioned dataset before any field is trusted", () => {
    expect(() =>
      parseContract("InspectionDataset", inspectionDatasetV1, {
        schemaVersion: 99,
        contract: "inspection-dataset",
      }),
    ).toThrow(ContractError);
  });
});

describe("chart scene contract", () => {
  const base = {
    schemaVersion: SCHEMA_VERSION,
    contract: "chart-scene" as const,
    instrument: { market: "BTC_USDT_PERP", timeframe: "5m" },
    intervalMs: 300_000,
    candles: [],
  };

  function zone(overrides: Record<string, unknown>) {
    return {
      ...base,
      layers: [
        {
          id: "l",
          label: "L",
          primitives: [
            {
              id: "z",
              type: "zone",
              kind: "bullish",
              fromUtc: "2026-05-06T00:00:00Z",
              priceLow: 100,
              priceHigh: 200,
              visibleFromUtc: "2026-05-06T00:05:00Z",
              ...overrides,
            },
          ],
        },
      ],
    };
  }

  it("accepts a well-formed zone and applies defaults", () => {
    const parsed = parseContract("ChartScene", chartSceneV1, zone({}));
    const primitive = parsed.layers[0].primitives[0];
    expect(primitive.scope).toBe("external");
    expect(primitive.visibleUntilUtc).toBeNull();
    expect(parsed.layers[0].z).toBe("under");
    expect(parsed.layers[0].defaultVisible).toBe(true);
  });

  it("rejects an inverted price band", () => {
    // Cross-field refinement has to survive being inside a discriminated union.
    expect(() =>
      parseContract("ChartScene", chartSceneV1, zone({ priceLow: 200, priceHigh: 100 })),
    ).toThrow(ContractError);
  });

  it("rejects an unknown primitive type", () => {
    expect(() =>
      parseContract("ChartScene", chartSceneV1, zone({ type: "wormhole" })),
    ).toThrow(ContractError);
  });

  it("rejects an unparseable instant", () => {
    expect(() =>
      parseContract("ChartScene", chartSceneV1, zone({ fromUtc: "sometime tuesday" })),
    ).toThrow(ContractError);
  });
});

describe("epochMs", () => {
  it("parses an ISO instant", () => {
    expect(epochMs("2026-05-06T00:00:00Z")).toBe(Date.parse("2026-05-06T00:00:00Z"));
  });

  it("throws rather than returning NaN", () => {
    // NaN fails every comparison, so an unparseable timestamp inside a causal
    // filter silently returns everything or nothing instead of erroring.
    expect(() => epochMs("sometime tuesday")).toThrow(RangeError);
    expect(() => epochMs("")).toThrow(RangeError);
  });
});

function captureError(fn: () => unknown): ContractError {
  try {
    fn();
  } catch (e) {
    if (e instanceof ContractError) return e;
    throw e;
  }
  throw new Error("expected a ContractError, but nothing was thrown");
}
