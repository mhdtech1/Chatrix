import type { KeyboardEvent, ReactNode, RefObject } from "react";

export type ChatShellMenuProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
};

const MENU_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getFocusableElements = (panel: HTMLDivElement | null) =>
  panel
    ? Array.from(
        panel.querySelectorAll<HTMLElement>(MENU_FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"))
    : [];

/**
 * Full-screen settings page. Replaces the previous popover-anchored
 * dropdown that was floating off the menu trigger button. Backdrop
 * closes the panel on click; Esc is handled locally for keyboard users.
 */
export function ChatShellMenu({
  panelRef,
  onClose,
  children,
}: ChatShellMenuProps) {
  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const activeInsidePanel = activeElement
      ? panelRef.current?.contains(activeElement)
      : false;

    if (event.shiftKey) {
      if (activeElement === firstElement || !activeInsidePanel) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (activeElement === lastElement || !activeInsidePanel) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className="settings-page-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="menu-dropdown-panel menu-dropdown-panel--portal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        aria-describedby="settings-dialog-summary"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="menu-panel-header">
          <div className="menu-panel-title-wrap">
            <span className="menu-panel-eyebrow">Settings</span>
            <strong className="menu-panel-title" id="settings-dialog-title">
              Chatrix preferences
            </strong>
            <span className="sr-only" id="settings-dialog-summary">
              Use Tab to move through settings. Press Escape to close.
            </span>
          </div>
          <button
            type="button"
            className="menu-close-button"
            onClick={onClose}
            aria-label="Close settings"
            title="Close (Esc)"
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>
        <div className="menu-panel-body">{children}</div>
      </div>
    </div>
  );
}
