import type { CSSProperties, ReactNode, RefObject } from "react";

export type ChatShellMenuProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  onClose: () => void;
  children: ReactNode;
};

export function ChatShellMenu({
  panelRef,
  style,
  onClose,
  children,
}: ChatShellMenuProps) {
  return (
    <div
      ref={panelRef}
      className="menu-dropdown-panel menu-dropdown-panel--portal"
      style={style}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="menu-panel-header">
        <div className="menu-panel-title-wrap">
          <span className="menu-panel-eyebrow">Control Center</span>
          <strong className="menu-panel-title">Main menu</strong>
        </div>
        <button
          type="button"
          className="menu-close-button"
          onClick={onClose}
          aria-label="Close main menu"
          title="Close menu (Esc)"
        >
          ×
        </button>
      </div>
      <div className="menu-panel-body">{children}</div>
    </div>
  );
}
