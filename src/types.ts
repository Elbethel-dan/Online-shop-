export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  image: string;
  category: 'Floral' | 'Woody' | 'Oriental' | 'Fresh';
  notes: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Subscription {
  id?: string;
  email: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'customer';
  displayName?: string;
}
