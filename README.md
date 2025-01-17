# This Fork

I forked this to work on the conversion from SR to AT, which still has some 
issues:

- coordinates were not mapped well (mostly fixed)
- perfectly normal rails turn into very weird ribbons
  The main problem is that SR and AT have very different conceptions of time,
  and while rails are specified in milliseconds since the start of the track,
  I'm not sure of the possible granularity of the segments. Ribbons on the 
  other hand are specified in fractions of a beat. To fix the conversion, every
  vertex on a rail must be translated into a vertex on a ribbon. Right now
  that does not seem to be the case and the translation code is not very easy
  to follow, unfortunately, mainly because the problem is not easy to solve.

# Disclaimer
* This project is not affiliated with AudioTrip, SynthRiders, their respective communities or any other third party, especially any modding community.
* AudioTrip's and SynthRiders' file formats are readable plain text. This tool is not breaking any sort of protective measures.
* Because of the different gameplay elements of each game, this tool is unable to create identical conversions. Each conversion usually contains sections where reworking is needed to provide a fluent and fun experience. 
* Feel free to contact me via Discord for feedback or suggestions. (see profile information)

![defaultView](https://github.com/Blogshot/trip-sitter/blob/master/defaultView.png)

# TripSitter
This tool aims to provide an easy to use way to convert and import SynthRiders custom songs into AudioTrip and vice versa.

## Installation
Download the latest [release](https://github.com/Blogshot/trip-sitter/releases) and install.

Windows will likely complain about TripSitter being "unsigned". If you don't feel comfortable ignoring the warning, you can download VSCode and the source code and build the software yourself.

## Build
* Debug/Execute by pressing F5 in VSCode.
* Build via `npm run-script build`. The artifact will be located at `trip-sitter\dist`.

## Usage
SynthRiders -> AudioTrip: Drag'n'Drop a `.synth`-file into the app to make it available in AudioTrip.
AudioTrip -> SynthRiders: Drag'n'Drop a `.ats`-file into the app to make it available in SynthRiders. (not yet supported; not in active development)

## Limitations
* Elements/Gems might be inaccurately timed or difficult to reach in-game
* AudioTrip doesn't support center barriers; they are omitted
* The diagonal barriers of AudioTrip and SynthRiders are angled differently; this *will* affect movements and cause gems to be inside barriers
