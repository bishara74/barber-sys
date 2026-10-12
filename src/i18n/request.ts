import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getDeploymentConfig } from "@/lib/env";
import { isLocale, LOCALE_COOKIE } from "./locales";

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : getDeploymentConfig().defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
