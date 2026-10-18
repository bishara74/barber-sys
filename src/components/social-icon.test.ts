import { describe, expect, it } from "vitest";
import type { SocialPlatform } from "@/db/schema";
import { socialHref } from "./social-icon";

const profiles = [
  ["instagram", "https://www.instagram.com/"],
  ["tiktok", "https://www.tiktok.com/@"],
  ["x", "https://x.com/"],
  ["threads", "https://www.threads.net/@"],
  ["snapchat", "https://www.snapchat.com/add/"],
  ["telegram", "https://t.me/"],
  ["youtube", "https://www.youtube.com/@"],
  ["facebook", "https://www.facebook.com/"],
] as const;

const handle = "ghattaskharoufeh";

describe.each(profiles)("socialHref for %s", (platform, profileUrl) => {
  it.each([handle, `@${handle}`])("turns %s into the platform profile URL", (value) => {
    expect(socialHref(platform, value)).toBe(`${profileUrl}${handle}`);
  });

  it.each(["http://example.com/profile", "https://example.com/profile?ref=shop#about"])(
    "preserves the full URL %s",
    (url) => expect(socialHref(platform, url)).toBe(url),
  );

  it("keeps a scheme-less domain as a URL", () => {
    expect(socialHref(platform, "www.example.com")).toBe("https://www.example.com");
  });

  it("trims surrounding whitespace from handles and URLs", () => {
    expect(socialHref(platform, ` \t${handle}\n `)).toBe(`${profileUrl}${handle}`);
    expect(socialHref(platform, ` \t@${handle}\n `)).toBe(`${profileUrl}${handle}`);
    expect(socialHref(platform, " \thttps://example.com/profile\n ")).toBe("https://example.com/profile");
  });
});

describe("socialHref input compatibility", () => {
  it.each([
    ["instagram", "instagram.com/ghattas", "https://instagram.com/ghattas"],
    ["instagram", "example.com", "https://example.com"],
    ["instagram", "some/path", "https://some/path"],
    ["instagram", "two words", "https://two words"],
    ["instagram", "", "https://"],
    ["instagram", "HTTPS://example.com/Profile", "HTTPS://example.com/Profile"],
    ["phone", " +970 59-123-4567 ", "tel:+970591234567"],
    ["phone", "0591234567", "tel:0591234567"],
    ["email", " hello@example.com ", "mailto:hello@example.com"],
    ["email", " mailto:hello@example.com ", "mailto:hello@example.com"],
    ["whatsapp", " +970 59-123-4567 ", "https://wa.me/970591234567"],
    ["whatsapp", "970591234567", "https://wa.me/970591234567"],
    ["whatsapp", " https://wa.me/970591234567 ", "https://wa.me/970591234567"],
    ["maps", " maps.google.com/?q=Bethlehem ", "https://maps.google.com/?q=Bethlehem"],
    ["maps", "https://maps.google.com/?q=Bethlehem", "https://maps.google.com/?q=Bethlehem"],
    ["website", " www.example.com ", "https://www.example.com"],
    ["website", " https://example.com/path ", "https://example.com/path"],
    ["website", "handle", "https://handle"],
  ] satisfies [SocialPlatform, string, string][])("%s preserves %s", (platform, value, expected) => {
    expect(socialHref(platform, value)).toBe(expected);
  });

  it("supports punctuation in handles without treating dotted domains as handles", () => {
    expect(socialHref("instagram", "@first.last")).toBe("https://www.instagram.com/first.last");
    expect(socialHref("instagram", "first.last")).toBe("https://first.last");
    expect(socialHref("youtube", "my-channel_1")).toBe("https://www.youtube.com/@my-channel_1");
  });
});
