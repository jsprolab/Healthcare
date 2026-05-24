import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialties = [
  { name: 'Family Medicine', slug: 'family-medicine' },
  { name: 'Internal Medicine', slug: 'internal-medicine' },
  { name: 'Pediatrics', slug: 'pediatrics' },
  { name: 'Obstetrics & Gynecology', slug: 'obstetrics-gynecology' },
  { name: 'Cardiology', slug: 'cardiology' },
  { name: 'Dermatology', slug: 'dermatology' },
  { name: 'Orthopedic Surgery', slug: 'orthopedic-surgery' },
  { name: 'Neurology', slug: 'neurology' },
  { name: 'Psychiatry', slug: 'psychiatry' },
  { name: 'Ophthalmology', slug: 'ophthalmology' },
  { name: 'Gastroenterology', slug: 'gastroenterology' },
  { name: 'Pulmonology', slug: 'pulmonology' },
  { name: 'Endocrinology', slug: 'endocrinology' },
  { name: 'Nephrology', slug: 'nephrology' },
  { name: 'Oncology', slug: 'oncology' },
  { name: 'Emergency Medicine', slug: 'emergency-medicine' },
];

const californiaCities = [
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles-ca' },
  { name: 'San Diego', state: 'CA', slug: 'san-diego-ca' },
  { name: 'San Jose', state: 'CA', slug: 'san-jose-ca' },
  { name: 'San Francisco', state: 'CA', slug: 'san-francisco-ca' },
  { name: 'Fresno', state: 'CA', slug: 'fresno-ca' },
  { name: 'Sacramento', state: 'CA', slug: 'sacramento-ca' },
  { name: 'Long Beach', state: 'CA', slug: 'long-beach-ca' },
  { name: 'Oakland', state: 'CA', slug: 'oakland-ca' },
  { name: 'Bakersfield', state: 'CA', slug: 'bakersfield-ca' },
  { name: 'Anaheim', state: 'CA', slug: 'anaheim-ca' },
  { name: 'Santa Ana', state: 'CA', slug: 'santa-ana-ca' },
  { name: 'Riverside', state: 'CA', slug: 'riverside-ca' },
  { name: 'Stockton', state: 'CA', slug: 'stockton-ca' },
  { name: 'Irvine', state: 'CA', slug: 'irvine-ca' },
  { name: 'Chula Vista', state: 'CA', slug: 'chula-vista-ca' },
  { name: 'Fremont', state: 'CA', slug: 'fremont-ca' },
  { name: 'San Bernardino', state: 'CA', slug: 'san-bernardino-ca' },
  { name: 'Modesto', state: 'CA', slug: 'modesto-ca' },
  { name: 'Fontana', state: 'CA', slug: 'fontana-ca' },
  { name: 'Moreno Valley', state: 'CA', slug: 'moreno-valley-ca' },
  { name: 'Glendale', state: 'CA', slug: 'glendale-ca' },
  { name: 'Huntington Beach', state: 'CA', slug: 'huntington-beach-ca' },
  { name: 'Santa Clarita', state: 'CA', slug: 'santa-clarita-ca' },
  { name: 'Garden Grove', state: 'CA', slug: 'garden-grove-ca' },
  { name: 'Santa Rosa', state: 'CA', slug: 'santa-rosa-ca' },
  { name: 'Oceanside', state: 'CA', slug: 'oceanside-ca' },
  { name: 'Elk Grove', state: 'CA', slug: 'elk-grove-ca' },
  { name: 'Ontario', state: 'CA', slug: 'ontario-ca' },
  { name: 'Corona', state: 'CA', slug: 'corona-ca' },
  { name: 'Salinas', state: 'CA', slug: 'salinas-ca' },
];

async function main() {
  console.log('Seeding database...');

  console.log(`  Upserting ${specialties.length} specialties...`);
  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { slug: specialty.slug },
      update: { name: specialty.name },
      create: specialty,
    });
  }

  console.log(`  Upserting ${californiaCities.length} California cities...`);
  for (const city of californiaCities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, state: city.state },
      create: city,
    });
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
