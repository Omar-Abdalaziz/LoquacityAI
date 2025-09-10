import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Chat, Part } from '@google/genai';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { SearchHistoryItem, Source, ChatMessage, Citation, NewsArticle, Json } from '../types';
import * as geminiService from '../services/geminiService';
import { extractAndParseMarkdownTable } from '../utils/markdownParser';
import { processCitedContent } from '../utils/citationProcessor';
import { SearchBar } from './SearchBar';
import { ComparisonTable } from './ComparisonTable';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesList } from './SourcesList';
import { ProfilePage as SettingsModal } from './ProfilePage';
import { HistoryPage } from './HistoryPage';
import { DiscoverPage } from './DiscoverPage';
import { ArticleView } from './ArticleView';
import { FinancePage } from './FinancePage';
import { CitationPopover } from './CitationPopover';
import { RelatedQueries, RelatedQueriesSkeleton } from './RelatedQueries';
import { 
    SparklesIcon, UserCircleIcon, MenuIcon, XIcon,
    ClipboardIcon, ShareIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon,
    DocumentTextIcon, PaperClipIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, BookOpenIcon, ClockIcon, CheckIcon,
    NewspaperIcon, ArrowPathIcon, ChartBarIcon, LogoIcon, LogoWordmark
} from './icons';

interface SearchPageProps {
  session: Session;
}

const parseSources = (sources: any | null): Source[] | null => {
    if (!sources) return null;
    let data: unknown;
    if (typeof sources === 'string') {
        try { data = JSON.parse(sources); } catch (e) { return null; }
    } else { data = sources; }
    if (!Array.isArray(data)) return null;
    const validSources = data.filter((item: any): item is Source =>
        item && typeof item.title === 'string' && typeof item.uri === 'string'
    );
    return validSources.length > 0 ? validSources : null;
};

const WelcomeScreen = () => {
    const { t } = useLocalization();
    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-lg mx-auto animate-fade-in">
                 <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-accent-400 shadow-lg">
                    <LogoIcon className="w-14 h-14 text-white/90" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">{t('search.welcomeTitle')}</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-lg">{t('search.welcomeSubtitle')}</p>
            </div>
        </div>
    );
}

