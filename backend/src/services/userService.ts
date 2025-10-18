// File: backend/src/services/userService.ts
import { query } from '../db.js';
// This function is now correctly exported at the top level
export const calculatePopularityScore = (
  user: any,
  allUsers: any[],
  allFriendships: any[]
) => {
  // 1. Find all this user's friendships
  const userFriendships = allFriendships.filter(
    (f) => f.user_id_a === user.id || f.user_id_b === user.id
  );

  // 2. Get the unique IDs of all friends
  const friendIds = userFriendships.map((f) =>
    f.user_id_a === user.id ? f.user_id_b : f.user_id_a
  );
  const uniqueFriendCount = new Set(friendIds).size; // Part 1 of formula

  let totalSharedHobbies = 0;

  // 3. Loop through friends to calculate shared hobbies
  for (const friendId of friendIds) {
    const friend = allUsers.find((u) => u.id === friendId);
    if (friend && user.hobbies && friend.hobbies) {
      // Find hobbies shared between user and friend
      const shared = user.hobbies.filter((h: string) =>
        friend.hobbies.includes(h)
      );
      totalSharedHobbies += shared.length;
    }
  }

  // 4. Apply the formula: unique friends + (total hobbies shared * 0.5)
  const score = uniqueFriendCount + totalSharedHobbies * 0.5;

  return Math.round(score * 10) / 10; // Round to one decimal place
};

// ... (keep calculatePopularityScore function above) ...

/**
 * Gets a simple array of friend IDs for a given user.
 */
export const getFriendsForUser = async (userId: string): Promise<string[]> => {
  const sql = `
    SELECT user_id_a, user_id_b FROM friendships
    WHERE user_id_a = $1 OR user_id_b = $1;
  `;
  const result = await query(sql, [userId]);

  // Map the results to just the *other* user's ID
  const friendIds = result.rows.map((row) =>
    row.user_id_a === userId ? row.user_id_b : row.user_id_a
  );

  return friendIds;
};


// ... (keep calculatePopularityScore and getFriendsForUser functions above) ...

/**
 * Fetches all data and calculates the popularity score for a single user.
 * This is more efficient for single user endpoints.
 */
export const calculateScoreForUser = async (userId: string): Promise<number> => {
  // 1. Get the user's own hobbies
  const userResult = await query('SELECT hobbies FROM users WHERE id = $1', [userId]);
  if (!userResult.rowCount) return 0; // User not found, score is 0
  const userHobbies: string[] = userResult.rows[0].hobbies || [];

  // 2. Get all friend IDs for this user
  const friendIds = await getFriendsForUser(userId);
  const uniqueFriendCount = friendIds.length; // Already unique

  if (uniqueFriendCount === 0) {
    return 0; // No friends, score is 0
  }

  // 3. Fetch the hobbies for ALL friends in a single query
  const friendsHobbiesSql = `
    SELECT hobbies FROM users
    WHERE id = ANY($1::uuid[]);
  `;
  const friendsHobbiesResult = await query(friendsHobbiesSql, [friendIds]);
  const friendsHobbiesList: string[][] = friendsHobbiesResult.rows.map(
    (row) => row.hobbies || []
  );

  // 4. Calculate total shared hobbies
  let totalSharedHobbies = 0;
  if (userHobbies.length > 0) {
    for (const friendHobbies of friendsHobbiesList) {
      const shared = userHobbies.filter((h) => friendHobbies.includes(h));
      totalSharedHobbies += shared.length;
    }
  }

  // 5. Apply the formula
  const score = uniqueFriendCount + totalSharedHobbies * 0.5;
  return Math.round(score * 10) / 10; // Round to one decimal place
};