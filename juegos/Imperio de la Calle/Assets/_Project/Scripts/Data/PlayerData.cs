using System;
using System.Collections.Generic;

namespace MafiaTycoon.Data
{
    [Serializable]
    public class PlayerData
    {
        // Economic data
        public double money;
        public double incomePerSecond;
        public int reputation;
        public double influencePoints;
        public int timesPrestiged;
        
        // Progression
        public int playerLevel;
        public int playerExp;
        public List<string> unlockedBusinesses;
        public List<BusinessSaveData> businesses;
        public List<CharacterSaveData> crew;
        public List<ZoneSaveData> zones;
        public List<ItemSaveData> inventory;
        public List<MissionSaveData> activeMissions;
        public List<QuestSaveData> activeQuests;
        
        // Time tracking for offline progress
        public string lastSaveTime;

        public PlayerData()
        {
            money = 0;
            incomePerSecond = 0;
            reputation = 0;
            playerLevel = 1;
            unlockedBusinesses = new List<string>();
            businesses = new List<BusinessSaveData>();
            crew = new List<CharacterSaveData>();
            zones = new List<ZoneSaveData>();
            inventory = new List<ItemSaveData>();
            activeMissions = new List<MissionSaveData>();
            activeQuests = new List<QuestSaveData>();
            lastSaveTime = DateTime.UtcNow.ToString("o"); // ISO 8601
        }
    }
}
