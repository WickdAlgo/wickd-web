import { redirect } from "next/navigation";

/**
 * `/platform` has no content of its own — it resolves to the default view.
 *
 * A redirect rather than a copy of the inspect page, so there is one canonical
 * address per view and no duplicate to keep in sync. Note that this makes
 * `/platform` the one platform route that is not statically prerendered;
 * OpenNext serves it from the Worker. If `output: "export"` is ever adopted,
 * this is the line that breaks.
 */
export default function PlatformIndexPage() {
  redirect("/platform/inspect");
}
