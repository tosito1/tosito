using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using System;

namespace MafiaTycoon.Core
{
    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        [Header("Master Mission List")]
        public List<MissionData> allMissionConfigs;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            InvokeRepeating(nameof(CheckActiveMissions), 2f, 10f);
        }

        public void StartMission(string missionID, string characterID)
        {
            if (GameManager.Instance == null) return;

            // Simple check: character cannot be on two missions (optional logic)
            if (GameManager.Instance.data.activeMissions.Exists(m => m.assignedCharacterID == characterID && !m.isCompleted))
            {
                Debug.LogWarning($"Character {characterID} is already on a mission!");
                return;
            }

            MissionSaveData newMission = new MissionSaveData(missionID, characterID);
            GameManager.Instance.data.activeMissions.Add(newMission);
            
            Debug.Log($"<color=cyan>Mission Started: {missionID} with character {characterID}</color>");
        }

        private void CheckActiveMissions()
        {
            if (GameManager.Instance == null) return;

            var activeMissions = GameManager.Instance.data.activeMissions;
            for (int i = activeMissions.Count - 1; i >= 0; i--)
            {
                var missionSave = activeMissions[i];
                if (missionSave.isCompleted) continue;

                MissionData config = allMissionConfigs.Find(m => m.missionID == missionSave.missionID);
                if (config == null) continue;

                DateTime startTime = DateTime.Parse(missionSave.startTime);
                double elapsedSeconds = (DateTime.UtcNow - startTime).TotalSeconds;

                if (elapsedSeconds >= config.durationSeconds)
                {
                    CompleteMission(missionSave, config);
                }
            }
        }

        private void CompleteMission(MissionSaveData saveData, MissionData config)
        {
            saveData.isCompleted = true;

            // Find character to calculate success rate
            var character = CrewManager.Instance.activeCrew.Find(c => c.runtimeData.id == saveData.assignedCharacterID);
            if (character == null) return;

            float characterPower = character.GetCurrentAttack(); // Simplification: using Attack as power
            float successChance = Mathf.Clamp(characterPower / config.difficultyPower, 0.1f, 1.0f);

            bool success = UnityEngine.Random.value <= successChance;

            if (success)
            {
                Debug.Log($"<color=green>Mission Success: {config.missionName}!</color>");
                GameManager.Instance.AddMoney(config.moneyReward);
                character.AddExperience(config.xpReward);
                
                // Optional Item Reward
                if (config.itemReward != null)
                {
                    InventoryManager.Instance.AddItem(config.itemReward.itemID);
                }
            }
            else
            {
                Debug.Log($"<color=red>Mission Failed: {config.missionName}.</color>");
                character.AddExperience(config.xpReward / 2); // Consolation XP
            }

            // Cleanup: or keep for history? Let's remove from active for simplicity
            GameManager.Instance.data.activeMissions.Remove(saveData);
        }
    }
}
