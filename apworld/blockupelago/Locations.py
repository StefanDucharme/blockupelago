"""
Blockupelago Locations

Defines all locations (checks) that can be sent to Archipelago.
Location IDs must match the client's AP_LOCATIONS constants.
"""

from typing import Dict, NamedTuple, Optional
from BaseClasses import Location


class BlockudokuLocationData(NamedTuple):
    """Data structure for location definitions."""
    code: Optional[int]  # None for event locations
    region: str


class BlockudokuLocation(Location):
    """Custom location class for Blockupelago."""
    game: str = "Blockupelago"


# Location ID ranges (must match client's useArchipelagoItems.ts):
# Score Milestones: 9000001-9000020 (20 milestones)
# Line Clears: 9001001-9001030 (30 milestones)
# Box Clears: 9002001-9002020 (20 milestones)
# Combo Clears: 9003001-9003010 (10 milestones)
# Pieces Placed: 9004001-9004025 (25 milestones)

location_table: Dict[str, BlockudokuLocationData] = {}

# Generate Score Milestone locations (every 500 points up to 10000)
score_milestones = [500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
                    10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 50000]
for i, score in enumerate(score_milestones, start=1):
    location_table[f"Reach {score} Points"] = BlockudokuLocationData(
        code=9000000 + i,
        region="Game Area"
    )

# Generate Line Clear locations (rows/columns cleared)
line_clear_milestones = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100,
                        125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250]
for i, clears in enumerate(line_clear_milestones, start=1):
    location_table[f"Clear {clears} Line{'s' if clears > 1 else ''}"] = BlockudokuLocationData(
        code=9001000 + i,
        region="Game Area"
    )

# Generate Box Clear locations (3x3 boxes cleared)
box_clear_milestones = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 125, 150, 175, 200, 250, 300]
for i, clears in enumerate(box_clear_milestones, start=1):
    location_table[f"Clear {clears} Box{'es' if clears > 1 else ''}"] = BlockudokuLocationData(
        code=9002000 + i,
        region="Game Area"
    )

# Generate Combo Clear locations (multiple clears at once)
combo_milestones = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50]
for i, combos in enumerate(combo_milestones, start=1):
    location_table[f"Achieve {combos} Combo Clear{'s' if combos > 1 else ''}"] = BlockudokuLocationData(
        code=9003000 + i,
        region="Game Area"
    )

# Generate Pieces Placed locations
piece_milestones = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900,
                   1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 5000]
for i, pieces in enumerate(piece_milestones, start=1):
    location_table[f"Place {pieces} Piece{'s' if pieces > 1 else ''}"] = BlockudokuLocationData(
        code=9004000 + i,
        region="Game Area"
    )

    location_table[f"Complete {i} 20x20 Puzzle{'s' if i > 1 else ''}"] = blockupelagoLocationData(
        code=9004000 + i,
        region="Puzzle Area"
    )

# Add Victory event (no code)
location_table["Goal"] = blockupelagoLocationData(
    code=None,
    region="Puzzle Area"
)


def get_locations_by_region() -> Dict[str, list]:
    """Group locations by their region."""
    regions: Dict[str, list] = {}
    for name, data in location_table.items():
        if data.region not in regions:
            regions[data.region] = []
        regions[data.region].append(name)
    return regions
