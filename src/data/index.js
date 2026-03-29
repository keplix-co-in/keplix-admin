export const revenueData = [
  { day: "Feb 7",  gmv: 42000, rev: 6300 },
  { day: "Feb 8",  gmv: 58000, rev: 8700 },
  { day: "Feb 9",  gmv: 35000, rev: 5250 },
  { day: "Feb 10", gmv: 71000, rev: 10650 },
  { day: "Feb 11", gmv: 63000, rev: 9450 },
  { day: "Feb 12", gmv: 89000, rev: 13350 },
  { day: "Feb 13", gmv: 94000, rev: 14100 },
];

export const cityData = [
  { city: "Delhi",   bookings: 312, gmv: 187000 },
  { city: "Mumbai",  bookings: 278, gmv: 163000 },
  { city: "Pune",    bookings: 196, gmv: 108000 },
  { city: "Noida",   bookings: 143, gmv: 84000 },
  { city: "Bengaluru", bookings: 121, gmv: 71000 },
  { city: "Hyderabad", bookings: 98,  gmv: 56000 },
];

export const funnelData = [
  { stage: "Searched",   users: 4200 },
  { stage: "Viewed",     users: 2800 },
  { stage: "Initiated",  users: 1100 },
  { stage: "Completed",  users: 780  },
];

export const serviceData = [
  { name: "Full Service", value: 34, color: "#ff6b00" },
  { name: "Car Wash",     value: 28, color: "#ff9944" },
  { name: "Repairs",      value: 22, color: "#ffcc77" },
  { name: "SOS",          value: 10, color: "#ff3d3d" },
  { name: "Others",       value: 6,  color: "#444455" },
];

export const payoutQueue = [
  { id: "KPX-2840", vendor: "Raj Auto Garage",     city: "Delhi",   amount: 553,  hoursLeft: 18, booking: "Car Wash + Polish",   status: "due_soon" },
  { id: "KPX-2837", vendor: "Speedy Motors",        city: "Mumbai",  amount: 2975, hoursLeft: 6,  booking: "Dent & Paint",         status: "urgent" },
  { id: "KPX-2834", vendor: "Sharma Car Care",      city: "Pune",    amount: 1190, hoursLeft: 42, booking: "Full Service",         status: "normal" },
  { id: "KPX-2831", vendor: "K&K Auto Works",       city: "Noida",   amount: 765,  hoursLeft: 55, booking: "AC Gas Refill",        status: "normal" },
  { id: "KPX-2828", vendor: "FastFix Garage",       city: "Delhi",   amount: 3400, hoursLeft: 2,  booking: "Engine Overhaul",      status: "critical" },
  { id: "KPX-2825", vendor: "Quick Wheels Wash",    city: "Mumbai",  amount: 450,  hoursLeft: 60, booking: "Basic Car Wash",       status: "normal" },
];

export const vendors = [
  { id: "V-1041", name: "Raj Auto Garage",    owner: "Rajesh Kumar",   city: "Delhi NCR",  category: "Full Service", status: "active",  bookings: 142, rating: 4.8, joined: "Jan 5, 2025",  earnings: 218400, verified: "field" },
  { id: "V-1038", name: "Speedy Motors",       owner: "Arjun Mehta",    city: "Mumbai",     category: "Repairs",      status: "active",  bookings: 98,  rating: 4.5, joined: "Jan 12, 2025", earnings: 163200, verified: "premium" },
  { id: "V-1036", name: "Quick Wheels Wash",   owner: "Suresh Patel",   city: "Pune",       category: "Car Wash",     status: "active",  bookings: 214, rating: 4.7, joined: "Dec 20, 2024", earnings: 96800,  verified: "basic" },
  { id: "V-1032", name: "SOS Road Rescue",     owner: "Vikram Singh",   city: "Delhi NCR",  category: "SOS",          status: "active",  bookings: 67,  rating: 4.9, joined: "Feb 1, 2025",  earnings: 54600,  verified: "premium" },
  { id: "V-1028", name: "Sharma Car Care",     owner: "Deepak Sharma",  city: "Noida",      category: "Full Service", status: "pending", bookings: 0,   rating: 0,   joined: "Feb 10, 2025", earnings: 0,      verified: "none" },
  { id: "V-1024", name: "Auto King Works",     owner: "Manish Yadav",   city: "Bengaluru",  category: "Full Service", status: "suspended", bookings: 23, rating: 2.1, joined: "Nov 14, 2024", earnings: 31200, verified: "basic" },
  { id: "V-1019", name: "FastFix Garage",      owner: "Praveen Nair",   city: "Hyderabad",  category: "Repairs",      status: "active",  bookings: 56,  rating: 4.3, joined: "Dec 5, 2024",  earnings: 78400,  verified: "field" },
];

