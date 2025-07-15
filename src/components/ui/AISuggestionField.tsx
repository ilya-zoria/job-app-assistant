import React from 'react';
import { Button } from './button';
import { Check, X, Sparkles, Copy } from 'lucide-react';

export type AISuggestionFieldMode = 'ai' | 'copy';

interface AISuggestionFieldProps {
  sectionKey: string;
  hoveredSection: string | null;
  setHoveredSection: (k: string | null) => void;
  children: React.ReactNode;
  mode?: AISuggestionFieldMode;
  onCopy?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRegenerate?: () => void;
}

const AISuggestionField: React.FC<AISuggestionFieldProps> = ({
  sectionKey,
  hoveredSection,
  setHoveredSection,
  children,
  mode = 'ai',
  onCopy,
  onAccept,
  onDecline,
  onRegenerate,
}) => {
  return (
    <div
      className={`relative group border rounded-lg p-3 text-sm flex items-center justify-between transition-colors duration-150 ${hoveredSection === sectionKey ? ' bg-slate-50' : ''}`}
      onMouseEnter={() => setHoveredSection(sectionKey)}
      onMouseLeave={() => setHoveredSection(null)}
    >
      <span className="w-full">{children}</span>
      {hoveredSection === sectionKey && (
        <div className="absolute top-2 right-2 flex gap-2 z-50 transition-colors duration-150">
          {mode === 'ai' ? (
            <>
              <Button variant="outline" size="icon" className="size-8 transition-colors duration-150 group" onClick={onAccept}><Check size={18} className="text-slate-500 group-hover:text-slate-900" /></Button>
              <Button variant="outline" size="icon" className="size-8 transition-colors duration-150 group" onClick={onDecline}><X size={18} className="text-slate-500 group-hover:text-slate-900" /></Button>
              <Button variant="outline" size="icon" className="size-8 transition-colors duration-150 group" onClick={onRegenerate}><Sparkles size={18} className="text-slate-500 group-hover:text-slate-900" /></Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" className="size-8 transition-colors duration-150 group" onClick={onCopy}><Copy size={18} className="text-slate-500 group-hover:text-slate-900" /></Button>
              <Button variant="outline" size="icon" className="size-8 transition-colors duration-150 group"><Sparkles size={18} className="text-slate-500 group-hover:text-slate-900" /></Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuggestionField; 