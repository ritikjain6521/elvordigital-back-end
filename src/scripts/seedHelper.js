const AdminUser = require("../models/AdminUser");
const Category = require("../models/Category");
const Product = require("../models/Product");
const EmailConfig = require("../models/EmailConfig");

const seedDefaultData = async () => {
  try {
    // 1. Seed Admin User
    const existingAdmin = await AdminUser.findOne({
      $or: [{ username: "admin" }, { email: "admin@ElvorDigital.com" }],
    });

    if (!existingAdmin) {
      console.log("[Seed] Creating default administrator account...");
      await AdminUser.create({
        username: "admin",
        email: "admin@ElvorDigital.com",
        password: "Admin@123456", // Pre-hashed by model schema pre-save hook
        name: "ElvorDigital Chief Admin",
        role: "OWNER",
        status: "active",
        avatar: "ZA",
      });
      console.log("[Seed] Default Admin created: User ID: 'admin' / 'admin@ElvorDigital.com' | Password: 'Admin@123456'");
    }

    // 2. Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log("[Seed] Seeding initial categories...");
      await Category.create([
        {
          name: "Meta Ads Courses",
          slug: "meta-ads-courses",
          description: "High-ROI Facebook, Instagram, and WhatsApp Ads masterclasses and scaling playbooks.",
          icon: "Megaphone",
          gradient: "from-purple-500/20 to-indigo-500/10",
        },
        {
          name: "AI Prompts & Systems",
          slug: "ai-prompts",
          description: "Curated ChatGPT, Midjourney, and Claude prompt toolkits for growth and automation.",
          icon: "Sparkles",
          gradient: "from-pink-500/20 to-purple-500/10",
        },
        {
          name: "Canva & Creator Templates",
          slug: "templates",
          description: "High-converting social media carousels, video reels, and brand design systems.",
          icon: "Layers",
          gradient: "from-blue-500/20 to-cyan-500/10",
        },
        {
          name: "Business Ebooks & Guides",
          slug: "ebooks-guides",
          description: "Actionable frameworks for digital agency scaling, solopreneurship, and sales funnels.",
          icon: "BookOpen",
          gradient: "from-amber-500/20 to-orange-500/10",
        },
        {
          name: "Software & Developer Tools",
          slug: "software-tools",
          description: "Production-ready UI kits, code components, scripts, and Notion operating systems.",
          icon: "Cpu",
          gradient: "from-emerald-500/20 to-teal-500/10",
        },
      ]);
    }

    // 3. Seed Hero Products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("[Seed] Seeding initial flagship products...");
      await Product.create([
        {
          name: "META ADS MASTERY 2026 – PRO EDITION",
          slug: "meta-ads-mastery-2026",
          sku: "META-2026-PRO",
          category: "meta-ads-courses",
          categoryName: "Meta Ads Courses",
          tagline: "Learn. Launch. Optimize. Scale.",
          shortDescription:
            "Complete Facebook & Instagram advertising masterclass. Launch profitable campaigns, reduce acquisition costs, and scale your business.",
          fullDescription:
            "Master modern Meta Advertising in 2026. This comprehensive masterclass covers everything from Advantage+ campaigns, pixel tracking, creative strategy, high-converting hooks, A/B testing frameworks, to multi-million dollar scaling secrets.",
          price: 499,
          originalPrice: 1099,
          discount: "54% OFF",
          badge: "Bestseller",
          isFeatured: true,
          isBestSeller: true,
          productFormat: "50+ HD Video Lessons + Resource Bundle",
          fileSize: "1.4 GB",
          status: "published",

          photos: [
            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
          ],
          thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000&q=80",
          googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-meta-ads-2026-pro-master-vault",
          accessFolderLink: "https://cloud.ElvorDigital.com/folders/meta-ads-mastery-2026",
          videoLink: "https://player.vimeo.com/video/849201940",
          downloadFileUrl: "https://assets.ElvorDigital.com/meta-ads-mastery-2026-pro-bundle.zip",

          // Section 1: Overview & Deliverables
          overviewText:
            "An end-to-end practical blueprint with 8 modules, 50+ video lessons, live campaign walkthroughs, and lifetime updates.",
          deliverables: [
            "50+ HD On-Demand Video Lessons (Lifetime Access)",
            "High-Converting Ad Copy Swipe File (100+ Proven Frameworks)",
            "Ad Creative Canva Templates (Figma & Photoshop files included)",
            "ROAS & Budget Scaling Calculator Spreadsheet",
            "Meta Pixel & Conversion API Setup Checklist",
            "Private VIP Discord Community & Monthly Q&A Calls",
          ],

          // Section 2: Preview & Features
          features: [
            {
              title: "Advantage+ & AI Targeting Mastery",
              description: "Harness Meta's 2026 machine learning algorithm for predictable customer acquisition.",
            },
            {
              title: "Creative Strategy & Viral Hooks",
              description: "Stop the scroll with UGC frameworks, 3-second hook formulas, and high-CTR visual structures.",
            },
            {
              title: "CAPI & Server-Side Pixel Tracking",
              description: "Bypass iOS privacy tracking blocks and capture 100% of purchase conversion events.",
            },
            {
              title: "Vertical & Horizontal Scaling Blueprints",
              description: "Scale from ₹500/day to ₹50,000/day budget without breaking your return on ad spend.",
            },
          ],

          // Section 3: Comparison & Bonuses
          bonuses: [
            {
              title: "100+ Proven Meta Ad Copy Swipe File",
              value: "₹2,999",
              description: "Fill-in-the-blank headlines, hooks, and body copy proven across 30+ e-commerce niches.",
            },
            {
              title: "High-CTR Canva Creative Template Vault",
              value: "₹1,999",
              description: "50+ customizable static and motion carousel graphics designed for maximum engagement.",
            },
            {
              title: "Ad Budget & CAC Optimization Spreadsheet",
              value: "₹1,499",
              description: "Automated Google Sheets model for projecting breakeven metrics and cashflow targets.",
            },
          ],

          // Section 4: Product FAQs
          faqs: [
            {
              question: "How do I access the course and resources after payment?",
              answer:
                "Immediately after payment confirmation, you are redirected to the order access page and receive an automated email containing your direct Google Drive master folder link, video portal access, and downloadable bonus packages.",
            },
            {
              question: "Is this suitable for complete beginners in digital marketing?",
              answer:
                "Yes! The course begins with foundational setup (Business Manager, Pixels, Audience research) and progresses step-by-step to advanced attribution models and scaling frameworks.",
            },
          ],
        },
        {
          name: "Ultimate AI Prompt Toolkit 2026",
          slug: "ultimate-ai-prompt-bundle",
          sku: "AI-PROMPT-1000",
          category: "ai-prompts",
          categoryName: "AI Prompts & Systems",
          tagline: "10,000+ Production-Tested Prompts",
          shortDescription: "Transform ChatGPT, Midjourney, and Claude into your private marketing & business team.",
          price: 299,
          originalPrice: 899,
          discount: "66% OFF",
          badge: "Popular",
          isFeatured: true,
          productFormat: "Notion System + PDF Cheat Sheets",
          fileSize: "18 MB",
          status: "published",
          photos: [
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80",
          ],
          thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80",
          googleDriveLink: "https://drive.google.com/drive/folders/1ElvorDigital-ai-prompts-vault",
          deliverables: ["10,000+ Categorized Prompts", "Notion Workspace Duplication", "Weekly Prompt Updates"],
        },
      ]);
    }

    // 4. Seed Email Config
    const emailConfig = await EmailConfig.findOne();
    if (!emailConfig) {
      await EmailConfig.create({
        provider: "smtp",
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        encryption: "tls",
        username: process.env.SMTP_USER || "access@ElvorDigital.com",
        password: process.env.SMTP_PASS || "",
        fromName: process.env.FROM_NAME || "ElvorDigital Access",
        fromEmail: process.env.FROM_EMAIL || "access@ElvorDigital.com",
        replyToEmail: process.env.REPLY_TO || "support@ElvorDigital.com",
        isVerified: false,
      });
    }

    console.log("[Seed] Database checks completed successfully.");
  } catch (err) {
    console.error("[Seed] Error during seeding:", err.message);
  }
};

module.exports = seedDefaultData;
