"""
Blockupelago Items

Defines all items that can be received from Archipelago.
Item IDs must match the client's AP_ITEMS constants.
"""

from typing import Dict, NamedTuple, Optional, Set
from BaseClasses import Item, ItemClassification


class BlockudokuItemData(NamedTuple):
    """Data structure for item definitions."""
    code: Optional[int]  # None for event items
    classification: ItemClassification


class BlockudokuItem(Item):
    """Custom item class for Blockupelago."""
    game: str = "Blockupelago"


# Item ID ranges (must match client's useArchipelagoItems.ts):
# Piece Types:     8000001-8000019 (19 different polyomino pieces)
# Piece Slots:     8002001-8002002 (4th and 5th piece slots)
# Abilities:       8003001-8003006 (Rotate, Undo, Remove Block, Hold, Mirror, Shrink)
# Score Boosts:    8004001-8004003 (multipliers)
# Event:           None (Victory)

# Starter pieces that player begins with (EXCLUDED from item pool)
STARTER_PIECES = {"Tromino L", "Tetromino T", "Tetromino L"}

item_table: Dict[str, BlockudokuItemData] = {

    # === Piece Types (Progression - unlock different shapes) ===
    # NOTE: Tromino L, Tetromino T, and Tetromino L are starter pieces
    # and should NOT be added to the item pool
    "Single Block": BlockudokuItemData(code=8000001, classification=ItemClassification.progression),
    "Domino I": BlockudokuItemData(code=8000002, classification=ItemClassification.progression),
    "Tromino I": BlockudokuItemData(code=8000003, classification=ItemClassification.progression),
    "Tromino L": BlockudokuItemData(code=8000004, classification=ItemClassification.progression),
    "Tetromino I": BlockudokuItemData(code=8000005, classification=ItemClassification.progression),
    "Tetromino O": BlockudokuItemData(code=8000006, classification=ItemClassification.progression),
    "Tetromino T": BlockudokuItemData(code=8000007, classification=ItemClassification.progression),
    "Tetromino L": BlockudokuItemData(code=8000008, classification=ItemClassification.progression),
    "Tetromino S": BlockudokuItemData(code=8000009, classification=ItemClassification.progression),
    "Pentomino I": BlockudokuItemData(code=8000010, classification=ItemClassification.progression),
    "Pentomino L": BlockudokuItemData(code=8000011, classification=ItemClassification.progression),
    "Pentomino P": BlockudokuItemData(code=8000012, classification=ItemClassification.progression),
    "Pentomino U": BlockudokuItemData(code=8000013, classification=ItemClassification.progression),
    "Pentomino W": BlockudokuItemData(code=8000014, classification=ItemClassification.progression),
    "Pentomino Plus": BlockudokuItemData(code=8000015, classification=ItemClassification.progression),
    "3x3 Corner": BlockudokuItemData(code=8000016, classification=ItemClassification.progression),
    "3x3 T-Shape": BlockudokuItemData(code=8000017, classification=ItemClassification.progression),
    "3x3 Cross": BlockudokuItemData(code=8000018, classification=ItemClassification.progression),

    # === Piece Slots (Rare Permanent) ===
    "4th Piece Slot": BlockudokuItemData(code=8002001, classification=ItemClassification.progression),
    "5th Piece Slot": BlockudokuItemData(code=8002002, classification=ItemClassification.progression),

    # === Abilities (Useful) ===
    "Rotate Ability": BlockudokuItemData(code=8003001, classification=ItemClassification.useful),
    "Undo Ability": BlockudokuItemData(code=8003002, classification=ItemClassification.useful),
    "Remove Block": BlockudokuItemData(code=8003003, classification=ItemClassification.useful),
    "Hold Ability": BlockudokuItemData(code=8003004, classification=ItemClassification.useful),
    "Mirror Ability": BlockudokuItemData(code=8003005, classification=ItemClassification.useful),
    "Shrink Ability": BlockudokuItemData(code=8003006, classification=ItemClassification.useful),

    # === Permanent Abilities (Rare Permanent) ===
    "Permanent Free Rotate": BlockudokuItemData(code=8003101, classification=ItemClassification.progression),
    "Permanent Free Mirror": BlockudokuItemData(code=8003102, classification=ItemClassification.progression),
    "Permanent Free Hold": BlockudokuItemData(code=8003103, classification=ItemClassification.progression),

    # === Score Multipliers (Filler/Useful) ===
    "Score Multiplier +10%": BlockudokuItemData(code=8004001, classification=ItemClassification.filler),
    "Score Multiplier +25%": BlockudokuItemData(code=8004002, classification=ItemClassification.useful),
    "Score Multiplier +50%": BlockudokuItemData(code=8004003, classification=ItemClassification.useful),

    # === Event Items (no code, used for logic) ===
    "Victory": BlockudokuItemData(code=None, classification=ItemClassification.progression),
}


# Item groups for hint system
item_groups: Dict[str, Set[str]] = {
    "Progression": {
        "Single Block", "Domino I", "Tromino I", "Tromino L",
        "Tetromino I", "Tetromino O", "Tetromino T", "Tetromino L", "Tetromino S",
        "Pentomino I", "Pentomino L", "Pentomino P", "Pentomino U", "Pentomino W", "Pentomino Plus",
        "3x3 Corner", "3x3 T-Shape", "3x3 Cross",
    },
    "Abilities": {
        "Rotate Ability", "Undo Ability", "Remove Block", "Hold Ability", "Mirror Ability", "Shrink Ability",
        "4th Piece Slot", "5th Piece Slot",
    },
    "Score Boosts": {
        "Score Multiplier +10%", "Score Multiplier +25%", "Score Multiplier +50%",
    },
}
