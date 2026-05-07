export interface CocktailIngredient {
  id: string;
  parts: number;
}

export interface Cocktail {
  id: string;
  name: string;
  /** Hex colour for the glass fill. */
  color: string;
  /** Two short flavour clues shown to the player. */
  clues: [string, string];
  ingredients: CocktailIngredient[];
}

// ─── Ingredient catalogue (30 items) ────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  shortName: string;
  hex: string;
  colorClass: string;
}

export const INGREDIENTS: Ingredient[] = [
  { id: "whiskey",        name: "Whiskey",         shortName: "Whiskey",    hex: "#c8904a", colorClass: "text-amber-300"  },
  { id: "gin",            name: "Gin",             shortName: "Gin",        hex: "#cce8f8", colorClass: "text-sky-200"    },
  { id: "vodka",          name: "Vodka",           shortName: "Vodka",      hex: "#e8f4fc", colorClass: "text-zinc-300"   },
  { id: "rum",            name: "White Rum",        shortName: "Rum",        hex: "#d8ecf8", colorClass: "text-cyan-200"   },
  { id: "dark_rum",       name: "Dark Rum",         shortName: "Dark Rum",   hex: "#3a1808", colorClass: "text-amber-700"  },
  { id: "tequila",        name: "Tequila",          shortName: "Tequila",    hex: "#d4e8c0", colorClass: "text-lime-300"   },
  { id: "triple_sec",     name: "Triple Sec",       shortName: "Triple Sec", hex: "#f0c060", colorClass: "text-orange-300" },
  { id: "lime",           name: "Lime Juice",       shortName: "Lime",       hex: "#88c828", colorClass: "text-lime-400"   },
  { id: "lemon",          name: "Lemon Juice",      shortName: "Lemon",      hex: "#e8e020", colorClass: "text-yellow-300" },
  { id: "simple_syrup",   name: "Simple Syrup",     shortName: "Syrup",      hex: "#f8f0c0", colorClass: "text-yellow-100" },
  { id: "bitters",        name: "Bitters",          shortName: "Bitters",    hex: "#5d2e1f", colorClass: "text-red-800"    },
  { id: "sweet_vermouth", name: "Sweet Vermouth",   shortName: "Sw.Vermouth",hex: "#8b3820", colorClass: "text-red-400"    },
  { id: "dry_vermouth",   name: "Dry Vermouth",     shortName: "Dry Vermouth",hex:"#d8ecd0", colorClass: "text-green-200"  },
  { id: "campari",        name: "Campari",          shortName: "Campari",    hex: "#c43355", colorClass: "text-rose-400"   },
  { id: "kahlua",         name: "Kahlúa",           shortName: "Kahlúa",     hex: "#1a0808", colorClass: "text-stone-400"  },
  { id: "coconut_cream",  name: "Coconut Cream",    shortName: "Coconut",    hex: "#f0e8d8", colorClass: "text-stone-200"  },
  { id: "pineapple",      name: "Pineapple Juice",  shortName: "Pineapple",  hex: "#f0d830", colorClass: "text-yellow-400" },
  { id: "cranberry",      name: "Cranberry Juice",  shortName: "Cranberry",  hex: "#9b1c3c", colorClass: "text-red-500"    },
  { id: "oj",             name: "Orange Juice",     shortName: "OJ",         hex: "#f08830", colorClass: "text-orange-400" },
  { id: "soda",           name: "Soda Water",       shortName: "Soda",       hex: "#dceef8", colorClass: "text-blue-100"   },
  { id: "tonic",          name: "Tonic Water",      shortName: "Tonic",      hex: "#d8e8f0", colorClass: "text-blue-200"   },
  { id: "ginger_beer",    name: "Ginger Beer",      shortName: "Ginger Beer",hex: "#d8b848", colorClass: "text-yellow-500" },
  { id: "cream",          name: "Heavy Cream",      shortName: "Cream",      hex: "#f8f0e0", colorClass: "text-stone-100"  },
  { id: "grenadine",      name: "Grenadine",        shortName: "Grenadine",  hex: "#c82028", colorClass: "text-red-400"    },
  { id: "blue_curacao",   name: "Blue Curaçao",     shortName: "Blue Cur.",  hex: "#2878d8", colorClass: "text-blue-400"   },
  { id: "peach_schnapps", name: "Peach Schnapps",   shortName: "Peach Sch.", hex: "#f0a060", colorClass: "text-orange-300" },
  { id: "amaretto",       name: "Amaretto",         shortName: "Amaretto",   hex: "#b06020", colorClass: "text-amber-600"  },
  { id: "baileys",        name: "Baileys",          shortName: "Baileys",    hex: "#c09060", colorClass: "text-stone-400"  },
  { id: "elderflower",    name: "Elderflower",      shortName: "Elderflower",hex: "#e0f0c8", colorClass: "text-green-200"  },
  { id: "absinthe",       name: "Absinthe",         shortName: "Absinthe",   hex: "#486820", colorClass: "text-green-600"  },
];

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}

