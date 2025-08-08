import { Trophy, Star, Sparkles } from "lucide-react"

interface CompletionAnimationProps {
  totalPoints: number
  gridSize: number
}

export default function CompletionAnimation({ totalPoints, gridSize }: CompletionAnimationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500 p-4">
      <div className="text-center animate-in zoom-in duration-1000">
        <div className="relative">
          {/* Fireworks/Sparkles Animation - Responsive */}
          <div className="absolute -top-12 sm:-top-20 -left-12 sm:-left-20 animate-ping">
            <Sparkles className="h-8 w-8 sm:h-16 sm:w-16 text-yellow-400" />
          </div>
          <div
            className="absolute -top-10 sm:-top-16 -right-10 sm:-right-16 animate-ping"
            style={{ animationDelay: "0.5s" }}
          >
            <Star className="h-6 w-6 sm:h-12 sm:w-12 text-emerald-300" />
          </div>
          <div
            className="absolute -bottom-10 sm:-bottom-16 -left-8 sm:-left-12 animate-ping"
            style={{ animationDelay: "1s" }}
          >
            <Star className="h-7 w-7 sm:h-14 sm:w-14 text-green-400" />
          </div>
          <div
            className="absolute -bottom-8 sm:-bottom-12 -right-12 sm:-right-20 animate-ping"
            style={{ animationDelay: "1.5s" }}
          >
            <Sparkles className="h-5 w-5 sm:h-10 sm:w-10 text-yellow-300" />
          </div>

          {/* Main completion content - Responsive */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-500 p-6 sm:p-12 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-yellow-400 shadow-2xl">
            <img
              src="/pgp-logo.png"
              alt="PGP Logo"
              className="h-16 w-16 sm:h-32 sm:w-32 object-contain mx-auto mb-3 sm:mb-6 animate-bounce"
              loading="lazy"
            />
            <h1 className="text-3xl sm:text-6xl font-bold text-white mb-2 sm:mb-4 animate-pulse">BINGO!</h1>
            <p className="text-lg sm:text-2xl text-emerald-100 mb-3 sm:mb-6">Congratulations PGPals!</p>
            <p className="text-sm sm:text-lg text-emerald-200 mb-3 sm:mb-6">
              You've completed all {gridSize} activities!
            </p>
            <p className="text-lg sm:text-xl text-yellow-200 mb-2 sm:mb-4 font-bold">Total Points: {totalPoints}</p>
            <div className="flex justify-center gap-2 sm:gap-4 text-2xl sm:text-4xl animate-bounce">
              <Trophy className="text-yellow-400" />
              <Star className="text-white" />
              <Sparkles className="text-yellow-300" />
              <Star className="text-white" />
              <Trophy className="text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating confetti elements - Responsive */}
      <div
        className="absolute top-8 sm:top-10 left-8 sm:left-10 animate-bounce text-2xl sm:text-4xl"
        style={{ animationDelay: "0.2s" }}
      >
        <Sparkles className="h-5 w-5 sm:h-10 sm:w-10 text-yellow-400" />
      </div>
      <div
        className="absolute top-12 sm:top-20 right-12 sm:right-20 animate-bounce text-xl sm:text-3xl"
        style={{ animationDelay: "0.8s" }}
      >
        <Star className="h-4 w-4 sm:h-8 sm:w-8 text-emerald-300" />
      </div>
      <div
        className="absolute bottom-12 sm:bottom-20 left-12 sm:left-20 animate-bounce text-2xl sm:text-4xl"
        style={{ animationDelay: "1.2s" }}
      >
        <Sparkles className="h-5 w-5 sm:h-10 sm:w-10 text-green-400" />
      </div>
      <div
        className="absolute bottom-8 sm:bottom-10 right-8 sm:right-10 animate-bounce text-xl sm:text-3xl"
        style={{ animationDelay: "1.6s" }}
      >
        <Star className="h-4 w-4 sm:h-8 sm:w-8 text-yellow-300" />
      </div>
      <div
        className="absolute top-1/2 left-8 sm:left-10 animate-bounce text-lg sm:text-2xl"
        style={{ animationDelay: "2s" }}
      >
        <Sparkles className="h-3 w-3 sm:h-6 sm:w-6 text-white" />
      </div>
      <div
        className="absolute top-1/2 right-8 sm:right-10 animate-bounce text-lg sm:text-2xl"
        style={{ animationDelay: "2.4s" }}
      >
        <Star className="h-3 w-3 sm:h-6 sm:w-6 text-emerald-200" />
      </div>
    </div>
  )
}
