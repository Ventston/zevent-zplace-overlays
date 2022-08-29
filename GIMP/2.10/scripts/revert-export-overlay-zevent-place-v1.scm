; Licence: MIT
; Copyright 2022 ludolpif
; On GNU/Linux, this script goes in ~/.config/GIMP/2.10/scripts/
; On Windows, in %USERPROFILE%\AppData\Roaming\GIMP\2.10\scripts\
; Restart GIMP, open an Image, open the "Filters" menu.
; If correctly loaded, you should have "Revert Export ZEvent/place overlay (v1)"
; Tested with GIMP 2.10.22
(define (script-fu-revert-export-overlay-zevent-place-v1 image)
  (let*
    (
      (image-width (car (gimp-image-width image)))
      (image-height (car (gimp-image-height image)))
      (layer)
    ) ;end of our local variables
    (gimp-context-push)
    (gimp-context-set-defaults)
    (gimp-image-undo-group-start image)
    (gimp-selection-none image)

    (set! layer (car (gimp-image-merge-visible-layers image CLIP-TO-IMAGE)))
    (gimp-layer-resize-to-image-size layer)
    (gimp-layer-set-name layer "reverted from overlay")

    (gimp-context-set-interpolation INTERPOLATION-NONE)
    (gimp-image-scale image (/ image-width 3) (/ image-height 3) )

    (gimp-image-undo-group-end image)
    (gimp-displays-flush)
    (gimp-context-pop)
  )
)

(script-fu-register
  "script-fu-revert-export-overlay-zevent-place-v1"   ;func name
  "Revert Export ZEvent/place overlay (v1)"    ;menu label
  "Revert overlay created for ZEvent/place\
  pixel art back to a normal image"           ;description
  "Ludolpif"                                  ;author
  "Copyright 2022, Ludolpif"                  ;copyright notice
  "August 24, 2022"                           ;date created
  ""                     ;image type that the script works on
  SF-IMAGE       "Image"          0
)
(script-fu-menu-register "script-fu-revert-export-overlay-zevent-place-v1" "<Image>/Filters")
