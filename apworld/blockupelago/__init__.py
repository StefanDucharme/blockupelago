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
        """Create all items for the item pool with custom distribution."""
        from .Items import STARTER_PIECES

        # Calculate how many locations we have (excluding Victory event)
        location_count = len([loc for loc in location_table.values() if loc.code is not None])

        # --- 1. Add all rare/progression items (once each) ---
        piece_type_items = [
            "Single Block", "Domino I", "Tromino I", "Tromino L",
            "Tetromino I", "Tetromino O", "Tetromino T", "Tetromino L", "Tetromino S",
            "Pentomino I", "Pentomino L", "Pentomino P", "Pentomino U", "Pentomino W", "Pentomino Plus",
            "3x3 Corner", "3x3 T-Shape", "3x3 Cross"
        ]
        shape_pool = [p for p in piece_type_items if p not in STARTER_PIECES]
        for item_name in shape_pool:
            self.multiworld.itempool.append(self.create_item(item_name))
        self.multiworld.itempool.append(self.create_item("4th Piece Slot"))
        self.multiworld.itempool.append(self.create_item("5th Piece Slot"))
        self.multiworld.itempool.append(self.create_item("Permanent Free Rotate"))
        self.multiworld.itempool.append(self.create_item("Permanent Free Mirror"))
        self.multiworld.itempool.append(self.create_item("Permanent Free Hold"))

        # --- 2. Fill remaining locations with ability uses and multipliers (proportional) ---
        rare_count = len(shape_pool) + 5  # 5 = 2 slots + 3 permanent abilities
        filler_count = location_count - rare_count
        # 2:1 ratio (2/3 ability uses, 1/3 multipliers)
        n_abilities = (filler_count * 2) // 3
        n_mults = filler_count - n_abilities

        ability_items = [
            "Rotate Ability", "Undo Ability", "Remove Block", "Hold Ability", "Mirror Ability", "Shrink Ability"
        ]
        for i in range(n_abilities):
            item_name = ability_items[i % len(ability_items)]
            self.multiworld.itempool.append(self.create_item(item_name))

        multiplier_items = ["Score Multiplier +10%", "Score Multiplier +25%", "Score Multiplier +50%"]
        for i in range(n_mults):
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

