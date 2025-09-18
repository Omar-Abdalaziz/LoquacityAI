import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { PaperClipIcon, ArrowUpIcon, BookOpenIcon, StopCircleIcon, CpuChipIcon, CheckIcon } from './icons';
import { ModelType } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onAttachmentClick: () => void;
  hasAttachment: boolean;
  initialQuery?: string;
  isDeepResearchMode: boolean;
  onToggleDeepResearch: () => void;
  onStop: () => void;
  activeModel: ModelType;
  onModelChange: (model: ModelType) => void;
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
    activeModel,
    onModelChange
}) => {
  const [query, setQuery] = useState(initialQuery);
  const { t } = useLocalization();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
        const maxHeight = 160; // 10rem
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

  const canSubmit = !isLoading && (!!query.trim() || hasAttachment);

  return (
    <div className="relative w-full">
      <div className="relative flex items-end w-full gap-2 p-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/10 ring-1 ring-neutral-900/10 dark:ring-white/10 focus-within:ring-brand-500 focus-within:ring-2 transition-all">
        
        <div className="relative" ref={modelSelectorRef}>
            {isModelSelectorOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10 animate-pop-in p-1">
                    <button onClick={() => { onModelChange('gemini'); setIsModelSelectorOpen(false); }} className="w-full text-left rtl:text-right px-3 py-2 text-sm flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 rounded-md transition-colors">
                        <span>Gemini</span> {activeModel === 'gemini' && <CheckIcon className="w-4 h-4 text-brand-500" />}
                    </button>
                    <button onClick={() => { onModelChange('deepseek'); setIsModelSelectorOpen(false); }} className="w-full text-left rtl:text-right px-3 py-2 text-sm flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 rounded-md transition-colors">
                        <span>DeepSeek</span> {activeModel === 'deepseek' && <CheckIcon className="w-4 h-4 text-brand-500" />}
                    </button>
                </div>
            )}
            <button
                type="button"
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                disabled={isLoading}
                className="p-2.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                aria-label={t('search.changeModel')}
                title={t('search.changeModel')}
            >
                <CpuChipIcon className="w-5 h-5" />
            </button>
        </div>

        <button
        type="button"
        onClick={onAttachmentClick}
        disabled={isLoading}
        className="p-2.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        aria-label={t('search.attachFile')}
        title={t('search.attachFile')}
        >
        <PaperClipIcon className={`w-5 h-5 transition-colors ${hasAttachment ? 'text-brand-600 dark:text-brand-500' : ''}`} />
        </button>
        
        <button
        type="button"
        onClick={onToggleDeepResearch}
        disabled={isLoading || activeModel !== 'gemini'}
        className="p-2.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex-1 w-full self-center py-1.5 bg-transparent resize-none focus:outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 disabled:opacity-50 max-h-40"
        />

        <div className="self-end">
            {isLoading ? (
            <button
                type="button"
                onClick={onStop}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
                aria-label={t('search.stopGeneration')}
            >
                <StopCircleIcon className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
            </button>
            ) : (
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all ${canSubmit ? 'bg-brand-600 hover:bg-brand-500' : 'bg-neutral-200 dark:bg-neutral-700 cursor-not-allowed'}`}
                aria-label={t('search.sendMessage')}
            >
                <ArrowUpIcon className={`w-5 h-5 transition-colors ${canSubmit ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />
            </button>
            )}
        </div>
      </div>
      {isDeepResearchMode && activeModel === 'gemini' && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-fit flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-brand-700 dark:text-brand-300 animate-fade-in shadow-sm">
          <BookOpenIcon className="w-4 h-4" />
          {t('search.deepResearchModeActive')}
        </div>
      )}
    </div>
  );
};