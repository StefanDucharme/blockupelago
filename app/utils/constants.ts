/**
 * Game constants and configuration values
 * Centralized configuration for better maintainability
 */

// Game state constants
export const DEFAULT_GRID_SIZE = 9;
export const MIN_GRID_SIZE = 6;
export const MAX_GRID_SIZE = 9;

// Piece slot constants
export const DEFAULT_PIECE_SLOTS = 3;
export const MIN_PIECE_SLOTS = 3;
export const MAX_PIECE_SLOTS = 5;

// Score multiplier constants
export const DEFAULT_SCORE_MULTIPLIER = 1.0;
export const COMBO_MULTIPLIER_INCREMENT = 0.02;

// Gem spawn constants
export const DEFAULT_GEM_SPAWN_RATIO = 0.3; // 30% chance to spawn gem on restock
export const GEM_CHECK_ID_BASE = 10000000; // Starting ID for gem checks

// Free-play defaults
export const DEFAULT_PIECE_SIZE_RATIO = 0.5; // 0 = all small, 1 = all large, 0.5 = balanced

// Clearing animation timing
export const CLEAR_ANIMATION_DELAY_MS = 300;

// Death link cooldown
export const DEATH_LINK_COOLDOWN_MS = 3000;

// Message log limits
export const MAX_MESSAGE_LOG_ENTRIES = 100;

// Cell size configuration for different grid sizes
export const CELL_SIZE_MOBILE = {
  6: 34,
  7: 28,
  9: 22,
} as const;

export const CELL_SIZE_DESKTOP = {
  6: 40,
  7: 35,
  9: 25,
} as const;

// Mobile breakpoint
export const MOBILE_BREAKPOINT_PX = 640;
export const TABLET_BREAKPOINT_PX = 1024;

// Box grid configuration (for 9x9 grid)
export const BOX_SIZE = 3;
export const BOX_COUNT = 3;
