import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Workspace } from '../types';
import { XIcon, ShareIcon, ClipboardIcon, CheckIcon } from './icons';

interface ShareWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace | null;
    onUpdate: (id: string, updates: Partial<Workspace>) => Promise<void>;
}

export const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = ({ isOpen, onClose, workspace, onUpdate }) => {
    const { t } = useLocalization();
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (workspace) {
            setIsPublic(workspace.is_public);
        }
    }, [workspace]);

    if (!isOpen || !workspace) return null;

    const shareUrl = `${window.location.origin}/w/${workspace.share_id}`;

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        const updates: Partial<Workspace> = { is_public: checked };
        if (checked && !workspace.share_id) {
            updates.share_id = crypto.randomUUID();
        }
        await onUpdate(workspace.id, updates);
        setIsPublic(checked);
        setLoading(false);
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 transform transition-all animate-pop-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('share.shareWorkspace')}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 truncate">{workspace.name}</p>
                    </div>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                        <XIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                    </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{t('share.publicAccess')}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('share.publicAccessSubtitle')}</p>
                        </div>
                        <button
                            onClick={() => handleToggle(!isPublic)}
                            disabled={loading}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 ${isPublic ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                            role="switch"
                            aria-checked={isPublic}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublic ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {isPublic && workspace.share_id && (
                        <div className="mt-6 animate-fade-in">
                            <label htmlFor="share-link" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('share.shareLink')}</label>
                            <div className="mt-1 flex gap-2">
                                <input
                                    id="share-link"
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-grow bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="flex-shrink-0 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                                >
                                    {copied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                                    {copied ? t('search.copied') : t('share.copyLink')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
