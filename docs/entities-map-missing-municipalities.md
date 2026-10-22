# Municipalities missing from the Entities Map

5 October 2026

The Connected Entities Map places an organisation only when its NUTS code is one of the 1,345 regions in the NUTS 2024 level-3 layer (`NUTS_RG_60M_2024_4326_LEVL_3`). **76 organisations** fail that test and never appear on the map. **14 of them are local authorities** (municipalities, city councils, intermunicipal communities, municipal agencies, and two county councils).

This note explains why, using the hosted `entities_cordis` table and the CORDIS project XML files in `packages/cordis/data/downloads`.

## Vila Franca de Xira

**Município de Vila Franca de Xira** (CORDIS id `895824489`) is a participant in [ReGreeneration](https://cordis.europa.eu/project/id/101139636) (`101139636`). It has a NUTS code. That code is the country, not a NUTS3 region.

In `101139636.xml`, both region relations point at the same Portugal record:

| Field | relatedNutsCode | relatedRegion |
|---|---|---|
| name | Portugal | Portugal |
| nutsCode | PT | PT |
| euCode | PT | PT |
| isoCode | PT | PT |
| rcn | 427199016 | 427199016 |
| parents | none | — |

The map accepts a code only when it is a NUTS3 id such as `PT1A0`. `PT` fails both the primary code and the region fallback, so the municipality is omitted. The database stores the same `PT` in both NUTS columns. The organisation appears in this one XML only, so no later file supplies a finer code.

Its address point (38.954, −8.990) falls inside **PT1A0 Grande Lisboa** on this map layer. The layer is generalized at 1:60 million, so a point near a boundary can fall in a neighbouring polygon. Grande Lisboa is also the code CORDIS already assigns to the Lisbon partners in the same project.

### How this record differs from partners that are drawn

Three shapes appear in `101139636.xml`:

| Shape in the XML | Example | What the map does |
|---|---|---|
| NUTS3 name plus parents up to the country | Ville de Paris: Paris (FR101) > Île-de-France (FR10) > Île-de-France (FR1) > France (FR) | `FR101` is on the layer, so Paris is drawn |
| Bare NUTS3 code, no name and no parents | IST-ID, Nhood Portugal, Glorious Marathon: rcn 1471670, nutsCode `PT1A0` | `PT1A0` is Grande Lisboa, so they are drawn |
| Country region used as the NUTS code | Município de Vila Franca de Xira: Portugal (`PT`), rcn 427199016, no parents | `PT` is not a NUTS3 id, so it is omitted |

## How the 76 split

| Cause | Entities | What it means |
|---|---:|---|
| UK NUTS3, absent from the 2024 layer | 31 | The XML has a full NUTS3 tree (for example `UKG31`). The 2024 map no longer contains the United Kingdom. |
| Outside NUTS, country code only | 27 | The XML has only a country code (`US`, `UA`, `NZ`, `AU`, and others), or the two UK organisations that have only `UK`. |
| Mapped country, country record only | 16 | The country is on the map. CORDIS published the country node as `relatedNutsCode`, with no NUTS3 parents. Vila Franca is in this group. |
| Mapped country, NUTS element missing | 2 | Eleftheriou Antonios (Greece) and Moreau Laure (France). The XML has `relatedRegion` and no `relatedNutsCode`. |

## Local authorities

County councils are included and labeled. Each region line is the full `regions` tree from the project XML.

### Country record used as the NUTS code

The country is on the map. The XML has no NUTS3 parents. These four can be placed once a NUTS3 code is known.

| Organisation | Kind | CORDIS id | Project | Stored code | Full region structure | Where the address sits |
|---|---|---|---|---|---|---|
| MUNICIPIO DE VILA FRANCA DE XIRA | Municipality | 895824489 | ReGreeneration · 101139636 | PT | relatedNutsCode: Portugal (PT), rcn 427199016, euCode PT, isoCode PT, no parents. relatedRegion: the same record. | PT1A0 Grande Lisboa |
| CIMAC — Comunidade Intermunicipal do Alentejo Central | Intermunicipal community | 936789432 | CARDIMED · 101112731 | PT | relatedNutsCode: Portugal (PT), rcn 427199016, euCode PT, isoCode PT, no parents. relatedRegion: the same record. | PT1C4 Alentejo Central (Évora) |
| MESTO KRASNA LIPA | Town | 885055258 | LAND4CLIMATE · 101112781 | CZ | relatedNutsCode: Czechia (CZ), rcn 210668072, euCode CZ, isoCode CZ, no parents. relatedRegion: the same record. | CZ042 Ústecký kraj |
| RIGAS PILSETAS PASVALDIBA (Riga City Council) | City council | 932227425 | AURORA · 101157643 | LV | relatedNutsCode: Latvia (LV), rcn 360614440, euCode LV, isoCode LV, no parents. relatedRegion: the same record. | LV00A Rīga |

Every omitted Portuguese organisation uses that same Portugal record (rcn 427199016), in one or two project files, with no NUTS3 parents in any copy:

- Município de Vila Franca de Xira (ReGreeneration)
- CIMAC (CARDIMED)
- CCDR Alentejo, Companhia das Lezírias, LNEG, and UNAC (DRYAD; LNEG also GENESIS)
- Associação Estação Biológica de Mértola (GRACE)

CCDR Alentejo is a regional commission, not a municipality. The address points of CIMAC and of CCDR fall in PT1C4 Alentejo Central.

### NUTS3 present, United Kingdom absent from the 2024 layer

These five already have a complete parent chain. They stay off the map because the layer has no UK polygons.

| Organisation | Kind | CORDIS id | Project | Stored code | Full region structure |
|---|---|---|---|---|---|
| BIRMINGHAM CITY COUNCIL | City council | 999624480 | BLOSSOM · 101214563 | UKG31 | Birmingham (UKG31) > West Midlands (UKG3) > West Midlands (England) (UKG) > United Kingdom (UK). relatedRegion: United Kingdom (UK). |
| LONDON BOROUGH OF NEWHAM | Borough | 951294230 | BLOSSOM · 101214563 | UKI41 | Hackney and Newham (UKI41) > Inner London — East (UKI4) > London (UKI) > United Kingdom (UK). relatedRegion: United Kingdom (UK). |
| THE COUNCIL OF THE BOROUGH OF TORBAY | Unitary borough | 937252025 | ARSINOE · 101037424 | UKK42 | Torbay (UKK42) > Devon (UKK4) > South West (England) (UKK) > United Kingdom (UK). relatedRegion: United Kingdom (UK). |
| ESSEX COUNTY COUNCIL | County council | 998795809 | NURISH · 101214414 | UKH36 | Heart of Essex (UKH36) > Essex (UKH3) > East of England (UKH) > United Kingdom (UK). relatedRegion: United Kingdom (UK). |
| OXFORDSHIRE COUNTY COUNCIL | County council | 963542420 | NURISH · 101214414 | UKJ14 | Oxfordshire (UKJ14) > Berkshire, Buckinghamshire and Oxfordshire (UKJ1) > South East (England) (UKJ) > United Kingdom (UK). relatedRegion: United Kingdom (UK). |

### Country outside the NUTS 2024 layer

These local authorities have no NUTS3 region to join to the European map.

| Organisation | Kind | CORDIS id | Project | Stored code | Full region structure |
|---|---|---|---|---|---|
| GRAD SARAJEVO (City of Sarajevo) | City | 917748332 | Commit2Green · 101139598 | BA0 | relatedNutsCode: unnamed, nutsCode BA0, rcn 1474082, no parents. relatedRegion: Bosnia and Herzegovina (BA), rcn 187337256. |
| CHRISTCHURCH CITY COUNCIL | City council | 881817592 | RISE-IN · 101214441 | NZ | relatedNutsCode: New Zealand (NZ), rcn 395217448, euCode NZ, isoCode NZ, no parents. relatedRegion: the same record. |
| Zalishchyky city council | City council | 885150803 | GRACE · 101214172 | UA | relatedNutsCode: Ukraine (UA), rcn 506104360, euCode UA, isoCode UA, no parents. relatedRegion: the same record. |
| City Development Agency of Zhytomyr City Council | Municipal agency | 906367322 | RISE-IN · 101214441 | UA | relatedNutsCode: Ukraine (UA), rcn 506104360, euCode UA, isoCode UA, no parents. relatedRegion: the same record. |
| Municipal Enterprise Institute of Urban Development (Vinnytsia) | Municipal enterprise | 882229066 | FairFuture · 101214343 | UA | relatedNutsCode: Ukraine (UA), rcn 506104360, euCode UA, isoCode UA, no parents. relatedRegion: the same record. |

Zhytomyr’s agency and Zalishchyky city council share the geolocation 49.487, 31.272, a point in central Ukraine rather than either city. That coordinate error is separate from the omission: Ukraine is not in the NUTS layer.

## Same country-record omission, other organisations

Twelve further entities sit in a country the 2024 layer covers, and the XML still publishes only the country node, or no NUTS element at all. They are omitted for the same reason as Vila Franca. They are universities, companies, NGOs, one region, and one municipal directorate.

| Organisation | Country | Stored code | Project | Region structure |
|---|---|---|---|---|
| PERIFEREIA VOREIOU AIGAIOU (Region of North Aegean) | EL | EL | CARDIMED | Greece (EL), rcn 240552488, no parents. Address point falls in EL411 Lesvos, Limnos. |
| DIRECTIA DE ASISTENTA SOCIALA | RO | RO | MOUNTADAPT | Romania (RO), rcn 459442728, no parents. Alba Iulia address falls in RO121 Alba. |
| FUNDACION CATEC | ES | ES | NATURE-DEMO | Spain (ES), country record only, no parents. The geolocation is central Madrid, while the city is La Rinconada. |
| BALTIJAS VIDES FORUMS | LV | LV | IMPETUS, NATALIE | Latvia (LV), country record in both XML files, no parents. |
| BURSA ULUDAG UNIVERSITESI | TR | TR | JUST4CARE | Türkiye (TR), country record only, no parents. |
| CRTA | RS | RS | ISMED-CLIM | Serbia (RS), country record only, no parents. |
| UDRUZENJE EKO-INOVACIJA NA BALKANU | RS | RS | ClimaPannonia | Serbia (RS), country record only, no parents. |
| Laboratorio Nacional de Energia e Geologia | PT | PT | DRYAD, GENESIS | Portugal (PT), rcn 427199016, in both XML files. |
| COMPANHIA DAS LEZIRIAS SA | PT | PT | DRYAD | Portugal (PT), rcn 427199016. Samora Correia, next to Vila Franca de Xira. |
| UNAC — União da Floresta Mediterrânica | PT | PT | DRYAD | Portugal (PT), rcn 427199016. City Chamusca. |
| CCDR Alentejo | PT | PT | DRYAD | Portugal (PT), rcn 427199016. Regional commission, Évora. |
| Associação Estação Biológica de Mértola | PT | PT | GRACE | Portugal (PT), rcn 427199016. |
| ELEFTHERIOU ANTONIOS | EL | blank | CARDIMED | No relatedNutsCode. relatedRegion only: Greece (EL). |
| MOREAU LAURE | FR | blank | CARDIMED | No relatedNutsCode. relatedRegion only: France (FR). |

The remaining omitted entities are universities, companies, and research bodies in the UK, Ukraine, the United States, Australia, New Zealand, and other countries the 2024 layer does not draw. Their XML region is either a historical UK NUTS3 tree or a single country code.
