import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreateListing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Housing Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Listing creation form coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateListing;

