type SettingsPanelProps = {
  onClose?: () => void;
};

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <p>Settings panel is managed by the legacy shell during migration.</p>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
