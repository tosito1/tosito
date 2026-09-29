using UnityEngine;
using System.Collections.Generic;

namespace MafiaTycoon.Data
{
    public enum QuestType
    {
        Main,
        Daily
    }

    public enum QuestObjectiveType
    {
        EarnMoney,
        UpgradeBusiness,
        ConquerZone,
        RecruitCrew,
        ReachPlayerLevel
    }

    [System.Serializable]
    public class QuestObjective
    {
        public QuestObjectiveType type;
        public double targetAmount;
        public string targetID; // Optional: ID for specific business or zone
    }

    [CreateAssetMenu(fileName = "NewQuest", menuName = "MafiaTycoon/Quest Data", order = 9)]
    public class QuestData : ScriptableObject
    {
        [Header("Identity")]
        public string questID;
        public string questName;
        [TextArea] public string description;
        public QuestType type;

        [Header("Objective")]
        public QuestObjective objective;

        [Header("Rewards")]
        public double moneyReward;
        public int xpReward;
        public string itemRewardID;
    }
}
