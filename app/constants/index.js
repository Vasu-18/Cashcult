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
  gmail,
  whatsapp,
  file02,
  Twitter,
  sheets,
  homeSmile,
  instagram,
  notification2,
  notification3,
  notification4,
  plusSquare,
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
  paypal,
  stripe,
  tweet,
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
  "See your cash crisis before it arrives",
  "Catch late payers before they hurt you",
  "Turn invoice data into financial clarity",
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
    title: "Cash Flow Forecasting",
    text: "Predict your cash position for the next 90 days using AI trained on your real invoice history.",
    date: "Phase 1",
    status: "done",
    imageUrl: roadmap1,
    colorful: true,
  },
  {
    id: "1",
    title: "Client Payment Intelligence",
    text: "Automatically detect each client's payment personality and calculate on-time probability scores.",
    date: "Phase 2",
    status: "progress",
    imageUrl: roadmap2,
  },
  {
    id: "2",
    title: "Proactive Crisis Alerts",
    text: "Get warned about cash shortfalls 4-6 weeks before they happen — not the day before payroll.",
    date: "Phase 3",
    status: "done",
    imageUrl: roadmap3,
  },
  {
    id: "3",
    title: "Scenario Simulator",
    text: "Simulate hiring, client delays, or big expenses and see the exact cash impact before committing.",
    date: "Phase 4",
    status: "progress",
    imageUrl: roadmap4,
  },
];


/* =======================
   Collaboration
======================= */

export const collabText =
  "CashCult connects your invoice history, client behavior, and upcoming expenses to give you a complete picture of your financial future.";

export const collabContent = [
  {
    id: "0",
    title: "AI-Powered Cash Forecasting",
    text: "Upload your invoices once and CashCult predicts your cash position for the next 90 days.",
  },
  { id: "1", title: "Client Payment Intelligence" },
  { id: "2", title: "Proactive Crisis Alerts" },
];


/* =======================
   Collaboration Apps
======================= */

export const collabApps = [

  { id: "1", title: "Discord", icon: discord, width: 36, height: 28 },
  { id: "2", title: "Slack", icon: slack, width: 34, height: 35 },
  { id: "3", title: "Whatsapp", icon: whatsapp, width: 34, height: 34 },
  { id: "4", title: "Gmail", icon: gmail, width: 34, height: 34 },
  { id: "5", title: "Stripe", icon: stripe, width: 34, height: 34 },
  { id: "6", title: "Paypal", icon: paypal, width: 34, height: 34 },
  { id: "7", title: "Sheets", icon: sheets, width: 34, height: 34 },
  { id: "8", title: "Twitter", icon: tweet, width: 34, height: 34 },
];


/* =======================
   Benefits
======================= */

export const benefits = [
  {
    id: "0",
    title: "Predict Cash Before Crisis",
    text: "See your cash position weeks in advance — know exactly when money arrives and when bills are due before it's too late.",
    backgroundUrl: benefitCard1,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "1",
    title: "Know Your Clients Better",
    text: "Discover hidden payment patterns and find out exactly who always pays late and who is putting your cash at risk right now.",
    backgroundUrl: benefitCard2,
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "2",
    title: "Works With Your Invoices",
    text: "Upload your past invoice history as a CSV once and CashCast learns your business patterns and starts predicting immediately.",
    backgroundUrl: benefitCard3,
    iconUrl: benefitIcon3,
    imageUrl: benefitImage2,
  },
  {
    id: "3",
    title: "Early Warning Alerts",
    text: "Get warned about cash shortfalls weeks before they happen so you have enough time to act and avoid a crisis completely.",
    backgroundUrl: benefitCard4,
    iconUrl: benefitIcon4,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "4",
    title: "One Health Score",
    text: "Your entire cash situation summarised into a single number — check it every morning and instantly know if your business is safe.",
    backgroundUrl: benefitCard5,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "5",
    title: "Simulate Before You Decide",
    text: "Test the impact of hiring or a client delay against your real data before committing — see the cash impact with zero real-world risk.",
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