import { useState, type ReactNode } from 'react';
import type { OnboardingProgress, OnboardingStep } from '../../shared/types/onboarding';
import { SKIPPABLE_STEPS, ONBOARDING_STEPS, STEP_LABELS } from '../../shared/types/onboarding';

interface OnboardingProps {
  progress: OnboardingProgress;
  onStepComplete: (step: string) => void;
  onSkip: (step: string) => void;
  onComplete: () => void;
}

export function Onboarding({
  progress,
  onStepComplete,
  onSkip,
  onComplete,
}: OnboardingProps): ReactNode {
  const { currentStep, completedSteps } = progress;
  const isSkippable = SKIPPABLE_STEPS.includes(currentStep);
  const stepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const totalSteps = ONBOARDING_STEPS.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900">
      {/* Progress bar */}
      <div className="max-w-lg w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Step {stepIndex + 1} of {totalSteps}</span>
          <span className="text-xs text-gray-400">{STEP_LABELS[currentStep]}</span>
        </div>
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((stepIndex) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {ONBOARDING_STEPS.map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
                completedSteps.includes(s) ? 'bg-green-400' :
                i === stepIndex ? 'bg-blue-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-lg w-full bg-gray-800 rounded-lg p-8 shadow-xl">
        <StepContent
          step={currentStep}
          onStepComplete={onStepComplete}
          onSkip={onSkip}
          onComplete={onComplete}
          isSkippable={isSkippable}
        />
      </div>
    </div>
  );
}

interface StepContentProps {
  step: OnboardingStep;
  onStepComplete: (step: string) => void;
  onSkip: (step: string) => void;
  onComplete: () => void;
  isSkippable: boolean;
}

function StepContent({
  step,
  onStepComplete,
  onSkip,
  onComplete,
  isSkippable,
}: StepContentProps): ReactNode {
  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={() => onStepComplete('welcome')} />;
    case 'github':
      return (
        <GitHubStep
          onConnect={() => onStepComplete('github')}
          onSkip={() => onSkip('github')}
          isSkippable={isSkippable}
        />
      );
    case 'linear':
      return (
        <LinearStep
          onConnect={() => onStepComplete('linear')}
          onSkip={() => onSkip('linear')}
          isSkippable={isSkippable}
        />
      );
    case 'knowledge':
      return <KnowledgeStep onNext={() => onStepComplete('knowledge')} />;
    case 'meet-crew':
      return <MeetCrewStep onNext={() => onStepComplete('meet-crew')} />;
    case 'project-setup':
      return <ProjectSetupStep onComplete={onComplete} />;
    default:
      return null;
  }
}

function WelcomeStep({ onNext }: { onNext: () => void }): ReactNode {
  return (
    <div className="text-center">
      <div className="text-4xl mb-4">{"</>"}</div>
      <h1 className="text-2xl font-bold text-white mb-3">Welcome to CrewDev</h1>
      <p className="text-gray-400 mb-6 leading-relaxed">
        CrewDev gives you a team of AI coding agents powered by Claude Code.
        Each crew member specializes in a different area — frontend, backend,
        code review, DevOps — and they work together on your features.
      </p>
      <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm text-gray-300 font-medium mb-2">What you&apos;ll set up:</p>
        <ul className="text-sm text-gray-400 space-y-1">
          <li className="flex items-center gap-2"><span className="text-green-400">1.</span> Connect GitHub for repo management</li>
          <li className="flex items-center gap-2"><span className="text-green-400">2.</span> Connect Linear for issue tracking</li>
          <li className="flex items-center gap-2"><span className="text-green-400">3.</span> Set your knowledge level</li>
          <li className="flex items-center gap-2"><span className="text-green-400">4.</span> Meet your AI crew</li>
          <li className="flex items-center gap-2"><span className="text-green-400">5.</span> Pick a project to work on</li>
        </ul>
      </div>
      <button
        onClick={onNext}
        className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Get Started
      </button>
    </div>
  );
}

