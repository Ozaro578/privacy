// Start-Pakete (Themenboxen). Werden genutzt, solange im Admin-Bereich noch keine Pakete gespeichert sind.
// Danach verwaltet ihr die Pakete im Admin-Bereich unter "Pakete".
export interface PaketInhalt { id: string; menge: number }
export interface Paket {
  id: string; name: string; untertitel: string; emoji: string; farbe: string;
  inhalt: PaketInhalt[]; preis: number | null; mwst: number; aktiv: boolean;
}
export const PAKETE_VORLAGE: Paket[] = [
  {
    "id": "netflix-night",
    "name": "Netflix Night",
    "untertitel": "Chips, Schoko, Cola – alles für die nächste Serie",
    "emoji": "🍿",
    "farbe": "rot",
    "inhalt": [
      {
        "id": "6-pringles-bbq-steak-110-g",
        "menge": 1
      },
      {
        "id": "oreo-dutch-cocoa-wafer-double-choco-117g",
        "menge": 1
      },
      {
        "id": "kinder-milkredible-milky-46-8g",
        "menge": 1
      },
      {
        "id": "tonys-whole-strawberry-cocoa-flavour-60g-kopie",
        "menge": 1
      },
      {
        "id": "jelly-sticks-sour-300-g",
        "menge": 1
      },
      {
        "id": "coca-cola-cherry-330-ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "filmabend",
    "name": "Filmabend Deluxe",
    "untertitel": "Snacks & Drinks für zwei – Film ab!",
    "emoji": "🎬",
    "farbe": "gold",
    "inhalt": [
      {
        "id": "pringles-hot-spicy-110-g",
        "menge": 1
      },
      {
        "id": "sable-chocolate-soft-center-cookies-50-g",
        "menge": 1
      },
      {
        "id": "oreo-dutch-cocoa-wafer-choco-vanilla-117g",
        "menge": 1
      },
      {
        "id": "avesta-sour-candy-belt-berry-70g",
        "menge": 1
      },
      {
        "id": "airheads-watermelon-15-6g",
        "menge": 1
      },
      {
        "id": "coca-cola-zero-sugar-330-ml",
        "menge": 1
      },
      {
        "id": "amigo-ice-tea-peach-200-ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "gamer-paket",
    "name": "Gamer Paket",
    "untertitel": "Energy, Chips & Nudeln für die lange Session",
    "emoji": "🎮",
    "farbe": "violet",
    "inhalt": [
      {
        "id": "monster-punch-pipeline-energy-drink-330ml",
        "menge": 1
      },
      {
        "id": "red-bull-the-green-edition-curuba-elderflower-250-ml",
        "menge": 1
      },
      {
        "id": "golden-eagle-energy-drink-original-250-ml",
        "menge": 1
      },
      {
        "id": "takis-dracula-100g",
        "menge": 1
      },
      {
        "id": "pringles-super-hot-chili-lemon-crab-110-g",
        "menge": 1
      },
      {
        "id": "nerds-rope-very-berry-26g",
        "menge": 1
      },
      {
        "id": "samyang-buldak-carbonara",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "anime-night",
    "name": "Anime Night",
    "untertitel": "Naruto, Goku & Luffy – Drinks und Chips aus Japan-Style",
    "emoji": "🍥",
    "farbe": "pink",
    "inhalt": [
      {
        "id": "ultrapop-naruto-tropical-330-ml",
        "menge": 1
      },
      {
        "id": "ultrapop-dragon-ball-z-goku-strawberry-330-ml",
        "menge": 1
      },
      {
        "id": "ultrapop-one-piece-cherry-330ml",
        "menge": 1
      },
      {
        "id": "chipsan-kartoffelchips-pizza-flavor-naruto-110g",
        "menge": 1
      },
      {
        "id": "chipsan-kartoffelchips-caramelized-onions-dragon-ball-z-110g",
        "menge": 1
      },
      {
        "id": "ultra-pop-chips-chicken-lemon-one-piece-luffy-vs-lucci-110g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "sauer-challenge",
    "name": "Sauer-Challenge",
    "untertitel": "Wer verzieht als Erster das Gesicht?",
    "emoji": "🍋",
    "farbe": "gruen",
    "inhalt": [
      {
        "id": "jelly-sticks-sour-300-g",
        "menge": 1
      },
      {
        "id": "avesta-sour-candy-belt-berry-70g",
        "menge": 1
      },
      {
        "id": "avesta-sour-candy-belt-fruit-70g",
        "menge": 1
      },
      {
        "id": "dately-candy-dates-blueberry-650ml-kopie",
        "menge": 1
      },
      {
        "id": "nerds-grape-strawberry-1",
        "menge": 1
      },
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "spicy-challenge",
    "name": "Spicy Challenge",
    "untertitel": "Nur für Mutige: Takis, Buldak & Hot Chips",
    "emoji": "🌶️",
    "farbe": "orange",
    "inhalt": [
      {
        "id": "takis-dracula-100g",
        "menge": 1
      },
      {
        "id": "pringles-super-hot-spicy-crayfish-110g",
        "menge": 1
      },
      {
        "id": "pringles-super-hot-chili-lemon-crab-110-g",
        "menge": 1
      },
      {
        "id": "lay-s-geriffelte-chips-hot-spicy-70g",
        "menge": 1
      },
      {
        "id": "samyang-buldak-hot-chicken-rose",
        "menge": 1
      },
      {
        "id": "arizona-spicy-mucho-mango-with-mike-s-hot-honey-650-ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "us-candy-box",
    "name": "US Candy Box",
    "untertitel": "Reese's, Airheads, Nerds & Hershey's",
    "emoji": "🇺🇸",
    "farbe": "blue",
    "inhalt": [
      {
        "id": "hershey-cookie-cinnamon-20g-1",
        "menge": 1
      },
      {
        "id": "hershey-cookie-peanut-butter-20g",
        "menge": 1
      },
      {
        "id": "airheads-watermelon-15-6g",
        "menge": 1
      },
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "nerds-rope-very-berry-26g",
        "menge": 1
      },
      {
        "id": "nerds-grape-strawberry-1",
        "menge": 1
      },
      {
        "id": "reeses",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "energy-boost",
    "name": "Energy Boost",
    "untertitel": "Vier Dosen Power für Schule, Arbeit & Gym",
    "emoji": "⚡",
    "farbe": "dark",
    "inhalt": [
      {
        "id": "monster-punch-pipeline-energy-drink-330ml",
        "menge": 1
      },
      {
        "id": "monster-ultra-sunrise-asia-330ml",
        "menge": 1
      },
      {
        "id": "red-bull-the-green-edition-curuba-elderflower-250-ml",
        "menge": 1
      },
      {
        "id": "golden-eagle-energy-drink-original-250-ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "mystery-box-s",
    "name": "Mystery Box S",
    "untertitel": "5 Überraschungssnacks aus aller Welt, Inhalt wechselt jeden Monat (Beispiel unten)",
    "emoji": "🎁",
    "farbe": "pink",
    "inhalt": [
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "nerds-rainbow",
        "menge": 1
      },
      {
        "id": "skittles-asia-edition-original-fruit-40g",
        "menge": 1
      },
      {
        "id": "frosty-bites-gummy-cola-40g",
        "menge": 1
      },
      {
        "id": "hata-kosen-ramune",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "mystery-box-m",
    "name": "Mystery Box M",
    "untertitel": "10 Überraschungen: Snacks, Candy, 2 Drinks, jeden Monat anders (Beispiel unten)",
    "emoji": "🎁",
    "farbe": "violet",
    "inhalt": [
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "nerds-rainbow",
        "menge": 1
      },
      {
        "id": "skittles-asia-edition-original-fruit-40g",
        "menge": 1
      },
      {
        "id": "frosty-bites-gummy-cola-40g",
        "menge": 1
      },
      {
        "id": "hata-kosen-ramune",
        "menge": 1
      },
      {
        "id": "takis-fuego",
        "menge": 1
      },
      {
        "id": "pocky-strawberry",
        "menge": 1
      },
      {
        "id": "mochi-mini-vanilla-creme-40g",
        "menge": 1
      },
      {
        "id": "fanta-grape",
        "menge": 1
      },
      {
        "id": "cokoc-peelable-gummies-mixed-fruit-60g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "mystery-box-l",
    "name": "Mystery Box L",
    "untertitel": "15 Überraschungen inkl. Ramen, Dubai-Schoko und 3 Drinks (Beispiel unten)",
    "emoji": "🎁",
    "farbe": "gold",
    "inhalt": [
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "nerds-rainbow",
        "menge": 1
      },
      {
        "id": "skittles-asia-edition-original-fruit-40g",
        "menge": 1
      },
      {
        "id": "frosty-bites-gummy-cola-40g",
        "menge": 1
      },
      {
        "id": "hata-kosen-ramune",
        "menge": 1
      },
      {
        "id": "takis-fuego",
        "menge": 1
      },
      {
        "id": "pocky-strawberry",
        "menge": 1
      },
      {
        "id": "mochi-mini-vanilla-creme-40g",
        "menge": 1
      },
      {
        "id": "fanta-grape",
        "menge": 1
      },
      {
        "id": "cokoc-peelable-gummies-mixed-fruit-60g",
        "menge": 1
      },
      {
        "id": "samyang-buldak-carbonara",
        "menge": 1
      },
      {
        "id": "elit-dubai-riegel-30g",
        "menge": 1
      },
      {
        "id": "oreo-chocolate-asia-97g",
        "menge": 1
      },
      {
        "id": "dr-pepper-blackberry-355ml",
        "menge": 1
      },
      {
        "id": "sable-chocolate-soft-center-cookies-50-g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "japan-box",
    "name": "Japan Box",
    "untertitel": "Ramune, Pocky, Mochi – Konbini-Feeling für zuhause",
    "emoji": "🇯🇵",
    "farbe": "rot",
    "inhalt": [
      {
        "id": "hata-ramune-grape-japanese-soda-200ml",
        "menge": 1
      },
      {
        "id": "hata-ramune-melon-japanese-soda-200ml",
        "menge": 1
      },
      {
        "id": "hata-kosen-orange-200ml",
        "menge": 1
      },
      {
        "id": "pocky-strawberry",
        "menge": 1
      },
      {
        "id": "pocky-cookie-cream",
        "menge": 1
      },
      {
        "id": "pocky-schokolade",
        "menge": 1
      },
      {
        "id": "mochi-creamy-matcha-latte-40g",
        "menge": 1
      },
      {
        "id": "mochi-mini-maple-pancake-40g",
        "menge": 1
      },
      {
        "id": "fanta-peach-japan-330ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "korea-box",
    "name": "Korea Box",
    "untertitel": "Buldak, Pepsi Peach, Melon Fanta – scharf und süß aus Seoul",
    "emoji": "🇰🇷",
    "farbe": "blue",
    "inhalt": [
      {
        "id": "samyang-buldak-carbonara",
        "menge": 1
      },
      {
        "id": "samyang-buldak-hot-chicken-rose",
        "menge": 1
      },
      {
        "id": "samyang-buldak-quatro-cheese-bag-145g",
        "menge": 1
      },
      {
        "id": "samyang-buldak-swicy-sweet-spicy-5-130-g",
        "menge": 1
      },
      {
        "id": "pepsi-zero-sugar-peach-flavor-355-ml-korea",
        "menge": 1
      },
      {
        "id": "fanta-melon-350-ml-korea",
        "menge": 1
      },
      {
        "id": "sweet16-blueberry-ade-zero-sugar-200ml",
        "menge": 1
      },
      {
        "id": "lays-maxx-ridged-koreanisch-wurziger-huhnernudeln-geschmack-70g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "mexiko-box",
    "name": "Mexiko Box",
    "untertitel": "Takis in allen Farben plus Chili-Kerne – nichts für Weicheier",
    "emoji": "🇲🇽",
    "farbe": "green",
    "inhalt": [
      {
        "id": "takis-fuego",
        "menge": 1
      },
      {
        "id": "takis-blue-heat",
        "menge": 1
      },
      {
        "id": "takis-intense-nacho-92-3g",
        "menge": 1
      },
      {
        "id": "takis-dracula-100g",
        "menge": 1
      },
      {
        "id": "takims-crunchies-red-flame-90g",
        "menge": 1
      },
      {
        "id": "cruncho-blue-flame-mais-snack-90-g",
        "menge": 1
      },
      {
        "id": "seedos-sonnenblumenkerne-hot-chilli-and-lime-120g",
        "menge": 1
      },
      {
        "id": "pipapo-knax-flama-reja-amo-aller-amos-edition-70g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "usa-box",
    "name": "USA Box",
    "untertitel": "Nerds, Airheads, Reese's, Dr Pepper – American Candy Store",
    "emoji": "🇺🇸",
    "farbe": "blue",
    "inhalt": [
      {
        "id": "nerds-rainbow",
        "menge": 1
      },
      {
        "id": "nerds-rope-very-berry-26g",
        "menge": 1
      },
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "airheads-watermelon-15-6g",
        "menge": 1
      },
      {
        "id": "reeses",
        "menge": 1
      },
      {
        "id": "hershey-cookie-peanut-butter-20g",
        "menge": 1
      },
      {
        "id": "dr-pepper-vanilla-float-330ml",
        "menge": 1
      },
      {
        "id": "mountain-dew-baja-cabo-citrus-355-ml",
        "menge": 1
      },
      {
        "id": "arizona-rizzler-berry-650ml",
        "menge": 1
      },
      {
        "id": "fruit-roll-ups-10-stk-140g",
        "menge": 1
      },
      {
        "id": "skittles-wild-berry-flavour",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "china-box",
    "name": "China Box",
    "untertitel": "Fanta Green Apple, Peach Cola, Oreo Asia, Algen-Chips",
    "emoji": "🇨🇳",
    "farbe": "rot",
    "inhalt": [
      {
        "id": "fanta-green-apple-china-330ml",
        "menge": 1
      },
      {
        "id": "coca-cola-peach-china-330ml",
        "menge": 1
      },
      {
        "id": "fanta-strawberry-china-330ml",
        "menge": 1
      },
      {
        "id": "oreo-blueberry-raspberry-china-97g",
        "menge": 1
      },
      {
        "id": "oreo-chocolate-asia-97g",
        "menge": 1
      },
      {
        "id": "lay-s-kartoffelchips-mit-gerostetem-algengeschmack-90g",
        "menge": 1
      },
      {
        "id": "lay-s-chips-octopus-70g",
        "menge": 1
      },
      {
        "id": "mirinda-grape-asia-panda-edition-330ml",
        "menge": 1
      },
      {
        "id": "monster-ultra-sunrise-asia-330ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "dubai-box",
    "name": "Dubai Schoko Box",
    "untertitel": "Pistazie, Kadayif, weiße Schoko – der virale Riegel in allen Sorten",
    "emoji": "🍫",
    "farbe": "gold",
    "inhalt": [
      {
        "id": "elit-dubai-schokolade-90g",
        "menge": 1
      },
      {
        "id": "elit-dubai-riegel-30g",
        "menge": 1
      },
      {
        "id": "elit-the-taste-oder-dubai-mit-haselnusscreme-90g",
        "menge": 1
      },
      {
        "id": "elit-the-taste-oder-dubai-strawberry-90g-deutsch-herkunftsland-turkei",
        "menge": 1
      },
      {
        "id": "elit-the-taste-oder-dubai-mit-weisser-schokolade-30g",
        "menge": 1
      },
      {
        "id": "bergen-obsession-pistachio-white-128g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "freeze-dried-box",
    "name": "Freeze Dried Box",
    "untertitel": "Gefriergetrocknete Candy: knusprig, luftig, TikTok-berühmt",
    "emoji": "❄️",
    "farbe": "blue",
    "inhalt": [
      {
        "id": "frosty-bites-gummy-cola-40g",
        "menge": 1
      },
      {
        "id": "frosty-bites-gummy-berry-50g",
        "menge": 1
      },
      {
        "id": "frosty-bites-gummy-puffs-50g",
        "menge": 1
      },
      {
        "id": "frosty-bites-peach-rings-50g",
        "menge": 1
      },
      {
        "id": "gefriergetrocknete-sussigkeiten-frosty-bites-hamburger-50g",
        "menge": 1
      },
      {
        "id": "frosty-bites-freeze-dried-ice-cream-candy-strawberry-40g",
        "menge": 1
      },
      {
        "id": "frosty-bites-freezed-dried-candy-sour-strips-50g-kopie",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "cookie-box",
    "name": "Cookie Box",
    "untertitel": "Soft Center, Red Velvet, Bubble Gum – Kekse, die es sonst nirgends gibt",
    "emoji": "🍪",
    "farbe": "orange",
    "inhalt": [
      {
        "id": "sable-chocolate-soft-center-cookies-50-g",
        "menge": 1
      },
      {
        "id": "sable-soft-center-matcha-cookies-50-g",
        "menge": 1
      },
      {
        "id": "sable-blueberry-probiotic-soft-center-cookies-50-g",
        "menge": 1
      },
      {
        "id": "sinky-cookies-chocolate-60g",
        "menge": 1
      },
      {
        "id": "sinky-cookies-blueberry-cheesecake",
        "menge": 1
      },
      {
        "id": "bergen-cookies-peanut-butter-128-g",
        "menge": 1
      },
      {
        "id": "bergen-bubble-gum-cookies-128g",
        "menge": 1
      },
      {
        "id": "bergen-obsession-red-velvet-cookies-128g",
        "menge": 1
      },
      {
        "id": "hershey-cookie-cinnamon-20g-1",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "drinks-world-tour",
    "name": "Drinks World Tour",
    "untertitel": "12 Dosen, 12 Länder-Sorten: Jasmine Peach, Pomelo Pepsi, Blackberry Dr Pepper",
    "emoji": "🥤",
    "farbe": "violet",
    "inhalt": [
      {
        "id": "fanta-jasmine-peach-can-330ml",
        "menge": 1
      },
      {
        "id": "fanta-pineapple-can-330ml",
        "menge": 1
      },
      {
        "id": "fanta-grape-330ml",
        "menge": 1
      },
      {
        "id": "fanta-white-peach-300ml",
        "menge": 1
      },
      {
        "id": "coca-cola-sugar-free-lemon-330ml",
        "menge": 1
      },
      {
        "id": "pepsi-white-pomelo-green-bamboo-flavor-330ml",
        "menge": 1
      },
      {
        "id": "dr-pepper-blackberry-355ml",
        "menge": 1
      },
      {
        "id": "7up-tropical-355ml",
        "menge": 1
      },
      {
        "id": "sprite-tea-lemon-tea-flavor-355ml",
        "menge": 1
      },
      {
        "id": "calypso-berry-bloom-zero-sugar-330ml",
        "menge": 1
      },
      {
        "id": "starbucks-peach-oolong-tea-330ml",
        "menge": 1
      },
      {
        "id": "jana-ice-tea-peach-500ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "bubble-tea-box",
    "name": "Bubble Tea Box",
    "untertitel": "Anime-Bubble-Teas, Mochi und Peeling-Candy aus Asien",
    "emoji": "🧋",
    "farbe": "pink",
    "inhalt": [
      {
        "id": "bobbasan-dragon-ball-bubble-tea-pear-melon-320ml",
        "menge": 1
      },
      {
        "id": "bobbasan-one-piece-bubble-tea-strawberry-peach-320ml",
        "menge": 1
      },
      {
        "id": "naruto-bubble-tea-lychee-passion-320ml",
        "menge": 1
      },
      {
        "id": "mochi-creamy-matcha-latte-40g",
        "menge": 1
      },
      {
        "id": "peely-gummy-peach-shaped-fruit-gummies-60-g",
        "menge": 1
      },
      {
        "id": "cokoc-lychee-peeling-soft-candy-75g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "kids-box",
    "name": "Kids Box",
    "untertitel": "Kinder, SpongeBob, Gummibärchen, Squishy – ohne 18+ Artikel",
    "emoji": "🧸",
    "farbe": "gruen",
    "inhalt": [
      {
        "id": "kinder-milkredible-milky-46-8g",
        "menge": 1
      },
      {
        "id": "kinder-creamy-milky-crunchy",
        "menge": 1
      },
      {
        "id": "spongebob-schwammkopf-coated-stick-chocolate-48g",
        "menge": 1
      },
      {
        "id": "spongebob-schwammkopf-coated-stick-strawberry-48g",
        "menge": 1
      },
      {
        "id": "fundiez-gummies-bears-160g",
        "menge": 1
      },
      {
        "id": "fruit-shaped-jelly-sweets-8pcs-280g",
        "menge": 1
      },
      {
        "id": "siglitos-flash-ice-pops",
        "menge": 1
      },
      {
        "id": "yokosan-one-piece-cereales-chocolat-350g",
        "menge": 1
      },
      {
        "id": "light-up-halloween-pumpkin-squishy",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "party-box-xxl",
    "name": "Party Box XXL",
    "untertitel": "Chips, Nüsse, Candy und 6 Drinks – reicht für die ganze Crew",
    "emoji": "🎉",
    "farbe": "rot",
    "inhalt": [
      {
        "id": "6-pringles-bbq-steak-110-g",
        "menge": 1
      },
      {
        "id": "pringles-hot-spicy-110-g",
        "menge": 1
      },
      {
        "id": "crunchy-peanuts-paprika-flavour-100g",
        "menge": 1
      },
      {
        "id": "crunchy-peanuts-sour-cream-onion-flavour-100g",
        "menge": 1
      },
      {
        "id": "boom-peanuts-rainbow-160-g",
        "menge": 1
      },
      {
        "id": "jelly-sticks-sweet-200-g",
        "menge": 1
      },
      {
        "id": "skittles-desserts-152g",
        "menge": 1
      },
      {
        "id": "coca-cola-cherry-330-ml",
        "menge": 2
      },
      {
        "id": "fanta-fruit-twist-330ml",
        "menge": 2
      },
      {
        "id": "mountain-dew-baja-cabo-citrus-355-ml",
        "menge": 2
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "matcha-lover",
    "name": "Matcha Lover",
    "untertitel": "Matcha-Cookies, Matcha-Mochi, Oolong-Popcorn und Tee-Drinks",
    "emoji": "🍵",
    "farbe": "green",
    "inhalt": [
      {
        "id": "sable-soft-center-matcha-cookies-50-g",
        "menge": 1
      },
      {
        "id": "mochi-creamy-matcha-latte-40g",
        "menge": 1
      },
      {
        "id": "lipton-popcorn-pfirsich-oolong-tee-50g",
        "menge": 1
      },
      {
        "id": "starbucks-peach-oolong-tea-330ml",
        "menge": 1
      },
      {
        "id": "arizona-spicy-green-tea-with-mike-s-hot-honey-650-ml",
        "menge": 1
      },
      {
        "id": "pocky-cookie-cream",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "halloween-box",
    "name": "Halloween Box",
    "untertitel": "Dracula-Takis, Kürbis-Squishy, Popping Candy, Gruselgummi",
    "emoji": "🎃",
    "farbe": "orange",
    "inhalt": [
      {
        "id": "light-up-halloween-pumpkin-squishy",
        "menge": 1
      },
      {
        "id": "halloween-water-wiggler-spooky-assorted",
        "menge": 1
      },
      {
        "id": "5d-peelable-gummies-mixed-fruit-halloween-60g",
        "menge": 1
      },
      {
        "id": "takis-dracula-100g",
        "menge": 1
      },
      {
        "id": "dr-sour-popping-candy-blue-raspberry-15g",
        "menge": 1
      },
      {
        "id": "airheads-white-mystery-15-6g",
        "menge": 1
      },
      {
        "id": "tabies-jelly-candy-planets-yummy-space-clusters",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "energy-protein",
    "name": "Protein & Energy",
    "untertitel": "Protein-Kaffee, Energy, Wasser, Kerne – für Gym und lange Tage",
    "emoji": "💪",
    "farbe": "dark",
    "inhalt": [
      {
        "id": "more-nutrition-protein-iced-coffee-caramel-cold-brew-300-g",
        "menge": 1
      },
      {
        "id": "golden-eagle-energy-drink-original-250-ml",
        "menge": 1
      },
      {
        "id": "red-bull-the-green-edition-curuba-elderflower-250-ml",
        "menge": 1
      },
      {
        "id": "erikli-wasser-500-ml",
        "menge": 1
      },
      {
        "id": "seedos-sonnenblumenkerne-original-120g",
        "menge": 1
      },
      {
        "id": "bergen-cookies-peanut-butter-128-g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "zero-sugar-box",
    "name": "Zero Sugar Box",
    "untertitel": "8 Drinks ohne Zucker: Peach Pepsi, Sprite Berry, Pear Ade, Monster Paradise",
    "emoji": "0️⃣",
    "farbe": "dark",
    "inhalt": [
      {
        "id": "coca-cola-zero-sugar-330-ml",
        "menge": 1
      },
      {
        "id": "pepsi-zero-sugar-peach-flavor-355-ml-korea",
        "menge": 1
      },
      {
        "id": "sprite-zero-ice-lemon-berry-330ml",
        "menge": 1
      },
      {
        "id": "calypso-apple-oasis-zero-sugar-330ml-kopie",
        "menge": 1
      },
      {
        "id": "sweet16-korean-pear-ade-zero-sugar-200ml-kopie",
        "menge": 1
      },
      {
        "id": "sweet16-watermelon-ade-zero-sugar-200ml-kopie",
        "menge": 1
      },
      {
        "id": "monster-energy-ultra-paradise-zero-sugar-china",
        "menge": 1
      },
      {
        "id": "coca-cola-fiber-plus-zero-sugar-330ml",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "sammler-box",
    "name": "Sammler Box",
    "untertitel": "Dragon Ball Booster, Pokémon-Karten aus Korea und Anime-Snacks",
    "emoji": "🃏",
    "farbe": "violet",
    "inhalt": [
      {
        "id": "dragon-ball-super-card-game-booster-pack-fusion-world-blazing-aura",
        "menge": 1
      },
      {
        "id": "pokemon-booster-cards-aus-korea",
        "menge": 1
      },
      {
        "id": "ultra-icetea-dragon-ball-330ml",
        "menge": 1
      },
      {
        "id": "chipsan-kartoffelchips-caramelized-onions-dragon-ball-z-110g",
        "menge": 1
      },
      {
        "id": "gumisan-dragon-ball-super-goku-tropical-laces-candies-75g",
        "menge": 1
      },
      {
        "id": "yokosan-dragon-ball-super-cereales-miel-350g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 19,
    "aktiv": true
  },
  {
    "id": "date-night",
    "name": "Date Night",
    "untertitel": "Dubai-Schoko, Red Velvet Cookies, Erdbeer-Fanta – für zwei",
    "emoji": "💕",
    "farbe": "pink",
    "inhalt": [
      {
        "id": "elit-dubai-schokolade-90g",
        "menge": 1
      },
      {
        "id": "bergen-obsession-red-velvet-cookies-128g",
        "menge": 1
      },
      {
        "id": "tonys-whole-strawberry-cocoa-flavour-60g",
        "menge": 1
      },
      {
        "id": "fanta-strawberry-335ml",
        "menge": 1
      },
      {
        "id": "mochi-mini-tiramisu-creme-40g",
        "menge": 1
      },
      {
        "id": "cokoc-peeling-soft-candy-strawberry-75g",
        "menge": 1
      },
      {
        "id": "oreo-weisser-pfirsich",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "buero-box",
    "name": "Büro Box",
    "untertitel": "Croissants, Eistee, Wasser, Kerne – die Schublade für die Woche",
    "emoji": "🏢",
    "farbe": "gold",
    "inhalt": [
      {
        "id": "amigo-ice-tea-peach-200-ml",
        "menge": 2
      },
      {
        "id": "seedos-sonnenblumenkerne-extra-salt-120g",
        "menge": 1
      },
      {
        "id": "boom-meltiez-caramel-160-g",
        "menge": 1
      },
      {
        "id": "agiberia-croissant-kakao-60-g",
        "menge": 2
      },
      {
        "id": "agiberia-croissant-pistazie-60-g",
        "menge": 1
      },
      {
        "id": "erikli-wasser-500-ml",
        "menge": 2
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "ramen-night",
    "name": "Ramen Night",
    "untertitel": "4× Buldak, Korea-Chips und 2 Melon Fantas – Feuer frei",
    "emoji": "🍜",
    "farbe": "orange",
    "inhalt": [
      {
        "id": "samyang-buldak-carbonara",
        "menge": 1
      },
      {
        "id": "samyang-buldak-hot-chicken-rose",
        "menge": 1
      },
      {
        "id": "samyang-buldak-quatro-cheese-bag-145g",
        "menge": 1
      },
      {
        "id": "samyang-buldak-swicy-sweet-spicy-5-130-g",
        "menge": 1
      },
      {
        "id": "lays-maxx-ridged-koreanisch-wurziger-huhnernudeln-geschmack-70g",
        "menge": 1
      },
      {
        "id": "fanta-melon-350-ml-korea",
        "menge": 2
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "sour-box",
    "name": "Sauer Box",
    "untertitel": "Sour Belts, Popping Candy, Crazy Sours, Sour Jelly – Gesicht garantiert",
    "emoji": "🍋",
    "farbe": "gruen",
    "inhalt": [
      {
        "id": "avesta-sour-candy-belt-berry-70g",
        "menge": 1
      },
      {
        "id": "avesta-sour-candy-belt-fruit-70g",
        "menge": 1
      },
      {
        "id": "dr-sour-popping-candy-watermelon-15g",
        "menge": 1
      },
      {
        "id": "skittles-crazy-sours-sweet",
        "menge": 1
      },
      {
        "id": "jelly-sticks-sour-200-g",
        "menge": 1
      },
      {
        "id": "dately-candy-dates-sour-cola-100g-kopie",
        "menge": 1
      },
      {
        "id": "fruit-shaped-jelly-sour-8pcs-280g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  },
  {
    "id": "chips-box",
    "name": "Chips Box International",
    "untertitel": "Pringles Crab, Naruto-Pizza-Chips, Octopus Lay's – 8 Sorten, die du nicht kennst",
    "emoji": "🥔",
    "farbe": "orange",
    "inhalt": [
      {
        "id": "pringles-super-hot-chili-lemon-crab-110-g",
        "menge": 1
      },
      {
        "id": "pringles-french-style-chicken-twister-with-morel-flavor-80-g",
        "menge": 1
      },
      {
        "id": "chipsan-kartoffelchips-pizza-flavor-naruto-110g",
        "menge": 1
      },
      {
        "id": "chipsan-kartoffelchips-bbq-arcane-jinx-vi-ultra-pop-110g",
        "menge": 1
      },
      {
        "id": "lay-s-kartoffelchips-mit-senf-avocado-geschmack-90g",
        "menge": 1
      },
      {
        "id": "lay-s-chips-octopus-70g",
        "menge": 1
      },
      {
        "id": "chips-komesan-brown-rice-cheese-naruto",
        "menge": 1
      },
      {
        "id": "ultra-pop-chips-chicken-lemon-one-piece-luffy-vs-lucci-110g",
        "menge": 1
      }
    ],
    "preis": null,
    "mwst": 7,
    "aktiv": true
  }
];
