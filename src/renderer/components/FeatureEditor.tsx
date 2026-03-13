import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { FeatureNode } from '../../shared/types/feature';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface FeatureEditorProps {
  feature: FeatureNode;
  onSave: (featureId: string, body: string) => Promise<{ success: boolean }>;
}

const DEBOUNCE_MS = 800;

export function FeatureEditor({ feature, onSave }: FeatureEditorProps): ReactNode {
  const [content, setContent] = useState(feature.body);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFeatureIdRef = useRef(feature.id);
  const contentRef = useRef(content);
  const dirtyRef = useRef(false);

  contentRef.current = content;

  const save = useCallback(
    async (featureId: string, body: string) => {
      setStatus('saving');
      const result = await onSave(featureId, body);
      if (result.success) {
        setStatus('saved');
      } else {
        setStatus('error');
      }
      dirtyRef.current = false;
    },
    [onSave],
  );

  // Handle feature switching — flush pending saves
  useEffect(() => {
    if (prevFeatureIdRef.current !== feature.id) {
      // Cancel pending debounce
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Save previous feature if dirty
      if (dirtyRef.current) {
        void save(prevFeatureIdRef.current, contentRef.current);
      }

      // Load new feature content
      setContent(feature.body);
      setStatus('saved');
      dirtyRef.current = false;
      prevFeatureIdRef.current = feature.id;
    }
  }, [feature.id, feature.body, save]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setStatus('unsaved');
    dirtyRef.current = true;

    // Debounced auto-save
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void save(feature.id, newContent);
    }, DEBOUNCE_MS);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const statusLabel: Record<SaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
    error: 'Save error',
  };

  const statusColor: Record<SaveStatus, string> = {
    saved: 'text-green-400',
    saving: 'text-yellow-400',
    unsaved: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
        <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
        <span className={`text-xs ${statusColor[status]}`}>{statusLabel[status]}</span>
      </div>
      <textarea
        className="flex-1 resize-none bg-gray-900 p-4 font-mono text-sm text-gray-200 outline-none"
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}
