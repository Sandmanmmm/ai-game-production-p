import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIAssistantMessage } from '@/lib/types'
import { generateAIResponse } from '@/lib/mockData'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Robot, 
  User, 
  PaperPlaneRight, 
  Sparkle,
  X,
  Minimize,
  Maximize
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useKV } from '@github/spark/hooks'

interface AIAssistantProps {
  context?: 'general' | 'story' | 'assets' | 'gameplay' | 'qa' | 'publishing'
  isMinimized?: boolean
  onToggleMinimize?: () => void
  className?: string
}

export function AIAssistant({ 
  context = 'general', 
  isMinimized = false, 
  onToggleMinimize,
  className 
}: AIAssistantProps) {
  const [messages, setMessages] = useKV<AIAssistantMessage[]>('ai_chat_messages', [])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: AIAssistantMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
      context
    }

    setMessages(currentMessages => [...currentMessages, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, context)
      setMessages(currentMessages => [...currentMessages, aiResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn('fixed bottom-6 right-6 z-50', className)}
      >
        <Button
          onClick={onToggleMinimize}
          className="w-14 h-14 rounded-full gradient-cosmic shadow-xl hover:glow-purple transition-all duration-300"
        >
          <Robot size={24} className="text-white" />
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col h-full', className)}
    >
      <Card className="glass-card flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-cosmic flex items-center justify-center">
                <Robot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Creative Assistant</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-accent/20 text-accent">
                    {context}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="text-muted-foreground hover:text-foreground"
              >
                <Minimize size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 custom-scrollbar">
          <div className="space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkle size={24} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Ready to Create!</h4>
                  <p className="text-sm text-muted-foreground">
                    I'm your AI creative partner. Ask me anything about game development, 
                    brainstorming, or get suggestions for your {context} work.
                  </p>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full gradient-cosmic flex items-center justify-center shrink-0">
                      <Robot size={16} className="text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg p-3 text-sm',
                      message.role === 'user' 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted/50 text-foreground'
                    )}
                  >
                    {message.content}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                      <User size={16} className="text-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full gradient-cosmic flex items-center justify-center">
                  <Robot size={16} className="text-white" />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-muted-foreground/60"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 rounded-full bg-muted-foreground/60"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                      className="w-2 h-2 rounded-full bg-muted-foreground/60"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your game..."
              disabled={isTyping}
              className="flex-1 bg-muted/30 border-border/50 focus:border-accent/50 transition-colors"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-4 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <PaperPlaneRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}