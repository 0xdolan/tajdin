# Adding a Kurdish station

The curated list lives in
[`packages/core/src/data/kurdish-stations.json`](../packages/core/src/data/kurdish-stations.json).
Every entry is shown under **Kurdish stations** and mixed into the random mix.

```json
{
  "id": "39",
  "name": "Dengê Welat",
  "url": "https://example.com/live.mp3",
  "cover": "https://example.com/logo.png"
}
```

| Field   | Rules                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`    | A new number, never reused. Favourites refer to it (`ku:<id>`), so **don't renumber** existing stations.            |
| `name`  | The station's own name, in its own spelling.                                                                        |
| `url`   | A direct audio stream (MP3/AAC/Ogg or `.m3u8`), not a web page. Prefer `https://`, which also works on the website. |
| `cover` | Optional logo URL (`https://`), ideally square.                                                                     |

Before opening a pull request:

1. Check the stream plays: paste it into Tajdîn's **Play a link or file**.
2. Run `pnpm test` (it validates the whole list).
3. Use a commit like `feat(stations): add Dengê Welat`, or `fix(stations): update Rudaw stream`.

To remove a dead station, delete its entry and leave its `id` unused.

Not a developer? [Open an issue](https://github.com/0xdolan/tajdin/issues/new?template=station.yml)
with the name and stream link.
