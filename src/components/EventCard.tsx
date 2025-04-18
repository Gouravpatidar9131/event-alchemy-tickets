
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageUrl: string;
  price: string;
  category: string;
  availability: 'available' | 'limited' | 'sold out';
}

const EventCard = ({ 
  id, 
  title, 
  date, 
  time, 
  location, 
  imageUrl, 
  price, 
  category, 
  availability 
}: EventCardProps) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute top-3 right-3">
          <Badge 
            variant={
              availability === 'available' ? 'default' : 
              availability === 'limited' ? 'outline' : 'destructive'
            }
            className={
              availability === 'available' ? 'bg-solana-green text-black' : 
              availability === 'limited' ? 'border-yellow-400 text-yellow-400' : ''
            }
          >
            {availability === 'available' ? 'Available' : 
             availability === 'limited' ? 'Limited Tickets' : 'Sold Out'}
          </Badge>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold line-clamp-2">{title}</h3>
        </div>
        <div className="mb-4 space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Badge variant="outline" className="bg-accent">{category}</Badge>
          <span className="font-bold text-solana-blue">{price}</span>
        </div>
        <div className="mt-4">
          <Link to={`/events/${id}`}>
            <Button variant="outline" className="w-full glass-button">
              View Event
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
