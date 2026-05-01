export interface OrderItem {
  _id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}
export interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}