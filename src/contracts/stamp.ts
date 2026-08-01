/**
 * Causal ordering.
 *
 * Lives in `contracts/` rather than in the replay feature because the dataset
 * schema itself sorts by this comparator at parse time. That sort is what lets
 * everything downstream binary-search instead of scanning, so the ordering rule
 * and the payload shape have to be defined together.
 */

/**
 * A fact with a knowable time.
 *
 * `atUtcMs` is attached during parsing rather than carried on the wire — the
 * payload holds ISO strings, and converting them once at the boundary is both
 * faster and the only place an unparseable timestamp can be caught.
 */
export interface Stamped {
  readonly atUtcMs: number;
  readonly sequence: number;
}

/**
 * Total order over facts: time first, then run-local sequence.
 *
 * The sequence tiebreak is not decoration. Several structures can become known
 * from the same candle, and their order is a property of the run that produced
 * them — without it, two facts at the same instant sort arbitrarily and a
 * replay cursor between them lands on whichever the sort happened to pick.
 */
export function compareStamp(a: Stamped, b: Stamped): number {
  return a.atUtcMs - b.atUtcMs || a.sequence - b.sequence;
}
