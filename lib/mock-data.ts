// lib/mock-data.ts
// Static app configuration: category taxonomy, delivery locations, and the
// product-image fallback map. Business data (products, sellers, orders,
// reviews) lives in Supabase — see supabase/schema.sql and lib/supabase/types.ts.

// Neighborhood-level mama mboga service areas across East Africa.
export const LOCATIONS = [
  "Kasarani, Nairobi",
  "Roysambu, Nairobi",
  "Zimmerman, Nairobi",
  "Mwiki, Nairobi",
  "Kilimani, Nairobi",
  "Westlands, Nairobi",
  "Embakasi, Nairobi",
  "Nyali, Mombasa",
  "Milimani, Kisumu",
  "Ntinda, Kampala",
  "Bugolobi, Kampala",
  "Mikocheni, Dar es Salaam",
  "Masaki, Dar es Salaam",
  "Kimihurura, Kigali",
  "Remera, Kigali",
];

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  items: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  priority: "Very High" | "High" | "Medium" | "Later";
  description: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "cat-veg",
    name: "Vegetables",
    slug: "vegetables",
    icon: "salad",
    color: "#dcfce7",
    priority: "Very High",
    description: "Fresh leafy greens, salad vegetables, tomatoes, and traditional Kenyan mboga sourced daily.",
    subcategories: [
      {
        id: "sub-leafy",
        name: "Leafy Vegetables",
        slug: "leafy-vegetables",
        items: ["Sukuma wiki", "Spinach", "Managu", "Terere", "Mchicha", "Kunde", "Cabbage", "Lettuce"],
      },
      {
        id: "sub-tomatoes",
        name: "Tomatoes & Peppers",
        slug: "tomatoes-peppers",
        items: ["Tomatoes", "Hoho (Green pepper)", "Chillies"],
      },
      {
        id: "sub-onions",
        name: "Onions & Herbs",
        slug: "onions-herbs",
        items: ["Red Onions", "Spring onions", "Dhania", "Celery", "Leeks", "Garlic", "Ginger"],
      },
      {
        id: "sub-salad",
        name: "Gourd & Pod Vegetables",
        slug: "gourd-pod",
        items: ["Broccoli", "Cauliflower", "Pumpkin", "Cucumber", "Green beans", "Peas", "Eggplant / Brinjal", "Zucchini", "Carrots"],
      },
    ],
  },
  {
    id: "cat-fruits",
    name: "Fruits",
    slug: "fruits",
    icon: "apple",
    color: "#fee2e2",
    priority: "Very High",
    description: "Sun-ripened sweet tropical and seasonal orchard fruits.",
    subcategories: [
      {
        id: "sub-everyday-fruits",
        name: "Everyday Fruits",
        slug: "everyday-fruits",
        items: ["Bananas", "Apples", "Oranges", "Mangoes", "Avocados"],
      },
      {
        id: "sub-tropical",
        name: "Tropical & Melons",
        slug: "tropical-melons",
        items: ["Watermelon", "Pineapple", "Pawpaw", "Passion fruit", "Guavas", "Lemons", "Tree tomatoes", "Grapes", "Pears", "Strawberries", "Melons"],
      },
    ],
  },
  {
    id: "cat-roots",
    name: "Potatoes, Roots & Tubers",
    slug: "roots-tubers",
    icon: "carrot",
    color: "#fef3c7",
    priority: "Very High",
    description: "Staple Kenyan roots including Irish potatoes, sweet potatoes, cassava, and nduma.",
    subcategories: [
      {
        id: "sub-potatoes",
        name: "Potatoes",
        slug: "potatoes",
        items: ["Irish potatoes (Warus)", "Sweet potatoes (Ngwaci)"],
      },
      {
        id: "sub-tubers",
        name: "Traditional Tubers",
        slug: "traditional-tubers",
        items: ["Arrowroots (Nduma)", "Cassava (Mihogo)", "Yams", "Taro"],
      },
    ],
  },
  {
    id: "cat-cereals",
    name: "Cereals & Grains",
    slug: "cereals-grains",
    icon: "wheat",
    color: "#fef3c7",
    priority: "High",
    description: "Household grain staples, maize flour (unga), rice, and pasta.",
    subcategories: [
      {
        id: "sub-flours",
        name: "Flours & Unga",
        slug: "flours-unga",
        items: ["Maize flour / Unga", "Wheat flour", "Porridge flour (Uji)", "Millet", "Sorghum"],
      },
      {
        id: "sub-grains-pasta",
        name: "Whole Grains & Pasta",
        slug: "grains-pasta",
        items: ["Maize", "Rice (Pishori / Basmati)", "Oats", "Spaghetti", "Macaroni", "Noodles"],
      },
    ],
  },
  {
    id: "cat-beans",
    name: "Beans, Pulses & Legumes",
    slug: "beans-pulses",
    icon: "utensils",
    color: "#dcfce7",
    priority: "High",
    description: "Protein-rich dry pulses, ndengu, beans, kamande, and groundnuts.",
    subcategories: [
      {
        id: "sub-beans",
        name: "Beans & Ndengu",
        slug: "beans-ndengu",
        items: ["Dry beans (Yellow beans, Rosecoco)", "Green grams / Ndengu", "Cowpeas / Kunde"],
      },
      {
        id: "sub-pulses",
        name: "Lentils & Nuts",
        slug: "lentils-nuts",
        items: ["Lentils / Kamande", "Green peas", "Pigeon peas", "Chickpeas", "Njahi (Black beans)", "Groundnuts"],
      },
    ],
  },
  {
    id: "cat-dairy",
    name: "Milk, Dairy & Eggs",
    slug: "dairy-eggs",
    icon: "milk",
    color: "#dbeafe",
    priority: "High",
    description: "Fresh milk, mala, yogurt, butter, and farm eggs.",
    subcategories: [
      {
        id: "sub-milk",
        name: "Milk & Fermented",
        slug: "milk-fermented",
        items: ["Fresh milk", "UHT milk", "Mala", "Drinking yoghurt", "Yoghurt"],
      },
      {
        id: "sub-dairy-eggs",
        name: "Eggs & Cheese",
        slug: "eggs-cheese",
        items: ["Farm eggs (Kienyeji & Grade)", "Butter", "Cheese", "Margarine"],
      },
    ],
  },
  {
    id: "cat-meats",
    name: "Meat & Poultry",
    slug: "meat-poultry",
    icon: "beef",
    color: "#fee2e2",
    priority: "Medium",
    description: "Fresh cuts of beef, goat, kienyeji chicken, fish, and omena.",
    subcategories: [
      {
        id: "sub-red-meat",
        name: "Beef, Goat & Offal",
        slug: "beef-goat",
        items: ["Beef (bone & steak)", "Goat meat", "Minced meat", "Liver", "Matumbo"],
      },
      {
        id: "sub-poultry-fish",
        name: "Poultry & Fish",
        slug: "poultry-fish",
        items: ["Chicken (Broiler & Kienyeji)", "Fish (Tilapia)", "Omena", "Beef sausages", "Smokies"],
      },
    ],
  },
  {
    id: "cat-oils",
    name: "Cooking Oils & Fats",
    slug: "cooking-oils",
    icon: "droplet",
    color: "#fef9c3",
    priority: "High",
    description: "Essential household cooking oils, solid fats, and ghee.",
    subcategories: [
      {
        id: "sub-liquid-oils",
        name: "Liquid Oils",
        slug: "liquid-oils",
        items: ["Vegetable oil", "Sunflower oil", "Canola oil", "Olive oil", "Coconut oil"],
      },
      {
        id: "sub-fats-ghee",
        name: "Cooking Fats & Ghee",
        slug: "fats-ghee",
        items: ["Solid cooking fat (Kasuku, Elianto)", "Pure Cow Ghee", "Margarine"],
      },
    ],
  },
  {
    id: "cat-spices",
    name: "Spices & Cooking Ingredients",
    slug: "spices-ingredients",
    icon: "flame",
    color: "#ffedd5",
    priority: "High",
    description: "Flavor essentials from Royco to Pilau Masala, curry powder, and pastes.",
    subcategories: [
      {
        id: "sub-local-spices",
        name: "Kenyan Seasonings",
        slug: "kenyan-seasonings",
        items: ["Royco Mchuzi Mix", "Pilau masala", "Curry powder", "Stock cubes", "Tomato paste", "Tomato sauce"],
      },
      {
        id: "sub-baking-pure-spices",
        name: "Pure Spices & Baking",
        slug: "pure-spices-baking",
        items: ["Black pepper", "Paprika", "Turmeric", "Cinnamon", "Cardamom", "Baking powder", "Yeast", "Vinegar"],
      },
    ],
  },
  {
    id: "cat-breads",
    name: "Bread & Bakery",
    slug: "bread-bakery",
    icon: "wheat",
    color: "#fef3c7",
    priority: "Medium",
    description: "Daily fresh bread, mandazi, chapati, buns, and scones.",
    subcategories: [
      {
        id: "sub-bread",
        name: "Fresh Loaves",
        slug: "fresh-loaves",
        items: ["White bread (400g / 800g)", "Brown bread", "Wholemeal bread"],
      },
      {
        id: "sub-pastries",
        name: "Kenyan Bakery & Bites",
        slug: "kenyan-bakery",
        items: ["Mandazi / Mahamri", "Chapati", "Buns", "Scones", "Cakes", "Biscuits"],
      },
    ],
  },
  {
    id: "cat-sugar-salt",
    name: "Sugar, Salt & Sweeteners",
    slug: "sugar-salt",
    icon: "sparkles",
    color: "#fce7f3",
    priority: "Medium",
    description: "Household sugar, iodized salt, and natural raw honey.",
    subcategories: [
      {
        id: "sub-sugar-salt-items",
        name: "Sweeteners & Salt",
        slug: "sweeteners-salt",
        items: ["White sugar", "Brown sugar", "Iodized table salt", "Raw Honey", "Jaggery (Sukari nguru)"],
      },
    ],
  },
  {
    id: "cat-breakfast",
    name: "Tea, Coffee & Breakfast",
    slug: "breakfast",
    icon: "coffee",
    color: "#e0e7ff",
    priority: "Medium",
    description: "Chai essentials, Kenyan tea leaves, coffee, Milo, and spreads.",
    subcategories: [
      {
        id: "sub-hot-beverages",
        name: "Chai & Coffee",
        slug: "chai-coffee",
        items: ["Kenyan Tea leaves (Ketepa, Fahari Ya Kenya)", "Tea bags", "Coffee", "Cocoa", "Milo / Drinking chocolate"],
      },
      {
        id: "sub-breakfast-cereals",
        name: "Cereals & Spreads",
        slug: "cereals-spreads",
        items: ["Weetabix", "Corn flakes", "Oats", "Peanut butter", "Jam"],
      },
    ],
  },
  {
    id: "cat-drinks",
    name: "Drinks & Refreshments",
    slug: "drinks",
    icon: "cup-soda",
    color: "#e0e7ff",
    priority: "Medium",
    description: "Clean bottled water, juices, sodas, and chilled beverages.",
    subcategories: [
      {
        id: "sub-water-soda",
        name: "Water & Soft Drinks",
        slug: "water-soda",
        items: ["Bottled water (500ml, 1L, 5L, 10L)", "Soda", "Energy drinks"],
      },
      {
        id: "sub-juices",
        name: "Juices & Squash",
        slug: "juices-squash",
        items: ["Fresh juice", "Boxed juice (Del Monte)", "Squash", "Flavoured drinks"],
      },
    ],
  },
  {
    id: "cat-snacks",
    name: "Snacks",
    slug: "snacks",
    icon: "cookie",
    color: "#f3e8ff",
    priority: "Medium",
    description: "Quick bites, crisps, roasted groundnuts, crackers, and sweets.",
    subcategories: [
      {
        id: "sub-bites",
        name: "Savory & Sweet Bites",
        slug: "savory-sweet-bites",
        items: ["Potato crisps", "Popcorn", "Roasted groundnuts", "Biscuits", "Crackers", "Sweets & Chocolates"],
      },
    ],
  },
];

