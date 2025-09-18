import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Chat, Part } from '@google/genai';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { SearchHistoryItem, Source, ChatMessage, Citation, Json, ModelType, ImageSearchResult } from '../types';
import * as geminiService from '../services/geminiService';
import { extractAndParseMarkdownTable } from '../utils/markdownParser';
import { processCitedContent } from '../utils/citationProcessor';
import { SearchBar } from './SearchBar';
import { ComparisonTable } from './ComparisonTable';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesList } from './SourcesList';
import { ProfilePage as SettingsModal } from './ProfilePage';
import { HistoryPage } from './HistoryPage';
import { CitationPopover } from './CitationPopover';
import { RelatedQueries, RelatedQueriesSkeleton } from './RelatedQueries';
import { ChatMessageItem } from './ChatMessageItem';
import { 
    UserCircleIcon, MenuIcon, XIcon,
    ClipboardIcon, ShareIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon,
    DocumentTextIcon, PaperClipIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, BookOpenIcon, ClockIcon, CheckIcon,
    LogoIcon, LogoWordmark,
    ThumbsUpIcon, ThumbsDownIcon, ArrowUpOnSquareIcon
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
  const [activeView, setActiveView] = useState<'chat' | 'history'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDeepResearchMode, setIsDeepResearchMode] = useState(false);
  const [activeModel, setActiveModel] = useState<ModelType>('gemini');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isRequestCancelled = useRef(false);

    const handleStop = useCallback(() => { isRequestCancelled.current = true; setIsLoading(false); }, []);

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
    setActiveView('chat');
  };
  
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
  });

  const handleSendMessage = useCallback(async (query: string) => {
    if (isLoading || (!query.trim() && !file)) return;

    isRequestCancelled.current = false;
    setIsLoading(true);
    setError(null);
    setActivePopover(null);

    const isNewChat = !activeChat;

    const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
        file: file ? { name: file.name, type: file.type, previewUrl: filePreview! } : undefined,
    };
    
    // Add user message and a placeholder for the model's response
    const modelMessageId = crypto.randomUUID();
    setChatMessages(prev => [...prev, userMessage, {
        id: modelMessageId,
        role: 'model',
        content: '',
        sources: [],
        citations: [],
        table: null,
        images: isNewChat ? null : undefined, // Set to loading only for new chats
    }]);

    const currentFile = file;
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
        const fileData = currentFile ? { mimeType: currentFile.type, data: await toBase64(currentFile) } : undefined;
        let fullText = '';
        const sourcesMap = new Map<string, Source>();
        const citationsMap = new Map<string, Citation>();

        if (isNewChat) {
            setRelatedQueries([]);
            const stream = geminiService.performSmartSearch(query, fileData, isDeepResearchMode, personalization);

            for await (const chunk of stream) {
                if (isRequestCancelled.current) break;
                fullText += chunk.text || '';
                if (chunk.sources) chunk.sources.forEach(s => sourcesMap.set(s.uri, s));
                if (chunk.citations) chunk.citations.forEach(c => citationsMap.set(`${c.startIndex}-${c.uri}`, c));

                setChatMessages(prev => prev.map(msg =>
                    msg.id === modelMessageId ? {
                        ...msg,
                        content: fullText,
                        sources: Array.from(sourcesMap.values()),
                        citations: Array.from(citationsMap.values()),
                    } : msg
                ));
            }

            if (isRequestCancelled.current) return;

            // Start background tasks after the stream starts providing content
            geminiService.fetchImagesForSources(query, Array.from(sourcesMap.values()))
                .then(images => {
                    if (isRequestCancelled.current) return;
                    setChatMessages(prev => prev.map(msg =>
                        msg.id === modelMessageId ? { ...msg, images: images.length > 0 ? images : [] } : msg
                    ));
                }).catch(err => {
                    console.error("Image search failed:", err);
                    setChatMessages(prev => prev.map(msg =>
                        msg.id === modelMessageId ? { ...msg, images: undefined } : msg
                    ));
                });
            
            setIsRelatedLoading(true);
            geminiService.generateRelatedQueries(query, fullText)
                .then(queries => { if (!isRequestCancelled.current) setRelatedQueries(queries); })
                .catch(err => { if (!isRequestCancelled.current) console.error("Failed to get related queries:", err); })
                .finally(() => { if (!isRequestCancelled.current) setIsRelatedLoading(false); });
            
            // Final processing & saving
            const { remainingText, table } = extractAndParseMarkdownTable(fullText);
            const finalSources = Array.from(sourcesMap.values());
            
            setChatMessages(prev => prev.map(msg =>
                msg.id === modelMessageId ? { ...msg, content: remainingText, table } : msg
            ));

            const { data: insertedData } = await supabase.from('search_history').insert([{ user_id: session.user.id, query: query || t('search.fileAnalysis'), answer: fullText, sources: finalSources as Json, is_deep_research: isDeepResearchMode }]).select('*').single();
            if (insertedData) setHistory(prev => [insertedData, ...prev]);

            const historyForApi: { role: 'user' | 'model'; parts: Part[] }[] = [
                { role: 'user', parts: fileData ? [{ inlineData: { mimeType: fileData.mimeType, data: fileData.data } }, { text: query }] : [{ text: query }] },
                { role: 'model', parts: [{ text: fullText }] }
            ];
            setActiveChat(geminiService.startChat(historyForApi, isDeepResearchMode, personalization));

        } else { // Follow-up message
            const messageParts: Part[] = fileData
                ? [{ inlineData: { mimeType: fileData.mimeType, data: fileData.data } }, { text: query }]
                : [{ text: query }];

            const stream = await activeChat.sendMessageStream({ message: messageParts });

            for await (const chunk of stream) {
                if (isRequestCancelled.current) break;
                fullText += chunk.text;
                const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    const newSources: Source[] = ((groundingChunks || []) as any[]).map(c => c.web).filter(w => w?.uri && w?.title).map(w => ({ title: w.title, uri: w.uri }));
                    newSources.forEach(s => sourcesMap.set(s.uri, s));
                }
                const newCitations = chunk.candidates?.[0]?.citationMetadata?.citations;
                if (newCitations?.length) (newCitations as Citation[]).forEach(c => citationsMap.set(`${c.startIndex}-${c.uri}`, c));

                setChatMessages(prev => prev.map(msg =>
                    msg.id === modelMessageId ? {
                        ...msg,
                        content: fullText,
                        sources: Array.from(sourcesMap.values()),
                        citations: Array.from(citationsMap.values()),
                    } : msg
                ));
            }
            if (isRequestCancelled.current) return;

            const { remainingText, table } = extractAndParseMarkdownTable(fullText);
            setChatMessages(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, content: remainingText, table } : msg));
        }
    } catch (e) {
        if (isRequestCancelled.current) return;
        const errorMessage = (e as Error).message || t('search.error.unexpected');
        if (errorMessage.includes("API quota exceeded")) {
            setError(t('search.error.quotaExceeded'));
        } else {
            setError(errorMessage);
        }
        setChatMessages(prev => prev.filter(msg => msg.id !== modelMessageId)); // Remove placeholder
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, activeChat, session.user.id, file, filePreview, isDeepResearchMode, personalization, t]);
  
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
    const textToCopy = [
      message.content,
      message.table ? `Table:\n${message.table.headers.join(' | ')}\n${message.table.rows.map(r => r.join(' | ')).join('\n')}` : ''
    ].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(textToCopy).then(() => { setCopiedMessageId(messageId); setTimeout(() => setCopiedMessageId(null), 2000); }).catch(() => alert(t('search.error.failedToCopy')));
  };

  const handleRewrite = (messageId: string) => {
    const messageIndex = chatMessages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
        const originalUserQuery = chatMessages[messageIndex - 1];
        if (originalUserQuery && originalUserQuery.role === 'user') {
            handleSendMessage(originalUserQuery.content);
        }
    }
  };

  const handleExport = (messageId: string) => {
      const message = chatMessages.find(m => m.id === messageId);
      const userMessage = chatMessages.find((m, index) => chatMessages[index + 1]?.id === messageId);
      if (!message || !userMessage) return;
      let content = `Query: ${userMessage.content}\n\n`;
      content += `Answer:\n${message.content}\n\n`;
      if (message.table) {
          content += `Table:\n`;
          content += `| ${message.table.headers.join(' | ')} |\n`;
          content += `| ${message.table.headers.map(() => '---').join(' | ')} |\n`;
          message.table.rows.forEach(row => {
              content += `| ${row.join(' | ')} |\n`;
          });
          content += `\n`;
      }
      if (message.sources && message.sources.length > 0) {
          content += `Sources:\n`;
          message.sources.forEach((source, index) => {
              content += `${index + 1}. ${source.title}: ${source.uri}\n`;
          });
      }
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loquacity-answer-${message.id.substring(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

  const handleModelChange = (model: ModelType) => {
    setActiveModel(model);
    if (model !== 'gemini' && isDeepResearchMode) {
      setIsDeepResearchMode(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} session={session} />
        {activePopover && <CitationPopover source={activePopover.source} targetElement={activePopover.target} onClose={() => setActivePopover(null)} onGoToSource={handleGoToSource} />}
        {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>}

        <aside className={`
            bg-white dark:bg-neutral-950 flex flex-col transition-all duration-300 ease-in-out 
            border-r border-neutral-200 dark:border-neutral-800 rtl:border-r-0 rtl:border-l
            fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50
            w-72
            ${isMobileSidebarOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full'}
            lg:relative lg:inset-auto lg:translate-x-0 rtl:lg:translate-x-0
            ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}>
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
                    { view: 'history', icon: ClockIcon, label: t('sidebar.history') }
                ].map(({ view, icon: Icon, label }) => (
                     <button key={view} onClick={() => { setActiveView(view as any); setIsMobileSidebarOpen(false); }}
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
        
        {activeView === 'chat' && (
         <>
            <main className="flex-grow w-full max-w-4xl mx-auto flex flex-col overflow-y-auto px-4 pt-16 lg:pt-6">
            {chatMessages.length > 0 ? (
                <div className="flex-grow space-y-6 py-6">
                    {chatMessages.map((msg, index) => {
                         const userPrompt = chatMessages[index - 1]?.role === 'user' ? chatMessages[index - 1].content : (msg.role === 'model' && index === 0 ? chatMessages[0].content : '');
                         return <ChatMessageItem key={msg.id} msg={msg} userPrompt={userPrompt} onCopy={handleCopy} onRewrite={handleRewrite} onExport={handleExport} copiedMessageId={copiedMessageId} onCitationClick={handleCitationClick} highlightedSource={highlightedSource} isFirstQuery={index === 0} />
                    })}
                    {isLoading && chatMessages[chatMessages.length -1]?.role === 'model' && chatMessages[chatMessages.length -1]?.content === '' && (
                        <div className="animate-fade-in pt-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-brand-500/10 dark:bg-brand-500/20 mt-1">
                                    <LogoIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('search.loquacityIsTyping')}</p>
                                    <div className="flex gap-1">
                                        <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-is-typing-pulse [animation-delay:0s]"></span>
                                        <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-is-typing-pulse [animation-delay:0.2s]"></span>
                                        <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-is-typing-pulse [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* FIX: Replaced `!isNewChat` with `!!activeChat` to resolve scoping issue. `activeChat` correctly reflects if a chat is ongoing. */}
                    {chatMessages.length > 1 && !isLoading && !!activeChat && (
                        <div className="animate-pop-in">
                            {isRelatedLoading && <RelatedQueriesSkeleton />}
                            {!isRelatedLoading && relatedQueries.length > 0 && <RelatedQueries queries={relatedQueries} onQueryClick={handleRelatedQueryClick} />}
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            ) : <WelcomeScreen />}
            </main>
            <footer className="w-full max-w-4xl mx-auto p-2 sm:p-4 flex-shrink-0 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm">
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
                <SearchBar onSearch={handleSendMessage} isLoading={isLoading} onAttachmentClick={() => fileInputRef.current?.click()} hasAttachment={!!file} isDeepResearchMode={isDeepResearchMode} onToggleDeepResearch={() => setIsDeepResearchMode(!isDeepResearchMode)} onStop={handleStop} activeModel={activeModel} onModelChange={handleModelChange} />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            </footer>
         </>
        )}
      </div>
    </div>
  );
};