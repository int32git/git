'use client';

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AssetsNotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center py-10">
      <Card className="w-full max-w-md border-muted-foreground/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-muted rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Resource Not Found</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            This asset management resource doesn't exist
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4 text-muted-foreground">
            <p>
              The asset management feature you're looking for may be under development or not available in your current plan.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pb-6">
          <Button 
            onClick={() => router.back()}
            className="w-full" 
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/dashboard/assets">
              Return to Asset Management
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 