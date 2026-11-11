require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Education = require('../models/Education');
const Experience = require('../models/Experience');
const {
  importMissingPortfolioRecords,
  importProfileIfMissing,
} = require('../utils/importMissingPortfolioRecords');

const seedPortfolioData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sajith_portfolio';
  const dryRun = !process.argv.includes('--apply');
  try {
    const parsedUri = new URL(uri);
    const hasExplicitDatabaseName = parsedUri.pathname.length > 1;
    const databaseName = hasExplicitDatabaseName
      ? decodeURIComponent(parsedUri.pathname.slice(1).split('/')[0])
      : 'test';
    if (!dryRun && !hasExplicitDatabaseName) {
      throw new Error('MONGODB_URI has no explicit database name (MongoDB defaults to "test"). Add the intended database to the URI path before applying.');
    }
    console.log(`[Portfolio Import] ${dryRun ? 'Dry run' : 'Apply'} against database "${databaseName}".`);
    if (dryRun && !hasExplicitDatabaseName) {
      console.log('[Portfolio Import] Warning: URI has no database path; this read-only preview targets the MongoDB default database "test".');
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

    const profile = {
      name: 'Sajith',
      title: 'Frontend Developer // Aspiring Full Stack',
      tagline: 'Architecting ultra-responsive interfaces and full-stack systems.',
      aboutHeadline: 'Curious Mind. Creative Builder. Continuous Learner.',
      aboutBio: "I'm Sajith, an aspiring Full Stack Web Developer passionate about creating modern web applications. I enjoy experimenting with new technologies, building practical projects, and finding creative ways to solve real-world problems. My journey combines hands-on business operations experience with my passion for software development and AI-powered creativity.",
      location: 'Kerala, India',
      status: 'Open to Roles',
      email: 'sajith.dev@example.com',
      phone: '+91 80754 87845',
      whatsappUrl: 'https://wa.me/918075487845',
      githubUrl: '#projects',
      linkedinUrl: '#contact',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEXiY3o2rILoI1CvFyaFyWB_-0sk-nx_36suQNslQbZrosYtbSZq2lOb69S13_F8nGmRqRs_T-NFnC52GuVvC3oE9fI8Ctlz_9j16g4Q1_wsthTWD-nX1NFxvQLSA1sJJbKbghEvU_5Nda9ch07WWige7OaRPTFLN42CiQyRDReM3AJ0_RMtJCSsOF36IZiFGPWzVpot8tn_DTZb_vLLbISgEC1ODMH9UaLI3VpqY',
      resumeUrl: '',
      stats: {
        projectsCount: '15+',
        techMastered: '12+',
        passionRate: '100%',
      },
    };

    // These are the original portfolio records. Existing records are never updated.
    const projects = [
      {
        title: 'RGN Residency Billing Generator',
        description: 'Automated hotel administrative billing tool engineered for real-time guest checkout, dynamic GST calculations, custom stay breakdowns, and instant PDF receipt compilation via client-side canvas rasterization.',
        category: 'fullstack frontend',
        badge: 'Live Production',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap', 'html2canvas'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByGYnTjTUUgEasSkO1nf7iKR0yMzWxJjdDIv5LMMCu-NRNAfmCtD2jZXrdfZpqQxfiIP5BdGb_PbC5d0PQcAM9oBl7N15n5snk8snWBeB4BOQdogixusHeY_4I-PoDyF_icl3AlLWbx2vOGeFaoqx5wRGKxlLTpjRVH9t5DKDjpEXCDiIMGdwV1dcnBoJVvE4WJRUh49RbivRF7xWe-oGr5XeB6WzjefadSuED5fw',
        liveUrl: '#contact',
        githubUrl: '#contact',
        isFeatured: true,
        order: 1,
      },
      {
        title: 'ChronoGO',
        description: 'Immersive, time-travel themed digital storytelling web experience with interactive parallax eras, reactive audio cues, and responsive architectural layouts.',
        category: 'frontend',
        badge: 'Creative Storytelling',
        technologies: ['HTML', 'CSS', 'Bootstrap', 'JavaScript'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWsQirIKkZma_PzcTEF58nhqWA6plWqo5KEl1sVBaoL_zQ0mq9hbMA2kARdPySCGVERzxXd0taG_K6Dv75i-LUPDxMLiCl37WstBKrt2MBxFdx67DR_Xx-ezwswQ9Z3qtv8Yh3VSy_kvCOPvVPeFVLppKnQnlGwt8DYt6DG1oqTLDJuB6FdX5XmVzQvvzeLOi6fcvxRy2_Ehf4aWBNHmxq0XhtcODj5c-0Dq_Vzc4',
        liveUrl: '#contact',
        githubUrl: '#contact',
        isFeatured: false,
        order: 2,
      },
      {
        title: 'PhotoBooth P2P',
        description: 'Real-time peer-to-peer video streaming and camera snapshot collaboration app utilizing direct WebRTC tunnels and PeerJS data channels.',
        category: 'frontend',
        badge: 'WebRTC Protocol',
        technologies: ['React', 'PeerJS', 'WebRTC', 'JS'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ-F5xEDVP11U72FndOpNdTA5RMUqgtGZdCmFdgbFpSktsyFrU94Q-gbqNCbkc-dANhsD-huImKQcO_7X_ZQvBFTT3gHjzCQOItb-Q29qPLIMGSp5OWguaYeXeQLOMEOVWqp62KUtXalRYaEWFp-ZhrF9xTfz9iWxMa0M9UGbfP9I78JHReMy1Rba9QluZOK8Hdpqjg1c8X0btHh9LtAqBM00pPHpy-kfsV6c95qo',
        liveUrl: '#contact',
        githubUrl: '#contact',
        isFeatured: false,
        order: 3,
      },
      {
        title: 'SajithAI Private Assistant',
        description: 'Offline-capable conversational LLM workstation integrating Ollama runtime, full conversation memory graphs, and custom retrieval embeddings.',
        category: 'fullstack ai',
        badge: 'Private AI',
        technologies: ['React', 'Node.js', 'Express', 'Ollama'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjfKL76-L_1bepUny7DzGhbVrAx7bfv59_NUS07DVLG2shGgUybIStMHMM2ExRBLj5u_qkAaLnnZ6xBEMVOxROBHMR5cR7ExX4XwQKl9xxZ1dCorrND_mVHpi1G0D1O_oHHvR8Sopg2cSkcgN7dEGHq3_qwbyljgIpfO_i0wW-AqUL2i6u1TPixinC0DtFMHbReaVqwcgnORD5oId2QPpsYtMfOL39FD7uRN_NwCA',
        liveUrl: '#contact',
        githubUrl: '#contact',
        isFeatured: false,
        order: 4,
      },
      {
        title: 'Personal Finance Dashboard',
        description: 'Full income/expense ledger featuring interactive visualization graphs, dynamic category filters, and monthly savings goal trackers.',
        category: 'frontend',
        badge: 'Fintech Analytics',
        technologies: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap'],
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpjGSwor23GjJtcKUXij4NOH7K1w6CzpZwA19tvFAXJFXO_x_zrJ8OcdHh-Y3uOdzRTq4ezJhyKkOVsXuM_dwRpGrQ9-eMyhGRgt8K852-DlhpdgCJnexjlaJ4LXrzR9atm50NPjv9sZHo5FYQ5NgwpWY7YjKLQVhOg9fy_0LeFRuzWp5-iQLato1XShVKQmTdFxwY4gV5JadvNaNiDRaR_R-LxQyGqA6CD1q-8DM',
        liveUrl: '#contact',
        githubUrl: '#contact',
        isFeatured: false,
        order: 5,
      },
    ];

    const skills = [
      // Frontend
      { name: 'HTML5', category: 'Frontend', isHighlight: false, styleClass: '', order: 1 },
      { name: 'CSS3', category: 'Frontend', isHighlight: false, styleClass: '', order: 2 },
      { name: 'JavaScript (ES6+)', category: 'Frontend', isHighlight: false, styleClass: '', order: 3 },
      { name: 'React.js', category: 'Frontend', isHighlight: true, styleClass: 'hl', order: 4 },
      { name: 'Angular', category: 'Frontend', isHighlight: false, styleClass: '', order: 5 },
      { name: 'Tailwind CSS', category: 'Frontend', isHighlight: false, styleClass: '', order: 6 },
      { name: 'Bootstrap', category: 'Frontend', isHighlight: false, styleClass: '', order: 7 },
      { name: 'Responsive UX', category: 'Frontend', isHighlight: false, styleClass: 'mu', order: 8 },

      // Backend
      { name: 'Node.js', category: 'Backend', isHighlight: true, styleClass: 'cy', order: 1 },
      { name: 'Express.js', category: 'Backend', isHighlight: false, styleClass: '', order: 2 },
      { name: 'MongoDB', category: 'Backend', isHighlight: false, styleClass: '', order: 3 },
      { name: 'RESTful APIs', category: 'Backend', isHighlight: false, styleClass: '', order: 4 },
      { name: 'JWT Auth', category: 'Backend', isHighlight: false, styleClass: '', order: 5 },
      { name: 'Database Schema', category: 'Backend', isHighlight: false, styleClass: 'mu', order: 6 },

      // Tools
      { name: 'Git', category: 'Tools', isHighlight: false, styleClass: '', order: 1 },
      { name: 'GitHub', category: 'Tools', isHighlight: false, styleClass: '', order: 2 },
      { name: 'VS Code', category: 'Tools', isHighlight: false, styleClass: '', order: 3 },
      { name: 'Postman', category: 'Tools', isHighlight: false, styleClass: '', order: 4 },
      { name: 'Figma', category: 'Tools', isHighlight: false, styleClass: '', order: 5 },
      { name: 'Chrome DevTools', category: 'Tools', isHighlight: false, styleClass: 'mu', order: 6 },

      // AI & Vibe Tools
      { name: 'ChatGPT', category: 'AI & Vibe Tools', isHighlight: true, styleClass: 'lm', order: 1 },
      { name: 'Google Stitch', category: 'AI & Vibe Tools', isHighlight: false, styleClass: '', order: 2 },
      { name: 'Lovable', category: 'AI & Vibe Tools', isHighlight: false, styleClass: '', order: 3 },
      { name: 'GitHub Copilot', category: 'AI & Vibe Tools', isHighlight: false, styleClass: '', order: 4 },
      { name: 'Prompt Engineering', category: 'AI & Vibe Tools', isHighlight: false, styleClass: '', order: 5 },
    ];

    const experiences = [
      {
        company: 'Luminar Technolab',
        role: 'Full Stack Web Development',
        period: '2024 - Present',
        tag: 'Luminar Technolab',
        description: 'Intensive engineering curriculum covering modern frontend architectures, Node.js backend pipelines, REST API design, asynchronous states, and real-time database management.',
        order: 1,
      },
    ];

    const education = [
      {
        institution: 'Govt ITI Malampuzha',
        degree: 'ITI Mechanic Motor Vehicle',
        period: 'Graduated',
        description: 'Mechanical systems diagnostics, systematic fault isolation, and engineering maintenance fundamentals that translate directly into rigorous debugging methods.',
        order: 2,
      },
      {
        institution: 'HSS Pottassery / GHSS Pottassery',
        degree: 'Higher Secondary & SSLC Education',
        period: 'Foundational',
        description: 'Completed Higher Secondary and Secondary School Leaving Certificate (SSLC) with focus on science and fundamentals.',
        order: 3,
      },
    ];

    const importAll = async (previewOnly) => ({
      profile: await importProfileIfMissing({ model: Profile, record: profile, dryRun: previewOnly }),
      projects: await importMissingPortfolioRecords({
        model: Project, records: projects, identityFields: ['title'], dryRun: previewOnly, label: 'project',
      }),
      skills: await importMissingPortfolioRecords({
        model: Skill, records: skills, identityFields: ['name', 'category'], dryRun: previewOnly, label: 'skill',
      }),
      experience: await importMissingPortfolioRecords({
        model: Experience, records: experiences,
        identityFields: ['company', 'role'], dryRun: previewOnly, label: 'experience',
      }),
      education: await importMissingPortfolioRecords({
        model: Education, records: education,
        identityFields: ['institution', 'degree'], dryRun: previewOnly, label: 'education',
      }),
    });

    // Validate every collection before any writes so ambiguous identities cannot leave a partial import.
    const preview = await importAll(true);
    const results = dryRun ? preview : await importAll(false);

    for (const [collection, result] of Object.entries(results)) {
      console.log(
        `[Portfolio Import] ${collection}: ${result.inserted} ${dryRun ? 'would be added' : 'added'}, ` +
        `${result.preserved} existing records preserved.`
      );
    }

    console.log(
      dryRun
        ? '[Portfolio Import] No data was changed. Run with --apply to import missing records.'
        : '[Portfolio Import] Complete. Existing records were not modified or deleted.'
    );
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Portfolio Import Error]', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

if (require.main === module) {
  seedPortfolioData();
}

module.exports = seedPortfolioData;
