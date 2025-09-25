import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { Workspace, SearchHistoryItem, ChatMessage, Json } from '../types';
import { ChatMessageItem } from './ChatMessageItem';
import { LogoIcon } from './icons';
import { extractAndParseMarkdownTable } from '../utils/markdownParser';

interface PublicWorkspacePageProps {
  shareId: string;
}

const PublicPageLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string; }> = ({ children, title, subtitle }) => {
    const { t } = useLocalization();
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
            <header className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-8 h-8 text-brand-600" />
                    <div>
                        <h1 className="font-bold text-neutral-800 dark:text-neutral-200">{title}</h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs sm:max-w-md">{subtitle}</p>
                    </div>
                </div>
                <a href="/" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-sm flex-shrink-0">
                    {t('share.publicPage.tryIt')}
                </a>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto flex overflow-hidden">
                {children}
            </main>
        </div>
    );
};

const parseSourcesFromDb = (sources: Json | null) => {
    if (!sources) return [];
    try {
        const parsed = typeof sources === 'string' ? JSON.parse(sources) : sources;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export const PublicWorkspacePage: React.FC<PublicWorkspacePageProps> = ({ shareId }) => {
    const { t, language } = useLocalization();
    useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [chats, setChats] = useState<SearchHistoryItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<SearchHistoryItem | null>(null);

    useEffect(() => {
        const fetchSharedWorkspace = async () => {
            if (!shareId) {
                setError(t('share.publicPage.notFoundSubtitle'));
                setLoading(false);
                return;
            }

            try {
                const { data: wsData, error: wsError } = await supabase
                    .from('workspaces')
                    .select('*')
                    .eq('share_id', shareId)
                    .eq('is_public', true)
                    .single();

                if (wsError || !wsData) throw new Error(t('share.publicPage.notFoundSubtitle'));
                
                setWorkspace(wsData);

                const { data: chatData, error: chatError } = await supabase
                    .from('search_history')
                    .select('*')
                    .eq('workspace_id', wsData.id)
                    .order('created_at', { ascending: false });

                if (chatError) throw new Error(chatError.message);
                
                setChats(chatData);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedWorkspace();
    }, [shareId, t]);
    
    const chatMessages: ChatMessage[] = useMemo(() => {
        if (!selectedChat) return [];
        const { remainingText, table } = extractAndParseMarkdownTable(selectedChat.answer);
        return [
            { id: `user-${selectedChat.id}`, role: 'user', content: selectedChat.query },
            { id: `model-${selectedChat.id}`, role: 'model', content: remainingText, sources: parseSourcesFromDb(selectedChat.sources), table }
        ];
    }, [selectedChat]);


    const renderContent = () => {
        if (loading) return <p className="text-center p-8 w-full">{t('share.publicPage.loading')}</p>;
        if (error || !workspace) return (
            <div className="text-center p-8 w-full">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('share.publicPage.notFound')}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mt-2">{error || t('share.publicPage.notFoundSubtitle')}</p>
            </div>
        );

        return (
            <>
                <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r dark:border-neutral-800 flex flex-col">
                    <div className="p-4 border-b dark:border-neutral-800">
                        <h2 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">{workspace.name}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{workspace.summary}</p>
                    </div>
                    <ul className="overflow-y-auto flex-1 divide-y dark:divide-neutral-800">
                       {chats.map(chat => (
                           <li key={chat.id}>
                               <button onClick={() => setSelectedChat(chat)} className={`w-full text-left rtl:text-right p-4 transition-colors ${selectedChat?.id === chat.id ? 'bg-brand-50 dark:bg-brand-950' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'}`}>
                                   <p className={`font-medium truncate ${selectedChat?.id === chat.id ? 'text-brand-700 dark:text-brand-300' : 'text-neutral-800 dark:text-neutral-200'}`}>{chat.query}</p>
                                   <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{new Date(chat.created_at).toLocaleDateString(language)}</p>
                               </button>
                           </li>
                       ))}
                    </ul>
                </aside>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {selectedChat ? (
                        <div className="space-y-6">
                            {chatMessages.map((msg, index) => (
                                <ChatMessageItem 
                                    key={msg.id}
                                    msg={msg}
                                    userPrompt={chatMessages[0].content}
                                    isReadOnly={true}
                                    onCopy={() => {}} onRewrite={() => {}} onExport={() => {}}
                                    copiedMessageId={null} onCitationClick={() => {}}
                                    highlightedSource={null} isFirstQuery={index === 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-400">
                            <p>{t('share.publicPage.selectChat')}</p>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <PublicPageLayout title={t('share.publicPage.workspaceTitle')} subtitle={workspace?.name || ''}>
            {renderContent()}
        </PublicPageLayout>
    );
};
