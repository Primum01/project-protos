/**
 * Centralized Prefix Registry and Location Normalization System
 *
 * Provides canonical county and area mappings, normalization rules,
 * validation regex, and account number formatting.
 *
 * Format: [COUNTY_PREFIX]-[AREA_PREFIX]-[4_DIGIT_SEQUENCE]
 * Example: NRB-KAR-0004
 */

export interface CountyMapping {
  name: string
  prefix: string // Exactly 3 uppercase letters
  aliases: string[]
}

export interface AreaMapping {
  name: string
  prefix: string // Exactly 3 uppercase letters
  countyPrefix: string
  aliases: string[]
}

/**
 * Standard Kenyan County / Major Region Prefixes
 */
export const CANONICAL_COUNTIES: Record<string, CountyMapping> = {
  NAIROBI: {
    name: 'Nairobi',
    prefix: 'NRB',
    aliases: ['nairobi', 'nbi', 'nrb', 'nairobi county', 'nairobi city'],
  },
  MOMBASA: {
    name: 'Mombasa',
    prefix: 'MSA',
    aliases: ['mombasa', 'msa', 'mombasa county', 'coast'],
  },
  KISUMU: {
    name: 'Kisumu',
    prefix: 'KSM',
    aliases: ['kisumu', 'ksm', 'kisumu county'],
  },
  NAKURU: {
    name: 'Nakuru',
    prefix: 'NAK',
    aliases: ['nakuru', 'nak', 'nakuru county'],
  },
  KIAMBU: {
    name: 'Kiambu',
    prefix: 'KBU',
    aliases: ['kiambu', 'kbu', 'kiambu county', 'ruaka', 'thika'],
  },
  MACHAKOS: {
    name: 'Machakos',
    prefix: 'MCK',
    aliases: ['machakos', 'mck', 'machakos county', 'syokimau', 'athi river'],
  },
  KAJIADO: {
    name: 'Kajiado',
    prefix: 'KJD',
    aliases: ['kajiado', 'kjd', 'kajiado county', 'kitengela', 'ongata rongai', 'rongai'],
  },
  KILIFI: {
    name: 'Kilifi',
    prefix: 'KLF',
    aliases: ['kilifi', 'klf', 'malindi', 'watamu', 'kilifi county'],
  },
  KWALE: {
    name: 'Kwale',
    prefix: 'KWL',
    aliases: ['kwale', 'kwl', 'diani', 'diani beach', 'kwale county'],
  },
  UASIN_GISHU: {
    name: 'Uasin Gishu',
    prefix: 'ELD',
    aliases: ['uasin gishu', 'eldoret', 'eld'],
  },
  LAIKIPIA: {
    name: 'Laikipia',
    prefix: 'NYK',
    aliases: ['laikipia', 'nanyuki', 'nyk'],
  },
}

/**
 * Standard Area / Neighborhood Prefixes (Nairobi, Coast, Rift, etc.)
 */
