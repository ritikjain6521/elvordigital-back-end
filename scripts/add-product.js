const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://ritikjainfuturecept_db_user:r01lL3Q6gGgAOZE4@cluster0.on6a92u.mongodb.net/elvoradigital?retryWrites=true&w=majority';

async function addProduct() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas...');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const DigitalAsset = mongoose.model('DigitalAsset', new mongoose.Schema({}, { strict: false }));

  const productData = {
    name: "INSTAGRAM REELS & VIRAL HOOKS MASTERY 2026",
    slug: "instagram-reels-viral-hooks-mastery",
    sku: "ELV-REELS-2026",
    category: "meta-ads-courses",
    categoryName: "Meta Ads Courses",
    tagline: "Stop The Scroll. Skyrocket Organic Reach. Turn Views Into Revenue.",
    shortDescription: "300+ viral reel script frameworks, video hook formulas, sound strategy, and complete algorithm monetization blueprint for creators & businesses in 2026.",
    fullDescription: "Discover the exact system used by top creators and brands to generate tens of millions of views on Instagram Reels and Meta Ads. Learn 3-second visual hooks, audio pacing, CapCut transition tricks, and how to construct high-converting call-to-actions that drive automated sales into your DM funnels.",
    price: 399,
    originalPrice: 999,
    discount: "60% OFF",
    badge: "Trending 🔥",
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isFree: false,
    productFormat: "GOOGLE_DRIVE",
    fileSize: "2.1 GB",
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1000&q=80",
    photos: [
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=1000&q=80"
    ],
    googleDriveLink: "https://drive.google.com/drive/folders/1ufyJw2oFDtEH6nbMtxcLL4-8H2wqNGRk",
    accessFolderLink: "",
    videoLink: "",
    downloadFileUrl: "",
    deliverables: [
      "300+ Proven 3-Second Viral Hook Frameworks (Copy & Paste)",
      "50+ Customizable CapCut & Premiere Pro Editing Templates",
      "Trending Audio & Audio Sync Master Cheat Sheet",
      "Direct DM Sales Automation & ManyChat Funnel Templates",
      "Algorithm Retention Breakdown (10M+ View Case Studies)",
      "Lifetime Access to Google Drive Master Vault with Weekly Updates"
    ],
    overviewText: "Complete 2026 video creator kit packed with viral scripts, hooks, editing presets, and DM monetization blueprints.",
    features: [
      {
        title: "3-Second Psychological Hooks",
        description: "Stop rapid thumb scrolling instantly with proven visual and vocal pattern interrupts."
      },
      {
        title: "CapCut & Premiere Editing Presets",
        description: "Pre-made motion graphics, captions, subtitles, sound effects, and transitions ready to drag and drop."
      },
      {
        title: "DM Sales Funnel Blueprint",
        description: "Convert viral impressions into paying customers automatically using organic DM trigger keywords."
      },
      {
        title: "Sound & Beat Timing Cheat Sheet",
        description: "Learn the pacing rhythm that keeps viewers watching past the 15-second retention benchmark."
      }
    ],
    bonuses: [
      {
        title: "150+ Sound Effects & Audio Transition Library",
        value: "₹1,499",
        description: "Pops, swooshes, risers, and impact hits mastered for social media video clarity."
      },
      {
        title: "Viral Headline & Caption Generator Prompts",
        value: "₹999",
        description: "ChatGPT & Claude prompt chains designed to generate 30 high-converting video ideas in 10 minutes."
      }
    ],
    faqs: [
      {
        question: "Do I need expensive camera equipment to use this?",
        answer: "No! All strategies and editing presets are optimized for modern smartphones (iPhone & Android) and free editing tools like CapCut."
      },
      {
        question: "How will I receive the files after purchase?",
        answer: "You get instant lifetime access inside your private ElvoraDigital post-purchase vault and an automated email with direct Google Drive access."
      }
    ],
    adCopy: {
      headline: "Stop Posting Reels That Get 200 Views – Use These 300+ Proven Hook Frameworks",
      hook: "The algorithm didn't hide your content; your first 3 seconds lost them. Here is the exact viral framework.",
      primaryText: "Transform your Instagram page from zero traction to a high-converting audience engine. Get 300+ viral hooks, 50+ editable templates, and the complete 2026 retention blueprint for just ₹399.",
      cta: "Get Instant Vault Access Now",
      targetAudience: "Digital Creators, Freelancers, E-commerce Founders, Marketing Agencies",
      adMediaUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1000&q=80"
    },
    curriculum: [
      { moduleTitle: "Module 1: The 2026 Reel Algorithm Decoded", lessons: "How the watch-time, share-ratio, and completion rate drive virality" },
      { moduleTitle: "Module 2: 3-Second Pattern Interrupts", lessons: "47 visual hook types, text overlays, and audio triggers that stop the scroll" },
      { moduleTitle: "Module 3: Fast-Paced Editing in CapCut & Premiere", lessons: "Cutting dead air, B-roll insertion, kinetic typography, and sound design" },
      { moduleTitle: "Module 4: Monetization & DM Automation", lessons: "Turning views into email subscribers and direct UPI/Card buyers on autopilot" }
    ],
    targetAudienceList: [
      "Content Creators looking to break out of 200-view jail",
      "D2C and E-commerce brands wanting organic customer acquisition",
      "Coaches, Consultants & Freelancers looking to generate warm client leads",
      "Social Media Managers scaling client accounts without spending on ads"
    ],
    requirements: [
      "Any smartphone with a camera",
      "Free CapCut app or any video editing software of your choice",
      "An active Instagram / Meta account"
    ],
    guaranteeText: "100% Satisfaction Guarantee. If these hooks don't boost your retention and clarity within 7 days, our support team will assist you immediately.",
    urgencyNotice: "Limited Time Creator Launch Price — Increases to ₹999 soon!",
    totalSales: 0,
    totalRevenue: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const savedProduct = await Product.findOneAndUpdate(
    { slug: productData.slug },
    productData,
    { upsert: true, new: true }
  );

  console.log(`Product created/updated: ${savedProduct.name} (ID: ${savedProduct._id})`);

  // Also create/update associated DigitalAsset
  const assetData = {
    name: "Instagram Reels & Viral Hooks Master Vault",
    fileName: "instagram-reels-hooks-mastery",
    fileType: "GOOGLE_DRIVE",
    fileSize: "2.1 GB",
    version: "2026.1",
    associatedProductId: String(savedProduct._id),
    associatedProductName: savedProduct.name,
    fileUrl: "",
    googleDriveLink: "https://drive.google.com/drive/folders/1ufyJw2oFDtEH6nbMtxcLL4-8H2wqNGRk",
    accessFolderLink: "",
    videoLink: "",
    downloadCount: 0,
    status: "active",
    uploadDate: new Date(),
    updatedAt: new Date()
  };

  await DigitalAsset.findOneAndUpdate(
    { associatedProductId: String(savedProduct._id) },
    assetData,
    { upsert: true, new: true }
  );

  console.log('Digital Asset successfully linked to the product!');
  process.exit(0);
}

addProduct().catch((err) => {
  console.error('Error adding product:', err);
  process.exit(1);
});
