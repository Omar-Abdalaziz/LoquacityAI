import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { XIcon, CheckIcon, BoltIcon } from './icons';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlanFeature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        </div>
        <span className="text-neutral-600 dark:text-neutral-300">{children}</span>
    </li>
);

const PricingCard: React.FC<{ 
    plan: 'pro' | 'proPlus', 
    t: (key: string, vars?: any) => string, 
    billingCycle: 'monthly' | 'yearly' 
}> = ({ plan, t, billingCycle }) => {
    const isRecommended = plan === 'proPlus';
    const features = t(`upgradeModal.${plan}.features`).split('|');

    const planData = {
        pro: { monthly: 8, yearly: 80 },
        proPlus: { monthly: 15, yearly: 150 }
    };

    const price = billingCycle === 'yearly' ? planData[plan].yearly : planData[plan].monthly;
    const frequencyKey = billingCycle === 'yearly' ? 'upgradeModal.yearly' : 'upgradeModal.monthly';
    const yearlyPrice = planData[plan].yearly;

    return (
        <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${isRecommended ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 shadow-2xl shadow-brand-500/10' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>
             {isRecommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-semibold tracking-wide text-white bg-gradient-to-r from-brand-600 to-accent-400 rounded-full">
                        {t('upgradeModal.recommended')}
                    </span>
                </div>
            )}
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{t(`upgradeModal.${plan}.title`)}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 flex-grow">{t(`upgradeModal.${plan}.description`)}</p>
            <div className="mt-4">
                <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">${price}</span>
                <span className="text-neutral-500 dark:text-neutral-400"> / {t(frequencyKey)}</span>
                 {billingCycle === 'yearly' && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 h-5">
                        {t('upgradeModal.billedYearly', { price: yearlyPrice })}
                    </p>
                )}
                 {billingCycle === 'monthly' && <div className="h-5 mt-1"></div>}
            </div>
            <ul className="space-y-3 mt-6 flex-grow">
                {features.map((feature, i) => <PlanFeature key={i}>{feature}</PlanFeature>)}
            </ul>
            <button className={`w-full mt-8 py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${isRecommended ? 'bg-brand-600 hover:bg-brand-500 focus:ring-brand-500 text-white' : 'bg-neutral-800 hover:bg-neutral-700 focus:ring-neutral-500 dark:bg-neutral-200 dark:hover:bg-neutral-300 text-white dark:text-neutral-900'}`}>
                {t(`upgradeModal.${plan}.button`)}
            </button>
        </div>
    )
};


export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-4xl transform transition-all animate-pop-in flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/20 rounded-lg">
                            <BoltIcon className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{t('upgradeModal.title')}</h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('upgradeModal.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"> <XIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" /> </button>
                </header>
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 mb-8 animate-fade-in">
                        <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {t('upgradeModal.monthlyLabel')}
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${billingCycle === 'yearly' ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                            role="switch"
                            aria-checked={billingCycle === 'yearly'}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                         <div className={`flex items-center transition-colors ${billingCycle === 'yearly' ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            <span className="font-semibold">{t('upgradeModal.yearlyLabel')}</span>
                            <span className="ml-2 rtl:mr-2 rtl:ml-0 text-xs font-bold text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                               {t('upgradeModal.yearlySave')}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PricingCard plan="pro" t={t} billingCycle={billingCycle} />
                        <PricingCard plan="proPlus" t={t} billingCycle={billingCycle} />
                    </div>
                </div>
            </div>
        </div>
    );
};