import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Workspace, SearchHistoryItem } from '../types';
import { 
    XIcon, Squares2X2Icon, CheckIcon, PencilIcon, TrashIcon, BriefcaseIcon, AcademicCapIcon, BoltIcon,
    SearchIcon, FunnelIcon, EllipsisVerticalIcon, PinIcon, ShareIcon, LightBulbIcon, CpuChipIcon, ChartBarIcon, GlobeAltIcon, PaintBrushIcon, BookOpenIcon
} from './icons';

interface WorkspacesPageProps {
    workspaces: Workspace[];
    history: SearchHistoryItem[];
    onSelectWorkspace: (workspace: Workspace) => void;
    onCreateWorkspace: (name: string, color: string, icon: string) => Promise<void>;
    onUpdateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
    onDeleteWorkspace: (id: string) => Promise<void>;
    onShareWorkspace: (workspace: Workspace) => void;
}

const icons = {
    BriefcaseIcon,
    AcademicCapIcon,
    BoltIcon,
    LightBulbIcon,
    CpuChipIcon,
    ChartBarIcon,
    GlobeAltIcon,
    PaintBrushIcon,
    BookOpenIcon,
    Squares2X2Icon,
};

const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500',
];

const formatTimeSince = (dateString: string, lang: string, t: (key: string, vars?: any) => string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    if (diffInSeconds < 60) return t('workspaces.lastUpdated', { time: rtf.format(-diffInSeconds, 'second') });
    if (diffInSeconds < 3600) return t('workspaces.lastUpdated', { time: rtf.format(-Math.floor(diffInSeconds / 60), 'minute')});
    if (diffInSeconds < 86400) return t('workspaces.lastUpdated', { time: rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')});
    return t('workspaces.lastUpdated', { time: date.toLocaleDateString(lang, { day: 'numeric', month: 'short' }) });
};


const WorkspaceModal = ({ isOpen, onClose, onSave, workspace, t }: { isOpen: boolean, onClose: () => void, onSave: (name: string, color: string, icon: string) => void, workspace: Workspace | null, t: (key: string, vars?: any) => string }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(colors[10]);
    const [icon, setIcon] = useState('BriefcaseIcon');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(workspace?.name || '');
            setColor(workspace?.color || colors[10]);
            setIcon(workspace?.icon || 'BriefcaseIcon');
        }
    }, [isOpen, workspace]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        await onSave(name, color, icon);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-pop-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{workspace ? t('workspaces.editWorkspace') : t('workspaces.createNew')}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    <div>
                        <label htmlFor="ws-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('workspaces.nameLabel')}</label>
                        <input id="ws-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t('workspaces.namePlaceholder')} className="mt-1 w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('workspaces.colorLabel')}</label>
                        <div className="mt-2 grid grid-cols-9 gap-2">
                            {colors.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} transition-transform hover:scale-110 flex items-center justify-center`}>{color === c && <CheckIcon className="w-5 h-5 text-white" />}</button>)}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('workspaces.iconLabel')}</label>
                        <div className="mt-2 flex flex-wrap gap-3">
                            {Object.entries(icons).map(([iconName, IconComponent]) => <button key={iconName} type="button" onClick={() => setIcon(iconName)} className={`p-2 rounded-lg transition-colors ${icon === iconName ? 'bg-brand-100 dark:bg-brand-900/50' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}><IconComponent className={`w-6 h-6 ${icon === iconName ? 'text-brand-600' : 'text-neutral-500'}`} /></button>)}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-800 dark:text-white font-semibold transition-colors">{t('workspaces.cancel')}</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors disabled:bg-neutral-400">{loading ? (workspace ? t('workspaces.saving') : t('workspaces.creating')) : t('workspaces.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const WorkspaceCard = ({ workspace, chatCount, onSelect, onEdit, onDelete, onPinToggle, onShare }: { workspace: Workspace, chatCount: number, onSelect: () => void, onEdit: () => void, onDelete: () => void, onPinToggle: () => void, onShare: () => void; }) => {
    const Icon = icons[workspace.icon as keyof typeof icons] || BriefcaseIcon;
    const { t, language } = useLocalization();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (action: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); action(); setMenuOpen(false); };

    return (
        <div className="relative group">
            <button onClick={onSelect} className="w-full h-full text-left rtl:text-right bg-white dark:bg-neutral-800/50 p-5 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 border border-neutral-200 dark:border-neutral-800 transition-all duration-300 flex flex-col">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${workspace.color}`}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 line-clamp-2">{workspace.name}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('workspaces.chats', { count: chatCount })}</p>
                        </div>
                    </div>
                    {workspace.is_pinned && <PinIcon className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700/60 flex-grow">
                    <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('workspaces.summary')}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-3 flex-grow">{workspace.summary || t('workspaces.noSummary')}</p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700/60">{formatTimeSince(workspace.updated_at, language, t)}</p>
            </button>
            <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-2 rounded-full bg-neutral-100/30 dark:bg-neutral-900/40 backdrop-blur-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" title={t('workspaces.moreOptions')}><EllipsisVerticalIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" /></button>
                {menuOpen && (
                    <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 z-10 p-1 animate-pop-in">
                        <button onClick={handleMenuAction(onShare)} className="w-full flex items-center gap-3 px-3 py-2 text-left rtl:text-right text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"><ShareIcon className="w-4 h-4" />{t('share.shareWorkspace')}</button>
                        <button onClick={handleMenuAction(onPinToggle)} className="w-full flex items-center gap-3 px-3 py-2 text-left rtl:text-right text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"><PinIcon className="w-4 h-4" />{workspace.is_pinned ? t('workspaces.unpin') : t('workspaces.pin')}</button>
                        <button onClick={handleMenuAction(onEdit)} className="w-full flex items-center gap-3 px-3 py-2 text-left rtl:text-right text-sm rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"><PencilIcon className="w-4 h-4" />{t('workspaces.editWorkspace')}</button>
                        <button onClick={handleMenuAction(onDelete)} className="w-full flex items-center gap-3 px-3 py-2 text-left rtl:text-right text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"><TrashIcon className="w-4 h-4" />{t('workspaces.deleteWorkspace')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const WorkspaceSkeleton = () => (
    <div className="bg-white dark:bg-neutral-800/50 p-5 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-800 animate-pulse">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-neutral-300 dark:bg-neutral-700"></div>
            <div className="flex-1 space-y-2">
                <div className="h-5 rounded bg-neutral-300 dark:bg-neutral-700 w-3/4"></div>
                <div className="h-4 rounded bg-neutral-300 dark:bg-neutral-700 w-1/4"></div>
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700/60">
            <div className="h-3 rounded bg-neutral-300 dark:bg-neutral-700 w-1/3 mb-3"></div>
            <div className="h-4 rounded bg-neutral-300 dark:bg-neutral-700 w-full mb-2"></div>
            <div className="h-4 rounded bg-neutral-300 dark:bg-neutral-700 w-5/6"></div>
        </div>
    </div>
);

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ workspaces, history, onSelectWorkspace, onCreateWorkspace, onUpdateWorkspace, onDeleteWorkspace, onShareWorkspace }) => {
    const { t } = useLocalization();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
    const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState<{ field: 'updated_at' | 'name'; dir: 'asc' | 'desc' }>({ field: 'updated_at', dir: 'desc' });
    const chatCounts = useMemo(() => {
        const counts = new Map<string, number>();
        history.forEach(item => { if (item.workspace_id) counts.set(item.workspace_id, (counts.get(item.workspace_id) || 0) + 1); });
        return counts;
    }, [history]);
    
    useEffect(() => { if (workspaces) setLoading(false); }, [workspaces]);

    const sortedAndFilteredWorkspaces = useMemo(() => {
        return [...workspaces]
            .filter(ws => ws.name.toLowerCase().includes(searchTerm.toLowerCase()) || ws.summary?.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                if (sort.field === 'name') return sort.dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                return sort.dir === 'asc' ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime() : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            });
    }, [workspaces, searchTerm, sort]);

    const handleCreate = () => { setEditingWorkspace(null); setIsModalOpen(true); }
    const handleEdit = (workspace: Workspace) => { setEditingWorkspace(workspace); setIsModalOpen(true); }
    const handleSave = async (name: string, color: string, icon: string) => { if (editingWorkspace) await onUpdateWorkspace(editingWorkspace.id, { name, color, icon }); else await onCreateWorkspace(name, color, icon); }
    const handlePinToggle = (workspace: Workspace) => onUpdateWorkspace(workspace.id, { is_pinned: !workspace.is_pinned });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-900 pt-16 lg:pt-0 animate-fade-in">
            <WorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} workspace={editingWorkspace} t={t} />
            {deletingWorkspace && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setDeletingWorkspace(null)}>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 transform transition-all animate-pop-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t('workspaces.confirmDeleteTitle')}</h3>
                        <p className="text-neutral-600 dark:text-neutral-300 mt-2">{t('workspaces.confirmDeleteMessage')}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setDeletingWorkspace(null)} className="px-4 py-2 rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-800 dark:text-white font-semibold transition-colors">{t('workspaces.cancel')}</button>
                            <button onClick={async () => { await onDeleteWorkspace(deletingWorkspace.id); setDeletingWorkspace(null); }} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">{t('history.delete')}</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="px-4 md:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{t('workspaces.title')}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">{t('workspaces.subtitle')}</p>
                    </div>
                    <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors shadow-sm">{t('workspaces.createNew')}</button>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder={t('workspaces.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg py-2.5 pl-11 pr-4 rtl:pr-11 rtl:pl-4 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none" />
                    </div>
                    {/* Add sorting dropdown here if needed */}
                </div>
            </header>
            <main className="flex-grow overflow-y-auto p-4 md:p-6">
                {loading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <WorkspaceSkeleton key={i} />)}
                     </div>
                ) : sortedAndFilteredWorkspaces.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-400 p-8">
                        <Squares2X2Icon className="w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-600" />
                        <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">{searchTerm ? t('history.noResults') : t('workspaces.noWorkspaces')}</h2>
                        <p>{searchTerm ? t('history.noResultsSubtitle') : t('workspaces.noWorkspacesSubtitle')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sortedAndFilteredWorkspaces.map(ws => (
                            <WorkspaceCard key={ws.id} workspace={ws} chatCount={chatCounts.get(ws.id) || 0} onSelect={() => onSelectWorkspace(ws)} onEdit={() => handleEdit(ws)} onDelete={() => setDeletingWorkspace(ws)} onPinToggle={() => handlePinToggle(ws)} onShare={() => onShareWorkspace(ws)} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};