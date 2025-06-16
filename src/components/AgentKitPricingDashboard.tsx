
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Bot, Zap } from 'lucide-react';
import { agentKitPricing } from '@/services/AgentKitPricing';
import { useToast } from '@/components/ui/use-toast';

interface PricingDashboardProps {
  eventId: string;
  currentPrice: number;
  onPriceUpdate?: (newPrice: number) => void;
}

interface PricingRecommendation {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
}

const AgentKitPricingDashboard = ({ eventId, currentPrice, onPriceUpdate }: PricingDashboardProps) => {
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
      console.log('AgentKit: Pricing recommendation fetched', rec);
    } catch (error) {
      console.error('AgentKit: Failed to fetch pricing recommendation', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPricingRecommendation = async () => {
    if (!recommendation) return;
    
    setIsUpdating(true);
    try {
      await agentKitPricing.updateEventPricing(eventId);
      onPriceUpdate?.(recommendation.suggestedPrice);
      toast({
        title: 'AgentKit Pricing Applied',
        description: `Price updated to ${recommendation.suggestedPrice} ETH based on AI analysis`,
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

  const getPriceTrend = () => {
    if (!recommendation) return null;
    const change = recommendation.suggestedPrice - currentPrice;
    const percentage = ((change / currentPrice) * 100).toFixed(1);
    return { change, percentage };
  };

  const trend = getPriceTrend();

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          AgentKit AI Pricing
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Zap className="w-3 h-3 mr-1" />
            Auto-Optimized
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered dynamic pricing based on real-time demand analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-purple-600">Analyzing market conditions...</span>
          </div>
        ) : recommendation ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Current Price</div>
                <div className="text-2xl font-bold">{currentPrice} ETH</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">AI Recommended Price</div>
                <div className="text-2xl font-bold text-purple-600">
                  {recommendation.suggestedPrice} ETH
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
                <Badge className={getDemandBadgeColor(recommendation.demandLevel)}>
                  {recommendation.demandLevel.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Confidence</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${recommendation.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{(recommendation.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm font-medium text-gray-600 mb-1">AI Analysis</div>
                <div className="text-sm text-gray-800">{recommendation.reasoning}</div>
              </div>
            </div>

            {Math.abs(recommendation.suggestedPrice - currentPrice) > 0.001 && (
              <Button 
                onClick={applyPricingRecommendation}
                disabled={isUpdating || recommendation.confidence < 0.7}
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
                    Apply AI Recommendation
                  </>
                )}
              </Button>
            )}
          </>
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
