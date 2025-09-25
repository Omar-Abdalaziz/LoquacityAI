import React, { useState, useMemo, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { SearchHistoryItem, Workspace } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, XIcon, ChatBubbleOvalLeftEllipsisIcon, SearchIcon, ArrowLeftIcon, Squares2X2Icon, BriefcaseIcon, AcademicCapIcon, BoltIcon } from './icons';

interface HistoryPageProps {
  history: SearchHistoryItem[];
  workspace?: Workspace | null;
  onItemClick: (item: SearchHistoryItem) => void;
  onSaveEdit: (id: string, query: string) => void;
  onConfirmDelete: (id: string) => void;
  onBackToWorkspaces?: () => void;
  onNewChatInWorkspace?: () => void;
}

const formatRelativeTime = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    return date.toLocaleDateString(lang);
};

const HistoryItem = ({ item, onSaveEdit, onItemClick, onDeleteClick, editingId, setEditingId, editText, setEditText, longPressedId, setLongPressedId, t, language }) => {
    const longPressTimer = useRef<number | null>(null);
    const isLongPressTriggered = useRef(false);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditText(item.query);
        setLongPressedId(null);
    };

    const handleSave = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (editText.trim()) onSaveEdit(item.id, editText.trim());
        setEditingId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditText('');
    };
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick(item.id);
        setLongPressedId(null);
    }

    const handlePressStart = () => {
        isLongPressTriggered.current = false;
        longPressTimer.current = window.setTimeout(() => {
            isLongPressTriggered.current = true;
            setLongPressedId(item.id);
        }, 500);
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleClick = () => {
        if (!isLongPressTriggered.current) {
            onItemClick(item);
        }
    };

    if (editingId === item.id) {
        return (
            <li className="p-4 bg-neutral-100 dark:bg-neutral-800">
                <div className="flex items-center gap-2">
                    <input
                        type="text" value={editText} onChange={e => setEditText(e.target.value)}
                        className="flex-grow bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(e); if (e.key === 'Escape') handleCancelEdit(e); }}
                        autoFocus onClick={e => e.stopPropagation()}
                    />
                    <button onClick={handleSave} className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50" title={t('history.save')}><CheckIcon className="w-5 h-5 text-green-600" /></button>
                    <button onClick={handleCancelEdit} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title={t('history.cancel')}><XIcon className="w-5 h-5 text-red-600" /></button>
                </div>
            </li>
        );
    }

    if (longPressedId === item.id) {
        return (
            <li className="bg-neutral-100 dark:bg-neutral-800 animate-fade-in">
                <div className="p-2 space-y-1">
                    <button onClick={handleEditClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rtl:text-right text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700/60 text-neutral-800 dark:text-neutral-200 transition-colors">
                        <PencilIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                        <span>{t('history.editTitle')}</span>
                    </button>
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rtl:text-right text-sm font-medium rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors">
                        <TrashIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{t('history.deleteChat')}</span>
                    </button>
                    <div className="h-px bg-neutral-200 dark:bg-neutral-700/50 !my-2"></div>
                    <button onClick={(e) => { e.stopPropagation(); setLongPressedId(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left rtl:text-right text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700/60 text-neutral-800 dark:text-neutral-200 transition-colors">
                        <XIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                        <span>{t('history.cancel')}</span>
                    </button>
                </div>
            </li>
        );
    }

    return (
        <li 
            onClick={handleClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            className="group cursor-pointer"
        >
            <div className="p-4 flex justify-between items-center hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors duration-150">
                <div className="flex-grow text-left rtl:text-right truncate pr-4 rtl:pr-0 rtl:pl-4">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{item.query}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatRelativeTime(item.created_at, language)}</p>
                </div>
                <div className="flex-shrink-0 hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleEditClick} className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700" title={t('history.editTitle')}><PencilIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /></button>
                    <button onClick={handleDelete} className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700" title={t('history.deleteChat')}><TrashIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /></button>
                </div>
            </div>
        </li>
    );
};

const ConfirmationDialog = ({ onConfirm, onCancel, t }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 transform transition-all animate-pop-in">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('history.confirmDeleteTitle')}</h3>
            <p className="text-neutral-600 dark:text-neutral-300 mt-2">{t('history.confirmDeleteMessage')}</p>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-800 dark:text-white font-semibold transition-colors">
                    {t('history.cancel')}
                </button>
                <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">
                    {t('history.delete')}
                </button>
            </div>
        </div>
    </div>
);

const icons = { BriefcaseIcon, AcademicCapIcon, BoltIcon, Squares2X2Icon, };

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, workspace, onItemClick, onSaveEdit, onConfirmDelete, onBackToWorkspaces, onNewChatInWorkspace }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const { t, language } = useLocalization();

  const filteredHistory = useMemo(() => {
    const sourceHistory = workspace ? history.filter(item => item.workspace_id === workspace.id) : history;
    if (!searchTerm) return sourceHistory;
    return sourceHistory.filter(item => 
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm, workspace]);

  const handleDeleteClick = (id: string) => { setDeletingId(id); }
  const confirmDeleteAction = () => { if (deletingId) { onConfirmDelete(deletingId); setDeletingId(null); } }
  const cancelDeleteAction = () => { setDeletingId(null); }

  const WorkspaceIcon = workspace?.icon ? icons[workspace.icon as keyof typeof icons] || BriefcaseIcon : BriefcaseIcon;
  
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-900 pt-16 lg:pt-0">
        <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 space-y-3">
            {workspace ? (
                <div className="flex items-start justify-between">
                    <div>
                        <button onClick={onBackToWorkspaces} className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-brand-600 dark:hover:text-brand-400 mb-2">
                           <ArrowLeftIcon className="w-4 h-4" /> {t('workspaces.backToWorkspaces')}
                        </button>
                        <div className="flex items-center gap-3">
                             <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${workspace.color}`}>
                                <WorkspaceIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{workspace.name}</h1>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{workspace.summary}</p>
                            </div>
                        </div>
                    </div>
                    {onNewChatInWorkspace && (
                         <button onClick={onNewChatInWorkspace} className="flex-shrink-0 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm">
                            {t('history.newChatInWorkspace')}
                        </button>
                    )}
                </div>
            ) : (
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{t('history.title')}</h1>
            )}
            <div className="relative">
                <SearchIcon className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <input
                    type="text"
                    placeholder={t('history.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg py-2.5 pl-11 pr-4 rtl:pr-11 rtl:pl-4 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
            </div>
        </header>
        <div className="flex-grow overflow-y-auto" onClick={() => setLongPressedId(null)}>
            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-400 p-8 animate-fade-in">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-600" />
                    <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
                        {searchTerm ? t('history.noResults') : t('history.noConversations')}
                    </h2>
                    <p>{searchTerm ? t('history.noResultsSubtitle') : t('history.noConversationsSubtitle')}</p>
                </div>
            ) : (
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                   {filteredHistory.map(item => (
                       <HistoryItem 
                         key={item.id} item={item} onItemClick={onItemClick} onSaveEdit={onSaveEdit}
                         onDeleteClick={handleDeleteClick} editingId={editingId} setEditingId={setEditingId}
                         editText={editText} setEditText={setEditText} t={t} language={language}
                         longPressedId={longPressedId} setLongPressedId={setLongPressedId}
                       />
                   ))}
                </ul>
            )}
        </div>
        {deletingId && <ConfirmationDialog onConfirm={confirmDeleteAction} onCancel={cancelDeleteAction} t={t} />}
    </div>
  );
};