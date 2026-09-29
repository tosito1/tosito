import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';

const NAMESPACE = 'saludtracker_app';

export const saveQuestionnaireEntry = async (answers, score, expectancy) => {
  if (!auth.currentUser) return;
  try {
    const colRef = collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/questionnaires`);
    await addDoc(colRef, {
      date: new Date().toISOString(),
      answers,
      healthScore: score,
      lifeExpectancy: expectancy
    });
    publishFeedEvent('questionnaire_done', { score });
  } catch (error) {
    console.error("Error saving questionnaire history:", error);
  }
};

export const getUserData = async () => {
  if (!auth.currentUser) return { habits: {}, healthScore: 0, lifeExpectancy: 0, history: [] };

  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.gamification) {
        data.gamification = { xp: 0, level: 1, streak: 0, lastLogin: null, badges: [] };
      }
      return data;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
  return { habits: {}, healthScore: 0, lifeExpectancy: 0, history: [] };
};

export const saveUserData = async (data) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    await setDoc(docRef, data, { merge: true });

    if (data.healthScore !== undefined) {
      const leaderRef = doc(db, `${NAMESPACE}/data/leaderboard`, auth.currentUser.uid);
      await setDoc(leaderRef, {
        name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        score: data.healthScore,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

export const saveHistoryRecord = async (score, expectancy) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    let history = [];
    if (docSnap.exists() && docSnap.data().history) {
      history = docSnap.data().history;
    }

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = history.findIndex(h => h.date === today);

    if (existingIndex >= 0) {
      history[existingIndex] = { date: today, healthScore: score };
    } else {
      history.push({ date: today, healthScore: score });
    }

    if (history.length > 14) history = history.slice(-14);

    await updateDoc(docRef, { history });
  } catch (error) {
    console.error("Error saving history:", error);
  }
};

// --- NEW HABITS LOGIC ---

export const getDailyHabits = async (dateStr) => {
  if (!auth.currentUser) return {};
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`, dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().habits || {};
  } catch (error) {
    console.error("Error fetching daily habits:", error);
  }
  return {};
};

export const saveDailyHabits = async (dateStr, habits) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`, dateStr);
    await setDoc(docRef, { habits, date: dateStr }, { merge: true });
  } catch (error) {
    console.error("Error saving daily habits:", error);
  }
};

export const getWeeklyHabits = async () => {
  if (!auth.currentUser) return [];
  try {
    const colRef = collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`);
    const q = query(colRef, orderBy('date', 'desc'), limit(7));
    const snap = await getDocs(q);
    const data = [];
    snap.forEach(doc => data.push(doc.data()));
    return data.reverse();
  } catch (e) {
    console.error("Error fetching weekly habits", e);
    return [];
  }
};

export const getLeaderboard = async () => {
  try {
    const leaderRef = collection(db, `${NAMESPACE}/data/leaderboard`);
    const q = query(leaderRef, orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

export const getUserStats = async () => {
  if (!auth.currentUser) return { totalQuestionnaires: 0, totalDaysLogged: 0 };
  try {
    const qSnap = await getDocs(collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/questionnaires`));
    const hSnap = await getDocs(collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`));

    return {
      totalQuestionnaires: qSnap.size,
      totalDaysLogged: hSnap.size
    };
  } catch (e) {
    console.error("Error fetching stats:", e);
    return { totalQuestionnaires: 0, totalDaysLogged: 0 };
  }
};

export const wipeUserData = async () => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    // Soft delete: keep data but mark as deleted and hide from public
    await updateDoc(doc(db, `${NAMESPACE}/data/users`, uid), {
      isDeleted: true,
      publicProfile: false // ensure data is hidden
    });
    // Remove from active leaderboard so they disappear from public view
    await deleteDoc(doc(db, `${NAMESPACE}/data/leaderboard`, uid));
  } catch (e) {
    console.error("Error wiping data:", e);
  }
};

// --- NEW SOCIAL LOGIC ---

export const togglePublicProfile = async (isPublic) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    await updateDoc(docRef, { publicProfile: isPublic });
    const leaderRef = doc(db, `${NAMESPACE}/data/leaderboard`, auth.currentUser.uid);
    await setDoc(leaderRef, { publicProfile: isPublic }, { merge: true });
  } catch (error) {
    console.error("Error toggling public profile:", error);
  }
};

