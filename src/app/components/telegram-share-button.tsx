"use client"

import { useTelegram } from "@/hooks/use-telegram"
import { Button } from "@/components/ui/button"
import { TextIcon as Telegram } from 'lucide-react'

interface TelegramShareButtonProps {
  completedActivities: number
  totalActivities: number
  totalPoints: number
}

export default function TelegramShareButton({ completedActivities, totalActivities, totalPoints }: TelegramShareButtonProps) {
  const { shareToChat } = useTelegram()
  const handleShare = () => {
    const shareText = `I've completed ${completedActivities}/${totalActivities} activities and earned ${totalPoints} points in PGPals Bingo! Join the fun!`
    shareToChat(shareText)
  }
  return (
    <Button onClick={handleShare} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto">
      <Telegram className="text-lg" />
      Share to Telegram
    </Button>
  )
}


