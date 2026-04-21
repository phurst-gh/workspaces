import { InvitationStatus, PrismaClient, WorkspaceRole } from "@prisma/client";

const prisma = new PrismaClient();

// Repository functions must interact with the database
const workspaceRepository = {
  createWorkspace: async (name: string, isPublic: boolean, userId: string) =>
    await prisma.workspace.create({
      data: {
        name,
        isPublic,
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      select: {
        name: true,
        isPublic,
        createdAt: true,
      },
    }),

  createMember: async (workspaceId: string, userId: string, role: WorkspaceRole) =>
    await prisma.workspaceMember.create({
      data: {
        workspaceId, // Is this needed, on the frontend i should have workspace name at this point
        userId,
        role,
      },
    }),

  findAllByUser: async (userId: string, pagination?: { skip?: number; take?: number }) =>
    await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        isPublic: true,
        createdAt: true,
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),

  countByUser: async (userId: string) =>
    await prisma.workspace.count({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    }),

  findById: async (workspaceId: string) =>
    await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
        name: true,
        isPublic: true,
        createdAt: true,
      },
    }),

  findByUserAndName: async (userId: string, name: string) =>
    await prisma.workspace.findMany({
      where: {
        name,
        members: {
          some: {
            userId,
          },
        },
      },
    }),

  findMembershipByUserAndWorkspace: async (userId: string, workspaceId: string) =>
    await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    }),

  findMembersByWorkspace: async (workspaceId: string, pagination?: { skip?: number; take?: number }) =>
    await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),

  countMembersByWorkspace: async (workspaceId: string) =>
    await prisma.workspaceMember.count({
      where: {
        workspaceId,
      },
    }),

  removeMember: async (workspaceId: string, userId: string) =>
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    }),

  createInvitation: async (data: { workspaceId: string; inviterId: string; inviteeId: string }) =>
    await prisma.workspaceInvitation.create({
      data: {
        workspaceId: data.workspaceId,
        inviterId: data.inviterId,
        inviteeId: data.inviteeId,
        status: InvitationStatus.PENDING,
      },
    }),

  findPendingInvitation: async (workspaceId: string, inviteeId: string) =>
    await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        inviteeId,
        status: InvitationStatus.PENDING,
      },
    }),

  findPendingInvitationsByUser: async (userId: string) =>
    await prisma.workspaceInvitation.findMany({
      where: {
        inviteeId: userId,
        status: InvitationStatus.PENDING,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

  findInvitationById: async (invitationId: string) =>
    await prisma.workspaceInvitation.findUnique({
      where: {
        id: invitationId,
      },
    }),

  acceptInvitation: async (invitationId: string, userId: string, workspaceId: string) =>
    await prisma.$transaction([
      prisma.workspaceInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      }),
      prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId,
          role: WorkspaceRole.MEMBER,
        },
      }),
    ]),

  declineInvitation: async (invitationId: string) =>
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.DECLINED },
    }),
};

export { workspaceRepository };
