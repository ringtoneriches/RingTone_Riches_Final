import { NextFunction, Request, Response } from "express";
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

    if (user.isRestricted) {
      return res.status(403).json({ 
        message: "Your account is restricted from performing this action",
        code: "ACCOUNT_RESTRICTED",
        restrictedAt: user.restrictedAt || null,
      });
    }

    next();
  } catch (error) {
    console.error("Error in isNotRestricted middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};