import {
  benefitIcon1,
  benefitIcon2,
  benefitIcon3,
  benefitIcon4,
  benefitImage2,
  chromecast,
  disc02,
  discord,
  discordBlack,
  facebook,
  figma,
  file02,
  framer,
  homeSmile,
  instagram,
  notification2,
  notification3,
  notification4,
  notion,
  photoshop,
  plusSquare,
  protopie,
  raindrop,
  recording01,
  recording03,
  roadmap1,
  roadmap2,
  roadmap3,
  roadmap4,
  searchMd,
  slack,
  sliders04,
  telegram,
  twitter,
  yourlogo,
} from "../../assets";

import benefitCard1Img from "@/assets/benefits/card-1.svg";
import benefitCard2Img from "@/assets/benefits/card-2.svg";
import benefitCard3Img from "@/assets/benefits/card-3.svg";
import benefitCard4Img from "@/assets/benefits/card-4.svg";
import benefitCard5Img from "@/assets/benefits/card-5.svg";
import benefitCard6Img from "@/assets/benefits/card-6.svg";

const benefitCard1 = benefitCard1Img.src;
const benefitCard2 = benefitCard2Img.src;
const benefitCard3 = benefitCard3Img.src;
const benefitCard4 = benefitCard4Img.src;
const benefitCard5 = benefitCard5Img.src;
const benefitCard6 = benefitCard6Img.src;

/* =======================
   Navigation
======================= */

export const navigation = [
  { id: "0", title: "Home", url: "/" },
  { id: "1", title: "Dashboard", url: "/dashboard" },
  { id: "2", title: "Rules", url: "/rules" },
  { id: "3", title: "Upload", url: "/upload" },
  { id: "4", title: "Sign In", url: "/sign-in", onlyMobile: true },
];

export const heroIcons = [homeSmile, file02, searchMd, plusSquare];
export const notificationImages = [
  notification4,
  notification3,
  notification2,
];
export const companyLogos = [
  yourlogo,
  yourlogo,
  yourlogo,
  yourlogo,
  yourlogo,
];

/* =======================
   Services
======================= */

export const brainwaveServices = [
  "Workflow cost analysis",
  "CSV-based data insights",
  "Impact-driven prioritization",
];

export const brainwaveServicesIcons = [
  recording03,
  recording01,
  disc02,
  chromecast,
  sliders04,
];

/* =======================
   Roadmap
======================= */

export const roadmap = [
  {
    id: "0",
    title: "Workflow Cost Engine",
    text: "Analyze operational workflows and calculate cost impact using real production data.",
    date: "Phase 1",
    status: "done",
    imageUrl: roadmap1,
    colorful: true,
  },
  {
    id: "1",
    title: "CSV Normalization",
    text: "Support structured CSV uploads across deployments, PRs, tasks, and reviews.",
    date: "Phase 2",
    status: "progress",
    imageUrl: roadmap2,
  },
  {
    id: "2",
    title: "Cost-Based Prioritization",
    text: "Automatically surface the highest cost-impact issues for faster resolution.",
    date: "Phase 3",
    status: "done",
    imageUrl: roadmap3,
  },
  {
    id: "3",
    title: "Insights Dashboard",
    text: "Visualize total cost impact and workflow bottlenecks across teams.",
    date: "Phase 4",
    status: "progress",
    imageUrl: roadmap4,
  },
];

/* =======================
   Collaboration
======================= */

export const collabText =
  "DollarSaver helps engineering teams uncover hidden workflow costs and focus on high-impact fixes.";

export const collabContent = [
  { id: "0", title: "Structured Data Uploads", text: collabText },
  { id: "1", title: "Cost Impact Insights" },
  { id: "2", title: "Team-Level Visibility" },
];

export const collabApps = [
  { id: "0", title: "Figma", icon: figma, width: 26, height: 36 },
  { id: "1", title: "Notion", icon: notion, width: 34, height: 36 },
  { id: "2", title: "Discord", icon: discord, width: 36, height: 28 },
  { id: "3", title: "Slack", icon: slack, width: 34, height: 35 },
  { id: "4", title: "Photoshop", icon: photoshop, width: 34, height: 34 },
  { id: "5", title: "Protopie", icon: protopie, width: 34, height: 34 },
  { id: "6", title: "Framer", icon: framer, width: 26, height: 34 },
  { id: "7", title: "Raindrop", icon: raindrop, width: 38, height: 32 },
];

/* =======================
   Benefits
======================= */

export const benefits = [
  {
    id: "0",
    title: "Identify Costly Bottlenecks",
    text: "Instantly uncover which workflows are costing your team the most.",
    backgroundUrl: benefitCard1,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "1",
    title: "Data-Driven Decisions",
    text: "Make prioritization decisions backed by real operational cost impact.",
    backgroundUrl: benefitCard2,
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "2",
    title: "Works With Your Data",
    text: "Upload CSVs from deployments, pull requests, tasks, and reviews.",
    backgroundUrl: benefitCard3,
    iconUrl: benefitIcon3,
    imageUrl: benefitImage2,
  },
  {
    id: "3",
    title: "Fast Insights",
    text: "Get clear cost summaries and highest-impact issues in seconds.",
    backgroundUrl: benefitCard4,
    iconUrl: benefitIcon4,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "4",
    title: "Team-Level Visibility",
    text: "Understand cost impact across teams and workflows in one place.",
    backgroundUrl: benefitCard5,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "5",
    title: "Actionable Outcomes",
    text: "Focus engineering effort where it saves the most money.",
    backgroundUrl: benefitCard6,
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
  },
];

/* =======================
   Socials
======================= */

export const socials = [
  { id: "0", title: "Discord", iconUrl: discordBlack, url: "#" },
  { id: "1", title: "Twitter", iconUrl: twitter, url: "#" },
  { id: "2", title: "Instagram", iconUrl: instagram, url: "#" },
  { id: "3", title: "Telegram", iconUrl: telegram, url: "#" },
  { id: "4", title: "Facebook", iconUrl: facebook, url: "#" },
];
