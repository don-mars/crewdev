import type { ReactNode } from 'react';
import type { PlanningDoc } from '../../shared/types/planning';

interface PlanningTabProps {
  docs: PlanningDoc[];
  onUpload: () => void;
  onCreate: () => void;
  onDelete: (fileName: string) => void;
}

export function PlanningTab({ docs, onUpload, onCreate, onDelete }: PlanningTabProps): ReactNode {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onUpload}
          className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-gray-600"
        >
          Upload
        </button>
        <button
          onClick={onCreate}
          className="rounded bg-blue-700 px-3 py-1 text-sm text-white hover:bg-blue-600"
        >
          Create New
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-500">No planning documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.fileName}
              className="flex items-center justify-between rounded bg-gray-800 px-3 py-2"
            >
              <div>
                <span className="text-sm text-white">{doc.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(doc.lastModified).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => onDelete(doc.fileName)}
                className="rounded px-2 py-1 text-xs text-red-400 hover:bg-gray-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
