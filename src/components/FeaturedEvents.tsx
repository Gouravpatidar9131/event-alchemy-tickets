
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import EventCard from './EventCard';
import { Link } from 'react-router-dom';

// Mock data for featured events
const featuredEvents = [
  {
    id: '1',
    title: 'Solana Summer Hackathon',
    date: 'June 10, 2025',
    time: '9:00 AM - 6:00 PM',
    location: 'Virtual Event',
    imageUrl: 'https://images.unsplash.com/photo-1591522811280-a8759970b03f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '0.5 SOL',
    category: 'Technology',
    availability: 'available' as const,
  },
  {
    id: '2',
    title: 'Metaverse Music Festival',
    date: 'July 5, 2025',
    time: '8:00 PM - 2:00 AM',
    location: 'Decentraland',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    price: '1.2 SOL',
    category: 'Music',
    availability: 'limited' as const,
  },
  {
    id: '3',
    title: 'NFT Art Exhibition',
    date: 'August 15, 2025',
    time: '10:00 AM - 6:00 PM',
    location: 'Miami, FL',
    imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1744&q=80',
    price: '0.8 SOL',
    category: 'Art',
    availability: 'available' as const,
  },
  {
    id: '4',
    title: 'Crypto Economics Summit',
    date: 'September 20, 2025',
    time: '9:00 AM - 5:00 PM',
    location: 'San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80',
    price: '1.5 SOL',
    category: 'Finance',
    availability: 'sold out' as const,
  }
];

const FeaturedEvents = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <Button asChild variant="outline" className="glass-button">
            <Link to="/events">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredEvents.map((event) => (
            <EventCard 
              key={event.id}
              {...event}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
