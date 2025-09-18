import React, { useState } from 'react';
import { ImageSearchResult } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { NewspaperIcon } from './icons';

const ImageCard: React.FC<{ image: ImageSearchResult }> = ({ image }) => {
    const { t } = useLocalization();
    const [imageError, setImageError] = useState(false);

    return (
        <a 
            href={image.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video overflow-hidden rounded-lg shadow-md transition-all duration-300 ease-in-out hover:shadow-xl bg-neutral-200 dark:bg-neutral-800"
            title={image.title}
        >
            {imageError ? (
                 <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                    <NewspaperIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
                </div>
            ) : (
                <img 
                    src={image.imageUrl} 
                    alt={image.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    onError={() => setImageError(true)}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2.5">
                <p className="text-white text-xs font-semibold line-clamp-2 drop-shadow-md">{image.title}</p>
            </div>
        </a>
    );
};

export const ImageGallery: React.FC<{ images: ImageSearchResult[], prompt: string }> = ({ images, prompt }) => {
    const { t } = useLocalization();
    
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="pb-2">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('search.images')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('search.imagesPrompt').replace('{prompt}', prompt)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((image, index) => (
                    <ImageCard key={index} image={image} />
                ))}
            </div>
        </div>
    );
};