import React, { useState, useRef, useEffect } from 'react';
import { Source } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { BookOpenIcon, ClipboardIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface SourcesListProps {
  sources: Source[];
  messageId: string;
  highlightedSourceIndex: number | null;
}

const getDomain = (uri: string): string => {
  try {
    const url = new URL(uri);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    const match = uri.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im);
    return match ? match[1] : uri;
  }
};

const SourceCard: React.FC<{ source: Source; index: number; messageId: string; isHighlighted: boolean; }> = ({ source, index, messageId, isHighlighted }) => {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocalization();
  const domain = getDomain(source.uri);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;

  useEffect(() => {
    if (isHighlighted && ref.current) {
        ref.current.classList.add('highlight');
    }
  }, [isHighlighted]);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(source.uri).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div 
      id={`source-${messageId}-${index}`} 
      ref={ref}
      className="source-card group"
    >
      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-neutral-100/50 hover:bg-neutral-200/60 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/60 ring-1 ring-inset ring-transparent hover:ring-neutral-300 dark:hover:ring-neutral-700">
        <div className="flex-shrink-0 flex items-center gap-2.5 pt-0.5">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{index + 1}</span>
            <img 
              src={faviconUrl} alt="" className="w-5 h-5 object-contain rounded-full bg-white" 
              onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M12 21a9 9 0 0 1-9-9c0-4.625 3.502-8.438 8-8.948V2.052a9 9 0 0 1 10 9.948m-10 8.948a9 9 0 0 0 9-9c0-4.625-3.502-8.438-8-8.948V2.052a9 9 0 0 0-10 9.948' /%3E%3C/svg%3E"; e.currentTarget.classList.add('p-0.5'); }}
            />
        </div>
        <div className="flex-grow overflow-hidden">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400" title={source.title}>
            {source.title}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{domain}</p>
        </div>
        <button onClick={handleCopy} className="flex-shrink-0 p-1.5 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" title={t('sources.copyLink')}>
          {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />}
        </button>
      </a>
    </div>
  );
};


export const SourcesList: React.FC<SourcesListProps> = ({ sources, messageId, highlightedSourceIndex }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLocalization();

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4 animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left rtl:text-right text-lg font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 rounded-lg p-2 transition-colors"
        aria-expanded={isOpen} aria-controls="sources-container"
      >
        <div className="flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            <span>{t('sources.title')} ({sources.length})</span>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div id="sources-container" className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          {sources.map((source, index) => (
            <SourceCard key={`${source.uri}-${index}`} source={source} index={index} messageId={messageId} isHighlighted={index === highlightedSourceIndex} />
          ))}
        </div>
      )}
    </div>
  );
};