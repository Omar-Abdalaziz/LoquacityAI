import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { NewsArticle } from '../types';
import { NewspaperIcon, ArrowPathIcon } from './icons';

const formatTimeSince = (date: Date, lang: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    return date.toLocaleDateString(lang, { day: 'numeric', month: 'long' });
};

const NewsCardSkeleton = () => (
    <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="w-full h-48 bg-neutral-300 dark:bg-neutral-700"></div>
        <div className="p-4 space-y-3">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4"></div>
            <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-full"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-1/3 pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700/50"></div>
        </div>
    </div>
);

const NewsCard = ({ article, onArticleSelect }: { article: NewsArticle, onArticleSelect: (article: NewsArticle) => void; }) => {
    const { language } = useLocalization();
    const [imageError, setImageError] = useState(false);
    const timeSince = formatTimeSince(new Date(article.publishedAt), language);

    return (
        <button onClick={() => onArticleSelect(article)} className="text-left rtl:text-right flex flex-col bg-white dark:bg-neutral-800/50 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group border border-neutral-200/80 dark:border-neutral-800">
            <div className="relative h-48 flex-shrink-0 overflow-hidden">
                {imageError || !article.imageUrl ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                        <NewspaperIcon className="w-12 h-12 text-neutral-400 dark:text-neutral-500" />
                    </div>
                ) : (
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImageError(true)} />
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 uppercase tracking-wider">{article.source}</span>
                <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100 mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-3 flex-grow">{article.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-2">{article.summary}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700/50">{timeSince}</p>
            </div>
        </button>
    );
};

type Category = 'Top Stories' | 'Middle East' | 'Egypt';
interface NewsCacheEntry { articles: NewsArticle[]; loading: boolean; error: string | null; }
interface DiscoverPageProps { newsCache: Record<Category, NewsCacheEntry>; onArticleSelect: (article: NewsArticle) => void; onSelectCategory: (category: Category) => void; onRefresh: (category: Category) => void; }

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ newsCache, onArticleSelect, onSelectCategory, onRefresh }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('Top Stories');
    const { t } = useLocalization();
    const categories: { id: Category; labelKey: string }[] = [{ id: 'Top Stories', labelKey: 'discover.topStories' }, { id: 'Middle East', labelKey: 'discover.middleEast' }, { id: 'Egypt', labelKey: 'discover.egypt' }];
    const handleCategoryClick = (category: Category) => { setActiveCategory(category); onSelectCategory(category); };

    const renderContent = () => {
        const currentData = newsCache[activeCategory];
        if (currentData?.loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <NewsCardSkeleton key={i} />)}</div>;
        if (currentData?.error) return <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-8"><NewspaperIcon className="w-16 h-16 mb-4 text-red-300 dark:text-red-500/50" /><h2 className="text-xl font-semibold text-red-700 dark:text-red-300">{t('discover.error')}</h2><p className="text-sm text-red-600 dark:text-red-400">{currentData.error}</p></div>;
        if (currentData && !currentData.loading && currentData.articles.length === 0) return <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-400 p-8 animate-fade-in"><NewspaperIcon className="w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-600" /><h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">{t('discover.noArticlesFound')}</h2><p>{t('discover.noArticlesFoundSubtitle')}</p></div>;
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{currentData?.articles.map((article, index) => <NewsCard key={`${article.url}-${index}`} article={article} onArticleSelect={onArticleSelect} />)}</div>;
    }

    const isLoading = newsCache[activeCategory]?.loading;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-900 pt-16 lg:pt-0 animate-fade-in">
            <header className="px-4 md:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{t('discover.title')}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">{t('discover.subtitle')}</p>
                    </div>
                    <button onClick={() => onRefresh(activeCategory)} disabled={isLoading} className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t('discover.refresh')}>
                        <ArrowPathIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>
            
            <div className="px-4 md:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <nav className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeCategory === cat.id ? 'bg-brand-600 text-white' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700/50'}`}>
                            {t(cat.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="flex-grow overflow-y-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
    );
};