import { useState, type ReactNode } from 'react';

interface CrewConfigEditorProps {
  content: string;
  onSave: (content: string) => Promise<void> | void;
}

export function CrewConfigEditor({ content, onSave }: CrewConfigEditorProps): ReactNode {
  const [value, setValue] = useState(content);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-300">Crew Config</h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved</span>}
          <button
            onClick={handleSave}
            className="rounded bg-blue-700 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
      <textarea
        className="flex-1 resize-none bg-gray-900 p-4 font-mono text-sm text-gray-200 outline-none"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
      />
    </div>
  );
}
