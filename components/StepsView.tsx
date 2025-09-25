import React from 'react';
import { Source } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { SearchIcon } from './icons';

interface StepsViewProps {
  query: string;
  sources: Source[];
}

const getDomain = (uri: string): string => {
  try {
    const url = new URL(uri);
  } catch (e) {
    return uri;
  }
};

const Step = ({ title, children, isLast = false }: { title: string; children?: React.ReactNode; isLast?: boolean }) => (
  <div className="relative pl-8">
    {!isLast && <div className="absolute left-2.5 top-5 h-full w-px bg-slate-200 dark:bg-slate-700"></div>}
    <div className="absolute left-0 top-2 flex items-center justify-center">
      <div className="h-5 w-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
      </div>
    </div>
    <div className="pt-1.5 pb-6">
      <p className="font-semibold text-slate-600 dark:text-slate-400">{title}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  </div>
);

const SourceItem = ({ source }: { source: Source }) => {
  const domain = getDomain(source.uri);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;

  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        <img
          src={faviconUrl}
          alt=""
          className="w-5 h-5 object-contain rounded-full bg-white flex-shrink-0"
          onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' /%3E%3C/svg%3E"; e.currentTarget.classList.add('p-0.5'); }}
        />
        <span className="truncate text-slate-800 dark:text-slate-200" title={source.title}>{source.title}</span>
      </div>
    </div>
  );
};

export const StepsView: React.FC<StepsViewProps> = ({ query, sources }) => {
  const { t } = useLocalization();

  return (
    <div className="animate-fade-in text-base">
      <Step title={t('steps.searchingWeb')}>
        <div className="mt-4">
          <p className="font-semibold text-sm text-slate-500 dark:text-slate-400 mb-2">{t('steps.searching')}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <SearchIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200">{query}</span>
          </div>
        </div>
      </Step>

      <Step title={`${t('steps.reviewingSources')} ${sources.length}`}>
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
          <div className="max-h-60 overflow-y-auto pr-2">
            {sources.map((source, index) => (
              <SourceItem key={index} source={source} />
            ))}
          </div>
        </div>
      </Step>

      <Step title={t('steps.finished')} isLast={true} />
    </div>
  );
};
