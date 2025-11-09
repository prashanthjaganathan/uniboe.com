import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';

const ListingDetail = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Listing details coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingDetail;

