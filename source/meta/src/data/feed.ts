import knit1 from "@/assets/northpine-model-1.jpg";
import knit2 from "@/assets/northpine-model-2.jpg";
import knit3 from "@/assets/northpine-model-3.jpg";
import thumb1 from "@/assets/northpine-product-1.jpg";
import thumb2 from "@/assets/northpine-product-2.jpg";
import thumb3 from "@/assets/northpine-product-3.jpg";
/**
 * FLICKS ON META — MEDIA CONFIG (single source of truth).
 * Swap a production Flick slot by changing its flickId.
 * Organic images, videos, avatars and demo copy remain here.
 */
export type Flick = {
  id: string;
  flickId: string;
  aspect: "1/1" | "9/16";
  brand: string;
  logo?: string;
  displayName?: string;
  location?: string;
  landingUrl?: string;
  landingSheet?: { address: string; copy: string; button: string };
  embeddable?: boolean;
  embedCheck?: string;
  mock?: boolean;
  mockVariants?: { image: string; thumbnail: string }[];
  shareOffset?: string;
  railBottom?: string;
  captionBottom?: string;
  headerTop?: string;
  ctaBottom?: string;
  productName?: string;
  tagTop?: string;
  thumbnail?: string;
  skuByDiff?: Record<string, { label: string; price?: string }>;
  linkDomain?: string;
  linkHeadline?: string;
  cta: string;
  caption: string;
  likes: number;
  comments: number;
};
const M = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
const U = (id: string, w = 1080) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const AV = (n: number) => `https://i.pravatar.cc/150?img=${n}`;
export const ME = { name: "Alex Morgan", avatar: AV(12) };

/* ---------------- The eight production Flicks ---------------- */
export const STORY_AD: Flick = {
  id: "story-zara", flickId: "typxqe", aspect: "9/16", brand: "zara", displayName: "Zara", logo: "/logos/zara.webp",
  landingUrl: "https://www.zara.com/us/", embeddable: false, embedCheck: "HTTP 403", cta: "Shop now", caption: "A moment with Zara.",
  likes: 0, comments: 0, 
};

export const FEED_AD: Flick = {
  id: "feed-cayman", flickId: "cayman", aspect: "1/1", brand: "cayman", displayName: "Cayman Islands", logo: "/logos/cayman.webp",
  landingUrl: "https://www.visitcaymanislands.com/", embeddable: false, embedCheck: "HTTP 403; embedding unverified", linkDomain: "visitcaymanislands.com", linkHeadline: "Cayman Islands",
  cta: "Book Now", caption: "A moment in the Cayman Islands.", likes: 18422, comments: 312,
};

export const CREATOR_AD: Flick & { creator: string; creatorAvatar: string } = {
  id: "creator-newera", flickId: "gwhttp", aspect: "1/1", brand: "neweracap", displayName: "New Era Cap", logo: "/logos/neweracap.webp",
  creator: "Jess Carter", creatorAvatar: AV(47),
  landingUrl: "https://www.neweracap.com/collections/mlb-headwear", embeddable: false, embedCheck: "HTTP 200; X-Frame-Options", linkDomain: "neweracap.com", linkHeadline: "MLB Headwear",
  cta: "Shop now", caption: "From New Era Cap.", likes: 42910, comments: 1204,
};

export const SHOPPING_AD: Flick & { productName: string; skuByDiff: Record<string, { label: string; price?: string }> } = {
  id: "shopping-ua", flickId: "vq0vp6", aspect: "1/1", brand: "underarmour", displayName: "Under Armour", logo: "/logos/underarmour.webp",
  landingUrl: "https://www.underarmour.com/en-us/p/heatgear_elite_womens_crop_mock_short_sleeve/6014710.html?dwvar_6014710_color=008", embeddable: true, embedCheck: "HTTP 200",
  linkDomain: "underarmour.com",
  cta: "Shop now", caption: "In focus: Under Armour.", likes: 9876, comments: 188,
  productName: "HeatGear Elite Crop Mock", tagTop: "20%",
  skuByDiff: { "0": { label: "HeatGear Elite Crop Mock", price: "$35.00" }, "1": { label: "HeatGear Elite Crop Mock", price: "$38.00" }, "2": { label: "HeatGear Elite Crop Mock", price: "$40.00" } },
};

