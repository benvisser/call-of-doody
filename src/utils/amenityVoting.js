// src/utils/amenityVoting.js
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AMENITY_THRESHOLDS } from '../constants/amenities';

/**
 * Get the status of an amenity based on vote counts
 */
export const getAmenityStatus = (confirmVotes, denyVotes) => {
  const total = confirmVotes + denyVotes;

  // Not enough votes yet
  if (total < AMENITY_THRESHOLDS.MIN_VOTES_REQUIRED) {
    return 'unverified';
  }

  const percentage = (confirmVotes / total) * 100;

  // Strong confirmation
  if (percentage >= AMENITY_THRESHOLDS.CONFIRM_PERCENTAGE) {
    return 'confirmed';
  }

  // Strong denial
  if (percentage < AMENITY_THRESHOLDS.REMOVE_PERCENTAGE) {
    return 'removed';
  }

  // In-between, unclear
  return 'disputed';
};

/**
 * Vote on an amenity (confirm or deny)
 */
export const voteOnAmenity = async (restroomId, amenityId, userId, vote) => {
  try {
    // 1. Check if user already voted
    const voteRef = doc(db, 'amenity_votes', `${restroomId}_${userId}_${amenityId}`);
    const existingVote = await getDoc(voteRef);

    if (existingVote.exists()) {
      throw new Error('You have already voted on this amenity');
    }

    // 2. Record individual vote
    await setDoc(voteRef, {
      restroomId,
      userId,
      amenityId,
      vote, // 'confirm' or 'deny'
      timestamp: new Date(),
    });

    // 3. Update restroom amenity counts
    const restroomRef = doc(db, 'restrooms', restroomId);
    const restroomDoc = await getDoc(restroomRef);

    if (!restroomDoc.exists()) {
      throw new Error('Restroom not found');
    }

    const restroomData = restroomDoc.data();
    const amenities = restroomData.amenities || {};

    // Initialize amenity data if doesn't exist
    if (!amenities[amenityId]) {
      amenities[amenityId] = {
        votes: 0,
        confirmVotes: 0,
        denyVotes: 0,
        percentage: 0,
        status: 'unverified',
        lastUpdated: new Date(),
      };
    }

    const amenityData = amenities[amenityId];

    // Update vote counts
    amenityData.votes += 1;
    if (vote === 'confirm') {
      amenityData.confirmVotes += 1;
    } else {
      amenityData.denyVotes += 1;
    }

    // Calculate percentage and status
    const percentage = (amenityData.confirmVotes / amenityData.votes) * 100;
    amenityData.percentage = Math.round(percentage);
    amenityData.status = getAmenityStatus(
      amenityData.confirmVotes,
      amenityData.denyVotes
    );
    amenityData.lastUpdated = new Date();

    // Update confirmed amenities list
    const confirmedAmenities = Object.keys(amenities).filter(
      key => amenities[key].status === 'confirmed'
    );

    // 4. Save to Firestore
    await updateDoc(restroomRef, {
      amenities,
      confirmedAmenities,
      updatedAt: new Date(),
    });

    return {
      success: true,
      amenityData,
    };

  } catch (error) {
    console.error('Error voting on amenity:', error);
    throw error;
  }
};

/**
 * Check if a user has already voted on an amenity
 */
export const hasUserVoted = async (restroomId, amenityId, userId) => {
  try {
    const voteRef = doc(db, 'amenity_votes', `${restroomId}_${userId}_${amenityId}`);
    const voteDoc = await getDoc(voteRef);
    return voteDoc.exists();
  } catch (error) {
    console.error('Error checking vote:', error);
    return false;
  }
};

/**
 * Initialize amenities structure for a new restroom submission
 */
export const initializeRestroomAmenities = (selectedAmenityIds) => {
  const amenities = {};

  selectedAmenityIds.forEach(amenityId => {
    amenities[amenityId] = {
      votes: 1, // Submitter's implicit vote
      confirmVotes: 1,
      denyVotes: 0,
      percentage: 100,
      status: 'unverified', // Will become confirmed after 5 total votes
      lastUpdated: new Date(),
    };
  });

  return {
    amenities,
    confirmedAmenities: [], // Empty until community verifies
  };
};

/**
 * Convert old amenities array format to new voting structure
 */
export const convertLegacyAmenities = (amenityIds) => {
  const amenities = {};

  amenityIds.forEach(amenityId => {
    amenities[amenityId] = {
      votes: 0,
      confirmVotes: 0,
      denyVotes: 0,
      percentage: 0,
      status: 'unverified',
      lastUpdated: new Date(),
    };
  });

  return amenities;
};
