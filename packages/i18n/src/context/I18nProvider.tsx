'use client';

import { ReactNode, useEffect } from 'react';
import { IntlProvider } from 'next-intl';
import en from "../locales/en/common.json";
import es from "../locales/es/common.json";
import { useUserStore } from "@rever/stores";

type Locale = 'en' | 'es';

//available translation messages by locale
const messages = { en, es };

export function I18nProvider({ children }: { children: ReactNode }) {
  // Retrieve the user object from the Zustand store
  // const user = useUserStore(state => state.user);

  // If the user has a saved locale, use it; otherwise, default to English
  const getInitialLocale = (): Locale => {
    // const lang = user?.locale as Locale | undefined;
    const lang = "es";
    return lang ?? "en";
  };

  //Changing browser language on changing the user language
  useEffect(() => {
    document.documentElement.lang = getInitialLocale();
  }, [getInitialLocale]);

  // Wrap all child components with the IntlProvider
  return (
    <IntlProvider
      messages={messages[getInitialLocale()]}
      locale={getInitialLocale()}
    >
      {children}
    </IntlProvider>
  );
}
