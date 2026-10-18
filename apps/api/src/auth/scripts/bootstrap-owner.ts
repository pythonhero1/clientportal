import { PrismaClient } from '@prisma/client';

async function bootstrapOwner() {
  const clerkUserId = process.env.INITIAL_OWNER_CLERK_ID;
  const email = process.env.INITIAL_OWNER_EMAIL || 'stephen@oderindestephen.com';

  if (!clerkUserId) {
    console.error('ERROR: INITIAL_OWNER_CLERK_ID must be set in environment to bind Owner.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Check if an Owner already exists - repeat elevation is strictly forbidden
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'Owner' },
    });

    if (existingOwner) {
      console.error(
        `SECURITY ERROR: Repeat Owner elevation disabled. An Owner already exists (ID: ${existingOwner.id}).`,
      );
      process.exit(1);
    }

    // Bind Stephen's verified Clerk identity once
    const owner = await prisma.user.upsert({
      where: { clerkUserId },
      update: {
        role: 'Owner',
        status: 'ACTIVE',
        mfaEnforced: true,
      },
      create: {
        clerkUserId,
        email,
        name: 'Stephen Oderinde',
        role: 'Owner',
        status: 'ACTIVE',
        mfaEnforced: true,
        profile: {
          create: {
            timezone: 'Africa/Lagos',
          },
        },
      },
    });

    // Write immutable audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: owner.id,
        action: 'OwnerBootstrap',
        targetType: 'User',
        targetId: owner.id,
        metadata: {
          message: 'Controlled server-side initial Owner bootstrap completed.',
          clerkUserId,
          email,
          mfaEnforced: true,
        },
      },
    });

    console.log(`SUCCESS: Initial Owner account bound successfully for ${email} (ID: ${owner.id}).`);
  } catch (error) {
    console.error('Failed to bootstrap Owner:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void bootstrapOwner();
