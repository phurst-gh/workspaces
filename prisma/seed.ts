import {
  InvitationStatus,
  NotificationType,
  PrismaClient,
  Role,
  WorkspaceRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  const passHash = await bcrypt.hash("password123", 10);

  const user1 = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: passHash,
      role: Role.USER,
      maxWorkspaces: 10,
    },
  });
  console.log(`✅ User seeded: ${user1.email} (${Role.USER})`);

  const user2 = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: passHash,
      role: Role.ADMIN,
      maxWorkspaces: 10,
    },
  });
  console.log(`✅ User seeded: ${user2.email} (${Role.ADMIN})`);

  const user3 = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      passwordHash: passHash,
      role: Role.MANAGER,
      maxWorkspaces: 5,
    },
  });
  console.log(`✅ User seeded: ${user3.email} (${Role.MANAGER})`);

  const workspace1 = await prisma.workspace.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Acme Corp",
      isPublic: false,
    },
  });
  console.log(`✅ Workspace seeded: ${workspace1.name}`);

  const workspace2 = await prisma.workspace.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Open Source Projects",
      isPublic: true,
    },
  });
  console.log(`✅ Workspace seeded: ${workspace2.name}`);

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace1.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace1.id,
      userId: user2.id,
      role: WorkspaceRole.OWNER,
    },
  });
  console.log(`✅ WorkspaceMember seeded: ${user2.email} -> ${workspace1.name} (OWNER)`);

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace1.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace1.id,
      userId: user1.id,
      role: WorkspaceRole.MEMBER,
    },
  });
  console.log(`✅ WorkspaceMember seeded: ${user1.email} -> ${workspace1.name} (MEMBER)`);

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace2.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace2.id,
      userId: user1.id,
      role: WorkspaceRole.OWNER,
    },
  });
  console.log(`✅ WorkspaceMember seeded: ${user1.email} -> ${workspace2.name} (OWNER)`);

  await prisma.workspaceInvitation.upsert({
    where: {
      workspaceId_inviteeId_status: {
        workspaceId: workspace1.id,
        inviteeId: user3.id,
        status: InvitationStatus.PENDING,
      },
    },
    update: {},
    create: {
      workspaceId: workspace1.id,
      inviterId: user2.id,
      inviteeId: user3.id,
      status: InvitationStatus.PENDING,
    },
  });
  console.log(
    `✅ WorkspaceInvitation seeded: ${user2.email} invited ${user3.email} to ${workspace1.name}`,
  );

  const project1 = await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      workspaceId: workspace1.id,
      name: "Website Redesign",
    },
  });
  console.log(`✅ Project seeded: ${project1.name}`);

  const project2 = await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      workspaceId: workspace1.id,
      name: "Mobile App",
    },
  });
  console.log(`✅ Project seeded: ${project2.name}`);

  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: NotificationType.WORKSPACE_INVITE,
      data: {
        workspaceId: workspace1.id,
        inviterEmail: user2.email,
      },
    },
  });
  console.log(`✅ Notification seeded for ${user1.email}`);

  console.log("🎉 Database seeding complete!");
}

seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