export const DEFAULT_GROCERY_IMAGES: Record<string, string> = {
  strawberry: "/images/products/strawberries.jpg",
  strawberries: "/images/products/strawberries.jpg",
  orange: "/images/products/oranges.jpg",
  oranges: "/images/products/oranges.jpg",
  banana: "/images/products/bananas.jpg",
  bananas: "/images/products/bananas.jpg",
  apple: "/images/products/green_apple.jpg",
  apples: "/images/products/green_apple.jpg",
  "green apple": "/images/products/green_apple.jpg",
  cabbage: "/images/products/cabbage.jpg",
  tomato: "/images/products/tomatoes.jpg",
  tomatoes: "/images/products/tomatoes.jpg",
  onion: "/images/products/onions.jpg",
  onions: "/images/products/onions.jpg",
  avocado: "/images/products/avocado.jpg",
  avocados: "/images/products/avocado.jpg",
  beef: "/images/products/beef.jpg",
  meat: "/images/meat.png",
  sukuma: "/images/products/sukuma.jpg",
  kale: "/images/products/sukuma.jpg",
  spinach: "/images/products/sukuma.jpg",
  greens: "/images/products/sukuma.jpg",
  carrots: "/images/products/carrots.jpg",
  carrot: "/images/products/carrots.jpg",
  beetroot: "/images/products/beetroot.jpg",
  milk: "/images/milk.png",
  bread: "/images/bread.png",
  drink: "/images/drinks.png",
  drinks: "/images/drinks.png",
  fruits: "/images/products/strawberries.jpg",
  vegetables: "/images/products/cabbage.jpg",
  meats: "/images/products/beef.jpg",
  default: "/images/products/tomatoes.jpg",
};

export function getDefaultProductImage(name?: string, category?: string): string {
  const normalizedName = (name || "").toLowerCase();
  for (const [key, img] of Object.entries(DEFAULT_GROCERY_IMAGES)) {
    if (normalizedName.includes(key)) {
      return img;
    }
  }
  const normalizedCat = (category || "").toLowerCase();
  if (normalizedCat.includes("fruit")) return "/images/products/oranges.jpg";
  if (normalizedCat.includes("veg")) return "/images/products/cabbage.jpg";
  if (normalizedCat.includes("meat")) return "/images/products/beef.jpg";
  if (normalizedCat.includes("milk") || normalizedCat.includes("dair")) return "/images/milk.png";
  if (normalizedCat.includes("bread") || normalizedCat.includes("baker")) return "/images/bread.png";
  return "/images/products/tomatoes.jpg";
}