export const PAGE_AD: Flick = {
  id: "page-rogers", flickId: "s87ukl", aspect: "1/1", brand: "rogersfc",
  displayName: "Rogers Football Club", logo: "/logos/rogersfc.webp", location: "Rogers FC Training Center",
  landingSheet: { address: "rogersfc.com", copy: "Train with the first team. Open sessions every Saturday.", button: "Book a session" },
  linkDomain: "rogersfc.com", linkHeadline: "Train with the first team",
  cta: "Learn more", caption: "Around the club with Rogers FC.", likes: 3204, comments: 57,
};

export const REELS_AD: Flick = {
  id: "reels-gucci", flickId: "sfb39l", aspect: "9/16", brand: "gucci", displayName: "Gucci", logo: "/logos/gucci.webp",
  landingUrl: "https://www.gucci.com/us/en/ca/women/ready-to-wear-for-women/dresses-and-jumpsuits-for-women-c-women-readytowear-dresses", embeddable: false, embedCheck: "Header check timed out; embedding unverified",
  cta: "Shop now", caption: "A look at Gucci.", likes: 128400, comments: 2301,
};

export const REELS_AD_2: Flick = {
  id: "reels-ram", flickId: "cx5dwz", aspect: "9/16", brand: "ramtrucks", displayName: "Ram Trucks", logo: "/logos/ramtrucks.webp",
  landingUrl: "https://www.ramtrucks.com/", embeddable: false, embedCheck: "HTTP 403",
  cta: "Explore", caption: "Discover Ram Trucks.", likes: 28400, comments: 309,
};

export const MARKETPLACE_AD: Flick & { productName: string; skuByDiff: Record<string, { label: string; price?: string }> } = {
  id: "marketplace-ulta", flickId: "tzed9x", aspect: "1/1", brand: "ultabeauty", displayName: "Ulta Beauty", logo: "/logos/ultabeauty.webp",
  landingUrl: "https://www.ulta.com/p/macximal-silky-matte-lipstick-pimprod2043558?sku=2644466", embeddable: true, embedCheck: "HTTP 200",
  cta: "Shop now", caption: "From Ulta Beauty.", likes: 6421, comments: 94,
  productName: "MACximal Silky Matte Lipstick",
  thumbnail: "/flick-thumbs/tzed9x.jpg",
  skuByDiff: { "0": { label: "MACximal Silky Matte Lipstick", price: "$25.00" }, "1": { label: "MACximal Silky Matte Lipstick", price: "$27.00" }, "2": { label: "MACximal Silky Matte Lipstick", price: "$29.00" } },
};

