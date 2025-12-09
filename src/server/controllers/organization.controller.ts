import { db } from "@/db/connect";
import { teamMember, team, member, user, organization } from "@/db/schema/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export type OrgRole = "owner" | "admin" | "member";

interface TeamMemberFormatted {
  id: string;
  userId: string;
  teamId: string;
  createdAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamWithMemberCount {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date | null;
  memberCount: number;
}

interface OrgMemberFormatted {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export const organizationController = {
  /**
   * Get user's membership in an organization
   */
  async getUserMembership(userId: string, organizationId: string) {
    const [membership] = await db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId)
        )
      )
      .limit(1);

    return membership;
  },

  /**
   * Check if a team belongs to an organization
   */
  async verifyTeamInOrganization(teamId: string, organizationId: string) {
    const [teamRecord] = await db
      .select({ id: team.id })
      .from(team)
      .where(
        and(
          eq(team.id, teamId),
          eq(team.organizationId, organizationId)
        )
      )
      .limit(1);

    return teamRecord;
  },

  /**
   * Get all members of a team with user info
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberFormatted[]> {
    const teamMembers = await db
      .select({
        id: teamMember.id,
        userId: teamMember.userId,
        teamId: teamMember.teamId,
        createdAt: teamMember.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(teamMember)
      .innerJoin(user, eq(teamMember.userId, user.id))
      .where(eq(teamMember.teamId, teamId));

    return teamMembers.map((tm) => ({
      id: tm.id,
      userId: tm.userId,
      teamId: tm.teamId,
      createdAt: tm.createdAt,
      user: {
        id: tm.userId,
        name: tm.userName,
        email: tm.userEmail,
        image: tm.userImage,
      },
    }));
  },

  /**
   * Get all teams for an organization with member counts
   */
  async getOrganizationTeams(organizationId: string): Promise<TeamWithMemberCount[]> {
    const teams = await db
      .select({
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })
      .from(team)
      .where(eq(team.organizationId, organizationId));

    const teamsWithCounts = await Promise.all(
      teams.map(async (t) => {
        const members = await db
          .select({ id: teamMember.id })
          .from(teamMember)
          .where(eq(teamMember.teamId, t.id));

        return {
          ...t,
          memberCount: members.length,
        };
      })
    );

    return teamsWithCounts;
  },

  /**
   * Get all members of an organization with user info
   */
  async getOrganizationMembers(organizationId: string): Promise<OrgMemberFormatted[]> {
    const members = await db
      .select({
        id: member.id,
        userId: member.userId,
        organizationId: member.organizationId,
        role: member.role,
        createdAt: member.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
      createdAt: m.createdAt,
      user: {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
      },
    }));
  },

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string) {
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    return org;
  },

  /**
   * Get all organizations a user is a member of
   */
  async getUserOrganizations(userId: string) {
    const memberships = await db
      .select({
        organizationId: member.organizationId,
        role: member.role,
        createdAt: member.createdAt,
        orgName: organization.name,
        orgSlug: organization.slug,
        orgLogo: organization.logo,
        orgCreatedAt: organization.createdAt,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));

    return memberships.map((m) => ({
      id: m.organizationId,
      name: m.orgName,
      slug: m.orgSlug,
      logo: m.orgLogo,
      createdAt: m.orgCreatedAt,
      membership: {
        role: m.role,
        joinedAt: m.createdAt,
      },
    }));
  },

  /**
   * Check if user can manage organization (owner or admin)
   */
  async canManageOrganization(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.getUserMembership(userId, organizationId);
    return membership?.role === "owner" || membership?.role === "admin";
  },

  /**
   * Create a new team in an organization
   */
  async createTeam(organizationId: string, name: string) {
    const [newTeam] = await db
      .insert(team)
      .values({
        id: nanoid(),
        name,
        organizationId,
        createdAt: new Date(),
      })
      .returning();

    return newTeam;
  },

  /**
   * Add a user to a team
   */
  async addTeamMember(teamId: string, userId: string) {
    // Check if already a member
    const [existing] = await db
      .select()
      .from(teamMember)
      .where(
        and(
          eq(teamMember.teamId, teamId),
          eq(teamMember.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return { error: "User is already a member of this team", status: 400 };
    }

    const [newMember] = await db
      .insert(teamMember)
      .values({
        id: nanoid(),
        teamId,
        userId,
        createdAt: new Date(),
      })
      .returning();

    return newMember;
  },

  /**
   * Remove a user from a team
   */
  async removeTeamMember(teamId: string, memberId: string) {
    const [deleted] = await db
      .delete(teamMember)
      .where(eq(teamMember.id, memberId))
      .returning();

    return deleted;
  },

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string) {
    // First delete all team members
    await db
      .delete(teamMember)
      .where(eq(teamMember.teamId, teamId));

    // Then delete the team
    const [deleted] = await db
      .delete(team)
      .where(eq(team.id, teamId))
      .returning();

    return deleted;
  },

  /**
   * Update team name
   */
  async updateTeam(teamId: string, name: string) {
    const [updated] = await db
      .update(team)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId))
      .returning();

    return updated;
  },
};
