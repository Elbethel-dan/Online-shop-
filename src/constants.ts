import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Addis Bloom',
    brand: "Elu's Signature",
    price: 4500,
    description: 'A vibrant floral bouquet inspired by the gardens of Addis Ababa, featuring notes of jasmine and wild rose.',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800',
    category: 'Floral',
    notes: ['Jasmine', 'Rose', 'Bergamot']
  },
  {
    id: '2',
    name: 'Highland Mist',
    brand: "Elu's Signature",
    price: 5200,
    description: 'A crisp, fresh scent capturing the morning dew on the Ethiopian highlands.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
    category: 'Fresh',
    notes: ['Cedar', 'Mint', 'White Musk']
  },
  {
    id: '3',
    name: 'Amber Nights',
    brand: "Elu's Signature",
    price: 6800,
    description: 'A deep, warm oriental fragrance with rich amber and spicy undertones.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
    category: 'Oriental',
    notes: ['Amber', 'Cinnamon', 'Vanilla']
  },
  {
    id: '4',
    name: 'Sandalwood Serenity',
    brand: "Elu's Signature",
    price: 4900,
    description: 'A grounding woody fragrance that brings a sense of calm and sophistication.',
    image: 'https://images.unsplash.com/photo-1563170351-be82bc888bb4?auto=format&fit=crop&q=80&w=800',
    category: 'Woody',
    notes: ['Sandalwood', 'Patchouli', 'Vetiver']
  },
  {
    id: '5',
    name: 'Entoto Breeze',
    brand: "Elu's Signature",
    price: 4200,
    description: 'Inspired by the eucalyptus forests of Entoto, this scent is both refreshing and nostalgic.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800',
    category: 'Fresh',
    notes: ['Eucalyptus', 'Pine', 'Lemon']
  },
  {
    id: '6',
    name: 'Velvet Oud',
    brand: "Elu's Signature",
    price: 8500,
    description: 'The pinnacle of luxury, a complex oud fragrance with hints of leather and smoke.',
    image: 'https://images.unsplash.com/photo-1583445013765-48c2201c86d1?auto=format&fit=crop&q=80&w=800',
    category: 'Oriental',
    notes: ['Oud', 'Leather', 'Saffron']
  }
];
