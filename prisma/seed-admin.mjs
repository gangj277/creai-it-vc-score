import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL is required");
  }

  let finalHash = passwordHash;
  if (!finalHash && plainPassword) {
    finalHash = await bcrypt.hash(plainPassword, 10);
  }

  if (!finalHash) {
    throw new Error("Set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD");
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: finalHash, active: true },
    create: { email, passwordHash: finalHash },
  });

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
