export interface Campaign {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  payAmount: number;
  type: "Reel" | "Story" | "Post" | "Carousel";
  minFollowers: number;
  description: string;
  tier: "Nano" | "Micro" | "Macro" | "Mega";
  deadline: string;
  spots: number;
}

export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Summer Collection Launch",
    brand: "Zara",
    brandLogo: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
    payAmount: 500,
    type: "Reel",
    minFollowers: 10000,
    tier: "Micro",
    description: "Create a 30s reel showcasing 3 outfits from our new summer collection. Must use trending audio.",
    deadline: "2024-06-30",
    spots: 5
  },
  {
    id: "2",
    title: "Hydration Hero Story",
    brand: "Liquid I.V.",
    brandLogo: "https://images.squarespace-cdn.com/content/v1/64010a3014d105221971719c/1682352875240-6X2O6127402802521190/Liquid-IV-Logo.png",
    payAmount: 150,
    type: "Story",
    minFollowers: 5000,
    tier: "Nano",
    description: "Post a story series unboxing and tasting our new flavor. Include swipe-up link.",
    deadline: "2024-06-25",
    spots: 20
  },
  {
    id: "3",
    title: "Tech Review Carousel",
    brand: "Logitech",
    brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/2560px-Logitech_logo.svg.png",
    payAmount: 1200,
    type: "Carousel",
    minFollowers: 100000,
    tier: "Macro",
    description: "Detailed 5-slide carousel reviewing the new MX Master 3S mouse. Focus on productivity.",
    deadline: "2024-07-10",
    spots: 3
  },
  {
    id: "4",
    title: "Morning Routine",
    brand: "Nespresso",
    brandLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Nespresso_logo.svg/2560px-Nespresso_logo.svg.png",
    payAmount: 800,
    type: "Reel",
    minFollowers: 50000,
    tier: "Macro",
    description: "Aesthetic morning routine reel featuring our Vertuo machine.",
    deadline: "2024-07-01",
    spots: 8
  },
  {
    id: "5",
    title: "Fitness Challenge",
    brand: "Gymshark",
    brandLogo: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Gymshark_logo.png",
    payAmount: 2000,
    type: "Post",
    minFollowers: 200000,
    tier: "Mega",
    description: "Post a workout photo wearing our Vital Seamless set.",
    deadline: "2024-07-15",
    spots: 2
  }
];

export const earningsData = [
  { month: "Jan", earnings: 1200, views: 50000 },
  { month: "Feb", earnings: 1800, views: 75000 },
  { month: "Mar", earnings: 1500, views: 60000 },
  { month: "Apr", earnings: 2400, views: 120000 },
  { month: "May", earnings: 3200, views: 180000 },
  { month: "Jun", earnings: 4250, views: 250000 },
];
