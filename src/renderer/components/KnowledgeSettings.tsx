import type { ReactNode } from 'react';
import { useCallback } from 'react';
import type { KnowledgeProfile, ConceptLevel } from '../../shared/types/knowledge';
import { LEVEL_NAMES } from '../../shared/types/knowledge';

interface KnowledgeSettingsProps {
  profile: KnowledgeProfile;
  onUpdate: (profile: KnowledgeProfile) => Promise<void>;
  onReset: () => Promise<void>;
}

const LEVELS: ConceptLevel[] = [0, 1, 2, 3];

export function KnowledgeSettings({ profile, onUpdate, onReset }: KnowledgeSettingsProps): ReactNode {
  const handleLevelChange = useCallback(
    (concept: string, newLevel: ConceptLevel) => {
      const updated = { ...profile };
      updated[concept] = { ...updated[concept], level: newLevel };
      onUpdate(updated);
    },
    [profile, onUpdate],
  );

  const concepts = Object.entries(profile).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Knowledge Profile</h2>
        <button
          onClick={onReset}
          aria-label="Reset"
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-2">
        {concepts.map(([concept, entry]) => (
          <div
            key={concept}
            data-concept={concept}
            className="flex items-center justify-between p-2 bg-gray-800 rounded"
          >
            <span className="text-white text-sm">{concept}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{LEVEL_NAMES[entry.level]}</span>
              <select
                role="combobox"
                value={entry.level}
                onChange={(e) => handleLevelChange(concept, Number(e.target.value) as ConceptLevel)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level} - {LEVEL_NAMES[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
