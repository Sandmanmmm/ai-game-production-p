export interface GameProject {
  id: string
  title: string
  description: string
  prompt: string
  status: 'concept' | 'development' | 'testing' | 'complete'
  progress: number
  createdAt: string
  updatedAt: string
  thumbnail?: string
  pipeline: PipelineStage[]
  story?: StoryLoreContent
  assets?: AssetCollection
  gameplay?: GameplayContent
  qa?: QAContent
  publishing?: PublishingContent
}

export interface PipelineStage {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'complete' | 'blocked'
  progress: number
  order: number
  dependencies?: string[]
  estimatedHours?: number
  actualHours?: number
}

export interface Character {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'npc'
  description: string
  backstory?: string
  attributes?: Record<string, any>
}

export interface AssetCollection {
  art: ArtAsset[]
  audio: AudioAsset[]
  models: ModelAsset[]
  ui: UIAsset[]
}

export interface ArtAsset {
  id: string
  name: string
  type: 'concept' | 'sprite' | 'texture' | 'ui' | 'environment' | 'character' | 'prop'
  category: 'character' | 'environment' | 'prop' | 'ui' | 'concept'
  status: 'requested' | 'in-progress' | 'review' | 'approved'
  src?: string
  thumbnail?: string
  prompt?: string
  style?: string
  resolution?: string
  format?: string
  variations?: string[]
  linkedTo?: string[]
  tags: string[]
  metadata?: AssetMetadata
}

export interface AudioAsset {
  id: string
  name: string
  type: 'music' | 'sfx' | 'voice' | 'ambient'
  category: 'music' | 'sound-fx' | 'voice-lines' | 'ambient'
  status: 'requested' | 'in-progress' | 'review' | 'approved'
  src?: string
  duration?: number
  waveform?: string
  prompt?: string
  style?: string
  bpm?: number
  key?: string
  variations?: string[]
  linkedTo?: string[]
  tags: string[]
  metadata?: AssetMetadata
}

export interface ModelAsset {
  id: string
  name: string
  type: '2d' | '3d' | 'animation'
  category: 'character' | 'prop' | 'environment' | 'effect'
  status: 'requested' | 'in-progress' | 'review' | 'approved'
  src?: string
  thumbnail?: string
  polyCount?: number
  prompt?: string
  style?: string
  format?: string
  variations?: string[]
  linkedTo?: string[]
  tags: string[]
  metadata?: AssetMetadata
}

export interface UIAsset {
  id: string
  name: string
  type: 'icon' | 'button' | 'panel' | 'hud' | 'effect'
  category: 'interface' | 'hud' | 'menu' | 'icon'
  status: 'requested' | 'in-progress' | 'review' | 'approved'
  src?: string
  thumbnail?: string
  prompt?: string
  style?: string
  resolution?: string
  format?: string
  variations?: string[]
  linkedTo?: string[]
  tags: string[]
  metadata?: AssetMetadata
}

export interface AssetMetadata {
  createdAt: string
  updatedAt: string
  usageCount: number
  collections: string[]
  quality: 'draft' | 'good' | 'excellent'
  aiGenerated: boolean
  originalPrompt?: string
}

export interface AssetStudioContent {
  collections: AssetCollection[]
  recentAssets: string[]
  favoriteAssets: string[]
  customCollections: CustomAssetCollection[]
  generationHistory: GenerationHistoryItem[]
}

export interface CustomAssetCollection {
  id: string
  name: string
  description?: string
  assetIds: string[]
  color?: string
  createdAt: string
}

export interface GenerationHistoryItem {
  id: string
  prompt: string
  style?: string
  type: 'art' | 'audio' | 'model' | 'ui'
  category: string
  resultAssetId?: string
  timestamp: string
  success: boolean
}

export interface AssetGenerationParams {
  prompt: string
  type: 'art' | 'audio' | 'model' | 'ui'
  category: string
  style?: string
  resolution?: string
  format?: string
  quantity?: number
  seed?: number
}

export interface GameplayContent {
  mechanics: GameMechanic[]
  levels: Level[]
  balancing: BalanceConfig
}

export interface GameMechanic {
  id: string
  name: string
  description: string
  complexity: 'simple' | 'medium' | 'complex'
  implemented: boolean
  dependencies?: string[]
}

export interface Level {
  id: string
  name: string
  difficulty: number
  objectives: string[]
  mechanics: string[]
  estimated_playtime: number
  status: 'design' | 'prototype' | 'complete'
}

export interface BalanceConfig {
  difficulty_curve: number[]
  player_progression: Record<string, any>
  economy?: Record<string, any>
}

