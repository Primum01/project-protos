import type { LocationSuggestion } from './types.ts'

/**
 * Standardized Kenyan Counties (All 47 Counties)
 */
export const KENYA_COUNTIES: LocationSuggestion[] = [
  { id: 'ke-county-047', name: 'Nairobi County', displayName: 'Nairobi County, Kenya', type: 'county', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', latitude: -1.286389, longitude: 36.817223, aliases: ['nairobi', 'nbi', 'nrb', 'kanairo', 'nairobi city'] },
  { id: 'ke-county-001', name: 'Mombasa County', displayName: 'Mombasa County, Kenya', type: 'county', county: 'Mombasa County', country: 'Kenya', countryCode: 'KE', latitude: -4.043477, longitude: 39.668206, aliases: ['mombasa', 'msa', 'coast'] },
  { id: 'ke-county-042', name: 'Kisumu County', displayName: 'Kisumu County, Kenya', type: 'county', county: 'Kisumu County', country: 'Kenya', countryCode: 'KE', latitude: -0.102212, longitude: 34.761714, aliases: ['kisumu', 'ksm'] },
  { id: 'ke-county-032', name: 'Nakuru County', displayName: 'Nakuru County, Kenya', type: 'county', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', latitude: -0.303099, longitude: 36.080026, aliases: ['nakuru', 'nak'] },
  { id: 'ke-county-022', name: 'Kiambu County', displayName: 'Kiambu County, Kenya', type: 'county', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', latitude: -1.171389, longitude: 36.835556, aliases: ['kiambu', 'kbu'] },
  { id: 'ke-county-016', name: 'Machakos County', displayName: 'Machakos County, Kenya', type: 'county', county: 'Machakos County', country: 'Kenya', countryCode: 'KE', latitude: -1.517684, longitude: 37.263415, aliases: ['machakos', 'mck'] },
  { id: 'ke-county-034', name: 'Kajiado County', displayName: 'Kajiado County, Kenya', type: 'county', county: 'Kajiado County', country: 'Kenya', countryCode: 'KE', latitude: -1.852445, longitude: 36.776832, aliases: ['kajiado', 'kjd'] },
  { id: 'ke-county-003', name: 'Kilifi County', displayName: 'Kilifi County, Kenya', type: 'county', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', latitude: -3.63045, longitude: 39.8499, aliases: ['kilifi', 'klf'] },
  { id: 'ke-county-002', name: 'Kwale County', displayName: 'Kwale County, Kenya', type: 'county', county: 'Kwale County', country: 'Kenya', countryCode: 'KE', latitude: -4.173661, longitude: 39.452063, aliases: ['kwale', 'kwl', 'diani'] },
  { id: 'ke-county-027', name: 'Uasin Gishu County', displayName: 'Uasin Gishu County, Kenya', type: 'county', county: 'Uasin Gishu County', country: 'Kenya', countryCode: 'KE', latitude: 0.514277, longitude: 35.26978, aliases: ['uasin gishu', 'eldoret', 'eld'] },
  { id: 'ke-county-031', name: 'Laikipia County', displayName: 'Laikipia County, Kenya', type: 'county', county: 'Laikipia County', country: 'Kenya', countryCode: 'KE', latitude: 0.3606, longitude: 36.782, aliases: ['laikipia', 'nanyuki'] },
  { id: 'ke-county-019', name: 'Nyeri County', displayName: 'Nyeri County, Kenya', type: 'county', county: 'Nyeri County', country: 'Kenya', countryCode: 'KE', latitude: -0.4197, longitude: 36.9511, aliases: ['nyeri'] },
  { id: 'ke-county-012', name: 'Meru County', displayName: 'Meru County, Kenya', type: 'county', county: 'Meru County', country: 'Kenya', countryCode: 'KE', latitude: 0.05, longitude: 37.65, aliases: ['meru'] },
  { id: 'ke-county-014', name: 'Embu County', displayName: 'Embu County, Kenya', type: 'county', county: 'Embu County', country: 'Kenya', countryCode: 'KE', latitude: -0.5388, longitude: 37.4594, aliases: ['embu'] },
  { id: 'ke-county-021', name: "Murang'a County", displayName: "Murang'a County, Kenya", type: 'county', county: "Murang'a County", country: 'Kenya', countryCode: 'KE', latitude: -0.7839, longitude: 37.04, aliases: ["murang'a", 'muranga'] },
  { id: 'ke-county-020', name: 'Kirinyaga County', displayName: 'Kirinyaga County, Kenya', type: 'county', county: 'Kirinyaga County', country: 'Kenya', countryCode: 'KE', latitude: -0.4989, longitude: 37.2803, aliases: ['kirinyaga', 'kerugoya'] },
  { id: 'ke-county-018', name: 'Nyandarua County', displayName: 'Nyandarua County, Kenya', type: 'county', county: 'Nyandarua County', country: 'Kenya', countryCode: 'KE', latitude: -0.1804, longitude: 36.523, aliases: ['nyandarua', 'ol kalou'] },
  { id: 'ke-county-017', name: 'Makueni County', displayName: 'Makueni County, Kenya', type: 'county', county: 'Makueni County', country: 'Kenya', countryCode: 'KE', latitude: -1.7833, longitude: 37.6333, aliases: ['makueni', 'wote'] },
  { id: 'ke-county-015', name: 'Kitui County', displayName: 'Kitui County, Kenya', type: 'county', county: 'Kitui County', country: 'Kenya', countryCode: 'KE', latitude: -1.3667, longitude: 38.0167, aliases: ['kitui'] },
  { id: 'ke-county-006', name: 'Taita-Taveta County', displayName: 'Taita-Taveta County, Kenya', type: 'county', county: 'Taita-Taveta County', country: 'Kenya', countryCode: 'KE', latitude: -3.3167, longitude: 38.4833, aliases: ['taita taveta', 'taita', 'taveta', 'voi'] },
  { id: 'ke-county-005', name: 'Lamu County', displayName: 'Lamu County, Kenya', type: 'county', county: 'Lamu County', country: 'Kenya', countryCode: 'KE', latitude: -2.2686, longitude: 40.9006, aliases: ['lamu', 'lamu island'] },
  { id: 'ke-county-004', name: 'Tana River County', displayName: 'Tana River County, Kenya', type: 'county', county: 'Tana River County', country: 'Kenya', countryCode: 'KE', latitude: -1.5, longitude: 39.5, aliases: ['tana river', 'hola'] },
  { id: 'ke-county-007', name: 'Garissa County', displayName: 'Garissa County, Kenya', type: 'county', county: 'Garissa County', country: 'Kenya', countryCode: 'KE', latitude: -0.4536, longitude: 39.646, aliases: ['garissa'] },
  { id: 'ke-county-008', name: 'Wajir County', displayName: 'Wajir County, Kenya', type: 'county', county: 'Wajir County', country: 'Kenya', countryCode: 'KE', latitude: 1.7471, longitude: 40.0573, aliases: ['wajir'] },
  { id: 'ke-county-009', name: 'Mandera County', displayName: 'Mandera County, Kenya', type: 'county', county: 'Mandera County', country: 'Kenya', countryCode: 'KE', latitude: 3.9373, longitude: 41.8569, aliases: ['mandera'] },
  { id: 'ke-county-010', name: 'Marsabit County', displayName: 'Marsabit County, Kenya', type: 'county', county: 'Marsabit County', country: 'Kenya', countryCode: 'KE', latitude: 2.3347, longitude: 37.9904, aliases: ['marsabit'] },
  { id: 'ke-county-011', name: 'Isiolo County', displayName: 'Isiolo County, Kenya', type: 'county', county: 'Isiolo County', country: 'Kenya', countryCode: 'KE', latitude: 0.3546, longitude: 37.5822, aliases: ['isiolo'] },
  { id: 'ke-county-025', name: 'Samburu County', displayName: 'Samburu County, Kenya', type: 'county', county: 'Samburu County', country: 'Kenya', countryCode: 'KE', latitude: 1.25, longitude: 36.8, aliases: ['samburu', 'maralal'] },
  { id: 'ke-county-023', name: 'Turkana County', displayName: 'Turkana County, Kenya', type: 'county', county: 'Turkana County', country: 'Kenya', countryCode: 'KE', latitude: 3.1167, longitude: 35.6, aliases: ['turkana', 'lodwar'] },
  { id: 'ke-county-024', name: 'West Pokot County', displayName: 'West Pokot County, Kenya', type: 'county', county: 'West Pokot County', country: 'Kenya', countryCode: 'KE', latitude: 1.45, longitude: 35.15, aliases: ['west pokot', 'kapenguria'] },
  { id: 'ke-county-030', name: 'Baringo County', displayName: 'Baringo County, Kenya', type: 'county', county: 'Baringo County', country: 'Kenya', countryCode: 'KE', latitude: 0.4667, longitude: 35.75, aliases: ['baringo', 'kabarnet'] },
  { id: 'ke-county-028', name: 'Elgeyo-Marakwet County', displayName: 'Elgeyo-Marakwet County, Kenya', type: 'county', county: 'Elgeyo-Marakwet County', country: 'Kenya', countryCode: 'KE', latitude: 0.67, longitude: 35.5, aliases: ['elgeyo marakwet', 'iten'] },
  { id: 'ke-county-029', name: 'Nandi County', displayName: 'Nandi County, Kenya', type: 'county', county: 'Nandi County', country: 'Kenya', countryCode: 'KE', latitude: 0.1833, longitude: 35.1, aliases: ['nandi', 'kapsabet'] },
  { id: 'ke-county-026', name: 'Trans-Nzoia County', displayName: 'Trans-Nzoia County, Kenya', type: 'county', county: 'Trans-Nzoia County', country: 'Kenya', countryCode: 'KE', latitude: 1.0167, longitude: 34.95, aliases: ['trans nzoia', 'kitale'] },
  { id: 'ke-county-035', name: 'Kericho County', displayName: 'Kericho County, Kenya', type: 'county', county: 'Kericho County', country: 'Kenya', countryCode: 'KE', latitude: -0.3689, longitude: 35.2863, aliases: ['kericho'] },
  { id: 'ke-county-036', name: 'Bomet County', displayName: 'Bomet County, Kenya', type: 'county', county: 'Bomet County', country: 'Kenya', countryCode: 'KE', latitude: -0.7833, longitude: 35.35, aliases: ['bomet'] },
  { id: 'ke-county-037', name: 'Kakamega County', displayName: 'Kakamega County, Kenya', type: 'county', county: 'Kakamega County', country: 'Kenya', countryCode: 'KE', latitude: 0.2827, longitude: 34.7519, aliases: ['kakamega'] },
  { id: 'ke-county-038', name: 'Vihiga County', displayName: 'Vihiga County, Kenya', type: 'county', county: 'Vihiga County', country: 'Kenya', countryCode: 'KE', latitude: 0.0833, longitude: 34.7167, aliases: ['vihiga', 'mbale'] },
  { id: 'ke-county-039', name: 'Bungoma County', displayName: 'Bungoma County, Kenya', type: 'county', county: 'Bungoma County', country: 'Kenya', countryCode: 'KE', latitude: 0.5694, longitude: 34.5583, aliases: ['bungoma'] },
  { id: 'ke-county-040', name: 'Busia County', displayName: 'Busia County, Kenya', type: 'county', county: 'Busia County', country: 'Kenya', countryCode: 'KE', latitude: 0.4608, longitude: 34.1114, aliases: ['busia'] },
  { id: 'ke-county-041', name: 'Siaya County', displayName: 'Siaya County, Kenya', type: 'county', county: 'Siaya County', country: 'Kenya', countryCode: 'KE', latitude: 0.0607, longitude: 34.2882, aliases: ['siaya'] },
  { id: 'ke-county-043', name: 'Homa Bay County', displayName: 'Homa Bay County, Kenya', type: 'county', county: 'Homa Bay County', country: 'Kenya', countryCode: 'KE', latitude: -0.5273, longitude: 34.4571, aliases: ['homa bay', 'homabay'] },
  { id: 'ke-county-044', name: 'Migori County', displayName: 'Migori County, Kenya', type: 'county', county: 'Migori County', country: 'Kenya', countryCode: 'KE', latitude: -1.0634, longitude: 34.4731, aliases: ['migori'] },
  { id: 'ke-county-045', name: 'Kisii County', displayName: 'Kisii County, Kenya', type: 'county', county: 'Kisii County', country: 'Kenya', countryCode: 'KE', latitude: -0.6817, longitude: 34.7667, aliases: ['kisii'] },
  { id: 'ke-county-046', name: 'Nyamira County', displayName: 'Nyamira County, Kenya', type: 'county', county: 'Nyamira County', country: 'Kenya', countryCode: 'KE', latitude: -0.5633, longitude: 34.9358, aliases: ['nyamira'] },
  { id: 'ke-county-033', name: 'Narok County', displayName: 'Narok County, Kenya', type: 'county', county: 'Narok County', country: 'Kenya', countryCode: 'KE', latitude: -1.0833, longitude: 35.8667, aliases: ['narok', 'maasai mara'] },
  { id: 'ke-county-013', name: 'Tharaka-Nithi County', displayName: 'Tharaka-Nithi County, Kenya', type: 'county', county: 'Tharaka-Nithi County', country: 'Kenya', countryCode: 'KE', latitude: -0.3, longitude: 37.9, aliases: ['tharaka nithi', 'chuka'] },
]

/**
 * Standardized Kenyan Cities & Major Municipal Towns
 */
export const KENYA_CITIES_AND_TOWNS: LocationSuggestion[] = [
  { id: 'ke-city-nairobi', name: 'Nairobi', displayName: 'Nairobi, Nairobi County, Kenya', type: 'city', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', latitude: -1.2921, longitude: 36.8219, aliases: ['nairobi city', 'nbi', 'nrb'] },
  { id: 'ke-city-mombasa', name: 'Mombasa', displayName: 'Mombasa, Mombasa County, Kenya', type: 'city', city: 'Mombasa', county: 'Mombasa County', country: 'Kenya', countryCode: 'KE', latitude: -4.0435, longitude: 39.6682, aliases: ['msa', 'mombasa town'] },
  { id: 'ke-city-kisumu', name: 'Kisumu', displayName: 'Kisumu, Kisumu County, Kenya', type: 'city', city: 'Kisumu', county: 'Kisumu County', country: 'Kenya', countryCode: 'KE', latitude: -0.0917, longitude: 34.768, aliases: ['ksm', 'kisumu city'] },
  { id: 'ke-city-nakuru', name: 'Nakuru', displayName: 'Nakuru, Nakuru County, Kenya', type: 'city', city: 'Nakuru', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', latitude: -0.3031, longitude: 36.08, aliases: ['nakuru city', 'nak'] },
  { id: 'ke-city-eldoret', name: 'Eldoret', displayName: 'Eldoret, Uasin Gishu County, Kenya', type: 'city', city: 'Eldoret', county: 'Uasin Gishu County', country: 'Kenya', countryCode: 'KE', latitude: 0.5143, longitude: 35.2698, aliases: ['eld'] },
  { id: 'ke-city-thika', name: 'Thika', displayName: 'Thika, Kiambu County, Kenya', type: 'city', city: 'Thika', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', latitude: -1.0334, longitude: 37.0693, aliases: ['thk', 'thika town'] },
  { id: 'ke-city-naivasha', name: 'Naivasha', displayName: 'Naivasha, Nakuru County, Kenya', type: 'city', city: 'Naivasha', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', latitude: -0.7172, longitude: 36.431, aliases: ['nvs'] },
  { id: 'ke-city-malindi', name: 'Malindi', displayName: 'Malindi, Kilifi County, Kenya', type: 'city', city: 'Malindi', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', latitude: -3.2192, longitude: 40.1169, aliases: ['mal'] },
  { id: 'ke-city-diani', name: 'Diani Beach', displayName: 'Diani Beach, Kwale County, Kenya', type: 'city', city: 'Diani Beach', county: 'Kwale County', country: 'Kenya', countryCode: 'KE', latitude: -4.2797, longitude: 39.5947, aliases: ['diani', 'dia'] },
  { id: 'ke-city-watamu', name: 'Watamu', displayName: 'Watamu, Kilifi County, Kenya', type: 'city', city: 'Watamu', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', latitude: -3.35, longitude: 40.0167, aliases: ['wat'] },
  { id: 'ke-city-nanyuki', name: 'Nanyuki', displayName: 'Nanyuki, Laikipia County, Kenya', type: 'city', city: 'Nanyuki', county: 'Laikipia County', country: 'Kenya', countryCode: 'KE', latitude: 0.0167, longitude: 37.0722, aliases: ['nyk'] },
  { id: 'ke-city-nyeri', name: 'Nyeri', displayName: 'Nyeri, Nyeri County, Kenya', type: 'city', city: 'Nyeri', county: 'Nyeri County', country: 'Kenya', countryCode: 'KE', latitude: -0.4201, longitude: 36.9476, aliases: ['nyeri town'] },
  { id: 'ke-city-machakos', name: 'Machakos', displayName: 'Machakos, Machakos County, Kenya', type: 'city', city: 'Machakos', county: 'Machakos County', country: 'Kenya', countryCode: 'KE', latitude: -1.5177, longitude: 37.2634, aliases: ['machakos town', 'mck'] },
  { id: 'ke-city-kitengela', name: 'Kitengela', displayName: 'Kitengela, Kajiado County, Kenya', type: 'city', city: 'Kitengela', county: 'Kajiado County', country: 'Kenya', countryCode: 'KE', latitude: -1.4851, longitude: 36.9602, aliases: ['ktg'] },
  { id: 'ke-city-ruiru', name: 'Ruiru', displayName: 'Ruiru, Kiambu County, Kenya', type: 'city', city: 'Ruiru', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', latitude: -1.1472, longitude: 36.9611, aliases: ['ruiru town'] },
  { id: 'ke-city-kikuyu', name: 'Kikuyu', displayName: 'Kikuyu, Kiambu County, Kenya', type: 'city', city: 'Kikuyu', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', latitude: -1.2464, longitude: 36.6631, aliases: ['kikuyu town'] },
  { id: 'ke-city-limuru', name: 'Limuru', displayName: 'Limuru, Kiambu County, Kenya', type: 'city', city: 'Limuru', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', latitude: -1.11, longitude: 36.6433, aliases: ['limuru town'] },
  { id: 'ke-city-athi-river', name: 'Athi River', displayName: 'Athi River, Machakos County, Kenya', type: 'city', city: 'Athi River', county: 'Machakos County', country: 'Kenya', countryCode: 'KE', latitude: -1.45, longitude: 36.9833, aliases: ['mavoko'] },
  { id: 'ke-city-meru', name: 'Meru', displayName: 'Meru, Meru County, Kenya', type: 'city', city: 'Meru', county: 'Meru County', country: 'Kenya', countryCode: 'KE', latitude: 0.05, longitude: 37.65, aliases: ['meru town'] },
  { id: 'ke-city-embu', name: 'Embu', displayName: 'Embu, Embu County, Kenya', type: 'city', city: 'Embu', county: 'Embu County', country: 'Kenya', countryCode: 'KE', latitude: -0.5388, longitude: 37.4594, aliases: ['embu town'] },
  { id: 'ke-city-kakamega', name: 'Kakamega', displayName: 'Kakamega, Kakamega County, Kenya', type: 'city', city: 'Kakamega', county: 'Kakamega County', country: 'Kenya', countryCode: 'KE', latitude: 0.2827, longitude: 34.7519, aliases: ['kakamega town'] },
  { id: 'ke-city-kitale', name: 'Kitale', displayName: 'Kitale, Trans-Nzoia County, Kenya', type: 'city', city: 'Kitale', county: 'Trans-Nzoia County', country: 'Kenya', countryCode: 'KE', latitude: 1.0167, longitude: 34.95, aliases: ['kitale town'] },
  { id: 'ke-city-kisii', name: 'Kisii', displayName: 'Kisii, Kisii County, Kenya', type: 'city', city: 'Kisii', county: 'Kisii County', country: 'Kenya', countryCode: 'KE', latitude: -0.6817, longitude: 34.7667, aliases: ['kisii town'] },
  { id: 'ke-city-kericho', name: 'Kericho', displayName: 'Kericho, Kericho County, Kenya', type: 'city', city: 'Kericho', county: 'Kericho County', country: 'Kenya', countryCode: 'KE', latitude: -0.3689, longitude: 35.2863, aliases: ['kericho town'] },
  { id: 'ke-city-garissa', name: 'Garissa', displayName: 'Garissa, Garissa County, Kenya', type: 'city', city: 'Garissa', county: 'Garissa County', country: 'Kenya', countryCode: 'KE', latitude: -0.4536, longitude: 39.646, aliases: ['garissa town'] },
  { id: 'ke-city-kilifi-town', name: 'Kilifi', displayName: 'Kilifi, Kilifi County, Kenya', type: 'city', city: 'Kilifi', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', latitude: -3.6305, longitude: 39.8499, aliases: ['kilifi town'] },
  { id: 'ke-city-lamu-town', name: 'Lamu', displayName: 'Lamu, Lamu County, Kenya', type: 'city', city: 'Lamu', county: 'Lamu County', country: 'Kenya', countryCode: 'KE', latitude: -2.2686, longitude: 40.9006, aliases: ['lamu town', 'lamu island'] },
  { id: 'ke-city-voi', name: 'Voi', displayName: 'Voi, Taita-Taveta County, Kenya', type: 'city', city: 'Voi', county: 'Taita-Taveta County', country: 'Kenya', countryCode: 'KE', latitude: -3.396, longitude: 38.556, aliases: ['voi town'] },
  { id: 'ke-city-isiolo-town', name: 'Isiolo', displayName: 'Isiolo, Isiolo County, Kenya', type: 'city', city: 'Isiolo', county: 'Isiolo County', country: 'Kenya', countryCode: 'KE', latitude: 0.3546, longitude: 37.5822, aliases: ['isiolo town'] },
  { id: 'ke-city-bungoma-town', name: 'Bungoma', displayName: 'Bungoma, Bungoma County, Kenya', type: 'city', city: 'Bungoma', county: 'Bungoma County', country: 'Kenya', countryCode: 'KE', latitude: 0.5694, longitude: 34.5583, aliases: ['bungoma town'] },
  { id: 'ke-city-busia-town', name: 'Busia', displayName: 'Busia, Busia County, Kenya', type: 'city', city: 'Busia', county: 'Busia County', country: 'Kenya', countryCode: 'KE', latitude: 0.4608, longitude: 34.1114, aliases: ['busia town'] },
  { id: 'ke-city-narok-town', name: 'Narok', displayName: 'Narok, Narok County, Kenya', type: 'city', city: 'Narok', county: 'Narok County', country: 'Kenya', countryCode: 'KE', latitude: -1.0833, longitude: 35.8667, aliases: ['narok town'] },
]

/**
 * Standardized Real Estate Areas, Neighborhoods, and Estates in Kenya
 */
export const KENYA_AREAS: LocationSuggestion[] = [
  // ── Nairobi Real Estate Hotspots
  { id: 'ke-area-westlands', name: 'Westlands', displayName: 'Westlands, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['westlands skyline', 'rhapta road', 'waiyaki way', 'sarit', 'gtc'] },
  { id: 'ke-area-kilimani', name: 'Kilimani', displayName: 'Kilimani, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['argwings kodhek', 'chania avenue', 'wood avenue', 'ring road kilimani', 'yaya'] },
  { id: 'ke-area-kileleshwa', name: 'Kileleshwa', displayName: 'Kileleshwa, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['mandera road', 'siaya road', 'kile'] },
  { id: 'ke-area-karen', name: 'Karen', displayName: 'Karen, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['karen plains', 'karen road', 'karen triangle', 'mbagathi'] },
  { id: 'ke-area-lavington', name: 'Lavington', displayName: 'Lavington, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['james gichuru', 'amboseli', 'lavington green'] },
  { id: 'ke-area-parklands', name: 'Parklands', displayName: 'Parklands, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['1st parklands', '2nd parklands', '3rd parklands', '4th parklands', 'limuru road'] },
  { id: 'ke-area-runda', name: 'Runda', displayName: 'Runda, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['runda estate', 'runda mimosa', 'runda evergreen'] },
  { id: 'ke-area-muthaiga', name: 'Muthaiga', displayName: 'Muthaiga, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['old muthaiga', 'muthaiga north'] },
  { id: 'ke-area-upper-hill', name: 'Upper Hill', displayName: 'Upper Hill, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['upperhill', 'hospital road', 'community'] },
  { id: 'ke-area-cbd', name: 'CBD', displayName: 'CBD, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['central business district', 'city centre', 'town'] },
  { id: 'ke-area-riverside', name: 'Riverside', displayName: 'Riverside, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['riverside drive'] },
  { id: 'ke-area-spring-valley', name: 'Spring Valley', displayName: 'Spring Valley, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['peponi', 'peponi road'] },
  { id: 'ke-area-gigiri', name: 'Gigiri', displayName: 'Gigiri, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['un avenue', 'united nations'] },
  { id: 'ke-area-kitisuru', name: 'Kitisuru', displayName: 'Kitisuru, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['old kitisuru', 'new kitisuru'] },
  { id: 'ke-area-south-b', name: 'South B', displayName: 'South B, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['mariakani', 'golden gate'] },
  { id: 'ke-area-south-c', name: 'South C', displayName: 'South C, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['bellevue', 'muhoho avenue'] },
  { id: 'ke-area-langata', name: 'Langata', displayName: 'Langata, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ["lang'ata", 'langata road'] },
  { id: 'ke-area-ngong-road', name: 'Ngong Road', displayName: 'Ngong Road, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['ngong rd', 'adams arcade', 'dagoretti corner'] },
  { id: 'ke-area-roysambu', name: 'Roysambu', displayName: 'Roysambu, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['thika road mall', 'trm'] },
  { id: 'ke-area-kasarani', name: 'Kasarani', displayName: 'Kasarani, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['clay city', 'mwiki'] },
  { id: 'ke-area-embakasi', name: 'Embakasi', displayName: 'Embakasi, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['nyayo estate', 'fedha', 'donholm'] },
  { id: 'ke-area-ridgeways', name: 'Ridgeways', displayName: 'Ridgeways, Nairobi, Kenya', type: 'area', city: 'Nairobi', county: 'Nairobi County', country: 'Kenya', countryCode: 'KE', aliases: ['kiambu road ridgeways', 'garden estate'] },

  // ── Kiambu Metropolitan Areas
  { id: 'ke-area-ruaka', name: 'Ruaka', displayName: 'Ruaka, Kiambu County, Kenya', type: 'area', city: 'Ruaka', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', aliases: ['two rivers', 'rosslyn', 'limuru road ruaka'] },
  { id: 'ke-area-two-rivers', name: 'Two Rivers', displayName: 'Two Rivers, Kiambu County, Kenya', type: 'area', city: 'Ruaka', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', aliases: ['two rivers mall'] },
  { id: 'ke-area-thika-greens', name: 'Thika Greens', displayName: 'Thika Greens, Kiambu County, Kenya', type: 'area', city: 'Thika', county: 'Kiambu County', country: 'Kenya', countryCode: 'KE', aliases: ['thika greens golf'] },

  // ── Machakos & Kajiado Metropolitan Areas
  { id: 'ke-area-syokimau', name: 'Syokimau', displayName: 'Syokimau, Machakos County, Kenya', type: 'area', city: 'Athi River', county: 'Machakos County', country: 'Kenya', countryCode: 'KE', aliases: ['gateway mall', 'mombasa road syokimau'] },
  { id: 'ke-area-ongata-rongai', name: 'Ongata Rongai', displayName: 'Ongata Rongai, Kajiado County, Kenya', type: 'area', city: 'Ongata Rongai', county: 'Kajiado County', country: 'Kenya', countryCode: 'KE', aliases: ['rongai', 'masai lodge'] },
  { id: 'ke-area-ngong-town', name: 'Ngong Town', displayName: 'Ngong Town, Kajiado County, Kenya', type: 'area', city: 'Ngong', county: 'Kajiado County', country: 'Kenya', countryCode: 'KE', aliases: ['ngong', 'ngong hills'] },

  // ── Coast Real Estate Hotspots
  { id: 'ke-area-nyali', name: 'Nyali', displayName: 'Nyali, Mombasa, Kenya', type: 'area', city: 'Mombasa', county: 'Mombasa County', country: 'Kenya', countryCode: 'KE', aliases: ['nyali beach', 'links road', 'cinemax'] },
  { id: 'ke-area-bamburi', name: 'Bamburi', displayName: 'Bamburi, Mombasa, Kenya', type: 'area', city: 'Mombasa', county: 'Mombasa County', country: 'Kenya', countryCode: 'KE', aliases: ['bamburi beach'] },
  { id: 'ke-area-shanzu', name: 'Shanzu', displayName: 'Shanzu, Mombasa, Kenya', type: 'area', city: 'Mombasa', county: 'Mombasa County', country: 'Kenya', countryCode: 'KE', aliases: ['shanzu beach', 'serena'] },
  { id: 'ke-area-diani-beach', name: 'Diani Beach Road', displayName: 'Diani Beach Road, Kwale County, Kenya', type: 'area', city: 'Diani Beach', county: 'Kwale County', country: 'Kenya', countryCode: 'KE', aliases: ['diani beach', 'beach road diani', 'galu'] },
  { id: 'ke-area-malindi-casuarina', name: 'Casuarina', displayName: 'Casuarina, Malindi, Kenya', type: 'area', city: 'Malindi', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', aliases: ['casuarina malindi'] },
  { id: 'ke-area-watamu-turtle-bay', name: 'Turtle Bay', displayName: 'Turtle Bay, Watamu, Kenya', type: 'area', city: 'Watamu', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', aliases: ['watamu beach'] },
  { id: 'ke-area-mtwapa', name: 'Mtwapa', displayName: 'Mtwapa, Kilifi County, Kenya', type: 'area', city: 'Mtwapa', county: 'Kilifi County', country: 'Kenya', countryCode: 'KE', aliases: ['mtwapa creek'] },

  // ── Rift Valley / Upcountry Areas
  { id: 'ke-area-milimani-nakuru', name: 'Milimani Nakuru', displayName: 'Milimani, Nakuru, Kenya', type: 'area', city: 'Nakuru', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', aliases: ['milimani'] },
  { id: 'ke-area-section-58', name: 'Section 58', displayName: 'Section 58, Nakuru, Kenya', type: 'area', city: 'Nakuru', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', aliases: ['section 58 nakuru'] },
  { id: 'ke-area-south-lake', name: 'South Lake', displayName: 'South Lake, Naivasha, Kenya', type: 'area', city: 'Naivasha', county: 'Nakuru County', country: 'Kenya', countryCode: 'KE', aliases: ['moi south lake', 'south lake road'] },
  { id: 'ke-area-milimani-kisumu', name: 'Milimani Kisumu', displayName: 'Milimani, Kisumu, Kenya', type: 'area', city: 'Kisumu', county: 'Kisumu County', country: 'Kenya', countryCode: 'KE', aliases: ['milimani kisumu', 'tom mboya estate'] },
  { id: 'ke-area-elgon-view', name: 'Elgon View', displayName: 'Elgon View, Eldoret, Kenya', type: 'area', city: 'Eldoret', county: 'Uasin Gishu County', country: 'Kenya', countryCode: 'KE', aliases: ['elgon view eldoret'] },
]

/**
 * Standardized Countries List
 */
export const COUNTRIES: LocationSuggestion[] = [
  { id: 'country-ke', name: 'Kenya', displayName: 'Kenya', type: 'country', country: 'Kenya', countryCode: 'KE', aliases: ['kenya', 'ke'] },
  { id: 'country-ug', name: 'Uganda', displayName: 'Uganda', type: 'country', country: 'Uganda', countryCode: 'UG', aliases: ['uganda', 'ug'] },
  { id: 'country-tz', name: 'Tanzania', displayName: 'Tanzania', type: 'country', country: 'Tanzania', countryCode: 'TZ', aliases: ['tanzania', 'tz'] },
  { id: 'country-rw', name: 'Rwanda', displayName: 'Rwanda', type: 'country', country: 'Rwanda', countryCode: 'RW', aliases: ['rwanda', 'rw'] },
  { id: 'country-bi', name: 'Burundi', displayName: 'Burundi', type: 'country', country: 'Burundi', countryCode: 'BI', aliases: ['burundi', 'bi'] },
  { id: 'country-ss', name: 'South Sudan', displayName: 'South Sudan', type: 'country', country: 'South Sudan', countryCode: 'SS', aliases: ['south sudan', 'ss'] },
  { id: 'country-et', name: 'Ethiopia', displayName: 'Ethiopia', type: 'country', country: 'Ethiopia', countryCode: 'ET', aliases: ['ethiopia', 'et'] },
  { id: 'country-so', name: 'Somalia', displayName: 'Somalia', type: 'country', country: 'Somalia', countryCode: 'SO', aliases: ['somalia', 'so'] },
  { id: 'country-ng', name: 'Nigeria', displayName: 'Nigeria', type: 'country', country: 'Nigeria', countryCode: 'NG', aliases: ['nigeria', 'ng'] },
  { id: 'country-gh', name: 'Ghana', displayName: 'Ghana', type: 'country', country: 'Ghana', countryCode: 'GH', aliases: ['ghana', 'gh'] },
  { id: 'country-za', name: 'South Africa', displayName: 'South Africa', type: 'country', country: 'South Africa', countryCode: 'ZA', aliases: ['south africa', 'za'] },
  { id: 'country-eg', name: 'Egypt', displayName: 'Egypt', type: 'country', country: 'Egypt', countryCode: 'EG', aliases: ['egypt', 'eg'] },
  { id: 'country-ae', name: 'United Arab Emirates', displayName: 'United Arab Emirates', type: 'country', country: 'United Arab Emirates', countryCode: 'AE', aliases: ['uae', 'dubai', 'abu dhabi', 'emirates'] },
  { id: 'country-gb', name: 'United Kingdom', displayName: 'United Kingdom', type: 'country', country: 'United Kingdom', countryCode: 'GB', aliases: ['uk', 'britain', 'england'] },
  { id: 'country-us', name: 'United States', displayName: 'United States', type: 'country', country: 'United States', countryCode: 'US', aliases: ['usa', 'us', 'america'] },
  { id: 'country-ca', name: 'Canada', displayName: 'Canada', type: 'country', country: 'Canada', countryCode: 'CA', aliases: ['canada', 'ca'] },
  { id: 'country-de', name: 'Germany', displayName: 'Germany', type: 'country', country: 'Germany', countryCode: 'DE', aliases: ['germany', 'de'] },
  { id: 'country-fr', name: 'France', displayName: 'France', type: 'country', country: 'France', countryCode: 'FR', aliases: ['france', 'fr'] },
  { id: 'country-au', name: 'Australia', displayName: 'Australia', type: 'country', country: 'Australia', countryCode: 'AU', aliases: ['australia', 'au'] },
  { id: 'country-in', name: 'India', displayName: 'India', type: 'country', country: 'India', countryCode: 'IN', aliases: ['india', 'in'] },
  { id: 'country-cn', name: 'China', displayName: 'China', type: 'country', country: 'China', countryCode: 'CN', aliases: ['china', 'cn'] },
]

/**
 * Major International Cities for Global Support
 */
export const INTERNATIONAL_CITIES: LocationSuggestion[] = [
  { id: 'intl-city-london', name: 'London', displayName: 'London, United Kingdom', type: 'city', city: 'London', country: 'United Kingdom', countryCode: 'GB', aliases: ['london uk'] },
  { id: 'intl-city-dubai', name: 'Dubai', displayName: 'Dubai, United Arab Emirates', type: 'city', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', aliases: ['dxb'] },
  { id: 'intl-city-kigali', name: 'Kigali', displayName: 'Kigali, Rwanda', type: 'city', city: 'Kigali', country: 'Rwanda', countryCode: 'RW', aliases: ['kigali city'] },
  { id: 'intl-city-kampala', name: 'Kampala', displayName: 'Kampala, Uganda', type: 'city', city: 'Kampala', country: 'Uganda', countryCode: 'UG', aliases: ['kampala city'] },
  { id: 'intl-city-dar', name: 'Dar es Salaam', displayName: 'Dar es Salaam, Tanzania', type: 'city', city: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ', aliases: ['dar'] },
  { id: 'intl-city-johannesburg', name: 'Johannesburg', displayName: 'Johannesburg, South Africa', type: 'city', city: 'Johannesburg', country: 'South Africa', countryCode: 'ZA', aliases: ['joburg', 'jhb'] },
  { id: 'intl-city-cape-town', name: 'Cape Town', displayName: 'Cape Town, South Africa', type: 'city', city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', aliases: ['cpt'] },
  { id: 'intl-city-new-york', name: 'New York', displayName: 'New York, United States', type: 'city', city: 'New York', region: 'NY', country: 'United States', countryCode: 'US', aliases: ['nyc', 'new york city'] },
  { id: 'intl-city-toronto', name: 'Toronto', displayName: 'Toronto, Canada', type: 'city', city: 'Toronto', region: 'ON', country: 'Canada', countryCode: 'CA', aliases: ['toronto on'] },
  { id: 'intl-city-paris', name: 'Paris', displayName: 'Paris, France', type: 'city', city: 'Paris', country: 'France', countryCode: 'FR', aliases: ['paris france'] },
]

/**
 * Combined Complete Standard Dataset
 */
export const ALL_STANDARD_LOCATIONS: LocationSuggestion[] = [
  ...KENYA_CITIES_AND_TOWNS,
  ...KENYA_AREAS,
  ...KENYA_COUNTIES,
  ...COUNTRIES,
  ...INTERNATIONAL_CITIES,
]
