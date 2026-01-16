/**
 * Archipelago Items & Locations for Blockupelago
 *
 * This composable manages all items received from and locations sent to Archipelago.
 */

import { usePersistentRef } from './usePersistence';

// ============================================
// ITEM IDS - Must match APWorld Items.py
// ============================================
export const AP_ITEMS = {
  // Piece Types (8000xxx)
  SINGLE_BLOCK: 8000001,
  DOMINO_I: 8000002,
  TROMINO_I: 8000003,
  TROMINO_L: 8000004,
  TETROMINO_I: 8000005,
  TETROMINO_O: 8000006,
  TETROMINO_T: 8000007,
  TETROMINO_L: 8000008,
  TETROMINO_S: 8000009,
  PENTOMINO_I: 8000010,
  PENTOMINO_L: 8000011,
  PENTOMINO_P: 8000012,
  PENTOMINO_U: 8000013,
  PENTOMINO_W: 8000014,
  PENTOMINO_PLUS: 8000015,
  CORNER_3X3: 8000016,
  T_SHAPE_3X3: 8000017,
  CROSS_3X3: 8000018,

  // Piece Slots (8002xxx)
  PIECE_SLOT_4: 8002001,
  PIECE_SLOT_5: 8002002,

  // Abilities (8003xxx)
  ROTATE_ABILITY: 8003001,
  UNDO_ABILITY: 8003002,
  REMOVE_BLOCK: 8003003,
  HOLD_ABILITY: 8003004,

  // Score Multipliers (8004xxx)
  SCORE_MULT_10: 8004001,
  SCORE_MULT_25: 8004002,
  SCORE_MULT_50: 8004003,
} as const;

// Starter pieces that are always unlocked (should not be sent from AP)
export const STARTER_PIECES = ['Tromino L', 'Tetromino T', 'Tetromino L'];

// Map item names to item IDs
export const ITEM_NAME_TO_ID: Record<string, number> = {
  'Single Block': AP_ITEMS.SINGLE_BLOCK,
  'Domino I': AP_ITEMS.DOMINO_I,
  'Tromino I': AP_ITEMS.TROMINO_I,
  'Tromino L': AP_ITEMS.TROMINO_L,
  'Tetromino I': AP_ITEMS.TETROMINO_I,
  'Tetromino O': AP_ITEMS.TETROMINO_O,
  'Tetromino T': AP_ITEMS.TETROMINO_T,
  'Tetromino L': AP_ITEMS.TETROMINO_L,
  'Tetromino S': AP_ITEMS.TETROMINO_S,
  'Pentomino I': AP_ITEMS.PENTOMINO_I,
  'Pentomino L': AP_ITEMS.PENTOMINO_L,
  'Pentomino P': AP_ITEMS.PENTOMINO_P,
  'Pentomino U': AP_ITEMS.PENTOMINO_U,
  'Pentomino W': AP_ITEMS.PENTOMINO_W,
  'Pentomino Plus': AP_ITEMS.PENTOMINO_PLUS,
  '3x3 Corner': AP_ITEMS.CORNER_3X3,
  '3x3 T-Shape': AP_ITEMS.T_SHAPE_3X3,
  '3x3 Cross': AP_ITEMS.CROSS_3X3,
  '4th Piece Slot': AP_ITEMS.PIECE_SLOT_4,
  '5th Piece Slot': AP_ITEMS.PIECE_SLOT_5,
  'Rotate Ability': AP_ITEMS.ROTATE_ABILITY,
  'Undo Ability': AP_ITEMS.UNDO_ABILITY,
  'Remove Block': AP_ITEMS.REMOVE_BLOCK,
  'Hold Ability': AP_ITEMS.HOLD_ABILITY,
  'Score Multiplier +10%': AP_ITEMS.SCORE_MULT_10,
  'Score Multiplier +25%': AP_ITEMS.SCORE_MULT_25,
  'Score Multiplier +50%': AP_ITEMS.SCORE_MULT_50,
};

// Reverse mapping: item ID to item name
export const ITEM_ID_TO_NAME: Record<number, string> = Object.fromEntries(Object.entries(ITEM_NAME_TO_ID).map(([name, id]) => [id, name]));

// Get item name from item ID
export function getItemName(itemId: number): string {
  return ITEM_ID_TO_NAME[itemId] || `Unknown Item (${itemId})`;
}

// ============================================
// LOCATION IDS - Must match APWorld Locations.py
// ============================================
export const AP_LOCATIONS = {
  SCORE_BASE: 9000000, // +1-20
  LINE_CLEAR_BASE: 9001000, // +1-30
  BOX_CLEAR_BASE: 9002000, // +1-20
  PIECES_BASE: 9004000, // +1-25
  GEM_BASE: 9005000, // +1-100 (individual gems)
} as const;

// Milestone arrays
export const SCORE_MILESTONES = [
  500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 50000,
];

export const LINE_CLEAR_MILESTONES = [
  1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250,
];