export const CANONICAL_AREAS: Record<string, AreaMapping> = {
  // ── Nairobi Areas
  KAREN: {
    name: 'Karen',
    prefix: 'KAR',
    countyPrefix: 'NRB',
    aliases: ['karen', 'karen road', 'karen plains', 'karen triangle', 'mbagathi way'],
  },
  KILIMANI: {
    name: 'Kilimani',
    prefix: 'KIL',
    countyPrefix: 'NRB',
    aliases: ['kilimani', 'argwings kodhek', 'chania avenue', 'wood avenue', 'ring road kilimani'],
  },
  WESTLANDS: {
    name: 'Westlands',
    prefix: 'WES',
    countyPrefix: 'NRB',
    aliases: ['westlands', 'westlands skyline', 'rhapta', 'rhapta road', 'waiyaki way', 'sarit', 'gtc'],
  },
  LAVINGTON: {
    name: 'Lavington',
    prefix: 'LAV',
    countyPrefix: 'NRB',
    aliases: ['lavington', 'james gichuru', 'amboseli'],
  },
  KILELESHWA: {
    name: 'Kileleshwa',
    prefix: 'KLS',
    countyPrefix: 'NRB',
    aliases: ['kileleshwa', 'mandera road', 'siaya road'],
  },
  PARKLANDS: {
    name: 'Parklands',
    prefix: 'PRK',
    countyPrefix: 'NRB',
    aliases: ['parklands', '1st parklands', '2nd parklands', '3rd parklands', '4th parklands', 'limuru road'],
  },
  RUNDA: {
    name: 'Runda',
    prefix: 'RUN',
    countyPrefix: 'NRB',
    aliases: ['runda', 'runda estate', 'runda mimosa', 'runda evergreen'],
  },
  MUTHAIGA: {
    name: 'Muthaiga',
    prefix: 'MUT',
    countyPrefix: 'NRB',
    aliases: ['muthaiga', 'old muthaiga', 'muthaiga north'],
  },
  UPPER_HILL: {
    name: 'Upper Hill',
    prefix: 'UPH',
    countyPrefix: 'NRB',
    aliases: ['upper hill', 'upperhill', 'community', 'hospital road'],
  },
  CBD: {
    name: 'CBD',
    prefix: 'CBD',
    countyPrefix: 'NRB',
    aliases: ['cbd', 'central business district', 'city centre', 'town'],
  },
  RIVERSIDE: {
    name: 'Riverside',
    prefix: 'RIV',
    countyPrefix: 'NRB',
    aliases: ['riverside', 'riverside drive'],
  },
  SPRING_VALLEY: {
    name: 'Spring Valley',
    prefix: 'SPV',
    countyPrefix: 'NRB',
    aliases: ['spring valley', 'peponi', 'peponi road'],
  },
  GIGIRI: {
    name: 'Gigiri',
    prefix: 'GIG',
    countyPrefix: 'NRB',
    aliases: ['gigiri', 'un avenue'],
  },
  KITISURU: {
    name: 'Kitisuru',
    prefix: 'KIT',
    countyPrefix: 'NRB',
    aliases: ['kitisuru', 'old kitisuru', 'new kitisuru'],
  },
  SOUTH_B: {
    name: 'South B',
    prefix: 'STB',
    countyPrefix: 'NRB',
    aliases: ['south b', 'south-b', 'mariakani', 'golden gate'],
  },
  SOUTH_C: {
    name: 'South C',
    prefix: 'STC',
    countyPrefix: 'NRB',
    aliases: ['south c', 'south-c', 'bellevue', 'muhoho avenue'],
  },
  LANGATA: {
    name: 'Langata',
    prefix: 'LAN',
    countyPrefix: 'NRB',
    aliases: ['langata', "lang'ata", 'langata road'],
  },
  NGONG_ROAD: {
    name: 'Ngong Road',
    prefix: 'NGG',
    countyPrefix: 'NRB',
    aliases: ['ngong road', 'ngong rd', 'adams arcade', 'dagoretti corner'],
  },
  ROYSAMBU: {
    name: 'Roysambu',
    prefix: 'ROY',
    countyPrefix: 'NRB',
    aliases: ['roysambu', 'thika road mall', 'trm'],
  },
  KASARANI: {
    name: 'Kasarani',
    prefix: 'KAS',
    countyPrefix: 'NRB',
    aliases: ['kasarani', 'clay city', 'mwiki'],
  },
  EMBAKASI: {
    name: 'Embakasi',
    prefix: 'EMB',
    countyPrefix: 'NRB',
    aliases: ['embakasi', 'nyayo estate', 'fedha'],
  },

  // ── Kiambu Areas
  RUAKA: {
    name: 'Ruaka',
    prefix: 'RUA',
    countyPrefix: 'KBU',
    aliases: ['ruaka', 'two rivers', 'rosslyn'],
  },
  THIKA: {
    name: 'Thika',
    prefix: 'THK',
    countyPrefix: 'KBU',
    aliases: ['thika', 'thika town', 'section 9'],
  },

  // ── Machakos Areas
  SYOKIMAU: {
    name: 'Syokimau',
    prefix: 'SYO',
    countyPrefix: 'MCK',
    aliases: ['syokimau', 'mombasa road syokimau', 'gateway mall'],
  },

  // ── Kajiado Areas
  KITENGELA: {
    name: 'Kitengela',
    prefix: 'KTG',
    countyPrefix: 'KJD',
    aliases: ['kitengela', 'kitengela town'],
  },
  RONGAI: {
    name: 'Ongata Rongai',
    prefix: 'RNG',
    countyPrefix: 'KJD',
    aliases: ['ongata rongai', 'rongai', 'masai lodge'],
  },

  // ── Coast Areas
  NYALI: {
    name: 'Nyali',
    prefix: 'NYA',
    countyPrefix: 'MSA',
    aliases: ['nyali', 'nyali beach', 'links road', 'cinemax'],
  },
  BAMBURI: {
    name: 'Bamburi',
    prefix: 'BAM',
    countyPrefix: 'MSA',
    aliases: ['bamburi', 'bamburi beach'],
  },
  SHANZU: {
    name: 'Shanzu',
    prefix: 'SHZ',
    countyPrefix: 'MSA',
    aliases: ['shanzu', 'serena'],
  },
  DIANI: {
    name: 'Diani',
    prefix: 'DIA',
    countyPrefix: 'KWL',
    aliases: ['diani', 'diani beach', 'beach road diani', 'galu'],
  },
  MALINDI: {
    name: 'Malindi',
    prefix: 'MAL',
    countyPrefix: 'KLF',
    aliases: ['malindi', 'casuarina'],
  },
  WATAMU: {
    name: 'Watamu',
    prefix: 'WAT',
    countyPrefix: 'KLF',
    aliases: ['watamu', 'watamu beach', 'turtle bay'],
  },

  // ── Kisumu Areas
  MILIMANI_KISUMU: {
    name: 'Milimani',
    prefix: 'MLM',
    countyPrefix: 'KSM',
    aliases: ['milimani', 'milimani kisumu', 'tom mboya estate'],
  },

  // ── Nakuru / Rift Areas
  NAKURU_TOWN: {
    name: 'Nakuru Town',
    prefix: 'NKT',
    countyPrefix: 'NAK',
    aliases: ['nakuru town', 'section 58', 'milimani nakuru'],
  },
  NAIVASHA: {
    name: 'Naivasha',
    prefix: 'NVS',
    countyPrefix: 'NAK',
    aliases: ['naivasha', 'south lake', 'moi south lake'],
  },
  NANYUKI: {
    name: 'Nanyuki',
    prefix: 'NYK',
    countyPrefix: 'NYK',
    aliases: ['nanyuki', 'mount kenya', 'nanyuki town'],
  },
}

