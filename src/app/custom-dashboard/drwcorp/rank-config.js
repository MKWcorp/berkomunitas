// Rank configurations based on complete Figma design - 5000+ lines
const rankConfigurations = [
  // Mighty tier: Top 3 ranks with special colors
  { rank: 1, x: 521, y: 392, width: 180, height: 45, fontSize: 20, tier: 'mighty' }, // Gold #FFC03A
  { rank: 2, x: 111, y: 408, width: 180, height: 45, fontSize: 20, tier: 'mighty' }, // Dark #181A19
  { rank: 3, x: 885, y: 445, width: 180, height: 45, fontSize: 20, tier: 'mighty' }, // Light #FFF4DE

  // Guard tier: Ranks 4-8 with varied colors
  { rank: 4, x: 192, y: 1063, width: 120, height: 30, fontSize: 12, tier: 'guard' }, // Orange #EB7723
  { rank: 5, x: 370, y: 1078, width: 120, height: 30, fontSize: 12, tier: 'guard' }, // Light gold #F7DA6A
  { rank: 6, x: 549, y: 1235, width: 120, height: 30, fontSize: 12, tier: 'guard' }, // Green #00FF80
  { rank: 7, x: 718, y: 1125, width: 120, height: 30, fontSize: 12, tier: 'guard' }, // Pink #FF41B3
  { rank: 8, x: 877, y: 1083, width: 120, height: 30, fontSize: 12, tier: 'guard' }, // Varied

  // Servant tier: Ranks 9-20 with blue theme
  { rank: 9, x: 99, y: 1331, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 10, x: 205, y: 1345, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 11, x: 312, y: 1350, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 12, x: 418, y: 1345, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 13, x: 524, y: 1350, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 14, x: 631, y: 1345, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 15, x: 737, y: 1350, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 16, x: 843, y: 1345, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 17, x: 950, y: 1350, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 18, x: 146, y: 1410, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
  { rank: 19, x: 252, y: 1415, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },
{ rank: 20, x: 359, y: 1410, width: 82.22, height: 20.56, fontSize: 9, tier: 'servant' },

  // Commoners tier: Light red background (#FFD4D4)
  { rank: 21, x: 179, y: 1447, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 22, x: 324, y: 1447, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 23, x: 449, y: 1450, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 24, x: 591, y: 1447, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 25, x: 752, y: 1454, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 26, x: 860, y: 1400, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 27, x: 82, y: 1498, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 28, x: 189, y: 1501, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 29, x: 352, y: 1508, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },
  { rank: 30, x: 477, y: 1508, width: 82.22, height: 20.56, fontSize: 9, tier: 'commoners' },

  // Freepy tier: Lighter red background (#FF9D9D)
  { rank: 31, x: 644, y: 1505, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 32, x: 742, y: 1505, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 33, x: 901, y: 1490, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 34, x: 89, y: 1552, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 35, x: 192, y: 1597, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 36, x: 318, y: 1601, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 37, x: 459, y: 1607, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 38, x: 633, y: 1604, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 39, x: 788, y: 1597, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },
  { rank: 40, x: 875, y: 1545, width: 82.22, height: 20.56, fontSize: 9, tier: 'freepy' },

  // Lowly tier: Red background (#FF6969)
  { rank: 41, x: 169, y: 1723, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 42, x: 378, y: 1712, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 43, x: 507, y: 1705, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 44, x: 603, y: 1708, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 45, x: 703, y: 1705, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 46, x: 807, y: 1708, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 47, x: 915, y: 1715, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 48, x: 171, y: 1780, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 49, x: 287, y: 1784, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },
  { rank: 50, x: 397, y: 1786, width: 82.22, height: 20.56, fontSize: 9, tier: 'lowly' },

  // Former tier: Darker red background (#FF5252)
  { rank: 51, x: 546, y: 1784, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 52, x: 665, y: 1780, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 53, x: 765, y: 1778, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 54, x: 889, y: 1779, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 55, x: 188, y: 1895, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 56, x: 362, y: 1906, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 57, x: 528, y: 1905, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 58, x: 673, y: 1897, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 59, x: 838, y: 1907, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 60, x: 970, y: 1895, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 61, x: 187, y: 2026, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 62, x: 408, y: 2026, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 63, x: 613, y: 2019, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 64, x: 782, y: 2018, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },
  { rank: 65, x: 970, y: 2019, width: 82.22, height: 20.56, fontSize: 9, tier: 'former' },

  // Slave tier: Bright red background (#FF0000)
  { rank: 66, x: 187, y: 2537, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 67, x: 381, y: 2608, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 68, x: 633, y: 2550, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 69, x: 845, y: 2502, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 70, x: 75, y: 2665, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 71, x: 291, y: 2733, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 72, x: 528, y: 2733, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 73, x: 775, y: 2686, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 74, x: 155, y: 2861, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 75, x: 477, y: 2821, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 76, x: 785, y: 2784, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 77, x: 368, y: 2892, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 78, x: 113, y: 2959, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 79, x: 395, y: 3004, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 80, x: 677, y: 2952, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 81, x: 743, y: 2874, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 82, x: 214, y: 3102, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 83, x: 463, y: 3105, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 84, x: 766, y: 3081, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 85, x: 877, y: 3151, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 86, x: 789, y: 3017, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 87, x: 99, y: 3038, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 88, x: 75, y: 3181, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 89, x: 346, y: 3194, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 90, x: 214, y: 2801, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 91, x: 555, y: 2661, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 92, x: 633, y: 3190, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 93, x: 812, y: 3280, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 94, x: 196, y: 3301, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 95, x: 374, y: 3369, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 96, x: 538, y: 3301, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 97, x: 725, y: 3386, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 98, x: 95, y: 3403, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 99, x: 260, y: 3467, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 100, x: 528, y: 3467, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 101, x: 867, y: 3456, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 102, x: 115, y: 3546, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 103, x: 394, y: 3546, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 104, x: 727, y: 3559, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 105, x: 555, y: 3631, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 106, x: 244, y: 3610, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 107, x: 60, y: 3689, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 108, x: 337, y: 3717, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 109, x: 735, y: 3706, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 110, x: 864, y: 3638, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 111, x: 188, y: 3786, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 112, x: 382, y: 3857, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 113, x: 634, y: 3799, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 114, x: 846, y: 3751, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 115, x: 76, y: 3914, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 116, x: 292, y: 3982, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 117, x: 529, y: 3982, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 118, x: 776, y: 3935, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 119, x: 156, y: 4110, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 120, x: 478, y: 4070, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 121, x: 786, y: 4033, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 122, x: 369, y: 4141, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 123, x: 114, y: 4208, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 124, x: 396, y: 4253, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 125, x: 678, y: 4201, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 126, x: 744, y: 4123, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 127, x: 215, y: 4351, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 128, x: 464, y: 4354, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 129, x: 767, y: 4330, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 130, x: 878, y: 4400, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 131, x: 790, y: 4266, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 132, x: 100, y: 4287, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 133, x: 76, y: 4430, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 134, x: 347, y: 4443, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 135, x: 215, y: 4050, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 136, x: 556, y: 3910, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 137, x: 634, y: 4439, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 138, x: 813, y: 4529, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 139, x: 197, y: 4550, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 140, x: 375, y: 4618, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 141, x: 539, y: 4550, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 142, x: 726, y: 4635, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 143, x: 96, y: 4652, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 144, x: 261, y: 4716, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 145, x: 529, y: 4716, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 146, x: 868, y: 4705, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 147, x: 116, y: 4795, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 148, x: 395, y: 4795, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 149, x: 728, y: 4808, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 150, x: 555, y: 4880, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 151, x: 245, y: 4859, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 152, x: 61, y: 4938, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 153, x: 338, y: 4966, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 154, x: 736, y: 4955, width: 191, height: 20.56, fontSize: 9, tier: 'slave' },
  { rank: 155, x: 865, y: 4888, width: 191, height: 20.56, fontSize: 9, tier: 'slave' }
];

// Tier color mapping - Updated based on Figma design
const tierColors = {
  mighty: '#FFC03A',     // Gold for rank 1
  mighty2: '#181A19',    // Dark for rank 2  
  mighty3: '#FFF4DE',    // Light yellow for rank 3
  guard: '#EB7723',      // Orange
  servant: '#FFFFFF',
  commoners: '#FFD4D4',
  freepy: '#FF9D9D',
  lowly: '#FF6969',
  former: '#FF5252',
  slave: '#FF0000'
};

// Export the configurations
export { rankConfigurations, tierColors };