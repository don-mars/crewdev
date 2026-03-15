import type { ReactNode } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { FeatureTree } from './renderer/components/FeatureTree';
import { FeatureEditor } from './renderer/components/FeatureEditor';
import { CrewPanel } from './renderer/components/CrewPanel';
import { ChatInput } from './renderer/components/ChatInput';
import { ActivityFeed } from './renderer/components/ActivityFeed';
import { Onboarding } from './renderer/components/Onboarding';
import { useCrewActivityBridge } from './renderer/hooks/useCrewActivityBridge';
import { useCrewStatusBridge } from './renderer/hooks/useCrewStatusBridge';
import { useOnboardingStore } from './renderer/stores/onboarding-store';
import { useFeatureStore } from './renderer/stores/feature-store';
import { useCrewStore } from './renderer/stores/crew-store';
import { useActivityStore } from './renderer/stores/activity-store';
import type { FeatureNode } from './shared/types/feature';

type CenterView = 'editor' | 'nerve-map' | 'planning';

const PLACEHOLDER_FEATURE: FeatureNode = {
  id: '',
  title: 'Select a feature',
  status: 'planned',
  parent: null,
  body: '',
};

export function App(): ReactNode {
  const { completed, isFirstRun, currentStep, completedSteps, completeStep, skipStep } =
    useOnboardingStore();
  const { tree, selectedFeature, selectFeature, loadTree, createFeature } = useFeatureStore();
  const { members, activeIds, spawn, kill: killCrew, updateStatus } = useCrewStore();
  const { entries, addEntry } = useActivityStore();

  const [centerView] = useState<CenterView>('editor');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [showNewFeature, setShowNewFeature] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');

  useCrewActivityBridge(activeIds, members, addEntry);
  useCrewStatusBridge(activeIds, updateStatus);

  const showOnboarding = !completed && isFirstRun;

  // Load feature tree on mount
  useEffect(() => {
    if (!showOnboarding) {
      loadTree();
    }
  }, [showOnboarding, loadTree]);

  const handleFeatureSelect = useCallback(
    (id: string | null) => {
      setSelectedFeatureId(id);
      if (id) {
        selectFeature(id);
      }
    },
    [selectFeature],
  );

  const handleFeatureSave = useCallback(async (id: string, body: string) => {
    const result = await window.crewdev.feature.update(id, { body });
    const response = result as { success: boolean };
    return response;
  }, []);

  const handleCreateFeature = useCallback(async () => {
    if (!newFeatureTitle.trim()) return;
    await createFeature({ title: newFeatureTitle.trim(), status: 'planned', body: '' });
    setNewFeatureTitle('');
    setShowNewFeature(false);
    addEntry({
      id: `system-${Date.now()}`,
      crewName: 'System',
      message: `Feature "${newFeatureTitle.trim()}" created`,
      timestamp: new Date().toISOString(),
    });
  }, [newFeatureTitle, createFeature, addEntry]);

  const handleActivateCrew = useCallback(
    async (id: string) => {
      const member = members.find((m) => m.id === id);
      if (!member) return;
      await spawn({ id: member.id, name: member.name, role: member.role, configContent: member.configContent });
      addEntry({
        id: `crew-${Date.now()}`,
        crewName: member.name,
        message: `${member.name} activated`,
        timestamp: new Date().toISOString(),
      });
    },
    [members, spawn, addEntry],
  );

  const handleDeactivateCrew = useCallback(
    async (id: string) => {
      const member = members.find((m) => m.id === id);
      await killCrew(id);
      addEntry({
        id: `crew-${Date.now()}`,
        crewName: member?.name ?? id,
        message: `${member?.name ?? id} deactivated`,
        timestamp: new Date().toISOString(),
      });
    },
    [members, killCrew, addEntry],
  );

  const handleMessageSent = useCallback(
    (message: string) => {
      addEntry({
        id: `user-${Date.now()}`,
        crewName: 'You',
        message,
        timestamp: new Date().toISOString(),
      });
    },
    [addEntry],
  );

  const handleOnboardingComplete = useCallback(() => {
    useOnboardingStore.setState({ completed: true });
  }, []);

  if (showOnboarding) {
    return (
      <Onboarding
        progress={{ currentStep, completedSteps, completed: false }}
        onStepComplete={completeStep}
        onSkip={skipStep}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  const feature = selectedFeature ?? PLACEHOLDER_FEATURE;
  const activeCrewId = activeIds.length > 0 ? activeIds[0] : null;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Main content area: sidebar + center + right panel */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-64 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Features</h3>
            <button
              onClick={() => setShowNewFeature(!showNewFeature)}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New
            </button>
          </div>
          {showNewFeature && (
            <div className="p-3 border-b border-gray-700">
              <input
                type="text"
                value={newFeatureTitle}
                onChange={(e) => setNewFeatureTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFeature()}
                placeholder="Feature name..."
                className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreateFeature}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewFeature(false); setNewFeatureTitle(''); }}
                  className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <FeatureTree
            tree={tree}
            activeId={selectedFeatureId}
            onSelect={handleFeatureSelect}
          />
        </aside>

        {/* Center panel */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <CenterPanel
            view={centerView}
            feature={feature}
            onSave={handleFeatureSave}
          />
        </main>

        {/* Right sidebar */}
        <aside className="w-80 border-l border-gray-700 overflow-y-auto flex-shrink-0">
          <CrewPanel
            crew={members}
            activeIds={activeIds}
            onActivate={handleActivateCrew}
            onDeactivate={handleDeactivateCrew}
          />
        </aside>
      </div>

      {/* Bottom bar */}
      <footer className="border-t border-gray-700 flex-shrink-0">
        <div className="flex">
          <div className="flex-1">
            <ChatInput activeCrewId={activeCrewId} onMessageSent={handleMessageSent} />
          </div>
          <div className="w-80 border-l border-gray-700">
            <ActivityFeed entries={entries} />
          </div>
        </div>
      </footer>
    </div>
  );
}

function CenterPanel({
  view,
  feature,
  onSave,
}: {
  view: CenterView;
  feature: FeatureNode;
  onSave: (id: string, body: string) => Promise<{ success: boolean }>;
}): ReactNode {
  switch (view) {
    case 'editor':
      return <FeatureEditor feature={feature} onSave={onSave} />;
    case 'nerve-map':
      return <div>Nerve Map</div>;
    case 'planning':
      return <div>Planning</div>;
    default:
      return <FeatureEditor feature={feature} onSave={onSave} />;
  }
}
