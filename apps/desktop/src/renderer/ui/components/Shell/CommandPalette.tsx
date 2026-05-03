import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export type CommandPaletteCommand = {
  id: string;
  label: string;
  hint?: string;
  group?: string;
  shortcut?: string;
  /** Optional disabled flag — disabled commands stay listed but don't run. */
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

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
    setQuery("");
    setActiveIndex(0);
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const runActive = () => {
    const next = ranked[activeIndex];
    if (!next || next.disabled) return;
    next.run();
    onClose();
  };

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
      onClose();
    }
  };

  return createPortal(
    <div
      className="command-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="command-palette">
        <input
          ref={inputRef}
          className="command-palette__input"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          autoComplete="off"
        />
        <div className="command-palette__list" ref={listRef}>
          {ranked.length === 0 ? (
            <div className="command-palette__empty">
              {emptyState ?? "No matching commands."}
            </div>
          ) : (
            ranked.map((command, index) => (
              <button
                key={command.id}
                type="button"
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
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> run
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
