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
import ErrorBoundary from "@/components/error-boundary";

export default function NotFound() {
  const router = useRouter();

  return (
    <ErrorBoundary>
      <div className="min-h-[calc(100vh-200px)] px-4 flex items-center justify-center">
        <Card className="w-full max-w-md animate-scaleIn border-muted-foreground/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-muted rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Page Not Found</CardTitle>
            <CardDescription className="text-muted-foreground text-lg mt-2">
              We couldn't find the page you were looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4 text-muted-foreground">
              <p>
                The page you requested may have been moved, deleted, or might never have existed.
              </p>
              <p>
                Check the URL for any typos or errors, or use the button below to return to the previous page.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pb-6">
            <Button 
              onClick={() => router.back()}
              className="w-full" 
              variant="default"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ErrorBoundary>
  );
} 