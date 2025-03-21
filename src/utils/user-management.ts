import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import logger from './logger';
import { sanitizeString } from './validation';

/**
 * Result type for profile creation operations
 */
interface ProfileResult {
  success: boolean;
  data?: any;
  error?: any;
  isNew: boolean;
}

/**
 * Creates a user profile in the database after successful registration
 * @param userId The ID of the user to create a profile for
 * @param email The email of the user
 * @param fullName Optional full name of the user
 * @returns The result of the profile creation operation
 */
export async function createUserProfile(userId: string, email: string, fullName?: string): Promise<ProfileResult> {
  try {
    // Input validation - could use zod but simple checks here
    if (!userId || !userId.trim()) {
      return { success: false, error: 'Invalid user ID', isNew: false };
    }
    
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address', isNew: false };
    }
    
    // Sanitize inputs to prevent injection
    const sanitizedUserId = sanitizeString(userId);
    const sanitizedEmail = sanitizeString(email);
    const sanitizedFullName = fullName ? sanitizeString(fullName) : null;
    
    const supabase = createServerComponentClient<Database>({ cookies });
    
    logger.info(`Creating user profile`, { 
      meta: { 
        userId: sanitizedUserId, 
        hasFullName: !!sanitizedFullName 
      } 
    });
    
    // First, check if profile already exists to avoid duplicates
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sanitizedUserId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      logger.error('Error checking for existing profile', fetchError, {
        meta: { userId: sanitizedUserId }
      });
      return { success: false, error: fetchError, isNew: false };
    }
    
    if (existingProfile) {
      logger.info('Profile already exists, skipping creation', { 
        meta: { userId: sanitizedUserId } 
      });
      return { success: true, data: existingProfile, isNew: false };
    }
    
    // Generate default name from email if not provided
    const defaultName = sanitizedFullName || email.split('@')[0];
    
    // Insert new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: sanitizedUserId,
        full_name: defaultName,
        email: sanitizedEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating user profile', error, {
        meta: { userId: sanitizedUserId }
      });
      return { success: false, error, isNew: false };
    }
    
    logger.info('User profile created successfully', { 
      meta: { userId: sanitizedUserId } 
    });
    
    // Create default organization for user
    try {
      await createUserOrganization(sanitizedUserId, `${data.full_name}'s Organization`);
    } catch (orgError) {
      // Log but don't fail if org creation fails
      logger.warn('Error creating default organization', { 
        meta: { 
          userId: sanitizedUserId, 
          error: orgError 
        } 
      });
    }
    
    return { success: true, data, isNew: true };
  } catch (error) {
    logger.error('Unexpected error in createUserProfile', error, {
      meta: { userId }
    });
    return { success: false, error, isNew: false };
  }
}

/**
 * Creates a default organization for a user
 * @param userId The ID of the user who owns the organization
 * @param name The name of the organization
 * @returns The result of the organization creation operation
 */
async function createUserOrganization(userId: string, name: string): Promise<ProfileResult> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Sanitize inputs
    const sanitizedUserId = sanitizeString(userId);
    const sanitizedName = sanitizeString(name);
    
    // Check if user already has an organization
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', sanitizedUserId)
      .limit(1);
    
    if (fetchError) {
      logger.error('Error checking for existing organization', fetchError, {
        meta: { userId: sanitizedUserId }
      });
      return { success: false, error: fetchError, isNew: false };
    }
    
    if (existingOrg && existingOrg.length > 0) {
      logger.info('User already has an organization, skipping creation', {
        meta: { userId: sanitizedUserId }
      });
      return { success: true, data: existingOrg[0], isNew: false };
    }
    
    // Create new organization
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: sanitizedName,
        owner_id: sanitizedUserId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating organization', error, {
        meta: { userId: sanitizedUserId }
      });
      return { success: false, error, isNew: false };
    }
    
    logger.info('Organization created successfully', {
      meta: { userId: sanitizedUserId, orgId: data.id }
    });
    
    return { success: true, data, isNew: true };
  } catch (error) {
    logger.error('Error in createUserOrganization', error, {
      meta: { userId }
    });
    return { success: false, error, isNew: false };
  }
} 