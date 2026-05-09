import { db } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export const seedSampleData = async () => {
  const businesses = [
    {
      name: "Elite Cuts Barber Shop",
      description: "Premium grooming and traditional straight razor shaves.",
      category: "Barber Shop",
      address: "123 Main St",
      city: "Cameroon",
      rating: 4.9,
      reviewCount: 124,
      ownerId: "sample_owner_1",
      bannerImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800",
      images: ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800"]
    },
    {
      name: "Velvet Nails & Spa",
      description: "Luxurious nail care and relaxing spa treatments.",
      category: "Nail Salon",
      address: "456 Fashion Ave",
      city: "Cameroon",
      rating: 4.7,
      reviewCount: 89,
      ownerId: "sample_owner_2",
      bannerImage: "https://images.unsplash.com/photo-1604654894610-df490982560a?auto=format&fit=crop&q=80&w=800",
      images: ["https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800"]
    },
    {
      name: "Glow Skin Clinic",
      description: "Advanced facials and clinical skin rejuvenation.",
      category: "Skin Care",
      address: "789 Wellness Rd",
      city: "Cameroon",
      rating: 4.8,
      reviewCount: 56,
      ownerId: "sample_owner_3",
      bannerImage: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=800",
      images: ["https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&q=80&w=800"]
    }
  ];

  const services = [
    { name: "Classic Haircut", price: 35, duration: 30, businessIndex: 0 },
    { name: "Beard Trim & Shape", price: 25, duration: 20, businessIndex: 0 },
    { name: "Gel Manicure", price: 45, duration: 45, businessIndex: 1 },
    { name: "Pedicure Deluxe", price: 60, duration: 60, businessIndex: 1 },
    { name: "HydraFacial", price: 120, duration: 60, businessIndex: 2 }
  ];

  try {
    for (const biz of businesses) {
      const bizRef = await addDoc(collection(db, 'businesses'), biz);
      
      const bizServices = services.filter(s => s.businessIndex === businesses.indexOf(biz));
      for (const service of bizServices) {
        const { businessIndex, ...serviceData } = service;
        await addDoc(collection(db, 'businesses', bizRef.id, 'services'), {
          ...serviceData,
          businessId: bizRef.id
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    return false;
  }
};