export const followUser = async (friendId) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/following`, friendId);
    await setDoc(docRef, { followedAt: new Date().toISOString() });
  } catch (e) { console.error(e); }
};

export const unfollowUser = async (friendId) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/following`, friendId);
    await deleteDoc(docRef);
  } catch (e) { console.error(e); }
};

export const getFollowingList = async () => {
  if (!auth.currentUser) return [];
  try {
    const snap = await getDocs(collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/following`));
    const list = [];
    snap.forEach(d => list.push(d.id));
    return list;
  } catch (e) { console.error(e); return []; }
};

export const getPublicUserHabits = async (userId) => {
  try {
    const colRef = collection(db, `${NAMESPACE}/data/users/${userId}/daily_habits`);
    const q = query(colRef, orderBy('date', 'desc'), limit(7));
    const snap = await getDocs(q);
    const data = [];
    snap.forEach(doc => data.push(doc.data()));
    return data.reverse();
  } catch (e) { return []; }
};

export const getPublicUserData = async (userId) => {
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data();
  } catch (e) { console.error("Error fetching public user data", e); }
  return null;
};

export const searchUsers = async (searchTerm) => {
  try {
    const leaderRef = collection(db, `${NAMESPACE}/data/leaderboard`);
    const q = query(leaderRef, limit(100)); // Limit to 100 for local filtering prototype
    const snap = await getDocs(q);
    const users = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        users.push({ id: doc.id, ...data });
      }
    });
    return users;
  } catch (e) { return []; }
};

// --- NEW GAMIFICATION LOGIC ---
const DEFAULT_GAMIFICATION = { xp: 0, level: 1, streak: 0, lastLogin: null, badges: [] };

export const awardXP = async (amount, reason) => {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    let data = snap.data();
    let gamification = data.gamification || { ...DEFAULT_GAMIFICATION };

    gamification.xp += amount;

    const newLevel = Math.floor(gamification.xp / 100) + 1;
    let leveledUp = false;
    if (newLevel > gamification.level) {
      gamification.level = newLevel;
      leveledUp = true;
      publishFeedEvent('level_up', { level: newLevel });
    }

    await updateDoc(docRef, { gamification });
    return { leveledUp, newLevel, newXp: gamification.xp, reason, xpAdded: amount };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return null;
  }
};

export const updateDailyStreak = async () => {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    let gamification = snap.data().gamification || { ...DEFAULT_GAMIFICATION };
    const today = new Date().toISOString().split('T')[0];

    if (gamification.lastLogin === today) return gamification;

    if (gamification.lastLogin) {
      const lastDate = new Date(gamification.lastLogin);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        gamification.streak += 1;
        if (gamification.streak > 1 && gamification.streak % 3 === 0) {
          publishFeedEvent('streak_milestone', { streak: gamification.streak });
        }
      } else {
        gamification.streak = 1;
      }
    } else {
      gamification.streak = 1;
    }
    gamification.lastLogin = today;

    await updateDoc(docRef, { gamification });
    return gamification;
  } catch (error) {
    console.error("Error updating streak:", error);
    return null;
  }
};

export const unlockBadge = async (badgeId) => {
  if (!auth.currentUser) return false;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    let gamification = snap.data().gamification || { ...DEFAULT_GAMIFICATION };
    if (!gamification.badges) gamification.badges = [];

    if (!gamification.badges.includes(badgeId)) {
      gamification.badges.push(badgeId);
      await updateDoc(docRef, { gamification });
      publishFeedEvent('badge_unlocked', { badgeName: badgeId });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error unlocking badge:", e);
    return false;
  }
};

// --- NEW GROUPS LOGIC ---
const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const createGroup = async (name) => {
  if (!auth.currentUser) return null;
  try {
    const colRef = collection(db, `${NAMESPACE}/data/groups`);
    const docRef = await addDoc(colRef, {
      name,
      inviteCode: generateInviteCode(),
      createdBy: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      members: [auth.currentUser.uid]
    });
    return docRef.id;
  } catch (e) {
    console.error("Error creating group:", e);
    return null;
  }
};

export const updateGroupRules = async (groupId, rules) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/groups`, groupId);
    await updateDoc(docRef, rules);
  } catch (e) {
    console.error("Error updating group rules:", e);
  }
};

