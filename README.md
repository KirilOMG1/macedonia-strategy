# Macedonia Strategy

A polished, browser-based regional strategy game inspired by historical grand strategy interfaces. It uses accurate, open administrative boundaries for the eight statistical regions of North Macedonia and 2021 population baselines for the national and regional totals.

## Play locally

Open `index.html` directly in a modern browser, or run:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Map and data

- Administrative region boundaries: geoBoundaries, open `MKD/ADM1` dataset.
- Country context boundaries: Natural Earth via the `datasets/geo-countries` project.
- City coordinates: widely used geographic coordinates rounded for playability.
- Regional population values are approximate campaign baselines derived from 2021 census totals.

The municipal and regional boundaries are included in this repository under the geoBoundaries open license. This is an unofficial fan project and no endorsement by the State Statistical Office or geoBoundaries is implied.

## Controls

- Click a region to inspect it.
- Invest in industry, raise a garrison, or host a festival.
- Select a border region, move garrison units to a neighboring front, and attack it.
- Improve relations to reduce the chance of border attacks.
- Advance through seasons; collect regional income and respond to national events.
- Complete the three campaign goals to build a prosperous Macedonia.
