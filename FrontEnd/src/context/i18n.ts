import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJSON from '../locales/en.json';
import ptJSON from '../locales/pt.json';

const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enJSON },
            pt: { translation: ptJSON }
        },
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
