import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const args = process.argv.slice(2);
let email = 'stephenoderinde@gmail.com';
let name = 'Oderinde Stephen';

for (const arg of args) {
  if (arg.startsWith('--email=')) {
    email = arg.split('=')[1].replace(/["']/g, '');
  } else if (arg.startsWith('--name=')) {
    name = arg.split('=')[1].replace(/["']/g, '');
  }
}

async function bootstrap() {
  console.log(`Starting Owner bootstrap for: ${name} <${email}>`);

  if (!process.env.DATABASE_URL) {
    console.warn('\n[NOTICE] DATABASE_URL is not configured.');
    console.warn('To bootstrap an Owner into a live PostgreSQL database, ensure DATABASE_URL is set in apps/api/.env or passed via environment:');
    console.warn('DATABASE_URL="postgresql://user:pass@host:5432/portal_db?sslmode=require" npm run bootstrap:owner\n');
    console.log('Simulated Owner Bootstrap Specs:');
    console.log(`- Target Email: ${email}`);
    console.log(`- Target Name:  ${name}`);
    console.log('- Role:         Owner');
    console.log('- Status:       ACTIVE');
    console.log('- MFA Enforced: true');
    console.log('\n[SIMULATION READY] When your PostgreSQL database is provisioned, this command will write the verified record immediately.');
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  const isRemote = Boolean(connectionString && !connectionString.includes('localhost'));
  let sanitizedUrl = connectionString;
  if (isRemote) {
    sanitizedUrl = sanitizedUrl.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
  }
  const pool = new pg.Pool({
    connectionString: sanitizedUrl,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let clerkUserId = `clerk_owner_${Buffer.from(email).toString('hex').slice(0, 12)}`;

    if (process.env.CLERK_SECRET_KEY) {
      try {
        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const users = await clerk.users.getUserList({ emailAddress: [email] });
        if (users.data && users.data.length > 0) {
          clerkUserId = users.data[0].id;
          console.log(`Verified Clerk identity: ${clerkUserId}`);
        } else {
          console.log(`User not yet registered in Clerk. Using provisional ID: ${clerkUserId}`);
        }
      } catch (err) {
        console.warn(`Clerk identity check skipped or failed: ${err.message}`);
      }
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: 'Owner',
        status: 'ACTIVE',
        mfaEnforced: true,
        clerkUserId,
      },
      create: {
        clerkUserId,
        email,
        name,
        role: 'Owner',
        status: 'ACTIVE',
        mfaEnforced: true,
      },
    });

    console.log('----------------------------------------------------');
    console.log('SUCCESS: Initial Owner account bootstrapped in database.');
    console.log(`ID:           ${user.id}`);
    console.log(`Email:        ${user.email}`);
    console.log(`Name:         ${user.name}`);
    console.log(`Role:         ${user.role}`);
    console.log(`Status:       ${user.status}`);
    console.log(`MFA Enforced: ${user.mfaEnforced}`);
    console.log('----------------------------------------------------');
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
