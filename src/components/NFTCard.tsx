
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Image, Calendar, MapPin, Clock, Trophy } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';
import { nftMintingService } from '@/services/NFTMintingService';

interface NFTCardProps {
  attendance: AttendanceRecord;
}

const NFTCard = ({ attendance }: NFTCardProps) => {
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'minted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const openOpenSea = () => {
    if (attendance.nft_mint_address) {
      const url = nftMintingService.getOpenSeaURL(attendance.nft_mint_address);
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Event Attendance NFT
            </CardTitle>
            <CardDescription className="mt-1">
              Minted for attending the event
            </CardDescription>
          </div>
          <Badge className={getStatusColor(attendance.nft_status || 'pending')}>
            {attendance.nft_status || 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* NFT Image */}
        <div className="relative w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg overflow-hidden">
          {attendance.nft_metadata_uri && !imageError ? (
            <img
              src={attendance.nft_metadata_uri}
              alt="NFT Artwork"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-12 w-12 text-white/80" />
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(attendance.checked_in_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(attendance.checked_in_at).toLocaleTimeString()}</span>
            </div>
            {attendance.check_in_location && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{attendance.check_in_location}</span>
              </div>
            )}
          </div>

          {attendance.nft_mint_address && (
            <div className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
              <strong>Mint Address:</strong><br />
              {attendance.nft_mint_address}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {attendance.nft_status === 'minted' && attendance.nft_mint_address && (
            <Button 
              onClick={openOpenSea}
              className="flex items-center gap-2"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              View on OpenSea
            </Button>
          )}
          
          {attendance.nft_metadata_uri && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(attendance.nft_metadata_uri!, '_blank')}
            >
              View Metadata
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTCard;
