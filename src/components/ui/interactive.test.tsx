import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox, Field, Select, Switch, Tabs } from "./index";

/**
 * The interactive library components — `WEB-BL-001`'s original ask.
 *
 * These are the pieces the platform drives its state with, so a regression here
 * silently breaks layer toggles and replay modes rather than showing up as a
 * broken build.
 */

describe("Switch", () => {
  // Built on a native checkbox with `role="switch"`, so its state is the
  // element's `checked` property — the platform maps that to `aria-checked`
  // itself, and setting the attribute by hand would be the wrong fix.
  it("reports its state and toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Order blocks" checked={false} onChange={onChange} />);

    const control = screen.getByRole("switch", { name: "Order blocks" });
    expect(control).not.toBeChecked();

    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles from the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Liquidity" checked onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole("switch", { name: "Liquidity" })).toHaveFocus();
    // Space, not Enter: Enter submits a form, it does not toggle a checkbox.
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("works uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Swings" />);
    const control = screen.getByRole("switch", { name: "Swings" });

    expect(control).not.toBeChecked();
    await user.click(control);
    expect(control).toBeChecked();
  });
});

describe("Tabs", () => {
  it("marks the active tab and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs items={["Structures", "Detail"]} active="Structures" onChange={onChange} />);

    expect(screen.getByRole("tab", { name: "Structures" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Detail" })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await user.click(screen.getByRole("tab", { name: "Detail" }));
    expect(onChange).toHaveBeenCalledWith("Detail");
  });
});

describe("Checkbox", () => {
  it("toggles and honours defaultChecked", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Emit lifecycle updates" defaultChecked />);

    const box = screen.getByRole("checkbox", { name: "Emit lifecycle updates" });
    expect(box).toBeChecked();
    await user.click(box);
    expect(box).not.toBeChecked();
  });
});

describe("Select", () => {
  it("renders its options and reports a change", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Dataset"
        options={["may6-session", "apr-range"]}
        defaultValue="may6-session"
        onChange={onChange}
      />,
    );

    const select = screen.getByLabelText("Dataset");
    expect(select).toHaveValue("may6-session");

    await user.selectOptions(select, "apr-range");
    expect(onChange).toHaveBeenCalled();
    expect(select).toHaveValue("apr-range");
  });
});

describe("Field", () => {
  it("labels its control and renders the hint", () => {
    render(
      <Field label="Run ID" hint="Writes runs/{runId}/structures.jsonl">
        <input />
      </Field>,
    );

    // The wrapping `<label>` contains the hint as well as the label, so the
    // accessible name is both strings joined. That is a real finding rather
    // than a test artifact — a screen reader announces the hint as part of the
    // field's name — and it is recorded against WEB-BL-005 rather than fixed
    // here, since changing a shared library component is its own piece of work.
    const input = screen.getByLabelText(/Run ID/);
    expect(input).toBeInTheDocument();
    expect(screen.getByText("Writes runs/{runId}/structures.jsonl")).toBeInTheDocument();
  });

  it("renders without a label or hint", () => {
    render(
      <Field>
        <input aria-label="bare" />
      </Field>,
    );
    expect(screen.getByLabelText("bare")).toBeInTheDocument();
  });
});
