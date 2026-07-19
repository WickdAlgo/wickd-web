import { PipelineDiagram } from "./pipeline-diagram";

export function PipelineSection() {
  return (
    <section
      className="border-y border-hairline py-20"
      style={{ background: "var(--chart-canvas)" }}
    >
      <div className="mx-auto max-w-(--page-max-width) px-6 text-center">
        <h2 className="font-display text-heading-lg font-semibold m-0">
          Four stages, one deterministic pipeline
        </h2>
        <p className="font-ui mx-auto my-4 max-w-[600px] text-[15px] leading-normal tracking-[0.35px] text-ink-secondary">
          Adapters fetch OHLC candles. Core turns candles into market structure. Strategies turn
          structure into decisions. Management sizes the risk. Hover any stage to trace its path.
        </p>
      </div>
      <div className="mt-6 overflow-x-auto">
        <div className="mx-auto min-w-[1020px] max-w-[1320px] px-6">
          <PipelineDiagram />
        </div>
      </div>
    </section>
  );
}
