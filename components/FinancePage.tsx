import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { FinanceData, MarketIndex, StockMover, NewsArticle } from '../types';
import * as geminiService from '../services/geminiService';
import { ArrowPathIcon, ChartBarIcon, NewspaperIcon } from './icons';

// Sub-components for FinancePage

const MarketIndexCard = ({ index }: { index: MarketIndex }) => {
    const isPositive = index.isPositive;
    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{index.name}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{index.value}</p>
            <div className={`text-sm font-semibold mt-1 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>
                <span>{index.change}</span>
                <span className="ml-2 rtl:mr-2 rtl:ml-0">({index.percentChange})</span>
            </div>
        </div>
    );
};

const MoverStockRow = ({ stock }: { stock: StockMover }) => {
    const isPositive = stock.isPositive;
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
            <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{stock.ticker}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-28 sm:max-w-40">{stock.name}</p>
            </div>
            <div className="text-right rtl:text-left">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{stock.price}</p>
                <p className={`text-xs font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500'}`}>{stock.percentChange}</p>
            </div>
        </div>
    );
};

const FinancialNewsCard = ({ article }: { article: NewsArticle }) => {
    const [imageError, setImageError] = useState(false);
    return (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-slate-800/50 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <div className="relative h-36">
                {imageError || !article.imageUrl ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                        <NewspaperIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                ) : (
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={() => setImageError(true)} />
                )}
            </div>
            <div className="p-3">
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1 uppercase tracking-wider">{article.source}</span>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-3 group-hover:text-sky-600 dark:group-hover:text-sky-400">{article.title}</h3>
            </div>
        </a>
    );
};

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-4">
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg hidden sm:block"></div>
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg hidden lg:block"></div>
        </div>
    </div>
);

// Main FinancePage Component
export const FinancePage: React.FC = () => {
    const { t, language } = useLocalization();
    const [data, setData] = useState<FinanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await geminiService.fetchFinanceData();
            setData(result);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : t('finance.error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        if (loading) {
            return <SkeletonLoader />;
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-8">
                    <ChartBarIcon className="w-16 h-16 mb-4 text-red-300 dark:text-red-500/50" />
                    <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">{t('finance.error')}</h2>
                     <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }
        if (!data) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
                    <ChartBarIcon className="w-16 h-16 mb-4 text-slate-400" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">{t('finance.noData')}</h2>
                </div>
            );
        }
        return (
            <div className="space-y-8 animate-fade-in">
                {/* Market Overview */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('finance.marketOverview')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       {data.marketIndices.map(index => <MarketIndexCard key={index.name} index={index} />)}
                    </div>
                </section>
                
                {/* Market Analysis */}
                {data.marketAnalysis && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('finance.marketAnalysis')}</h2>
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
                           <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{data.marketAnalysis}</p>
                        </div>
                    </section>
                )}

                {/* Top Movers */}
                <section>
                     <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('finance.topMovers')}</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
                           <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">{t('finance.gainers')}</h3>
                           <div>{data.topMovers.gainers.map(stock => <MoverStockRow key={stock.ticker} stock={stock} />)}</div>
                        </div>
                         <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-800">
                           <h3 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-2">{t('finance.losers')}</h3>
                           <div>{data.topMovers.losers.map(stock => <MoverStockRow key={stock.ticker} stock={stock} />)}</div>
                        </div>
                     </div>
                </section>

                {/* Financial News */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('finance.financialNews')}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.financialNews.map(article => <FinancialNewsCard key={article.url} article={article} />)}
                     </div>
                </section>
            </div>
        )
    };
    
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 pt-16 animate-fade-in">
            <header className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('finance.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{t('finance.subtitle')}</p>
                    </div>
                     <div className="flex items-center gap-4">
                        {lastUpdated && !loading && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                                {t('finance.lastUpdated')}: {lastUpdated.toLocaleTimeString(language)}
                            </p>
                        )}
                        <button 
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('finance.refresh')}
                        >
                            <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>
             <main className="flex-grow overflow-y-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
    )
};