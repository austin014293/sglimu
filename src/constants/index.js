import {
  blackImg,
  blueImg,
  highlightFirstVideo,
  highlightFourthVideo,
  highlightSecondVideo,
  highlightThirdVideo,
  whiteImg,
  yellowImg,
} from "../utils";

export const navLists = ["Safety", "Systems", "Technology", "Support"];

export const hightlightsSlides = [
  {
    id: 1,
    textLists: [
      "Smart Entry Assist.",
      "Detects tunnels ahead.",
      "Proactive safety response.",
    ],
    video: highlightFirstVideo,
    videoDuration: 4,
  },
  {
    id: 2,
    textLists: ["Auto Light Control.", "Headlights and tail lights active before entry."],
    video: highlightSecondVideo,
    videoDuration: 5,
  },
  {
    id: 3,
    textLists: [
      "Rear-collision Prevention.",
      "Secures visibility for",
      "approaching drivers early.",
    ],
    video: highlightThirdVideo,
    videoDuration: 2,
  },
  {
    id: 4,
    textLists: ["Safety-First Algorithm.", "Every tunnel, secured."],
    video: highlightFourthVideo,
    videoDuration: 3.63,
  },
];

export const models = [
  {
    id: 1,
    title: "Standard SUV with Safety Assist",
    color: ["#8F8A81", "#ffe7b9", "#6f6c64"],
    img: yellowImg,
  },
  {
    id: 2,
    title: "Eco Sedan with Safety Assist",
    color: ["#53596E", "#6395ff", "#21242e"],
    img: blueImg,
  },
  {
    id: 3,
    title: "Luxury GT with Safety Assist",
    color: ["#C9C8C2", "#ffffff", "#C9C8C2"],
    img: whiteImg,
  },
  {
    id: 4,
    title: "Compact Pro with Safety Assist",
    color: ["#454749", "#3b3b3b", "#181819"],
    img: blackImg,
  },
];

export const sizes = [
  { label: 'Standard', value: "small" },
  { label: 'Premium', value: "large" },
];

export const footerLinks = [
  "Safety Standards",
  "System Updates",
  "Emergency Support",
  "Legal",
  "Contact Us",
];