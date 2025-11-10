import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';

const MyListings = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Listings</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Your listings will appear here...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyListings;

