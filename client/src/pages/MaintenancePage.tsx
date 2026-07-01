// pages/MaintenancePage.jsx
import { AlertTriangle } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-lg mx-auto">
        <div className="animate-bounce">
          <AlertTriangle className="w-20 h-20 text-yellow-500 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Under Maintenance</h1>
        <p className="text-xl text-muted-foreground">
          We're currently performing scheduled maintenance to improve your experience. 
          We'll be back shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          Thank you for your patience!
        </p>
        <div className="animate-pulse mt-8">
          <div className="w-48 h-2 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}