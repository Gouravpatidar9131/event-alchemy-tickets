
import { CalendarCheck, Ticket, Wallet, QrCode, Award } from 'lucide-react';

const features = [
  {
    icon: <Wallet className="h-10 w-10 text-solana-purple" />,
    title: 'Connect Wallet',
    description: 'Connect your Solana wallet to browse, purchase, and manage your NFT tickets.',
  },
  {
    icon: <Ticket className="h-10 w-10 text-solana-blue" />,
    title: 'Get NFT Tickets',
    description: 'Purchase tickets as dynamic NFTs that live in your wallet and evolve over time.',
  },
  {
    icon: <QrCode className="h-10 w-10 text-solana-green" />,
    title: 'Attend Events',
    description: 'Check in using the QR code in your NFT ticket to verify ownership on-chain.',
  },
  {
    icon: <Award className="h-10 w-10 text-solana-purple" />,
    title: 'Earn Rewards',
    description: 'Collect and earn special perks based on your attendance and interaction history.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 relative">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-solana-purple/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-solana-blue/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How BlockTix Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience a new era of event ticketing with dynamic NFTs that evolve throughout your event journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="glass-card p-6 rounded-xl text-center transition-all duration-300 hover:translate-y-[-5px]"
            >
              <div className="mb-6 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
