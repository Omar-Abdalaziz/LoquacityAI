
import React from 'react';
import { NewsArticle } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArrowLeftIcon, NewspaperIcon } from './icons';

interface ArticleViewProps {
  article: NewsArticle;
  content: string;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

const formatTimeForArticle = (date: Date, lang: string) => {
    return date.toLocaleDateString(lang, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const ArticleView: React.FC<ArticleViewProps> = ({ article, content, loading, error, onBack }) => {
    const { t, language } = useLocalization();

    const renderBody = () => {
        if (loading) {
            return (
                <div className="px-4 md:px-6 py-8 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-10 mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-8">
                    <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">{t('discover.errorArticle')}</h2>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }

        return <MarkdownRenderer content={content} />;
    };
    
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 animate-fade-in">
            <header className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center gap-2">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label={t('discover.backToNews')}
                >
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="truncate">
                    <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{article.title}</p>
                    <p className="text-xs truncate text-slate-500 dark:text-slate-400">{article.source}</p>
                </div>
            </header>
            
            <main className="flex-grow overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="relative w-full h-64 md:h-80 bg-slate-200 dark:bg-slate-800">
                        {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white">
                             <h1 className="text-2xl md:text-3xl font-bold leading-tight">{article.title}</h1>
                        </div>
                    </div>
                     <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">{article.source}</span> &bull; {formatTimeForArticle(new Date(article.publishedAt), language)}
                        </p>
                    </div>
                    <article className="p-4 md:p-6">
                        {renderBody()}
                    </article>
                </div>
            </main>
        </div>
    );
};
