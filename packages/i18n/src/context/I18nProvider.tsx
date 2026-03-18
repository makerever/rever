'use client';

import { ReactNode, useEffect } from 'react';
import { IntlProvider, useLocale } from 'next-intl';

import en from "../locales/en/common.json";
import es from "../locales/es/common.json";
import de from "../locales/de/common.json";
import nl from "../locales/nl/common.json";

const messages = { en, es, de, nl };

function I18nProviderInner({ children }: { children: ReactNode }) {
  const locale = useLocale() as 'en' | 'es' | 'de' | 'nl';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <IntlProvider
      messages={messages[locale]}
      locale={locale}
    >
      {children}
    </IntlProvider>
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nProviderInner>{children}</I18nProviderInner>;
}