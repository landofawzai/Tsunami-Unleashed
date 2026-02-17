// Pillar Configuration
// Central config for all 6 pillars — enabled flag controls live vs placeholder

export interface PillarConfig {
  id: string
  number: number
  name: string
  shortName: string
  description: string
  color: string
  gradient: string
  appPort: number
  nginxPort: number
  pm2Name: string
  enabled: boolean
  externalUrl: string
  internalUrl: string
  statsEndpoint: string
  alertsEndpoint: string
  plannedFeatures?: string[]
}

export const PILLARS: PillarConfig[] = [
  {
    id: 'creation',
    number: 1,
    name: 'Content Creation',
    shortName: 'Creation',
    description: 'Source content production — sermons, teachings, articles, study guides, testimonies',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #047857)',
    appPort: 3003,
    nginxPort: 3082,
    pm2Name: 'tsunami-creation',
    enabled: true,
    externalUrl: 'http://5.78.183.112:3082',
    internalUrl: process.env.PILLAR_CREATION_URL || 'http://localhost:3003',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
  },
  {
    id: 'repurposing',
    number: 2,
    name: 'Content Repurposing',
    shortName: 'Repurposing',
    description: 'Transform 1 sermon into 500+ derivatives across multiple languages',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
    appPort: 3002,
    nginxPort: 3080,
    pm2Name: 'tsunami-repurposing',
    enabled: true,
    externalUrl: 'http://5.78.183.112:3080',
    internalUrl: process.env.PILLAR_REPURPOSING_URL || 'http://localhost:3002',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
  },
  {
    id: 'distribution',
    number: 3,
    name: 'Distribution',
    shortName: 'Distribution',
    description: '4-tier distribution across platforms — RSS-first, persecution-resistant',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    appPort: 3000,
    nginxPort: 80,
    pm2Name: 'tsunami-dashboard',
    enabled: true,
    externalUrl: 'http://5.78.183.112',
    internalUrl: process.env.PILLAR_DISTRIBUTION_URL || 'http://localhost:3000',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
  },
  {
    id: 'communication',
    number: 4,
    name: 'Communication',
    shortName: 'Communication',
    description: 'Intelligent intake/triage — email, WhatsApp, Telegram, SMS campaigns',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    appPort: 3001,
    nginxPort: 3081,
    pm2Name: 'tsunami-communication',
    enabled: true,
    externalUrl: 'http://5.78.183.112:3081',
    internalUrl: process.env.PILLAR_COMMUNICATION_URL || 'http://localhost:3001',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
  },
  {
    id: 'administration',
    number: 5,
    name: 'Administration',
    shortName: 'Admin',
    description: 'Self-running operational systems — Pillar 5',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    appPort: 3005,
    nginxPort: 3084,
    pm2Name: 'tsunami-admin',
    enabled: false,
    externalUrl: 'http://5.78.183.112:3084',
    internalUrl: 'http://localhost:3005',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
    plannedFeatures: [
      'Financial tracking & reporting',
      'Team scheduling & availability',
      'Resource management',
      'Automated compliance checks',
    ],
  },
  {
    id: 'discipling',
    number: 6,
    name: 'Discipling',
    shortName: 'Discipling',
    description: 'Household-based coaching & disciple multiplication — Pillar 6',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    appPort: 3006,
    nginxPort: 3085,
    pm2Name: 'tsunami-discipling',
    enabled: false,
    externalUrl: 'http://5.78.183.112:3085',
    internalUrl: 'http://localhost:3006',
    statsEndpoint: '/api/dashboard/stats',
    alertsEndpoint: '/api/dashboard/alerts',
    plannedFeatures: [
      'Disciple tracking & progress',
      'Household group management',
      'Coaching workflows',
      'Multiplication metrics',
    ],
  },
]

export const ENABLED_PILLARS = PILLARS.filter((p) => p.enabled)
export const PLACEHOLDER_PILLARS = PILLARS.filter((p) => !p.enabled)

export function getPillar(id: string): PillarConfig | undefined {
  return PILLARS.find((p) => p.id === id)
}
