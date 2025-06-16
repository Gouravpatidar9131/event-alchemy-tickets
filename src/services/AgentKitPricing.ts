
import { supabase } from '@/integrations/supabase/client';

interface PricingFactors {
  basePrice: number;
  currentTicketsSold: number;
  totalTickets: number;
  timeToEvent: number; // hours
  eventPopularity: number; // 0-1 scale
  marketDemand: number; // 0-1 scale
}

interface PricingRecommendation {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class AgentKitPricingService {
  private static instance: AgentKitPricingService;
  
  static getInstance(): AgentKitPricingService {
    if (!AgentKitPricingService.instance) {
      AgentKitPricingService.instance = new AgentKitPricingService();
    }
    return AgentKitPricingService.instance;
  }

  async calculateDynamicPricing(eventId: string): Promise<PricingRecommendation> {
    try {
      console.log('AgentKit: Calculating dynamic pricing for event', eventId);
      
      // Fetch event data
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        throw new Error('Event not found');
      }

      // Fetch ticket sales data
      const { data: tickets } = await supabase
        .from('tickets')
        .select('purchase_date, purchase_price')
        .eq('event_id', eventId);

      const factors = this.analyzePricingFactors(event, tickets || []);
      const recommendation = this.generatePricingRecommendation(factors);
      
      console.log('AgentKit: Pricing recommendation generated', recommendation);
      return recommendation;
    } catch (error) {
      console.error('AgentKit: Pricing calculation failed', error);
      throw error;
    }
  }

  private analyzePricingFactors(event: any, tickets: any[]): PricingFactors {
    const now = new Date();
    const eventDate = new Date(event.date);
    const timeToEvent = Math.max(0, (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    // Calculate demand metrics
    const soldPercentage = (event.tickets_sold || 0) / event.total_tickets;
    const recentSales = tickets.filter(t => {
      const saleDate = new Date(t.purchase_date);
      const daysSinceSale = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSale <= 7; // Sales in last 7 days
    }).length;

    return {
      basePrice: event.price,
      currentTicketsSold: event.tickets_sold || 0,
      totalTickets: event.total_tickets,
      timeToEvent,
      eventPopularity: Math.min(1, recentSales / 10), // Normalize recent sales
      marketDemand: soldPercentage,
    };
  }

  private generatePricingRecommendation(factors: PricingFactors): PricingRecommendation {
    let priceMultiplier = 1.0;
    let confidence = 0.8;
    let reasoning = 'Standard pricing';
    let demandLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    // Time-based pricing (urgency factor)
    if (factors.timeToEvent < 24) {
      priceMultiplier *= 1.5; // 50% increase for last-minute sales
      reasoning = 'Last-minute urgency pricing';
      demandLevel = 'critical';
    } else if (factors.timeToEvent < 168) { // 1 week
      priceMultiplier *= 1.2; // 20% increase for near-term events
      reasoning = 'Near-term event premium';
      demandLevel = 'high';
    }

    // Demand-based pricing (scarcity factor)
    const soldPercentage = factors.currentTicketsSold / factors.totalTickets;
    if (soldPercentage > 0.8) {
      priceMultiplier *= 1.8; // 80% increase when 80%+ sold
      reasoning = 'High demand - limited availability';
      demandLevel = 'critical';
      confidence = 0.95;
    } else if (soldPercentage > 0.6) {
      priceMultiplier *= 1.4; // 40% increase when 60%+ sold
      reasoning = 'Rising demand detected';
      demandLevel = 'high';
      confidence = 0.9;
    } else if (soldPercentage > 0.3) {
      priceMultiplier *= 1.1; // 10% increase when 30%+ sold
      reasoning = 'Steady demand';
      demandLevel = 'medium';
    } else {
      priceMultiplier *= 0.9; // 10% decrease for low demand
      reasoning = 'Low demand - promotional pricing';
      demandLevel = 'low';
      confidence = 0.7;
    }

    // Popularity factor
    if (factors.eventPopularity > 0.7) {
      priceMultiplier *= 1.3; // 30% increase for popular events
      reasoning += ' + high popularity bonus';
      confidence = Math.min(0.98, confidence + 0.1);
    }

    const suggestedPrice = Math.max(0, factors.basePrice * priceMultiplier);

    return {
      suggestedPrice: parseFloat(suggestedPrice.toFixed(4)),
      confidence,
      reasoning,
      demandLevel,
    };
  }

  async updateEventPricing(eventId: string): Promise<void> {
    try {
      const recommendation = await this.calculateDynamicPricing(eventId);
      
      // Only update if confidence is high and price change is significant
      if (recommendation.confidence > 0.8) {
        const { error } = await supabase
          .from('events')
          .update({ 
            price: recommendation.suggestedPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);

        if (error) throw error;
        
        console.log('AgentKit: Event pricing updated automatically', {
          eventId,
          newPrice: recommendation.suggestedPrice,
          reasoning: recommendation.reasoning
        });
      }
    } catch (error) {
      console.error('AgentKit: Auto pricing update failed', error);
    }
  }
}

export const agentKitPricing = AgentKitPricingService.getInstance();
