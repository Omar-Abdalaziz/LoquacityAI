import React from 'react';
import { Source } from '../types';

interface SearchResultItemProps {
  source: Source;
  index: number;
  messageId: string;
  isHighlighted: boolean;
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

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ source, index, messageId, isHighlighted }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const domain = getDomain(source.uri);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;

  React.useEffect(() => {
    if (isHighlighted && ref.current) {
        ref.current.classList.add('highlight');
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  return (
    <div 
      id={`source-${messageId}-${index}`} 
      ref={ref}
      className="source-card p-3 rounded-lg transition-colors duration-200"
    >
      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="group block">
        <div className="flex items-center gap-2 mb-1">
          <img 
              src={faviconUrl} alt="" className="w-5 h-5 object-contain rounded-full bg-white flex-shrink-0 border border-neutral-200 dark:border-neutral-700" 
              onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 18L12 11' /%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 7L12 6' /%3E%3C/svg%3E"; }}
          />
        </div>
        <h3 className="text-lg font-medium text-sky-700 dark:text-sky-400 group-hover:underline" title={source.title}>
            {source.title}
        </h3>
      </a>
    </div>
  );
};