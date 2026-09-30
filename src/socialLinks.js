import { getDownloadURL, ref } from "firebase/storage";

export const SOCIAL_LINKS_STORAGE_PATH = "settings/social-links.json";

export const DEFAULT_SOCIAL_LINKS = {
  instagram:
    "https://www.instagram.com/am.sanjayyyy?igsh=MWlvdzZ3MnN3ZDBwaQ%3D%3D&utm_source=qr",
  twitter: "https://twitter.com/sanjayamrnath",
  linkedin: "https://www.linkedin.com/in/sanjay-amarnath-44b74420a",
};

export function validateSocialLinks(links) {
  const validated = {};
  for (const platform of Object.keys(DEFAULT_SOCIAL_LINKS)) {
    const value = links[platform]?.trim();
    if (!value) {
      throw new Error(`Enter a URL for ${platform}.`);
    }

    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`Enter a valid URL for ${platform}.`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`${platform} URL must start with https:// or http://.`);
    }
    validated[platform] = parsed.href;
  }
  return validated;
}

export async function loadSocialLinks(storage) {
  let url;
  try {
    url = await getDownloadURL(ref(storage, SOCIAL_LINKS_STORAGE_PATH));
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      return DEFAULT_SOCIAL_LINKS;
    }
    throw error;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download social links (HTTP ${response.status}).`);
  }
  return validateSocialLinks(await response.json());
}
