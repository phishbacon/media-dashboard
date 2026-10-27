# Media Dashboard

A mobile-first dashboard for a home media server. It shows four cards — Watch,
Request, Audiobooks, and Ebooks — each one a link to the service you run for it.
The site is a static export served by nginx in a single Docker image, and the
card configuration is mounted in from the host so you can change it without
rebuilding anything.

## Quick start

```bash
cp services.json.example services.json   # then edit the card URLs to your own
docker run -d \
  --name media-dashboard \
  -p 3000:3000 \
  -v ./services.json:/config/services.json:ro \
  ghcr.io/phishbacon/media-dashboard:latest
```

Open http://localhost:3000.

## Docker Compose

The repository ships a `docker-compose.yml`, so the whole stack is one file
next to your config:

```yaml
services:
  media-dashboard:
    image: ghcr.io/phishbacon/media-dashboard:latest
    container_name: media-dashboard
    ports:
      - "3000:3000"
    volumes:
      - ./services.json:/config/services.json:ro
    restart: unless-stopped
```

Put your `services.json` beside it (copy `services.json.example` to start),
then:

```bash
docker compose up -d      # start
docker compose pull       # pick up a new image
docker compose restart    # restart
docker compose logs -f    # follow the nginx logs
```

Card changes are picked up on page reload — no rebuild and no restart, because
the config is a bind mount, not part of the image. To move the dashboard to
another host port, change the left side of `"3000:3000"`.

## Configuration

`services.json` is gitignored — copy `services.json.example` and put your own
service URLs in it. Personal URLs never enter the repository or the image.
Edit the file and reload the page: no rebuild, no restart needed for card
changes.

```json
{
  "title": "Media Dashboard",
  "cards": [
    {
      "name": "Watch",
      "url": "http://localhost:8096",
      "icon": "film",
      "description": "Movies and TV"
    },
    {
      "name": "Ebooks",
      "url": "http://localhost:8083",
      "icon": "book",
      "thumbnail": "/images/ebooks.svg"
    }
  ]
}
```

| Field       | Required | Notes                                                            |
| ----------- | -------- | ---------------------------------------------------------------- |
| `title`     | no       | Dashboard heading. Defaults to `Media Dashboard`.               |
| `cards`     | yes      | Array of cards, rendered in order. Add, remove, or reorder freely. |
| `cards[].name`   | yes | Card label.                                                  |
| `cards[].url`    | yes | Destination, `http` or `https`. Same-tab link.                |
| `cards[].icon`   | no  | `film`, `request`, `audio`, `book`, `tv`, `music`. Falls back to `film`. |
| `cards[].thumbnail` | no | Card image: an absolute URL or a local path under `/images/`. |
| `cards[].description` | no | One line under the name. Empty or missing shows nothing.     |

Unknown keys are ignored. A malformed file shows an error screen in the
browser with the exact parse error — fix the file and reload.

## Card images

The `thumbnail` value is either an absolute URL — fetched directly by your
browser, so it works with your network position and session — or a local path
like `/images/ebooks.svg`: drop your own file in `public/images/` and reference
it. Bundled examples: `watch.svg`, `request.png`, `audiobooks.svg`,
`ebooks.svg`.

If the value is missing, the path doesn't exist, or the image fails to load,
the card's category icon shows instead. Cards are uniform squares; images fit
inside without cropping.

## Ports and volumes

- **Port** `3000/tcp` serves the dashboard.
- **Volume** `/config/services.json` (a read-only bind mount) holds the card
  configuration.

## Development

```bash
npm ci
npm run dev      # http://localhost:3000 (Next picks a free port if taken)
npm run build    # static export into out/
```

In dev there is no nginx, so `/config/services.json` 404s and the app falls
back to `public/services-local.json` (untracked, gitignored — your personal
config for dev testing), then to the checked-in
`public/services-default.json` placeholders.

## Publishing (CI)

`.github/workflows/ci.yml`:

- **PR**: `npm ci` + `npm run build` gate.
- **Push to `main`**: builds and pushes `ghcr.io/phishbacon/media-dashboard:latest`
  for `linux/amd64` and `linux/arm64`.
- **Tag `vX.Y.Z`**: also pushes `X.Y.Z` and `X.Y`.

After your first publish, set the GHCR package visibility to **public** so
anyone can pull without a GitHub login: GitHub → Packages →
`media-dashboard` → Package settings → Change visibility.

## License

MIT
