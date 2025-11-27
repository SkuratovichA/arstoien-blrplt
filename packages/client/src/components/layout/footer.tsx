import { useTranslation } from 'react-i18next';
import { env } from '@lib/env';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-sm">
            {t('© {{year}} {{appName}}. All rights reserved.', {
              year: currentYear,
              appName: env.appName,
            })}
          </p>
          <div className="text-muted-foreground flex gap-6 text-sm">
            <a href="#" className="hover:text-foreground">
              {t('Privacy')}
            </a>
            <a href="#" className="hover:text-foreground">
              {t('Terms')}
            </a>
            <a href="#" className="hover:text-foreground">
              {t('Contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
