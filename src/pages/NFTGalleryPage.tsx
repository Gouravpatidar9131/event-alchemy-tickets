
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, ExternalLink, RefreshCw } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';
import NFTCard from '@/components/NFTCard';
import { toast } from 'sonner';

const NFTGalleryPage = () => {
  const { user } = useAuth();
  const [nfts, setNfts] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserNFTs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          events (
            title,
            date,
            location,
            image_url
          )
        `)
        .eq('attendee_id', user.id)
        .not('nft_status', 'is', null)
        .order('nft_minted_at', { ascending: false });

      if (error) throw error;

      setNfts(data || []);
    } catch (error: any) {
      console.error('Error fetching NFTs:', error);
      toast('Failed to load NFT collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Please sign in to view your NFT collection.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Your NFT Collection
            </h1>
            <p className="text-muted-foreground mt-2">
              Event attendance NFTs you've earned by participating in events
            </p>
          </div>
          <Button 
            onClick={fetchUserNFTs} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your NFT collection...</span>
        </div>
      ) : nfts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No NFTs Yet</CardTitle>
            <CardDescription>
              Start attending events to earn exclusive attendance NFTs!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/events">
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse Events
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((attendance) => (
            <NFTCard
              key={attendance.id}
              attendance={attendance}
            />
          ))}
        </div>
      )}

      {nfts.length > 0 && (
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="py-6">
              <h3 className="font-semibold text-lg mb-2">🎉 Congratulations!</h3>
              <p className="text-muted-foreground">
                You have {nfts.filter(n => n.nft_status === 'minted').length} minted NFTs in your collection.
                Each NFT represents your unique participation in an event and can be traded on OpenSea.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NFTGalleryPage;
