"""
Blockupelago Options

Defines all YAML options for world generation.
"""

from dataclasses import dataclass
from Options import (
    Choice,
    DefaultOnToggle,
    PerGameCommonOptions,
    Range,
    Toggle,
)


class StartingPieceSlots(Range):
    """Number of piece slots (pieces shown at once) you start with."""
    display_name = "Starting Piece Slots"
    range_start = 2
    range_end = 3
    default = 3


class StartingAbilities(Range):
    """Number of abilities (Rotate, Undo, etc.) you start with."""
    display_name = "Starting Abilities"
    range_start = 0
    range_end = 4
    default = 1


class RotateUsesInPool(Range):
    """Number of Rotate Ability items in the item pool."""
    display_name = "Rotate Abilities in Pool"
    range_start = 1
    range_end = 10
    default = 3


class UndoUsesInPool(Range):
    """Number of Undo Ability items in the item pool."""
    display_name = "Undo Abilities in Pool"
    range_start = 1
    range_end = 10
    default = 3


class RemoveBlocksInPool(Range):
    """Number of Remove Block items in the item pool."""
    display_name = "Remove Blocks in Pool"
    range_start = 1
    range_end = 10
    default = 5


class HoldUsesInPool(Range):
    """Number of Hold Ability items in the item pool."""
    display_name = "Hold Abilities in Pool"
    range_start = 1
    range_end = 10
    default = 3


class MirrorUsesInPool(Range):
    """Number of Mirror Ability items in the item pool."""
    display_name = "Mirror Abilities in Pool"
    range_start = 1
    range_end = 10
    default = 3


class ShrinkUsesInPool(Range):
    """Number of Shrink Ability items in the item pool."""
    display_name = "Shrink Abilities in Pool"
    range_start = 1
    range_end = 10
    default = 3


class ScoreMultipliersInPool(Range):
    """Number of Score Multiplier items in the item pool."""
    display_name = "Score Multipliers in Pool"
    range_start = 0
    range_end = 20
    default = 10


class GoalScore(Range):
    """Total score required to complete the goal."""
    display_name = "Goal Score"
    range_start = 10000
    range_end = 100000
    default = 30000


class DeathLink(Toggle):
    """When you game over, everyone with DeathLink enabled also game overs.
    When you receive a DeathLink, your current game ends."""
    display_name = "Death Link"


@dataclass
class BlockudokuOptions(PerGameCommonOptions):
    """Options for Blockudoku.

    Note: Starting pieces are now fixed (Tromino L, Tetromino T, Tetromino L)
    and not configurable to ensure consistent game balance.
    """
    starting_piece_slots: StartingPieceSlots
    starting_abilities: StartingAbilities
    rotate_uses_in_pool: RotateUsesInPool
    undo_uses_in_pool: UndoUsesInPool
    remove_blocks_in_pool: RemoveBlocksInPool
    hold_uses_in_pool: HoldUsesInPool
    mirror_uses_in_pool: MirrorUsesInPool
    shrink_uses_in_pool: ShrinkUsesInPool
    score_multipliers_in_pool: ScoreMultipliersInPool
    goal_score: GoalScore
    death_link: DeathLink
