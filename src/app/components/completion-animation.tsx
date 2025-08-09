import { Trophy, Star, Sparkles } from "lucide-react"

interface CompletionAnimationProps { totalPoints: number; gridSize: number }

export default function CompletionAnimation({ totalPoints, gridSize }: CompletionAnimationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500 p-4">
      <div className="text-center animate-in zoom-in duration-1000">
        <div className="relative">
          <div className="absolute -top-12 -left-12 animate-ping"><Sparkles className="h-8 w-8 text-yellow-400" /></div>
          <div className="absolute -top-10 -right-10 animate-ping" style={{ animationDelay: "0.5s" }}><Star className="h-6 w-6 text-emerald-300" /></div>
          <div className="absolute -bottom-10 -left-8 animate-ping" style={{ animationDelay: "1s" }}><Star className="h-7 w-7 text-green-400" /></div>
          <div className="absolute -bottom-8 -right-12 animate-ping" style={{ animationDelay: "1.5s" }}><Sparkles className="h-5 w-5 text-yellow-300" /></div>
          <div className="bg-gradient-to-br from-emerald-600 to-green-500 p-6 rounded-2xl border-2 border-yellow-400 shadow-2xl">
            <img src="/pgp-logo.png" alt="PGP Logo" className="h-16 w-16 object-contain mx-auto mb-3 animate-bounce" loading="lazy" />
            <h1 className="text-3xl font-bold text-white mb-2 animate-pulse">BINGO!</h1>
            <p className="text-lg text-emerald-100 mb-3">Congratulations PGPals!</p>
            <p className="text-sm text-emerald-200 mb-3">You've completed all {gridSize} activities!</p>
            <p className="text-lg text-yellow-200 mb-2 font-bold">Total Points: {totalPoints}</p>
            <div className="flex justify-center gap-2 text-2xl animate-bounce">
              <Trophy className="text-yellow-400" />
              <Star className="text-white" />
              <Sparkles className="text-yellow-300" />
              <Star className="text-white" />
              <Trophy className="text-yellow-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


