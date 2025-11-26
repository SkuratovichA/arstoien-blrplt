import { useTranslation } from 'react-i18next';
import { env } from '@lib/env';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright', { year: currentYear, appName: env.appName })}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              {t('footer.privacy')}
            </a>
            <a href="#" className="hover:text-foreground">
              {t('footer.terms')}
            </a>
            <a href="#" className="hover:text-foreground">
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
