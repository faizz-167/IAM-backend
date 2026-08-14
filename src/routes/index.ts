import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/user.routes";
import { membersRouter } from "../modules/members/members.routes";
import { organizationsRouter } from "../modules/organizations/organizations.route";
import { sessionsRouter } from "../modules/sessions/sessions.routes";
import { invitationsRouter } from "../modules/invitations/invitations.routes";
import { rolesRouter } from "../modules/roles/roles.routes";
import { permissionsRouter } from "../modules/permissions/permissions.routes";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/members", membersRouter);
apiRouter.use("/organizations", organizationsRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("invitations", invitationsRouter);
apiRouter.use("roles", rolesRouter);
apiRouter.use("/permissions", permissionsRouter);