// Invented demo prices, not live storefront prices. No variant names are inferred.
export const COACH_AD = {
  id: "shopping-coach", flickId: "d81eio", aspect: "1/1", brand: "coach", displayName: "Coach", logo: "/logos/coach.webp",
  productName: "Tabby Shoulder Bag 26", thumbnail: "/flick-thumbs/d81eio.jpg", tagTop: "20%",
  landingUrl: "https://www.coach.com/products/tabby-shoulder-bag-26/CCX04-B4POP.html", embeddable: false, embedCheck: "HTTP 403; X-Frame-Options", linkDomain: "coach.com",
  cta: "Shop now", caption: "Coach, in the spotlight.", likes: 4821, comments: 83,
  skuByDiff: { "0": { label: "Tabby Shoulder Bag 26", price: "$450.00" }, "1": { label: "Tabby Shoulder Bag 26", price: "$475.00" }, "2": { label: "Tabby Shoulder Bag 26", price: "$495.00" } },
} satisfies Flick;
export const SAMSUNG_AD = {
  id: "shopping-samsung", flickId: "yux3w1", aspect: "1/1", brand: "samsung", displayName: "Samsung", logo: "/logos/samsung.webp",
  productName: "Galaxy S26 512GB Unlocked", thumbnail: "/flick-thumbs/yux3w1.jpg", tagTop: "20%",
  landingUrl: "https://www.samsung.com/us/smartphones/galaxy-s26/buy/galaxy-s26-512gb-unlocked-sku-sm-s942uzdfxaa/", embeddable: true, embedCheck: "HTTP 200", linkDomain: "samsung.com",
  cta: "Shop now", caption: "A closer look at Samsung.", likes: 8120, comments: 144,
  skuByDiff: { "0": { label: "Galaxy S26 512GB Unlocked", price: "$999.99" }, "1": { label: "Galaxy S26 512GB Unlocked", price: "$1,099.99" }, "2": { label: "Galaxy S26 512GB Unlocked", price: "$1,199.99" } },
} satisfies Flick;
export const AVEENO_AD = {
  id: "marketplace-aveeno", flickId: "um792g", aspect: "1/1", brand: "aveeno", displayName: "Aveeno", logo: "/logos/aveeno.webp",
  productName: "Aveeno", thumbnail: "/flick-thumbs/um792g.jpg", landingUrl: "https://www.aveeno.com/", embeddable: false, embedCheck: "HTTP 403",
  cta: "Shop now", caption: "A moment for Aveeno.", likes: 2240, comments: 42,
  skuByDiff: { "0": { label: "Aveeno", price: "$12.99" }, "1": { label: "Aveeno", price: "$14.99" }, "2": { label: "Aveeno", price: "$16.99" } },
} satisfies Flick;
export const GENERAL_MILLS_AD: Flick = {
  id: "feed-generalmills", flickId: "ccheju", aspect: "1/1", brand: "generalmills", displayName: "General Mills", logo: "/logos/generalmills.webp",
  landingUrl: "https://www.generalmills.com/our-food/where-to-buy", embeddable: false, embedCheck: "HTTP 200; CSP frame-ancestors", linkDomain: "generalmills.com", linkHeadline: "Find it near you",
  cta: "Learn more", caption: "From the General Mills family.", likes: 3140, comments: 61,
};
export const MARKETPLACE_FLICKS = [COACH_AD, SAMSUNG_AD, AVEENO_AD, MARKETPLACE_AD];

/* ---------------- Stories row ---------------- */
export type Story = { username: string; avatar: string; monogram?: string; sponsored?: boolean; image?: string; flick?: Flick };
export const STORIES: Story[] = [
  { username: "Zara", avatar: "", monogram: "Zara", image: "/flick-thumbs/story-typxqe.jpg", sponsored: true, flick: STORY_AD },
  { username: "Gucci", avatar: "", monogram: "Gucci", image: "/flick-thumbs/story-sfb39l.jpg", sponsored: true, flick: REELS_AD },
  { username: "Ram Trucks", avatar: "", monogram: "Ram Trucks", image: "/flick-thumbs/story-cx5dwz.jpg", sponsored: true, flick: REELS_AD_2 },
  { username: "Sam Wilde", avatar: AV(33), image: U("photo-1506744038136-46273834b3fb") },
];

/* ---------------- Home feed ---------------- */
export type Organic = {
  kind: "photo" | "video";
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  location?: string;
  media: string[]; // photo: one or more image URLs (carousel). video: [videoUrl, poster]
  aspect?: "1/1" | "4/5";
  caption: string;
  likes: number;
  comments: number;
  time: string;
};
export type FeedItem =
  | Organic
  | { kind: "ad-feed"; id: string; flick: Flick }
  | { kind: "ad-creator"; id: string; flick: typeof CREATOR_AD }
   | { kind: "ad-shopping"; id: string; flick: Flick }
  | { kind: "ad-page"; id: string; flick: Flick };

