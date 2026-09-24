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
  }
];
