using System;

namespace MafiaTycoon.Data
{
    [Serializable]
    public class QuestSaveData
    {
        public string questID;
        public double currentAmount;
        public bool isCompleted;
        public bool isRewardClaimed;

        public QuestSaveData(string questID)
        {
            this.questID = questID;
            this.currentAmount = 0;
            this.isCompleted = false;
            this.isRewardClaimed = false;
        }
    }
}
