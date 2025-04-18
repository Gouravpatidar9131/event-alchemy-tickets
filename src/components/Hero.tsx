
import { ArrowRight, Calendar, Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-radial from-solana-purple/20 via-background to-background"></div>
      
      {/* Animated ornaments */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-solana-purple/5 blur-3xl animate-float"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-solana-blue/5 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-4 z-10 pt-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Experience Events with 
              <span className="block text-gradient mt-2">Dynamic NFT Tickets</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              BlockTix revolutionizes event ticketing by turning every ticket into a dynamic NFT on the Solana blockchain that evolves before, during, and after the event.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-solana-gradient hover:opacity-90 text-white px-6 py-6 rounded-lg">
                <Link to="/events">
                  Browse Events <Calendar className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass-button px-6 py-6 rounded-lg">
                <Link to="/dashboard">
                  My Tickets <Ticket className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-solana-purple animate-pulse-slow"></div>
                <div className="w-10 h-10 rounded-full bg-blue-500 animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-10 h-10 rounded-full bg-solana-green animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              </div>
              <p className="ml-4 text-sm text-muted-foreground">Join <span className="font-bold text-white">5,000+</span> users already using BlockTix</p>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-solana-purple/20 to-solana-blue/20 blur-lg animate-glow"></div>
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl ticket-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gradient">Festival XYZ</h3>
                <span className="text-sm text-muted-foreground">ID: #58204</span>
              </div>
              
              <div className="bg-solana-gradient h-0.5 w-full mb-4"></div>
              
              <div className="mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                  alt="Event" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">June 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">Central Park, NYC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Type:</span>
                  <span className="font-medium text-solana-purple">VIP Access</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full glass-button">
                View My NFT Ticket <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="mt-4 text-xs text-center text-muted-foreground">
                Dynamic NFT - Evolves before, during & after the event
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
