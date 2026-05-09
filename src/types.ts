export type UserRole = 'admin' | 'provider' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  favorites?: string[]; // Array of business IDs
  createdAt: Date;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  images: string[];
  bannerImage: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
}

export interface Booking {
  id: string;
  businessId: string;
  businessOwnerId: string;
  serviceId: string;
  clientId: string;
  startTime: string; // Changed to string to reflect ISO format in Firestore
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
}

export interface Review {
  id: string;
  businessId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
