import { PrismaClient, Role, LeadStage, LeadPriority, InteractionType, ReminderType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Starting seed...')

  // ── 1. Upsert Organization ─────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'solobuild' },
    update: {},
    create: { name: 'SoloBuild', slug: 'solobuild' },
  })
  console.log('✅ Organization:', org.name)

  // ── 2. Upsert Users ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10)

  const ceo = await prisma.user.upsert({
    where: { email: 'solobuildceo@gmail.com' },
    update: {},
    create: {
      name: 'Arjun Mehta',
      email: 'solobuildceo@gmail.com',
      password: passwordHash,
      initials: 'AM',
      role: Role.ORG_ADMIN,
      organizationId: org.id,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'solobuildmanager@gmail.com' },
    update: {},
    create: {
      name: 'Rahul Verma',
      email: 'solobuildmanager@gmail.com',
      password: passwordHash,
      initials: 'RV',
      role: Role.MANAGER,
      organizationId: org.id,
      managerId: ceo.id,
    },
  })

  const worker1 = await prisma.user.upsert({
    where: { email: 'solobuildworker@gmail.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'solobuildworker@gmail.com',
      password: passwordHash,
      initials: 'PS',
      role: Role.SALES_REP,
      organizationId: org.id,
      managerId: manager.id,
    },
  })

  const worker2 = await prisma.user.upsert({
    where: { email: 'solobuildworker2@gmail.com' },
    update: {},
    create: {
      name: 'Sneha Kapoor',
      email: 'solobuildworker2@gmail.com',
      password: passwordHash,
      initials: 'SK',
      role: Role.SALES_REP,
      organizationId: org.id,
      managerId: manager.id,
    },
  })
  console.log('✅ Users seeded: CEO, Manager, Worker1, Worker2')

  // ── 3. LeadSources ─────────────────────────────────────────────────────────
  const sources = await Promise.all([
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Direct Referral', organizationId: org.id } }, update: {}, create: { name: 'Direct Referral', organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Website Lead', organizationId: org.id } }, update: {}, create: { name: 'Website Lead', organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'LinkedIn', organizationId: org.id } }, update: {}, create: { name: 'LinkedIn', organizationId: org.id } }),
    prisma.leadSource.upsert({ where: { name_organizationId: { name: 'Meta Ads', organizationId: org.id } }, update: {}, create: { name: 'Meta Ads', organizationId: org.id } }),
  ])
  const [refSource, webSource, linkedinSource, metaSource] = sources

  // ── 4. PipelineStages ──────────────────────────────────────────────────────
  await Promise.all([
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'New', organizationId: org.id } }, update: {}, create: { name: 'New', orderIndex: 1, colorClass: 'bg-blue-100 text-blue-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Contacted', organizationId: org.id } }, update: {}, create: { name: 'Contacted', orderIndex: 2, colorClass: 'bg-cyan-100 text-cyan-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Proposal', organizationId: org.id } }, update: {}, create: { name: 'Proposal', orderIndex: 3, colorClass: 'bg-amber-100 text-amber-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Negotiation', organizationId: org.id } }, update: {}, create: { name: 'Negotiation', orderIndex: 4, colorClass: 'bg-orange-100 text-orange-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Won', organizationId: org.id } }, update: {}, create: { name: 'Won', orderIndex: 5, colorClass: 'bg-green-100 text-green-700', organizationId: org.id } }),
    prisma.pipelineStage.upsert({ where: { name_organizationId: { name: 'Lost', organizationId: org.id } }, update: {}, create: { name: 'Lost', orderIndex: 6, colorClass: 'bg-red-100 text-red-700', organizationId: org.id } }),
  ])
  console.log('✅ Pipeline stages seeded')

  // ── 5. Leads: 3 for worker1, 3 for worker2 ─────────────────────────────────
  // Worker 1 leads
  const lead1 = await prisma.lead.create({
    data: {
      contactName: 'Rohit Sharma',
      company: 'Sharma Industries',
      email: 'rohit.sharma@sharmaindustries.com',
      phone: '+91 98765 43210',
      organizationId: org.id,
      ownerId: worker1.id,
      createdById: manager.id,
      stage: LeadStage.NEGOTIATION,
      priority: LeadPriority.HIGH,
      dealValueInr: 420000,
      sourceId: refSource.id,
      followUpAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h from now
    },
  })

  const lead2 = await prisma.lead.create({
    data: {
      contactName: 'Amit Kumar',
      company: 'Kumar Enterprises',
      email: 'amit.kumar@kumarent.com',
      phone: '+91 99887 76655',
      organizationId: org.id,
      ownerId: worker1.id,
      createdById: manager.id,
      stage: LeadStage.PROPOSAL_SENT,
      priority: LeadPriority.MEDIUM,
      dealValueInr: 650000,
      sourceId: webSource.id,
      followUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    },
  })

  const lead3 = await prisma.lead.create({
    data: {
      contactName: 'Vikas Singh',
      company: 'Singh Traders',
      email: 'vikas.singh@singhtraders.in',
      phone: '+91 88990 11223',
      organizationId: org.id,
      ownerId: worker1.id,
      createdById: ceo.id,
      stage: LeadStage.NEW,
      priority: LeadPriority.LOW,
      dealValueInr: 310000,
      sourceId: metaSource.id,
    },
  })

  // Worker 2 leads
  const lead4 = await prisma.lead.create({
    data: {
      contactName: 'Priya Patel',
      company: 'Patel & Co.',
      email: 'priya@patelco.in',
      phone: '+91 91234 56780',
      organizationId: org.id,
      ownerId: worker2.id,
      createdById: manager.id,
      stage: LeadStage.PROPOSAL_SENT,
      priority: LeadPriority.HIGH,
      dealValueInr: 280000,
      sourceId: linkedinSource.id,
      followUpAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  })

  const lead5 = await prisma.lead.create({
    data: {
      contactName: 'Sneha Choudhary',
      company: 'Choudhary Solutions',
      email: 'sneha.c@csolutions.com',
      phone: '+91 98712 34567',
      organizationId: org.id,
      ownerId: worker2.id,
      createdById: manager.id,
      stage: LeadStage.CONTACTED,
      priority: LeadPriority.MEDIUM,
      dealValueInr: 190000,
      sourceId: refSource.id,
      followUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  })

  const lead6 = await prisma.lead.create({
    data: {
      contactName: 'Karan Prasad',
      company: 'Prasad Corp',
      email: 'karan.p@prasadcorp.com',
      phone: '+91 98345 67890',
      organizationId: org.id,
      ownerId: worker2.id,
      createdById: ceo.id,
      stage: LeadStage.QUALIFIED,
      priority: LeadPriority.HIGH,
      dealValueInr: 510000,
      sourceId: webSource.id,
      followUpAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    },
  })
  console.log('✅ 6 leads seeded (3 each for worker1, worker2)')

  // ── 6. Notes on leads ──────────────────────────────────────────────────────
  await prisma.note.createMany({
    data: [
      {
        leadId: lead1.id,
        userId: worker1.id,
        organizationId: org.id,
        content: 'Had a detailed call with Rohit. He is keen on the Enterprise ERP bundle. Main concern is the setup timeline — wants everything live before Q3. Need to send a revised proposal by EOD Friday.',
      },
      {
        leadId: lead1.id,
        userId: worker1.id,
        organizationId: org.id,
        content: 'Follow-up call confirmed for tomorrow 3 PM. He mentioned budget is flexible if we can guarantee the Q3 deadline.',
      },
      {
        leadId: lead2.id,
        userId: worker1.id,
        organizationId: org.id,
        content: 'Sent the Sales Automation proposal. Amit reviewed it and has some questions about the API integration cost. Scheduled a demo call for next week.',
      },
      {
        leadId: lead4.id,
        userId: worker2.id,
        organizationId: org.id,
        content: 'Priya is very interested in the Cloud Storage plan. She compared us with a competitor — our pricing is ₹20k higher but our support SLA is better. Preparing a comparison doc.',
      },
      {
        leadId: lead5.id,
        userId: worker2.id,
        organizationId: org.id,
        content: 'Initial call done. Sneha wants a basic CRM solution for 5 users. Sent an email with the Starter plan details. Awaiting response.',
      },
      {
        leadId: lead6.id,
        userId: worker2.id,
        organizationId: org.id,
        content: 'Karan is evaluating Cloud Infrastructure vendors. Our offer is strong but he is waiting for approval from the CTO. Check back in 3 days.',
      },
    ],
  })
  console.log('✅ Notes seeded')

  // ── 7. Interactions ────────────────────────────────────────────────────────
  const int1 = await prisma.interaction.create({
    data: {
      leadId: lead1.id,
      userId: worker1.id,
      organizationId: org.id,
      type: InteractionType.CALL,
      summary: 'Introductory call — discussed ERP requirements and timeline.',
      durationMin: 28,
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.interaction.create({
    data: {
      leadId: lead2.id,
      userId: worker1.id,
      organizationId: org.id,
      type: InteractionType.EMAIL,
      summary: 'Sent Sales Automation proposal document.',
      occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  })
  await prisma.interaction.create({
    data: {
      leadId: lead4.id,
      userId: worker2.id,
      organizationId: org.id,
      type: InteractionType.WHATSAPP,
      summary: 'Priya asked for a pricing comparison document over WhatsApp.',
      occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  })
  console.log('✅ Interactions seeded')

  // ── 8. Reminders — overdue, today, upcoming mix ────────────────────────────
  const now = new Date()

  // Helper to make a relative date
  const rel = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000)

  await prisma.reminder.createMany({
    data: [
      // ── OVERDUE (negative hours = in the past) ──
      {
        leadId: lead3.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.CALL,
        scheduledAt: rel(-26),    // yesterday
        description: 'Missed call with Vikas Singh — urgent re-engage needed',
        status: 'PENDING',
      },
      {
        leadId: lead4.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.EMAIL,
        scheduledAt: rel(-3),     // 3 hours ago
        description: 'Overdue: Send pricing doc to Priya Patel',
        status: 'PENDING',
      },

      // ── TODAY (positive hours within 0–12h) ──
      {
        leadId: lead1.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.CALL,
        scheduledAt: rel(2),
        description: 'Follow-up call with Rohit Sharma re: ERP proposal timeline',
        status: 'PENDING',
      },
      {
        leadId: lead5.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.WHATSAPP,
        scheduledAt: rel(4),
        description: 'WhatsApp check-in with Sneha Choudhary on Starter plan',
        status: 'PENDING',
      },
      {
        leadId: lead2.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.EMAIL,
        scheduledAt: rel(6),
        description: 'Send API cost breakdown email to Amit Kumar',
        status: 'PENDING',
      },
      {
        leadId: lead6.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.MEETING,
        scheduledAt: rel(8),
        description: 'Virtual demo session with Karan Prasad team',
        status: 'PENDING',
      },

      // ── UPCOMING (tomorrow and beyond) ──
      {
        leadId: lead1.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.MEETING,
        scheduledAt: rel(28),     // tomorrow
        description: 'In-person meeting with Rohit Sharma to sign proposal',
        status: 'PENDING',
      },
      {
        leadId: lead4.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.CALL,
        scheduledAt: rel(30),     // tomorrow
        description: 'Final pricing call with Priya Patel',
        status: 'PENDING',
      },
      {
        leadId: lead2.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.EMAIL,
        scheduledAt: rel(48),     // 2 days out
        description: 'Send revised proposal v2 to Amit Kumar',
        status: 'PENDING',
      },
      {
        leadId: lead5.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.EMAIL,
        scheduledAt: rel(72),     // 3 days out
        description: 'Chase Sneha Choudhary for Starter plan decision',
        status: 'PENDING',
      },
      {
        leadId: lead6.id,
        userId: worker2.id,
        organizationId: org.id,
        type: ReminderType.WHATSAPP,
        scheduledAt: rel(96),     // 4 days out
        description: 'WhatsApp follow-up on CTO approval from Karan Prasad',
        status: 'PENDING',
      },
      {
        leadId: lead3.id,
        userId: worker1.id,
        organizationId: org.id,
        type: ReminderType.CALL,
        scheduledAt: rel(120),    // 5 days out
        description: 'Re-engage Vikas Singh after budget review',
        status: 'PENDING',
      },
    ],
  })
  console.log('✅ Reminders seeded (overdue / today / upcoming)')


  // ── 9. Alerts ──────────────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      {
        userId: worker1.id,
        organizationId: org.id,
        leadId: lead1.id,
        type: 'FOLLOW_UP_DUE',
        title: 'Follow-up Due: Rohit Sharma',
        body: 'Your follow-up with Rohit Sharma from Sharma Industries is due in 2 hours.',
      },
      {
        userId: worker2.id,
        organizationId: org.id,
        leadId: lead4.id,
        type: 'LEAD_ASSIGNED',
        title: 'New Lead Assigned: Priya Patel',
        body: 'You have been assigned Priya Patel from Patel & Co.',
      },
      {
        userId: manager.id,
        organizationId: org.id,
        type: 'STAGE_CHANGED',
        title: 'Lead Stage Changed',
        body: 'Karan Prasad moved from Contacted to Qualified by Sneha Kapoor.',
      },
    ],
  })
  console.log('✅ Alerts seeded')

  console.log('\n🎉 Seed complete!')
  console.log('   CEO:      solobuildceo@gmail.com / password123')
  console.log('   Manager:  solobuildmanager@gmail.com / password123')
  console.log('   Worker 1: solobuildworker@gmail.com / password123')
  console.log('   Worker 2: solobuildworker2@gmail.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