/**
 * Standard fallback prefixes when location input is empty, ambiguous, or general.
 */
export const DEFAULT_COUNTY_PREFIX = 'NRB'
export const DEFAULT_AREA_PREFIX = 'GEN'

/**
 * Exact Account Number Regex pattern.
 * Must match: [3 uppercase letters]-[3 uppercase letters]-[4 or more digits]
 * Example: NRB-KAR-0004
 */
export const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-[A-Z]{3}-\d{4,}$/

/**
 * Clean a string: trim, lowercase, remove punctuation, collapse multiple spaces.
 */
export function cleanLocationString(input?: string | null): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolves the County Prefix from user input.
 * Normalizes input, checks canonical mapping & aliases, or extracts deterministic 3-letter code.
 */
export function resolveCountyPrefix(rawCityOrCounty?: string | null): { prefix: string; canonicalName: string } {
  const cleaned = cleanLocationString(rawCityOrCounty)
  if (!cleaned) {
    return { prefix: DEFAULT_COUNTY_PREFIX, canonicalName: 'Nairobi' }
  }

  // Exact alias match
  for (const county of Object.values(CANONICAL_COUNTIES)) {
    if (county.aliases.some((alias) => cleaned === alias || cleaned.includes(alias))) {
      return { prefix: county.prefix, canonicalName: county.name }
    }
  }

  // Fallback: derive deterministic 3-letter prefix from cleaned string
  const alphaOnly = cleaned.replace(/[^a-z]/g, '').toUpperCase()
  if (alphaOnly.length >= 3) {
    return { prefix: alphaOnly.slice(0, 3), canonicalName: rawCityOrCounty?.trim() || 'General' }
  }

  return { prefix: DEFAULT_COUNTY_PREFIX, canonicalName: 'Nairobi' }
}

/**
 * Resolves the Area Prefix from location and city input.
 * Normalizes input, checks canonical mapping & aliases, or extracts deterministic 3-letter code.
 */
