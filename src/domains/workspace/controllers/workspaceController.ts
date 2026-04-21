// This file cointains Express request handlers (controllers)

import type { Request, Response } from "express";
import { requireUser } from "@/shared/auth/requireUser";
// import { AppError } from "@/shared/errors/AppError";
// import { ErrorCode } from "@/shared/errors/ErrorCode";
import { workspaceService } from "../services/workspaceService";

const createWorkspace = async (req: Request, res: Response) => {
  const workspaceName: string = req.body.name;
  const isPublic: boolean = req.body.isPublic;
  const { sub: userId } = requireUser(req);

  const response = await workspaceService.createWorkspace(workspaceName, isPublic, userId);

  res.status(201).json({
    status: "success",
    result: response,
  });
};

// const getWorkspace = async (req: Request, res: Response) => {};

const MAX_LIMIT = 50;

const listUserMemberships = async (req: Request, res: Response) => {
  const { sub: userId } = requireUser(req);
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, MAX_LIMIT);

  const workspaces = await workspaceService.getUserWorkspaces(userId, { page, limit });

  res.status(200).json({
    status: "success",
    result: workspaces,
  });
};

const listWorkspaceMembers = async (req: Request, res: Response) => {
  const workspaceId: string = req.params.workspaceId;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, MAX_LIMIT);

  const members = await workspaceService.getWorkspaceMembers(workspaceId, { page, limit });

  res.status(200).json({
    status: "success",
    result: members,
  });
};

// const addMemberToWorkspace = async (req: Request, res: Response) => {
//   // 1. Get workspace
//   const workspaceId: string = req.params.workspaceId;
//   const { sub: userId } = requireUser(req);
//   const targetUserId: string = req.body.userId;

//   if (!targetUserId) {
//     throw new AppError(400, ErrorCode.BAD_REQUEST, "Missing targetUserId");
//   }

//   const response = await workspaceService.createMember(workspaceId, userId, targetUserId);

//   res.status(200).json({
//     status: "success",
//     result: response,
//   });
// };

export { createWorkspace, listUserMemberships, listWorkspaceMembers };
