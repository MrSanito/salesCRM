// Quick script: clear old reminders and add the full new set
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)

import { PrismaClient, ReminderType } from '@prisma/client'
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🔄 Refreshing reminders...')

  // Get org and users
  const org = await prisma.organization.findFirst({ where: { slug: 'solobuild' } })
  if (!org) { console.error('❌ Org not found'); return }

  const [worker1, worker2] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'solobuildworker@gmail.com' } }),
    prisma.user.findUnique({ where: { email: 'solobuildworker2@gmail.com' } }),
  ])
  if (!worker1 || !worker2) { console.error('❌ Workers not found'); return }

  // Get leads
  const leads = await prisma.lead.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'asc' },
  })
  const [lead1, lead2, lead3, lead4, lead5, lead6] = leads

  // Clear existing reminders
  const deleted = await prisma.reminder.deleteMany({ where: { organizationId: org.id } })
  console.log(`🗑️  Deleted ${deleted.count} old reminders`)

  const now = new Date()
  const rel = (h: number) => new Date(now.getTime() + h * 3600000)

  await prisma.reminder.createMany({
    data: [
      // OVERDUE
      { leadId: lead3.id, userId: worker1.id, organizationId: org.id, type: ReminderType.CALL,     scheduledAt: rel(-26), description: 'Missed call with Vikas Singh — urgent re-engage needed', status: 'PENDING' },
      { leadId: lead4.id, userId: worker2.id, organizationId: org.id, type: ReminderType.EMAIL,    scheduledAt: rel(-3),  description: 'Overdue: Send pricing comparison doc to Priya Patel',  status: 'PENDING' },

      // TODAY
      { leadId: lead1.id, userId: worker1.id, organizationId: org.id, type: ReminderType.CALL,     scheduledAt: rel(2),   description: 'Follow-up call with Rohit Sharma re: ERP proposal',      status: 'PENDING' },
      { leadId: lead5.id, userId: worker2.id, organizationId: org.id, type: ReminderType.WHATSAPP, scheduledAt: rel(4),   description: 'WhatsApp check-in with Sneha Choudhary on Starter plan',  status: 'PENDING' },
      { leadId: lead2.id, userId: worker1.id, organizationId: org.id, type: ReminderType.EMAIL,    scheduledAt: rel(6),   description: 'Send API cost breakdown email to Amit Kumar',             status: 'PENDING' },
      { leadId: lead6.id, userId: worker2.id, organizationId: org.id, type: ReminderType.MEETING,  scheduledAt: rel(8),   description: 'Virtual demo session with Karan Prasad team',             status: 'PENDING' },

      // UPCOMING
      { leadId: lead1.id, userId: worker1.id, organizationId: org.id, type: ReminderType.MEETING,  scheduledAt: rel(28),  description: 'In-person meeting with Rohit Sharma to sign proposal',    status: 'PENDING' },
      { leadId: lead4.id, userId: worker2.id, organizationId: org.id, type: ReminderType.CALL,     scheduledAt: rel(30),  description: 'Final pricing call with Priya Patel',                     status: 'PENDING' },
      { leadId: lead2.id, userId: worker1.id, organizationId: org.id, type: ReminderType.EMAIL,    scheduledAt: rel(48),  description: 'Send revised proposal v2 to Amit Kumar',                 status: 'PENDING' },
      { leadId: lead5.id, userId: worker2.id, organizationId: org.id, type: ReminderType.EMAIL,    scheduledAt: rel(72),  description: 'Chase Sneha Choudhary for Starter plan decision',         status: 'PENDING' },
      { leadId: lead6.id, userId: worker2.id, organizationId: org.id, type: ReminderType.WHATSAPP, scheduledAt: rel(96),  description: 'WhatsApp follow-up on CTO approval from Karan Prasad',    status: 'PENDING' },
      { leadId: lead3.id, userId: worker1.id, organizationId: org.id, type: ReminderType.CALL,     scheduledAt: rel(120), description: 'Re-engage Vikas Singh after budget review meeting',       status: 'PENDING' },
    ],
  })

  console.log('✅ 12 reminders created: 2 overdue, 4 today, 6 upcoming')
  console.log('🎉 Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
