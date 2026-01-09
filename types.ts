export interface WeatherInfo {
  temperature: number;
  condition: string; // 'Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Windy'
  code: number; // WMO code
  locationName?: string; // Cache the location name for the weather
}

export interface FoodEntry {
  id: string;
  title: string;
  location: string;
  date: string;
  images: string[]; // Changed from single imageUrl to array
  coverImageIndex: number; // Index of the cover image
  tags: string[];
  rating: number; // 1-5
  description: string;
  weather?: WeatherInfo;
}

export enum ViewState {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  ADD = 'ADD',
  PROFILE = 'PROFILE',
  DETAIL = 'DETAIL',
  EDIT = 'EDIT'
}

export interface MiniCapsuleProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'blur' | 'danger';
}