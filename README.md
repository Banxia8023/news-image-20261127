# news-image-20261127

Entry for make.fun `news-image-20261127`: sum up the world news of Friday 27 November 2026 in one image.

The program (`main.ts`, Node 22, standard library only) draws a 1024x1024 PNG newspaper
front page and writes it to `/output/entry.png`. The text is rendered with a 1-bit bitmap
font embedded in the program, and the PNG is encoded with the standard library, so the
program needs no network and no installed fonts, and two runs write identical bytes.
The page names the day at the top and summarises seven stories reported on 27 November
2026: the Kuwait drone attack, Trump urging Putin to end aggression in Europe, North
Korea reportedly suspending arms aid to Russia, the Congo Ebola outbreak passing 12,021
cases, US partners rejecting new tariffs, the EU picking De Cos as next ECB chief, and
the US Thanksgiving storm.

Run it with: `MAKEFUN_OUTPUT_DIR=out node main.ts`

License: MIT.