export const bookings = [
  { id: "KPX-2841", user: "Rahul Sharma",  phone: "98100-12345", vendor: "Raj Auto Garage",    service: "Full Car Service",   slot: "13 Feb, 2:30 PM", amount: 1800, commission: 270, status: "completed" },
  { id: "KPX-2840", user: "Priya Mehta",   phone: "70100-54321", vendor: "Quick Wheels Wash",  service: "Car Wash + Polish",  slot: "13 Feb, 11:00 AM", amount: 650, commission: 97,  status: "in_progress" },
  { id: "KPX-2839", user: "Ajay Verma",    phone: "88200-11111", vendor: "FastFix Garage",     service: "Tyre Rotation",      slot: "12 Feb, 4:15 PM", amount: 400, commission: 60,  status: "completed" },
  { id: "KPX-2838", user: "Sneha Kapoor",  phone: "99100-88888", vendor: "Speedy Motors",      service: "AC Gas Refill",      slot: "12 Feb, 1:00 PM", amount: 1200, commission: 180, status: "completed" },
  { id: "KPX-2837", user: "Mohd. Faraz",   phone: "77300-22222", vendor: "Speedy Motors",      service: "Dent & Paint",       slot: "11 Feb, 10:30 AM", amount: 3500, commission: 525, status: "completed" },
  { id: "KPX-2836", user: "Divya Singh",   phone: "88100-33333", vendor: "Raj Auto Garage",    service: "Oil Change",         slot: "11 Feb, 9:00 AM", amount: 550, commission: 82,  status: "completed" },
  { id: "KPX-2835", user: "Kiran Nair",    phone: "91234-44444", vendor: "FastFix Garage",     service: "Battery Replace",    slot: "10 Feb, 3:45 PM", amount: 2200, commission: 330, status: "disputed" },
  { id: "KPX-2834", user: "Amit Joshi",    phone: "80100-55555", vendor: "Sharma Car Care",    service: "Full Car Service",   slot: "10 Feb, 1:00 PM", amount: 1800, commission: 270, status: "confirmed" },
  { id: "KPX-2833", user: "Pooja Rao",     phone: "95200-66666", vendor: "SOS Road Rescue",    service: "Emergency Towing",   slot: "10 Feb, 8:00 AM", amount: 1500, commission: 225, status: "cancelled" },
];

export const usersData = [
  { id: "U-4021", name: "Rahul Verma",     email: "rahul.v@example.com",     phone: "+91 98765 43210", role: "End User", status: "active",   bookings: 12, joined: "Nov 5, 2024",  lastActive: "2 mins ago" },
  { id: "U-4020", name: "Priya Sharma",    email: "priya.sharma@example.com",phone: "+91 87654 32109", role: "Pro User", status: "active",   bookings: 45, joined: "Oct 12, 2024", lastActive: "1 hour ago" },
  { id: "U-4019", name: "Amit Kumar",      email: "amit.k@example.com",      phone: "+91 76543 21098", role: "End User", status: "inactive", bookings: 2,  joined: "Jan 20, 2025", lastActive: "2 weeks ago" },
  { id: "U-4018", name: "Sneha Patel",     email: "sneha.p@example.com",     phone: "+91 65432 10987", role: "Pro User", status: "active",   bookings: 89, joined: "Sep 1, 2024",  lastActive: "5 mins ago" },
  { id: "U-4017", name: "Vikram Singh",    email: "vikram.s@example.com",    phone: "+91 54321 09876", role: "End User", status: "banned",   bookings: 0,  joined: "Feb 10, 2025", lastActive: "1 month ago" },
  { id: "U-4016", name: "Neha Gupta",      email: "neha.g@example.com",      phone: "+91 99887 76655", role: "End User", status: "active",   bookings: 5,  joined: "Dec 14, 2024", lastActive: "1 day ago" },
  { id: "U-4015", name: "Rajat Desai",     email: "rajat.d@example.com",     phone: "+91 88776 65544", role: "Pro User", status: "active",   bookings: 112,joined: "Aug 22, 2024", lastActive: "Just now" },
  { id: "U-4014", name: "Pooja Reddy",     email: "pooja.r@example.com",     phone: "+91 77665 54433", role: "End User", status: "inactive", bookings: 1,  joined: "Feb 28, 2025", lastActive: "3 weeks ago" },
];