import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { LightBulbIcon, ChevronRightIcon } from './icons';

interface RelatedQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
}

export const RelatedQueries: React.FC<RelatedQueriesProps> = ({ queries, onQueryClick }) => {
  const { t } = useLocalization();

  if (!queries || queries.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
        <LightBulbIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
        {t('search.relatedSearches')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {queries.map((query, index) => (
          <button
            key={index}
            onClick={() => onQueryClick(query)}
            className="group flex items-center justify-between w-full text-left rtl:text-right p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{query}</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2 rtl:mr-2 rtl:ml-0 group-hover:text-sky-500 transition-colors transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

export const RelatedQueriesSkeleton: React.FC = () => {
    const { t } = useLocalization();
    return (
        <div className="w-full mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 animate-pulse">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                <LightBulbIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                {t('search.relatedSearches')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between w-full p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                         <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}