import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { PaperClipIcon, ArrowUpIcon, BookOpenIcon, StopCircleIcon } from './icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onAttachmentClick: () => void;
  hasAttachment: boolean;
  initialQuery?: string;
  isDeepResearchMode: boolean;
  onToggleDeepResearch: () => void;
  onStop: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    isLoading, 
    onAttachmentClick, 
    hasAttachment, 
    initialQuery = '',
    isDeepResearchMode,
    onToggleDeepResearch,
    onStop,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const { t } = useLocalization();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        // Set a max-height and then scroll if content exceeds it
        const maxHeight = 128; // 8rem or 128px
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!query.trim() && !hasAttachment) return;
    onSearch(query.trim());
  };

  return (
    <div className="relative flex items-end gap-2">
        <div className="relative flex-grow flex items-center bg-white dark:bg-neutral-800 rounded-2xl shadow-lg shadow-black/5 ring-1 ring-neutral-200 dark:ring-neutral-700">
            <button
                type="button"
                onClick={onAttachmentClick}
                disabled={isLoading}
                className="p-3 self-start rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                aria-label={t('search.attachFile')}
                title={t('search.attachFile')}
            >
                <PaperClipIcon className={`w-5 h-5 transition-colors ${hasAttachment ? 'text-brand-600 dark:text-brand-500' : ''}`} />
            </button>
            <button
                type="button"
                onClick={onToggleDeepResearch}
                disabled={isLoading}
                className="p-3 self-start rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                aria-label={t('search.deepResearch')}
                title={t('search.deepResearch')}
            >
                <BookOpenIcon className={`w-5 h-5 transition-colors ${isDeepResearchMode ? 'text-brand-600 dark:text-brand-500' : ''}`} />
            </button>
            <textarea
                ref={textareaRef}
                value={query}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={t('search.placeholder')}
                disabled={isLoading}
                rows={1}
                className="w-full pl-1 pr-3 py-3 bg-transparent resize-none focus:outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 max-h-32"
            />
        </div>
        {isLoading ? (
            <button
                type="button"
                onClick={onStop}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 transition-all"
                aria-label={t('search.stopGeneration')}
            >
                <StopCircleIcon className="w-7 h-7 text-white" />
            </button>
        ) : (
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!query.trim() && !hasAttachment}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-brand-600 hover:bg-brand-500 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transition-all"
                aria-label={t('search.sendMessage')}
            >
                <ArrowUpIcon className="w-5 h-5 text-white" />
            </button>
        )}
    </div>
  );
};