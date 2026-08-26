# App Store Optimization (ASO) copy kit

Griefcase ships today as an installable PWA, not a native app-store listing.
ASO in the traditional sense (Google Play / Apple App Store metadata) only
applies once — and if — Griefcase is wrapped for those stores (for example
via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or
[PWABuilder](https://www.pwabuilder.com/) to produce a Trusted Web
Activity for Play, or a wrapped build for the App Store).

This document is a ready-to-use draft of that metadata, written and
character-checked against each store's real limits, so submission is a
copy-paste job rather than a writing exercise. Nothing here is live —
there is no store listing today.

All character counts below were verified programmatically, not eyeballed.

## Google Play Store

| Field | Limit | Draft | Length |
|---|---|---|---|
| App title | 30 chars | `Griefcase – Write & Let Go` | 26 |
| Short description | 80 chars | `A private space to write down what's weighing on you, and let it go.` | 68 |

**Full description** (4,000 char limit; this draft is ~640 chars, leaving
room to expand with screenshots' worth of detail later):

> Griefcase is a private, anonymous space to write down what's weighing on you — grief, anger, things you haven't said out loud — and leave it there.
>
> There's no sign-up, no account, and no one reading what you write. In this version, everything you leave stays only on your own device.
>
> Write it, or record a short voice note instead. When you're done, watch it fold away and settle into your Griefcase — a small, calming ritual for putting something down. Come back anytime to "My Griefcase" to read old entries, or don't. Either way, they're just yours.
>
> Griefcase is not therapy, medical care, or crisis support, and it isn't a replacement for professional help. If you're in crisis, please contact your local emergency number or a crisis helpline in your area.

**Category:** Health & Fitness → Mental Health, or Lifestyle (either fits; Mental Health may trigger additional Play Console health-app review requirements worth confirming before submission).

## Apple App Store

| Field | Limit | Draft | Length |
|---|---|---|---|
| App name | 30 chars | `Griefcase` | 9 |
| Subtitle | 30 chars | `Write it down. Let it go.` | 25 |
| Promotional text | 170 chars | `A private space to write down what's weighing on you and leave it there. No account, no audience — just somewhere to put it down.` | 129 |
| Keywords | 100 chars, comma-separated | `grief,journal,vent,release,diary,anonymous,emotions,write,letgo,privacy,calm` | 76 |

**Description** (4,000 char limit) can reuse the Play Store full
description above verbatim — Apple has no separate structural requirement.

**Category:** Lifestyle (primary), Health & Fitness (secondary).

**App Store review note:** Apple asks apps that reference mental health or
crisis topics to make clear they are not a medical device and not a crisis
service. The in-app Privacy & Safety section and FAQ already say this
explicitly ("Griefcase is a space for private expression and reflection.
It isn't therapy, medical care, or crisis support...") — worth pointing
reviewers to that section directly in the App Review notes field.

## Why no health-outcome claims anywhere in this kit

Deliberately: nothing here promises Griefcase will reduce anxiety, "heal"
grief, or replace professional support, even softly. Both stores'
guidelines scrutinize wellness-adjacent apps for exactly that kind of
overclaim, and — more importantly — it wouldn't be an honest description
of what a private text box actually does.

## Reusing this kit

If Griefcase's scope changes (e.g. real backend storage, sync, or any of
the "Where this is headed" roadmap layers ship), update this file's
description before resubmitting — app store reviewers and users alike will
compare the listing against what the app actually does.
