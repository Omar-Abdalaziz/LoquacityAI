import React from 'react';

export const ImageGallerySkeleton: React.FC = () => {
    return (
        <div className="space-y-4 animate-pulse">
             <div className="pb-2">
                <div className="h-5 bg-neutral-300 dark:bg-neutral-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div 
                        key={index} 
                        className="aspect-video w-full overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
                    />
                ))}
            </div>
        </div>
    );
};