import { env } from '@lib/env';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-sm">
            {t('footer.copyright', {
              year: currentYear,
              appName: env.appName,
            })}
          </p>
          <div className="text-muted-foreground flex gap-6 text-sm">
            <a href="/privacy" className="hover:text-foreground">
              {t('footer.privacy')}
            </a>
            <a href="/terms" className="hover:text-foreground">
              {t('footer.terms')}
            </a>
            <a href="/contact" className="hover:text-foreground">
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
