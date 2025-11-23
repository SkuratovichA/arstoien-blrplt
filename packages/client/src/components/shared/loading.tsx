import { useTranslation } from 'react-i18next';

export function Loading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="sr-only">{t('loading')}</span>
        </div>
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  );
}
