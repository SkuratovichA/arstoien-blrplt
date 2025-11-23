import { useTranslation } from 'react-i18next';

export function Loading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{t('Loading...')}</p>
      </div>
    </div>
  );
}
