
import { Calendar, Clock, MapPin, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { useCDPWallet } from '@/providers/CDPWalletProvider';

// Chain-specific token configurations
const CHAIN_TOKENS: Record<number, { name: string; symbol: string; priceMultiplier: number }> = {
  1: { name: 'Ethereum', symbol: 'ETH', priceMultiplier: 1 },
  137: { name: 'Polygon', symbol: 'MATIC', priceMultiplier: 0.5 },
  42161: { name: 'Arbitrum', symbol: 'ETH', priceMultiplier: 0.8 },
  10: { name: 'Optimism', symbol: 'ETH', priceMultiplier: 0.8 },
  8453: { name: 'Base', symbol: 'ETH', priceMultiplier: 0.7 },
  43114: { name: 'Avalanche', symbol: 'AVAX', priceMultiplier: 0.3 },
};

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
  const { chainId, isConnected } = useCDPWallet();

  // Get current chain token info
  const getCurrentChainToken = () => {
    return chainId ? CHAIN_TOKENS[chainId] || { name: 'Unknown', symbol: 'ETH', priceMultiplier: 1 } : { name: 'Ethereum', symbol: 'ETH', priceMultiplier: 1 };
  };

  const chainToken = getCurrentChainToken();

  // Calculate chain-adjusted price
  const getChainAdjustedPrice = () => {
    const basePrice = parseFloat(price) || 0;
    if (basePrice === 0) return 'Free';
    
    const adjustedPrice = basePrice * chainToken.priceMultiplier;
    return `${adjustedPrice.toFixed(4)} ${chainToken.symbol}`;
  };

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

  // Check if imageUrl is valid and not empty
  const isValidImageUrl = (url: string) => {
    if (!url || url.trim() === '') {
      console.log('Empty or null image URL for event:', id);
      return false;
    }
    
    // Check for blob URLs which are invalid
    if (url.startsWith('blob:')) {
      console.log('Blob URL detected for event:', id);
      return false;
    }
    
    // Check for Supabase storage URLs
    if (url.includes('supabase') && url.includes('/storage/v1/object/public/')) {
      console.log('Valid Supabase storage URL for event:', id, url);
      return true;
    }
    
    // Check for valid external URLs
    try {
      const parsedUrl = new URL(url);
      console.log('Valid external URL for event:', id, url);
      return true;
    } catch {
      console.log('Invalid URL format for event:', id, url);
      return false;
    }
  };

  const shouldUseFallback = !isValidImageUrl(imageUrl) || imageError;
  const displayImageUrl = shouldUseFallback ? getFallbackImage() : imageUrl;

  console.log('EventCard render:', { 
    id, 
    title, 
    imageUrl, 
    shouldUseFallback, 
    displayImageUrl 
  });

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg group">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img 
          src={displayImageUrl}
          alt={title} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded || shouldUseFallback ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Loading state */}
        {!imageLoaded && !shouldUseFallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <Image className="h-12 w-12 text-muted-foreground" />
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

        {/* Chain-specific pricing badge */}
        {isConnected && chainToken.priceMultiplier !== 1 && parseFloat(price) > 0 && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {Math.round((1 - chainToken.priceMultiplier) * 100)}% off on {chainToken.name}
            </Badge>
          </div>
        )}
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
          <div className="text-right">
            <span className="font-bold text-solana-blue">{getChainAdjustedPrice()}</span>
            {isConnected && chainId && parseFloat(price) > 0 && (
              <div className="text-xs text-muted-foreground">on {chainToken.name}</div>
            )}
          </div>
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