function GitHubStep({
  onConnect,
  onSkip,
  isSkippable,
}: {
  onConnect: () => void;
  onSkip: () => void;
  isSkippable: boolean;
}): ReactNode {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleConnect = async () => {
    if (!token.trim()) {
      onConnect();
      return;
    }
    setStatus('testing');
    // TODO: validate token via IPC
    setTimeout(() => {
      setStatus('success');
      setTimeout(onConnect, 500);
    }, 800);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Connect GitHub</h2>
      <p className="text-gray-400 mb-4 text-sm">
        A GitHub Personal Access Token lets CrewDev manage repositories,
        create branches, and open pull requests on your behalf.
      </p>

      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-400 mb-2">
          Create a token at <span className="text-blue-400">github.com/settings/tokens</span> with
          repo scope.
        </p>
        <label className="block text-sm text-gray-300 mb-1">Personal Access Token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxx"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {status === 'success' && (
        <p className="text-green-400 text-sm mb-3">Connected successfully!</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm mb-3">Invalid token. Check and try again.</p>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={handleConnect}
          disabled={status === 'testing'}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'testing' ? 'Connecting...' : token.trim() ? 'Connect' : 'Continue without token'}
        </button>
        {isSkippable && (
          <button
            onClick={onSkip}
            aria-label="Skip"
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function LinearStep({
  onConnect,
  onSkip,
  isSkippable,
}: {
  onConnect: () => void;
  onSkip: () => void;
  isSkippable: boolean;
}): ReactNode {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleConnect = async () => {
    if (!token.trim()) {
      onConnect();
      return;
    }
    setStatus('testing');
    try {
      const result = await window.crewdev.linear.sync(token);
      const response = result as { success: boolean };
      if (response.success) {
        setStatus('success');
        setTimeout(onConnect, 500);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Linear connection failed', err);
      setStatus('error');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Connect Linear</h2>
      <p className="text-gray-400 mb-4 text-sm">
        Connect Linear so your crew can read tickets, update statuses,
        and post progress comments automatically.
      </p>

      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
        <p className="text-xs text-gray-400 mb-2">
          Get your API key from <span className="text-blue-400">linear.app/settings/api</span>
        </p>
        <label className="block text-sm text-gray-300 mb-1">Linear API Key</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="lin_api_xxxxxxxxxxxx"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {status === 'success' && (
        <p className="text-green-400 text-sm mb-3">Linear connected!</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm mb-3">Could not connect. Check your API key.</p>
      )}

      <div className="flex gap-3 justify-center">
        <button
          onClick={handleConnect}
          disabled={status === 'testing'}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'testing' ? 'Connecting...' : token.trim() ? 'Connect Linear' : 'Continue without Linear'}
        </button>
        {isSkippable && (
          <button
            onClick={onSkip}
            aria-label="Skip"
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function KnowledgeStep({ onNext }: { onNext: () => void }): ReactNode {
  const [level, setLevel] = useState<string>('mid');

  const levels = [
    { id: 'beginner', label: 'Beginner', desc: 'New to programming or just getting started' },
    { id: 'mid', label: 'Intermediate', desc: 'Comfortable building features, some experience with architecture' },
    { id: 'senior', label: 'Senior', desc: 'Deep experience, comfortable with complex systems' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Your Experience Level</h2>
      <p className="text-gray-400 mb-4 text-sm">
        This helps your crew communicate at the right level — more explanation
        for beginners, more concise for seniors.
      </p>

      <div className="space-y-2 mb-6">
        {levels.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              level === l.id
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
            }`}
          >
            <div className="text-sm font-medium text-white">{l.label}</div>
            <div className="text-xs text-gray-400">{l.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

const CREW_MEMBERS = [
  { name: 'Orchestrator', role: 'Project lead', desc: 'Plans work, delegates to crew, tracks overall progress', color: 'text-purple-400' },
  { name: 'Builder', role: 'Implementation', desc: 'Writes features, modules, and clean functional code', color: 'text-blue-400' },
  { name: 'Stylist', role: 'UI/UX specialist', desc: 'React components, styling, accessibility', color: 'text-cyan-400' },
  { name: 'Engineer', role: 'Architecture', desc: 'APIs, data models, system design, type safety', color: 'text-green-400' },
  { name: 'Reviewer', role: 'Quality gate', desc: 'Reviews code, catches bugs, enforces standards', color: 'text-yellow-400' },
  { name: 'Fixer', role: 'Bug hunter', desc: 'Diagnoses bugs, fixes failures, adds regression tests', color: 'text-orange-400' },
];

function MeetCrewStep({ onNext }: { onNext: () => void }): ReactNode {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Meet Your Crew</h2>
      <p className="text-gray-400 mb-4 text-sm">
        Each crew member is a Claude Code agent specialized for a role.
        Click a card in the workspace to activate them.
      </p>

      <div className="space-y-2 mb-6">
        {CREW_MEMBERS.map((m) => (
          <div
            key={m.name}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/30 border border-gray-600"
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${m.color.replace('text-', 'bg-')}`} />
            <div>
              <div className="text-sm font-medium text-white">{m.name} <span className="text-xs text-gray-500">— {m.role}</span></div>
              <div className="text-xs text-gray-400">{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

function ProjectSetupStep({ onComplete }: { onComplete: () => void }): ReactNode {
  const [projectPath, setProjectPath] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenProject = async (): Promise<void> => {
    const trimmed = projectPath.trim();
    if (!trimmed) {
      onComplete();
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    const pathParts = trimmed.replace(/\/+$/, '').split('/');
    const name = pathParts[pathParts.length - 1] || 'project';

    const createResult = await window.crewdev.project.create(name, trimmed);
    const createResponse = createResult as { success: boolean; data?: unknown; error?: { code: string; message: string } };

    if (createResponse.success) {
      setStatus('idle');
      onComplete();
      return;
    }

    if (createResponse.error?.code === 'DUPLICATE_PROJECT') {
      const selectResult = await window.crewdev.project.select(trimmed);
      const selectResponse = selectResult as { success: boolean; error?: { message: string } };

      if (selectResponse.success) {
        setStatus('idle');
        onComplete();
        return;
      }

      setStatus('error');
      setErrorMessage(selectResponse.error?.message ?? 'Failed to select project');
      return;
    }

    setStatus('error');
    setErrorMessage(createResponse.error?.message ?? 'Failed to create project');
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Open a Project</h2>
      <p className="text-gray-400 mb-4 text-sm">
        Point CrewDev at a local repository. Your crew will work within this
        project — reading code, making changes, and running commands.
      </p>

      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
        <label className="block text-sm text-gray-300 mb-1">Project directory</label>
        <input
          type="text"
          value={projectPath}
          onChange={(e) => setProjectPath(e.target.value)}
          placeholder="/Users/you/projects/my-app"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Paste the full path to your project&apos;s root folder.
        </p>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm mb-3">{errorMessage}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleOpenProject}
          disabled={status === 'loading'}
          className="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
        >
          {status === 'loading'
            ? 'Opening...'
            : projectPath.trim()
              ? 'Open Project'
              : 'Skip — I\'ll set this up later'}
        </button>
      </div>
    </div>
  );
}
