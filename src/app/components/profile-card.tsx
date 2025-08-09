"use client"

import type React from "react"
import { memo } from "react"
import { Edit3, Save, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface ProfileData {
  name: string
  major: string
  hobby: string
}

interface ProfileCardProps {
  profile: ProfileData
  isUser?: boolean
  isEditing?: boolean
  tempProfile?: ProfileData
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  onProfileChange?: (field: keyof ProfileData, value: string) => void
}

export const ProfileCard = memo<ProfileCardProps>(
  ({
    profile,
    isUser = false,
    isEditing = false,
    tempProfile,
    onEdit,
    onSave,
    onCancel,
    onProfileChange,
  }) => {
    const displayProfile = isEditing && tempProfile ? tempProfile : profile
    const imageSrc = isUser ? "/user-profile.png" : "/partner-profile.png"
    const altText = isUser ? "User Profile" : "Partner Profile"

    return (
      <div className="bg-emerald-800/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20 shadow-2xl p-4 transition-all duration-300 hover:shadow-3xl hover:scale-105 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-emerald-300/50 shadow-xl bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:border-emerald-200 transition-all duration-300">
              <img
                src={imageSrc}
                alt={altText}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-emerald-300/20 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {isEditing ? (
            <div className="w-full space-y-2">
              <Input
                value={displayProfile.name}
                onChange={(e) => onProfileChange?.('name', e.target.value)}
                className="text-center bg-emerald-900/30 border-emerald-400/30 text-emerald-100 placeholder-emerald-300/60"
                placeholder="Enter name"
              />
              <Input
                value={displayProfile.major}
                onChange={(e) => onProfileChange?.('major', e.target.value)}
                className="text-center bg-emerald-900/30 border-emerald-400/30 text-emerald-100 placeholder-emerald-300/60"
                placeholder="Enter major"
              />
              <Input
                value={displayProfile.hobby}
                onChange={(e) => onProfileChange?.('hobby', e.target.value)}
                className="text-center bg-emerald-900/30 border-emerald-400/30 text-emerald-100 placeholder-emerald-300/60"
                placeholder="Enter hobby"
              />
              <div className="flex gap-2 justify-center mt-3">
                <Button
                  onClick={onSave}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-105"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={onCancel}
                  size="sm"
                  variant="outline"
                  className="border-emerald-400/50 text-emerald-200 hover:bg-emerald-800/50 transition-all duration-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <h3 className="text-lg font-bold text-emerald-100 mb-1 drop-shadow-lg">
                {displayProfile.name}
              </h3>
              <p className="text-emerald-200 text-sm mb-1">
                <span className="font-medium">Major:</span> {displayProfile.major}
              </p>
              <p className="text-emerald-200 text-sm mb-3">
                <span className="font-medium">Hobby:</span> {displayProfile.hobby}
              </p>
              {isUser && onEdit && (
                <Button
                  onClick={onEdit}
                  size="sm"
                  className="bg-emerald-600/80 hover:bg-emerald-600 text-white transition-all duration-200 hover:scale-105"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}

          {!isUser && <p className="text-emerald-200 text-xs mt-2 text-center">Partner manages their own profile</p>}
        </div>
      </div>
    )
  },
)

ProfileCard.displayName = "ProfileCard"


