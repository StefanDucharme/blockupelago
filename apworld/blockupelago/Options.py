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


class StartingPieceTypes(Range):
    """Number of different piece types you start with (unlocked)."""
    display_name = "Starting Piece Types"
    range_start = 3
    range_end = 10
    default = 5


class StartingGridSize(Choice):
    """The initial grid size you start with."""
    display_name = "Starting Grid Size"
    option_6x6 = 0
    option_7x7 = 1
    option_9x9 = 2
    default = 0


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


class HintsInPool(Range):
    """Number of Placement Hint items in the item pool."""
    display_name = "Hints in Pool"
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
    range_start = 1000
    range_end = 50000
    default = 10000


class DeathLink(Toggle):
    """When you game over, everyone with DeathLink enabled also game overs.
    When you receive a DeathLink, your current game ends."""
    display_name = "Death Link"


@dataclass
class BlockudokuOptions(PerGameCommonOptions):
    """Options for Blockudoku."""
    starting_piece_types: StartingPieceTypes
    starting_grid_size: StartingGridSize
    starting_piece_slots: StartingPieceSlots
    starting_abilities: StartingAbilities
    rotate_uses_in_pool: RotateUsesInPool
    undo_uses_in_pool: UndoUsesInPool
    remove_blocks_in_pool: RemoveBlocksInPool
    hints_in_pool: HintsInPool
    score_multipliers_in_pool: ScoreMultipliersInPool
    goal_score: GoalScore
    death_link: DeathLink

    coins_per_bundle: CoinsPerBundle
    extra_lives_in_pool: ExtraLivesInPool
    hint_reveals_in_pool: HintRevealsInPool
    coin_bundles_in_pool: CoinBundlesInPool
    cell_solves_in_pool: CellSolvesInPool
    goal_puzzles: GoalPuzzles
    death_link: DeathLink
