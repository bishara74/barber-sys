import { ExternalLink, ImageIcon, MapPin, MousePointerClick, Palette, Plus, Share2, Store, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { deleteLink, saveLink, saveProfile } from "@/actions/profile";
import { BilingualFields } from "@/components/admin/bilingual-fields";
import { DesignForm } from "@/components/admin/design-form";
import { FaviconField } from "@/components/admin/favicon-field";
import { MoveButtons } from "@/components/admin/move-buttons";
import { PLATFORM_LABELS, SocialIcon } from "@/components/social-icon";
import { ActionForm, StickySave, SubmitButton } from "@/components/ui/action-form";
import { buttonClass } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/ui/card";
import { Checkbox, InputField, SelectField, Switch } from "@/components/ui/field";
import { ImageInput } from "@/components/ui/image-input";
import { SOCIAL_PLATFORMS, type Link } from "@/db/schema";
import { localized } from "@/i18n/locales";
import { requireOwner } from "@/lib/auth";
import { brandIconUrl, getDesign, getProfile } from "@/lib/config";
import { getLinks } from "@/lib/links";
import { displayPhone } from "@/lib/phone";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  await requireOwner();
  const [locale, t, tc, td, profile, design, { socials, buttons }] = await Promise.all([
    getLocale(),
    getTranslations("admin.profile"),
    getTranslations("common"),
    getTranslations("admin.design"),
    getProfile(),
    getDesign(),
    getLinks(),
  ]);
  const shopName = localized(locale, profile.nameEn, profile.nameAr);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("pageHint")}
        actions={
          <a href="/" target="_blank" className={buttonClass("outline", "sm")}>
            <ExternalLink className="size-4" aria-hidden />
            {t("openPage")}
          </a>
        }
      />
      <div className="space-y-5">
        <ActionForm action={saveProfile} showMessage={false} className="space-y-5">
          <Section title={t("info")} icon={Store}>
            <BilingualFields name="name" label={t("shopName")} defaults={{ en: profile.nameEn, ar: profile.nameAr }} />
            <BilingualFields
              name="tagline"
              label={t("tagline")}
              maxLength={200}
              defaults={{ en: profile.taglineEn, ar: profile.taglineAr }}
            />
            <BilingualFields
              name="bio"
              label={t("bio")}
              multiline
              maxLength={2000}
              defaults={{ en: profile.bioEn, ar: profile.bioAr }}
            />
          </Section>

          <Section title={t("contact")} icon={MapPin}>
            <BilingualFields
              name="address"
              label={t("address")}
              maxLength={200}
              defaults={{ en: profile.addressEn, ar: profile.addressAr }}
            />
            <InputField label={t("mapUrl")} name="mapUrl" type="url" dir="ltr" defaultValue={profile.mapUrl} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label={t("phone")} name="phone" type="tel" dir="ltr" maxLength={30} defaultValue={displayPhone(profile.phone)} />
              <InputField
                label={t("whatsapp")}
                name="whatsapp"
                type="tel"
                maxLength={30}
                dir="ltr"
                hint={t("whatsappHint")}
                defaultValue={displayPhone(profile.whatsapp)}
              />
            </div>
          </Section>

          <Section title={t("images")} icon={ImageIcon} description={t("imagesHint")}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <ImageInput
                  name="avatar"
                  label={t("avatar")}
                  hint={t("avatarHint")}
                  currentUrl={profile.avatarKey ? mediaUrl(profile.avatarKey) : undefined}
                  previewClassName="rounded-full"
                />
                {profile.avatarKey ? <Checkbox name="removeAvatar" label={t("removeImage")} /> : null}
              </div>
              <FaviconField
                iconUrl={profile.faviconKey ? mediaUrl(profile.faviconKey) : undefined}
                fallbackUrl={profile.avatarKey ? mediaUrl(profile.avatarKey) : brandIconUrl(profile, design)}
                shopName={shopName}
              />
              <div className="space-y-2 md:col-span-2">
                <ImageInput
                  name="cover"
                  label={t("cover")}
                  hint={t("coverHint")}
                  currentUrl={profile.coverKey ? mediaUrl(profile.coverKey) : undefined}
                  previewClassName="aspect-[5/2] w-56"
                />
                {profile.coverKey ? <Checkbox name="removeCover" label={t("removeImage")} /> : null}
              </div>
            </div>
          </Section>

          <StickySave>
            <SubmitButton>{tc("save")}</SubmitButton>
          </StickySave>
        </ActionForm>

        <Section title={td("title")} icon={Palette} description={td("description")}>
          <DesignForm design={design} shopName={shopName} />
        </Section>

        <Section title={t("socials")} icon={Share2} description={t("socialsHint")}>
          <ul className="space-y-3">
            {socials.map((link, index) => (
              <LinkRow key={link.id} link={link} isFirst={index === 0} isLast={index === socials.length - 1}>
                <SocialFields link={link} />
              </LinkRow>
            ))}
          </ul>
          <ActionForm action={saveLink} resetOnSuccess className="rounded-theme border-2 border-dashed border-border p-3 sm:p-4">
            <SocialFields />
            <SubmitButton variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden />
              {t("addSocial")}
            </SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("buttons")} icon={MousePointerClick} description={t("buttonsHint")}>
          <ul className="space-y-3">
            {buttons.map((link, index) => (
              <LinkRow key={link.id} link={link} isFirst={index === 0} isLast={index === buttons.length - 1}>
                <ButtonFields link={link} />
              </LinkRow>
            ))}
          </ul>
          <ActionForm action={saveLink} resetOnSuccess className="rounded-theme border-2 border-dashed border-border p-3 sm:p-4">
            <ButtonFields />
            <SubmitButton variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden />
              {t("addButton")}
            </SubmitButton>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}

