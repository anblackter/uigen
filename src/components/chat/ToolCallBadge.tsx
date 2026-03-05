import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = args.path ? String(args.path).split("/").pop() : null;
  const name = filename || "file";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":     return `Creating ${name}`;
      case "str_replace":
      case "insert":     return `Editing ${name}`;
      case "view":       return `Reading ${name}`;
      case "undo_edit":  return `Undoing edit in ${name}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming ${name}`;
      case "delete": return `Deleting ${name}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const isDone = (state === "result" || state === "output-available") && result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}