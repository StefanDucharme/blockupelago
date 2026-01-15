"""
Blockudoku Regions

Defines the region structure for the world.
Blockupelago is simple - just one main region with all locations.
"""

from typing import TYPE_CHECKING
from BaseClasses import Region
from .Locations import BlockudokuLocation, location_table

if TYPE_CHECKING:
    from . import BlockudokuWorld


def create_regions(world: "BlockudokuWorld") -> None:
    """Create all regions and connect them."""

    multiworld = world.multiworld
    player = world.player

    # Create Menu region (starting point)
    menu_region = Region("Menu", player, multiworld)
    multiworld.regions.append(menu_region)

    # Create main Game Area region
    game_region = Region("Game Area", player, multiworld)
    multiworld.regions.append(game_region)

    # Connect Menu to Game Area (no requirements)
    menu_region.connect(game_region)

    # Add all locations to the game region
    for location_name, location_data in location_table.items():
        if location_data.code is not None:  # Skip event locations for now
            location = BlockudokuLocation(
                player,
                location_name,
                location_data.code,
                game_region
            )
            game_region.locations.append(location)

    # Add victory event location
    victory_location = BlockudokuLocation(
        player,
        "Goal",
        None,  # Event location
        game_region
    )
    victory_location.place_locked_item(world.create_item("Victory"))
    game_region.locations.append(victory_location)

    # Set victory condition based on goal_score option
    goal_score = world.options.goal_score.value

    # Victory requires reaching the goal score
    goal_location_name = f"Reach {goal_score} Points"
    
    # If the exact goal doesn't exist in locations, find the closest higher milestone
    if goal_location_name not in location_table:
        # Find the closest milestone that's >= goal_score
        score_locations = [name for name in location_table.keys() if "Reach" in name and "Points" in name]
        for loc_name in sorted(score_locations):
            # Extract score from "Reach X Points"
            try:
                loc_score = int(loc_name.split(" ")[1])
                if loc_score >= goal_score:
                    goal_location_name = loc_name
                    break
            except (ValueError, IndexError):
                continue
    
    # Set the access rule for victory
    if goal_location_name in location_table:
        victory_location.access_rule = lambda state, loc=goal_location_name: state.can_reach(
            loc, "Location", player
        )