// ─── Cocktail database (95 drinks) ──────────────────────────────────────────

export const COCKTAILS: Cocktail[] = [
  // Whiskey (20)
  { id:"old_fashioned",        name:"Old Fashioned",          color:"#b07a2b", clues:["Whiskey-forward classic","Finished with bitters"],                   ingredients:[{id:"whiskey",parts:2},{id:"bitters",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"manhattan",            name:"Manhattan",              color:"#8b3820", clues:["Stirred, spirit-forward","Rye and vermouth classic"],                 ingredients:[{id:"whiskey",parts:2},{id:"sweet_vermouth",parts:1},{id:"bitters",parts:1}] },
  { id:"whiskey_sour",         name:"Whiskey Sour",           color:"#c8c040", clues:["Tart and caramel","Citrus meets oak"],                                ingredients:[{id:"whiskey",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"whiskey_highball",     name:"Whiskey Highball",       color:"#c0a870", clues:["Long and bubbly","Just two ingredients"],                             ingredients:[{id:"whiskey",parts:2},{id:"soda",parts:3}] },
  { id:"boulevardier",         name:"Boulevardier",           color:"#b02840", clues:["Bitter and boozy","Whiskey Negroni cousin"],                          ingredients:[{id:"whiskey",parts:2},{id:"campari",parts:1},{id:"sweet_vermouth",parts:1}] },
  { id:"toronto",              name:"Toronto",                color:"#9a5020", clues:["Deep and bitter","Complex stirred sip"],                              ingredients:[{id:"whiskey",parts:2},{id:"amaretto",parts:1},{id:"bitters",parts:1}] },
  { id:"new_york_sour",        name:"New York Sour",          color:"#c84060", clues:["Red float on top","Fruity meets smoky"],                              ingredients:[{id:"whiskey",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"grenadine",parts:1}] },
  { id:"penicillin",           name:"Penicillin",             color:"#c8b840", clues:["Smoky and ginger-spiced","Scotch-based modern classic"],              ingredients:[{id:"whiskey",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"ginger_beer",parts:2}] },
  { id:"rob_roy",              name:"Rob Roy",                color:"#703020", clues:["The Scottish Manhattan","Stirred to perfection"],                     ingredients:[{id:"whiskey",parts:2},{id:"sweet_vermouth",parts:1},{id:"bitters",parts:1}] },
  { id:"mint_julep",           name:"Mint Julep",             color:"#a0b870", clues:["Crushed ice essential","Kentucky Derby staple"],                      ingredients:[{id:"whiskey",parts:3},{id:"simple_syrup",parts:1},{id:"lime",parts:1}] },
  { id:"rusty_nail",           name:"Rusty Nail",             color:"#b06820", clues:["Two ingredients only","Honey and smoke"],                             ingredients:[{id:"whiskey",parts:2},{id:"amaretto",parts:1}] },
  { id:"godfather",            name:"Godfather",              color:"#c07030", clues:["An offer you can't refuse","Mellow and nutty"],                       ingredients:[{id:"whiskey",parts:2},{id:"amaretto",parts:1}] },
  { id:"irish_coffee",         name:"Irish Coffee",           color:"#1a0808", clues:["A hot classic","Coffee, cream and whiskey"],                          ingredients:[{id:"whiskey",parts:2},{id:"cream",parts:2},{id:"simple_syrup",parts:1}] },
  { id:"vieux_carre",          name:"Vieux Carré",            color:"#8a5040", clues:["New Orleans four-spirit mix","Complex and aromatic"],                 ingredients:[{id:"whiskey",parts:1},{id:"sweet_vermouth",parts:1},{id:"bitters",parts:1},{id:"elderflower",parts:1}] },
  { id:"black_manhattan",      name:"Black Manhattan",        color:"#1a0808", clues:["Coffee-forward dark twist","Darker than the original"],               ingredients:[{id:"whiskey",parts:2},{id:"sweet_vermouth",parts:1},{id:"kahlua",parts:1}] },
  { id:"horses_neck",          name:"Horse's Neck",           color:"#c8a858", clues:["Long and spiced","Ginger and bitters swirl"],                         ingredients:[{id:"whiskey",parts:2},{id:"ginger_beer",parts:3},{id:"bitters",parts:1}] },
  { id:"sazerac",              name:"Sazerac",                color:"#b07828", clues:["Glass rinsed with anise","New Orleans original"],                     ingredients:[{id:"whiskey",parts:2},{id:"bitters",parts:1},{id:"simple_syrup",parts:1},{id:"absinthe",parts:1}] },
  { id:"paper_plane",          name:"Paper Plane",            color:"#e89820", clues:["Equal-parts four-way","Bitter and citrus symmetry"],                  ingredients:[{id:"whiskey",parts:1},{id:"amaretto",parts:1},{id:"triple_sec",parts:1},{id:"lemon",parts:1}] },
  { id:"blood_and_sand",       name:"Blood & Sand",           color:"#c05030", clues:["Named after a bullfighting film","Four equal parts, one is OJ"],      ingredients:[{id:"whiskey",parts:1},{id:"sweet_vermouth",parts:1},{id:"triple_sec",parts:1},{id:"oj",parts:1}] },
  { id:"trinidad_sour",        name:"Trinidad Sour",          color:"#8b2820", clues:["Bitters as the base spirit","Unusually bold and aromatic"],            ingredients:[{id:"whiskey",parts:1},{id:"bitters",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },

  // Gin (21)
  { id:"gin_tonic",            name:"Gin & Tonic",            color:"#c8dce8", clues:["Two-ingredient long drink","Botanical and bitter"],                   ingredients:[{id:"gin",parts:2},{id:"tonic",parts:3}] },
  { id:"martini",              name:"Dry Martini",            color:"#cce8f8", clues:["Bone dry and elegant","Served in a V-glass"],                         ingredients:[{id:"gin",parts:3},{id:"dry_vermouth",parts:1}] },
  { id:"negroni",              name:"Negroni",                color:"#c43355", clues:["Ruby red and bittersweet","Equal thirds, Italian spirit"],             ingredients:[{id:"gin",parts:1},{id:"campari",parts:1},{id:"sweet_vermouth",parts:1}] },
  { id:"gimlet",               name:"Gimlet",                 color:"#a0c848", clues:["Sharp and citrusy","Green and punchy"],                               ingredients:[{id:"gin",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"tom_collins",          name:"Tom Collins",            color:"#c8d878", clues:["Gin sour topped with bubbles","Classic summer long"],                 ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"soda",parts:2}] },
  { id:"last_word",            name:"Last Word",              color:"#90c040", clues:["Equal parts herbal","Prohibition-era classic"],                       ingredients:[{id:"gin",parts:1},{id:"lime",parts:1},{id:"triple_sec",parts:1},{id:"elderflower",parts:1}] },
  { id:"clover_club",          name:"Clover Club",            color:"#e880a8", clues:["Pink and frothy","Victorian-era gin sour"],                            ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"grenadine",parts:1}] },
  { id:"bees_knees",           name:"Bee's Knees",            color:"#e8d858", clues:["Honey-sweetened gin sour","Prohibition workaround"],                  ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"french_75",            name:"French 75",              color:"#d8e898", clues:["Bubbly and celebratory","Named after artillery"],                     ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"soda",parts:1}] },
  { id:"southside",            name:"Southside",              color:"#98c040", clues:["Minty and crisp","Chicago speakeasy roots"],                          ingredients:[{id:"gin",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"aviation",             name:"Aviation",               color:"#a888c8", clues:["Violet-hued and floral","Takes flight with citrus"],                  ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"elderflower",parts:1},{id:"grenadine",parts:1}] },
  { id:"singapore_sling",      name:"Singapore Sling",        color:"#e87890", clues:["Tropical and fruity pink","Long and complex"],                        ingredients:[{id:"gin",parts:2},{id:"triple_sec",parts:1},{id:"grenadine",parts:1},{id:"pineapple",parts:2}] },
  { id:"white_lady",           name:"White Lady",             color:"#e8e0d0", clues:["Pale and elegant","Three-ingredient gin sour"],                       ingredients:[{id:"gin",parts:2},{id:"triple_sec",parts:1},{id:"lemon",parts:1}] },
  { id:"hanky_panky",          name:"Hanky Panky",            color:"#a04868", clues:["Created by Ada Coleman","Herbal and aromatic"],                       ingredients:[{id:"gin",parts:2},{id:"sweet_vermouth",parts:1},{id:"elderflower",parts:1}] },
  { id:"corpse_reviver",       name:"Corpse Reviver #2",      color:"#d8e8a8", clues:["Equal parts, anise rinse","Wake-up cocktail"],                        ingredients:[{id:"gin",parts:1},{id:"triple_sec",parts:1},{id:"lemon",parts:1},{id:"elderflower",parts:1}] },
  { id:"bramble",              name:"Bramble",                color:"#984098", clues:["Crushed ice and berry drizzle","Created by Dick Bradsell"],            ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"elderflower",parts:1}] },
  { id:"pink_gin",             name:"Pink Gin",               color:"#e8a0a0", clues:["Pink and botanical","Bitters give the blush"],                        ingredients:[{id:"gin",parts:2},{id:"bitters",parts:2},{id:"tonic",parts:2}] },
  { id:"vesper",               name:"Vesper Martini",         color:"#c8dce0", clues:["James Bond's original order","Shaken, not stirred"],                  ingredients:[{id:"gin",parts:2},{id:"vodka",parts:1},{id:"dry_vermouth",parts:1}] },
  { id:"jasmine",              name:"Jasmine",                color:"#e89830", clues:["Bitter orange and floral","Cosmopolitan's gin cousin"],               ingredients:[{id:"gin",parts:2},{id:"campari",parts:1},{id:"triple_sec",parts:1},{id:"lemon",parts:1}] },
  { id:"clover_leaf",          name:"Clover Leaf",            color:"#e890b0", clues:["Like a Clover Club but drier","Delicate and pink"],                   ingredients:[{id:"gin",parts:2},{id:"lemon",parts:1},{id:"grenadine",parts:1},{id:"dry_vermouth",parts:1}] },
  { id:"sloe_gin_fizz",        name:"Sloe Gin Fizz",          color:"#c83858", clues:["Berry-pink and bubbly","Old English garden vibes"],                   ingredients:[{id:"gin",parts:2},{id:"grenadine",parts:1},{id:"lemon",parts:1},{id:"soda",parts:2}] },

  // Vodka (15)
  { id:"cosmopolitan",         name:"Cosmopolitan",           color:"#e87090", clues:["Sex and the City staple","Pink and citrusy"],                         ingredients:[{id:"vodka",parts:2},{id:"triple_sec",parts:1},{id:"lime",parts:1},{id:"cranberry",parts:1}] },
  { id:"moscow_mule",          name:"Moscow Mule",            color:"#c0c870", clues:["Served in a copper mug","Ginger spice and lime"],                     ingredients:[{id:"vodka",parts:2},{id:"lime",parts:1},{id:"ginger_beer",parts:3}] },
  { id:"screwdriver",          name:"Screwdriver",            color:"#f09840", clues:["Two ingredients only","Orange and booze"],                            ingredients:[{id:"vodka",parts:2},{id:"oj",parts:3}] },
  { id:"vodka_martini",        name:"Vodka Martini",          color:"#d8ecf8", clues:["Crystal clear and cold","Aggressively clean"],                        ingredients:[{id:"vodka",parts:3},{id:"dry_vermouth",parts:1}] },
  { id:"sea_breeze",           name:"Sea Breeze",             color:"#d84868", clues:["Cranberry meets tropical","Light and refreshing"],                    ingredients:[{id:"vodka",parts:2},{id:"cranberry",parts:2},{id:"pineapple",parts:1}] },
  { id:"cape_cod",             name:"Cape Cod",               color:"#c03850", clues:["Simple and crimson","Named after a Massachusetts cape"],              ingredients:[{id:"vodka",parts:2},{id:"cranberry",parts:3}] },
  { id:"kamikaze",             name:"Kamikaze",               color:"#d0e868", clues:["Sour and sharp","Citrus triple-threat"],                              ingredients:[{id:"vodka",parts:2},{id:"triple_sec",parts:1},{id:"lime",parts:1}] },
  { id:"espresso_martini",     name:"Espresso Martini",       color:"#180808", clues:["Coffee and vodka","Dark and energising"],                             ingredients:[{id:"vodka",parts:2},{id:"kahlua",parts:1},{id:"cream",parts:1}] },
  { id:"white_russian",        name:"White Russian",          color:"#b09870", clues:["Creamy coffee cocktail","The Dude abides"],                           ingredients:[{id:"vodka",parts:2},{id:"kahlua",parts:1},{id:"cream",parts:2}] },
  { id:"black_russian",        name:"Black Russian",          color:"#200808", clues:["Dark and simple","Coffee and spirit, nothing more"],                  ingredients:[{id:"vodka",parts:2},{id:"kahlua",parts:1}] },
  { id:"woo_woo",              name:"Woo Woo",                color:"#d84068", clues:["Peachy and cranberry-pink","Fruity and fun"],                         ingredients:[{id:"vodka",parts:2},{id:"peach_schnapps",parts:1},{id:"cranberry",parts:2}] },
  { id:"fuzzy_navel",          name:"Fuzzy Navel",            color:"#e89040", clues:["Peachy and citrusy","A brunch favourite"],                            ingredients:[{id:"vodka",parts:2},{id:"oj",parts:3},{id:"peach_schnapps",parts:1}] },
  { id:"porn_star_martini",    name:"Porn Star Martini",      color:"#e8e0a0", clues:["Passion fruit and vanilla","Served with a champagne shot"],           ingredients:[{id:"vodka",parts:2},{id:"elderflower",parts:1},{id:"pineapple",parts:1},{id:"triple_sec",parts:1}] },
  { id:"sex_on_the_beach",     name:"Sex on the Beach",       color:"#e87040", clues:["Fruity and tropical","Classic spring break order"],                   ingredients:[{id:"vodka",parts:2},{id:"peach_schnapps",parts:1},{id:"oj",parts:2},{id:"cranberry",parts:1}] },
  { id:"lemon_drop",           name:"Lemon Drop",             color:"#e8e850", clues:["Bright and sweet-sour","Sugar-rimmed glass"],                         ingredients:[{id:"vodka",parts:2},{id:"triple_sec",parts:1},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },

  // Rum (14)
  { id:"daiquiri",             name:"Daiquiri",               color:"#d8e8a8", clues:["Cuban classic three-way","Crisp lime simplicity"],                    ingredients:[{id:"rum",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"mojito",               name:"Mojito",                 color:"#80c858", clues:["Minty and effervescent","Built in the glass"],                        ingredients:[{id:"rum",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1},{id:"soda",parts:2}] },
  { id:"pina_colada",          name:"Piña Colada",            color:"#f0e8c8", clues:["Creamy and tropical","Pineapple and coconut"],                        ingredients:[{id:"rum",parts:2},{id:"coconut_cream",parts:2},{id:"pineapple",parts:2}] },
  { id:"dark_and_stormy",      name:"Dark & Stormy",          color:"#402808", clues:["Dark rum over ginger","Named after stormy seas"],                     ingredients:[{id:"dark_rum",parts:2},{id:"ginger_beer",parts:3}] },
  { id:"mai_tai",              name:"Mai Tai",                color:"#e89840", clues:["Tiki icon with two rums","Citrus and orchard fruit"],                 ingredients:[{id:"rum",parts:1},{id:"dark_rum",parts:1},{id:"triple_sec",parts:1},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"zombie",               name:"Zombie",                 color:"#c84038", clues:["Three-spirit tiki beast","Said to turn you into one"],                ingredients:[{id:"rum",parts:2},{id:"dark_rum",parts:1},{id:"triple_sec",parts:1},{id:"lime",parts:1},{id:"grenadine",parts:1}] },
  { id:"painkiller",           name:"Painkiller",             color:"#f0d898", clues:["Coconut and pineapple base","Virgin Islands original"],               ingredients:[{id:"rum",parts:2},{id:"coconut_cream",parts:1},{id:"pineapple",parts:2},{id:"oj",parts:1}] },
  { id:"hurricane",            name:"Hurricane",              color:"#c85038", clues:["Pat O'Brien's New Orleans special","Fruity and potent"],              ingredients:[{id:"rum",parts:1},{id:"dark_rum",parts:1},{id:"pineapple",parts:1},{id:"lime",parts:1},{id:"grenadine",parts:1}] },
  { id:"jungle_bird",          name:"Jungle Bird",            color:"#c84840", clues:["Campari in a tiki drink","Bitter meets tropical"],                    ingredients:[{id:"rum",parts:1},{id:"campari",parts:1},{id:"pineapple",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"hemingway_daiquiri",   name:"Hemingway Daiquiri",     color:"#a8d858", clues:["Drier than a standard Daiquiri","Papa Hemingway's own"],              ingredients:[{id:"rum",parts:2},{id:"lime",parts:1},{id:"elderflower",parts:1},{id:"pineapple",parts:1}] },
  { id:"rum_punch",            name:"Rum Punch",              color:"#e87848", clues:["One sour, two sweet rule","Caribbean party classic"],                 ingredients:[{id:"rum",parts:2},{id:"pineapple",parts:1},{id:"oj",parts:1},{id:"grenadine",parts:1}] },
  { id:"blue_hawaiian",        name:"Blue Hawaiian",          color:"#5898e0", clues:["Bright electric blue","Tropical and coconut-sweet"],                  ingredients:[{id:"rum",parts:1},{id:"blue_curacao",parts:1},{id:"coconut_cream",parts:1},{id:"pineapple",parts:2}] },
  { id:"cuba_libre",           name:"Cuba Libre",             color:"#b07840", clues:["Lime and cola-style","The free Cuba"],                               ingredients:[{id:"rum",parts:2},{id:"lime",parts:1},{id:"soda",parts:3}] },
  { id:"tiki_bowl",            name:"Tiki Bowl",              color:"#e87838", clues:["Shared party punch","Two rums and coconut"],                          ingredients:[{id:"rum",parts:2},{id:"dark_rum",parts:1},{id:"pineapple",parts:2},{id:"coconut_cream",parts:1},{id:"grenadine",parts:1}] },

  // Tequila (11)
  { id:"margarita",            name:"Margarita",              color:"#c0d860", clues:["Salt rim, three ingredients","World's most-ordered cocktail"],        ingredients:[{id:"tequila",parts:2},{id:"triple_sec",parts:1},{id:"lime",parts:1}] },
  { id:"tequila_sunrise",      name:"Tequila Sunrise",        color:"#e87830", clues:["Gradient of sunset in a glass","Grenadine sinks to the bottom"],     ingredients:[{id:"tequila",parts:2},{id:"oj",parts:3},{id:"grenadine",parts:1}] },
  { id:"paloma",               name:"Paloma",                 color:"#f8d060", clues:["Mexico's favourite cocktail","Grapefruit-forward and fizzy"],         ingredients:[{id:"tequila",parts:2},{id:"lime",parts:1},{id:"oj",parts:2},{id:"soda",parts:1}] },
  { id:"mexican_mule",         name:"Mexican Mule",           color:"#b8d058", clues:["Moscow Mule swapped for tequila","Ginger kick and citrus"],          ingredients:[{id:"tequila",parts:2},{id:"lime",parts:1},{id:"ginger_beer",parts:3}] },
  { id:"tommys_margarita",     name:"Tommy's Margarita",      color:"#b8d840", clues:["Cleaner than a classic Margarita","No triple sec here"],              ingredients:[{id:"tequila",parts:2},{id:"lime",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"oaxacan_old_fashioned",name:"Oaxacan Old Fashioned",  color:"#a07828", clues:["Smoky mezcal twist on a classic","Bitters and spirit"],               ingredients:[{id:"tequila",parts:2},{id:"bitters",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"ranch_water",          name:"Ranch Water",            color:"#c0d878", clues:["West Texas simplicity","Tequila and bubbles"],                        ingredients:[{id:"tequila",parts:2},{id:"lime",parts:1},{id:"soda",parts:3}] },
  { id:"brave_bull",           name:"Brave Bull",             color:"#280808", clues:["Two ingredients, coffee finish","Tequila and Kahlúa"],                ingredients:[{id:"tequila",parts:2},{id:"kahlua",parts:1}] },
  { id:"el_diablo",            name:"El Diablo",              color:"#c84040", clues:["Red and spicy","Devil's trio with ginger"],                           ingredients:[{id:"tequila",parts:2},{id:"lime",parts:1},{id:"ginger_beer",parts:2},{id:"grenadine",parts:1}] },
  { id:"matador",              name:"Matador",                color:"#d8d050", clues:["Tequila in tropical territory","Pineapple and citrus"],               ingredients:[{id:"tequila",parts:2},{id:"pineapple",parts:2},{id:"lime",parts:1}] },
  { id:"naked_and_famous",     name:"Naked & Famous",         color:"#e8c830", clues:["Equal-parts modern paper plane","Floral and citrus"],                 ingredients:[{id:"tequila",parts:1},{id:"triple_sec",parts:1},{id:"elderflower",parts:1},{id:"lemon",parts:1}] },

  // Mixed / other (14)
  { id:"aperol_spritz",        name:"Aperol Spritz",          color:"#f09040", clues:["Orange and bubbly","Italian aperitivo hour"],                         ingredients:[{id:"triple_sec",parts:1},{id:"oj",parts:1},{id:"soda",parts:3}] },
  { id:"campari_sour",         name:"Campari Sour",           color:"#c84050", clues:["Bitter orange and tart","The aperitivo sour"],                        ingredients:[{id:"campari",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"amaretto_sour",        name:"Amaretto Sour",          color:"#c87030", clues:["Nutty and tart","Almond and citrus"],                                 ingredients:[{id:"amaretto",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"midori_sour",          name:"Midori Sour",            color:"#80c040", clues:["Bright green and sweet-sour","Melon-scented"],                        ingredients:[{id:"peach_schnapps",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"bellini",              name:"Bellini",                color:"#f0b8a0", clues:["Peach and sparkling wine","Venetian brunchtime"],                     ingredients:[{id:"triple_sec",parts:1},{id:"peach_schnapps",parts:1},{id:"soda",parts:2}] },
  { id:"kir_royale",           name:"Kir Royale",             color:"#8040b0", clues:["Purple-hued aperitif","Cassis and champagne"],                        ingredients:[{id:"elderflower",parts:1},{id:"soda",parts:3}] },
  { id:"grasshopper",          name:"Grasshopper",            color:"#284808", clues:["Creamy and green","Mint and chocolate layers"],                       ingredients:[{id:"baileys",parts:1},{id:"kahlua",parts:1},{id:"cream",parts:2}] },
  { id:"americano",            name:"Americano",              color:"#c04860", clues:["The Negroni's lighter sibling","Campari and vermouth with soda"],      ingredients:[{id:"campari",parts:1},{id:"sweet_vermouth",parts:1},{id:"soda",parts:2}] },
  { id:"death_flip",           name:"Death Flip",             color:"#d8a840", clues:["Notoriously complex flip","Three spirits and sweetener"],              ingredients:[{id:"tequila",parts:1},{id:"elderflower",parts:1},{id:"baileys",parts:1},{id:"simple_syrup",parts:1}] },
  { id:"jungle_juice",         name:"Jungle Juice",           color:"#e89038", clues:["Party-bowl classic","Vodka, rum and juice"],                          ingredients:[{id:"vodka",parts:1},{id:"rum",parts:1},{id:"triple_sec",parts:1},{id:"oj",parts:2},{id:"pineapple",parts:1}] },
  { id:"corpse_reviver_1",     name:"Corpse Reviver #1",      color:"#903a28", clues:["The darker original revival","All spirits, no juice"],                ingredients:[{id:"whiskey",parts:1},{id:"sweet_vermouth",parts:1},{id:"bitters",parts:1},{id:"elderflower",parts:1}] },
  { id:"pisco_sour",           name:"Pisco Sour",             color:"#e8d8a0", clues:["Peruvian original with foam","Egg-white froth on top"],               ingredients:[{id:"vodka",parts:2},{id:"lemon",parts:1},{id:"simple_syrup",parts:1},{id:"grenadine",parts:1}] },
  { id:"stinger",              name:"Stinger",                color:"#c0d8a0", clues:["Minty finish, crisp and herbal","Two clean ingredients"],              ingredients:[{id:"vodka",parts:2},{id:"elderflower",parts:1}] },
  { id:"grasshopper_frozen",   name:"Frozen Grasshopper",     color:"#488028", clues:["Blended and icy minty green","Dessert in a glass"],                   ingredients:[{id:"baileys",parts:2},{id:"kahlua",parts:1},{id:"cream",parts:2},{id:"simple_syrup",parts:1}] },
];

export function getCocktail(id: string): Cocktail | undefined {
  return COCKTAILS.find((c) => c.id === id);
}

/** Blend ingredient hex colours proportionally into a glass colour. */
export function blendColor(ingredients: CocktailIngredient[]): string {
  if (ingredients.length === 0) return "#888888";
  let r = 0, g = 0, b = 0, total = 0;
  for (const ci of ingredients) {
    const ing = getIngredient(ci.id);
    if (!ing) continue;
    const h = ing.hex.replace("#", "");
    r += parseInt(h.slice(0, 2), 16) * ci.parts;
    g += parseInt(h.slice(2, 4), 16) * ci.parts;
    b += parseInt(h.slice(4, 6), 16) * ci.parts;
    total += ci.parts;
  }
  if (total === 0) return "#888888";
  const hex = (n: number) => Math.round(n / total).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
