import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/layout/header";

type User = {
 id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
};

export default function AccountDetails() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("/api/auth/user", "GET");
     const data = await res.json();
  // console.log("me data:", data);
      return data;
    },
});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <p className="text-destructive">Failed to load account details</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!user || Object.keys(user).length === 0) {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-muted-foreground">No account found</p>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="container mx-auto px-4 py-8">

         <div className="bg-muted text-center py-4 mb-8">
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    <Link href="/orders" className="text-primary hover:underline">Orders</Link>
                    <span className="text-primary">Entries</span>
                    <span className="text-primary">RingTone Points</span>
                    <span className="text-primary">Referral Scheme</span>
                    <span className="text-primary font-bold">Wallet</span>
                    <span className="text-primary">Address</span>
                    <Link href="/account" className="text-primary hover:underline">Account details</Link>
                    <a href="/api/logout" className="text-primary hover:underline">Log out</a>
                  </div>
                </div>
      <Card className="w-full  max-w-4xl mx-auto max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="block text-sm text-muted-foreground">Name</Label>
            <p className="text-lg font-medium">{user.firstName || "N/A"}</p>
          </div>
          <div>
            <Label className="block text-sm text-muted-foreground">Email</Label>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="block text-sm text-muted-foreground">
              Account Created
            </Label>
            <p className="text-lg font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <Label className="block text-sm text-muted-foreground">
              Last Updated
            </Label>
            <p className="text-lg font-medium">
              {new Date(user.updatedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="pt-4 flex justify-between">
            <Button variant="outline">Edit Profile</Button>
            <Button variant="default" className="bg-yellow-600 hover:bg-yellow-700">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
    </div>
  );
}
