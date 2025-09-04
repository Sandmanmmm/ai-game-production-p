import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Import icons directly to bypass proxy issues
import { Book } from '@phosphor-icons/react/dist/csr/Book'
import { Users } from '@phosphor-icons/react/dist/csr/Users'
import { Crown } from '@phosphor-icons/react/dist/csr/Crown'
import { Sword } from '@phosphor-icons/react/dist/csr/Sword'
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { Target } from '@phosphor-icons/react/dist/csr/Target'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import { Brain } from '@phosphor-icons/react/dist/csr/Brain'
import { Palette } from '@phosphor-icons/react/dist/csr/Palette'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { StoryLoreContent, StoryChapter, StoryCharacter, StoryFaction, WorldLore, StoryContent } from '@/lib/types'
import { generateStoryContent } from '@/lib/aiMockGenerator'
import { generateStory, StoryGenerationRequest, STORY_GENRES, STORY_TONES } from '@/lib/aiAPI'
import { StoryDisplay } from './StoryDisplay'

interface StoryLoreWorkspaceProps {
  projectId?: string
  initialContent?: StoryLoreContent
  projectStory?: StoryContent  // Add support for project story data
  onContentChange?: (content: StoryLoreContent) => void
  className?: string
}

export function StoryLoreWorkspace({ 
  projectId, 
  initialContent, 
  projectStory,
  onContentChange,
  className 
}: StoryLoreWorkspaceProps) {
  const [content, setContent] = useState<StoryLoreContent>(
    initialContent || {
      worldLore: {
        id: 'world-1',
        name: 'World Setting',
        geography: '',
        politics: '',
        culture: '',
        history: '',
        technology: '',
        magic: ''
      },
      mainStoryArc: {
        id: 'main-arc',
        title: 'Main Story',
        description: '',
        acts: [],
        themes: [],
        tone: 'balanced'
      },
      chapters: [],
      characters: [],
      factions: [],
      subplots: [],
      timeline: [],
      metadata: {
        genre: 'adventure',
        targetAudience: 'general',
        complexity: 'medium',
        estimatedLength: 'medium',
        themes: [],
        contentWarnings: []
      }
    }
  )

  const [selectedSection, setSelectedSection] = useState<string>('world-lore')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'huggingface' | 'replicate' | 'local'>('huggingface')

  // Auto-save content changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange(content)
    }
  }, [content, onContentChange])

  const handleGenerateContent = async (prompt: string) => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      const request: StoryGenerationRequest = {
        prompt: prompt,
        gameType: 'RPG', // This could be from project settings
        genre: content.metadata.genre || 'fantasy',
        tone: content.mainStoryArc.tone || 'heroic',
        length: 'medium',
        context: `Current story context: ${content.mainStoryArc.description || 'Starting a new adventure'}`,
        provider: selectedProvider,
      }

      const response = await generateStory(request)
      
      if (response.success && response.data) {
        const generatedText = response.data.story
        
        // Integrate the generated story based on the current context
        if (selectedSection === 'world-lore') {
          setContent(prev => ({
            ...prev,
            worldLore: {
              ...prev.worldLore,
              geography: prev.worldLore.geography + '\n\n' + generatedText
            }
          }))
        } else if (selectedSection === 'main-arc') {
          setContent(prev => ({
            ...prev,
            mainStoryArc: {
              ...prev.mainStoryArc,
              description: prev.mainStoryArc.description + '\n\n' + generatedText
            }
          }))
        } else {
          // Default to expanding the main story arc
          setContent(prev => ({
            ...prev,
            mainStoryArc: {
              ...prev.mainStoryArc,
              description: prev.mainStoryArc.description + '\n\n' + generatedText
            }
          }))
        }
      } else {
        console.error('Failed to generate story:', response.error?.message)
        // Fall back to mock generation
        const generatedContent = await generateStoryContent(prompt, content.metadata.genre)
        setContent(prev => ({
          ...prev,
          ...generatedContent
        }))
      }
    } catch (error) {
      console.error('Failed to generate story content:', error)
      // Fall back to mock generation
      try {
        const generatedContent = await generateStoryContent(prompt, content.metadata.genre)
        setContent(prev => ({
          ...prev,
          ...generatedContent
        }))
      } catch (mockError) {
        console.error('Mock generation also failed:', mockError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSectionSelect = (sectionId: string, itemId?: string) => {
    setSelectedSection(sectionId)
    setSelectedItem(itemId || null)
  }

  const renderLeftSidebar = () => (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Book className="w-5 h-5 text-accent" />
          Story Navigator
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6">
          <div className="space-y-4">
            {/* World Lore Section */}
            <div>
              <Button
                variant={selectedSection === 'world-lore' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleSectionSelect('world-lore')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                World Lore
              </Button>
            </div>

            {/* Main Story Arc */}
            <div>
              <Button
                variant={selectedSection === 'main-arc' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleSectionSelect('main-arc')}
              >
                <Target className="w-4 h-4 mr-2" />
                Main Story Arc
              </Button>
            </div>

            {/* Chapters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Chapters</Label>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1 ml-4">
                {content.chapters.map((chapter, index) => (
                  <Button
                    key={chapter.id}
                    variant={selectedItem === chapter.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleSectionSelect('chapters', chapter.id)}
                  >
                    {index + 1}. {chapter.title || 'Untitled Chapter'}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Characters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Characters
                </Label>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1 ml-4">
                {content.characters.map((character) => (
                  <Button
                    key={character.id}
                    variant={selectedItem === character.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleSectionSelect('characters', character.id)}
                  >
                    <div className="flex items-center gap-2">
                      {character.role === 'protagonist' && <Crown className="w-3 h-3" />}
                      {character.role === 'antagonist' && <Sword className="w-3 h-3" />}
                      {character.role === 'supporting' && <Users className="w-3 h-3" />}
                      <span className="truncate">{character.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Factions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Factions</Label>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1 ml-4">
                {content.factions.map((faction) => (
                  <Button
                    key={faction.id}
                    variant={selectedItem === faction.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleSectionSelect('factions', faction.id)}
                  >
                    <Crown className="w-3 h-3 mr-2" />
                    {faction.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const renderCenterPanel = () => (
    <Card className="flex-1 h-full flex flex-col mx-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkle className="w-6 h-6 text-accent" />
            Story Workspace
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isEditMode ? 'default' : 'outline'}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <FloppyDisk className="w-4 h-4 mr-2" /> : <PencilSimple className="w-4 h-4 mr-2" />}
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
            <Button size="sm" variant="outline">
              <ArrowCounterClockwise className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {renderContentSection()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const renderContentSection = () => {
    switch (selectedSection) {
      case 'world-lore':
        return renderWorldLore()
      case 'main-arc':
        return renderMainStoryArc()
      case 'characters':
        return renderCharacterDetails()
      case 'factions':
        return renderFactionDetails()
      default:
        return renderWorldLore()
    }
  }

  const renderWorldLore = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-primary">World Lore</h3>
        
        <Tabs defaultValue="geography" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="politics">Politics</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="magic">Magic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Geographic Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the world's geography, climate, and key locations..."
                  value={content.worldLore.geography}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    worldLore: { ...prev.worldLore, geography: e.target.value }
                  }))}
                  className="min-h-32"
                  disabled={!isEditMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="politics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Political Landscape</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the political systems, conflicts, and power structures..."
                  value={content.worldLore.politics}
                  onChange={(e) => setContent(prev => ({
                    ...prev,
                    worldLore: { ...prev.worldLore, politics: e.target.value }
                  }))}
                  className="min-h-32"
                  disabled={!isEditMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Add other tabs similarly */}
        </Tabs>
      </motion.div>
    </div>
  )

  const renderMainStoryArc = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-primary">Main Story Arc</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Story Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Story Title</Label>
              <Input
                placeholder="Epic tale of..."
                value={content.mainStoryArc.title}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  mainStoryArc: { ...prev.mainStoryArc, title: e.target.value }
                }))}
                disabled={!isEditMode}
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the main story arc..."
                value={content.mainStoryArc.description}
                onChange={(e) => setContent(prev => ({
                  ...prev,
                  mainStoryArc: { ...prev.mainStoryArc, description: e.target.value }
                }))}
                className="min-h-32"
                disabled={!isEditMode}
              />
            </div>
            
            <div>
              <Label>Tone: {content.mainStoryArc.tone}</Label>
              <Slider
                value={[getToneValue(content.mainStoryArc.tone)]}
                onValueChange={([value]) => setContent(prev => ({
                  ...prev,
                  mainStoryArc: { ...prev.mainStoryArc, tone: getToneFromValue(value) }
                }))}
                max={100}
                step={1}
                className="w-full"
                disabled={!isEditMode}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Dark & Serious</span>
                <span>Balanced</span>
                <span>Light & Humorous</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )

  const renderCharacterDetails = () => {
    if (!selectedItem) return <div>Select a character to view details</div>
    
    const character = content.characters.find(c => c.id === selectedItem)
    if (!character) return <div>Character not found</div>

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-2xl font-bold text-primary">{character.name}</h3>
          
          <Card className="character-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {character.role === 'protagonist' && <Crown className="w-5 h-5 text-yellow-500" />}
                  {character.role === 'antagonist' && <Sword className="w-5 h-5 text-red-500" />}
                  Character Profile
                </CardTitle>
                <Badge variant={character.role === 'protagonist' ? 'default' : 'secondary'}>
                  {character.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Character description..."
                  value={character.description}
                  onChange={(e) => updateCharacter(character.id, 'description', e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
              
              <div>
                <Label>Backstory</Label>
                <Textarea
                  placeholder="Character backstory..."
                  value={character.backstory || ''}
                  onChange={(e) => updateCharacter(character.id, 'backstory', e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
              
              {/* Personality Traits */}
              <div>
                <Label>Personality Traits</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-xs">Courage</Label>
                    <Slider
                      value={[character.traits?.courage || 50]}
                      onValueChange={([value]) => updateCharacterTrait(character.id, 'courage', value)}
                      max={100}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Intelligence</Label>
                    <Slider
                      value={[character.traits?.intelligence || 50]}
                      onValueChange={([value]) => updateCharacterTrait(character.id, 'intelligence', value)}
                      max={100}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Charisma</Label>
                    <Slider
                      value={[character.traits?.charisma || 50]}
                      onValueChange={([value]) => updateCharacterTrait(character.id, 'charisma', value)}
                      max={100}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Loyalty</Label>
                    <Slider
                      value={[character.traits?.loyalty || 50]}
                      onValueChange={([value]) => updateCharacterTrait(character.id, 'loyalty', value)}
                      max={100}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const renderFactionDetails = () => {
    // Similar implementation for factions
    return <div>Faction details coming soon...</div>
  }

  const renderRightSidebar = () => (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          AI Assistant
          {isGenerating && (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="ml-auto"
            >
              <Gear className="w-4 h-4 text-accent" />
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* AI Provider Selection */}
        <div className="space-y-4 mb-4">
          <div>
            <Label className="text-sm">AI Provider</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { value: 'huggingface', label: 'HuggingFace', color: 'orange' },
                { value: 'replicate', label: 'Replicate', color: 'blue' },
                { value: 'local', label: 'Local', color: 'green' }
              ].map(provider => (
                <Button
                  key={provider.value}
                  size="sm"
                  variant={selectedProvider === provider.value ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setSelectedProvider(provider.value as any)}
                  disabled={isGenerating}
                >
                  {provider.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Genre</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {STORY_GENRES.slice(0, 6).map(genre => (
                <Button
                  key={genre}
                  size="sm"
                  variant={content.metadata.genre === genre ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setContent(prev => ({
                    ...prev,
                    metadata: { ...prev.metadata, genre }
                  }))}
                  disabled={isGenerating}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm">Story Tone</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {['dark', 'serious', 'balanced', 'light'].map(tone => (
                <Button
                  key={tone}
                  size="sm"
                  variant={content.mainStoryArc.tone === tone ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setContent(prev => ({
                    ...prev,
                    mainStoryArc: { ...prev.mainStoryArc, tone: tone as any }
                  }))}
                  disabled={isGenerating}
                >
                  {tone}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm">Quick Actions</Label>
            <div className="flex flex-col gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGenerateContent('expand world lore with rich geography, politics, and culture')}
                disabled={isGenerating}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Expand World
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGenerateContent('create a compelling new character with detailed backstory and motivations')}
                disabled={isGenerating}
              >
                <Users className="w-4 h-4 mr-2" />
                Add Character
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGenerateContent('develop an engaging subplot that complements the main story')}
                disabled={isGenerating}
              >
                <Target className="w-4 h-4 mr-2" />
                Create Subplot
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleGenerateContent('add dramatic conflict and tension to the current story')}
                disabled={isGenerating}
              >
                <Sword className="w-4 h-4 mr-2" />
                Add Conflict
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* AI Chat */}
        <div className="flex-1 flex flex-col mt-4">
          <Label className="text-sm mb-2">AI Storytelling Assistant</Label>
          <ScrollArea className="flex-1 border rounded-lg p-3 mb-3 min-h-32">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Ask me anything about your story:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>"Make this more mysterious"</li>
                <li>"Add more character depth"</li>
                <li>"Develop character relationships"</li>
                <li>"Create plot twists"</li>
                <li>"Expand the world-building"</li>
              </ul>
              {isGenerating && (
                <div className="mt-3 p-2 bg-accent/10 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="w-3 h-3" />
                    </motion.div>
                    Generating story content using {selectedProvider}...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Ask for story help..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerateContent(aiPrompt)
                  setAiPrompt('')
                }
              }}
              disabled={isGenerating}
            />
            <Button 
              size="sm" 
              onClick={() => {
                handleGenerateContent(aiPrompt)
                setAiPrompt('')
              }}
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? <Gear className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Helper functions
  const updateCharacter = (id: string, field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === id ? { ...char, [field]: value } : char
      )
    }))
  }

  const updateCharacterTrait = (id: string, trait: string, value: number) => {
    setContent(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === id 
          ? { 
              ...char, 
              traits: { 
                courage: 50,
                intelligence: 50,
                charisma: 50,
                loyalty: 50,
                ambition: 50,
                empathy: 50,
                ...char.traits, 
                [trait]: value 
              } 
            }
          : char
      )
    }))
  }

  const getToneValue = (tone: string) => {
    const toneMap = { 'dark': 0, 'serious': 25, 'balanced': 50, 'light': 75, 'humorous': 100 }
    return toneMap[tone as keyof typeof toneMap] || 50
  }

  const getToneFromValue = (value: number) => {
    if (value <= 10) return 'dark'
    if (value <= 30) return 'serious'
    if (value <= 70) return 'balanced'
    if (value <= 90) return 'light'
    return 'humorous'
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex h-full gap-0 bg-background", className)}
    >
      {renderLeftSidebar()}
      {renderCenterPanel()}
      {renderRightSidebar()}
    </motion.div>
  )
}
