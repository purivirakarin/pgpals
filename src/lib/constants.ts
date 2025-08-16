export const ANIMATIONS = {
  COMPLETION_ANIMATION_DURATION: 5000,
  TILE_ANIMATION_BASE_DELAY: 800,
  TILE_ANIMATION_STEP_DELAY: 50,
  MODAL_CLOSE_DELAY: 500,
  TILE_ZOOM_DURATION: 2500,
  DRAG_ANIMATION_DELAY: 1000,
} as const

export const GRID_CONFIG = {
  ROWS: 4,
  COLS: 5,
} as const

export const GRID_SIZE = GRID_CONFIG.ROWS * GRID_CONFIG.COLS

export const BREAKPOINTS = {
  MOBILE: 768,
} as const

export const LOGO_ASPECT_RATIO = {
  MIN: 0.5,
  MAX: 2.0,
} as const

export const ERROR_MESSAGES = {
  CLOUD_STORAGE_LOAD_FAILED: 'Failed to load data',
  CLOUD_STORAGE_SAVE_FAILED: 'Failed to save data',
  CLOUD_STORAGE_SAVE_ERROR: 'Failed to save to cloud storage',
} as const

export const DEFAULT_PROFILE = {
  USER_NAME: "Your Name",
  USER_MAJOR: "Your Major", 
  USER_HOBBY: "Your Hobby",
  PARTNER_NAME: "Partner's Name",
  PARTNER_MAJOR: "Partner's Major",
  PARTNER_HOBBY: "Partner's Hobby",
}


