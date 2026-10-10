# Profile artwork

The profile showcases the first five pinned repositories in their order on 2026-10-11:
Think Translate, Agents Chat, WorldEcho, pelicanmap, and SideX.

```sh
npm ci --ignore-scripts
npm run assets:build
npm run preview
```

`assets/sources/` contains selected images from the projects' public demos and artwork.
`provenance.json` records the source repository, commit, path and GIF frame.
Agents Chat uses a brand illustration and Agentmoji assets; it does not depict a recorded conversation.
WorldEcho uses the project's globe screenshot and model renders.
Collected artworks and third-party material retain their upstream attribution and rights.

The generator makes vector lettering and self-contained SVGs, with desktop and mobile layouts.
Windows defaults use Microsoft YaHei, Georgia and Consolas from the local Fonts folder.
For another system, set `PROFILE_FONT_SANS`, `PROFILE_FONT_BOLD`, `PROFILE_FONT_SERIF`
and `PROFILE_FONT_MONO` to suitable local TTF/TTC/OTF files; the sans fonts must include Chinese glyphs.
Full font files are not included. Final artwork requires no installed fonts on the viewer's device.
Motion is limited to the decorative agent stickers and collection gallery, and honors reduced motion.

To deliberately refresh the source snapshots, use `npm run assets:refresh` (requires `gh`).
Review the new images and frame choices before building. The preview command uses GitHub's
Markdown API for the actual README HTML and also produces local static visual proofs.
`output/` is ignored and is never part of the public profile assets.
