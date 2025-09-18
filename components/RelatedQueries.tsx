import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { LightBulbIcon } from './icons';

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
      <div className="space-y-3">
        {queries.map((query, index) => (
          <button
            key={index}
            onClick={() => onQueryClick(query)}
            className="w-full text-left rtl:text-right p-3 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-neutral-800/50 hover:bg-slate-200/70 dark:hover:bg-neutral-700/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <span className="font-medium">{query}</span>
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
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="w-full h-12 p-3 bg-neutral-100 dark:bg-neutral-800/70 rounded-lg">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}