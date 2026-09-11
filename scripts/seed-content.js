// Services aur Workshops ka existing hardcoded content Firestore me seed karo
// Run once: node scripts/seed-content.js
require('dotenv').config();
const {
  getContentCards,
  createContentCard,
  savePageContent,
} = require('../lib/firebase');

const serviceCards = [
  {
    title: 'Room Paintings',
    image: '/images/photo-1541961017774-22349e4a1262',
    description:
      'Transform your living spaces with custom hand-painted art for bedrooms, living rooms, and more. Each piece is meticulously crafted to complement your interior decor and personal style.',
    ctaText: 'Book This Service',
    ctaLink: '/book',
  },
  {
    title: 'Hotels & Resorts',
    image: '/images/photo-1549289524-06cf8837ace5',
    description:
      'Create stunning visual experiences for your guests with bespoke wall art installations. We work with luxury hotels and resorts to craft immersive artistic environments.',
    ctaText: 'Book This Service',
    ctaLink: '/book',
  },
  {
    title: 'Building Exteriors',
    image: '/images/photo-1578301978018-3005759f48f7',
    description:
      'Make a bold statement with artistic murals and paintings on building facades. Our large-scale exterior artwork transforms ordinary buildings into landmarks.',
    ctaText: 'Book This Service',
    ctaLink: '/book',
  },
  {
    title: 'Office Spaces',
    image: '/images/photo-1579783902614-a3fb3927b6a5',
    description:
      'Inspire creativity and productivity with professional artistic paintings for workplaces. We design art that aligns with your company culture and brand identity.',
    ctaText: 'Book This Service',
    ctaLink: '/book',
  },
  {
    title: 'Custom Canvas',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop',
    description:
      'Commission personalized canvas paintings tailored to your unique vision and style. From portraits to abstract compositions, every canvas tells your story.',
    ctaText: 'Book This Service',
    ctaLink: '/book',
  },
];

const workshopCards = [
  {
    title: 'College Workshops',
    image: '/images/photo-1541961017774-22349e4a1262',
    description:
      'Full-day or multi-day hands-on painting and mural workshops for college fests, art clubs, and student communities. We bring materials, guidance, and a professional artist team to run the session end to end.',
    ctaText: 'Enquire for Your College',
    ctaLink: '/contact',
  },
  {
    title: 'School Workshops',
    image: '/images/photo-1549289524-06cf8837ace5',
    description:
      'Age-appropriate, curriculum-friendly art & craft sessions designed to build creativity and fine motor skills. Great for annual days, art weeks, and extracurricular programs.',
    ctaText: 'Enquire for Your School',
    ctaLink: '/contact',
  },
  {
    title: 'Summer Art Camps',
    image: '/images/photo-1578301978018-3005759f48f7',
    description:
      'Multi-day summer camps covering painting, mural art, craft, and mixed media — structured to keep kids engaged and creative through the break. Can be hosted at our studio or on your premises.',
    ctaText: 'Enquire About Summer Camps',
    ctaLink: '/contact',
  },
  {
    title: 'Corporate & Community Events',
    image: '/images/photo-1579783902614-a3fb3927b6a5',
    description:
      'Team-building canvas sessions, live mural painting, and community art events for offices, RWAs, and organizations looking to add a creative, collaborative activity to their calendar.',
    ctaText: 'Enquire for Your Organization',
    ctaLink: '/contact',
  },
];

(async () => {
  const existingServices = await getContentCards('service');
  if (existingServices.length === 0) {
    for (const c of serviceCards) await createContentCard('service', c);
    console.log(`Seeded ${serviceCards.length} service cards`);
  } else {
    console.log(`Skipped — ${existingServices.length} service cards already exist`);
  }

  const existingWorkshops = await getContentCards('workshop');
  if (existingWorkshops.length === 0) {
    for (const c of workshopCards) await createContentCard('workshop', c);
    console.log(`Seeded ${workshopCards.length} workshop cards`);
  } else {
    console.log(`Skipped — ${existingWorkshops.length} workshop cards already exist`);
  }

  await savePageContent('services_page', {
    label: 'WHAT WE OFFER',
    title: 'Our Services',
    subtitle: 'Professional hand-painted artwork for every space and occasion',
    ctaTitle: 'Have a Project in Mind?',
    ctaSubtitle: 'Let us help you bring your artistic vision to life',
  });
  console.log('Saved services_page content');

  await savePageContent('workshops_page', {
    label: 'WORKSHOPS & EVENTS',
    title: 'Bring Art To Your Campus',
    subtitle:
      'We organize hands-on art & craft workshops, summer camps, and creative events for schools, colleges, and organizations — book us for your next event',
    statWorkshops: '50+',
    statStudents: '5000+',
    statInstitutions: '30+',
    statYears: '8+',
  });
  console.log('Saved workshops_page content');

  process.exit(0);
})().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
