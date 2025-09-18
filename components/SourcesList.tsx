import React from 'react';
import { Source } from '../types';

interface SourcesListProps {
  sources: Source[];
  messageId: string;
  highlightedSourceIndex: number | null;
  limit?: number;
}

const getDomain = (uri: string): string => {
  try {
    const url = new URL(uri);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    const match = uri.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
    return match ? match[1] : uri;
  }
};

const SourceCard: React.FC<{ source: Source; index: number; messageId: string; isHighlighted: boolean; }> = ({ source, index, messageId, isHighlighted }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const domain = getDomain(source.uri);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;

  React.useEffect(() => {
    if (isHighlighted && ref.current) {
        ref.current.classList.add('highlight');
    }
  }, [isHighlighted]);


  return (
    <div 
      id={`source-${messageId}-${index}`} 
      ref={ref}
      className="source-card"
    >
      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 p-3 h-full rounded-lg transition-colors duration-200 bg-neutral-100 dark:bg-neutral-800/50 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/50">
        <img 
            src={faviconUrl} alt="" className="w-4 h-4 mt-1 object-contain rounded-full bg-white flex-shrink-0 border border-neutral-200 dark:border-neutral-700" 
            onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' /%3E%3C/svg%3E"; e.currentTarget.classList.add('p-0.5'); }}
        />
        <div className="flex-grow overflow-hidden">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400" title={source.title}>
            {source.title}
          </p>
        </div>
      </a>
    </div>
  );
};


export const SourcesList: React.FC<SourcesListProps> = ({ sources, messageId, highlightedSourceIndex, limit }) => {
  if (!sources || sources.length === 0) return null;
  
  const sourcesToRender = limit ? sources.slice(0, limit) : sources;

  return (
    <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {sourcesToRender.map((source) => {
             const originalIndex = sources.findIndex(s => s.uri === source.uri);
             return (
                <SourceCard 
                    key={`${source.uri}-${originalIndex}`} 
                    source={source} 
                    index={originalIndex} 
                    messageId={messageId} 
                    isHighlighted={originalIndex === highlightedSourceIndex} 
                />
             )
          })}
        </div>
    </div>
  );
};