import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChatMessage, Source } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { processCitedContent } from '../utils/citationProcessor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ComparisonTable } from './ComparisonTable';
import { SourcesList } from './SourcesList';
import { ImageGallery } from './ImageGallery';
import { SearchResultItem } from './SearchResultItem';
import { StepsView } from './StepsView';
import { ImageGallerySkeleton } from './ImageGallerySkeleton';
import { 
    UserCircleIcon, LogoIcon, ClipboardIcon, ArrowPathIcon, CheckIcon, 
    ThumbsUpIcon, ThumbsDownIcon, ArrowUpOnSquareIcon 
} from './icons';

export const ChatMessageItem: React.FC<{ 
    msg: ChatMessage;
    userPrompt: string;
    onCopy: (messageId: string) => void; 
    onRewrite: (messageId: string) => void;
    onExport: (messageId: string) => void;
    copiedMessageId: string | null;
    onCitationClick: (messageId: string, sourceIndex: number, target: HTMLElement) => void;
    highlightedSource: { messageId: string; sourceIndex: number } | null;
    isFirstQuery: boolean;
    isReadOnly?: boolean;
}> = ({ msg, userPrompt, onCopy, onRewrite, onExport, copiedMessageId, onCitationClick, highlightedSource, isFirstQuery, isReadOnly = false }) => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState('Answer');
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    
    const handleFeedback = (newFeedback: 'up' | 'down') => {
        if (isReadOnly) return;
        setFeedback(current => current === newFeedback ? null : newFeedback);
    };

    const contentToRender = useMemo(() => {
       if (msg.role === 'model') {
         return processCitedContent(msg.content, msg.citations, msg.sources);
       }
       return msg.content;
    }, [msg.content, msg.citations, msg.sources, msg.role]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (isReadOnly) return;
            const target = e.target as HTMLElement;
            const trigger = target.closest('.citation-trigger');
            if (trigger) {
                const sourceIndexStr = trigger.getAttribute('data-source-index');
                if (sourceIndexStr) {
                    const sourceIndex = parseInt(sourceIndexStr, 10);
                    onCitationClick(msg.id, sourceIndex, trigger as HTMLElement);
                }
            }
        };
        const container = contentRef.current;
        container?.addEventListener('click', handleClick);
        return () => { container?.removeEventListener('click', handleClick); };
    }, [msg.id, onCitationClick, isReadOnly]);
    
    const highlightedSourceIndex = highlightedSource?.messageId === msg.id ? highlightedSource.sourceIndex : null;

    if (msg.role === 'user') {
      return (
        <div className="animate-pop-in">
            <div className={`flex items-start gap-4 ${isFirstQuery ? 'pb-4' : 'pt-6'}`}>
                <UserCircleIcon className="w-7 h-7 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-1" />
                <div className="flex-grow">
                    <div className={`${isFirstQuery ? 'text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100' : 'text-base font-semibold text-neutral-800 dark:text-neutral-200'}`}>
                         <p className="whitespace-pre-wrap">{msg.content || (msg.file && ' ')}</p>
                    </div>
                </div>
            </div>
        </div>
      )
    }

    const tabs = [
        { id: 'Answer', label: t('search.answer') },
        // The images tab is disabled only if the image fetch failed or is not applicable (e.g. follow-up).
        // It is enabled during loading (null) and when results are empty ([]).
        { id: 'Images', label: t('search.images'), disabled: msg.images === undefined },
        { id: 'Sources', label: `${t('search.sources')} (${msg.sources?.length || 0})` },
        { id: 'Steps', label: t('search.steps'), disabled: !msg.sources || msg.sources.length === 0 },
    ];

    return (
        <div className="animate-pop-in border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <div className="flex items-center gap-4 sm:gap-6 border-b border-neutral-200 dark:border-neutral-800 mb-5 text-sm font-semibold">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={tab.disabled}
                        className={`px-1 pb-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50
                            ${activeTab === tab.id 
                                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' 
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            <div ref={contentRef}>
                {activeTab === 'Answer' && (
                     <div className="space-y-4">
                        <SourcesList sources={msg.sources || []} messageId={msg.id} highlightedSourceIndex={highlightedSourceIndex} limit={Math.ceil((msg.sources?.length || 0) / 2)} />
                        {msg.table && <ComparisonTable data={msg.table} />}
                        <MarkdownRenderer content={contentToRender} sources={msg.sources} />
                    </div>
                )}
                
                {activeTab === 'Sources' && (
                    <div className="space-y-3">
                        {msg.sources?.map((source) => {
                            const originalIndex = msg.sources!.findIndex(s => s.uri === source.uri);
                            return (
                                <SearchResultItem
                                    key={`${source.uri}-${originalIndex}`}
                                    source={source}
                                    index={originalIndex}
                                    messageId={msg.id}
                                    isHighlighted={originalIndex === highlightedSourceIndex}
                                />
                            );
                        })}
                    </div>
                )}

                {activeTab === 'Images' && (
                    <>
                        {msg.images === null && <ImageGallerySkeleton />}
                        {Array.isArray(msg.images) && msg.images.length === 0 && (
                            <div className="flex items-center justify-center p-8 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg">
                                <p className="text-neutral-600 dark:text-neutral-400 font-medium">{t('search.noImagesFound')}</p>
                            </div>
                        )}
                        {Array.isArray(msg.images) && msg.images.length > 0 && (
                            <ImageGallery images={msg.images} prompt={userPrompt} />
                        )}
                    </>
                )}

                {activeTab === 'Steps' && (
                    <StepsView query={userPrompt} sources={msg.sources || []} />
                )}
            </div>


            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    {!isReadOnly && (
                        <>
                        <button onClick={() => onExport(msg.id)} className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-2.5 py-1.5 rounded-md transition-colors"><ArrowUpOnSquareIcon className="w-4 h-4" /> Export</button>
                        <button onClick={() => onRewrite(msg.id)} className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-2.5 py-1.5 rounded-md transition-colors"><ArrowPathIcon className="w-4 h-4" /> Rewrite</button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onCopy(msg.id)} title={copiedMessageId === msg.id ? t('search.copied') : t('search.copy')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 transition-colors">
                        {copiedMessageId === msg.id ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                    </button>
                    {!isReadOnly && (
                        <>
                        <button 
                            onClick={() => handleFeedback('up')}
                            title="Good response" 
                            className={`p-2 rounded-lg transition-colors ${feedback === 'up' ? 'bg-brand-100 dark:bg-brand-900/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80'}`}
                        >
                            <ThumbsUpIcon className={`w-5 h-5 transition-colors ${feedback === 'up' ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                        </button>
                        <button 
                            onClick={() => handleFeedback('down')}
                            title="Bad response" 
                            className={`p-2 rounded-lg transition-colors ${feedback === 'down' ? 'bg-red-100 dark:bg-red-900/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80'}`}
                        >
                            <ThumbsDownIcon className={`w-5 h-5 transition-colors ${feedback === 'down' ? 'text-red-600 dark:text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`} />
                        </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};