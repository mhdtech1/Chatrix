import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CommandPalette } from "../../../src/renderer/ui/components/Shell/CommandPalette";

const commands = [
  {
    id: "open-settings",
    label: "Open settings",
    hint: "Appearance",
    shortcut: "Ctrl+,",
    run: vi.fn(),
  },
  {
    id: "toggle-simple-mode",
    label: "Toggle simple mode",
    hint: "Layout",
    run: vi.fn(),
  },
];

describe("CommandPalette", () => {
  it("exposes dialog, combobox, and command result semantics", () => {
    render(<CommandPalette open onClose={vi.fn()} commands={commands} />);

    const dialog = screen.getByRole("dialog", { name: "Command palette" });
    const input = screen.getByRole("combobox", { name: "Search commands" });

    expect(dialog).toHaveAccessibleDescription(
      "Search commands. Use arrow keys to choose a command, Enter to run it, and Escape to close.",
    );
    expect(input).toHaveAttribute("aria-controls", "command-palette-list");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "command-palette-option-open-settings",
    );
    expect(
      screen.getByRole("listbox", { name: "Command results" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /open settings/i }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("runs the active command with Enter and restores focus after close", async () => {
    const launcher = document.createElement("button");
    launcher.textContent = "Open palette";
    document.body.appendChild(launcher);
    launcher.focus();

    const onClose = vi.fn();
    const runSecondCommand = vi.fn();
    const { unmount } = render(
      <CommandPalette
        open
        onClose={onClose}
        commands={[commands[0], { ...commands[1], run: runSecondCommand }]}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Search commands" });
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(
      screen.getByRole("option", { name: /toggle simple mode/i }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(runSecondCommand).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(launcher).toHaveFocus();
    launcher.remove();
  });

  it("keeps Tab focus inside the palette", async () => {
    render(<CommandPalette open onClose={vi.fn()} commands={commands} />);

    const input = screen.getByRole("combobox", { name: "Search commands" });
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(
      screen.getByRole("option", { name: /toggle simple mode/i }),
    ).toHaveFocus();
  });
});
