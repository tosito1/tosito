using UnityEngine;

namespace MafiaTycoon.Data
{
    [CreateAssetMenu(fileName = "NewMission", menuName = "MafiaTycoon/Mission Data", order = 7)]
    public class MissionData : ScriptableObject
    {
        [Header("Identity")]
        public string missionID;
        public string missionName;
        [TextArea] public string description;

        [Header("Requirements")]
        public int requiredLevel = 1;
        public float difficultyPower = 50f; // Comparison vs character Attack/Defense

        [Header("Settings")]
        public float durationSeconds = 60f;

        [Header("Rewards")]
        public double moneyReward = 1000;
        public int xpReward = 100;
        public ItemData itemReward; // Optional guaranteed item
    }

    [System.Serializable]
    public class MissionSaveData
    {
        public string missionID;
        public string assignedCharacterID;
        public string startTime; // DateTime string ISO 8601
        public bool isCompleted;

        public MissionSaveData(string missionID, string characterID)
        {
            this.missionID = missionID;
            this.assignedCharacterID = characterID;
            this.startTime = System.DateTime.UtcNow.ToString("o");
            this.isCompleted = false;
        }
    }
}
