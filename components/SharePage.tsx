import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { ChatMessage, Json } from '../types';
import { ChatMessageItem } from './ChatMessageItem';
import { LogoIcon, LogoWordmark } from './icons';

interface SharePageProps {
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
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
                    </div>
                </div>
                <a href="/" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-sm">
                    {t('share.publicPage.tryIt')}
                </a>
            </header>
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6">
                {children}
            </main>
        </div>
    );
};

export const SharePage: React.FC<SharePageProps> = ({ shareId }) => {
    const { t } = useLocalization();
    useTheme(); // Initialize theme for public page
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<{ title: string; chat_data: ChatMessage[] } | null>(null);

    useEffect(() => {
        const fetchSharedChat = async () => {
            if (!shareId) {
                setError(t('share.publicPage.notFoundSubtitle'));
                setLoading(false);
                return;
            }

            try {
                const { data, error: dbError } = await supabase
                    .from('shared_chats')
                    .select('title, chat_data')
                    .eq('id', shareId)
                    .single();

                if (dbError || !data) {
                    throw new Error(dbError?.message || t('share.publicPage.notFoundSubtitle'));
                }
                
                setChat({
                    title: data.title,
                    chat_data: data.chat_data as unknown as ChatMessage[],
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedChat();
    }, [shareId, t]);

    const renderContent = () => {
        if (loading) {
            return <p className="text-center p-8">{t('share.publicPage.loading')}</p>;
        }

        if (error || !chat) {
            return (
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('share.publicPage.notFound')}</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">{error || t('share.publicPage.notFoundSubtitle')}</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                 {chat.chat_data.map((msg, index) => {
                     const userPrompt = chat.chat_data[index - 1]?.role === 'user' ? chat.chat_data[index - 1].content : (msg.role === 'model' && index === 0 ? chat.chat_data[0].content : '');
                     return (
                        <ChatMessageItem 
                            key={msg.id} 
                            msg={msg} 
                            userPrompt={userPrompt} 
                            isReadOnly={true}
                            onCopy={() => {}}
                            onRewrite={() => {}}
                            onExport={() => {}}
                            copiedMessageId={null}
                            onCitationClick={() => {}}
                            highlightedSource={null}
                            isFirstQuery={index === 0}
                        />
                     )
                })}
            </div>
        );
    };

    return (
        <PublicPageLayout title={t('share.publicPage.chatTitle')} subtitle={chat?.title || ''}>
            {renderContent()}
        </PublicPageLayout>
    );
};
