import { z } from 'zod';

// Password validation schema
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(64, { message: 'Password must not exceed 64 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string().optional(),
}).refine(
  data => !data.confirmPassword || data.password === data.confirmPassword, 
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Email validation schema
export const emailSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .max(254, { message: 'Email must not exceed 254 characters' })
});

// User profile validation schema
export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' })
    .regex(/^[a-zA-Z\s\-'.]+$/, { message: 'Full name contains invalid characters' })
    .optional(),
  email: emailSchema.shape.email,
  id: z.string().uuid({ message: 'Invalid user ID format' })
});

// Organization validation schema
export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Organization name must be at least 2 characters' })
    .max(100, { message: 'Organization name must not exceed 100 characters' })
    .regex(/^[a-zA-Z0-9\s\-'.&]+$/, { message: 'Organization name contains invalid characters' }),
  owner_id: z.string().uuid({ message: 'Invalid owner ID format' })
});

// Generic ID validation
export const idSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' })
});

// Helper function to validate data with specific schema
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: boolean; data?: z.infer<T>; error?: { message: string; details?: Record<string, string> } } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errorDetails[err.path.join('.')] = err.message;
        }
      });
      
      return { 
        success: false, 
        error: { 
          message: 'Validation failed', 
          details: errorDetails 
        } 
      };
    }
    
    return { 
      success: false, 
      error: { 
        message: 'Unknown validation error occurred'
      } 
    };
  }
}

// Helper function to sanitize strings to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helper to sanitize an object recursively (for request bodies)
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as T;
  
  Object.keys(result).forEach(key => {
    const value = result[key as keyof T];
    
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  });
  
  return result;
} 