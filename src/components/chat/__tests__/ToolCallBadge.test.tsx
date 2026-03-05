import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

function makeBadgeProps(
  toolName: string,
  args: Record<string, unknown>,
  state: string = "output-available",
  result: unknown = "Success"
) {
  return { toolName, args, state, result };
}

test("str_replace_editor create → Creating App.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "create", path: "/App.jsx" })} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace → Editing Card.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })} />);
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert → Editing Card.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "insert", path: "/components/Card.jsx" })} />);
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor view → Reading utils.ts", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "view", path: "/lib/utils.ts" })} />);
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("str_replace_editor undo_edit → Undoing edit in App.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })} />);
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

test("file_manager rename → Renaming OldComp.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("file_manager", { command: "rename", path: "/OldComp.jsx" })} />);
  expect(screen.getByText("Renaming OldComp.jsx")).toBeDefined();
});

test("file_manager delete → Deleting OldComp.jsx", () => {
  render(<ToolCallBadge {...makeBadgeProps("file_manager", { command: "delete", path: "/OldComp.jsx" })} />);
  expect(screen.getByText("Deleting OldComp.jsx")).toBeDefined();
});

test("unknown tool/command → shows toolName", () => {
  render(<ToolCallBadge {...makeBadgeProps("str_replace_editor", {})} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("in-progress state → shows spinner, no green dot", () => {
  const { container } = render(
    <ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "create", path: "/App.jsx" }, "input-available", undefined)} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("completed state → shows green dot, no spinner", () => {
  const { container } = render(
    <ToolCallBadge {...makeBadgeProps("str_replace_editor", { command: "create", path: "/App.jsx" })} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
