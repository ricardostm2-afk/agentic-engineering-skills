# Isolated interaction

This reference describes the boundary implemented by `scripts/package-interaction.mjs`. The
parent composition remains on the static path. Free JavaScript lives in the `srcdoc` of the one
iframe inserted by the packager; the agent does not write the parent runtime.

## Contract

- The iframe carries exactly `sandbox="allow-scripts"`. Do not add `allow-same-origin`,
  `allow-forms`, `allow-popups`, `allow-top-navigation`, `allow-downloads` or `allow-modals`.
- The parent policy uses `default-src 'none'`, `connect-src 'none'`, `frame-src 'none'`,
  `child-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`,
  `navigate-to 'none'` and `webrtc 'block'` when the browser implements that CSP directive.
  The parent's `Permissions-Policy` denies camera, microphone, geolocation, USB, payments,
  fullscreen and autoplay; the frame repeats those denials in its `allow` attribute.
  The existing inline script is the packager's fixed runtime; the composition cannot insert scripts.
- The `srcdoc` has no external scripts, frames, forms, resource links, `on*` handlers, storage,
  network, popups or top navigation. Its CSP adds `frame-src 'none'`, `child-src 'none'`,
  `worker-src 'none'`, `navigate-to 'none'` and `webrtc 'block'`. The sandbox gives it an opaque
  origin. The runtime counts frame loads and removes the frame, restoring the fallback, if the
  document leaves `srcdoc` or fails. `webrtc 'block'` depends on browser support; exposure of
  `RTCPeerConnection` alone is not proof that ICE/STUN is isolated.
- The child sends small JSON objects with `version: 1` and one of four kinds:

```json
{"version":1,"kind":"ready"}
{"version":1,"kind":"state","state":{"variable":60,"outcome":"pending"}}
{"version":1,"kind":"result","result":{"variable":70,"prediction":"…","observed":"rejected","feedback":"…"}}
{"version":1,"kind":"error","message":"…"}
```

Fields are closed per kind. `variable` is finite; `outcome`/`observed` use the allowed lists;
`prediction` and `feedback` have length limits. The parent checks `event.source`,
`event.origin === "null"`, fields, size and rate before writing text.

## Lesson and fallback

`assets/lessons/interaction.html` is the parent and `interaction.srcdoc` is a small
prediction-observation lesson: duration is the cause, the limit is the condition, and feedback
explains the observed branch. The parent text remains usable when the frame does not load or the
browser does not run scripts. Do not claim that sandbox removes denial of service or every residual
channel; keep secrets out of both parent and child.

## Verification

`package-interaction.test.mjs` covers the content guard and contract. Browser proof should confirm,
on a local page and then at the publication destination when possible:

1. the child sends `ready`, changes the variable, and sends `state`/`result`;
2. attempts at `parent.document`, storage, network, popups or top navigation do not touch the parent;
   the probe also attempts self-navigation and records WebRTC `icecandidate`/`connectionState`.
   Record separately whether the browser exposes the API or ignores `webrtc 'block'`;
3. messages from another window or origin, extra fields, unknown kinds and bursts are ignored;
4. a frame without execution leaves the fallback visible;
5. nesting the page in a second iframe keeps the interaction without adding permissions.

This proves technical compliance and exercises the interaction. It does not measure learning in people.
Even with CSP and sandbox, this path does not promise to remove denial of service, every residual
channel, or a WebRTC implementation that does not support `webrtc 'block'`; report that limitation
instead of hiding it with regexes in free JavaScript.