export const joinGroup = async (inviteCode) => {
  if (!auth.currentUser) return { success: false, message: 'No auth' };
  try {
    const colRef = collection(db, `${NAMESPACE}/data/groups`);
    const q = query(colRef, limit(100));
    const snap = await getDocs(q);
    let groupDoc = null;
    snap.forEach(d => {
      if (d.data().inviteCode === inviteCode) groupDoc = d;
    });

    if (!groupDoc) return { success: false, message: 'Código no encontrado' };

    const data = groupDoc.data();
    if (data.members.includes(auth.currentUser.uid)) {
      return { success: false, message: 'Ya eres miembro de este grupo' };
    }

    await updateDoc(groupDoc.ref, {
      members: [...data.members, auth.currentUser.uid]
    });
    return { success: true, groupId: groupDoc.id };
  } catch (e) {
    console.error("Error joining group:", e);
    return { success: false, message: 'Error al unirse' };
  }
};

export const getUserGroups = async () => {
  if (!auth.currentUser) return [];
  try {
    const colRef = collection(db, `${NAMESPACE}/data/groups`);
    const snap = await getDocs(colRef);
    const groups = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.members && data.members.includes(auth.currentUser.uid)) {
        groups.push({ id: doc.id, ...data });
      }
    });
    return groups;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getGroupDetails = async (groupId) => {
  try {
    const docRef = doc(db, `${NAMESPACE}/data/groups`, groupId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const groupData = snap.data();

    const leaderRef = collection(db, `${NAMESPACE}/data/leaderboard`);
    const leaderSnap = await getDocs(leaderRef);
    const members = [];
    leaderSnap.forEach(d => {
      if (groupData.members.includes(d.id)) {
        members.push({ id: d.id, ...d.data() });
      }
    });

    members.sort((a, b) => (a.score || 0) - (b.score || 0));

    const sinsRef = collection(db, `${NAMESPACE}/data/groups/${groupId}/sins`);
    const sinsQ = query(sinsRef, orderBy('createdAt', 'desc'), limit(50));
    const sinsSnap = await getDocs(sinsQ);
    const sins = [];
    sinsSnap.forEach(d => sins.push({ id: d.id, ...d.data() }));

    return { id: snap.id, ...groupData, memberDetails: members, sins };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const logGroupSin = async (sinMessage, habitId = null) => {
  if (!auth.currentUser) return;
  try {
    const groups = await getUserGroups();
    if (groups.length === 0) return;

    const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    const fullMessage = `${userName} ${sinMessage}`;

    for (const g of groups) {
      const sinsRef = collection(db, `${NAMESPACE}/data/groups/${g.id}/sins`);
      await addDoc(sinsRef, {
        message: fullMessage,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid,
        userName: userName,
        habitId: habitId
      });
    }
    publishFeedEvent('sin', { message: sinMessage });
  } catch (e) { console.error(e); }
};

export const removeLastGroupSin = async (habitId) => {
  if (!auth.currentUser) return;
  try {
    const groups = await getUserGroups();
    if (groups.length === 0) return;

    for (const g of groups) {
      const sinsRef = collection(db, `${NAMESPACE}/data/groups/${g.id}/sins`);
      const q = query(sinsRef, orderBy('createdAt', 'desc'), limit(30));
      const snap = await getDocs(q);
      
      const docToDelete = snap.docs.find(d => d.data().userId === auth.currentUser.uid && d.data().habitId === habitId);
      if (docToDelete) {
        await deleteDoc(docToDelete.ref);
      }
    }
  } catch (e) { console.error(e); }
};

// ─── MOOD TRACKER ───────────────────────────────────────────────────────────

export const saveMoodEntry = async (dateStr, mood) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`, dateStr);
    await setDoc(docRef, { mood, date: dateStr }, { merge: true });
  } catch (e) { console.error('Error saving mood:', e); }
};

export const getMoodHistory = async () => {
  if (!auth.currentUser) return [];
  try {
    const colRef = collection(db, `${NAMESPACE}/data/users/${auth.currentUser.uid}/daily_habits`);
    const q = query(colRef, orderBy('date', 'desc'), limit(14));
    const snap = await getDocs(q);
    const data = [];
    snap.forEach(d => {
      const { date, mood } = d.data();
      if (date) data.push({ date, mood: mood || null });
    });
    return data.reverse();
  } catch (e) { console.error('Error fetching mood history:', e); return []; }
};

// ─── ACTIVITY FEED ──────────────────────────────────────────────────────────

export const publishFeedEvent = async (type, payload) => {
  if (!auth.currentUser) return;
  try {
    const groups = await getUserGroups();
    if (groups.length === 0) return;

    const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    const event = {
      type,
      userId: auth.currentUser.uid,
      userName,
      userPhoto: auth.currentUser.photoURL || null,
      payload,
      createdAt: new Date().toISOString(),
    };

    for (const g of groups) {
      const feedRef = collection(db, `${NAMESPACE}/data/groups/${g.id}/feed_events`);
      await addDoc(feedRef, event);
    }
  } catch (e) { console.error('Error publishing feed event:', e); }
};

export const getFeedEvents = async () => {
  if (!auth.currentUser) return [];
  try {
    const groups = await getUserGroups();
    if (groups.length === 0) return [];

    let allEvents = [];
    for (const g of groups) {
      const feedRef = collection(db, `${NAMESPACE}/data/groups/${g.id}/feed_events`);
      const q = query(feedRef, orderBy('createdAt', 'desc'), limit(30));
      const snap = await getDocs(q);
      snap.forEach(d => allEvents.push({ id: d.id, groupName: g.name, ...d.data() }));
    }

    // Deduplicate by id and sort
    const seen = new Set();
    allEvents = allEvents.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    allEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return allEvents.slice(0, 50);
  } catch (e) { console.error('Error fetching feed events:', e); return []; }
};

// ─── CHALLENGES ─────────────────────────────────────────────────────────────

export const createChallenge = async (groupId, { title, description, targetValue, unit, endsAt }) => {
  if (!auth.currentUser) return null;
  try {
    const colRef = collection(db, `${NAMESPACE}/data/groups/${groupId}/challenges`);
    const ref = await addDoc(colRef, {
      title,
      description,
      targetValue: Number(targetValue),
      unit,
      endsAt,
      createdBy: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      participants: [],
    });
    return ref.id;
  } catch (e) { console.error('Error creating challenge:', e); return null; }
};

export const joinChallenge = async (groupId, challengeId, currentProgress = 0) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/groups/${groupId}/challenges`, challengeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const participants = data.participants || [];
    const existingIdx = participants.findIndex(p => p.userId === auth.currentUser.uid);

    const entry = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      progress: currentProgress,
      joinedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      participants[existingIdx] = { ...participants[existingIdx], progress: currentProgress };
    } else {
      participants.push(entry);
      publishFeedEvent('challenge_joined', { challengeTitle: data.title });
    }

    await updateDoc(ref, { participants });
  } catch (e) { console.error('Error joining challenge:', e); }
};

