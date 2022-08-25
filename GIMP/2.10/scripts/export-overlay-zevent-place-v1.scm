; On GNU/Linux, this script goes in ~/.config/GIMP/2.10/scripts/
; On Windows, in %USERPROFILE%\AppData\Roaming\GIMP\2.10\scripts\
; Restart GIMP, open an Image, open the "Filters" menu.
; If correctly loaded, you should have "Exporting ZEvent/place overlay (v1)"
; Tested with GIMP 2.10.22
(define (script-fu-export-overlay-zevent-place-v1 image)
  (let*
    (
      (pattern-name "overlay") ; needs ~/.config/GIMP/2.10/patterns/overlay.pat
      (bkpfilename (sfu-e-o-z-p-gen-filename-v1 image ".bkp.xcf"))
      (pngfilename (sfu-e-o-z-p-gen-filename-v1 image ".png"))
      (image-width (car (gimp-image-width image)))
      (image-height (car (gimp-image-height image)))
      (layer (car (gimp-image-get-active-drawable image)))
      (mask) 
    ) ;end of our local variables
    (gimp-xcf-save 0 image layer bkpfilename bkpfilename)

    (gimp-context-push)
    (gimp-context-set-defaults)
    (gimp-image-undo-group-start image)

    ; gimp-image-merge-visible-layers strips any mask and preserve alpha
    (set! layer (car (gimp-image-merge-visible-layers image CLIP-TO-IMAGE)))
    ; If no visible full-imagesize layer merged, then final export will be wrong 
    (gimp-layer-resize-to-image-size layer)
    (gimp-layer-set-name layer "overlay for export")

    (gimp-context-set-interpolation INTERPOLATION-NONE)
    (gimp-image-scale image (* 3 image-width) (* 3 image-height) )

    (set! mask (car (gimp-layer-create-mask layer ADD-MASK-WHITE)))
    (gimp-layer-add-mask layer mask)

    (gimp-context-set-pattern pattern-name)
    (gimp-drawable-edit-bucket-fill mask FILL-PATTERN 0 0)

    ;(gimp-xcf-save 0 image layer "debug.xcf" "debug.xcf")

    ; Merge again, file-png-save2 skips the mask if we don't
    (set! layer (car (gimp-image-merge-visible-layers image CLIP-TO-IMAGE)))

    (gimp-image-attach-parasite image (list "gimp-comment" 1 "Created with GIMP and script-fu-export-overlay-zevent-place-v1 script"))
    
    (gimp-image-undo-group-end image) ; Can't actually call undo from script so let the user do it in one action
    (gimp-displays-flush)

    (gimp-message (string-append _"Exporting to" " " pngfilename ". " _"Ctrl+Z to get the original back."))
    ;(file-png-save2 run-mode image drawable filename raw-filename interlace compression bkgd gama offs phys time comment svtrans)
    (file-png-save2 RUN-NONINTERACTIVE image layer pngfilename pngfilename 0 9 0 0 0 1 1 1 1)

    (gimp-context-pop)
  )
)

(define (sfu-e-o-z-p-gen-filename-v1 image suffix)
  (let*
    (
      (filename (car (gimp-image-get-filename image)))
      (xcfname (if (string=? filename "") (string-append (car (gimp-temp-name "")) "untitled.xcf") filename))
      (basename (substring xcfname 0 (- (string-length xcfname) 4)))
    )
    (string-append basename suffix)
  )
)

(script-fu-register
  "script-fu-export-overlay-zevent-place-v1"   ;func name
  "Export ZEvent/place overlay (v1)"           ;menu label
  "Duplicate current buffer, triple its size, keep 1 pixel out of 9, export it. \
  Suitable ZEvent/place pixel art."           ;description
  "Ludolpif"                                  ;author
  "Copyright 2022, Ludolpif"                  ;copyright notice
  "August 24, 2022"                           ;date created
  ""                     ;image type that the script works on
  SF-IMAGE       "Image"          0
)
(script-fu-menu-register "script-fu-export-overlay-zevent-place-v1" "<Image>/Filters")
