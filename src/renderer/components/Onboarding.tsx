import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import type { OnboardingProgress, OnboardingStep } from '../../shared/types/onboarding';
import { SKIPPABLE_STEPS, STEP_LABELS } from '../../shared/types/onboarding';

interface OnboardingProps {
  progress: OnboardingProgress;
  onStepComplete: (step: string) => void;
  onSkip: (step: string) => void;
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>;
  onComplete: () => void;
}

export function Onboarding({
  progress,
  onStepComplete,
  onSkip,
  validateApiKey,
  onComplete,
}: OnboardingProps): ReactNode {
  const { currentStep } = progress;
  const isSkippable = SKIPPABLE_STEPS.includes(currentStep);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-lg w-full bg-gray-800 rounded-lg p-8 shadow-xl">
        <StepContent
          step={currentStep}
          onStepComplete={onStepComplete}
          onSkip={onSkip}
          validateApiKey={validateApiKey}
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
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>;
  onComplete: () => void;
  isSkippable: boolean;
}

function StepContent({
  step,
  onStepComplete,
  onSkip,
  validateApiKey,
  onComplete,
  isSkippable,
}: StepContentProps): ReactNode {
  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={() => onStepComplete('welcome')} />;
    case 'github':
      return (
        <ConnectionStep
          name="GitHub"
          description="Connect your GitHub account to enable repository management."
          onConnect={() => onStepComplete('github')}
          onSkip={() => onSkip('github')}
          isSkippable={isSkippable}
        />
      );
    case 'linear':
      return (
        <ConnectionStep
          name="Linear"
          description="Connect Linear to manage tickets and track progress."
          onConnect={() => onStepComplete('linear')}
          onSkip={() => onSkip('linear')}
          isSkippable={isSkippable}
        />
      );
    case 'api-key':
      return <ApiKeyStep onValidated={() => onStepComplete('api-key')} validateApiKey={validateApiKey} />;
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
      <h1 className="text-2xl font-bold text-white mb-4">Welcome to CrewDev</h1>
      <p className="text-gray-400 mb-6">
        Your AI-powered development crew is ready to help you build amazing things.
      </p>
      <button
        onClick={onNext}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>
  );
}

function ConnectionStep({
  name,
  description,
  onConnect,
  onSkip,
  isSkippable,
}: {
  name: string;
  description: string;
  onConnect: () => void;
  onSkip: () => void;
  isSkippable: boolean;
}): ReactNode {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">{name} Connection</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onConnect}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect {name}
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

function ApiKeyStep({
  onValidated,
  validateApiKey,
}: {
  onValidated: () => void;
  validateApiKey: (key: string) => Promise<{ valid: boolean; error?: string }>;
}): ReactNode {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    setError(null);

    const result = await validateApiKey(apiKey);

    if (result.valid) {
      onValidated();
    } else {
      setError(result.error ?? 'Invalid API key');
    }

    setValidating(false);
  }, [apiKey, validateApiKey, onValidated]);

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">API Key</h2>
      <p className="text-gray-400 mb-4">Enter your Anthropic API key to power the crew.</p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-..."
        className="w-full p-2 bg-gray-700 text-white border border-gray-600 rounded mb-3"
      />
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <button
        onClick={handleValidate}
        disabled={validating || !apiKey.trim()}
        aria-label="Validate"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {validating ? 'Validating...' : 'Validate'}
      </button>
    </div>
  );
}

function KnowledgeStep({ onNext }: { onNext: () => void }): ReactNode {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">Knowledge Profile</h2>
      <p className="text-gray-400 mb-6">
        Tell us about your experience so the crew can communicate at your level.
      </p>
      <button
        onClick={onNext}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

function MeetCrewStep({ onNext }: { onNext: () => void }): ReactNode {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">Meet Your Crew</h2>
      <p className="text-gray-400 mb-6">
        Your crew of AI agents is ready. Each member specializes in different areas of development.
      </p>
      <button
        onClick={onNext}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

function ProjectSetupStep({ onComplete }: { onComplete: () => void }): ReactNode {
  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-white mb-2">Create Your First Project</h2>
      <p className="text-gray-400 mb-6">
        Let the Orchestrator help you set up your first project.
      </p>
      <button
        onClick={onComplete}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Finish Setup
      </button>
    </div>
  );
}