export const getGroupChallenges = async (groupId) => {
  try {
    const colRef = collection(db, `${NAMESPACE}/data/groups/${groupId}/challenges`);
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    const challenges = [];
    snap.forEach(d => challenges.push({ id: d.id, ...d.data() }));
    return challenges;
  } catch (e) { console.error('Error fetching challenges:', e); return []; }
};

export const updateChallengeProgress = async (groupId, challengeId, progress) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/groups/${groupId}/challenges`, challengeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const prevParticipant = (data.participants || []).find(p => p.userId === auth.currentUser.uid);
    const prevProgress = prevParticipant ? prevParticipant.progress : 0;
    
    const participants = (data.participants || []).map(p =>
      p.userId === auth.currentUser.uid ? { ...p, progress } : p
    );
    await updateDoc(ref, { participants });
    
    if (progress >= data.targetValue && prevProgress < data.targetValue) {
      publishFeedEvent('challenge_completed', { challengeTitle: data.title });
    }
  } catch (e) { console.error('Error updating challenge progress:', e); }
};

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────

export const saveNotificationToken = async (token) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    await updateDoc(docRef, { fcmToken: token });
    console.log("Token de notificaciones guardado en Firestore");
  } catch (e) { 
    console.error('Error guardando el token de notificaciones:', e); 
  }
};

// ─── DUELS ──────────────────────────────────────────────────────────────────

export const createDuel = async (groupId, { opponentId, opponentName, type, endsAt, stake }) => {
  if (!auth.currentUser) return null;
  try {
    const challengerName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    const ref = collection(db, `${NAMESPACE}/data/groups/${groupId}/duels`);
    const duelRef = await addDoc(ref, {
      challengerId: auth.currentUser.uid,
      challengerName,
      opponentId,
      opponentName,
      type,
      endsAt,
      stake,
      status: 'pending',
      createdAt: new Date().toISOString(),
      groupId,
    });
    return duelRef.id;
  } catch (e) { console.error('Error creating duel:', e); return null; }
};

export const getUserDuels = async () => {
  if (!auth.currentUser) return [];
  try {
    const groups = await getUserGroups();
    let allDuels = [];
    for (const g of groups) {
      const ref = collection(db, `${NAMESPACE}/data/groups/${g.id}/duels`);
      const q = query(ref, orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data();
        if (data.challengerId === auth.currentUser.uid || data.opponentId === auth.currentUser.uid) {
          allDuels.push({ id: d.id, ...data });
        }
      });
    }
    return allDuels;
  } catch (e) { console.error('Error fetching duels:', e); return []; }
};

export const acceptDuel = async (groupId, duelId) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/groups/${groupId}/duels`, duelId);
    await updateDoc(ref, { status: 'active', acceptedAt: new Date().toISOString() });
  } catch (e) { console.error('Error accepting duel:', e); }
};

