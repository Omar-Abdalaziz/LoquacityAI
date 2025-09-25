import React from 'react';
import { ModelType, Workspace } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { ShareIcon, SparklesIcon } from './icons';

interface ChatHeaderProps {
    activeModel: ModelType;
    selectedWorkspace: Workspace | null;
    onShare: () => void;
    isShareable: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ activeModel, selectedWorkspace, onShare, isShareable }) => {
    const { t } = useLocalization();
    
    return (
        <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                <SparklesIcon className="w-5 h-5 text-brand-500" />
                <span>{activeModel.charAt(0).toUpperCase() + activeModel.slice(1)}</span>
                {selectedWorkspace && (
                    <>
                        <span className="text-neutral-300 dark:text-neutral-700">|</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-48">
                            {selectedWorkspace.name}
                        </span>
                    </>
                )}
            </div>
            <button 
                onClick={onShare} 
                disabled={!isShareable}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isShareable ? t('share.shareChat') : undefined}
            >
                <ShareIcon className="w-4 h-4" />
                {t('share.shareChat')}
            </button>
        </div>
    );
};
