/**
 * Ability helper utilities
 * Consolidates ability-related logic for better maintainability
 */

import type { GameMode, FreePlayAbilities, AbilityType } from './types';

/**
 * Check if an ability can be used based on game mode and resources
 */
export function canUseAbility(abilityType: AbilityType, gameMode: GameMode, abilityUses: number, isFree: boolean, gemsCollected: number): boolean {
  if (gameMode === 'free-play') {
    return isFree || gemsCollected > 0;
  }
  return abilityUses > 0;
}

/**
 * Get display text for ability count/cost
 */
export function getAbilityDisplayText(gameMode: GameMode, isFree: boolean, abilityUses: number): string | number {
  if (gameMode === 'free-play') {
    return isFree ? '' : '(💎)';
  }
  return abilityUses;
}

/**
 * Consume ability resources based on game mode
 * Returns true if successful, false if insufficient resources
 */
export function consumeAbility(gameMode: GameMode, isFree: boolean, abilityUses: { value: number }, gemsCollected: { value: number }): boolean {
  if (gameMode === 'free-play') {
    if (!isFree) {
      if (gemsCollected.value <= 0) return false;
      gemsCollected.value--;
    }
    return true;
  } else {
    if (abilityUses.value <= 0) return false;
    abilityUses.value--;
    return true;
  }
}

/**
 * Check if a specific piece can be transformed (rotated/mirrored) for free
 * due to already being transformed once
 */
export function canTransformPieceFree(transformType: 'rotate' | 'mirror', piece: { hasBeenRotated?: boolean; hasBeenMirrored?: boolean }): boolean {
  if (transformType === 'rotate') {
    return piece.hasBeenRotated === true;
  }
  return piece.hasBeenMirrored === true;
}

/**
 * Calculate ability availability for all abilities
 * Returns an object with availability for each ability type
 */
export interface AbilityAvailability {
  rotate: boolean;
  undo: boolean;
  remove: boolean;
  hold: boolean;
  mirror: boolean;
  shrink: boolean;
}

export function getAbilityAvailability(
  gameMode: GameMode,
  freePlayAbilities: FreePlayAbilities,
  abilityUses: {
    rotate: number;
    undo: number;
    remove: number;
    hold: number;
    mirror: number;
    shrink: number;
  },
  gemsCollected: number,
): AbilityAvailability {
  return {
    rotate: canUseAbility('rotate', gameMode, abilityUses.rotate, freePlayAbilities.freeRotate, gemsCollected),
    undo: canUseAbility('undo', gameMode, abilityUses.undo, freePlayAbilities.freeUndo, gemsCollected),
    remove: canUseAbility('remove', gameMode, abilityUses.remove, freePlayAbilities.freeRemove, gemsCollected),
    hold: canUseAbility('hold', gameMode, abilityUses.hold, freePlayAbilities.freeHold, gemsCollected),
    mirror: canUseAbility('mirror', gameMode, abilityUses.mirror, freePlayAbilities.freeMirror, gemsCollected),
    shrink: canUseAbility('shrink', gameMode, abilityUses.shrink, freePlayAbilities.freeShrink, gemsCollected),
  };
}

/**
 * Calculate all display texts for abilities
 */
export interface AbilityDisplayTexts {
  rotate: string | number;
  undo: string | number;
  remove: string | number;
  hold: string | number;
  mirror: string | number;
  shrink: string | number;
}

export function getAbilityDisplayTexts(
  gameMode: GameMode,
  freePlayAbilities: FreePlayAbilities,
  abilityUses: {
    rotate: number;
    undo: number;
    remove: number;
    hold: number;
    mirror: number;
    shrink: number;
  },
): AbilityDisplayTexts {
  return {
    rotate: getAbilityDisplayText(gameMode, freePlayAbilities.freeRotate, abilityUses.rotate),
    undo: getAbilityDisplayText(gameMode, freePlayAbilities.freeUndo, abilityUses.undo),
    remove: getAbilityDisplayText(gameMode, freePlayAbilities.freeRemove, abilityUses.remove),
    hold: getAbilityDisplayText(gameMode, freePlayAbilities.freeHold, abilityUses.hold),
    mirror: getAbilityDisplayText(gameMode, freePlayAbilities.freeMirror, abilityUses.mirror),
    shrink: getAbilityDisplayText(gameMode, freePlayAbilities.freeShrink, abilityUses.shrink),
  };
}
