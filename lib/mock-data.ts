// Unified types used by the draft board UI.
// These work whether the source is Supabase or mock data.

export interface DraftBoardTeam {
  id: string;
  name: string;
  abbreviation: string;
  bankCents: number; // stored in cents to avoid floating point
}

export interface DraftBoardRookie {
  id: string;
  fullName: string;
  position: string;
  nflTeam: string | null;
  college: string | null;
  nflDraftRound: number | null;
  nflDraftPick: number | null; // overall pick number
  draftStatus: "available" | "drafted";
  draftedByTeamId: string | null;
  depthChartPosition: string | null;
  fantasyOutlook: string | null;
}

export interface DraftBoardPick {
  id: string;
  overallPick: number;
  round: number;
  pickInRound: number;
  label: string; // "1.04"
  currentTeamId: string;
  originalTeamId: string;
  isTraded: boolean;
  draftedPlayerId: string | null;
  draftedAt: string | null;
}

// ─── Fantasy League Teams ──────────────────────────────────────────────────────

export const MOCK_TEAMS: DraftBoardTeam[] = [
  { id: "t01", name: "Thunder Hawks",   abbreviation: "THK", bankCents: 10000 },
  { id: "t02", name: "Desert Wolves",   abbreviation: "DWV", bankCents: 8500  },
  { id: "t03", name: "Iron Titans",     abbreviation: "IRT", bankCents: 12000 },
  { id: "t04", name: "Coastal Kings",   abbreviation: "CSK", bankCents: 7500  },
  { id: "t05", name: "Mountain Bears",  abbreviation: "MBR", bankCents: 9000  },
  { id: "t06", name: "Neon Dragons",    abbreviation: "NDR", bankCents: 11000 },
  { id: "t07", name: "River Sharks",    abbreviation: "RSH", bankCents: 6500  },
  { id: "t08", name: "Summit Eagles",   abbreviation: "SEG", bankCents: 9500  },
  { id: "t09", name: "Valley Vipers",   abbreviation: "VVP", bankCents: 8000  },
  { id: "t10", name: "Crimson Knights", abbreviation: "CRK", bankCents: 10500 },
  { id: "t11", name: "Polar Bears",     abbreviation: "PBR", bankCents: 7000  },
  { id: "t12", name: "Solar Flares",    abbreviation: "SFR", bankCents: 13000 },
];

// ─── Fantasy Draft Picks (snake, 12 teams × 4 rounds = 48 picks) ──────────────

function buildMockPicks(): DraftBoardPick[] {
  const ids = MOCK_TEAMS.map((t) => t.id);
  const picks: DraftBoardPick[] = [];
  let overall = 1;
  for (let round = 1; round <= 4; round++) {
    const order = round % 2 === 1 ? ids : [...ids].reverse();
    for (let i = 0; i < order.length; i++) {
      const pickInRound = i + 1;
      picks.push({
        id: `pk-${String(overall).padStart(2, "0")}`,
        overallPick: overall,
        round,
        pickInRound,
        label: `${round}.${String(pickInRound).padStart(2, "0")}`,
        currentTeamId: order[i],
        originalTeamId: order[i],
        isTraded: false,
        draftedPlayerId: null,
        draftedAt: null,
      });
      overall++;
    }
  }
  // Traded picks
  picks[4].currentTeamId = "t12";  picks[4].isTraded = true;   // 1.05 MBR → SFR
  picks[17].currentTeamId = "t04"; picks[17].isTraded = true;  // 2.06 RSH → CSK

  // Demo: first 3 fantasy picks already made
  picks[0].draftedPlayerId = "r001"; picks[0].draftedAt = "2026-04-26T18:00:00Z"; // Fernando Mendoza → THK
  picks[1].draftedPlayerId = "r003"; picks[1].draftedAt = "2026-04-26T18:05:00Z"; // Jeremiyah Love → DWV
  picks[2].draftedPlayerId = "r004"; picks[2].draftedAt = "2026-04-26T18:10:00Z"; // Carnell Tate → IRT
  return picks;
}

export const MOCK_PICKS: DraftBoardPick[] = buildMockPicks();

// ─── 2026 NFL Draft Rookies ────────────────────────────────────────────────────
// Source: 2026 NFL Draft (April 23-25, Pittsburgh, PA) — 252 selections
// nflDraftPick = overall pick number

type DC = string | null;
type OL = string | null;

function avail(
  id: string, fullName: string, position: string, nflTeam: string,
  college: string, round: number, pick: number, dc: DC = null, outlook: OL = null
): DraftBoardRookie {
  return { id, fullName, position, nflTeam, college, nflDraftRound: round, nflDraftPick: pick, draftStatus: "available", draftedByTeamId: null, depthChartPosition: dc, fantasyOutlook: outlook };
}

