import { useTranslation } from 'react-i18next';

export function Loading() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">{t('Loading...')}</p>
      </div>
    </div>
  );
}
