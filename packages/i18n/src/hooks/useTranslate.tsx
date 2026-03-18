import { useTranslations } from "next-intl";

const useTranslate = () => {
  const translate = useTranslations();
  return translate;
};

export default useTranslate;