export interface QAContent {
  testPlans: TestPlan[]
  bugs: Bug[]
  metrics: QAMetrics
}

export interface TestPlan {
  id: string
  name: string
  type: 'functional' | 'performance' | 'usability' | 'compatibility'
  status: 'planned' | 'in-progress' | 'complete'
  testCases: TestCase[]
}

export interface TestCase {
  id: string
  description: string
  steps: string[]
  expected: string
  status: 'pass' | 'fail' | 'blocked' | 'pending'
}

export interface Bug {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  description: string
  steps: string[]
  assignee?: string
}

export interface QAMetrics {
  test_coverage: number
  bug_count: number
  resolved_bugs: number
  performance_score: number
}

export interface PublishingContent {
  platforms: Platform[]
  marketing: MarketingContent
  distribution: DistributionPlan
  monetization: MonetizationStrategy
}

export interface Platform {
  id: string
  name: string
  status: 'planned' | 'development' | 'submitted' | 'published'
  requirements: string[]
  certification_status?: string
}

export interface MarketingContent {
  tagline: string
  description: string
  screenshots: string[]
  trailer?: string
  key_features: string[]
  target_demographics: string[]
}

export interface DistributionPlan {
  release_date?: string
  pricing_strategy: 'free' | 'premium' | 'freemium' | 'subscription'
  launch_strategy: string[]
  post_launch_support: string[]
}

export interface MonetizationStrategy {
  model: 'one-time' | 'freemium' | 'subscription' | 'ads' | 'dlc'
  pricing: Record<string, number>
  revenue_projections?: Record<string, number>
}

export interface AIAssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: 'general' | 'story' | 'assets' | 'gameplay' | 'qa' | 'publishing'
}

export interface NavigationSection {
  id: string
  name: string
  icon: React.ComponentType<any>
  path: string
  badge?: string | number
}

// Extended Story & Lore Types
export interface StoryLoreContent {
  worldLore: WorldLore
  mainStoryArc: MainStoryArc
  chapters: StoryChapter[]
  characters: StoryCharacter[]
  factions: StoryFaction[]
  subplots: Subplot[]
  timeline: TimelineEvent[]
  metadata: StoryMetadata
}

export interface WorldLore {
  id: string
  name: string
  geography: string
  politics: string
  culture: string
  history: string
  technology: string
  magic: string
}

export interface MainStoryArc {
  id: string
  title: string
  description: string
  acts: StoryAct[]
  themes: string[]
  tone: 'dark' | 'serious' | 'balanced' | 'light' | 'humorous'
}

export interface StoryAct {
  id: string
  name: string
  description: string
  chapters: string[]
  climax?: string
}

export interface StoryChapter {
  id: string
  title: string
  description: string
  content: string
  order: number
  status: 'draft' | 'review' | 'complete'
  characters: string[]
  locations: string[]
  objectives: string[]
}

export interface StoryCharacter {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'npc'
  description: string
  backstory?: string
  motivation?: string
  arc?: string
  relationships: CharacterRelationship[]
  traits?: CharacterTraits
  portrait?: string
}

export interface CharacterTraits {
  courage: number
  intelligence: number
  charisma: number
  loyalty: number
  ambition: number
  empathy: number
}

export interface CharacterRelationship {
  targetId: string
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'mentor'
  strength: number
  description?: string
}

export interface StoryFaction {
  id: string
  name: string
  description: string
  goals: string[]
  resources: string[]
  members: string[]
  relationships: FactionRelationship[]
  power: number
  influence: string[]
}

export interface FactionRelationship {
  targetId: string
  type: 'allied' | 'enemy' | 'neutral' | 'rival' | 'subordinate'
  strength: number
  description?: string
}

export interface Subplot {
  id: string
  title: string
  description: string
  characters: string[]
  resolution?: string
  impact: 'minor' | 'moderate' | 'major'
  status: 'planned' | 'active' | 'resolved'
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  type: 'backstory' | 'main-story' | 'subplot' | 'world-event'
  characters?: string[]
  factions?: string[]
  consequences?: string[]
}

export interface StoryMetadata {
  genre: string
  targetAudience: string
  complexity: 'simple' | 'medium' | 'complex'
  estimatedLength: 'short' | 'medium' | 'long' | 'epic'
  themes: string[]
  contentWarnings?: string[]
}

export interface GameAsset {
  id: string
  name: string
  type: 'image' | 'audio' | 'model' | 'text' | 'code'
  url: string
  description: string
  metadata: Record<string, any>
  tags: string[]
  createdAt: string
}