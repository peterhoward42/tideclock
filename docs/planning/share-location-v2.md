# A new approach for share location feature

## Current situation

- We currently have a UI share link in the bottom right of the generated diagram.
- This generates the share URL we want it to but we've struggled to lay it out visually as
  part of the bottom right cluster - particularly on phones
- The recent changes have moved where we render the location further up from the bottom of the diagram - which will cause conflict with the diagram for our longest baked in place names.

## New strategy

- We will remove the share link from the bottom right cluster and solve the problem a different way.
- This has two parts - firstly putting the text share link over in the bottom left cluster but with the simple word "Share".
- Secondly upgrading the QR code that already exists in the bottom left corner to be dynamic and to encode the location also - as per the share link

## Some implementation notes

- The URL that the QR code encodes is significantly longer than the site root - which means the QR might need a larger square (`brandQrSize`) for reliable scanning.
- The pop up response to the user pressing the share link can be reused.
- The QR code is scan-only; no click behaviour.

## Revised layout for bottom left cluster

- **HomeShareTrigger** uses dimensionless offsets from **B_left** (`leftPadding`) and **B_bottom** (`aboveBottom`), same convention as **HomeMenuTrigger**.
- Tune alignment in `homeLayout.preset.ts`; do not derive position from **BrandURL** or **BrandQR** geometry in code.
