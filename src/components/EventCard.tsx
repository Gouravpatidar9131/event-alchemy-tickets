import { Calendar, Clock, MapPin, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';

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
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get a reliable fallback image
  const getFallbackImage = () => {
    const fallbackImages = [
      "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format"
    ];
    
    // Use event ID to consistently pick the same fallback for each event
    const index = id ? parseInt(id.substring(0, 8), 16) % fallbackImages.length : 0;
    return fallbackImages[index];
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log('Image failed to load:', imageUrl);
    setImageError(true);
    setImageLoaded(false);
  };

  // Check if imageUrl is valid (supports both Supabase storage URLs and external URLs)
  const isValidImageUrl = (url: string) => {
    if (!url || url.trim() === '') return false;
    if (url.startsWith('blob:')) return false;
    
    // Check for Supabase storage URLs
    if (url.includes('supabase') && url.includes('/storage/v1/object/public/')) return true;
    
    // Check for valid external URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const shouldShowFallback = !isValidImageUrl(imageUrl) || imageError;

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg group">
      <div className="relative h-48 overflow-hidden bg-muted">
        {/* Main image */}
        {isValidImageUrl(imageUrl) && !imageError && (
          <img 
            src={imageUrl}
            alt={title} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {/* Fallback image */}
        {shouldShowFallback && (
          <div className="absolute inset-0">
            <img 
              src={getFallbackImage()}
              alt={`${title} - Event placeholder`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Final fallback - hide image and show icon
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Ultimate fallback - gradient background with icon */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <Image className="h-12 w-12 text-white opacity-50" />
            </div>
          </div>
        )}
        
        {/* Availability badge */}
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
