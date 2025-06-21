
import { supabase } from '@/integrations/supabase/client';

interface PricingFactors {
  basePrice: number;
  currentTicketsSold: number;
  totalTickets: number;
  timeToEvent: number; // hours
  eventPopularity: number; // 0-1 scale
  marketDemand: number; // 0-1 scale
  ticketType: 'general' | 'vip' | 'premium';
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

export class AgentKitPricingService {
  private static instance: AgentKitPricingService;
  
  // Popularity multipliers for different ticket types
  private readonly TICKET_TYPE_MULTIPLIERS = {
    general: 1.0,
    vip: 2.5,
    premium: 4.0
  };

  // Base popularity scores for ticket types (simulated based on typical demand patterns)
  private readonly TICKET_TYPE_POPULARITY = {
    general: 0.8, // High popularity for general admission
    vip: 0.6,     // Medium popularity for VIP
    premium: 0.3  // Lower popularity but higher value for premium
  };
  
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

      const baseFactors = this.analyzePricingFactors(event, tickets || []);
      
      // Generate pricing for all ticket types
      const ticketTypes: TicketTypePricing = {
        general: this.generateTicketTypePricing({ ...baseFactors, ticketType: 'general' }),
        vip: this.generateTicketTypePricing({ ...baseFactors, ticketType: 'vip' }),
        premium: this.generateTicketTypePricing({ ...baseFactors, ticketType: 'premium' })
      };

      // Main recommendation is based on general admission
      const mainRecommendation = ticketTypes.general;
      
      console.log('AgentKit: Multi-tier pricing recommendation generated', ticketTypes);
      return {
        ...mainRecommendation,
        ticketTypes
      };
    } catch (error) {
      console.error('AgentKit: Pricing calculation failed', error);
      throw error;
    }
  }

  private analyzePricingFactors(event: any, tickets: any[]): Omit<PricingFactors, 'ticketType'> {
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

  private generateTicketTypePricing(factors: PricingFactors): {
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
    demandLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const ticketTypeMultiplier = this.TICKET_TYPE_MULTIPLIERS[factors.ticketType];
    const ticketTypePopularity = this.TICKET_TYPE_POPULARITY[factors.ticketType];
    
    let priceMultiplier = ticketTypeMultiplier;
    let confidence = 0.8;
    let reasoning = `${factors.ticketType.charAt(0).toUpperCase() + factors.ticketType.slice(1)} admission pricing`;
    let demandLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    // Time-based pricing (urgency factor)
    if (factors.timeToEvent < 24) {
      priceMultiplier *= 1.5; // 50% increase for last-minute sales
      reasoning += ' with last-minute urgency premium';
      demandLevel = 'critical';
    } else if (factors.timeToEvent < 168) { // 1 week
      priceMultiplier *= 1.2; // 20% increase for near-term events
      reasoning += ' with near-term event premium';
      demandLevel = 'high';
    }

    // Demand-based pricing (scarcity factor)
    const soldPercentage = factors.currentTicketsSold / factors.totalTickets;
    if (soldPercentage > 0.8) {
      priceMultiplier *= 1.8; // 80% increase when 80%+ sold
      reasoning += ' + high demand scarcity pricing';
      demandLevel = 'critical';
      confidence = 0.95;
    } else if (soldPercentage > 0.6) {
      priceMultiplier *= 1.4; // 40% increase when 60%+ sold
      reasoning += ' + rising demand detected';
      demandLevel = 'high';
      confidence = 0.9;
    } else if (soldPercentage > 0.3) {
      priceMultiplier *= 1.1; // 10% increase when 30%+ sold
      reasoning += ' + steady demand';
      demandLevel = 'medium';
    } else {
      // For premium tickets, don't discount as much even with low demand
      const discountFactor = factors.ticketType === 'premium' ? 0.95 : 0.9;
      priceMultiplier *= discountFactor;
      reasoning += ' + promotional pricing for low demand';
      demandLevel = 'low';
      confidence = 0.7;
    }

    // Ticket type popularity factor
    const popularityMultiplier = 1 + (ticketTypePopularity * 0.3); // Up to 30% increase based on popularity
    priceMultiplier *= popularityMultiplier;

    // Calculate suggested price
    const calculatedPrice = factors.basePrice * priceMultiplier;
    
    // Ensure minimum price is respected (organizer's base price for general, scaled for other types)
    const minimumPrice = factors.basePrice * ticketTypeMultiplier;
    const suggestedPrice = Math.max(minimumPrice, calculatedPrice);

    // Adjust reasoning if minimum price was applied
    if (suggestedPrice === minimumPrice && calculatedPrice < minimumPrice) {
      reasoning += ' (adjusted to respect minimum price)';
      confidence = Math.max(0.6, confidence - 0.1);
    }

    return {
      suggestedPrice: parseFloat(suggestedPrice.toFixed(4)),
      confidence,
      reasoning,
      demandLevel,
    };
  }

  async updateEventPricing(eventId: string, ticketType: 'general' | 'vip' | 'premium' = 'general'): Promise<void> {
    try {
      const recommendation = await this.calculateDynamicPricing(eventId);
      
      let priceToUpdate: number;
      let confidenceThreshold = 0.8;
      
      if (ticketType === 'general') {
        priceToUpdate = recommendation.suggestedPrice;
      } else {
        priceToUpdate = recommendation.ticketTypes?.[ticketType]?.suggestedPrice || recommendation.suggestedPrice;
        confidenceThreshold = recommendation.ticketTypes?.[ticketType]?.confidence || recommendation.confidence;
      }
      
      // Only update if confidence is high and price change is significant
      if (confidenceThreshold > 0.8) {
        const { error } = await supabase
          .from('events')
          .update({ 
            price: priceToUpdate,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);

        if (error) throw error;
        
        console.log('AgentKit: Event pricing updated automatically', {
          eventId,
          ticketType,
          newPrice: priceToUpdate,
          reasoning: recommendation.ticketTypes?.[ticketType]?.reasoning || recommendation.reasoning
        });
      }
    } catch (error) {
      console.error('AgentKit: Auto pricing update failed', error);
    }
  }
}

export const agentKitPricing = AgentKitPricingService.getInstance();
