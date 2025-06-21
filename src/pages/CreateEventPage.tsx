
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useCDPWallet } from '@/providers/CDPWalletProvider';
import { useEventCreation } from '@/hooks/useEventCreation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Upload, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

// Chain-specific token configurations
const CHAIN_TOKENS: Record<number, { name: string; symbol: string; priceMultiplier: number }> = {
  1: { name: 'Ethereum', symbol: 'ETH', priceMultiplier: 1 },
  137: { name: 'Polygon', symbol: 'MATIC', priceMultiplier: 0.5 },
  42161: { name: 'Arbitrum', symbol: 'ETH', priceMultiplier: 0.8 },
  10: { name: 'Optimism', symbol: 'ETH', priceMultiplier: 0.8 },
  8453: { name: 'Base', symbol: 'ETH', priceMultiplier: 0.7 },
  43114: { name: 'Avalanche', symbol: 'AVAX', priceMultiplier: 0.3 },
};

const CreateEventPage = () => {
  const { user } = useAuth();
  const { chainId, isConnected } = useCDPWallet();
  const navigate = useNavigate();
  const { createEventMutation } = useEventCreation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: undefined as Date | undefined,
    time: '',
    price: '',
    totalTickets: '',
    imageFile: null as File | null,
  });

  // Get current chain token info
  const getCurrentChainToken = () => {
    return chainId ? CHAIN_TOKENS[chainId] || { name: 'Unknown', symbol: 'ETH', priceMultiplier: 1 } : { name: 'Ethereum', symbol: 'ETH', priceMultiplier: 1 };
  };

  const chainToken = getCurrentChainToken();

  // Calculate the base price from chain-adjusted price
  const getBasePriceFromChainPrice = (chainPrice: number) => {
    return chainPrice / chainToken.priceMultiplier;
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast('Image size must be less than 5MB');
        return;
      }
      handleInputChange('imageFile', file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast('Please sign in to create an event');
      navigate('/auth');
      return;
    }

    if (!formData.date || !formData.time) {
      toast('Please select both date and time');
      return;
    }

    try {
      const dateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      // Convert chain-adjusted price back to base price for storage
      const chainPrice = parseFloat(formData.price) || 0;
      const basePrice = getBasePriceFromChainPrice(chainPrice);

      await createEventMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        datetime: dateTime.toISOString(),
        price: basePrice, // Store base price in database
        totalTickets: parseInt(formData.totalTickets),
        imageFile: formData.imageFile,
      });

      toast('Event created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast('Failed to create event', {
        description: error.message || 'Please try again',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to create your event</p>
          
          {isConnected && chainId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                <Info className="w-4 h-4" />
                Connected to {chainToken.name}
              </div>
              <p className="text-blue-600 text-xs mt-1">
                Ticket prices will be displayed in {chainToken.symbol}. Base pricing is automatically adjusted for your selected network.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Event location or venue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => handleInputChange('date', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Ticket Price
                    {isConnected && chainId && (
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                        {chainToken.symbol}
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder={`Price in ${isConnected ? chainToken.symbol : 'ETH'} (0 for free)`}
                    required
                  />
                  {isConnected && chainToken.priceMultiplier !== 1 && parseFloat(formData.price) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Base price: {getBasePriceFromChainPrice(parseFloat(formData.price) || 0).toFixed(4)} ETH
                      (Adjusted for {chainToken.name} network)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total Tickets</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    value={formData.totalTickets}
                    onChange={(e) => handleInputChange('totalTickets', e.target.value)}
                    placeholder="Number of tickets available"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Event Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {formData.imageFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.imageFile.name}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEventPage;
