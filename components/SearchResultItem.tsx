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
        <h3 className="text-lg font-medium text-sky-700 dark:text-sky-400 group-hover:underline" title={source.title}>
            {source.title}
        </h3>
      </a>
    </div>
  );
};