export function resolveAreaPrefix(
  rawLocation?: string | null,
  _countyPrefix: string = DEFAULT_COUNTY_PREFIX,
): { prefix: string; canonicalName: string } {
  const cleaned = cleanLocationString(rawLocation)
  if (!cleaned) {
    return { prefix: DEFAULT_AREA_PREFIX, canonicalName: 'General' }
  }

  // Check matching aliases across known areas
  // 1. Try exact match first
  for (const area of Object.values(CANONICAL_AREAS)) {
    if (area.aliases.some((alias) => cleaned === alias)) {
      return { prefix: area.prefix, canonicalName: area.name }
    }
  }

  // 2. Try substring match (e.g. "GTC Office Tower, 14th Floor, Westlands" matches "westlands")
  // Sort areas by alias length descending so longer specific matches take precedence
  const allAliasesWithArea: { alias: string; area: AreaMapping }[] = []
  for (const area of Object.values(CANONICAL_AREAS)) {
    for (const alias of area.aliases) {
      allAliasesWithArea.push({ alias, area })
    }
  }
  allAliasesWithArea.sort((a, b) => b.alias.length - a.alias.length)

  for (const { alias, area } of allAliasesWithArea) {
    // Word boundary match in cleaned location string
    const regex = new RegExp(`\\b${alias}\\b`, 'i')
    if (regex.test(cleaned)) {
      return { prefix: area.prefix, canonicalName: area.name }
    }
  }

  // 3. Fallback: derive deterministic 3-letter uppercase prefix from the area string
  const alphaOnly = cleaned.replace(/[^a-z]/g, '').toUpperCase()
  if (alphaOnly.length >= 3) {
    return { prefix: alphaOnly.slice(0, 3), canonicalName: rawLocation?.trim() || 'General' }
  }

  return { prefix: DEFAULT_AREA_PREFIX, canonicalName: 'General' }
}

/**
 * Resolve full location prefixes and canonical metadata for a property.
 */
export function resolveLocationPrefixes(
  city?: string | null,
  location?: string | null,
): {
  countyPrefix: string
  areaPrefix: string
  canonicalCounty: string
  canonicalArea: string
  counterId: string
} {
  const county = resolveCountyPrefix(city)

  // In some inputs, the county was entered in location or vice versa (e.g. city: "Diani", location: "Diani Beach")
  // Check if location matches an area that has an associated county
  let area = resolveAreaPrefix(location, county.prefix)

  // If location gave a default/general prefix, check if city contains a known area
  if (area.prefix === DEFAULT_AREA_PREFIX && city) {
    const areaFromCity = resolveAreaPrefix(city, county.prefix)
    if (areaFromCity.prefix !== DEFAULT_AREA_PREFIX) {
      area = areaFromCity
    }
  }

  const counterId = `${county.prefix}_${area.prefix}`

  return {
    countyPrefix: county.prefix,
    areaPrefix: area.prefix,
    canonicalCounty: county.canonicalName,
    canonicalArea: area.canonicalName,
    counterId,
  }
}

/**
 * Formats an account number string from prefixes and sequence number.
 * Ensures minimum 4 digits with leading zeros (e.g. 1 -> "0001", 10 -> "0010").
 * Gracefully expands past 9999 (e.g. 10000 -> "10000").
 */
export function formatAccountNumber(countyPrefix: string, areaPrefix: string, sequence: number): string {
  const safeSeq = Math.max(1, Math.floor(sequence))
  const seqPadded = safeSeq < 10000 ? String(safeSeq).padStart(4, '0') : String(safeSeq)
  return `${countyPrefix.toUpperCase()}-${areaPrefix.toUpperCase()}-${seqPadded}`
}

/**
 * Validates whether an account number string strictly conforms to standard format.
 */
export function isValidAccountNumber(accountNumber?: string | null): boolean {
  if (!accountNumber) return false
  return ACCOUNT_NUMBER_REGEX.test(accountNumber.trim())
}

/**
 * Parses sequence number from a valid account number string.
 * Example: "NRB-KAR-0004" -> 4
 */
export function parseSequenceFromAccountNumber(accountNumber: string): number | null {
  if (!isValidAccountNumber(accountNumber)) return null
  const parts = accountNumber.split('-')
  if (parts.length < 3) return null
  const seq = parseInt(parts[2], 10)
  return isNaN(seq) ? null : seq
}

