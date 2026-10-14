import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('→ Nettoyage des anciennes donnees de demonstration...')

  // IMPORTANT: On supprime les enfants AVANT les parents
  await prisma.encaissementEcolage.deleteMany()
  await prisma.trancheEcolage.deleteMany()
  await prisma.eleve.deleteMany()
  await prisma.employe.deleteMany()
  await prisma.contribution.deleteMany()
  await prisma.tontine.deleteMany()
  await prisma.webhookLog.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.client.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.payment.deleteMany().catch(() => { })
  await prisma.message.deleteMany().catch(() => { })

  console.log('→ Creation du compte proprietaire...')

  const hashedPatron = await bcrypt.hash('patron2026', 10)
  const hashedDemo = await bcrypt.hash('demo2026', 10)

  // Organisation Patron (Toi)
  const orgPatron = await prisma.organization.create({
    data: {
      id: 'org-patron-mb',
      name: 'MB Mustapha - Patron',
      country: 'TD',
      city: "N'Djamena",
      currency: 'XAF',
      plan: 'enterprise',
      planStatus: 'active',
      phone: '+237651465708',
      contactEmail: 'mustaphamahamat98@gmail.com',
      vatRate: 19.25,
    }
  })

  await prisma.user.create({
    data: {
      name: 'Mustapha Mahamat Bouba',
      email: 'mustaphamahamat98@gmail.com',
      password: hashedPatron,
      phone: '+237651465708',
      role: 'owner',
      orgId: orgPatron.id
    }
  })

  console.log('→ Creation des entreprises clientes...')

  // Organisation Demo Client
  const orgDemo = await prisma.organization.create({
    data: {
      id: 'org-demo-tchad',
      name: "N'Djamena Distribution SARL",
      country: 'TD',
      city: "N'Djamena",
      currency: 'XAF',
      plan: 'pro',
      planStatus: 'active',
      phone: '+23566112233',
      contactEmail: 'demo@mbmustapha.com',
      vatRate: 18,
    }
  })

  await prisma.user.create({
    data: {
      name: 'Client Demo',
      email: 'demo@mbmustapha.com',
      password: hashedDemo,
      phone: '+23566112233',
      role: 'owner',
      orgId: orgDemo.id
    }
  })

  // Donnees demo
  await prisma.client.create({
    data: {
      orgId: orgDemo.id,
      name: 'Hotel Sahel',
      phone: '+23522556677',
      city: "N'Djamena",
      type: 'entreprise'
    }
  })

  await prisma.invoice.create({
    data: {
      orgId: orgDemo.id,
      number: 'FAC-2026-0003',
      label: 'Hotel Sahel - Facture',
      amount: 3470000,
      total: 3470000,
      paid: 0,
      status: 'impaye',
      dueDate: new Date()
    }
  })

  console.log('')
  console.log('✅ Base remplie avec succes.')
  console.log('')
  console.log('  Espace prive (vous)     : mustaphamahamat98@gmail.com / patron2026')
  console.log('  Client Tchad           : demo@mbmustapha.com / demo2026')
  console.log('')
}

main()
  .catch(e => {
    console.error('❌ Erreur de remplissage :', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })