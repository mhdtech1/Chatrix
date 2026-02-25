type TopBarProps = {
  onAddChannel?: () => void;
  onOpenSettings?: () => void;
};

export function TopBar({ onAddChannel, onOpenSettings }: TopBarProps) {
  return (
    <header className="top-bar">
      <h1>MultiChat</h1>
      <div className="top-bar-actions">
        <button type="button" onClick={onAddChannel}>
          Add Channel
        </button>
        <button type="button" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>
  );
}