type LinkRowProps = { link: Link; isFirst: boolean; isLast: boolean; children: ReactNode };

async function LinkRow({ link, isFirst, isLast, children }: LinkRowProps) {
  const [t, tc] = await Promise.all([getTranslations("admin.profile"), getTranslations("common")]);
  return (
    <li className="flex items-start gap-2 rounded-theme border border-border bg-surface/40 p-3 sm:p-4">
      <ActionForm action={saveLink} className="min-w-0 flex-1">
        <input type="hidden" name="id" value={link.id} />
        {children}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Switch name="isVisible" label={t("visible")} defaultChecked={link.isVisible} inline />
          <SubmitButton variant="outline" size="sm">
            {tc("save")}
          </SubmitButton>
        </div>
      </ActionForm>
      <div className="flex flex-col items-center">
        <MoveButtons list="link" id={link.id} isFirst={isFirst} isLast={isLast} vertical />
        <form action={deleteLink}>
          <input type="hidden" name="id" value={link.id} />
          <SubmitButton variant="danger-ghost" size="icon-sm" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
            <Trash2 className="size-4" />
          </SubmitButton>
        </form>
      </div>
    </li>
  );
}

async function SocialFields({ link }: { link?: Link }) {
  const t = await getTranslations("admin.profile");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[13rem_1fr] sm:items-end">
      <input type="hidden" name="kind" value="social" />
      {link ? null : <input type="hidden" name="isVisible" value="on" />}
      <div className="flex items-end gap-2.5">
        {link?.platform ? (
          <span className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/80 shadow-xs">
            <SocialIcon platform={link.platform} className="size-[18px]" />
          </span>
        ) : null}
        <SelectField
          label={t("platform")}
          name="platform"
          defaultValue={link?.platform ?? "instagram"}
          options={SOCIAL_PLATFORMS.map((platform) => ({ value: platform, label: PLATFORM_LABELS[platform] }))}
          className="flex-1"
        />
      </div>
      <InputField label={t("url")} name="url" required dir="ltr" defaultValue={link?.url} maxLength={500} />
    </div>
  );
}

async function ButtonFields({ link }: { link?: Link }) {
  const t = await getTranslations("admin.profile");
  return (
    <>
      <input type="hidden" name="kind" value="button" />
      {link ? null : <input type="hidden" name="isVisible" value="on" />}
      <BilingualFields name="label" label={t("label")} maxLength={80} defaults={{ en: link?.labelEn, ar: link?.labelAr }} />
      <InputField label={t("linkUrl")} name="url" type="url" required dir="ltr" defaultValue={link?.url} maxLength={500} />
    </>
  );
}
