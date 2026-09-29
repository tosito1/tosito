using UnityEngine;
using MafiaTycoon.Core;
using MafiaTycoon.Data;
using TMPro;
using UnityEngine.UI;

namespace MafiaTycoon.UI
{
    public class QuestUIController : MonoBehaviour
    {
        [Header("UI References")]
        public GameObject questItemPrefab;
        public Transform contentParent;

        private void Start()
        {
            InvokeRepeating(nameof(RefreshUI), 1f, 3f);
        }

        public void RefreshUI()
        {
            if (GameManager.Instance == null) return;

            foreach (Transform child in contentParent) Destroy(child.gameObject);

            foreach (var questSave in GameManager.Instance.data.activeQuests)
            {
                // We need the template from QuestManager
                QuestData template = QuestManager.Instance.allQuestTemplates.Find(q => q.questID == questSave.questID);
                if (template == null) continue;

                GameObject go = Instantiate(questItemPrefab, contentParent);
                QuestUIItem item = go.GetComponent<QuestUIItem>();
                if (item != null) item.Setup(template, questSave);
            }
        }
    }

    public class QuestUIItem : MonoBehaviour
    {
        public TextMeshProUGUI titleText;
        public TextMeshProUGUI progressText;
        public Image progressBar;
        public Button claimButton;
        public TextMeshProUGUI rewardText;

        public void Setup(QuestData template, QuestSaveData saveData)
        {
            titleText.text = template.questName;
            rewardText.text = $"Reward: ${template.moneyReward:N0}";
            
            float progress = (float)(saveData.currentAmount / template.objective.targetAmount);
            progressBar.fillAmount = Mathf.Clamp01(progress);
            progressText.text = $"{saveData.currentAmount:F0} / {template.objective.targetAmount:F0}";

            bool isDone = saveData.isCompleted && !saveData.isRewardClaimed;
            claimButton.gameObject.SetActive(isDone);
            claimButton.onClick.AddListener(() => {
                QuestManager.Instance.ClaimRewards(saveData, template);
                Setup(template, saveData);
            });

            if (saveData.isRewardClaimed)
            {
                progressText.text = "<color=green>COMPLETED</color>";
            }
        }
    }
}