function drafted(
  id: string, fullName: string, position: string, nflTeam: string,
  college: string, round: number, pick: number, teamId: string, dc: DC = null, outlook: OL = null
): DraftBoardRookie {
  return { id, fullName, position, nflTeam, college, nflDraftRound: round, nflDraftPick: pick, draftStatus: "drafted", draftedByTeamId: teamId, depthChartPosition: dc, fantasyOutlook: outlook };
}

export const MOCK_ROOKIES: DraftBoardRookie[] = [

  // ── Round 1 ────────────────────────────────────────────────────────────────
  drafted("r001", "Fernando Mendoza",    "QB",  "LV",  "Indiana",                 1,   1,  "t01", "QB1", "First overall pick to Vegas. Elite NFL prospect with outstanding college production at Indiana. Year-one starter with immediate QB1 fantasy upside in a pass-first offense."),
  avail  ("r002", "David Bailey",        "LB",  "NYJ", "Texas Tech",              1,   2),
  drafted("r003", "Jeremiyah Love",      "RB",  "ARI", "Notre Dame",              1,   3,  "t02", "RB1", "Third overall pick — elite athlete with great pass-catching ability. Arizona features him as a workhorse from day one. Dynasty RB1 with immediate upside."),
  drafted("r004", "Carnell Tate",        "WR",  "TEN", "Ohio State",              1,   4,  "t03", "WR1", "Fourth overall — Ohio State's top WR in years. Polished route runner who lands as Tennessee's clear WR1 target. Dynasty WR1 talent with immediate floor."),
  avail  ("r005", "Arvell Reese",        "LB",  "NYG", "Ohio State",              1,   5),
  avail  ("r006", "Mansoor Delane",      "CB",  "KC",  "LSU",                     1,   6),
  avail  ("r007", "Sonny Styles",        "LB",  "WSH", "Ohio State",              1,   7),
  avail  ("r008", "Jordyn Tyson",        "WR",  "NO",  "Arizona State",           1,   8,  "WR1", "Electric playmaker from Arizona State. Lands in New Orleans with room to become the top pass-catcher in a skilled offense. WR1 upside with volume potential."),
  avail  ("r009", "Spencer Fano",        "OT",  "CLE", "Utah",                    1,   9),
  avail  ("r010", "Francis Mauigoa",     "OG",  "NYG", "Miami (FL)",              1,  10),
  avail  ("r011", "Caleb Downs",         "S",   "DAL", "Ohio State",              1,  11),
  avail  ("r012", "Kadyn Proctor",       "OT",  "MIA", "Alabama",                 1,  12),
  avail  ("r013", "Ty Simpson",          "QB",  "LAR", "Alabama",                 1,  13, "QB1", "First-round QB who lands with the Rams under Sean McVay. Elite arm talent in a proven scheme. Long-term QB1 upside in a great landing spot."),
  avail  ("r014", "Vega Ioane",          "OG",  "BAL", "Penn State",              1,  14),
  avail  ("r015", "Rueben Bain Jr.",     "DE",  "TB",  "Miami (FL)",              1,  15),
  avail  ("r016", "Kenyon Sadiq",        "TE",  "NYJ", "Oregon",                  1,  16, "TE1", "Best TE in the 2026 class. Oregon product to NYJ with excellent hands, route running, and blocking. Immediate TE1 value in a pass-heavy offense."),
  avail  ("r017", "Blake Miller",        "OT",  "DET", "Clemson",                 1,  17),
  avail  ("r018", "Caleb Banks",         "DE",  "MIN", "Florida",                 1,  18),
  avail  ("r019", "Monroe Freeling",     "OT",  "CAR", "Georgia",                 1,  19),
  avail  ("r020", "Makai Lemon",         "WR",  "PHI", "USC",                     1,  20, "WR2", "USC product to Philadelphia — strong fit in an elite passing game. Immediate WR2/3 value with WR1 ceiling as the offense evolves."),
  avail  ("r021", "Max Iheanachor",      "OT",  "PIT", "Arizona State",           1,  21),
  avail  ("r022", "Akheem Mesidor",      "LB",  "LAC", "Miami (FL)",              1,  22),
  avail  ("r023", "Malachi Lawrence",    "DE",  "DAL", "UCF",                     1,  23),
  avail  ("r024", "KC Concepcion",       "WR",  "CLE", "Texas A&M",               1,  24, "WR1", "Strong-handed WR from Texas A&M to Cleveland. Clear WR1 target for whoever lines up at QB. Great route tree and physicality."),
  avail  ("r025", "Dillon Thieneman",    "S",   "CHI", "Oregon",                  1,  25),
  avail  ("r026", "Keylan Rutledge",     "OG",  "HOU", "Georgia Tech",            1,  26),
  avail  ("r027", "Chris Johnson",       "CB",  "MIA", "San Diego State",         1,  27),
  avail  ("r028", "Caleb Lomu",          "OT",  "NE",  "Utah",                    1,  28),
  avail  ("r029", "Peter Woods",         "DT",  "KC",  "Clemson",                 1,  29),
  avail  ("r030", "Omar Cooper Jr.",     "WR",  "NYJ", "Indiana",                 1,  30, "WR2", "Indiana WR reunites with Fernando Mendoza's alma mater in New York. Chemistry upside with Sam Darnold and early role in NYJ's offense."),
  avail  ("r031", "Keldric Faulk",       "DE",  "TEN", "Auburn",                  1,  31),
  avail  ("r032", "Jadarian Price",      "RB",  "SEA", "Notre Dame",              1,  32, "RB1", "Last pick of round 1 — talented back from Notre Dame to Seattle's strong run game. Three-down ability with immediate starter upside. High floor in a proven system."),

  // ── Round 2 ────────────────────────────────────────────────────────────────
  avail  ("r033", "De'Zhaun Stribling",  "WR",  "SF",  "Ole Miss",                2,  33, "WR3", "Big, physical WR to San Francisco's scheme. Shanahan WRs historically produce well in dynasty. Late-bloomer ceiling."),
  avail  ("r034", "Chase Bisontis",      "OG",  "ARI", "Texas A&M",               2,  34),
  avail  ("r035", "T.J. Parker",         "DE",  "BUF", "Clemson",                 2,  35),
  avail  ("r036", "Kayden McDonald",     "DT",  "HOU", "Ohio State",              2,  36),
  avail  ("r037", "Colton Hood",         "CB",  "NYG", "Tennessee",               2,  37),
  avail  ("r038", "Treydan Stukes",      "S",   "LV",  "Arizona",                 2,  38),
  avail  ("r039", "Denzel Boston",       "WR",  "CLE", "Washington",              2,  39, "WR2", "Second WR to Cleveland gives them a two-headed threat. Volume upside in a pass-heavy offense and good size/athleticism combination."),
  avail  ("r040", "R Mason Thomas",      "DE",  "KC",  "Oklahoma",                2,  40),
  avail  ("r041", "Cashius Howell",      "DE",  "CIN", "Texas A&M",               2,  41),
  avail  ("r042", "Christen Miller",     "DT",  "NO",  "Georgia",                 2,  42),
  avail  ("r043", "Jacob Rodriguez",     "LB",  "MIA", "Texas Tech",              2,  43),
  avail  ("r044", "Derrick Moore",       "DE",  "DET", "Michigan",                2,  44),
  avail  ("r045", "Zion Young",          "LB",  "BAL", "Missouri",                2,  45),
  avail  ("r046", "Josiah Trotter",      "LB",  "TB",  "Missouri",                2,  46),
  avail  ("r047", "Germie Bernard",      "WR",  "PIT", "Alabama",                 2,  47, "WR2", "Alabama WR lands in Pittsburgh. Reliable hands and solid routes — could develop into a primary target in the Steelers' rebuild."),
  avail  ("r048", "Avieon Terrell",      "CB",  "ATL", "Clemson",                 2,  48),
  avail  ("r049", "Lee Hunter",          "DT",  "CAR", "Texas Tech",              2,  49),
  avail  ("r050", "D'Angelo Ponds",      "CB",  "NYJ", "Indiana",                 2,  50),
  avail  ("r051", "Jake Golday",         "LB",  "MIN", "Cincinnati",              2,  51),
  avail  ("r052", "Brandon Cisse",       "CB",  "GB",  "South Carolina",          2,  52),
  avail  ("r053", "CJ Allen",            "LB",  "IND", "Georgia",                 2,  53),
  avail  ("r054", "Eli Stowers",         "TE",  "PHI", "Vanderbilt",              2,  54, "TE2", "TE depth in Philadelphia's passing game. Solid hands and good athleticism — could develop into a starter."),
  avail  ("r055", "Gabe Jacas",          "DE",  "NE",  "Illinois",                2,  55),
  avail  ("r056", "Nate Boerkircher",    "TE",  "JAX", "Texas A&M",               2,  56, "TE1", "Quality TE2/TE1 in Jacksonville. Red zone threat with solid hands and the ability to line up in multiple spots."),
  avail  ("r057", "Logan Jones",         "C",   "CHI", "Iowa",                    2,  57),
  avail  ("r058", "Emmanuel McNeil-Warren","S",  "CLE", "Toledo",                  2,  58),
  avail  ("r059", "Marlin Klein",        "TE",  "HOU", "Michigan",                2,  59, "TE1", "Michigan TE to Houston lands with CJ Stroud at QB. Great situation for a receiving TE — high floor and immediate role."),
  avail  ("r060", "Anthony Hill Jr.",    "LB",  "TEN", "Texas",                   2,  60),
  avail  ("r061", "Max Klare",           "TE",  "LAR", "Ohio State",              2,  61, "TE1", "Ohio State product to the Rams. McVay uses TEs creatively — good situation for a rookie with receiving ability."),
  avail  ("r062", "Davison Igbinosun",   "CB",  "BUF", "Ohio State",              2,  62),
  avail  ("r063", "Jake Slaughter",      "C",   "LAC", "Florida",                 2,  63),
  avail  ("r064", "Bud Clark",           "S",   "SEA", "TCU",                     2,  64),

  // ── Round 3 ────────────────────────────────────────────────────────────────
  avail  ("r065", "Carson Beck",         "QB",  "ARI", "Miami (FL)",              3,  65, "QB1", "Strong-armed QB who put up big numbers at Miami. Lands in Arizona where he immediately competes for the starting job alongside Jeremiyah Love."),
  avail  ("r066", "Tyler Onyedim",       "DT",  "DEN", "Texas A&M",               3,  66),
  avail  ("r067", "Keyron Crawford",     "DE",  "LV",  "Auburn",                  3,  67),
  avail  ("r068", "Markel Bell",         "OT",  "PHI", "Miami (FL)",              3,  68),
  avail  ("r069", "Sam Roush",           "TE",  "CHI", "Stanford",                3,  69, "TE2", "Stanford TE in Chicago with Caleb Williams. Good connection potential in a high-upside passing game."),
  avail  ("r070", "Romello Height",      "LB",  "SF",  "Texas Tech",              3,  70),
  avail  ("r071", "Antonio Williams",    "WR",  "WSH", "Clemson",                 3,  71, "WR3", "Clemson WR to Washington. Physical receiver who can make an impact as a complementary piece."),
  avail  ("r072", "Tacario Davis",       "CB",  "CIN", "Washington",              3,  72),
  avail  ("r073", "Oscar Delp",          "TE",  "NO",  "Georgia",                 3,  73, "TE2", "Georgia TE to New Orleans. Fits their scheme and has receiving ability. Upside as a starter."),
  avail  ("r074", "Malachi Fields",      "WR",  "NYG", "Notre Dame",              3,  74, "WR2", "Notre Dame WR to the Giants. Good hands and reliable route runner — solid floor with upside in New York's offense."),
  avail  ("r075", "Caleb Douglas",       "WR",  "MIA", "Texas Tech",              3,  75, "WR3", "WR depth in Miami's explosive offense. Could develop into a contributor with good QB play around him."),
  avail  ("r076", "Drew Allar",          "QB",  "PIT", "Penn State",              3,  76, "QB2", "Smart, accurate Penn State QB in Pittsburgh. Good infrastructure and coaching staff. Long-term starter upside."),
  avail  ("r077", "Chris McClellan",     "DT",  "GB",  "Missouri",                3,  77),
  avail  ("r078", "A.J. Haulcy",         "S",   "IND", "LSU",                     3,  78),
  avail  ("r079", "Zachariah Branch",    "WR",  "ATL", "Georgia",                 3,  79, "WR2", "Speed threat to Atlanta's potent offense. Immediate big-play upside in a system that values explosive receivers."),
  avail  ("r080", "Ja'Kobi Lane",        "WR",  "BAL", "USC",                     3,  80, "WR2", "USC WR lands in Baltimore. Could thrive with Lamar Jackson throwing him the ball — big-play ability."),
  avail  ("r081", "Albert Regis",        "DT",  "JAX", "Texas A&M",               3,  81),
  avail  ("r082", "Domonique Orange",    "DT",  "MIN", "Iowa State",              3,  82),
  avail  ("r083", "Chris Brazzell II",   "WR",  "CAR", "Tennessee",               3,  83, "WR2", "Tennessee WR to Carolina. Good size and athleticism in a team with a developing offense."),
  avail  ("r084", "Ted Hurst",           "WR",  "TB",  "Georgia State",            3,  84),
  avail  ("r085", "Daylen Everette",     "CB",  "PIT", "Georgia",                 3,  85),
  avail  ("r086", "Austin Barber",       "OT",  "CLE", "Florida",                 3,  86),
  avail  ("r087", "Will Kacmarek",       "TE",  "MIA", "Ohio State",              3,  87, "TE2", "Ohio State TE in Miami — good receiving ability in a pass-friendly offense. Competition for role but upside is real."),
  avail  ("r088", "Emmanuel Pregnon",    "OG",  "JAX", "Oregon",                  3,  88),
  avail  ("r089", "Zavion Thomas",       "WR",  "CHI", "LSU",                     3,  89, "WR3", "LSU WR to Chicago — joins Caleb Williams' weapons group. Upside as a developmental piece."),
  avail  ("r090", "Kaelon Black",        "RB",  "SF",  "Indiana",                 3,  90, "RB2", "Versatile Indiana back in Shanahan's scheme. Could develop into a featured role — Shanahan RBs tend to outperform expectations."),
  avail  ("r091", "Trey Zuhn III",       "C",   "LV",  "Texas A&M",               3,  91),
  avail  ("r092", "Jaishawn Barham",     "LB",  "DAL", "Michigan",                3,  92),
  avail  ("r093", "Keagen Trost",        "OT",  "LAR", "Missouri",                3,  93),
  avail  ("r094", "Chris Bell",          "WR",  "MIA", "Louisville",              3,  94),
  avail  ("r095", "Eli Raridon",         "TE",  "NE",  "Notre Dame",              3,  95, "TE2", "Notre Dame TE to New England. Long-term upside in a rebuilding offense. Dynasty stash with starter ceiling."),
  avail  ("r096", "Gennings Dunker",     "OT",  "PIT", "Iowa",                    3,  96),
  avail  ("r097", "Caleb Tiernan",       "OT",  "MIN", "Northwestern",            3,  97),
  avail  ("r098", "Jakobe Thomas",       "S",   "MIN", "Miami (FL)",              3,  98),
  avail  ("r099", "Julian Neal",         "CB",  "SEA", "Arkansas",                3,  99),
  avail  ("r100", "Jalen Huskey",        "S",   "JAX", "Maryland",                3, 100),

  // ── Round 4 ────────────────────────────────────────────────────────────────
  avail  ("r101", "Jermod McCoy",        "CB",  "LV",  "Tennessee",               4, 101),
  avail  ("r102", "Jude Bowry",          "OT",  "BUF", "Boston College",          4, 102),
  avail  ("r103", "Darrell Jackson Jr.", "DT",  "NYJ", "Florida State",           4, 103),
  avail  ("r104", "Kaleb Proctor",       "DT",  "ARI", "Southeastern Louisiana",  4, 104),
  avail  ("r105", "Brenen Thompson",     "WR",  "LAC", "Mississippi State",       4, 105),
  avail  ("r106", "Febechi Nwaiwu",      "OG",  "HOU", "Oklahoma",                4, 106),
  avail  ("r107", "Gracen Halton",       "DT",  "SF",  "Oklahoma",                4, 107),
  avail  ("r108", "Jonah Coleman",       "RB",  "DEN", "Washington",              4, 108, "RB1", "Physical Washington back to Denver's improving offense. Volume potential as the lead back in a run-friendly scheme."),
  avail  ("r109", "Jadon Canady",        "CB",  "KC",  "Oregon",                  4, 109),
  avail  ("r110", "Cade Klubnik",        "QB",  "NYJ", "Clemson",                 4, 110, "QB2", "Dynamic dual-threat QB from Clemson to the Jets. Could compete for a starting role sooner than expected. Big upside if he develops."),
  avail  ("r111", "Kage Casey",          "OT",  "DEN", "Boise State",             4, 111),
  avail  ("r112", "Drew Shelton",        "OT",  "DAL", "Penn State",              4, 112),
  avail  ("r113", "Jalen Farmer",        "OG",  "IND", "Kentucky",                4, 113),
  avail  ("r114", "Devin Moore",         "CB",  "DAL", "Florida",                 4, 114),
  avail  ("r115", "Elijah Sarratt",      "WR",  "BAL", "Indiana",                 4, 115),
  avail  ("r116", "Keionte Scott",       "CB",  "TB",  "Miami (FL)",              4, 116),
  avail  ("r117", "Travis Burke",        "OT",  "LAC", "Memphis",                 4, 117),
  avail  ("r118", "Jimmy Rolder",        "LB",  "DET", "Michigan",                4, 118),
  avail  ("r119", "Wesley Williams",     "DE",  "JAX", "Duke",                    4, 119),
  avail  ("r120", "Dani Dennis-Sutton",  "DE",  "GB",  "Penn State",              4, 120),
  avail  ("r121", "Kaden Wetjen",        "WR",  "PIT", "Iowa",                    4, 121),
  avail  ("r122", "Mike Washington Jr.", "RB",  "LV",  "Arkansas",                4, 122, "RB2", "Arkansas back joins the Raiders' backfield. Good complement to the offense — handcuff value and upside if given volume."),
  avail  ("r123", "Wade Woodaz",         "LB",  "HOU", "Clemson",                 4, 123),
  avail  ("r124", "Malik Muhammad",      "CB",  "CHI", "Texas",                   4, 124),
  avail  ("r125", "Skyler Bell",         "WR",  "BUF", "UConn",                   4, 125),
  avail  ("r126", "Kaleb Elarms-Orr",    "LB",  "BUF", "TCU",                     4, 126),
  avail  ("r127", "Carver Willis",       "OT",  "SF",  "Washington",              4, 127),
  avail  ("r128", "Connor Lew",          "C",   "CIN", "Auburn",                  4, 128),
  avail  ("r129", "Will Lee III",        "CB",  "CAR", "Texas A&M",               4, 129),
  avail  ("r130", "Trey Moore",          "DE",  "MIA", "Texas",                   4, 130),
  avail  ("r131", "Genesis Smith",       "S",   "LAC", "Arizona",                 4, 131),
  avail  ("r132", "Jeremiah Wright",     "OG",  "NO",  "Auburn",                  4, 132),
  avail  ("r133", "Matthew Hibner",      "TE",  "BAL", "SMU",                     4, 133),
  avail  ("r134", "Kendal Daniels",      "LB",  "ATL", "Oklahoma",                4, 134),
  avail  ("r135", "Bryce Boettcher",     "LB",  "IND", "Oregon",                  4, 135),
  avail  ("r136", "Bryce Lance",         "WR",  "NO",  "North Dakota State",      4, 136),
  avail  ("r137", "LT Overton",          "DT",  "DAL", "Alabama",                 4, 137),
  avail  ("r138", "Kyle Louis",          "LB",  "MIA", "Pittsburgh",              4, 138),
  avail  ("r139", "Ephesians Prysock",   "CB",  "SF",  "Washington",              4, 139),
  avail  ("r140", "Colbie Young",        "WR",  "CIN", "Georgia",                 4, 140),

  // ── Round 5 ────────────────────────────────────────────────────────────────
  avail  ("r141", "Kamari Ramsey",       "S",   "HOU", "USC",                     5, 141),
  avail  ("r142", "Fernando Carmona",    "OG",  "TEN", "Arkansas",                5, 142),
  avail  ("r143", "Reggie Virgil",       "WR",  "ARI", "Texas Tech",              5, 143),
  avail  ("r144", "Sam Hecht",           "C",   "CAR", "Kansas State",            5, 144),
  avail  ("r145", "Nick Barrett",        "DT",  "LAC", "South Carolina",          5, 145),
  avail  ("r146", "Parker Brailsford",   "C",   "CLE", "Alabama",                 5, 146),
  avail  ("r147", "Joshua Josephs",      "DE",  "WSH", "Tennessee",               5, 147),
  avail  ("r148", "Beau Stephens",       "OG",  "SEA", "Iowa",                    5, 148),
  avail  ("r149", "Justin Jefferson",    "LB",  "CLE", "Alabama",                 5, 149),
  avail  ("r150", "Dalton Johnson",      "S",   "LV",  "Arizona",                 5, 150),
  avail  ("r151", "Zakee Wheatley",      "S",   "CAR", "Penn State",              5, 151),
  avail  ("r152", "Justin Joly",         "TE",  "DEN", "NC State",                5, 152),
  avail  ("r153", "Jager Burton",        "C",   "GB",  "Kentucky",                5, 153),
  avail  ("r154", "Jaden Dugger",        "LB",  "SF",  "Louisiana",               5, 154),
  avail  ("r155", "DeMonte Capehart",    "DT",  "TB",  "Clemson",                 5, 155),
  avail  ("r156", "George Gumbs Jr.",    "DE",  "IND", "Florida",                 5, 156),
  avail  ("r157", "Keith Abney II",      "CB",  "DET", "Arizona State",           5, 157),
  avail  ("r158", "Michael Taaffe",      "S",   "MIA", "Texas",                   5, 158),
  avail  ("r159", "Max Bredeson",        "FB",  "MIN", "Michigan",                5, 159),
  avail  ("r160", "Billy Schrauth",      "OG",  "TB",  "Notre Dame",              5, 160),
  avail  ("r161", "Emmett Johnson",      "RB",  "KC",  "Nebraska",                5, 161, null,  "Late-round stash in Kansas City. Could carve out a pass-catching role in Andy Reid's offense."),
  avail  ("r162", "Chandler Rivers",     "CB",  "BAL", "Duke",                    5, 162),
  avail  ("r163", "Charles Demmings",    "CB",  "MIN", "Stephen F. Austin",       5, 163),
  avail  ("r164", "Tanner Koziol",       "TE",  "JAX", "Houston",                 5, 164),
  avail  ("r165", "Nicholas Singleton",  "RB",  "TEN", "Penn State",              5, 165, "RB2", "Powerful downhill runner from Penn State heading to Tennessee. High floor if he earns volume. Physical style fits the Titans' run-first scheme."),
  avail  ("r166", "Keyshaun Elliott",    "LB",  "CHI", "Arizona State",           5, 166),
  avail  ("r167", "Jalon Kilgore",       "S",   "BUF", "South Carolina",          5, 167),
  avail  ("r168", "Kendrick Law",        "WR",  "DET", "Kentucky",                5, 168),
  avail  ("r169", "Riley Nowakowski",    "TE",  "PIT", "Indiana",                 5, 169),
  avail  ("r170", "Joe Royer",           "TE",  "CLE", "Cincinnati",              5, 170),
  avail  ("r171", "Karon Prunty",        "CB",  "NE",  "Wake Forest",             5, 171),
  avail  ("r172", "Lorenzo Styles Jr.",  "S",   "NO",  "Ohio State",              5, 172),
  avail  ("r173", "Josh Cuevas",         "TE",  "BAL", "Alabama",                 5, 173),
  avail  ("r174", "Adam Randall",        "RB",  "BAL", "Clemson",                 5, 174, null,  "Late stash in a run-heavy Baltimore offense. Upside as a handcuff behind a featured back."),
  avail  ("r175", "Hezekiah Masses",     "CB",  "LV",  "California",              5, 175),
  avail  ("r176", "Cyrus Allen",         "WR",  "KC",  "Cincinnati",              5, 176),
  avail  ("r177", "Kevin Coleman Jr.",   "WR",  "MIA", "Missouri",                5, 177),
  avail  ("r178", "Cole Payton",         "QB",  "PHI", "North Dakota State",      5, 178),
  avail  ("r179", "Enrique Cruz Jr.",    "OT",  "SF",  "Kansas",                  5, 179),
  avail  ("r180", "Seydou Traore",       "TE",  "MIA", "Mississippi State",       5, 180),
  avail  ("r181", "Zane Durant",         "DT",  "BUF", "Penn State",              5, 181),

  // ── Round 6 ────────────────────────────────────────────────────────────────
  avail  ("r182", "Taylen Green",        "QB",  "CLE", "Arkansas",                6, 182),
  avail  ("r183", "Karson Sharar",       "LB",  "ARI", "Iowa",                    6, 183),
  avail  ("r184", "Jackie Marshall",     "DT",  "TEN", "Baylor",                  6, 184),
  avail  ("r185", "Bauer Sharp",         "TE",  "TB",  "LSU",                     6, 185),
  avail  ("r186", "Bobby Jamison-Travis","DT",  "NYG", "Auburn",                  6, 186),
  avail  ("r187", "Kaytron Allen",       "RB",  "WSH", "Penn State",              6, 187, null,  "Penn State back to Washington. Powerful runner who could earn volume — dynasty flier with upside."),
  avail  ("r188", "Anez Cooper",         "OG",  "NYJ", "Miami (FL)",              6, 188),
  avail  ("r189", "Brian Parker II",     "C",   "CIN", "Duke",                    6, 189),
  avail  ("r190", "Barion Brown",        "WR",  "NO",  "LSU",                     6, 190),
  avail  ("r191", "Josh Cameron",        "WR",  "JAX", "Baylor",                  6, 191),
  avail  ("r192", "J.C. Davis",          "OT",  "NYG", "Illinois",                6, 192),
  avail  ("r193", "Jack Kelly",          "LB",  "NYG", "BYU",                     6, 193),
  avail  ("r194", "Pat Coogan",          "C",   "TEN", "Indiana",                 6, 194),
  avail  ("r195", "Malik Benson",        "WR",  "LV",  "Oregon",                  6, 195),
  avail  ("r196", "Dametrious Crownover","OT",  "NE",  "Texas A&M",               6, 196),
  avail  ("r197", "CJ Daniels",          "WR",  "LAR", "Miami (FL)",              6, 197),
  avail  ("r198", "Demond Claiborne",    "RB",  "MIN", "Wake Forest",             6, 198),
  avail  ("r199", "Emmanuel Henderson Jr.","WR","SEA", "Kansas",                  6, 199),
  avail  ("r200", "DJ Campbell",         "OG",  "MIA", "Texas",                   6, 200),
  avail  ("r201", "Domani Jackson",      "CB",  "GB",  "Alabama",                 6, 201),
  avail  ("r202", "Logan Taylor",        "OG",  "LAC", "Boston College",          6, 202),
  avail  ("r203", "CJ Williams",         "WR",  "JAX", "Stanford",                6, 203),
  avail  ("r204", "Lewis Bond",          "WR",  "HOU", "Boston College",          6, 204),
  avail  ("r205", "Skyler Gill-Howard",  "DT",  "DET", "Texas Tech",              6, 205),
  avail  ("r206", "Alex Harkey",         "OG",  "LAC", "Oregon",                  6, 206),
  avail  ("r207", "Micah Morris",        "OG",  "PHI", "Georgia",                 6, 207),
  avail  ("r208", "Anterio Thompson",    "DT",  "ATL", "Washington",              6, 208),
  avail  ("r209", "Matt Gulbin",         "C",   "WSH", "Michigan State",          6, 209),
  avail  ("r210", "Gabriel Rubio",       "DT",  "PIT", "Notre Dame",              6, 210),
  avail  ("r211", "Ryan Eckley",         "P",   "BAL", "Michigan State",          6, 211),
  avail  ("r212", "Namdi Obiazor",       "LB",  "NE",  "TCU",                     6, 212),
  avail  ("r213", "Jordan van den Berg", "DT",  "CHI", "Georgia Tech",            6, 213),
  avail  ("r214", "Caden Curry",         "DE",  "IND", "Ohio State",              6, 214),
  avail  ("r215", "Harold Perkins Jr.",  "LB",  "ATL", "LSU",                     6, 215),
  avail  ("r216", "Trey Smack",          "K",   "GB",  "Florida",                 6, 216),

  // ── Round 7 ────────────────────────────────────────────────────────────────
  avail  ("r217", "Jayden Williams",     "OT",  "ARI", "Ole Miss",                7, 217),
  avail  ("r218", "Anthony Smith",       "WR",  "DAL", "East Carolina",           7, 218),
  avail  ("r219", "TJ Hall",             "CB",  "NO",  "Iowa",                    7, 219),
  avail  ("r220", "Toriano Pride Jr.",   "CB",  "BUF", "Missouri",                7, 220),
  avail  ("r221", "Jack Endries",        "TE",  "CIN", "Texas",                   7, 221),
  avail  ("r222", "Tyre West",           "DE",  "DET", "Tennessee",               7, 222),
  avail  ("r223", "Athan Kaliakmanis",   "QB",  "WSH", "Rutgers",                 7, 223),
  avail  ("r224", "Robert Spears-Jennings","S", "PIT", "Oklahoma",                7, 224),
  avail  ("r225", "Jaren Kanak",         "TE",  "TEN", "Oklahoma",                7, 225),
  avail  ("r226", "Landon Robinson",     "DT",  "CIN", "Navy",                    7, 226),
  avail  ("r227", "Jackson Kuwatch",     "LB",  "CAR", "Miami (OH)",              7, 227),
  avail  ("r228", "VJ Payne",            "S",   "NYJ", "Kansas State",            7, 228),
  avail  ("r229", "Brandon Cleveland",   "DT",  "LV",  "NC State",                7, 229),
  avail  ("r230", "Eli Heidenreich",     "RB",  "PIT", "Navy",                    7, 230),
  avail  ("r231", "Ethan Onianwa",       "OT",  "ATL", "Ohio State",              7, 231),
  avail  ("r232", "Tim Keenan III",      "DT",  "LAR", "Alabama",                 7, 232),
  avail  ("r233", "Zach Durfee",         "DE",  "JAX", "Washington",              7, 233),
  avail  ("r234", "Behren Morton",       "QB",  "NE",  "Texas Tech",              7, 234),
  avail  ("r235", "Gavin Gerhardt",      "C",   "MIN", "Cincinnati",              7, 235),
  avail  ("r236", "Andre Fuller",        "CB",  "SEA", "Toledo",                  7, 236),
  avail  ("r237", "Seth McGowan",        "RB",  "IND", "Kentucky",                7, 237),
  avail  ("r238", "Max Llewellyn",       "DE",  "MIA", "Iowa",                    7, 238),
  avail  ("r239", "Tommy Doman",         "P",   "BUF", "Florida",                 7, 239),
  avail  ("r240", "Parker Hughes",       "LB",  "JAX", "Middle Tennessee",        7, 240),
  avail  ("r241", "Ar'maj Reed-Adams",   "OG",  "BUF", "Texas A&M",               7, 241),
  avail  ("r242", "Deven Eastern",       "DT",  "SEA", "Minnesota",               7, 242),
  avail  ("r243", "Aiden Fisher",        "LB",  "HOU", "Indiana",                 7, 243),
  avail  ("r244", "Cole Wisniewski",     "S",   "PHI", "Texas Tech",              7, 244),
  avail  ("r245", "Jam Miller",          "RB",  "NE",  "Alabama",                 7, 245),
  avail  ("r246", "Miles Scott",         "S",   "DEN", "Illinois",                7, 246),
  avail  ("r247", "Quintayvious Hutchins","DE",  "NE",  "Boston College",          7, 247),
  avail  ("r248", "Carsen Ryan",         "TE",  "CLE", "BYU",                     7, 248),
  avail  ("r249", "Garrett Nussmeier",   "QB",  "KC",  "LSU",                     7, 249),
  avail  ("r250", "Rayshaun Benny",      "DT",  "BAL", "Michigan",                7, 250),
  avail  ("r251", "Uar Bernard",         "DT",  "PHI", "International Pathway",   7, 251),
];
