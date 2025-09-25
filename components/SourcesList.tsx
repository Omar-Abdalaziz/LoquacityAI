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