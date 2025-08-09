"use client"

import type React from "react"

import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubmissionModalProps {
  isSubmitting: boolean
  submissionTileIndex: number | null
  submissionImage: File | null
  submissionImageUrl: string | null
  submissionCaption: string
  onClose: () => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCaptionChange: (caption: string) => void
  onSubmit: () => void
  activity: { task: string; points: number } | null
}

export default function SubmissionModal({
  isSubmitting,
  submissionTileIndex,
  submissionImage,
  submissionImageUrl,
  submissionCaption,
  onClose,
  onImageUpload,
  onCaptionChange,
  onSubmit,
  activity,
}: SubmissionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="submission-modal bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 rounded-t-2xl w-full max-w-md h-[90vh] shadow-2xl border-t-2 border-amber-200 relative overflow-y-auto p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative text-center">
          <div className="absolute top-0 right-0">
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors duration-200 z-20"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-red-700" />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Comic Sans MS, cursive" }}>
            Your Memory
          </h2>
          <div className="w-16 h-1 bg-gray-600 mx-auto rounded-full mt-1"></div>
        </div>

        {/* Task Info */}
        {activity && (
          <div className="bg-emerald-100 rounded-xl p-4 border-2 border-emerald-200 shadow-inner text-center">
            <h3 className="text-emerald-800 font-bold text-lg mb-2">Your Mission:</h3>
            <p className="text-emerald-800 font-medium text-base leading-relaxed mb-3">{activity.task}</p>
            <div className="inline-flex items-center justify-center gap-2 bg-emerald-200 rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-bold text-base">Worth {activity.points} points</span>
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            disabled={isSubmitting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            aria-label="Upload image"
          />
          {submissionImageUrl ? (
            <div className="relative">
              <img
                src={submissionImageUrl || "/placeholder.svg"}
                alt="Uploaded memory"
                className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 shadow-md"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg"></div>
            </div>
          ) : (
            <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <div className="text-6xl mb-2">📷</div>
              <p className="text-gray-600 font-medium">Click to add photo</p>
              <p className="text-gray-500 text-xs">Your memory goes here!</p>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="relative">
          <textarea
            value={submissionCaption}
            onChange={(e) => onCaptionChange(e.target.value)}
            disabled={isSubmitting}
            placeholder="Write about your experience..."
            className="w-full p-4 bg-transparent border-none focus:outline-none resize-none h-24 text-gray-700 placeholder-gray-400 disabled:opacity-50 text-base"
            style={{
              fontFamily: "Comic Sans MS, cursive",
              lineHeight: "1.5",
              background: "repeating-linear-gradient(transparent, transparent 22px, #e5e7eb 22px, #e5e7eb 23px)",
            }}
            aria-label="Caption"
          />
          {submissionCaption.trim() && (
            <div className="absolute bottom-2 right-4 transform rotate-3">
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Comic Sans MS, cursive",
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.1))",
                }}
              >
                J & M
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-2">
          <Button
            onClick={onSubmit}
            disabled={!submissionImage || !submissionCaption.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-emerald-300 disabled:to-green-400 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none text-base"
            style={{ fontFamily: "Comic Sans MS, cursive" }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Adding to Scrapbook...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Add Memory
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