const BASE_FEED: FeedItem[] = [
  { kind: "photo", id: "p1", name: "Dan Miller", avatar: AV(53), location: "Malibu, California",
    media: [U("photo-1533105079780-92b9be482077"), U("photo-1507525428034-b723cf961d3e")], aspect: "4/5",
    caption: "Couldn't have asked for a better beach weekend ☀️ already planning the next road trip", likes: 482, comments: 37, time: "2 hrs" },
  { kind: "ad-feed", id: "a1", flick: FEED_AD },
  { kind: "video", id: "p2", name: "The Daily Grind", avatar: U("photo-1554118811-1e0d58224f24", 150), location: "Brooklyn, New York",
    media: [M(1737), U("photo-1554118811-1e0d58224f24")], aspect: "4/5",
    caption: "Brunch is served 🥞 new seasonal menu drops this weekend", likes: 2310, comments: 96, time: "4 hrs" },
  { kind: "video", id: "p6", name: "Biscuit the Corgi", avatar: U("photo-1543466835-00a7907e9de1", 150),
    media: [M(1476), U("photo-1543466835-00a7907e9de1")], aspect: "4/5",
    caption: "Zoomies at 7am are a lifestyle 🐶💨", likes: 30244, comments: 640, time: "8 hrs" },
  { kind: "ad-creator", id: "a2", flick: CREATOR_AD },
  { kind: "photo", id: "p4", name: "Leo Torres", avatar: AV(59), location: "Iron Temple Gym · Austin, Texas",
    media: [U("photo-1534438327276-14e5300c3a48")], aspect: "4/5",
    caption: "Leg day doesn't skip itself 🦵 6am crew where you at", likes: 1022, comments: 58, time: "6 hrs" },
  { kind: "photo", id: "p5", name: "Daily Memes HQ", avatar: AV(68), verified: true,
    media: [U("photo-1517694712202-14dd9538aa97")], aspect: "1/1",
    caption: "Me pretending to understand the code I wrote yesterday 😭", likes: 88213, comments: 1932, time: "7 hrs" },
  { kind: "ad-shopping", id: "a3", flick: SHOPPING_AD },
  { kind: "photo", id: "p8", name: "Priya Kapoor", avatar: AV(45),
    media: [U("photo-1494790108377-be9c29b29330"), U("photo-1438761681033-6461ffad8d80"), U("photo-1534528741775-53994a69daeb")], aspect: "4/5",
    caption: "Photo dump from the weekend 📸", likes: 356, comments: 22, time: "10 hrs" },
  { kind: "photo", id: "p3", name: "Kicks Dept", avatar: U("photo-1549298916-b41d501d3772", 150), verified: true,
    media: [U("photo-1549298916-b41d501d3772"), U("photo-1542291026-7eec264c27ff"), U("photo-1460353581641-37baddab0fa2")], aspect: "1/1",
    caption: "The Retro Runner collection. Available Friday 10AM.", likes: 15204, comments: 421, time: "5 hrs" },
  { kind: "ad-page", id: "a4", flick: PAGE_AD },
  { kind: "photo", id: "p9", name: "Sam Wilde", avatar: AV(33), location: "Yosemite National Park",
    media: [U("photo-1506744038136-46273834b3fb")], aspect: "4/5",
    caption: "Weekend road trip to Yosemite 🏔️", likes: 1290, comments: 41, time: "12 hrs" },
  { kind: "video", id: "p11", name: "Car Club Daily", avatar: AV(14),
    media: [M(34562), U("photo-1494976388531-d1058494cdd8")], aspect: "4/5",
    caption: "Sunday drives hit different", likes: 5402, comments: 120, time: "16 hrs" },
];

const organicPosts = BASE_FEED.filter((post): post is Organic => post.kind === "photo" || post.kind === "video");
const extraOrganic: Organic[] = organicPosts.slice(0, 6).map((post, i) => ({
  ...post, id: `extra-${i}`, name: ["Taylor Brooks", "Jordan Reed", "Casey Evans", "Morgan Davis", "Riley Parker", "Jamie Wilson"][i] ?? "Alex Morgan",
  location: ["Santa Monica, CA", "Portland, OR", "Denver, CO", "Austin, TX", "Seattle, WA", "San Francisco, CA"][i] ?? "Austin, TX",
  caption: ["A little time outside was exactly what I needed.", "Saturday mornings with good coffee and good company.", "The best part of getting home 🐶", "Back at it with the morning crew.", "Weekend plans: a little of everything.", "A few favorites from this week 📸"][i] ?? "Weekend favorites.",
}));
const homeOrganics = [...organicPosts, ...extraOrganic];
const homeAds: FeedItem[] = [
  { kind: "ad-feed", id: FEED_AD.id, flick: FEED_AD },
  { kind: "ad-shopping", id: SAMSUNG_AD.id, flick: SAMSUNG_AD },
  { kind: "ad-creator", id: CREATOR_AD.id, flick: CREATOR_AD },
  { kind: "ad-shopping", id: SHOPPING_AD.id, flick: SHOPPING_AD },
  { kind: "ad-feed", id: GENERAL_MILLS_AD.id, flick: GENERAL_MILLS_AD },
  { kind: "ad-shopping", id: COACH_AD.id, flick: COACH_AD },
  { kind: "ad-page", id: PAGE_AD.id, flick: PAGE_AD },
];
export const FEED: FeedItem[] = homeAds.flatMap((ad, i) => [ad, ...homeOrganics.slice(i, i + 1)]);

