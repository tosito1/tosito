using System.Collections.Generic;
using UnityEngine;
using MafiaTycoon.Data;
using MafiaTycoon.Gameplay;
using System.Linq;

namespace MafiaTycoon.Core
{
    public class QuestManager : MonoBehaviour
    {
        public static QuestManager Instance { get; private set; }

        [Header("Mission Templates")]
        public List<QuestData> allQuestTemplates;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            // Subscribe to game events
            GameManager.OnMoneyEarned += HandleMoneyEarned;
            BusinessController.OnBusinessUpgraded += HandleBusinessUpgraded;
            ZoneManager.OnZoneConquered += HandleZoneConquered;
            CrewManager.OnCharacterRecruited += HandleCharacterRecruited;
            PlayerLevelManager.OnPlayerLevelUp += HandleLevelUp;
        }

        private void OnDisable()
        {
            // Unsubscribe
            GameManager.OnMoneyEarned -= HandleMoneyEarned;
            BusinessController.OnBusinessUpgraded -= HandleBusinessUpgraded;
            ZoneManager.OnZoneConquered -= HandleZoneConquered;
            CrewManager.OnCharacterRecruited -= HandleCharacterRecruited;
            PlayerLevelManager.OnPlayerLevelUp -= HandleLevelUp;
        }

        private void Start()
        {
            CheckDailyReset();
        }

        private void CheckDailyReset()
        {
            // Logic for refreshing dailies based on last login time
            // TODO: Implement daily refresh
        }

        private void HandleMoneyEarned(double amount) => UpdateProgress(QuestObjectiveType.EarnMoney, amount);
        private void HandleBusinessUpgraded() => UpdateProgress(QuestObjectiveType.UpgradeBusiness, 1);
        private void HandleZoneConquered() => UpdateProgress(QuestObjectiveType.ConquerZone, 1);
        private void HandleCharacterRecruited() => UpdateProgress(QuestObjectiveType.RecruitCrew, 1);
        private void HandleLevelUp(int level) => UpdateProgress(QuestObjectiveType.ReachPlayerLevel, level, true);

        private void UpdateProgress(QuestObjectiveType type, double amount, bool isAbsolute = false)
        {
            if (GameManager.Instance == null) return;

            foreach (var questSave in GameManager.Instance.data.activeQuests)
            {
                if (questSave.isCompleted) continue;

                QuestData template = allQuestTemplates.Find(q => q.questID == questSave.questID);
                if (template == null || template.objective.type != type) continue;

                if (isAbsolute)
                {
                    questSave.currentAmount = amount;
                }
                else
                {
                    questSave.currentAmount += amount;
                }

                if (questSave.currentAmount >= template.objective.targetAmount)
                {
                    CompleteQuest(questSave, template);
                }
            }
        }

        private void CompleteQuest(QuestSaveData save, QuestData template)
        {
            save.isCompleted = true;
            Debug.Log($"<color=green>[QUEST] Mission Completed: {template.questName}!</color>");
            
            // Auto-claim rewards for now, or wait for UI click
            ClaimRewards(save, template);
        }

        public void ClaimRewards(QuestSaveData save, QuestData template)
        {
            if (save.isRewardClaimed) return;

            save.isRewardClaimed = true;
            
            if (template.moneyReward > 0) GameManager.Instance.AddMoney(template.moneyReward);
            if (template.xpReward > 0) PlayerLevelManager.Instance.AddExp(template.xpReward);
            
            if (!string.IsNullOrEmpty(template.itemRewardID))
            {
                InventoryManager.Instance.AddItem(template.itemRewardID);
            }

            GameManager.Instance.SaveGame();
            Debug.Log($"[QUEST] Rewards claimed for {template.questName}");
        }

        public void AddQuest(string questID)
        {
            if (GameManager.Instance.data.activeQuests.Exists(q => q.questID == questID)) return;
            
            GameManager.Instance.data.activeQuests.Add(new QuestSaveData(questID));
            Debug.Log($"[QUEST] New Quest Active: {questID}");
        }
    }
}
