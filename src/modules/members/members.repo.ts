import { db } from "../../database";
import { CreateMemberShipInput, MemberShip } from "./members.types";

export const createMemberShip = async (
  data: CreateMemberShipInput,
): Promise<MemberShip> => {
  const newMemberShip = await db
    .insertInto("memberships")
    .values(data)
    .returning([
      "id",
      "user_id",
      "organization_id",
      "role_id",
      "status",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirstOrThrow();

  return newMemberShip;
};

export const getMembershipsByUserId = async (userId: string) => {
  return await db
    .selectFrom("memberships")
    .where("user_id", "=", userId)
    .select([
      "id",
      "user_id",
      "organization_id",
      "role_id",
      "status",
      "created_at",
      "updated_at",
    ])
    .execute();
};
