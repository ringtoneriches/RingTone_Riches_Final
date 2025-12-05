import { NextFunction } from "express";
import { storage } from "./storage";

export const isNotRestricted = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ADD DEBUG LOGGING
    console.log("isNotRestricted middleware - User check:");
    console.log("- User ID:", userId);
    console.log("- User email:", user.email);
    console.log("- User isRestricted:", user.isRestricted);
    console.log("- Full user object:", JSON.stringify(user, null, 2));

    if (user.isRestricted) {
      console.log("User is restricted! Blocking request.");
      return res.status(403).json({ 
        message: "Your account is restricted from performing this action",
        code: "ACCOUNT_RESTRICTED",
        restrictedAt: user.restrictedAt || null,
      });
    }

    console.log("User is not restricted. Allowing request.");
    next();
  } catch (error) {
    console.error("Error in isNotRestricted middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};