
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';
import { useNFTCollections } from '@/hooks/useNFTCollections';

interface NFTAttendanceBadgeProps {
  attendance: AttendanceRecord;
  eventNftEnabled?: boolean;
}

const NFTAttendanceBadge = ({ attendance, eventNftEnabled = false }: NFTAttendanceBadgeProps) => {
  const [selectedChain, setSelectedChain] = useState('base');
  const { mintAttendanceNFTMutation } = useNFTCollections();

  if (!eventNftEnabled) {
    return null;
  }

  const getStatusIcon = () => {
    switch (attendance.nft_status) {
      case 'minted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'minting':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (attendance.nft_status) {
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

  const getStatusText = () => {
    switch (attendance.nft_status) {
      case 'minted':
        return 'NFT Minted';
      case 'minting':
        return 'Minting...';
      case 'failed':
        return 'Minting Failed';
      default:
        return 'Ready to Mint';
    }
  };

  const handleMintNFT = () => {
    mintAttendanceNFTMutation.mutate({
      attendanceId: attendance.id,
      chain: selectedChain
    });
  };

  const getOpenSeaUrl = () => {
    if (!attendance.nft_mint_address) return null;
    
    const chainMappings = {
      ethereum: 'ethereum',
      polygon: 'matic',
      base: 'base'
    };
    
    const chain = selectedChain as keyof typeof chainMappings;
    const chainSlug = chainMappings[chain] || 'ethereum';
    return `https://opensea.io/assets/${chainSlug}/${attendance.nft_mint_address}`;
  };

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Attendance NFT
        </CardTitle>
        <CardDescription className="text-xs">
          Commemorative NFT for event attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`${getStatusColor()} flex items-center gap-1`}>
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
          {attendance.nft_minted_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(attendance.nft_minted_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {attendance.nft_status === 'minted' && attendance.nft_mint_address && (
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded text-xs">
              <p className="font-mono break-all">{attendance.nft_mint_address}</p>
            </div>
            <div className="flex gap-2">
              {attendance.nft_metadata_uri && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => window.open(attendance.nft_metadata_uri!, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Metadata
                </Button>
              )}
              {getOpenSeaUrl() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => window.open(getOpenSeaUrl()!, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  OpenSea
                </Button>
              )}
            </div>
          </div>
        )}

        {attendance.nft_status === 'pending' && (
          <div className="space-y-2">
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleMintNFT}
              disabled={mintAttendanceNFTMutation.isPending}
              className="w-full text-xs"
            >
              {mintAttendanceNFTMutation.isPending ? (
                <>
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mint NFT
                </>
              )}
            </Button>
          </div>
        )}

        {attendance.nft_status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMintNFT}
            disabled={mintAttendanceNFTMutation.isPending}
            className="w-full text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Retry Minting
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NFTAttendanceBadge;
