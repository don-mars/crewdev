import type { ReactNode } from 'react';
import type { CrewMemberConfig, CrewStatus } from '../../shared/types/crew';

const MAX_ACTIVE = 4;

interface CrewMember extends CrewMemberConfig {
  status: CrewStatus;
}

interface CrewPanelProps {
  crew: CrewMember[];
  activeIds: string[];
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
}

const STATUS_COLORS: Record<CrewStatus, string> = {
  idle: 'bg-gray-400',
  running: 'bg-blue-400',
  thinking: 'bg-yellow-400',
  working: 'bg-green-400',
  waiting: 'bg-orange-400',
  error: 'bg-red-400',
  finished: 'bg-emerald-400',
};

export function CrewPanel({ crew, activeIds, onActivate, onDeactivate }: CrewPanelProps): ReactNode {
  const isAtLimit = activeIds.length >= MAX_ACTIVE;

  const handleCardClick = (id: string) => {
    if (activeIds.includes(id)) return;
    if (isAtLimit) return;
    onActivate(id);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('crewdev/crew-id', id);
  };

  return (
    <div className="space-y-2 p-3">
      <h3 className="text-sm font-semibold text-gray-300">Crew</h3>
      {crew.map((member) => {
        const isActive = activeIds.includes(member.id);

        return (
          <div
            key={member.id}
            data-testid={`crew-card-${member.id}`}
            draggable
            onDragStart={(e) => handleDragStart(e, member.id)}
            onClick={() => handleCardClick(member.id)}
            className={`rounded border p-2 cursor-pointer ${
              isActive
                ? 'border-blue-500 bg-gray-700'
                : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                data-testid={`crew-status-${member.id}`}
                className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[member.status]}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{member.name}</div>
                <div className="text-xs text-gray-400 truncate">{member.role}</div>
              </div>
              {isActive && (
                <button
                  data-testid={`deactivate-${member.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate(member.id);
                  }}
                  className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-gray-600"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