const ChatMessageItem: React.FC<{ 
    msg: ChatMessage; 
    onCopy: (messageId: string) => void; 
    copiedMessageId: string | null;
    onCitationClick: (messageId: string, sourceIndex: number, target: HTMLElement) => void;
    highlightedSource: { messageId: string; sourceIndex: number } | null;
}> = ({ msg, onCopy, copiedMessageId, onCitationClick, highlightedSource }) => {
    const { t } = useLocalization();
    const contentRef = useRef<HTMLDivElement>(null);
    
    const contentToRender = useMemo(() => {
       if (msg.role === 'model') {
         return processCitedContent(msg.content, msg.citations, msg.sources);
       }
       return msg.content;
    }, [msg.content, msg.citations, msg.sources, msg.role]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
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
    }, [msg.id, onCitationClick]);
    
    const highlightedSourceIndex = highlightedSource?.messageId === msg.id ? highlightedSource.sourceIndex : null;

    return (
        <div className="flex items-start gap-4 animate-pop-in group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 mt-1">
                {msg.role === 'user' ? <UserCircleIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" /> : <LogoIcon className="w-5 h-5 text-brand-600" />}
            </div>
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{msg.role === 'user' ? t('search.you') : t('search.loquacity')}</p>
                {msg.role === 'user' ? (
                    <div className="text-neutral-800 dark:text-neutral-200">
                        {msg.file && (
                            <div className="mb-3 p-2 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center gap-3 w-fit max-w-full">
                                {msg.file.type.startsWith('image/') ? (
                                    <img src={msg.file.previewUrl} alt={msg.file.name} className="w-14 h-14 object-cover rounded-md" />
                                ) : (
                                    <div className="w-14 h-14 flex-shrink-0 bg-neutral-300 dark:bg-neutral-700 rounded-md flex items-center justify-center">
                                        <DocumentTextIcon className="w-7 h-7 text-neutral-500 dark:text-neutral-400" />
                                    </div>
                                )}
                                <div className="truncate flex-1">
                                    <p className="font-medium truncate">{msg.file.name}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{msg.file.type}</p>
                                </div>
                            </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content || (msg.file && ' ')}</p>
                    </div>
                ) : (
                    <div>
                        <div className="space-y-4">
                            {msg.table && <ComparisonTable data={msg.table} />}
                            <div ref={contentRef}>
                               <MarkdownRenderer content={contentToRender} />
                            </div>
                        </div>
                        <SourcesList sources={msg.sources || []} messageId={msg.id} highlightedSourceIndex={highlightedSourceIndex} />
                        <div className="pt-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onCopy(msg.id)} title={copiedMessageId === msg.id ? t('search.copied') : t('search.copy')} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors">
                                {copiedMessageId === msg.id ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={() => alert(t('search.shareComingSoon'))} title={t('search.share')} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors">
                                <ShareIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

type Category = 'Top Stories' | 'Middle East' | 'Egypt';
interface NewsCacheEntry { articles: NewsArticle[]; loading: boolean; error: string | null; }

export const SearchPage: React.FC<SearchPageProps> = ({ session }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();
  const { personalization } = usePersonalization();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState<boolean>(false);
  const [activePopover, setActivePopover] = useState<{ messageId: string, sourceIndex: number, source: Source; target: HTMLElement } | null>(null);
  const [highlightedSource, setHighlightedSource] = useState<{ messageId: string, sourceIndex: number } | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'history' | 'discover' | 'finance'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDeepResearchMode, setIsDeepResearchMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isRequestCancelled = useRef(false);
  const [newsCache, setNewsCache] = useState<Record<Category, NewsCacheEntry>>({
    'Top Stories': { articles: [], loading: false, error: null }, 'Middle East': { articles: [], loading: false, error: null }, 'Egypt': { articles: [], loading: false, error: null },
  });
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(null);
  const [articleContentState, setArticleContentState] = useState({ loading: false, content: '', error: null as string | null });

    const handleStop = useCallback(() => { isRequestCancelled.current = true; setIsLoading(false); }, []);

    const handleFetchNews = useCallback(async (category: Category, isRefresh = false) => {
        const cacheEntry = newsCache[category];
        if (cacheEntry.loading || (cacheEntry.articles.length > 0 && !isRefresh)) return;
        setNewsCache(prev => ({ ...prev, [category]: { ...prev[category], loading: true, error: null } }));
        try {
            const fetchedArticles = await geminiService.fetchNews(category);
            setNewsCache(prev => ({ ...prev, [category]: { articles: fetchedArticles, loading: false, error: null } }));
        } catch (err) {
            const errorMessage = (err instanceof Error ? err.message : "Failed to fetch news.");
            setNewsCache(prev => ({ ...prev, [category]: { ...prev[category], articles: [], loading: false, error: errorMessage } }));
        }
    }, [newsCache]);

  useEffect(() => { handleFetchNews('Top Stories'); }, [handleFetchNews]);

  const handleArticleSelect = async (article: NewsArticle) => {
    setReadingArticle(article);
    setArticleContentState({ loading: true, content: '', error: null });
    try {
        const content = await geminiService.fetchArticleContent(article.url);
        setArticleContentState({ loading: false, content: content, error: null });
    } catch (err) {
        setArticleContentState({ loading: false, content: '', error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  };
  const handleBackToDiscover = () => { setReadingArticle(null); setArticleContentState({ loading: false, content: '', error: null }); };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isLoading]);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase.from('search_history').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) console.error('Error fetching history:', error.message);
    else if (data) setHistory(data as unknown as SearchHistoryItem[]);
  }, [session.user.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  
  const resetChatState = () => {
    setIsLoading(false); setError(null); setActiveChat(null); setChatMessages([]);
    setFile(null); setFilePreview(null); setActivePopover(null); setHighlightedSource(null);
    setRelatedQueries([]); setIsRelatedLoading(false);
  };

  const handleNewChat = () => {
    resetChatState(); setIsDeepResearchMode(false); setIsMobileSidebarOpen(false);
    setActiveView('chat'); setReadingArticle(null);
  };
  
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
  });

  const handleSendMessage = useCallback(async (query: string) => {
    if (isLoading || (!query && !file)) return;
    isRequestCancelled.current = false; setIsLoading(true); setError(null); setActivePopover(null);
    const isNewChat = !activeChat;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: query, file: file ? { name: file.name, type: file.type, previewUrl: filePreview! } : undefined };
    setChatMessages(prev => [...prev, userMessage]);
    const currentFile = file;
    setFile(null); setFilePreview(null); if(fileInputRef.current) fileInputRef.current.value = "";
    try {
        let fileData: { mimeType: string; data: string } | undefined = currentFile ? { mimeType: currentFile.type, data: await toBase64(currentFile) } : undefined;
        if (isNewChat) {
            setRelatedQueries([]); setIsRelatedLoading(true);
            const answerResult = await geminiService.performSmartSearch(query, fileData, isDeepResearchMode, personalization);
            if (isRequestCancelled.current) return;
            const { remainingText, table } = extractAndParseMarkdownTable(answerResult.text);
            const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: remainingText, sources: answerResult.sources, citations: answerResult.citations, table: table };
            setChatMessages(prev => [...prev, modelMessage]);
            (async () => {
                try {
                    const queries = await geminiService.generateRelatedQueries(query, answerResult.text);
                    if (!isRequestCancelled.current) setRelatedQueries(queries);
                } catch (err) { if (!isRequestCancelled.current) { console.error("Failed to get related queries:", err); setRelatedQueries([]); }
                } finally { if (!isRequestCancelled.current) setIsRelatedLoading(false); }
            })();
            const { data: insertedData, error: insertError } = await supabase.from('search_history').insert([{ user_id: session.user.id, query: query || t('search.fileAnalysis'), answer: answerResult.text, sources: answerResult.sources as Json, is_deep_research: isDeepResearchMode }]).select('*').single();
            if (isRequestCancelled.current) return;
            if (insertError) { setError(`${t('search.error.failedToSaveHistory')}${insertError.message}`); } else if (insertedData) { setHistory(prev => [insertedData, ...prev]); }
            const historyForApi: { role: 'user' | 'model'; parts: Part[] }[] = [];
            const userParts: Part[] = [];
            if (fileData) userParts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data }});
            userParts.push({ text: query });
            historyForApi.push({ role: 'user', parts: userParts });
            historyForApi.push({ role: 'model', parts: [{ text: answerResult.text }] });
            const newChat = geminiService.startChat(historyForApi, isDeepResearchMode, personalization);
            if (isRequestCancelled.current) return; setActiveChat(newChat);
        } else {
            const messageParts: Part[] = [];
            if(fileData) messageParts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data }});
            messageParts.push({ text: query || (fileData ? "Describe the file" : "") });
            const stream = await activeChat.sendMessageStream({ message: messageParts });
            if (isRequestCancelled.current) return;
            let fullText = '', sources: Source[] = [], citations: Citation[] = [];
            const modelMessageId = crypto.randomUUID();
            setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '', sources: [], citations: [], table: null }]);
            for await (const chunk of stream) {
                if (isRequestCancelled.current) break;
                fullText += chunk.text;
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    const newSources: Source[] = ((groundingChunks || []) as any[]).map(c => c.web).filter(w => w?.uri && w?.title).map(w => ({ title: w.title, uri: w.uri }));
                    if (newSources.length > 0) { sources.push(...newSources); sources = Array.from(new Map(sources.map(s => [s.uri, s])).values()); }
                }
                const newCitations = chunk.candidates?.[0]?.citationMetadata?.citations;
                if (newCitations?.length > 0) { citations.push(...newCitations as Citation[]); citations = Array.from(new Map(citations.map(c => [`${c.startIndex}-${c.uri}`, c])).values()); }
                setChatMessages(prev => prev.map(msg => msg.id === modelMessageId ? {...msg, content: fullText, sources: sources, citations: citations} : msg));
            }
            if (isRequestCancelled.current) return;
            setChatMessages(prev => prev.map(msg => {
                if (msg.id === modelMessageId) { const { remainingText, table } = extractAndParseMarkdownTable(msg.content); return { ...msg, content: remainingText, table: table }; }
                return msg;
            }));
        }
    } catch (e) {
        if (isRequestCancelled.current) return;
        setError((e as Error).message || t('search.error.unexpected'));
        setChatMessages(prev => prev.slice(0, -1));
    } finally { setIsLoading(false); }
  }, [isLoading, activeChat, session.user.id, file, filePreview, isDeepResearchMode, t, personalization]);
  
  const loadChatFromHistory = (item: SearchHistoryItem) => {
    resetChatState(); setActiveView('chat'); setIsDeepResearchMode(item.is_deep_research);
    const { remainingText, table } = extractAndParseMarkdownTable(item.answer);
    const initialMessages: ChatMessage[] = [
        { id: crypto.randomUUID(), role: 'user', content: item.query },
        { id: crypto.randomUUID(), role: 'model', content: remainingText, sources: parseSources(item.sources) || [], citations: [], table: table },
    ];
    setChatMessages(initialMessages);
    const historyForApi: { role: "user" | "model"; parts: { text: string }[] }[] = [
        { role: 'user', parts: [{ text: item.query }] }, { role: 'model', parts: [{ text: item.answer }] },
    ];
    setActiveChat(geminiService.startChat(historyForApi, item.is_deep_research, personalization));
    setIsMobileSidebarOpen(false);
  };
  
  const handleCopy = (messageId: string) => {
    const message = chatMessages.find(m => m.id === messageId);
    if (!message || message.role !== 'model') return;
    const textToCopy = [ message.content, message.table ? `Table:\n${message.table.headers.join(' | ')}\n${message.table.rows.map(r => r.join(' | ')).join('\n')}` : '', message.sources && message.sources.length > 0 ? `\n${t('sources.title')}:\n${message.sources.map(s => `${s.title}: ${s.uri}`).join('\n')}` : '' ].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(textToCopy).then(() => { setCopiedMessageId(messageId); setTimeout(() => setCopiedMessageId(null), 2000); }).catch(() => alert(t('search.error.failedToCopy')));
  };

  const handleConfirmDelete = async (id: string) => {
    const oldHistory = [...history];
    setHistory(history.filter(item => item.id !== id));
    const { error } = await supabase.from('search_history').delete().eq('id', id);
    if (error) { setHistory(oldHistory); setError(t('search.error.failedToDeleteHistory')); }
  };
  
  const handleSaveEdit = async (id: string, query: string) => {
    if (!query.trim()) return;
    const oldHistory = [...history];
    setHistory(history.map(h => h.id === id ? { ...h, query: query.trim() } : h));
    const { error } = await supabase.from('search_history').update({ query: query.trim() } as any).eq('id', id);
    if (error) { setHistory(oldHistory); setError(t('search.error.failedToUpdateHistory')); }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
          if (selectedFile.size > 4 * 1024 * 1024) { setError(t('search.error.fileTooLarge')); return; }
          setFile(selectedFile);
          if (selectedFile.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => setFilePreview(reader.result as string); reader.readAsDataURL(selectedFile); } 
          else { setFilePreview(selectedFile.name); }
      }
  };
  const handleRemoveFile = () => { setFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const handleCitationClick = (messageId: string, sourceIndex: number, target: HTMLElement) => {
      const message = chatMessages.find(m => m.id === messageId);
      if (!message || !message.sources) return;
      const source = message.sources[sourceIndex];
      if (activePopover?.target === target) setActivePopover(null);
      else setActivePopover({ messageId, sourceIndex, source, target });
  };
  const handleGoToSource = () => {
      if (!activePopover) return;
      const { messageId, sourceIndex } = activePopover;
      setActivePopover(null); 
      const sourceElement = document.getElementById(`source-${messageId}-${sourceIndex}`);
      if (sourceElement) {
          sourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedSource({ messageId, sourceIndex });
          setTimeout(() => setHighlightedSource(null), 1500);
      }
  };
  const handleRelatedQueryClick = (query: string) => { handleNewChat(); setTimeout(() => handleSendMessage(query), 50); };

  return (
    <div className="relative flex h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950">
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} session={session} />
        {activePopover && <CitationPopover source={activePopover.source} targetElement={activePopover.target} onClose={() => setActivePopover(null)} onGoToSource={handleGoToSource} />}
        {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>}

        <aside className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto bg-white dark:bg-neutral-900 flex flex-col transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l ${isMobileSidebarOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full'} ${isSidebarCollapsed ? 'w-20' : 'w-72'} lg:translate-x-0 rtl:lg:-translate-x-0`}>
            <div className={`p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'hidden' : 'inline-flex'}`}>
                    <LogoIcon className="w-7 h-7 text-brand-600"/>
                    <LogoWordmark className="h-6 text-neutral-800 dark:text-neutral-200"/>
                </div>
                <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden lg:block" aria-label={t('sidebar.toggleSidebar')}>
                    {isSidebarCollapsed ? <PanelLeftOpenIcon className="w-5 h-5"/> : <PanelLeftCloseIcon className="w-5 h-5"/>}
                </button>
            </div>
            
             <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                <button onClick={handleNewChat} className={`w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-800 dark:text-neutral-200 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <LogoIcon className="w-5 h-5 text-brand-600 flex-shrink-0"/>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>{t('sidebar.newChat')}</span>
                </button>
                {[
                    { view: 'discover', icon: NewspaperIcon, label: t('sidebar.discover') },
                    { view: 'finance', icon: ChartBarIcon, label: t('sidebar.finance') },
                    { view: 'history', icon: ClockIcon, label: t('sidebar.history') }
                ].map(({ view, icon: Icon, label }) => (
                     <button key={view} onClick={() => { setActiveView(view as any); setIsMobileSidebarOpen(false); setReadingArticle(null); }}
                        className={`w-full flex items-center gap-3 p-3 text-sm font-medium rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''} ${activeView === view ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`truncate ${isSidebarCollapsed ? 'hidden' : 'inline'}`}>{label}</span>
                    </button>
                ))}
            </div>

            <div ref={userMenuRef} className="p-2 border-t border-neutral-200 dark:border-neutral-800 relative">
                {isUserMenuOpen && (
                    <div className="absolute bottom-full left-2 right-2 mb-2 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 animate-pop-in z-10">
                        <button onClick={() => {setIsSettingsOpen(true); setIsUserMenuOpen(false);}} className="w-full flex items-center gap-3 p-3 text-sm text-neutral-700 dark:text-neutral-300 font-medium rounded-t-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                            <Cog6ToothIcon className="w-5 h-5" /> {t('sidebar.settings')}
                        </button>
                        <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 p-3 text-sm text-neutral-700 dark:text-neutral-300 font-medium rounded-b-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" /> {t('sidebar.signOut')}
                        </button>
                    </div>
                )}
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`w-full flex items-center gap-3 p-2 text-sm text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mt-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <UserCircleIcon className="w-8 h-8 flex-shrink-0" />
                    <div className={`flex-1 text-left rtl:text-right truncate ${isSidebarCollapsed ? 'hidden' : 'inline'}`}>
                        <p className="font-semibold">{session.user.email}</p>
                    </div>
                </button>
            </div>
        </aside>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <header className="absolute top-0 left-0 rtl:left-auto rtl:right-0 p-2 lg:hidden z-10">
           <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors" aria-label={t('sidebar.openHistory')}>
            <MenuIcon className="w-6 h-6"/>
           </button>
        </header>

        {activeView === 'history' && <HistoryPage history={history} onItemClick={loadChatFromHistory} onSaveEdit={handleSaveEdit} onConfirmDelete={handleConfirmDelete} />}
        {activeView === 'finance' && <FinancePage />}
        {activeView === 'discover' && (readingArticle ? <ArticleView article={readingArticle} content={articleContentState.content} loading={articleContentState.loading} error={articleContentState.error} onBack={handleBackToDiscover} /> : <DiscoverPage newsCache={newsCache} onArticleSelect={handleArticleSelect} onSelectCategory={handleFetchNews} onRefresh={category => handleFetchNews(category, true)} />)}
        
        {activeView === 'chat' && (
         <>
            <main className="flex-grow w-full max-w-4xl mx-auto flex flex-col overflow-y-auto px-4 pt-16">
            {chatMessages.length > 0 ? (
                <div className="flex-grow space-y-8 py-6">
                    {chatMessages.map((msg) => ( <ChatMessageItem key={msg.id} msg={msg} onCopy={handleCopy} copiedMessageId={copiedMessageId} onCitationClick={handleCitationClick} highlightedSource={highlightedSource} /> ))}
                    {isLoading && (
                        <div className="flex items-start gap-4 animate-fade-in">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 mt-1">
                                <SparklesIcon className="w-5 h-5 text-brand-500 animate-pulse" />
                            </div>
                            <div className="flex-grow mt-2 space-y-2.5">
                                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5 animate-pulse"></div>
                                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    )}
                    {chatMessages.length > 1 && !isLoading && (
                        <div className="animate-pop-in">
                            {isRelatedLoading && <RelatedQueriesSkeleton />}
                            {!isRelatedLoading && relatedQueries.length > 0 && <RelatedQueries queries={relatedQueries} onQueryClick={handleRelatedQueryClick} />}
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            ) : <WelcomeScreen />}
            </main>
            <footer className="w-full max-w-4xl mx-auto p-4 flex-shrink-0 bg-neutral-100/80 dark:bg-neutral-950/80 backdrop-blur-sm">
                {error && <div className="text-red-600 text-center text-sm mb-2 p-2 bg-red-100 dark:bg-red-900/50 rounded-md">{error}</div>}
                {file && (
                    <div className="mb-2 p-2 pr-1 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-lg border border-neutral-300 dark:border-neutral-700 flex items-center gap-3 w-fit max-w-full animate-pop-in">
                        {file.type.startsWith('image/') && filePreview ? (
                            <img src={filePreview} alt={file.name} className="w-10 h-10 object-cover rounded-md" />
                        ) : (
                            <div className="w-10 h-10 flex-shrink-0 bg-neutral-300 dark:bg-neutral-700 rounded-md flex items-center justify-center">
                                <DocumentTextIcon className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                            </div>
                        )}
                        <div className="truncate flex-1">
                            <p className="font-medium truncate text-sm">{file.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{file.type}</p>
                        </div>
                        <button onClick={handleRemoveFile} disabled={isLoading} className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"> <XIcon className="w-4 h-4"/> </button>
                    </div>
                )}
                <SearchBar onSearch={handleSendMessage} isLoading={isLoading} onAttachmentClick={() => fileInputRef.current?.click()} hasAttachment={!!file} isDeepResearchMode={isDeepResearchMode} onToggleDeepResearch={() => setIsDeepResearchMode(!isDeepResearchMode)} onStop={handleStop} />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            </footer>
         </>
        )}
      </div>
    </div>
  );
};