/* ---------------- Video tab (Reels-style) ---------------- */
export type Reel =
  | { kind: "organic"; id: string; username: string; avatar: string; videoUrl: string; caption: string; likes: number; comments: number; audio: string }
  | { kind: "ad"; id: string; flick: Flick };
export const REELS: Reel[] = [
  { kind: "ad", id: "r3", flick: REELS_AD },
  { kind: "ad", id: "r6", flick: REELS_AD_2 },
  { kind: "ad", id: "r-zara", flick: STORY_AD },
  { kind: "organic", id: "r1", username: "wanderlust.films", avatar: AV(5), videoUrl: M(15169), caption: "This place is unreal 🌊", likes: 210400, comments: 1840, audio: "Original audio" },
];

/* ---------------- Marketplace ---------------- */
export type Listing = { id: string; title: string; price: string; location: string; image: string };
export const LISTINGS: Listing[] = [
  { id: "l1", title: "Mountain bike, like new", price: "$250.00", location: "Austin, TX", image: U("photo-1485965120184-e220f721d03e", 600) },
  { id: "l2", title: "Leather sofa", price: "$180.00", location: "Brooklyn, NY", image: U("photo-1555041469-a586c61ea9bc", 600) },
  { id: "l3", title: "Wireless headphones", price: "$85.00", location: "Seattle, WA", image: U("photo-1505740420928-5e560c06d30e", 600) },
  { id: "l4", title: "Acoustic guitar", price: "$140.00", location: "Nashville, TN", image: U("photo-1510915361894-db8b60106cb1", 600) },
  { id: "l5", title: "Desk lamp", price: "$35.00", location: "Chicago, IL", image: U("photo-1507473885765-e6ed057f782c", 600) },
  { id: "l6", title: "Film camera", price: "$120.00", location: "Portland, OR", image: U("photo-1526170375885-4d8ecf77b99f", 600) },
  { id: "l7", title: "Running shoes, size 10", price: "$55.00", location: "San Diego, CA", image: U("photo-1542291026-7eec264c27ff", 600) },
  { id: "l8", title: "Smartwatch, Series 8", price: "$210.00", location: "Denver, CO", image: U("photo-1523275335684-37898b6baf30", 600) },
];
export type MarketplaceItem = { kind: "organic"; listing: Listing } | { kind: "flick"; flick: Flick };
export const NORTHPINE_AD: Flick = {
  id: "mock-northpine", flickId: "mock-northpine", mock: true, aspect: "1/1", brand: "northpine", displayName: "Northpine Knitwear",
  productName: "Holiday Crew Sweater", thumbnail: knit1, caption: "The holidays, with Northpine.", cta: "Shop now", likes: 0, comments: 0,
  landingSheet: { address: "northpine.example", copy: "Holiday Crew Sweater — a fictional collection for this demo.", button: "Save for later" },
  mockVariants: [{ image: knit1, thumbnail: thumb1 }, { image: knit2, thumbnail: thumb2 }, { image: knit3, thumbnail: thumb3 }],
  skuByDiff: { "0": { label: "Holiday Crew Sweater", price: "$58.00" }, "1": { label: "Holiday Crew Sweater", price: "$62.00" }, "2": { label: "Holiday Crew Sweater", price: "$64.00" } },
};
export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  ...MARKETPLACE_FLICKS.map(flick => ({ kind: "flick" as const, flick })),
  { kind: "flick", flick: NORTHPINE_AD },
  ...LISTINGS.slice(0, 1).map(listing => ({ kind: "organic" as const, listing })),
];

