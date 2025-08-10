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

export default function SubmissionModal({ isSubmitting, submissionTileIndex, submissionImage, submissionImageUrl, submissionCaption, onClose, onImageUpload, onCaptionChange, onSubmit, activity }: SubmissionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="submission-modal relative w-full max-w-md h-[90vh] animate-in slide-in-from-bottom-full duration-500" onClick={(e) => e.stopPropagation()}>
        {/* Clipboard board */}
        <div className="absolute inset-x-2 bottom-2 top-4 rounded-3xl bg-amber-200/90 border-amber-300 border shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
          {/* Wood grain suggestion */}
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.04)_2px,transparent_2px,transparent_8px)] rounded-3xl" />
        </div>

        {/* Metal clip */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-36 h-10 rounded-b-2xl border border-slate-400 bg-gradient-to-b from-slate-200 to-slate-500 shadow-xl flex items-center justify-center">
          <div className="flex gap-8">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 shadow-inner" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 shadow-inner" />
          </div>
        </div>

        {/* Close button */}
        {!isSubmitting && (
          <button onClick={onClose} className="absolute top-2 right-4 w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center shadow border border-red-200" aria-label="Close">
            <X className="w-4 h-4 text-red-700" />
          </button>
        )}

        {/* Paper sheet */}
        <div className="absolute inset-x-6 bottom-6 top-10 bg-white rounded-xl border border-neutral-300 shadow-inner overflow-y-auto p-4 flex flex-col gap-4" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 28px, rgba(14,165,233,0.18) 28px, rgba(14,165,233,0.18) 29px)", backgroundPosition: "0 36px" }}>
          {/* Paper header */}
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-neutral-800 tracking-wide">Submission Report</h2>
            <p className="text-xs text-neutral-500 -mt-0.5">Please attach your evidence and a brief write‑up</p>
            <div className="mx-auto mt-2 h-0.5 w-16 bg-neutral-400/70 rounded-full" />
          </div>

          {activity && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 shadow-sm">
              <h3 className="text-emerald-800 font-semibold text-sm mb-1">Assignment</h3>
              <p className="text-emerald-900 text-sm leading-relaxed">{activity.task}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-emerald-200/70 px-2 py-1">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <span className="text-emerald-800 text-xs font-bold">Worth {activity.points} points</span>
              </div>
            </div>
          )}

          {/* Attachment area */}
          <div className="relative">
            <input type="file" accept="image/*" onChange={onImageUpload} disabled={isSubmitting} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" aria-label="Upload image" />
            {submissionImageUrl ? (
              <div className="relative rounded-lg border-2 border-neutral-300/80 bg-neutral-50 overflow-hidden">
                <img src={submissionImageUrl || "/placeholder.svg"} alt="Uploaded evidence" className="h-48 w-full object-cover" />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/10 to-transparent" />
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300/80 bg-neutral-50/70 transition-colors duration-200">
                <div className="mb-2 text-5xl">📎</div>
                <p className="text-sm font-medium text-neutral-600">Attach photo evidence</p>
                <p className="text-xs text-neutral-500">Click to upload</p>
              </div>
            )}
          </div>

          {/* Lined paper caption */}
          <div className="relative rounded-lg border border-neutral-300 bg-white shadow-sm">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-red-300/70" />
            <textarea
              value={submissionCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              disabled={isSubmitting}
              placeholder="Write your report here..."
              className="h-28 w-full resize-none bg-transparent p-4 pl-6 text-sm leading-7 text-neutral-800 placeholder-neutral-400 focus:outline-none disabled:opacity-50"
              style={{
                background: "repeating-linear-gradient(transparent, transparent 26px, #e5e7eb 26px, #e5e7eb 27px)",
              }}
              aria-label="Caption"
            />
          </div>

          {/* Submit button */}
          <div className="mt-auto pt-1">
            <Button onClick={onSubmit} disabled={!submissionImage || !submissionCaption.trim() || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:opacity-70">
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


