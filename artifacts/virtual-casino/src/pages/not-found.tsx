import { Link } from "wouter";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      <Crown className="w-12 h-12 text-primary mx-auto" />
      <div>
        <div className="font-serif text-6xl casino-gradient-text mb-2">404</div>
        <p className="text-muted-foreground">
          That table doesn't exist. Maybe try one of ours.
        </p>
      </div>
      <Link href="/">
        <Button className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground">
          Back to the Lobby
        </Button>
      </Link>
    </div>
  );
}
