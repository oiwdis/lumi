export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Biome =
  | 'forest' | 'ocean' | 'arctic' | 'savanna' | 'jungle'
  | 'desert' | 'mountain' | 'swamp' | 'sky' | 'mythical';

export const SELL_PRICE: Record<Rarity, number> = {
  common:    10,
  uncommon:  25,
  rare:      70,
  epic:      200,
  legendary: 600,
};

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  biome: Biome;
  description: string;
}

export interface Box {
  id: string;
  name: string;
  emoji: string;
  biome: Biome;
  description: string;
  cost: number;
  color: string;
  levelRequired: number;
  itemsPerOpen: number;
  rarityWeights: Record<Rarity, number>;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common:    '#9CA3AF',
  uncommon:  '#34D399',
  rare:      '#60A5FA',
  epic:      '#A78BFA',
  legendary: '#F59E0B',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

export const ITEMS: ShopItem[] = [
  // ── Forest (Lv 1) ──────────────────────────────────────────
  { id: 'f_squirrel',  name: 'Squirrel',       emoji: '🐿️', rarity: 'common',    biome: 'forest',   description: 'A nimble nut-hoarder of the woods' },
  { id: 'f_rabbit',    name: 'Rabbit',          emoji: '🐇', rarity: 'common',    biome: 'forest',   description: 'Quick ears, quicker feet' },
  { id: 'f_hedgehog',  name: 'Hedgehog',        emoji: '🦔', rarity: 'common',    biome: 'forest',   description: 'Tiny but spiky' },
  { id: 'f_deer',      name: 'Deer',            emoji: '🦌', rarity: 'uncommon',  biome: 'forest',   description: 'Graceful wanderer of the forest' },
  { id: 'f_fox',       name: 'Fox',             emoji: '🦊', rarity: 'uncommon',  biome: 'forest',   description: 'Cunning and quick-witted' },
  { id: 'f_wolf',      name: 'Wolf',            emoji: '🐺', rarity: 'rare',      biome: 'forest',   description: 'Pack hunter of the deep woods' },
  { id: 'f_boar',      name: 'Wild Boar',       emoji: '🐗', rarity: 'rare',      biome: 'forest',   description: 'Fearless and ferocious' },
  { id: 'f_bear',      name: 'Brown Bear',      emoji: '🐻', rarity: 'epic',      biome: 'forest',   description: 'King of the forest floor' },
  { id: 'f_owl',       name: 'Great Owl',       emoji: '🦉', rarity: 'epic',      biome: 'forest',   description: 'Silent night hunter' },
  { id: 'f_unicorn',   name: 'Forest Unicorn',  emoji: '🦄', rarity: 'legendary', biome: 'forest',   description: 'A mythical horse rumoured to live in ancient groves' },

  // ── Ocean (Lv 2) ──────────────────────────────────────────
  { id: 'o_crab',      name: 'Crab',            emoji: '🦀', rarity: 'common',    biome: 'ocean',    description: 'Sideways sprinter of the shallows' },
  { id: 'o_shrimp',    name: 'Shrimp',          emoji: '🦐', rarity: 'common',    biome: 'ocean',    description: 'Tiny but surprisingly strong' },
  { id: 'o_fish',      name: 'Tropical Fish',   emoji: '🐠', rarity: 'common',    biome: 'ocean',    description: 'A flash of colour in the reef' },
  { id: 'o_octopus',   name: 'Octopus',         emoji: '🐙', rarity: 'uncommon',  biome: 'ocean',    description: 'Eight arms, infinite tricks' },
  { id: 'o_pufferfish',name: 'Pufferfish',      emoji: '🐡', rarity: 'uncommon',  biome: 'ocean',    description: 'Inflates when startled' },
  { id: 'o_shark',     name: 'Shark',           emoji: '🦈', rarity: 'rare',      biome: 'ocean',    description: 'Apex predator of the deep' },
  { id: 'o_turtle',    name: 'Sea Turtle',      emoji: '🐢', rarity: 'rare',      biome: 'ocean',    description: 'Ancient mariner, slow but sure' },
  { id: 'o_dolphin',   name: 'Dolphin',         emoji: '🐬', rarity: 'epic',      biome: 'ocean',    description: 'Playful genius of the sea' },
  { id: 'o_whale',     name: 'Blue Whale',      emoji: '🐋', rarity: 'epic',      biome: 'ocean',    description: 'Largest creature to ever exist' },
  { id: 'o_kraken',    name: 'Kraken',          emoji: '🦑', rarity: 'legendary', biome: 'ocean',    description: 'Legendary beast of the abyss' },

  // ── Arctic (Lv 3) ─────────────────────────────────────────
  { id: 'a_penguin',   name: 'Penguin',         emoji: '🐧', rarity: 'common',    biome: 'arctic',   description: 'Tuxedo-wearing waddle champion' },
  { id: 'a_snowflake', name: 'Arctic Hare',     emoji: '🐰', rarity: 'common',    biome: 'arctic',   description: 'White coat, invisible in snow' },
  { id: 'a_seal',      name: 'Seal',            emoji: '🦭', rarity: 'common',    biome: 'arctic',   description: 'Blubbery and utterly adorable' },
  { id: 'a_fox',       name: 'Arctic Fox',      emoji: '🦊', rarity: 'uncommon',  biome: 'arctic',   description: 'Snow-white stealth predator' },
  { id: 'a_moose',     name: 'Moose',           emoji: '🫎', rarity: 'uncommon',  biome: 'arctic',   description: 'Tall, antlered, and unbothered' },
  { id: 'a_walrus',    name: 'Walrus',          emoji: '🦣', rarity: 'rare',      biome: 'arctic',   description: 'Tusked titan of the ice shelf' },
  { id: 'a_caribou',   name: 'Caribou',         emoji: '🦌', rarity: 'rare',      biome: 'arctic',   description: 'Long-distance migrator' },
  { id: 'a_polarbear', name: 'Polar Bear',      emoji: '🐻‍❄️', rarity: 'epic',   biome: 'arctic',   description: 'White giant of the frozen north' },
  { id: 'a_orca',      name: 'Orca',            emoji: '🐳', rarity: 'epic',      biome: 'arctic',   description: 'Intelligent pack hunter' },
  { id: 'a_snowdragon',name: 'Snow Dragon',     emoji: '🐲', rarity: 'legendary', biome: 'arctic',   description: 'A ghostly dragon born from blizzards' },

  // ── Savanna (Lv 4) ────────────────────────────────────────
  { id: 's_zebra',     name: 'Zebra',           emoji: '🦓', rarity: 'common',    biome: 'savanna',  description: 'Nature\'s barcode' },
  { id: 's_warthog',   name: 'Warthog',         emoji: '🐗', rarity: 'common',    biome: 'savanna',  description: 'Tusked and tough' },
  { id: 's_flamingo',  name: 'Flamingo',        emoji: '🦩', rarity: 'common',    biome: 'savanna',  description: 'Stands on one leg for fun' },
  { id: 's_giraffe',   name: 'Giraffe',         emoji: '🦒', rarity: 'uncommon',  biome: 'savanna',  description: 'Head in the clouds, literally' },
  { id: 's_hyena',     name: 'Hyena',           emoji: '🐾', rarity: 'uncommon',  biome: 'savanna',  description: 'Laughs at danger' },
  { id: 's_cheetah',   name: 'Cheetah',         emoji: '🐆', rarity: 'rare',      biome: 'savanna',  description: 'Fastest land animal alive' },
  { id: 's_rhino',     name: 'Rhinoceros',      emoji: '🦏', rarity: 'rare',      biome: 'savanna',  description: 'Armoured and unstoppable' },
  { id: 's_elephant',  name: 'Elephant',        emoji: '🐘', rarity: 'epic',      biome: 'savanna',  description: 'Never forgets, never forgives' },
  { id: 's_lion',      name: 'Lion',            emoji: '🦁', rarity: 'epic',      biome: 'savanna',  description: 'The king holds court' },
  { id: 's_sunbird',   name: 'Thunderbird',     emoji: '⚡🦅', rarity: 'legendary', biome: 'savanna', description: 'Legendary storm eagle of the great plains' },

  // ── Jungle (Lv 5) ─────────────────────────────────────────
  { id: 'j_frog',      name: 'Tree Frog',       emoji: '🐸', rarity: 'common',    biome: 'jungle',   description: 'Sticky fingers, loud voice' },
  { id: 'j_parrot',    name: 'Parrot',          emoji: '🦜', rarity: 'common',    biome: 'jungle',   description: 'Repeats everything you say' },
  { id: 'j_snake',     name: 'Boa',             emoji: '🐍', rarity: 'common',    biome: 'jungle',   description: 'Long, patient, deadly hugger' },
  { id: 'j_monkey',    name: 'Monkey',          emoji: '🐒', rarity: 'uncommon',  biome: 'jungle',   description: 'Chaos merchant of the canopy' },
  { id: 'j_toucan',    name: 'Toucan',          emoji: '🦅', rarity: 'uncommon',  biome: 'jungle',   description: 'Beak bigger than its brain' },
  { id: 'j_jaguar',    name: 'Jaguar',          emoji: '🐆', rarity: 'rare',      biome: 'jungle',   description: 'Spotted shadow of the jungle floor' },
  { id: 'j_gorilla',   name: 'Gorilla',         emoji: '🦍', rarity: 'rare',      biome: 'jungle',   description: 'Gentle giant unless provoked' },
  { id: 'j_orangutan', name: 'Orangutan',       emoji: '🦧', rarity: 'epic',      biome: 'jungle',   description: 'Tool-using genius of the trees' },
  { id: 'j_panther',   name: 'Black Panther',   emoji: '🐈‍⬛', rarity: 'epic',   biome: 'jungle',   description: 'Phantom of the jungle night' },
  { id: 'j_thunderape',name: 'Thunder Ape',     emoji: '🦍', rarity: 'legendary', biome: 'jungle',   description: 'A colossal ape said to shake the jungle with a single roar' },

  // ── Desert (Lv 6) ─────────────────────────────────────────
  { id: 'd_lizard',    name: 'Lizard',          emoji: '🦎', rarity: 'common',    biome: 'desert',   description: 'Sun-soaker and fly-catcher' },
  { id: 'd_beetle',    name: 'Scarab Beetle',   emoji: '🪲', rarity: 'common',    biome: 'desert',   description: 'Sacred insect of the dunes' },
  { id: 'd_camel',     name: 'Camel',           emoji: '🐪', rarity: 'common',    biome: 'desert',   description: 'Ship of the desert, two-week tank' },
  { id: 'd_scorpion',  name: 'Scorpion',        emoji: '🦂', rarity: 'uncommon',  biome: 'desert',   description: 'Small but extraordinarily deadly' },
  { id: 'd_vulture',   name: 'Vulture',         emoji: '🦅', rarity: 'uncommon',  biome: 'desert',   description: 'Patient scavenger of the wastes' },
  { id: 'd_fennec',    name: 'Fennec Fox',      emoji: '🦊', rarity: 'rare',      biome: 'desert',   description: 'Enormous ears, tiny body' },
  { id: 'd_cobra',     name: 'King Cobra',      emoji: '🐍', rarity: 'rare',      biome: 'desert',   description: 'Hooded terror of the sands' },
  { id: 'd_cheetah2',  name: 'Sand Cheetah',    emoji: '🐆', rarity: 'epic',      biome: 'desert',   description: 'Pale-coated speed demon of the dunes' },
  { id: 'd_addax',     name: 'Addax',           emoji: '🫎', rarity: 'epic',      biome: 'desert',   description: 'Critically rare spiral-horned antelope' },
  { id: 'd_sandworm',  name: 'Sand Wyrm',       emoji: '🐛', rarity: 'legendary', biome: 'desert',   description: 'A titanic worm that swallows dunes whole' },

  // ── Mountain (Lv 7) ───────────────────────────────────────
  { id: 'm_goat',      name: 'Mountain Goat',   emoji: '🐐', rarity: 'common',    biome: 'mountain', description: 'Defies gravity on sheer cliffs' },
  { id: 'm_marmot',    name: 'Marmot',          emoji: '🐿️', rarity: 'common',   biome: 'mountain', description: 'Whistles a warning, then hides' },
  { id: 'm_pika',      name: 'Pika',            emoji: '🐹', rarity: 'common',    biome: 'mountain', description: 'Tiny alpine squeaker' },
  { id: 'm_eagle',     name: 'Golden Eagle',    emoji: '🦅', rarity: 'uncommon',  biome: 'mountain', description: 'Ruler of mountain thermals' },
  { id: 'm_ibex',      name: 'Ibex',            emoji: '🦌', rarity: 'uncommon',  biome: 'mountain', description: 'Long curved horns, fearless climber' },
  { id: 'm_puma',      name: 'Puma',            emoji: '🐱', rarity: 'rare',      biome: 'mountain', description: 'Ghost cat of the high peaks' },
  { id: 'm_wolfpack',  name: 'Dire Wolf',       emoji: '🐺', rarity: 'rare',      biome: 'mountain', description: 'Ancient wolf of the frozen passes' },
  { id: 'm_yeti',      name: 'Yeti',            emoji: '🦣', rarity: 'epic',      biome: 'mountain', description: 'Abominable snowman, real or myth?' },
  { id: 'm_snowleopard',name:'Snow Leopard',    emoji: '🐾', rarity: 'epic',      biome: 'mountain', description: 'Ghost of the Himalayas' },
  { id: 'm_roc',       name: 'Roc',             emoji: '🦅', rarity: 'legendary', biome: 'mountain', description: 'A bird so vast it darkens entire valleys' },

  // ── Swamp (Lv 8) ──────────────────────────────────────────
  { id: 'sw_frog',     name: 'Bullfrog',        emoji: '🐸', rarity: 'common',    biome: 'swamp',    description: 'Loudest creature in the swamp' },
  { id: 'sw_snail',    name: 'Swamp Snail',     emoji: '🐌', rarity: 'common',    biome: 'swamp',    description: 'Slow, slimy, unstoppable' },
  { id: 'sw_heron',    name: 'Heron',           emoji: '🦢', rarity: 'common',    biome: 'swamp',    description: 'Patient fisher of still waters' },
  { id: 'sw_croc',     name: 'Crocodile',       emoji: '🐊', rarity: 'uncommon',  biome: 'swamp',    description: 'Living fossil, lethal ambusher' },
  { id: 'sw_otter',    name: 'River Otter',     emoji: '🦦', rarity: 'uncommon',  biome: 'swamp',    description: 'Uses rocks as tools, holds hands to sleep' },
  { id: 'sw_anaconda', name: 'Anaconda',        emoji: '🐍', rarity: 'rare',      biome: 'swamp',    description: 'World\'s heaviest snake' },
  { id: 'sw_piranha',  name: 'Piranha',         emoji: '🐟', rarity: 'rare',      biome: 'swamp',    description: 'Tiny teeth, terrifying in numbers' },
  { id: 'sw_hippo',    name: 'Hippo',           emoji: '🦛', rarity: 'epic',      biome: 'swamp',    description: 'Most dangerous animal in Africa' },
  { id: 'sw_leviathan',name:'River Leviathan',  emoji: '🐊', rarity: 'epic',      biome: 'swamp',    description: 'Immense prehistoric croc, still lurking' },
  { id: 'sw_bogdragon',name:'Bog Dragon',       emoji: '🐲', rarity: 'legendary', biome: 'swamp',    description: 'A dragon that breathes green swamp-fire' },

  // ── Sky (Lv 9) ────────────────────────────────────────────
  { id: 'sk_sparrow',  name: 'Sparrow',         emoji: '🐦', rarity: 'common',    biome: 'sky',      description: 'Cheerful city bird, everywhere at once' },
  { id: 'sk_butterfly',name: 'Butterfly',       emoji: '🦋', rarity: 'common',    biome: 'sky',      description: 'Delicate wings, big migration' },
  { id: 'sk_bat',      name: 'Bat',             emoji: '🦇', rarity: 'common',    biome: 'sky',      description: 'Sonar-guided night flier' },
  { id: 'sk_hawk',     name: 'Red-tail Hawk',   emoji: '🦅', rarity: 'uncommon',  biome: 'sky',      description: 'Screams constantly for no reason' },
  { id: 'sk_albatross',name: 'Albatross',       emoji: '🕊️', rarity: 'uncommon',  biome: 'sky',      description: 'Can fly for years without landing' },
  { id: 'sk_condor',   name: 'Condor',          emoji: '🦅', rarity: 'rare',      biome: 'sky',      description: 'Biggest flying bird in the Americas' },
  { id: 'sk_harpy',    name: 'Harpy Eagle',     emoji: '🦅', rarity: 'rare',      biome: 'sky',      description: 'Most powerful eagle alive' },
  { id: 'sk_pegasus',  name: 'Pegasus',         emoji: '🐎', rarity: 'epic',      biome: 'sky',      description: 'The winged horse of legend' },
  { id: 'sk_phoenix',  name: 'Phoenix',         emoji: '🔥', rarity: 'epic',      biome: 'sky',      description: 'Reborn from its own flames' },
  { id: 'sk_stormbird',name: 'Storm Lord',      emoji: '⛈️', rarity: 'legendary', biome: 'sky',      description: 'A colossal bird that calls hurricanes with each wingbeat' },

  // ── Mythical (Lv 10) ──────────────────────────────────────
  { id: 'my_fairy',    name: 'Fairy',           emoji: '🧚', rarity: 'common',    biome: 'mythical', description: 'Mischievous magical sprite' },
  { id: 'my_imp',      name: 'Imp',             emoji: '👺', rarity: 'common',    biome: 'mythical', description: 'Tiny devil, maximum chaos' },
  { id: 'my_kirin',    name: 'Kirin',           emoji: '🦄', rarity: 'common',    biome: 'mythical', description: 'Gentle Chinese good-luck spirit' },
  { id: 'my_gryphon',  name: 'Gryphon',         emoji: '🦅', rarity: 'uncommon',  biome: 'mythical', description: 'Eagle head, lion body, loyal guardian' },
  { id: 'my_cerberus', name: 'Cerberus',        emoji: '🐕', rarity: 'uncommon',  biome: 'mythical', description: 'Three-headed hound of the underworld' },
  { id: 'my_wyvern',   name: 'Wyvern',          emoji: '🐲', rarity: 'rare',      biome: 'mythical', description: 'Two-winged cousin of the dragon' },
  { id: 'my_basilisk', name: 'Basilisk',        emoji: '🐍', rarity: 'rare',      biome: 'mythical', description: 'One glance and you\'re stone' },
  { id: 'my_dragon',   name: 'Dragon',          emoji: '🐉', rarity: 'epic',      biome: 'mythical', description: 'Fire-breathing apex of all mythical beasts' },
  { id: 'my_sphinx',   name: 'Sphinx',          emoji: '🦁', rarity: 'epic',      biome: 'mythical', description: 'Riddle-giver, devourer of the wrong answer' },
  { id: 'my_worldserpent', name: 'World Serpent', emoji: '🌍', rarity: 'legendary', biome: 'mythical', description: 'Jörmungandr — the serpent that encircles the earth' },
];

export const BOXES: Box[] = [
  {
    id: 'forest',
    name: 'Forest Pack',
    emoji: '🌲',
    biome: 'forest',
    description: 'Woodland creatures of the ancient forest',
    cost: 50,
    color: '#34D399',
    levelRequired: 1,
    itemsPerOpen: 2,
    rarityWeights: { common: 60, uncommon: 28, rare: 9, epic: 2, legendary: 1 },
  },
  {
    id: 'ocean',
    name: 'Ocean Pack',
    emoji: '🌊',
    biome: 'ocean',
    description: 'Creatures of the deep blue sea',
    cost: 100,
    color: '#38BDF8',
    levelRequired: 2,
    itemsPerOpen: 2,
    rarityWeights: { common: 55, uncommon: 30, rare: 11, epic: 3, legendary: 1 },
  },
  {
    id: 'arctic',
    name: 'Arctic Pack',
    emoji: '❄️',
    biome: 'arctic',
    description: 'Frozen north survivors',
    cost: 160,
    color: '#BAE6FD',
    levelRequired: 3,
    itemsPerOpen: 2,
    rarityWeights: { common: 50, uncommon: 30, rare: 14, epic: 5, legendary: 1 },
  },
  {
    id: 'savanna',
    name: 'Savanna Pack',
    emoji: '🌅',
    biome: 'savanna',
    description: 'Majestic beasts of the open plains',
    cost: 240,
    color: '#FCD34D',
    levelRequired: 4,
    itemsPerOpen: 3,
    rarityWeights: { common: 45, uncommon: 30, rare: 17, epic: 6, legendary: 2 },
  },
  {
    id: 'jungle',
    name: 'Jungle Pack',
    emoji: '🌴',
    biome: 'jungle',
    description: 'Wild animals of the rainforest canopy',
    cost: 340,
    color: '#86EFAC',
    levelRequired: 5,
    itemsPerOpen: 3,
    rarityWeights: { common: 40, uncommon: 30, rare: 20, epic: 8, legendary: 2 },
  },
  {
    id: 'desert',
    name: 'Desert Pack',
    emoji: '🏜️',
    biome: 'desert',
    description: 'Survivors of the scorching sands',
    cost: 460,
    color: '#FCA5A5',
    levelRequired: 6,
    itemsPerOpen: 3,
    rarityWeights: { common: 35, uncommon: 30, rare: 22, epic: 10, legendary: 3 },
  },
  {
    id: 'mountain',
    name: 'Mountain Pack',
    emoji: '⛰️',
    biome: 'mountain',
    description: 'Creatures of the high peaks and passes',
    cost: 600,
    color: '#C4B5FD',
    levelRequired: 7,
    itemsPerOpen: 3,
    rarityWeights: { common: 28, uncommon: 30, rare: 25, epic: 13, legendary: 4 },
  },
  {
    id: 'swamp',
    name: 'Swamp Pack',
    emoji: '🌿',
    biome: 'swamp',
    description: 'Mysterious beasts of murky waters',
    cost: 780,
    color: '#6EE7B7',
    levelRequired: 8,
    itemsPerOpen: 4,
    rarityWeights: { common: 20, uncommon: 28, rare: 28, epic: 18, legendary: 6 },
  },
  {
    id: 'sky',
    name: 'Sky Pack',
    emoji: '☁️',
    biome: 'sky',
    description: 'Lords of the wind and heavens',
    cost: 1000,
    color: '#93C5FD',
    levelRequired: 9,
    itemsPerOpen: 4,
    rarityWeights: { common: 12, uncommon: 25, rare: 32, epic: 22, legendary: 9 },
  },
  {
    id: 'mythical',
    name: 'Mythical Pack',
    emoji: '✨',
    biome: 'mythical',
    description: 'Legendary creatures of ancient myth',
    cost: 1500,
    color: '#F59E0B',
    levelRequired: 10,
    itemsPerOpen: 4,
    rarityWeights: { common: 5, uncommon: 18, rare: 35, epic: 30, legendary: 12 },
  },
];

export function rollItem(box: Box): ShopItem {
  const weights = box.rarityWeights;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosenRarity: Rarity = 'common';
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) { chosenRarity = rarity; break; }
  }
  const pool = ITEMS.filter(i => i.rarity === chosenRarity && i.biome === box.biome);
  // fallback to any rarity from biome if pool empty
  const fallback = ITEMS.filter(i => i.biome === box.biome);
  const source = pool.length > 0 ? pool : fallback;
  return source[Math.floor(Math.random() * source.length)];
}

export function openBox(box: Box): ShopItem[] {
  return Array.from({ length: box.itemsPerOpen }, () => rollItem(box));
}
