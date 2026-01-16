"""
Blockupelago Archipelago World

A Blockudoku puzzle game for Archipelago multiworld randomizer.
"""

from typing import Dict, Any, ClassVar
from BaseClasses import Item, Location, Region, Tutorial
from worlds.AutoWorld import World, WebWorld
from .Items import BlockudokuItem, item_table, item_groups
from .Locations import BlockudokuLocation, location_table
from .Options import BlockudokuOptions
from .Regions import create_regions


class BlockudokuWebWorld(WebWorld):
    """Web world for Blockupelago - provides tutorial and theme info."""

    theme = "partyTime"

    tutorials = [
        Tutorial(
            tutorial_name="Setup Guide",
            description="A guide to setting up the Blockupelago client for Archipelago.",
            language="English",
            file_name="setup_en.md",
            link="setup/en",
            authors=["StefanDucharme"]
        )
    ]


class BlockudokuWorld(World):
    """
    Blockupelago is a Blockudoku puzzle game where you place polyomino pieces
    onto a 9x9 grid. Clear rows, columns, and 3x3 boxes to score points.
    This Archipelago integration adds progression items that unlock pieces,
    grid sizes, abilities, and more.
    """

    game = "Blockupelago"
    web = BlockudokuWebWorld()

    options_dataclass = BlockudokuOptions
    options: BlockudokuOptions

    # Item and location ID ranges
    item_name_to_id: ClassVar[Dict[str, int]] = {
        name: data.code for name, data in item_table.items() if data.code is not None
    }
    location_name_to_id: ClassVar[Dict[str, int]] = {
        name: data.code for name, data in location_table.items() if data.code is not None
    }

    item_name_groups = item_groups

    def create_item(self, name: str) -> BlockudokuItem:
        """Create an item for this world."""
        item_data = item_table[name]
        return BlockudokuItem(name, item_data.classification, item_data.code, self.player)

    def create_regions(self) -> None:
        """Create and connect all regions for this world."""
        create_regions(self)

    def create_items(self) -> None:
        """Create all items for the item pool."""
        from .Items import STARTER_PIECES

        item_count = 0

        # Piece types - exclude starter pieces, add the rest to pool
        piece_type_items = [
            "Single Block", "Domino I", "Tromino I", "Tromino L",
            "Tetromino I", "Tetromino O", "Tetromino T", "Tetromino L", "Tetromino S",
            "Pentomino I", "Pentomino L", "Pentomino P", "Pentomino U", "Pentomino W", "Pentomino Plus",
            "3x3 Corner", "3x3 T-Shape", "3x3 Cross"
        ]
        # Add all pieces except the starter pieces (Tromino L, Tetromino T, Tetromino L)
        for piece_name in piece_type_items:
            if piece_name not in STARTER_PIECES:
                self.multiworld.itempool.append(self.create_item(piece_name))
                item_count += 1

        # Piece slots - add extras beyond starting
        starting_slots = self.options.starting_piece_slots.value
        if starting_slots < 4:
            self.multiworld.itempool.append(self.create_item("4th Piece Slot"))
            item_count += 1
        if starting_slots < 5:
            self.multiworld.itempool.append(self.create_item("5th Piece Slot"))
            item_count += 1

        # Abilities - multiple copies based on options
        for _ in range(self.options.rotate_uses_in_pool.value):
            self.multiworld.itempool.append(self.create_item("Rotate Ability"))
            item_count += 1
        for _ in range(self.options.undo_uses_in_pool.value):
            self.multiworld.itempool.append(self.create_item("Undo Ability"))
            item_count += 1
        for _ in range(self.options.remove_blocks_in_pool.value):
            self.multiworld.itempool.append(self.create_item("Remove Block"))
            item_count += 1
        for _ in range(self.options.hold_uses_in_pool.value):
            self.multiworld.itempool.append(self.create_item("Hold Ability"))
            item_count += 1

        # Calculate how many locations we have (excluding Victory event)
        location_count = len([loc for loc in location_table.values() if loc.code is not None])

        # Fill remaining with score multipliers (filler)
        filler_count = location_count - item_count
        multiplier_items = ["Score Multiplier +10%", "Score Multiplier +25%", "Score Multiplier +50%"]
        for i in range(filler_count):
            # Use a distribution: 50% +10%, 30% +25%, 20% +50%
            if i % 10 < 5:
                item_name = "Score Multiplier +10%"
            elif i % 10 < 8:
                item_name = "Score Multiplier +25%"
            else:
                item_name = "Score Multiplier +50%"
            self.multiworld.itempool.append(self.create_item(item_name))

    def set_rules(self) -> None:
        """Set access rules for locations."""
        # Goal is to reach the target score
        self.multiworld.completion_condition[self.player] = lambda state: (
            state.has("Victory", self.player)
        )

    def fill_slot_data(self) -> Dict[str, Any]:
        """Return slot data to be sent to the client."""
        return {
            "starting_piece_slots": self.options.starting_piece_slots.value,
            "starting_abilities": self.options.starting_abilities.value,
            "goal_score": self.options.goal_score.value,
        }