export const resolveDuel = async (groupId, duelId, winnerId) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/groups/${groupId}/duels`, duelId);
    await updateDoc(ref, { status: 'completed', winnerId, resolvedAt: new Date().toISOString() });
  } catch (e) { console.error('Error resolving duel:', e); }
};

// ─── FEED REACTIONS ─────────────────────────────────────────────────────────

export const addReaction = async (groupId, eventId, emoji) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/groups/${groupId}/feed_events`, eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const reactions = snap.data().reactions || {};
    const myUid = auth.currentUser.uid;
    // Toggle: if already reacted with this emoji, remove it
    const emojiReacters = reactions[emoji] || [];
    const alreadyReacted = emojiReacters.includes(myUid);
    const updated = alreadyReacted
      ? emojiReacters.filter(uid => uid !== myUid)
      : [...emojiReacters, myUid];
    await updateDoc(ref, { [`reactions.${emoji}`]: updated });
  } catch (e) { console.error('Error adding reaction:', e); }
};

// ─── BAR RADAR ─────────────────────────────────────────────────────────────

export const getNearbyBars = async (lat, lon) => {
  const query = `[out:json];(node["amenity"="bar"](around:50,${lat},${lon});node["amenity"="pub"](around:50,${lat},${lon});node["amenity"="nightclub"](around:50,${lat},${lon}););out body;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.elements || [];
  } catch (e) {
    console.error('Overpass API error:', e);
    return [];
  }
};

export const startBarSession = async (barData) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    await updateDoc(ref, {
      currentBarSession: {
        startTime: new Date().toISOString(),
        barName: barData.tags?.name || 'Bar Canalla',
        barId: barData.id,
        // Save coordinates so the map can mark the bar even after page reload
        lat: barData.lat || null,
        lon: barData.lon || null,
      }
    });
  } catch (e) { console.error('Error starting bar session:', e); }
};

export const getBarSession = async () => {
  if (!auth.currentUser) return null;
  try {
    const ref = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data().currentBarSession || null;
  } catch (e) { console.error('Error getting bar session:', e); }
  return null;
};

export const endBarSession = async (minutesSpent, barName) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, `${NAMESPACE}/data/users`, auth.currentUser.uid);
    
    const penalty = Math.floor(minutesSpent / 10);
    
    // Clear session and update health directly in one transaction?
    // Doing it sequentially is fine
    await updateDoc(ref, { currentBarSession: null });

    if (penalty > 0) {
      const snap = await getDoc(ref);
      const currentHealth = snap.data().healthScore || 70;
      const newHealth = Math.max(0, currentHealth - penalty);
      await saveUserData({ healthScore: newHealth });
      
      const hours = Math.floor(minutesSpent / 60);
      const mins = Math.floor(minutesSpent % 60);
      const timeStr = hours > 0 ? `${hours}h y ${mins}m` : `${mins} minutos`;
      await logGroupSin(`ha estado ${timeStr} en ${barName}. Su hígado pide auxilio.`, 'beer');
    }
  } catch (e) { console.error('Error ending bar session:', e); }
};
