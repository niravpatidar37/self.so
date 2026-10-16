# Tech-stack icons

Downloaded once from [go-skill-icons](https://github.com/LelouchFR/skill-icons) (MIT, based on
[tandpfun/skill-icons](https://github.com/tandpfun/skill-icons), MIT) and committed, so the page loads
them from its own origin and visitors never contact a third party:

```
https://go-skill-icons.vercel.app/api/icons?i=<id>&theme=light   -> <id>-light.svg
https://go-skill-icons.vercel.app/api/icons?i=<id>&theme=dark    -> <id>-dark.svg
```

Logos are trademarks of their owners. `bun run local:build` rejects any icon containing script, event
handlers, links or remote references (`assertSafeSvg` in `local/extras.ts`), so review diffs here like code.
