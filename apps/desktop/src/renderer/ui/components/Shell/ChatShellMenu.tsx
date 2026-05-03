import type { ReactNode, RefObject } from "react";

export type ChatShellMenuProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Full-screen settings page. Replaces the previous popover-anchored
 * dropdown that was floating off the menu trigger button. Backdrop
 * closes the panel on click; Esc handler is still wired in ChatShell.
 */
export function ChatShellMenu({
  panelRef,
  onClose,
  children,
}: ChatShellMenuProps) {
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
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="menu-panel-header">
          <div className="menu-panel-title-wrap">
            <span className="menu-panel-eyebrow">Settings</span>
            <strong className="menu-panel-title">Chatrix preferences</strong>
          </div>
          <button
            type="button"
            className="menu-close-button"
            onClick={onClose}
            aria-label="Close settings"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className="menu-panel-body">{children}</div>
      </div>
    </div>
  );
}
