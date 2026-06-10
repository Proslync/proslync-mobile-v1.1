import * as mockRegistry from "../mock-registry";
import { brandAssetId, resolveAsset } from "./visual-assets";

export interface BrandItem {
  id: string;
  name: string;
  handle: string;
  category: string;
  initials: string;
  color: string;
  /** Pre-formatted, e.g. "412k" */
  followers: string;
  /** Resolved visual-assets id. Required so app-facing rows always have logos. */
  logoAssetId: string;
}

function requireLogo(brandId: string): string {
  const assetId = brandAssetId(brandId);
  if (!resolveAsset(assetId)) {
    throw new Error(`BRAND_CATALOG row ${brandId} is missing visual asset ${assetId}`);
  }
  return assetId;
}

export const BRAND_CATALOG: BrandItem[] = [
  { id: "br-nike", name: "Nike", handle: "@nike", category: "Athleticwear", initials: "N", color: "#000000", followers: "12.4M", logoAssetId: requireLogo("br-nike") },
  { id: "br-gatorade", name: "Gatorade", handle: "@gatorade", category: "Hydration", initials: "G", color: "#FF6900", followers: "4.1M", logoAssetId: requireLogo("br-gatorade") },
  { id: "br-adidas", name: "Adidas", handle: "@adidas", category: "Athleticwear", initials: "A", color: "#000000", followers: "11.2M", logoAssetId: requireLogo("br-adidas") },
  { id: "br-puma", name: "Nike Hoops", handle: "@pumahoops", category: "Basketball", initials: "P", color: "#000000", followers: "2.4M", logoAssetId: requireLogo("br-puma") },
  { id: "br-spotify", name: "Spotify", handle: "@spotify", category: "Music / creator", initials: "S", color: "#1DB954", followers: "8.6M", logoAssetId: requireLogo("br-spotify") },
  { id: "br-atandt", name: "AT&T", handle: "@att", category: "Tech / telecom", initials: "A", color: "#00A8E0", followers: "3.7M", logoAssetId: requireLogo("br-atandt") },
  { id: "br-underarmour", name: "Under Armour", handle: "@underarmour", category: "Athleticwear", initials: "UA", color: "#000000", followers: "5.9M", logoAssetId: requireLogo("br-underarmour") },
  { id: "br-beats", name: "Beats by Dre", handle: "@beatsbydre", category: "Audio", initials: "B", color: "#E03D24", followers: "3.4M", logoAssetId: requireLogo("br-beats") },
  { id: "br-jordan", name: "Jordan Brand", handle: "@jumpman23", category: "Basketball", initials: "J", color: "#111111", followers: "27.2M", logoAssetId: requireLogo("br-jordan") },
  { id: "br-newbalance", name: "New Balance", handle: "@newbalance", category: "Athleticwear", initials: "NB", color: "#CE0E2D", followers: "7.1M", logoAssetId: requireLogo("br-newbalance") },
  { id: "br-bodyarmor", name: "BODYARMOR", handle: "@drinkbodyarmor", category: "Hydration", initials: "BA", color: "#D71920", followers: "1.3M", logoAssetId: requireLogo("br-bodyarmor") },
  { id: "br-verizon", name: "Verizon", handle: "@verizon", category: "Tech / telecom", initials: "V", color: "#CD040B", followers: "1.8M", logoAssetId: requireLogo("br-verizon") },
  { id: "br-ea", name: "EA Sports", handle: "@easports", category: "Gaming", initials: "EA", color: "#111111", followers: "5.1M", logoAssetId: requireLogo("br-ea") },
];

mockRegistry.register({
  id: "brand-catalog",
  description: "Logo-backed NIL brand directory used by the search screen",
  load: () => BRAND_CATALOG,
});
