import { Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { deleteLink, saveLink, saveProfile } from "@/actions/profile";
import { BilingualFields } from "@/components/admin/bilingual-fields";
import { MoveButtons } from "@/components/admin/move-buttons";
import { PLATFORM_LABELS, SocialIcon } from "@/components/social-icon";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { PageHeader, Section } from "@/components/ui/card";
import { Checkbox, InputField, SelectField } from "@/components/ui/field";
import { ImageInput } from "@/components/ui/image-input";
import { SOCIAL_PLATFORMS, type Link } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { getProfile } from "@/lib/config";
import { getLinks } from "@/lib/links";
import { displayPhone } from "@/lib/phone";
import { mediaUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  await requireOwner();
  const [t, tc, profile, { socials, buttons }] = await Promise.all([
    getTranslations("admin.profile"),
    getTranslations("common"),
    getProfile(),
    getLinks(),
  ]);

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="space-y-5">
        <Section title={t("info")}>
          <ActionForm action={saveProfile}>
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
            <BilingualFields
              name="address"
              label={t("address")}
              maxLength={200}
              defaults={{ en: profile.addressEn, ar: profile.addressAr }}
            />
            <InputField label={t("mapUrl")} name="mapUrl" type="url" dir="ltr" defaultValue={profile.mapUrl} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label={t("phone")} name="phone" type="tel" dir="ltr" defaultValue={displayPhone(profile.phone)} />
              <InputField
                label={t("whatsapp")}
                name="whatsapp"
                type="tel"
                dir="ltr"
                hint={t("whatsappHint")}
                defaultValue={displayPhone(profile.whatsapp)}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <ImageInput
                  name="avatar"
                  label={t("avatar")}
                  currentUrl={profile.avatarKey ? mediaUrl(profile.avatarKey) : undefined}
                  previewClassName="rounded-full"
                />
                {profile.avatarKey ? <Checkbox name="removeAvatar" label={t("removeImage")} /> : null}
              </div>
              <div className="space-y-2">
                <ImageInput
                  name="cover"
                  label={t("cover")}
                  currentUrl={profile.coverKey ? mediaUrl(profile.coverKey) : undefined}
                  previewClassName="aspect-video w-36"
                />
                {profile.coverKey ? <Checkbox name="removeCover" label={t("removeImage")} /> : null}
              </div>
            </div>
            <SubmitButton>{tc("save")}</SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("socials")} description={t("socialsHint")}>
          <ul className="space-y-2">
            {socials.map((link, index) => (
              <LinkRow key={link.id} link={link} isFirst={index === 0} isLast={index === socials.length - 1}>
                <SocialFields link={link} />
              </LinkRow>
            ))}
          </ul>
          <ActionForm action={saveLink} resetOnSuccess className="rounded-theme border border-dashed border-border p-3">
            <SocialFields />
            <SubmitButton variant="secondary" size="sm">
              <Plus className="size-4" aria-hidden />
              {t("addSocial")}
            </SubmitButton>
          </ActionForm>
        </Section>

        <Section title={t("buttons")} description={t("buttonsHint")}>
          <ul className="space-y-2">
            {buttons.map((link, index) => (
              <LinkRow key={link.id} link={link} isFirst={index === 0} isLast={index === buttons.length - 1}>
                <ButtonFields link={link} />
              </LinkRow>
            ))}
          </ul>
          <ActionForm action={saveLink} resetOnSuccess className="rounded-theme border border-dashed border-border p-3">
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
    <li className="flex items-start gap-2 rounded-theme border border-border p-3">
      <ActionForm action={saveLink} className="min-w-0 flex-1">
        <input type="hidden" name="id" value={link.id} />
        {children}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox name="isVisible" label={t("visible")} defaultChecked={link.isVisible} />
          <SubmitButton variant="outline" size="sm">
            {tc("save")}
          </SubmitButton>
        </div>
      </ActionForm>
      <div className="flex flex-col items-center">
        <MoveButtons list="link" id={link.id} isFirst={isFirst} isLast={isLast} />
        <form action={deleteLink}>
          <input type="hidden" name="id" value={link.id} />
          <SubmitButton variant="ghost" size="icon" aria-label={tc("delete")} confirm={tc("confirmDelete")}>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr] sm:items-end">
      <input type="hidden" name="kind" value="social" />
      {link ? null : <input type="hidden" name="isVisible" value="on" />}
      <div className="flex items-end gap-2">
        {link?.platform ? <SocialIcon platform={link.platform} className="mb-2.5 size-5 shrink-0" /> : null}
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
