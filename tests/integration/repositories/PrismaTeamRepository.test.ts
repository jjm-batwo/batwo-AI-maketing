import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaTeamRepository } from '@infrastructure/database/repositories/PrismaTeamRepository'
import { Team, TeamMember, TeamRole } from '@domain/entities/Team'

describe('PrismaTeamRepository', () => {
    setupIntegrationTest()

    let repository: PrismaTeamRepository
    let testUserId: string
    let testUserEmail: string

    beforeEach(async () => {
        const prisma = getPrismaClient()
        repository = new PrismaTeamRepository(prisma)

        const email = `team-test-${Date.now()}@example.com`
        const user = await createTestUser({ email })
        testUserId = user.id
        testUserEmail = email
    })

    const createTestTeam = (overrides: Partial<Parameters<typeof Team.create>[0]> = {}) => {
        return Team.create({
            name: 'Test Team',
            description: 'A test team',
            ownerId: testUserId,
            ownerEmail: testUserEmail,
            ownerName: 'Test User',
            maxMembers: 10,
            ...overrides,
        })
    }

    describe('save', () => {
        it('should save and return a team with owner', async () => {
            const team = createTestTeam()

            const saved = await repository.save(team)

            expect(saved.id).toBe(team.id)
            expect(saved.name).toBe('Test Team')
            expect(saved.description).toBe('A test team')
            expect(saved.ownerId).toBe(testUserId)
            expect(saved.members).toHaveLength(1)
            expect(saved.members[0].role).toBe('OWNER')
        })

        it('should save team without description', async () => {
            const team = createTestTeam({ description: undefined })

            const saved = await repository.save(team)

            expect(saved.name).toBe('Test Team')
        })
    })

    describe('findById', () => {
        it('should find team by id with members', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const found = await repository.findById(team.id)

            expect(found).not.toBeNull()
            expect(found!.id).toBe(team.id)
            expect(found!.members.length).toBeGreaterThanOrEqual(1)
        })

        it('should return null for non-existent team', async () => {
            const found = await repository.findById('non-existent-id')

            expect(found).toBeNull()
        })
    })

    describe('findByOwnerId', () => {
        it('should find all teams owned by a user', async () => {
            const team1 = createTestTeam({ name: 'Team 1' })
            const team2 = createTestTeam({ name: 'Team 2' })

            await repository.save(team1)
            await repository.save(team2)

            const teams = await repository.findByOwnerId(testUserId)

            expect(teams).toHaveLength(2)
            expect(teams.map(t => t.name)).toEqual(expect.arrayContaining(['Team 1', 'Team 2']))
        })

        it('should return empty array if user owns no teams', async () => {
            const teams = await repository.findByOwnerId('non-owner')

            expect(teams).toHaveLength(0)
        })
    })

    describe('findByMemberUserId', () => {
        it('should find teams where user is a member', async () => {
            const team = createTestTeam()
            await repository.save(team)

            // Owner is also a member
            const teams = await repository.findByMemberUserId(testUserId)

            expect(teams.length).toBeGreaterThanOrEqual(1)
            expect(teams.some(t => t.id === team.id)).toBe(true)
        })
    })

    describe('update', () => {
        it('should update team name', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const updated = team.updateName('Updated Team Name')
            const result = await repository.update(updated)

            expect(result.name).toBe('Updated Team Name')

            const found = await repository.findById(team.id)
            expect(found!.name).toBe('Updated Team Name')
        })

        it('should update team description', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const updated = team.updateDescription('New description')
            const result = await repository.update(updated)

            expect(result.description).toBe('New description')
        })
    })

    describe('delete', () => {
        it('should delete team and its members', async () => {
            const team = createTestTeam()
            await repository.save(team)

            await repository.delete(team.id)

            const found = await repository.findById(team.id)
            expect(found).toBeNull()
        })
    })

    describe('addMember', () => {
        it('should add a new member to the team', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const user2 = await createTestUser({ email: `member-${Date.now()}@example.com` })
            const member = TeamMember.create({
                teamId: team.id,
                userId: user2.id,
                email: user2.email!,
                name: 'New Member',
                role: 'MEMBER' as TeamRole,
            })

            const added = await repository.addMember(member)

            expect(added.teamId).toBe(team.id)
            expect(added.userId).toBe(user2.id)
            expect(added.role).toBe('MEMBER')
        })
    })

    describe('updateMember', () => {
        it('should update member role', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const user2 = await createTestUser({ email: `update-role-${Date.now()}@example.com` })
            const member = TeamMember.create({
                teamId: team.id,
                userId: user2.id,
                email: user2.email!,
                name: 'Member',
                role: 'MEMBER' as TeamRole,
            })
            const added = await repository.addMember(member)

            const updatedMember = added.updateRole('ADMIN' as TeamRole)
            const result = await repository.updateMember(updatedMember)

            expect(result.role).toBe('ADMIN')
        })
    })

    describe('removeMember', () => {
        it('should remove member from team', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const user2 = await createTestUser({ email: `remove-${Date.now()}@example.com` })
            const member = TeamMember.create({
                teamId: team.id,
                userId: user2.id,
                email: user2.email!,
                role: 'MEMBER' as TeamRole,
            })
            await repository.addMember(member)

            await repository.removeMember(team.id, user2.id)

            const found = await repository.findMemberByUserId(team.id, user2.id)
            expect(found).toBeNull()
        })
    })

    describe('findMemberByUserId', () => {
        it('should find member by team and user id', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const found = await repository.findMemberByUserId(team.id, testUserId)

            expect(found).not.toBeNull()
            expect(found!.userId).toBe(testUserId)
            expect(found!.teamId).toBe(team.id)
        })

        it('should return null for non-member', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const found = await repository.findMemberByUserId(team.id, 'non-member-id')

            expect(found).toBeNull()
        })
    })

    describe('findMemberByEmail', () => {
        it('should find member by team and email', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const found = await repository.findMemberByEmail(team.id, testUserEmail)

            expect(found).not.toBeNull()
            expect(found!.email).toBe(testUserEmail)
        })

        it('should return null for unknown email', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const found = await repository.findMemberByEmail(team.id, 'nobody@example.com')

            expect(found).toBeNull()
        })
    })

    describe('findPendingInvitationsByEmail', () => {
        it('should find pending invitations for email', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const invitedEmail = `invited-${Date.now()}@example.com`
            const invitedUser = await createTestUser({ email: invitedEmail })
            const member = TeamMember.create({
                teamId: team.id,
                userId: invitedUser.id,
                email: invitedEmail,
                role: 'MEMBER' as TeamRole,
                invitedBy: testUserId,
            })
            // Not accepted → joinedAt is null (pending)
            await repository.addMember(member)

            const pending = await repository.findPendingInvitationsByEmail(invitedEmail)

            expect(pending.length).toBeGreaterThanOrEqual(1)
            expect(pending.some(m => m.email === invitedEmail)).toBe(true)
        })

        it('should not return accepted invitations', async () => {
            const team = createTestTeam()
            await repository.save(team)

            // Owner's invitation is already accepted (joinedAt is set)
            const pending = await repository.findPendingInvitationsByEmail(testUserEmail)

            expect(pending.every(m => m.joinedAt === undefined || m.joinedAt === null)).toBe(true)
        })
    })

    describe('findMembersByRole', () => {
        it('should find all members with specific role', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const owners = await repository.findMembersByRole(team.id, 'OWNER' as TeamRole)

            expect(owners).toHaveLength(1)
            expect(owners[0].role).toBe('OWNER')
        })

        it('should return empty array for role with no members', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const viewers = await repository.findMembersByRole(team.id, 'VIEWER' as TeamRole)

            expect(viewers).toHaveLength(0)
        })
    })

    describe('findByFilters', () => {
        it('should filter by ownerId', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const teams = await repository.findByFilters({ ownerId: testUserId })

            expect(teams.length).toBeGreaterThanOrEqual(1)
            expect(teams.every(t => t.ownerId === testUserId)).toBe(true)
        })

        it('should filter by memberUserId', async () => {
            const team = createTestTeam()
            await repository.save(team)

            const teams = await repository.findByFilters({ memberUserId: testUserId })

            expect(teams.length).toBeGreaterThanOrEqual(1)
        })
    })
})
