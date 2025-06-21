
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Bot, Zap, Crown, Star, Users } from 'lucide-react';
import { agentKitPricing } from '@/services/AgentKitPricing';
import { useToast } from '@/components/ui/use-toast';

interface PricingDashboardProps {
  eventId: string;
  currentPrice: number;
  onPriceUpdate?: (newPrice: number) => void;
}

interface TicketTypePricing {
  general: {
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
    demandLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  vip: {
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
    demandLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  premium: {
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
    demandLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface PricingRecommendation {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
  ticketTypes?: TicketTypePricing;
}

const AgentKitPricingDashboard = ({ eventId, currentPrice, onPriceUpdate }: PricingDashboardProps) => {
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<'general' | 'vip' | 'premium'>('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchPricingRecommendation();
    
    // Set up automatic pricing updates every 30 minutes
    const interval = setInterval(fetchPricingRecommendation, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchPricingRecommendation = async () => {
    setIsLoading(true);
    try {
      const rec = await agentKitPricing.calculateDynamicPricing(eventId);
      setRecommendation(rec);
      console.log('AgentKit: Multi-tier pricing recommendation fetched', rec);
    } catch (error) {
      console.error('AgentKit: Failed to fetch pricing recommendation', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPricingRecommendation = async (ticketType: 'general' | 'vip' | 'premium') => {
    if (!recommendation?.ticketTypes) return;
    
    setIsUpdating(true);
    try {
      await agentKitPricing.updateEventPricing(eventId, ticketType);
      const newPrice = recommendation.ticketTypes[ticketType].suggestedPrice;
      onPriceUpdate?.(newPrice);
      toast({
        title: 'AgentKit Pricing Applied',
        description: `${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} ticket price updated to ${newPrice} ETH`,
      });
    } catch (error) {
      toast({
        title: 'Pricing Update Failed',
        description: 'Failed to apply AgentKit pricing recommendation',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getDemandBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'general': return <Users className="w-4 h-4" />;
      case 'vip': return <Crown className="w-4 h-4" />;
      case 'premium': return <Star className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPriceTrend = (ticketType: 'general' | 'vip' | 'premium') => {
    if (!recommendation?.ticketTypes) return null;
    const suggested = recommendation.ticketTypes[ticketType].suggestedPrice;
    const basePrice = ticketType === 'general' ? currentPrice : currentPrice * (ticketType === 'vip' ? 2.5 : 4.0);
    const change = suggested - basePrice;
    const percentage = ((change / basePrice) * 100).toFixed(1);
    return { change, percentage };
  };

  const renderTicketTypeCard = (type: 'general' | 'vip' | 'premium') => {
    if (!recommendation?.ticketTypes) return null;
    
    const typeData = recommendation.ticketTypes[type];
    const trend = getPriceTrend(type);
    const multiplier = type === 'general' ? 1 : type === 'vip' ? 2.5 : 4.0;
    const basePrice = currentPrice * multiplier;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Current Price ({type})</div>
            <div className="text-2xl font-bold">{basePrice.toFixed(4)} ETH</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">AI Recommended Price</div>
            <div className="text-2xl font-bold text-purple-600">
              {typeData.suggestedPrice} ETH
            </div>
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
            {trend.change > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`font-medium ${trend.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.change > 0 ? '+' : ''}{trend.percentage}%
            </span>
            <span className="text-gray-600">
              {trend.change > 0 ? 'increase' : 'decrease'} recommended
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Demand Level</span>
            <Badge className={getDemandBadgeColor(typeData.demandLevel)}>
              {typeData.demandLevel.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${typeData.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{(typeData.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <div className="text-sm font-medium text-gray-600 mb-1">AI Analysis</div>
            <div className="text-sm text-gray-800">{typeData.reasoning}</div>
          </div>
        </div>

        {Math.abs(typeData.suggestedPrice - basePrice) > 0.001 && (
          <Button 
            onClick={() => applyPricingRecommendation(type)}
            disabled={isUpdating || typeData.confidence < 0.7}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isUpdating ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Applying AI Pricing...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Apply {type.charAt(0).toUpperCase() + type.slice(1)} AI Recommendation
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          AgentKit AI Pricing
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Zap className="w-3 h-3 mr-1" />
            Multi-Tier Pricing
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered dynamic pricing for General, VIP, and Premium tickets based on popularity and demand
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-purple-600">Analyzing market conditions...</span>
          </div>
        ) : recommendation?.ticketTypes ? (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                {getTicketTypeIcon('general')}
                General
              </TabsTrigger>
              <TabsTrigger value="vip" className="flex items-center gap-2">
                {getTicketTypeIcon('vip')}
                VIP
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-2">
                {getTicketTypeIcon('premium')}
                Premium
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-4">
              {renderTicketTypeCard('general')}
            </TabsContent>
            
            <TabsContent value="vip" className="mt-4">
              {renderTicketTypeCard('vip')}
            </TabsContent>
            
            <TabsContent value="premium" className="mt-4">
              {renderTicketTypeCard('premium')}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No pricing data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentKitPricingDashboard;