/* ---------------- Messenger ---------------- */
export type Chat = { id: string; name: string; avatar: string; monogram?: string; preview: string; time: string; sponsored?: boolean; unread?: boolean; flick?: Flick; shared?: boolean };
export const CHATS: Chat[] = [
  { id: "c2", name: "Cayman Islands", avatar: "", monogram: "C", preview: "Sponsored · A moment in the Cayman Islands.", time: "9:15 AM", sponsored: true, flick: FEED_AD },
  { id: "c-samsung", name: "Samsung", avatar: "", monogram: "Samsung", preview: "Sponsored · A closer look at Samsung.", time: "Yesterday", sponsored: true, flick: SAMSUNG_AD },
  { id: "c-coach", name: "Coach", avatar: "", monogram: "Coach", preview: "Sponsored · Coach, in the spotlight.", time: "Tuesday", sponsored: true, flick: COACH_AD },
  { id: "c4", name: "Dan Miller", avatar: AV(53), preview: "Thought you’d like this New Era post", time: "Yesterday", shared: true, flick: CREATOR_AD },
  { id: "c1", name: "Sam Wilde", avatar: AV(33), preview: "You: see you Saturday!", time: "10:42 AM" },
  { id: "c3", name: "Priya Kapoor", avatar: AV(45), preview: "That place in Brooklyn was so good", time: "Yesterday" },
  { id: "c5", name: "Mia Chen", avatar: AV(44), preview: "Happy birthday!! 🎂", time: "Tuesday" },
  { id: "c6", name: "Leo Torres", avatar: AV(59), preview: "Leg day tomorrow?", time: "Monday" },
];

export const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  : n >= 10_000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  : n.toLocaleString("en-US");

/* Placement index is derived from the same creative objects and feed order. */
export type FlickPlacement = { key: string; section: "HOME" | "VIDEO" | "MARKETPLACE" | "MESSENGER"; name: string; flick: Flick; surface: "story" | "feed" | "reel" | "listing" | "message" };
export const FLICK_PLACEMENTS: FlickPlacement[] = [
  ...STORIES.flatMap((story): FlickPlacement[] => story.flick ? [{ key: `story-${story.flick.brand}`, section: "HOME", name: "Sponsored story", flick: story.flick, surface: "story" }] : []),
  ...FEED.flatMap((item): FlickPlacement[] => "flick" in item ? [{ key: item.flick.id, section: "HOME", name: item.kind === "ad-shopping" ? "Shop ad with price tag" : item.kind === "ad-creator" ? "Paid partnership post" : item.kind === "ad-page" ? "Local page promotion" : item.flick === GENERAL_MILLS_AD ? "Brand ad" : "Sponsored feed post", flick: item.flick, surface: "feed" }] : []),
  ...REELS.flatMap((item): FlickPlacement[] => item.kind === "ad" ? [{ key: item.flick.id, section: "VIDEO", name: "Sponsored reel", flick: item.flick, surface: "reel" }] : []),
  ...MARKETPLACE_FLICKS.map((flick): FlickPlacement => ({ key: `listing-${flick.id}`, section: "MARKETPLACE", name: "Sponsored listing", flick, surface: "listing" })),
  ...CHATS.flatMap((chat): FlickPlacement[] => chat.flick ? [{ key: `message-${chat.id}`, section: "MESSENGER", name: chat.shared ? "Shared post" : "Sponsored message", flick: chat.flick, surface: "message" }] : []),
];

export const FLICK_SECTIONS = (["HOME", "VIDEO", "MARKETPLACE", "MESSENGER"] as const).map(section => ({ section, label: "Flicks for " + (section === "VIDEO" ? "Reels" : section.charAt(0) + section.slice(1).toLowerCase()), count: FLICK_PLACEMENTS.filter(p => p.section === section && !p.flick.mock).length }));
