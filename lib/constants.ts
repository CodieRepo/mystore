// App-wide constants

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Snarky Store";

export const ORDER_STATUSES = [
  { value: "placed", label: "Placed", color: "bg-blue-100 text-blue-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-indigo-100 text-indigo-800" },
  { value: "packed", label: "Packed", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "Shipped", color: "bg-yellow-100 text-yellow-800" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-orange-100 text-orange-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { value: "returned", label: "Returned", color: "bg-gray-100 text-gray-800" },
] as const;

export const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export const CAMPAIGN_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "influencer", label: "Influencer" },
  { value: "organic", label: "Organic" },
  { value: "other", label: "Other" },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
] as const;

export const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "NETBANKING", label: "Net Banking" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/products", label: "Products", icon: "Package" },
  { href: "/admin/categories", label: "Categories", icon: "Tag" },
  { href: "/admin/orders", label: "Orders", icon: "ShoppingCart" },
  { href: "/admin/customers", label: "Customers", icon: "Users" },
  { href: "/admin/banners", label: "Banners", icon: "Image" },
  { href: "/admin/coupons", label: "Coupons", icon: "Ticket" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "Megaphone" },
  { href: "/admin/inventory", label: "Inventory", icon: "Warehouse" },
  { href: "/admin/media", label: "Media", icon: "ImagePlus" },
  { href: "/admin/settings", label: "Settings", icon: "Settings" },
] as const;
