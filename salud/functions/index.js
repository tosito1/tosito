const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.notifyNewSin = onDocumentCreated("saludtracker_app/data/groups/{groupId}/sins/{sinId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const sinData = snapshot.data();
  const groupId = event.params.groupId;
  
  // The message already includes the username and the funny text, e.g., "Tosito se está bebiendo hasta el agua..."
  const messageText = sinData.message; 
  const sinnerId = sinData.userId;

  try {
    // 1. Get group members
    const groupDoc = await db.doc(`saludtracker_app/data/groups/${groupId}`).get();
    if (!groupDoc.exists) return;
    
    const groupData = groupDoc.data();
    const members = groupData.members || [];
    
    // 2. Fetch all members' FCM tokens, excluding the sinner (we don't need to notify them of their own sin)
    const tokens = [];
    for (const memberId of members) {
      if (memberId === sinnerId) continue; // Optional: skip notifying the person who sinned

      const userDoc = await db.doc(`saludtracker_app/data/users/${memberId}`).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      console.log("No notification tokens found for group members.");
      return;
    }

    // 3. Send Multicast Message
    const payload = {
      notification: {
        title: "¡Pecado en la pandilla! 😈",
        body: messageText,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`Successfully sent ${response.successCount} messages. Failed: ${response.failureCount}`);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
});