export const BOX_CLEAR_MILESTONES = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 125, 150, 175, 200, 250, 300];

export const PIECE_MILESTONES = [
  10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000,
];

// Max individual gem checks (each gem collected = 1 check)
export const MAX_GEM_CHECKS = 100;

// Helper to get location ID for a milestone
export function getScoreLocationId(score: number): number | null {
  const idx = SCORE_MILESTONES.indexOf(score);
  return idx >= 0 ? AP_LOCATIONS.SCORE_BASE + idx + 1 : null;
}

export function getLineClearLocationId(clears: number): number | null {
  const idx = LINE_CLEAR_MILESTONES.indexOf(clears);
  return idx >= 0 ? AP_LOCATIONS.LINE_CLEAR_BASE + idx + 1 : null;
}

export function getBoxClearLocationId(clears: number): number | null {
  const idx = BOX_CLEAR_MILESTONES.indexOf(clears);
  return idx >= 0 ? AP_LOCATIONS.BOX_CLEAR_BASE + idx + 1 : null;
}

export function getPieceLocationId(pieces: number): number | null {
  const idx = PIECE_MILESTONES.indexOf(pieces);
  return idx >= 0 ? AP_LOCATIONS.PIECES_BASE + idx + 1 : null;
}

export function getGemLocationId(gemNumber: number): number | null {
  // Each gem gets its own check, up to MAX_GEM_CHECKS
  if (gemNumber >= 1 && gemNumber <= MAX_GEM_CHECKS) {
    return AP_LOCATIONS.GEM_BASE + gemNumber;
  }
  return null;
}

// ============================================
// COMPOSABLE
// ============================================
export function useArchipelagoItems() {
  const archipelagoMode = usePersistentRef('blockudoku_ap_mode', false);
  const completedChecks = usePersistentRef<Set<number>>('blockudoku_ap_checks', new Set());
  const receivedItems = usePersistentRef<number[]>('blockudoku_ap_items', []);

  // Ensure completedChecks is a Set
  function ensureChecksIsSet() {
    if (!(completedChecks.value instanceof Set)) {
      const data = Array.isArray(completedChecks.value) ? completedChecks.value : [];
      completedChecks.value = new Set(data) as any;
    }
  }

  // Check a location (mark as completed and return true if new)
  function checkLocation(locationId: number): boolean {
    ensureChecksIsSet();
    if (completedChecks.value.has(locationId)) {
      return false;
    }
    completedChecks.value.add(locationId);
    return true;
  }

  // Check if a location has been completed
  function isLocationCompleted(locationId: number): boolean {
    ensureChecksIsSet();
    return completedChecks.value.has(locationId);
  }

  // Enable Archipelago mode (locks features, but preserves received items state)
  function enableArchipelagoMode() {
    archipelagoMode.value = true;
    // Note: We don't clear receivedItems or completedChecks here anymore
    // This allows state to persist through reconnections
  }

  // Disable Archipelago mode (free play)
  function disableArchipelagoMode() {
    archipelagoMode.value = false;
    completedChecks.value = new Set();
    receivedItems.value = [];

    // Clear Archipelago-specific state
    if (import.meta.client) {
      // Clear abilities and multipliers from localStorage to start fresh in free-play
      localStorage.removeItem('blockudoku_rotate_uses');
      localStorage.removeItem('blockudoku_undo_uses');
      localStorage.removeItem('blockudoku_remove_uses');
      localStorage.removeItem('blockudoku_hold_uses');
      localStorage.removeItem('blockudoku_score_multiplier');
      localStorage.removeItem('blockudoku_base_multiplier');
      localStorage.removeItem('blockudoku_max_pieces');
      localStorage.removeItem('blockudoku_unlocked_pieces');
    }
  }

  // Receive an item from Archipelago
  function receiveItem(itemId: number): boolean {
    if (!receivedItems.value.includes(itemId)) {
      receivedItems.value = [...receivedItems.value, itemId];
      return true;
    }
    return false;
  }

  // Check if we have an item
  function hasItem(itemId: number): boolean {
    return receivedItems.value.includes(itemId);
  }

  // Debug: Force complete a location check (for testing)
  function debugCompleteLocation(locationId: number) {
    checkLocation(locationId);
  }

  return {
    archipelagoMode,
    completedChecks,
    getItemName,
    receivedItems,
    checkLocation,
    isLocationCompleted,
    enableArchipelagoMode,
    disableArchipelagoMode,
    receiveItem,
    hasItem,
    debugCompleteLocation,

    // Export constants
    AP_ITEMS,
    AP_LOCATIONS,
    ITEM_NAME_TO_ID,
    SCORE_MILESTONES,
    LINE_CLEAR_MILESTONES,
    BOX_CLEAR_MILESTONES,
    PIECE_MILESTONES,
    MAX_GEM_CHECKS,

    // Export helpers
    getScoreLocationId,
    getLineClearLocationId,
    getBoxClearLocationId,
    getPieceLocationId,
    getGemLocationId,
  };
}
