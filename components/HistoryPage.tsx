import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { SearchHistoryItem } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, XIcon, ChatBubbleOvalLeftEllipsisIcon, SearchIcon } from './icons';

interface HistoryPageProps {
  history: SearchHistoryItem[];
  onItemClick: (item: SearchHistoryItem) => void;
  onSaveEdit: (id: string, query: string) => void;
  onConfirmDelete: (id: string) => void;
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

const HistoryItem = ({ item, onSaveEdit, onItemClick, onDeleteClick, editingId, setEditingId, editText, setEditText, t, language }) => {
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditText(item.title || item.query);
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
    }

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

    return (
         <li onClick={() => onItemClick(item)} className="group cursor-pointer">
            <div className="p-4 flex justify-between items-center hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors duration-150">
                <div className="flex-grow text-left rtl:text-right truncate pr-4 rtl:pr-0 rtl:pl-4">
                    <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{item.title || item.query}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatRelativeTime(item.created_at, language)}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={handleEditClick} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700" title={t('history.editTitle')}><PencilIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /></button>
                    <button onClick={handleDelete} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700" title={t('history.deleteChat')}><TrashIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /></button>
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

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onItemClick, onSaveEdit, onConfirmDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, language } = useLocalization();

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleDeleteClick = (id: string) => { setDeletingId(id); }
  const confirmDeleteAction = () => { if (deletingId) { onConfirmDelete(deletingId); setDeletingId(null); } }
  const cancelDeleteAction = () => { setDeletingId(null); }
  
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-900 pt-16">
        <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 space-y-3">
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{t('history.title')}</h1>
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
        <div className="flex-grow overflow-y-auto">
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
                       />
                   ))}
                </ul>
            )}
        </div>
        {deletingId && <ConfirmationDialog onConfirm={confirmDeleteAction} onCancel={cancelDeleteAction} t={t} />}
    </div>
  );
};