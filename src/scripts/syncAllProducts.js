const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");

const ALL_PRODUCTS = [
  {
    name: "Digital Business Blueprint",
    slug: "digital-business-blueprint",
    sku: "ELV-EBO-101",
    category: "ebooks-guides",
    categoryName: "Ebooks & Guides",
    tagline: "Build a high-margin digital enterprise from scratch.",
    shortDescription: "The definitive guide to ideating, validating, building, and monetizing scalable digital products in 2026.",
    fullDescription: "Digital Business Blueprint is an exhaustive, 240-page strategic master guide crafted for modern founders and digital entrepreneurs. Learn how to identify untapped market gaps, design sticky value propositions, engineer zero-cost acquisition channels, and construct recurring revenue engines without outside venture capital.",
    price: 499,
    originalPrice: 999,
    rating: 4.9,
    reviewsCount: 384,
    badge: "Bestseller",
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    productFormat: "Interactive PDF + Notion Playbook + Audio Summary",
    compatibility: "Desktop, Tablet, Kindle & Mobile devices",
    fileSize: "48 MB digital download",
    photos: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-digital-business-blueprint-master-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/digital-business-blueprint",
    videoLink: "https://player.vimeo.com/video/849201940",
    downloadFileUrl: "https://assets.ElvorDigital.com/digital-business-blueprint-bundle.zip",
    features: [
      "240 pages of battle-tested frameworks & real case studies",
      "Financial projection spreadsheet & margin calculator",
      "Customer acquisition roadmap with 12 organic growth vectors",
      "Product launch sprint checklist with day-by-day deliverables",
      "Legal & operational templates for digital asset businesses",
    ],
    whatsIncluded: [
      { title: "Digital Master Book (PDF & ePub)", description: "High-resolution illustrated guide with annotated diagrams", format: "PDF / ePub", count: "240 Pages" },
      { title: "Notion Enterprise Workspace", description: "Interactive validation board and operational task matrix", format: "Notion Template", count: "1 Full OS" },
      { title: "Financial Model Spreadsheet", description: "P&L projections, CAC/LTV forecasting and pricing calculator", format: "Excel / Sheets", count: "8 Tabs" },
      { title: "Launch Sprint Playbook", description: "Day 1 to Day 30 step-by-step product launch calendar", format: "Printable PDF", count: "30-Day Matrix" },
    ],
    bonuses: [
      { title: "100 Digital Product Ideas Database", description: "Niche-specific product concepts with validated search demand", demoValue: "₹499" },
      { title: "Email Pitch Swipe File", description: "15 cold outreach & partnership email templates with 40%+ open rates", demoValue: "₹299" },
    ],
    faqs: [
      { question: "Is this book suitable for beginners with no business experience?", answer: "Yes! It starts with foundational customer discovery and walks all the way through advanced multi-tier pricing and automation." },
      { question: "How do I access the Notion workspace?", answer: "Inside the welcome PDF, you will find a 1-click duplication link that imports the complete system directly into your personal Notion account." },
    ],
    status: "published",
  },
  {
    name: "The Ultimate Creator Handbook",
    slug: "the-ultimate-creator-handbook",
    sku: "ELV-EBO-102",
    category: "ebooks-guides",
    categoryName: "Ebooks & Guides",
    tagline: "Turn attention into an unstoppable personal brand.",
    shortDescription: "A comprehensive playbook for growing an engaged online audience and unlocking 6-figure creator revenue streams.",
    fullDescription: "Turn your content into an enduring creator business. This practical handbook details audience psychology, high-retention storytelling, algorithmic distribution across YouTube, X, and Instagram, and multi-channel monetization strategies.",
    price: 299,
    originalPrice: 599,
    rating: 4.8,
    reviewsCount: 219,
    badge: "Popular",
    isBestSeller: false,
    isFeatured: false,
    isNewArrival: false,
    productFormat: "Digital PDF & Audio Book Notes",
    compatibility: "All digital reading apps and devices",
    fileSize: "32 MB",
    photos: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-ultimate-creator-handbook-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/the-ultimate-creator-handbook",
    downloadFileUrl: "https://assets.ElvorDigital.com/the-ultimate-creator-handbook.zip",
    features: [
      "180+ pages covering the complete creator journey",
      "Hook writing formulas with 50+ viral examples analyzed",
      "Sponsorship rate calculator & contract negotiations guide",
      "Repurposing system to turn 1 idea into 10 pieces of content",
    ],
    whatsIncluded: [
      { title: "Illustrated Handbook", description: "The full 180-page master guide", format: "PDF", count: "180 Pages" },
      { title: "Sponsor Media Kit Template", description: "Editable Figma & Canva media kit to pitch brands", format: "Canva/Figma", count: "4 Slides" },
    ],
    bonuses: [
      { title: "25 Brand Negotiation Scripts", description: "Word-for-word email replies to counter lowball brand sponsor offers", demoValue: "₹299" },
    ],
    faqs: [
      { question: "Does this work if I have under 1,000 followers?", answer: "Yes! In fact, chapter 2 focuses specifically on zero-to-one traction and micro-audience monetization." },
    ],
    status: "published",
  },
  {
    name: "Ultimate AI Prompt Bundle",
    slug: "ultimate-ai-prompt-bundle",
    sku: "ELV-AIP-201",
    category: "ai-prompts",
    categoryName: "AI Prompt Bundles",
    tagline: "10,000+ battle-tested prompts for ChatGPT, Midjourney & Claude.",
    shortDescription: "Over 10,000+ rigorously engineered prompts for ChatGPT, Claude, Midjourney, and modern LLMs.",
    fullDescription: "Transform generative AI from a novelty into your highest-performing automated team member. This curated library spans 50+ business departments and creative workflows.",
    price: 399,
    originalPrice: 899,
    rating: 4.9,
    reviewsCount: 512,
    badge: "Bestseller",
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    productFormat: "Notion Database + CSV Sheets + Copy-Paste PDF",
    compatibility: "ChatGPT, Claude 3.5, Midjourney v6, Perplexity",
    fileSize: "18 MB library",
    photos: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-ultimate-ai-prompt-bundle-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/ultimate-ai-prompt-bundle",
    downloadFileUrl: "https://assets.ElvorDigital.com/ultimate-ai-prompt-bundle.zip",
    features: [
      "10,000+ categorised, ready-to-deploy prompts",
      "Chain-of-thought system prompts for complex problem solving",
      "Midjourney photorealism parameter cheatsheets",
      "Automated prompt-chaining workflows for SEO articles",
    ],
    whatsIncluded: [
      { title: "Master Notion Vault", description: "Searchable database filtered by role, difficulty, and AI model", format: "Notion", count: "10,000+" },
      { title: "Midjourney Visual Matrix", description: "Lighting, camera angle, and lens modifier recipes", format: "PDF", count: "45 Pages" },
    ],
    bonuses: [
      { title: "Custom GPT Builder Blueprint", description: "Guide to constructing proprietary custom GPT bots with memory", demoValue: "₹499" },
    ],
    faqs: [
      { question: "Do these prompts work on the free version of ChatGPT?", answer: "Yes, all text prompts are optimized to work on both GPT-3.5/GPT-4o free and Plus tiers." },
    ],
    status: "published",
  },
  {
    name: "Modern Website UI Kit",
    slug: "modern-website-ui-kit",
    sku: "ELV-TEM-301",
    category: "templates",
    categoryName: "Website & Canva Templates",
    tagline: "Design production-ready landing pages in hours, not weeks.",
    shortDescription: "A massive, responsive Figma UI kit with 200+ modular dark-mode components and 15 complete landing page templates.",
    fullDescription: "A sleek, conversion-engineered design system for SaaS startups, agencies, and web designers. Built with modern auto-layout 5.0, variables, design tokens, and glassmorphic aesthetics.",
    price: 499,
    originalPrice: 1099,
    rating: 4.9,
    reviewsCount: 294,
    badge: "Bestseller",
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    productFormat: "Figma File (.fig) + HTML/Tailwind Code Snippets",
    compatibility: "Figma Desktop & Browser, Tailwind CSS v3/v4",
    fileSize: "85 MB asset archive",
    photos: [
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-modern-website-ui-kit-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/modern-website-ui-kit",
    downloadFileUrl: "https://assets.ElvorDigital.com/modern-website-ui-kit.zip",
    features: [
      "200+ responsive Auto Layout components",
      "15 complete landing page layouts (SaaS, Agency, Mobile App)",
      "Dark & light mode design token variables",
      "Ready-to-copy Tailwind CSS component classes",
    ],
    whatsIncluded: [
      { title: "Figma Component System", description: "Complete design kit with components, variants, and design tokens", format: ".FIG File", count: "200+ Comps" },
      { title: "HTML / Tailwind Source Code", description: "Clean semantic code for top header, hero, and pricing sections", format: "Code Archive", count: "15 Templates" },
    ],
    bonuses: [
      { title: "3D Abstract Icon Pack", description: "50 high-res transparent 3D glass icons rendered at 3000x3000px", demoValue: "₹599" },
    ],
    faqs: [
      { question: "Is this UI kit compatible with free Figma accounts?", answer: "Yes! You can duplicate and customize the file completely on Figma's free starter plan." },
    ],
    status: "published",
  },
  {
    name: "Ultimate Canva Creator Kit",
    slug: "ultimate-canva-creator-kit",
    sku: "ELV-TEM-302",
    category: "templates",
    categoryName: "Website & Canva Templates",
    tagline: "500+ scroll-stopping social media templates ready to publish.",
    shortDescription: "500+ customizable Canva templates for Instagram carousels, YouTube thumbnails, and LinkedIn infographics.",
    fullDescription: "End creator burnout and maintain a consistent, high-aesthetic presence across all platforms. Fully editable in Canva free or pro with click-and-type simplicity.",
    price: 349,
    originalPrice: 799,
    rating: 4.8,
    reviewsCount: 328,
    badge: "Popular",
    isBestSeller: true,
    isFeatured: false,
    isNewArrival: false,
    productFormat: "Direct 1-Click Canva Template Access Links",
    compatibility: "Canva Free & Canva Pro (Web and Mobile app)",
    fileSize: "Cloud Links (No storage required)",
    photos: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-ultimate-canva-creator-kit-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/ultimate-canva-creator-kit",
    downloadFileUrl: "https://assets.ElvorDigital.com/ultimate-canva-creator-kit.zip",
    features: [
      "500+ modern dark & vibrant minimalist layouts",
      "50 high-CTR YouTube thumbnail frameworks",
      "100 viral multi-slide carousel templates for IG & LinkedIn",
      "Brand kit style guides and color palette formulas",
    ],
    whatsIncluded: [
      { title: "Canva Master Access Portal", description: "1-click duplication links directly into your Canva account", format: "Canva Link", count: "500+ Designs" },
    ],
    bonuses: [
      { title: "Viral Headline Swipe File", description: "50 fill-in-the-blank headlines for thumbnail and carousel hooks", demoValue: "₹299" },
    ],
    faqs: [
      { question: "Do I need Canva Pro to use these templates?", answer: "No! All elements, typography, and graphics used are 100% free Canva assets." },
    ],
    status: "published",
  },
  {
    name: "Creator Productivity Toolkit",
    slug: "creator-productivity-toolkit",
    sku: "ELV-SFT-401",
    category: "software-tools",
    categoryName: "Software & Tools",
    tagline: "Your entire creative business organized inside one Notion OS.",
    shortDescription: "An all-in-one Notion workspace designed to organize content schedules, client pipelines, finances, and goals.",
    fullDescription: "Stop managing your creator business across a dozen fragmented apps. This central command center brings together your content editorial calendar, sponsorship CRM, project delivery trackers, and asset archives.",
    price: 399,
    originalPrice: 899,
    rating: 4.9,
    reviewsCount: 198,
    badge: "54% OFF",
    isBestSeller: false,
    isFeatured: true,
    isNewArrival: true,
    productFormat: "Notion Workspace Template (1-Click Duplicate)",
    compatibility: "Notion Desktop, Web, iOS & Android",
    fileSize: "Cloud Workspace",
    photos: [
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1000&q=80",
    ],
    thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1000&q=80",
    googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-creator-productivity-toolkit-vault",
    accessFolderLink: "https://cloud.ElvorDigital.com/folders/creator-productivity-toolkit",
    downloadFileUrl: "https://assets.ElvorDigital.com/creator-productivity-toolkit.zip",
    features: [
      "Automated content repurposing pipeline across 5 channels",
      "Sponsorship deal tracker with dynamic revenue calculators",
      "Goal setting and KPI analytics dash",
      "Client onboarding and project deliverable portal",
    ],
    whatsIncluded: [
      { title: "Complete Notion Operating System", description: "Fully interconnected database matrix with pre-built views", format: "Notion OS", count: "1 Full OS" },
    ],
    bonuses: [
      { title: "Weekly Planning Routine Video", description: "20-minute video walkthrough on operating the system efficiently", demoValue: "₹399" },
    ],
    faqs: [
      { question: "How hard is this to set up in my Notion?", answer: "It takes under 30 seconds! Click the duplicate link provided, and Notion creates an exact copy in your private workspace." },
    ],
    status: "published",
  },
];

async function sync() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[Sync] Connected to MongoDB Atlas. Syncing all catalog products...");

  for (const item of ALL_PRODUCTS) {
    await Product.findOneAndUpdate(
      { slug: item.slug },
      { $set: item },
      { upsert: true, new: true }
    );
    console.log(`✓ Upserted: ${item.name} (${item.slug})`);
  }

  const total = await Product.countDocuments();
  console.log(`[Sync] All products successfully synced. Total in MongoDB: ${total}`);
  await mongoose.disconnect();
}

sync().catch(console.error);
