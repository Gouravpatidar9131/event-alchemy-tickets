
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserNFTs, UserNFT } from '@/hooks/useUserNFTs';

const UserNFTCollection = () => {
  const { data: userNFTs, isLoading, error } = useUserNFTs();

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'minted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'minting':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'minted':
        return 'bg-green-100 text-green-800';
      case 'minting':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getOpenSeaUrl = (nft: UserNFT) => {
    if (!nft.nft_mint_address) return null;
    // Default to Base chain for OpenSea URLs
    return `https://opensea.io/assets/base/${nft.nft_mint_address}`;
  };

  const handleViewMetadata = (metadataUri: string) => {
    window.open(metadataUri, '_blank');
  };

  const handleSendToOpenSea = (nft: UserNFT) => {
    const openSeaUrl = getOpenSeaUrl(nft);
    if (openSeaUrl) {
      window.open(openSeaUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading your NFT collection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading NFTs: {error.message}</p>
      </div>
    );
  }

  if (!userNFTs || userNFTs.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
        <p className="text-muted-foreground">
          Attend events to collect exclusive NFT badges!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Your NFT Collection</h3>
        <Badge variant="outline" className="bg-solana-gradient text-white">
          {userNFTs.filter(nft => nft.nft_status === 'minted').length} Minted
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userNFTs.map((nft) => (
          <Card key={nft.id} className="border-l-4 border-l-solana-purple">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-solana-purple" />
                  {nft.event_title}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(nft.nft_status)} flex items-center gap-1`}
                >
                  {getStatusIcon(nft.nft_status)}
                  {nft.nft_status === 'minted' ? 'Minted' : 
                   nft.nft_status === 'minting' ? 'Minting...' : 
                   nft.nft_status === 'failed' ? 'Failed' : 'Pending'}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(nft.event_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nft.nft_status === 'minted' && nft.nft_mint_address && (
                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="font-mono break-all text-gray-600">
                      {nft.nft_mint_address}
                    </p>
                  </div>
                  
                  {nft.nft_minted_at && (
                    <p className="text-xs text-muted-foreground">
                      Minted on {new Date(nft.nft_minted_at).toLocaleDateString()}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {nft.nft_metadata_uri && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleViewMetadata(nft.nft_metadata_uri!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Metadata
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-solana-gradient hover:opacity-90 text-white"
                      onClick={() => handleSendToOpenSea(nft)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      OpenSea
                    </Button>
                  </div>
                </div>
              )}
              
              {nft.nft_status === 'pending' && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    NFT minting will begin automatically
                  </p>
                </div>
              )}
              
              {nft.nft_status === 'minting' && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Your NFT is being minted...
                  </p>
                </div>
              )}
              
              {nft.nft_status === 'failed' && (
                <div className="text-center py-2">
                  <p className="text-xs text-red-600">
                    Minting failed. Please contact support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserNFTCollection;
