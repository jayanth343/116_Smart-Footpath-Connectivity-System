import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzewknbjgdixejqxyhph.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch all footpaths with their images and join with authorities
export async function fetchFootpathsWithIssues() {
  try {
    // Start with authorities table to get all individual issues
    const { data: authorities, error: authoritiesError } = await supabase
      .from('authorities')
      .select('*');

    if (authoritiesError) throw authoritiesError;

    // Get footpaths for the FIDs that exist in authorities
    const authorityFids = authorities?.map(auth => auth.fid) || [];
    
    const { data: footpaths, error: footpathError } = await supabase
      .from('location-footpath')
      .select('*')
      .in('fid', authorityFids);

    if (footpathError) throw footpathError;

    // Create a lookup map for footpaths by FID
    const footpathsByFid = {};
    footpaths?.forEach(fp => {
      const fidKey = String(fp.fid);
      if (!footpathsByFid[fidKey]) footpathsByFid[fidKey] = [];
      footpathsByFid[fidKey].push(fp);
    });

    // Build combined array - one entry per authority issue (not per FID)
    const combined = authorities
      .filter(authority => footpathsByFid[String(authority.fid)]) // Only include if footpath exists
      .map(authority => {
        const footpathEntries = footpathsByFid[String(authority.fid)];
        const firstFootpath = footpathEntries[0] || {};
        
        return {
          id: authority.issue_id || authority.fid, // Use issue_id as unique identifier, fallback to fid
          fid: authority.fid,
          issue_id: authority.issue_id,
          title: `Issue ${authority.issue_id || authority.fid} - Footpath ${authority.fid}`,
          description: `${authority.issue || 'Issue'} on footpath segment ${authority.fid}`,
          
          // Images with null safety - get all images for this FID
          images: footpathEntries.map(fp => ({
            image_link: fp.image_link || null,
            created_at: fp.created_at || 'N/A'
          })),
          
          // Location data from footpath
          latitude: firstFootpath.latitude || 0,
          longitude: firstFootpath.longitude || 0,
          latitude_end: firstFootpath.latitude_end || 0,
          longitude_end: firstFootpath.longitude_end || 0,
          coordinates: {
            lat: firstFootpath.latitude || 0,
            lng: firstFootpath.longitude || 0
          },
          location: `${firstFootpath.latitude || 0}, ${firstFootpath.longitude || 0}`,
          
          // Scoring from footpath
          score: firstFootpath.score !== null && firstFootpath.score !== undefined ? firstFootpath.score : 'N/A',
          user_rating: firstFootpath.user_rating !== null && firstFootpath.user_rating !== undefined ? firstFootpath.user_rating : 'N/A',
          priority: firstFootpath.score !== null && firstFootpath.score !== undefined 
            ? (firstFootpath.score < 30 ? 'High' : firstFootpath.score < 60 ? 'Medium' : 'Low') 
            : 'Unknown',
          
          // Authority data - this specific issue
          authorities: [authority],
          status: authority.status || 'Open',
          authority_tagged: authority.authority_tagged || 'N/A',
          issue: authority.issue || 'N/A',
          classification: 'N/A',
          category: 'N/A',
          severity: 'N/A',
          
          // Dates
          date_reported: authority.created_at || 'N/A',
          date_created: firstFootpath.created_at || 'N/A'
        };
      });

    return combined;
  } catch (error) {
    console.error('Error fetching footpath data:', error);
    return [];
  }
}

// Example: fetch dashboard stats
export async function fetchDashboardStats() {
  try {
    // Get unique footpaths by fid
    const { data: footpathData } = await supabase
      .from('location-footpath')
      .select('fid, score, user_rating');

    // Group by fid to get unique footpaths
    const uniqueFootpaths = {};
    footpathData?.forEach(fp => {
      if (!uniqueFootpaths[fp.fid]) {
        uniqueFootpaths[fp.fid] = fp;
      }
    });

    const totalFootpaths = Object.keys(uniqueFootpaths).length;

    // Total issues - count all authority records (individual issues)
    const { data: authoritiesData } = await supabase
      .from('authorities')
      .select('*');

    const totalIssues = authoritiesData?.length || 0;

    // Average AI score from unique footpaths
    const footpathEntries = Object.values(uniqueFootpaths);
    const validScores = footpathEntries.filter(fp => fp.score !== null && fp.score !== undefined);
    const avgScore = validScores.length > 0
      ? (validScores.reduce((sum, fp) => sum + fp.score, 0) / validScores.length).toFixed(2)
      : 'N/A';

    // Average user rating from unique footpaths
    const validRatings = footpathEntries.filter(fp => fp.user_rating !== null && fp.user_rating !== undefined);
    const avgRating = validRatings.length > 0
      ? (validRatings.reduce((sum, fp) => sum + fp.user_rating, 0) / validRatings.length).toFixed(2)
      : 'N/A';

    return {
      totalFootpaths,
      totalIssues: totalIssues || 0,
      avgScore,
      avgRating
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalFootpaths: 0,
      totalIssues: 0,
      avgScore: 'N/A',
      avgRating: 'N/A'
    };
  }
}

// Update status for an authority/issue
export async function updateIssueStatus(issueId, newStatus) {
  try {
    const { data, error } = await supabase
      .from('authorities')
      .update({ status: newStatus })
      .eq('issue_id', issueId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
}