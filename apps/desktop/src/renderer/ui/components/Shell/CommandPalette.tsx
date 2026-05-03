import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

export type CommandPaletteCommand = {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  shortcut?: string;
  /** Optional disabled flag: disabled commands stay listed but don't run. */
  disabled?: boolean;
  run: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  commands: CommandPaletteCommand[];
  placeholder?: string;
  emptyState?: ReactNode;
};

const COMMAND_LIST_ID = "command-palette-list";
const COMMAND_DIALOG_TITLE_ID = "command-palette-title";
const COMMAND_DIALOG_SUMMARY_ID = "command-palette-summary";

const COMMAND_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getCommandOptionId = (commandId: string) =>
  `command-palette-option-${commandId.replace(/[^A-Za-z0-9_-]/g, "-")}`;

const getFocusableElements = (root: HTMLElement | null) =>
  root
    ? Array.from(
        root.querySelectorAll<HTMLElement>(COMMAND_FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"))
    : [];

const fuzzyScore = (label: string, query: string) => {
  if (!query) return 1;
  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerLabel === lowerQuery) return 100;
  if (lowerLabel.startsWith(lowerQuery)) return 80;
  if (lowerLabel.includes(lowerQuery)) return 60;
  let queryIndex = 0;
  for (
    let labelIndex = 0;
    labelIndex < lowerLabel.length && queryIndex < lowerQuery.length;
    labelIndex += 1
  ) {
    if (lowerLabel[labelIndex] === lowerQuery[queryIndex]) queryIndex += 1;
  }
  return queryIndex === lowerQuery.length ? 30 : 0;
};

export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Type a command...",
  emptyState,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const ranked = useMemo(() => {
    const filtered = commands
      .map((command) => ({
        command,
        score:
          fuzzyScore(command.label, query) +
          (command.hint ? fuzzyScore(command.hint, query) * 0.5 : 0),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    return filtered.map((entry) => entry.command);
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setQuery("");
    setActiveIndex(0);

    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(id);
      const previousFocus = previousFocusRef.current;
      if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
      }
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    setActiveIndex((index) =>
      ranked.length === 0 ? 0 : Math.min(index, ranked.length - 1),
    );
  }, [ranked.length]);

  if (!open) return null;

  const activeCommand = ranked[activeIndex];
  const activeOptionId = activeCommand
    ? getCommandOptionId(activeCommand.id)
    : undefined;

  const runActive = () => {
    const next = ranked[activeIndex];
    if (!next || next.disabled) return;
    next.run();
    onClose();
  };

  const handleInputKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        ranked.length === 0 ? 0 : (index + 1) % ranked.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        ranked.length === 0 ? 0 : (index - 1 + ranked.length) % ranked.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      runActive();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  };

  const handleOverlayKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(overlayRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      inputRef.current?.focus();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const activeInsideOverlay = activeElement
      ? overlayRef.current?.contains(activeElement)
      : false;

    if (event.shiftKey) {
      if (activeElement === firstElement || !activeInsideOverlay) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (activeElement === lastElement || !activeInsideOverlay) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="command-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={COMMAND_DIALOG_TITLE_ID}
      aria-describedby={COMMAND_DIALOG_SUMMARY_ID}
      onKeyDown={handleOverlayKey}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="command-palette">
        <h2 className="sr-only" id={COMMAND_DIALOG_TITLE_ID}>
          Command palette
        </h2>
        <p className="sr-only" id={COMMAND_DIALOG_SUMMARY_ID}>
          Search commands. Use arrow keys to choose a command, Enter to run it,
          and Escape to close.
        </p>
        <input
          ref={inputRef}
          className="command-palette__input"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKey}
          role="combobox"
          aria-label="Search commands"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={COMMAND_LIST_ID}
          aria-activedescendant={activeOptionId}
          spellCheck={false}
          autoComplete="off"
        />
        <div
          className="command-palette__list"
          id={COMMAND_LIST_ID}
          ref={listRef}
          role="listbox"
          aria-label="Command results"
        >
          {ranked.length === 0 ? (
            <div className="command-palette__empty" role="status">
              {emptyState ?? "No matching commands."}
            </div>
          ) : (
            ranked.map((command, index) => (
              <button
                key={command.id}
                id={getCommandOptionId(command.id)}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                disabled={command.disabled}
                className={
                  index === activeIndex
                    ? "command-palette__row command-palette__row--active"
                    : "command-palette__row"
                }
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  if (command.disabled) return;
                  command.run();
                  onClose();
                }}
              >
                <div className="command-palette__row-main">
                  <span className="command-palette__label">
                    {command.label}
                  </span>
                  {command.hint ? (
                    <span className="command-palette__hint">
                      {command.hint}
                    </span>
                  ) : null}
                </div>
                {command.shortcut ? (
                  <kbd className="command-palette__kbd">{command.shortcut}</kbd>
                ) : null}
              </button>
            ))
          )}
        </div>
        <div className="command-palette__footer">
          <span>
            <kbd>Up</kbd>
            <kbd>Down</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> run
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
